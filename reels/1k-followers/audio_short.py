#!/usr/bin/env python3
"""Soundtrack for the short cut (Celebration1KShort): 9 s, 120 bpm, punchy.
Hits line up with the stamps/zooms/wipes in src/short/*.tsx (30 fps).

Usage: python3 audio_short.py   -> public/soundtrack-short.wav
"""
import wave

import numpy as np

SR = 48000
FPS = 30
TOTAL = 270 / FPS
BEAT = 0.5
rng = np.random.default_rng(3)
out = np.zeros(int(TOTAL * SR) + SR)


def t_of(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / decay)


def place(sig, at, gain=1.0):
    i = int(at * SR)
    n = min(len(sig), len(out) - i)
    if n > 0:
        out[i:i + n] += sig[:n] * gain


def hp(x):
    return np.concatenate([[0], np.diff(x)])


def kick(gain_body=1.0):
    t = t_of(0.4)
    f = 48 + 140 * np.exp(-t / 0.025)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.14) * gain_body


def clap():
    t = t_of(0.25)
    x = hp(rng.standard_normal(len(t)))
    e = sum(env(len(t), 0.001, 0.01) * (np.arange(len(t)) >= int(k * 0.011 * SR))
            for k in range(3)) + env(len(t), 0.001, 0.07)
    return x * e * 0.5


def hat(open_=False):
    t = t_of(0.2 if open_ else 0.05)
    return hp(hp(rng.standard_normal(len(t)))) * env(len(t), 0.001, 0.06 if open_ else 0.012)


def bass(f, d):
    t = t_of(d)
    s = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t)
    return s * np.minimum(1, (d - t) / 0.03) * env(len(t), 0.003, 0.25)


def stab(freqs, d=0.18):
    t = t_of(d)
    s = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in freqs) / len(freqs)
    return s * env(len(t), 0.002, 0.07)


def swish(d=0.2):
    n = int(d * SR)
    x = hp(rng.standard_normal(n))
    return x * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.6


def impact():
    k, c = kick(1.4), clap() * 0.8
    k[: len(c)] += c
    return k


# ---- groove: kick every beat, clap on 2 & 4, hats on offbeats
roots = [65.4, 49.0, 55.0, 43.7]  # C, G, A, F (low)
n_beats = int(TOTAL / BEAT)
for b in range(n_beats):
    tb = b * BEAT
    place(kick(), tb, 0.7)
    place(hat(), tb + BEAT / 2, 0.22)
    if b % 2 == 1:
        place(clap(), tb, 0.45)
    place(bass(roots[(b // 4) % 4] * 2, BEAT * 0.9), tb, 0.18)

# ---- hits on the visuals
f = lambda fr: fr / FPS  # noqa: E731
place(swish(), f(0), 0.6)                       # phone slides in
for fr in (18, 32):                             # zoom cuts
    place(swish(0.15), f(fr - 5), 0.6)
    place(impact(), f(fr), 0.5)
place(stab([523, 659, 784]), f(40), 0.35)       # highlighter
place(impact(), f(42), 0.6)                     # sticker
for fr in (54, 114, 174):                       # wipes
    place(swish(0.3), f(fr), 0.8)
for k, fr in enumerate((63, 69, 75, 81)):       # digits stamp
    place(impact(), f(fr), 0.45)
    place(stab([392 * 2 ** (k / 12) * m for m in (1, 1.25, 1.5)]), f(fr), 0.3)
place(stab([523, 659, 784, 1046], 0.5), f(124), 0.4)   # "شكراً بزاف"
place(impact(), f(140), 0.5)                    # orange label
place(impact(), f(188), 0.8)                    # 10K slam
for fr in (202, 206, 210):                      # chips
    place(stab([880, 1108]), f(fr), 0.25)
place(swish(0.25), f(222), 0.6)                 # CTA rises
place(hat(True), f(232), 0.5)

out = out[: int(TOTAL * SR)]
fade = int(0.3 * SR)
out[-fade:] *= np.linspace(1, 0, fade)
out = np.tanh(out * 1.3)
out /= np.max(np.abs(out)) / 0.89
pcm = (out * 32767).astype(np.int16)
with wave.open("public/soundtrack-short.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(np.repeat(pcm[:, None], 2, axis=1).tobytes())
print("wrote public/soundtrack-short.wav", TOTAL, "s")
