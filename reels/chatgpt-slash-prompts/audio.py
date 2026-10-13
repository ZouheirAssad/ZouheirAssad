#!/usr/bin/env python3
"""Synthesize the reel soundtrack: a music bed (tempo from the page FS) plus sound effects
placed at the cue times exported from index.html (render.js cues).

Usage: python3 audio.py cues.json out_dir   (cues.json comes from: node render.js cues cues.json)
Writes out_dir/mix.wav (music + sfx) and out_dir/sfx.wav (sfx only).
"""
import json
import sys
import wave

import numpy as np
import scipy.signal as ss

SR = 48000
rng = np.random.default_rng(11)


# ---------------------------------------------------------------- helpers
def secs(d):
    return np.arange(int(round(d * SR))) / SR


def noise(n):
    return rng.standard_normal(n)


def filt(x, kind, f, order=2):
    nyq = SR / 2
    if kind == 'band':
        b, a = ss.butter(order, [f[0] / nyq, f[1] / nyq], 'band')
    else:
        b, a = ss.butter(order, min(f / nyq, 0.999), kind)
    return ss.lfilter(b, a, x)


def glide(f0, f1, d, tau):
    t = secs(d)
    f = f1 + (f0 - f1) * np.exp(-t / tau)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def sat(x, k=1.5):
    return np.tanh(k * x) / np.tanh(k)


def norm(x, peak=1.0):
    return x / (np.max(np.abs(x)) + 1e-12) * peak


def saw(f, t, ph=0.0):
    return 2 * ((f * t + ph) % 1.0) - 1


def pan_st(x, pan):
    a = (np.asarray(pan, dtype=float) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1) * np.sqrt(2)


def add(buf, sig, t, gain=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i < 0:
        return
    if sig.ndim == 1:
        sig = pan_st(sig, 0.0)
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def stft_mask(x, mask_fn, nper=1024):
    """Apply a time-varying spectral mask: mask_fn(freqs, frame_times) -> (F, T)."""
    f, ts, Z = ss.stft(x, SR, nperseg=nper, noverlap=nper * 3 // 4)
    _, y = ss.istft(Z * mask_fn(f, ts), SR, nperseg=nper, noverlap=nper * 3 // 4)
    y = y[: len(x)]
    return np.pad(y, (0, len(x) - len(y)))


def sweep_bp(x, fc, bw=0.8):
    """Band-pass whose center follows fc (one value per sample), width in octaves."""
    tx = np.arange(len(x)) / SR

    def m(f, ts):
        c = np.log2(np.interp(ts, tx, fc))[None, :]
        return np.exp(-0.5 * ((np.log2(np.maximum(f, 20.0))[:, None] - c) / bw) ** 2)
    return stft_mask(x, m)


# ---------------------------------------------------------------- sound effects
def sfx_whoosh(d=0.4, f0=280, f1=3400, f2=900, bw=0.85):
    tail = 0.25
    n = int((d + tail) * SR)
    t = np.arange(n) / SR
    pk = 0.7 * d
    fc = np.where(t < pk, f0 * (f1 / f0) ** (t / pk),
                  f1 * (f2 / f1) ** np.clip((t - pk) / (d + tail - pk), 0, 1))
    y = sweep_bp(noise(n), fc, bw)
    env = np.where(t < pk, (t / pk) ** 2.2, np.exp(-(t - pk) / 0.08))
    return pan_st(norm(y * env), np.linspace(-0.6, 0.6, n))


def sfx_riser(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    p = t / d
    nz = sweep_bp(noise(n), 300 * (9000 / 300) ** p, 1.1)
    f = 160 * (1500 / 160) ** (p ** 1.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph + 0.3) + 0.2 * np.sin(3.01 * ph)
    trem = 0.65 + 0.35 * np.sin(2 * np.pi * np.cumsum(4 + 22 * p ** 2) / SR)
    y = (norm(nz) * 0.7 + norm(tone) * 0.35 * trem) * p ** 2.2
    k = int(0.004 * SR)
    y[-k:] *= np.linspace(1, 0, k)
    return pan_st(norm(y), 0.15 * np.sin(2 * np.pi * 3 * t))


def sfx_reverse(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    nz = filt(noise(n), 'high', 4500) + 0.5 * filt(noise(n), 'band', (2500, 9000))
    y = norm(nz * np.exp((t - d) / 0.12))
    k = int(0.003 * SR)
    y[-k:] *= np.linspace(1, 0, k)
    return y


def sfx_boom():
    d = 1.8
    t = secs(d)
    sub = glide(120, 36, d, 0.10) * np.exp(-t / 0.55)
    body = glide(260, 70, d, 0.025) * np.exp(-t / 0.07) * 0.7
    crack = norm(filt(noise(len(t)), 'band', (900, 6000))) * np.exp(-t / 0.018)
    rumble = norm(filt(noise(len(t)), 'low', 180)) * np.exp(-t / 0.7)
    return norm(sat(sub + body + crack * 0.5 + rumble * 0.35, 1.6))


def sfx_hit():
    d = 0.9
    t = secs(d)
    sub = glide(160, 48, d, 0.05) * np.exp(-t / 0.22)
    snap = norm(filt(noise(len(t)), 'band', (1200, 7000))) * np.exp(-t / 0.025)
    return norm(sat(sub + snap * 0.45, 1.4))


def sfx_pop(f=600):
    t = secs(0.16)
    y = glide(f * 2.3, f, 0.16, 0.012) * np.exp(-t / 0.05)
    y += norm(filt(noise(len(t)), 'high', 3000)) * np.exp(-t / 0.003) * 0.25
    return norm(y)


def sfx_click():
    t = secs(0.08)
    a = norm(filt(noise(len(t)), 'band', (1800, 8000))) * np.exp(-t / 0.002)
    b = np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.005)
    c = glide(320, 130, 0.08, 0.012) * np.exp(-t / 0.014)
    return norm(a * 0.8 + b * 0.35 + c * 0.6)


def sfx_tick(f=1000):
    t = secs(0.14)
    return norm((np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.025))


def key_click():
    t = secs(0.05)
    a = norm(filt(noise(len(t)), 'band', (1500, 6500))) * np.exp(-t / 0.004)
    b = glide(260, 140, 0.05, 0.01) * np.exp(-t / 0.01)
    return norm(a * 0.8 + b * 0.35)


def sfx_type(d):
    n = int((d + 0.1) * SR)
    y = np.zeros(n)
    tc = 0.0
    while tc < d:
        k = key_click()
        i = int(tc * SR)
        j = min(n, i + len(k))
        y[i:j] += k[: j - i] * (0.55 + 0.45 * rng.random())
        tc += 0.04 + rng.random() * 0.045
    return norm(y)


def bell(f, d=1.5):
    t = secs(d)
    parts = [(1.0, 1.0, 0.9), (2.0, 0.45, 0.45), (2.76, 0.3, 0.3), (5.4, 0.14, 0.14), (8.93, 0.07, 0.07)]
    y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / dec) for r, a, dec in parts)
    return y * (1 - np.exp(-t / 0.0015))


def sfx_ding():
    n = int(1.7 * SR)
    y = np.zeros(n)
    a = bell(1318.5)
    y[: len(a)] += a * 0.6
    b = bell(1975.5)
    i = int(0.075 * SR)
    y[i:i + len(b)] += b[: n - i] * 0.5
    return norm(y)


def sfx_shimmer(d=0.5):
    n = int((d + 0.35) * SR)
    out = np.zeros((n, 2))
    for _ in range(18):
        t0 = rng.random() * d
        f = 2600 + rng.random() * 5200
        tt = secs(0.3)
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.045) * (0.3 + 0.7 * rng.random())
        add(out, pan_st(s, rng.uniform(-0.85, 0.85)), t0)
    return out / (np.max(np.abs(out)) + 1e-9)


def sfx_glitch(d):
    n = int(d * SR)
    y = np.zeros(n)
    i = 0
    while i < n:
        L = int((0.012 + rng.random() * 0.035) * SR)
        ts = np.arange(L) / SR
        kind = rng.integers(0, 4)
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * rng.uniform(90, 1900) * ts)) * 0.5
        elif kind == 1:
            h = int(rng.integers(6, 50))
            s = np.repeat(noise(L // h + 1), h)[:L] * 0.6
        elif kind == 2:
            s = np.sin(2 * np.pi * rng.uniform(2000, 6000) * ts) * 0.4
        else:
            s = np.zeros(L)
        j = min(n, i + L)
        y[i:j] += s[: j - i]
        i += L
    return norm(filt(y, 'high', 120))


def sfx_buzz(d):
    t = secs(d + 0.05)
    s = (np.sign(np.sin(2 * np.pi * 110 * t)) + np.sign(np.sin(2 * np.pi * 116.5 * t))
         + 0.5 * np.sign(np.sin(2 * np.pi * 55 * t)))
    env = np.minimum(1, t / 0.005) * np.clip((d + 0.05 - t) / 0.05, 0, 1)
    return norm(filt(s, 'low', 2000) * env)


def sfx_scan(d):
    t = secs(d)
    f = 900 * (2600 / 900) ** (t / d)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 26 * t)))
    env = np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05)
    return norm(s * env)


def sfx_stamp():
    t = secs(0.7)
    y = glide(150, 55, 0.7, 0.03) * np.exp(-t / 0.12)
    y += norm(filt(noise(len(t)), 'band', (250, 3500))) * np.exp(-t / 0.03) * 0.9
    return norm(sat(y, 1.5))


# name -> (generator, level, reverb send, random pan spread)
SFX = {
    'boom':    (lambda o: sfx_boom(), 0.95, 0.25, 0.0),
    'hit':     (lambda o: sfx_hit(), 0.75, 0.20, 0.0),
    'whoosh':  (lambda o: sfx_whoosh(o.get('d', 0.4)), 0.50, 0.25, 0.0),
    'swoosh':  (lambda o: sfx_whoosh(0.22, 700, 5200, 1600, 0.7), 0.45, 0.20, 0.0),
    'swipe':   (lambda o: sfx_whoosh(0.13, 1800, 7500, 3200, 0.55), 0.30, 0.15, 0.0),
    'riser':   (lambda o: sfx_riser(o.get('d', 0.5)), 0.38, 0.20, 0.0),
    'reverse': (lambda o: sfx_reverse(o.get('d', 0.4)), 0.40, 0.20, 0.0),
    'pop':     (lambda o: sfx_pop(o.get('f', 600)), 0.38, 0.15, 0.35),
    'click':   (lambda o: sfx_click(), 0.55, 0.08, 0.0),
    'tick':    (lambda o: sfx_tick(o.get('f', 1000)), 0.28, 0.15, 0.3),
    'type':    (lambda o: sfx_type(o.get('d', 0.5)), 0.33, 0.05, 0.0),
    'ding':    (lambda o: sfx_ding(), 0.33, 0.30, 0.0),
    'shimmer': (lambda o: sfx_shimmer(), 0.24, 0.35, 0.0),
    'glitch':  (lambda o: sfx_glitch(o.get('d', 0.2)), 0.30, 0.10, 0.0),
    'buzz':    (lambda o: sfx_buzz(o.get('d', 0.3)), 0.28, 0.10, 0.0),
    'scan':    (lambda o: sfx_scan(o.get('d', 0.4)), 0.18, 0.15, 0.0),
    'stamp':   (lambda o: sfx_stamp(), 0.70, 0.20, 0.0),
}


# ---------------------------------------------------------------- music
# Tempo and song structure come from the page (cues.json: fs, music), so the music always matches the animation.
FS = 1.0
BEAT = BAR = STEP = 0.5
M = {}
CHORDS = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]  # Am  F  C  G
BASS = [33, 29, 36, 31]
EPS = 1e-6


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def inside(t, segs):
    return any(a - EPS <= t < b - EPS for a, b in segs)


def kick():
    t = secs(0.5)
    body = glide(150, 46, 0.5, 0.035) * np.exp(-t / 0.28)
    click = norm(filt(noise(len(t)), 'high', 2500)) * np.exp(-t / 0.002) * 0.25
    return norm(sat(body + click, 2.2))


def clap():
    t = secs(0.35)
    y = np.zeros(len(t))
    for k, off in enumerate([0, 0.011, 0.022, 0.031]):
        i = int(off * SR)
        n = len(t) - i
        y[i:] += norm(filt(noise(n), 'band', (900, 2600))) * np.exp(-np.arange(n) / SR / (0.006 if k < 3 else 0.12))
    return norm(y)


def hat(open_=False):
    t = secs(0.35 if open_ else 0.08)
    return norm(filt(noise(len(t)), 'high', 7000) * np.exp(-t / (0.12 if open_ else 0.025)))


def pad_bar(notes, d, detunes):
    t = secs(d)
    y = np.zeros(len(t))
    for m in notes:
        for dt in detunes:
            y += saw(mtof(m) * 2 ** (dt / 12), t, rng.random())
    y = filt(y, 'low', 1500)
    return y * np.minimum(1, t / 0.15) * np.clip((d - t) / 0.3, 0, 1)


def bass_note(m, d=0.24, tau=0.16):
    t = secs(d)
    f = mtof(m)
    y = filt(saw(f, t) * 0.6 + np.sin(2 * np.pi * f * t) * 0.8, 'low', 420)
    return y * np.exp(-t / tau) * np.minimum(1, t / 0.004)


def pluck(m, d=0.22):
    t = secs(d)
    f = mtof(m)
    y = filt(saw(f, t) * 0.5 + np.sign(np.sin(2 * np.pi * f * t)) * 0.25, 'low', 3200)
    return y * np.exp(-t / 0.07) * np.minimum(1, t / 0.002)


def shift(x, d):
    k = int(d * SR)
    return np.concatenate([np.zeros((k,) + x.shape[1:]), x[:-k]])


def make_music(N, dur):
    FULL, ARP, INTRO, BREAKS = M['full'], M['arp'], M['intro'], M['breaks']
    K, Cl, Ht, Op = kick(), clap(), hat(), hat(True)
    drums = np.zeros((N, 2))
    bass = np.zeros((N, 2))
    pad = np.zeros((N, 2))
    arp = np.zeros((N, 2))
    extra = np.zeros((N, 2))

    # four-on-the-floor kicks in the driving sections, half-time kicks in the twist
    kicks = [k * BEAT for k in range(int(dur / BEAT) + 1) if inside(k * BEAT, FULL + INTRO)]
    kicks = sorted(set(round(x, 4) for x in kicks + M['twistKicks']))
    for tk in kicks:
        add(drums, K, tk, 0.9)

    n16 = int(dur / STEP) + 1
    for i in range(n16):
        ts, pos = i * STEP, i % 16
        if inside(ts, FULL):
            if pos in (4, 12):
                add(drums, pan_st(Cl, 0.05), ts, 0.45)
            if pos == 14:
                add(drums, pan_st(Op, 0.25), ts, 0.30)
            elif pos % 4 == 2:
                add(drums, pan_st(Ht, 0.25), ts, 0.22)
            elif pos % 2 == 1:
                add(drums, pan_st(Ht, -0.25), ts, 0.10)
        elif inside(ts, INTRO) and pos % 4 == 2:
            add(drums, pan_st(Ht, 0.2), ts, 0.18)

    # snare-roll builds into each drop
    for a, b in BREAKS:
        tc = a + BEAT
        while tc < b - EPS:
            prog = (tc - a) / (b - a)
            add(drums, pan_st(Cl, 0.0), tc, 0.15 + 0.4 * prog)
            tc += STEP if tc < b - 2 * STEP else (STEP / 2 if tc < b - STEP else STEP / 4)
        n = int((b - a) * SR)
        tt = np.arange(n) / SR
        r = sweep_bp(noise(n), 400 * (9000 / 400) ** (tt / (b - a)), 1.0) * (tt / (b - a)) ** 2
        add(extra, pan_st(norm(r), 0.0), a, 0.30)

    # bass: octave pump on 8ths in the driving sections, long notes in the half-time twist
    for i in range(int(dur / (2 * STEP)) + 1):
        ts = i * 2 * STEP
        if inside(ts, FULL):
            m = BASS[(i // 8) % 4] + (12 if i % 2 == 1 else 0)
            add(bass, bass_note(m, 0.24 * FS, 0.16 * FS), ts, 0.5)
    for t0, m, d, tau in M['bassHolds']:
        add(bass, bass_note(m, d, tau), t0, 0.45)

    # pad: one chord per bar, stereo detune; the last chord rings out
    final = M['final']
    for bar in range(int(dur // BAR) + 1):
        tb = bar * BAR
        if tb >= final - EPS:
            break
        notes = CHORDS[bar % 4]
        L = pad_bar(notes, BAR + 0.3, (-0.09, 0.0, 0.07))
        R = pad_bar(notes, BAR + 0.3, (-0.07, 0.02, 0.09))
        add(pad, np.stack([L, R], 1), tb, 0.06)
    ring = min(2.4, dur - final + 0.3)
    L = pad_bar(CHORDS[0] + [45], ring, (-0.09, 0.0, 0.07))
    R = pad_bar(CHORDS[0] + [45], ring, (-0.07, 0.02, 0.09))
    add(pad, np.stack([L, R], 1), final, 0.07)

    # arp: 16ths over chord tones, ping-pong panned, with dotted-8th and quarter-note echoes
    order = [0, 1, 2, 3, 2, 1, 2, 3]
    for i in range(n16):
        ts = i * STEP
        if not inside(ts, ARP):
            continue
        c = CHORDS[(i // 16) % 4]
        tones = [c[0] + 12, c[1] + 12, c[2] + 12, c[0] + 24]
        add(arp, pan_st(pluck(tones[order[i % 8]]), 0.45 if i % 2 else -0.45), ts, 0.16)
    arp = arp + 0.35 * shift(arp[:, ::-1], 3 * STEP) + 0.12 * shift(arp, 6 * STEP)

    # sidechain ducking from the kick
    t = np.arange(N) / SR
    ka = np.array(kicks)
    idx = np.searchsorted(ka, t, side='right') - 1
    last = np.where(idx >= 0, ka[np.clip(idx, 0, None)], -10.0)
    dt = t - last
    duck = lambda depth: (1 - depth * np.exp(-dt / 0.12))[:, None]
    music = drums + bass * duck(0.5) + pad * duck(0.6) + arp * duck(0.35) + extra

    # bus filter automation: muffled intro, a dip during the "careful" scene that opens up into the next drop, darker twist
    C = M['cut']

    def cutoff(ts):
        c = np.full_like(ts, 16000.0)
        c[ts < C['intro']] = 450
        m = (ts >= C['dip0']) & (ts < C['sweep0'])
        c[m] = 16000 * (900 / 16000) ** np.clip((ts[m] - C['dip0']) / 0.12, 0, 1)
        m = (ts >= C['sweep0']) & (ts < C['sweep1'])
        c[m] = 900 * (16000 / 900) ** ((ts[m] - C['sweep0']) / (C['sweep1'] - C['sweep0']))
        m = (ts >= C['tw0']) & (ts < C['tw1'])
        c[m] = 1400
        return c

    def lp_mask(f, ts):
        return 1 / (1 + (f[:, None] / cutoff(ts)[None, :]) ** 4)
    music = np.stack([stft_mask(music[:, ch], lp_mask, 2048) for ch in range(2)], 1)

    # silence in the beat before the first drop
    g = np.ones(N)
    g0, g1 = M['gate']
    g[(t >= g0) & (t < g1)] = 0.0
    a = (t >= g0 - 0.03) & (t < g0)
    g[a] = (g0 - t[a]) / 0.03
    return music * g[:, None]


# ---------------------------------------------------------------- mix
def reverb_ir(d=1.6, seed=3):
    r = np.random.default_rng(seed)
    t = secs(d)
    chans = []
    for _ in range(2):
        x = r.standard_normal(len(t)) * np.exp(-t / 0.38)
        x = filt(x, 'low', 6500)
        x[: int(0.012 * SR)] = 0
        chans.append(x / np.sqrt(np.sum(x ** 2)))
    return chans


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    cues_path, out_dir = sys.argv[1], sys.argv[2]
    data = json.load(open(cues_path))
    dur = float(data['dur'])
    global FS, BEAT, BAR, STEP, M
    FS, M = float(data['fs']), data['music']
    BEAT = 0.5 * FS
    BAR = 4 * BEAT
    STEP = BEAT / 4
    N = int(round(dur * SR))
    dry = np.zeros((N, 2))
    send = np.zeros((N, 2))
    for t0, name, opts in data['cues']:
        gen, level, rsend, spread = SFX[name]
        sig = gen(opts)
        if sig.ndim == 1:
            sig = pan_st(sig, rng.uniform(-spread, spread) if spread else 0.0)
        g = level * opts.get('g', 1.0)
        add(dry, sig, t0, g)
        add(send, sig, t0, g * rsend)
    ir = reverb_ir()
    wet = np.stack([ss.fftconvolve(send[:, c], ir[c])[:N] for c in range(2)], 1)
    sfx = dry + wet * 0.9

    music = make_music(N, dur)
    mwet = np.stack([ss.fftconvolve(music[:, c] * 0.25, ir[1 - c])[:N] for c in range(2)], 1)
    music = music + mwet * 0.5

    fade = np.ones(N)
    k = int(0.35 * SR)
    fade[-k:] = np.linspace(1, 0, k) ** 2

    def master(x):
        x = x * fade[:, None]
        x = np.tanh(1.2 * x) / np.tanh(1.2)
        return x / (np.max(np.abs(x)) + 1e-9) * 0.89

    mix = master(sfx * 1.0 + music * 0.62)
    write_wav(f'{out_dir}/mix.wav', mix)
    write_wav(f'{out_dir}/sfx.wav', master(sfx))

    def rms_db(x):
        return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    print('music rms %.1f dB | sfx rms %.1f dB | mix rms %.1f dB' % (rms_db(music * 0.62), rms_db(sfx), rms_db(mix)))
    for a, b in M['intro'] + M['full'][:3] + [[M['cut']['tw0'], M['cut']['tw1']]] + M['full'][-1:]:
        seg = mix[int(a * SR):int(b * SR)]
        if len(seg) == 0:
            continue
        print(f'  {a:5.1f}-{b:5.1f}s  rms {rms_db(seg):6.1f} dB  peak {np.max(np.abs(seg)):.2f}')


if __name__ == '__main__':
    main()
