#!/usr/bin/env python3
"""Two-pass loudness normalisation (-14 LUFS, -1 dBTP) and mux with the rendered video.

Usage: python3 mux.py video.mp4 audio.wav out.mp4
"""
import json
import re
import subprocess
import sys

video, audio, out = sys.argv[1:4]
target = 'I=-14:TP=-1.0:LRA=11'

probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', audio, '-af', f'loudnorm={target}:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
m = json.loads(re.findall(r'\{[^{}]*\}', probe)[-1])
af = (f"loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a',
                '-c:v', 'copy', '-af', af, '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out],
               check=True)
print(f"{out}: input {m['input_i']} LUFS -> -14 LUFS")
