#!/usr/bin/env python3
"""Mix the original voice with the synced sound effects from the page cues.
Usage: python3 sfxmix.py build/cues.json build/voice.wav build/mix.wav"""
import json, sys, wave
import numpy as np
import scipy.signal as ss
import audio as A   # sound-effect generators from the reel template

cues_path, voice_path, out = sys.argv[1:4]
data = json.load(open(cues_path))
w = wave.open(voice_path)
sr, ch = w.getframerate(), w.getnchannels()
voice = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float).reshape(-1, ch) / 32768
assert sr == A.SR and ch == 2
N = len(voice)
dry, send = np.zeros((N, 2)), np.zeros((N, 2))
for t0, name, opts in data['cues']:
    gen, level, rsend, spread = A.SFX[name]
    sig = gen(opts)
    if sig.ndim == 1:
        sig = A.pan_st(sig, A.rng.uniform(-spread, spread) if spread else 0.0)
    g = level * opts.get('g', 1.0)
    A.add(dry, sig, t0, g); A.add(send, sig, t0, g * rsend)
ir = A.reverb_ir()
wet = np.stack([ss.fftconvolve(send[:, c], ir[c])[:N] for c in range(2)], 1)
sfx = dry + wet * 0.9
vp, sp = np.max(np.abs(voice)), np.max(np.abs(sfx))
sfx *= (vp * 10 ** (-7 / 20)) / (sp + 1e-9)   # sound effects peak about 7 dB under the voice peak
mix = voice + sfx
mix = np.tanh(1.1 * mix) / np.tanh(1.1)
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
A.write_wav(out, mix)
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f'voice rms {rms(voice):.1f} dB | sfx rms {rms(sfx):.1f} dB | mix rms {rms(mix):.1f} dB')
