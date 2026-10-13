#!/bin/bash
# Mux the audio, then two-pass encode both versions to fit under the 30 MB upload limit.
# Usage: bash finish.sh <output-name>   e.g. bash finish.sh my-topic-60s
# Run from the project folder after render.js has produced build/video_noaudio.mp4 and audio.py build/mix.wav + sfx.wav.
set -euo pipefail
cd "$(dirname "$0")"
NAME="${1:-reel}"
LOG=$(mktemp -u /tmp/x264pass.XXXX)
V=build/video_noaudio.mp4

# 3.6 Mbps video + 160 kbps audio is about 27 MB for 60 s
ffmpeg -y -loglevel error -i "$V" -c:v libx264 -preset veryslow -b:v 3600k -pass 1 -passlogfile "$LOG" -an -f null /dev/null
ffmpeg -y -loglevel error -i "$V" -c:v libx264 -preset veryslow -b:v 3600k -maxrate 7M -bufsize 10M -aq-mode 3 \
  -pass 2 -passlogfile "$LOG" -profile:v high -level 4.2 -pix_fmt yuv420p -an build/video_small.mp4
rm -f "$LOG"*

python3 mux.py build/video_small.mp4 build/mix.wav "$NAME.mp4"
python3 mux.py build/video_small.mp4 build/sfx.wav "$NAME-sfx-only.mp4"
ls -la "$NAME"*.mp4
