# GTA VI countdown reel (16 s)

1080×1920 · 30 fps · 16 s · Darija on-screen text · built with [Remotion](https://remotion.dev), 120 BPM synthesized soundtrack.

| File | Use it when |
|---|---|
| `output/gta6-countdown.mp4` | Post as is (music + sound effects) |
| `output/gta6-countdown-sfx-only.mp4` | You want to add trending audio in Instagram or TikTok |
| `output/cover.png` | Reel cover |

## Timeline

| Time | Scene |
|---|---|
| 0:00 | GTA VI logo slam, "العد العكسي بدا!", "اليوم · 10 نونبر" |
| 0:03 | "بقاو غير 9 أيام": the number rolls down and lands on the beat |
| 0:07 | Day by day: J-9 → JOUR J, calendar strip 10 → 19, one artwork every 2 beats |
| 0:12 | "19 نونبر 2026", "واش نتا واجد؟", follow Zouheir Builds |

## Change the dates and re-render

The dates, month name and brand are props in `src/Composition.tsx` (`startDay`, `releaseDay`, `monthAr`, `year`, `brand`). To post a new version tomorrow, set `startDay: 11`.

```bash
npm i
python3 audio.py                 # writes public/mix.wav and public/sfx.wav
npx remotion studio              # preview
npx remotion render GTA6Countdown output/gta6-countdown.mp4 --crf=20
```

Artwork and logo in `public/` are © Rockstar Games.
