# Codex vs Claude Code: logo overlay on the talking clip

Overlay for the 4.4 s clip "سؤال المليون: واش Codex ولا Claude Code؟".

- **Codex** (official app icon) pops out of the raised index finger on screen-left at 1.48 s, when "Codex" is said.
- **Claude Code** (official mark) pops out of the finger on screen-right at 2.60 s, when "Claude Code" is said.
- Both tiles follow the fingertips (positions read frame by frame from the footage) and leave at 3.34 s when the hands drop.
- Darija captions appear word by word in sync with the voice.

| File | Use |
|---|---|
| `output/codex-vs-claude-code-logos.mp4` | Voice + subtle synced sound effects |
| `output/codex-vs-claude-code-logos-voice-only.mp4` | Voice only (add your own music) |

Re-render: extract the original clip's frames to `frames/` (`ffmpeg -i clip.mp4 -vsync 0 -q:v 2 frames/%03d.jpg`) and its audio to `build/voice.wav` (48 kHz stereo), then `node render.js cues build/cues.json && python3 sfxmix.py build/cues.json build/voice.wav build/mix.wav && node render.js video build/video_noaudio.mp4 30 4 4`, then `python3 mux.py build/video_noaudio.mp4 build/mix.wav out.mp4`.
Timings and fingertip tracks are at the top of the script in `index.html` (`T_CDX`, `T_CCD`, `T_OUT`, `TL`, `TR`).
