# 1K followers celebration (Remotion)

17.7s vertical reel (1080×1920, 30 fps) for @zouheir.builds hitting 1,000 followers.

Scenes (`src/`): Profile (your real screenshot in a phone, zoom + highlight on "1,000 followers", "وصلنا!") → Counter (0 → 1,000 with a progress ring) → Thanks (1K slam, confetti, "شكراً بزاف!") → Stats (24 posts, 58.3K views, AI topics) → Outro (next stop 10K + follow CTA).

```bash
npm i
python3 audio.py                 # regenerates public/soundtrack.wav (numpy)
npx remotion studio              # preview / edit
npx remotion render Celebration1K output/celebration-1k.mp4
```

In the cloud sandbox add `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell` (no download access).
Rendered file: `output/celebration-1k.mp4`.
