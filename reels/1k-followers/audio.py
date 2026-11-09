#!/usr/bin/env python3
"""Synthesize public/soundtrack.wav (numpy only): an upbeat music bed plus SFX
on the scene cue frames used in src/*.tsx (30 fps, 410 frames).

Usage: python3 audio.py
"""
import wave

import numpy as np

SR = 48000
FPS = 30
TOTAL = 410 / FPS
rng = np.random.default_rng(7)
out = np.zeros(int(TOTAL * SR) + SR)


def t_of(d):
    return np.arange(int(d * SR)) / SR


def place(sig, at, gain=1.0):
    i = int(at * SR)
    n = min(len(sig), len(out) - i)
    out[i:i + n] += sig[:n] * gain


def env(n, a=0.005, decay=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / decay)


def lowpass(x, alpha):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def tick():
    t = t_of(0.04)
    return np.sin(2 * np.pi * 2600 * t) * env(len(t), 0.001, 0.008)


def pop(f=900):
    t = t_of(0.15)
    f_t = f * (1 + 1.5 * np.exp(-t / 0.01))
    return np.sin(2 * np.pi * np.cumsum(f_t) / SR) * env(len(t), 0.002, 0.04)


def whoosh(d=0.5, rising=True):
    n = int(d * SR)
    x = rng.standard_normal(n)
    shape = np.linspace(0, 1, n) ** 2 if rising else np.linspace(1, 0, n) ** 2
    return lowpass(x, 0.08) * shape * 2.0


def boom():
    t = t_of(1.4)
    f_t = 45 + 110 * np.exp(-t / 0.05)
    sub = np.sin(2 * np.pi * np.cumsum(f_t) / SR) * env(len(t), 0.002, 0.45)
    crack = lowpass(rng.standard_normal(len(t)), 0.35) * env(len(t), 0.001, 0.06)
    return sub * 1.2 + crack * 0.6


def chime(base=880):
    t = t_of(1.6)
    s = sum(np.sin(2 * np.pi * base * m * t) / (k + 1)
            for k, m in enumerate([1, 2.01, 3.0, 4.2]))
    return s * env(len(t), 0.003, 0.5) * 0.35


def sparkle(at, n=14):
    for k in range(n):
        f = rng.uniform(2200, 4800)
        t = t_of(0.18)
        place(np.sin(2 * np.pi * f * t) * env(len(t), 0.002, 0.05),
              at + k * 0.035 + rng.uniform(0, 0.02), 0.12)


def kick():
    t = t_of(0.35)
    f_t = 50 + 120 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f_t) / SR) * env(len(t), 0.001, 0.12)


def hat():
    t = t_of(0.06)
    x = rng.standard_normal(len(t))
    return (x - lowpass(x, 0.5)) * env(len(t), 0.001, 0.015)


def pad(freqs, d):
    t = t_of(d)
    s = sum(np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.003 * t)
            for f in freqs)
    fade = np.minimum(1, np.minimum(t / 0.08, (d - t) / 0.15))
    return s * fade / len(freqs)


# ---- music bed: 120 bpm, I–V–vi–IV in C, from the 1K hit to the end
BEAT = 0.5
start = 105 / FPS
chords = [[261.6, 329.6, 392.0], [196.0, 246.9, 392.0],
          [220.0, 261.6, 329.6], [174.6, 220.0, 349.2]]
bar = 0
t0 = start
while t0 < TOTAL - 0.4:
    place(pad(chords[bar % 4], 4 * BEAT), t0, 0.10)
    place(pad([chords[bar % 4][0] / 2], 4 * BEAT), t0, 0.12)
    for b in range(4):
        tb = t0 + b * BEAT
        if tb < TOTAL - 0.4:
            place(kick(), tb, 0.55)
            place(hat(), tb + BEAT / 2, 0.25)
    bar += 1
    t0 += 4 * BEAT

# build-up under the counter: soft pulse
for k in range(8):
    place(kick(), 12 / FPS + k * 0.28, 0.18 + k * 0.03)

# ---- SFX
# counter ticks every 50 followers, following the counter's easing
def bez(p1x, p1y, p2x, p2y, x):
    lo, hi = 0.0, 1.0
    for _ in range(40):
        m = (lo + hi) / 2
        bx = 3 * (1 - m) ** 2 * m * p1x + 3 * (1 - m) * m ** 2 * p2x + m ** 3
        lo, hi = (m, hi) if bx < x else (lo, m)
    return 3 * (1 - m) ** 2 * m * p1y + 3 * (1 - m) * m ** 2 * p2y + m ** 3

last = -1
for f in np.arange(12, 78, 0.25):
    v = int(bez(0.45, 0, 0.15, 1, (f - 12) / 66) * 20)
    if v != last:
        place(tick(), f / FPS, 0.35)
        last = v

place(whoosh(0.6), 87 / FPS, 0.25)            # into 1K
place(boom(), 105 / FPS, 0.9)                 # 1K slam
sparkle(105 / FPS)
place(chime(1046.5), 119 / FPS, 0.8)          # "شكراً بزاف"
place(whoosh(0.4, False), 200 / FPS, 0.2)
for i in range(3):                            # stat cards
    place(pop(700 + i * 180), (205 + 16 + i * 10) / FPS, 0.6)
place(whoosh(0.5), 300 / FPS, 0.25)           # into outro
place(boom(), 315 / FPS, 0.45)
place(pop(1200), (315 + 52) / FPS, 0.6)       # follow button
place(chime(1318.5), (315 + 84) / FPS, 0.5)

# ---- master
out = out[: int(TOTAL * SR)]
fade = int(0.4 * SR)
out[-fade:] *= np.linspace(1, 0, fade)
out = np.tanh(out * 1.1)
out /= np.max(np.abs(out)) / 0.89
pcm = (out * 32767).astype(np.int16)
stereo = np.repeat(pcm[:, None], 2, axis=1)
with wave.open("public/soundtrack.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("wrote public/soundtrack.wav", round(TOTAL, 2), "s")
