// Usage:
//   node render.js stills <out_dir> t1 t2 ...        PNG snapshots at given times
//   node render.js cues <out.json>                   dump the sound-effect cue list
//   node render.js video <out.mp4> [fps] [sub] [workers]
//       sub = motion-blur samples per frame (frames are averaged with ffmpeg tmix)
// playwright may be installed locally (npm i playwright) or globally; try both.
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PAGE = 'file://' + path.join(__dirname, 'index.html');
const SHUTTER = 0.75; // fraction of the frame interval covered by the blur samples

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  return page;
}

async function stills(outDir, times) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await openPage(browser);
  for (const t of times) {
    await page.evaluate((t) => window.seek(t), t);
    await page.screenshot({ path: path.join(outDir, `t${t.toFixed(2).padStart(6, '0')}.png`) });
  }
  await browser.close();
}

async function cues(out) {
  const browser = await chromium.launch();
  const page = await openPage(browser);
  const data = await page.evaluate(() => ({ dur: window.DUR, fs: window.FS, cues: window.CUES, music: window.MUSIC }));
  fs.writeFileSync(out, JSON.stringify(data));
  await browser.close();
}

async function segment(file, fps, sub, f0, f1, label) {
  const browser = await chromium.launch();
  const page = await openPage(browser);
  const cdp = await page.context().newCDPSession(page);
  const vf = sub > 1 ? `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB)` : 'null';
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps * sub), '-i', '-',
    '-vf', vf, '-r', String(fps), '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', file],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    for (let k = 0; k < sub; k++) {
      // shutter opens at the frame time, so cuts and beats that land on a frame boundary never blend
      const off = sub > 1 ? (k / sub) * SHUTTER : 0;
      const t = Math.max(0, (f + off) / fps);
      await page.evaluate((t) => window.seek(t), t);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true });
      const buf = Buffer.from(data, 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    if ((f - f0) % 60 === 0) console.log(`[${label}] frame ${f - f0}/${f1 - f0} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
}

async function video(out, fps, sub, workers) {
  out = path.resolve(out);
  const browser = await chromium.launch();
  const p = await openPage(browser);
  const dur = await p.evaluate(() => window.DUR);
  await browser.close();
  const start = Math.round(Number(process.env.START || 0) * fps);
  const total = Math.round((process.env.LIMIT ? Number(process.env.LIMIT) : dur) * fps);
  const per = Math.ceil(total / workers);
  const dir = path.join(path.dirname(out), '.segments');
  fs.mkdirSync(dir, { recursive: true });
  const segs = [], jobs = [];
  const t0 = Date.now();
  for (let w = 0; w < workers; w++) {
    const f0 = start + w * per, f1 = start + Math.min(total, w * per + per);
    if (f0 >= f1) break;
    const file = path.join(dir, `seg${w}.mp4`);
    segs.push(file);
    jobs.push(segment(file, fps, sub, f0, f1, `w${w}`));
  }
  await Promise.all(jobs);
  fs.writeFileSync(path.join(dir, 'list.txt'), segs.map((s) => `file '${s}'`).join('\n'));
  await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'),
    '-c', 'copy', out], { stdio: 'inherit' }).on('close', r));
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`rendered ${total} frames x${sub} samples in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`);
}

const [mode, out, ...rest] = process.argv.slice(2);
if (mode === 'stills') stills(out, rest.map(Number));
else if (mode === 'cues') cues(out);
else video(out, Number(rest[0] || 30), Number(rest[1] || 4), Number(rest[2] || 4));
