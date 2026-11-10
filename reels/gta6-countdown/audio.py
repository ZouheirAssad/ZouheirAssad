"""Synthesizes the soundtrack for the reel (no samples, numpy only).

Writes public/mix.wav (music + sound effects) and public/sfx.wav (effects only).
Timings mirror src/Reel.tsx: 30 fps, 120 BPM, scenes at frames 0 / 90 / 210 / 360.
"""
import wave
import numpy as np

SR = 48000
DUR = 16.0
N = int(SR * DUR)
rng = np.random.default_rng(6)


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def put(buf, at, sig, gain=1.0, pan=0.0):
    i = int(at * SR)
    sig = sig[: max(0, N - i)]
    buf[i : i + len(sig), 0] += sig * gain * (1 - max(0, pan))
    buf[i : i + len(sig), 1] += sig * gain * (1 + min(0, pan))


def kick(d=0.35):
    n = int(SR * d)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12)


def noise(d, decay):
    n = int(SR * d)
    return rng.standard_normal(n) * env(n, 0.001, decay)


def highpass(x):
    return np.diff(x, prepend=0)


def lowpass(x, k):
    c = np.cumsum(np.insert(x, 0, 0))
    y = (c[k:] - c[:-k]) / k
    return np.pad(y, (0, len(x) - len(y)))


def saw(freq, d, detune=0.006):
    t = np.arange(int(SR * d)) / SR
    return sum(2 * ((t * freq * m) % 1) - 1 for m in (1 - detune, 1, 1 + detune)) / 3


def impact(d=1.4):
    n = int(SR * d)
    t = np.arange(n) / SR
    f = 38 + 90 * np.exp(-t / 0.06)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.45)
    return np.tanh(2.2 * (sub + lowpass(noise(d, 0.18), 12) * 0.7))


def riser(d):
    n = int(SR * d)
    t = np.arange(n) / SR
    x = highpass(rng.standard_normal(n)) * (t / d) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(300 + 1500 * (t / d) ** 2) / SR) * (t / d) ** 3
    return x * 0.5 + tone * 0.25


def tick(freq=1900, d=0.09):
    n = int(SR * d)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 2.01 * t)) * env(n, 0.0005, 0.018)


def whoosh(d=0.35):
    n = int(SR * d)
    t = np.arange(n) / SR
    return lowpass(rng.standard_normal(n), 6) * np.sin(np.pi * t / d) ** 2


sfx = np.zeros((N, 2))
music = np.zeros((N, 2))
F = 1 / 30  # seconds per frame

# ---- sound effects ----
put(sfx, 0.0, whoosh(0.27), 0.5)
put(sfx, 8 * F, impact(), 0.95)  # logo slam
for i, fr in enumerate((30, 36, 42)):  # headline words
    put(sfx, fr * F, tick(900 + i * 220, 0.12), 0.35)
put(sfx, 56 * F, tick(1500), 0.3)
put(sfx, (90 - 8) * F, whoosh(0.4), 0.45)
# odometer roll from frame 104 to 150: one click per number
steps = 21
for k in range(steps):
    p = (k + 1) / steps
    fr = 104 + (150 - 104) * (1 - (1 - p) ** 0.5)  # inverse of ease-out quad
    put(sfx, fr * F, tick(1400 + 30 * k, 0.05), 0.22, pan=0.3 * (-1) ** k)
put(sfx, 150 * F, impact(), 0.9)
put(sfx, (210 - 8) * F, whoosh(0.4), 0.45)
for i in range(10):  # day by day
    put(sfx, (210 + 15 * i) * F, tick(1100 * 2 ** (i / 12), 0.14), 0.42)
    if i and i % 2 == 0:
        put(sfx, (210 + 15 * i - 4) * F, whoosh(0.3), 0.3, pan=0.5 * (-1) ** (i // 2))
put(sfx, (345 - 60) * F, riser(2.0), 0.3)
put(sfx, 345 * F, impact(), 0.8)  # JOUR J
put(sfx, 375 * F, impact(1.8), 1.0)  # release date slam
for i, fr in enumerate((394, 400, 406)):
    put(sfx, fr * F, tick(900 + i * 220, 0.12), 0.3)
put(sfx, 422 * F, tick(1800), 0.3)

# ---- music: A minor synthwave, 120 BPM ----
BEAT = 0.5
CHORDS = [(110.0, (220.0, 261.63, 329.63)), (87.31, (174.61, 220.0, 261.63)),
          (130.81, (261.63, 329.63, 392.0)), (98.0, (196.0, 246.94, 293.66))]
k_ = kick()
hat = highpass(noise(0.05, 0.012))
snare = highpass(noise(0.2, 0.06)) * 0.6 + np.sin(2 * np.pi * 190 * np.arange(int(SR * 0.2)) / SR) * env(int(SR * 0.2), 0.001, 0.05)
for b in range(32):
    t = b * BEAT
    bass_f, chord = CHORDS[(b // 4) % 4]
    full = 10 <= b < 24 or b >= 25
    # bass: eighth notes
    for e in range(2):
        n = int(SR * 0.24)
        put(music, t + e * 0.25, lowpass(saw(bass_f / 2, 0.24), 24) * env(n, 0.004, 0.16), 0.5 if b >= 2 else 0.0)
    # arpeggio: sixteenth notes, opens up over the intro
    if b >= 4:
        for s in range(4):
            fq = chord[(s + b) % 3] * (2 if s % 2 else 1)
            n = int(SR * 0.12)
            put(music, t + s * 0.125, lowpass(saw(fq, 0.12), 6) * env(n, 0.003, 0.06), 0.12 if full else 0.07, pan=0.6 * (-1) ** s)
    if full:
        put(music, t, k_, 0.9)
        put(music, t + 0.25, hat, 0.16)
        if b % 2 == 1:
            put(music, t, snare, 0.3)
    # pad: one chord per bar
    if b % 4 == 0:
        n = int(SR * 2.0)
        tt = np.arange(n) / SR
        pad = sum(saw(fq, 2.0, 0.004) for fq in chord) / 3
        pad = lowpass(pad, 20) * np.minimum(1, tt / 0.3) * np.minimum(1, (2.0 - tt) / 0.3)
        # sidechain pump on the beat
        pump = 1 - 0.55 * np.exp(-((tt % BEAT)) / 0.09) if full else 1.0
        put(music, t, pad * pump, 0.22)

# master fade-out
fade = np.ones(N)
fade[-int(SR * 1.2):] = np.linspace(1, 0, int(SR * 1.2)) ** 1.5


def write(path, buf):
    buf = np.tanh(buf * 0.9) * fade[:, None]
    buf = buf / np.max(np.abs(buf)) * 0.89
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((buf * 32767).astype("<i2").tobytes())


write("public/mix.wav", music * 0.8 + sfx)
write("public/sfx.wav", sfx)
print("wrote public/mix.wav and public/sfx.wav")
