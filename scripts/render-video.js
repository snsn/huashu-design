#!/usr/bin/env node
/**
 * HTML 애니메이션을 Playwright recordVideo와 ffmpeg로 MP4 변환.
 *
 * 필요 조건: 전역 playwright(`npm install -g playwright`)와 PATH의 ffmpeg.
 *
 * 사용법:
 *   NODE_PATH=$(npm root -g) node render-video.js <html-file> \
 *     [--duration=30] [--width=1920] [--height=1080] \
 *     [--trim=<seconds>] [--fontwait=1.5] [--readytimeout=8] \
 *     [--keep-chrome]
 *
 * 설계:
 *   1. Warmup context (no record) — caches fonts/assets, closes cleanly
 *   2. Record context (fresh, recordVideo ON) — WebM starts writing at
 *      context creation. Babel-standalone compile + React mount +
 *      fonts.ready can take 1.5-3s, during which WebM writes black frames.
 *      We measure this by waiting for window.__ready (set by animations.jsx
 *      Stage component after first paint), then trim exactly that offset.
 *   3. addInitScript injects CSS hiding "chrome" elements (progress bar,
 *      replay button, masthead, footer, etc.) that are fine for human
 *      debugging but shouldn't appear in exported video.
 *
 * Animation-ready signal:
 *   Set `window.__ready = true` in your HTML after first paint. This tells
 *   the recorder "animation has started rendering — treat now as t=0".
 *   If you use animations.jsx, Stage does this automatically. Otherwise
 *   add: `document.fonts.ready.then(() => requestAnimationFrame(() => { window.__ready = true }));`
 *   after your first render call.
 *
 *   Without __ready, falls back to --fontwait=1.5s (may leave 1-2s of black
 *   at the start). Pass --trim=<seconds> to override manually.
 *
 * Chrome elements hidden by default (all common class names + `.no-record`
 * convention). Pass --keep-chrome to disable this and see raw HTML.
 *
 * 출력: HTML 파일과 같은 디렉터리에 같은 이름의 .mp4 파일을 생성합니다.
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('node:child_process');

function printUsage() {
  console.log('사용법: node render-video.js <html-file> [--duration=30] [--width=1920] [--height=1080] [--trim=<seconds>] [--fontwait=1.5] [--readytimeout=8] [--keep-chrome]');
  console.log('예시: NODE_PATH=$(npm root -g) node render-video.js my-animation.html');
}

function printUsage() {
  console.log('사용법: node render-video.js <html-file> [--duration=30] [--width=1920] [--height=1080] [--trim=<seconds>] [--fontwait=1.5] [--readytimeout=8] [--keep-chrome]');
  console.log('예시: NODE_PATH=$(npm root -g) node render-video.js my-animation.html');
}

function printUsage() {
  console.log('사용법: node render-video.js <html-file> [--duration=30] [--width=1920] [--height=1080] [--trim=<seconds>] [--fontwait=1.5] [--readytimeout=8] [--keep-chrome]');
  console.log('예시: NODE_PATH=$(npm root -g) node render-video.js my-animation.html');
}

function arg(name, def) {
  const p = process.argv.find(a => a.startsWith('--' + name + '='));
  return p ? p.slice(name.length + 3) : def;
}
function hasFlag(name) {
  return process.argv.includes('--' + name);
}
function parsePositiveNumber(name, def) {
  const raw = arg(name, def);
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`오류: --${name} 값은 양수여야 합니다: ${raw}`);
    process.exit(1);
  }
  return value;
}
function parsePositiveInteger(name, def) {
  const value = parsePositiveNumber(name, def);
  if (!Number.isInteger(value)) {
    console.error(`오류: --${name} 값은 정수여야 합니다: ${value}`);
    process.exit(1);
  }
  return value;
}

function fail(message) {
  console.error('ERROR: ' + message);
  process.exit(1);
}

function parseBoundedNumber(name, raw, { integer = false, min, max }) {
  const value = integer ? parseInt(raw, 10) : parseFloat(raw);
  if (!Number.isFinite(value)) fail(`${name} 값이 숫자가 아닙니다: ${raw}`);
  if (value < min || value > max) fail(`${name} 값은 ${min}~${max} 범위여야 합니다: ${value}`);
  return value;
}

function assertReadableHtml(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) fail(`HTML 파일이 없습니다: ${abs}`);
  const stat = fs.statSync(abs);
  if (!stat.isFile()) fail(`HTML 경로가 파일이 아닙니다: ${abs}`);
  if (path.extname(abs).toLowerCase() !== '.html') fail(`.html 파일만 렌더링할 수 있습니다: ${abs}`);
  return abs;
}

function printUsage() {
  console.error('사용법: node render-video.js <html-file> [--duration=30] [--width=1920] [--height=1080]');
  console.error('예시: NODE_PATH=$(npm root -g) node render-video.js my-animation.html');
}

if (hasFlag('help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

const HTML_FILE = process.argv[2];
if (hasFlag('help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}
if (!HTML_FILE || HTML_FILE.startsWith('--')) {
  printUsage();
  process.exit(1);
}

const DURATION = parsePositiveNumber('duration', '30');
const WIDTH = parsePositiveInteger('width', '1920');
const HEIGHT = parsePositiveInteger('height', '1080');
const TRIM_OVERRIDE = arg('trim', null); // 수동 보정값(초), 없으면 자동 계산
const FONT_WAIT = parsePositiveNumber('fontwait', '1.5');
const READY_TIMEOUT = parsePositiveNumber('readytimeout', '8');
const KEEP_CHROME = hasFlag('keep-chrome');

if (TRIM_OVERRIDE !== null) {
  const trim = Number(TRIM_OVERRIDE);
  if (!Number.isFinite(trim) || trim < 0) {
    console.error(`오류: --trim 값은 0 이상의 숫자여야 합니다: ${TRIM_OVERRIDE}`);
    process.exit(1);
  }
}

const HTML_ABS = path.resolve(HTML_FILE);
if (!fs.existsSync(HTML_ABS) || !fs.statSync(HTML_ABS).isFile()) {
  console.error(`오류: HTML 파일을 찾을 수 없습니다: ${HTML_ABS}`);
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  console.error('오류: playwright 모듈을 찾을 수 없습니다.');
  console.error('설치 예: npm install -g playwright && playwright install chromium');
  console.error(`상세: ${error.message}`);
  process.exit(1);
}
const BASENAME = path.basename(HTML_FILE, path.extname(HTML_FILE));
const DIR      = path.dirname(HTML_ABS);
const TMP_DIR  = path.join(DIR, '.video-tmp-' + Date.now() + '-' + process.pid);
const MP4_OUT  = path.join(DIR, BASENAME + '.mp4');
if (!path.resolve(MP4_OUT).startsWith(DIR + path.sep)) {
  console.error('출력 경로가 입력 HTML 디렉터리 밖으로 벗어났습니다.');
  process.exit(1);
}

// CSS to hide "chrome" elements during recording.
// Covers class-name conventions seen across skill-built animations,
// plus a `.no-record` explicit opt-out class.
const HIDE_CHROME_CSS = `
  .no-record,
  .progress, .progress-bar,
  .counter, .tCur,
  .phases, .phase-label, .phase,
  .replay, button.replay,
  .masthead, .kicker, .title,
  .footer,
  [data-role="chrome"], [data-record="hidden"] {
    display: none !important;
  }
`;

console.log(`▸ Rendering: ${HTML_FILE}`);
console.log(`  size: ${WIDTH}x${HEIGHT} · duration: ${DURATION}s · hide-chrome: ${!KEEP_CHROME}`);
console.log(`  output: ${MP4_OUT}`);

(async () => {
  const { chromium } = require('playwright');
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const browser = await chromium.launch();
  const url = 'file://' + HTML_ABS;

  // ── Phase 1: WARMUP (no recording, caches fonts/assets) ─────────────
  console.log('▸ Warmup (caching fonts)…');
  const warmupCtx = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  const warmupPage = await warmupCtx.newPage();
  // 'load' not 'networkidle' — unpkg/Google Fonts can keep connections alive
  // past our 30s budget even after all critical resources are in. __ready
  // flag + FONT_WAIT handle animation-readiness properly.
  await warmupPage.goto(url, { waitUntil: 'load', timeout: 60000 });
  await warmupPage.waitForTimeout(FONT_WAIT * 1000);
  await warmupCtx.close();

  // ── Phase 2: RECORD (fresh context, animation from t=0) ─────────────
  console.log('▸ Recording (clean start)…');
  const recordCtx = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: TMP_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
  });

  // Tell the page it's being recorded — animations.jsx Stage reads this
  // and forces loop=false so the export ends on the final frame instead of
  // capturing the start of the next cycle. Hand-written Stage components
  // should also honor this signal (see animation-pitfalls.md §13).
  await recordCtx.addInitScript(() => { window.__recording = true; });

  // Inject CSS + JS heuristic to hide "chrome" elements.
  // Two layers:
  //   A. CSS selectors for common class-name conventions (cheap)
  //   B. JS heuristic for fixed-position bars containing buttons or time
  //      readouts (catches inline-styled chrome like <Stage> controls)
  // Persists across reloads via addInitScript.
  if (!KEEP_CHROME) {
    await recordCtx.addInitScript(css => {
      const HIDE_MARK = 'data-video-hidden';

      function injectStyle() {
        const style = document.createElement('style');
        style.setAttribute('data-inject', 'render-video-chrome-hide');
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
      }

      function hideChromeBars() {
        const vh = window.innerHeight;
        document.querySelectorAll('div, nav, header, footer, section, aside')
          .forEach(el => {
            if (el.hasAttribute(HIDE_MARK)) return;
            if (el.dataset.recordKeep === 'true') return;
            const s = getComputedStyle(el);
            if (s.position !== 'fixed' && s.position !== 'sticky') return;
            const r = el.getBoundingClientRect();
            // Only skinny bars (not full-screen overlays)
            if (r.height > vh * 0.25) return;
            const atBottom = r.bottom >= vh - 30;
            const atTop = r.top <= 30 && r.height < 80;
            if (!atBottom && !atTop) return;
            // Chrome-like: contains button or scrubber/time glyphs
            const txt = el.textContent || '';
            const hasBtn = !!el.querySelector('button, [role="button"]');
            const hasCtrls = /[⏸▶⏮⏭↻↺↩↪]|\d+\.\d+\s*s/.test(txt);
            if (hasBtn || hasCtrls) {
              el.style.setProperty('display', 'none', 'important');
              el.setAttribute(HIDE_MARK, '1');
            }
          });
      }

      const start = () => {
        injectStyle();
        hideChromeBars();
        // Re-run as React/Vue commits DOM changes
        const obs = new MutationObserver(hideChromeBars);
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 6000);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
      } else {
        start();
      }
    }, HIDE_CHROME_CSS);
  }

  // Record context opens page. The WebM starts writing the moment the
  // context is created — so we track T0 here and measure how many seconds
  // elapse before the animation is actually ready (Babel compile + React
  // mount + fonts.ready). That elapsed time = exact trim offset.
  const T0 = Date.now();
  const page = await recordCtx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  // Wait for animation ready signal. Stage component (animations.jsx) sets
  // window.__ready = true on its first rAF after mount + fonts.ready.
  // Fallback: if HTML doesn't set __ready within READY_TIMEOUT, use fontwait.
  let animationStartSec;
  const hasReady = await page.waitForFunction(
    () => window.__ready === true,
    { timeout: READY_TIMEOUT * 1000 },
  ).then(() => true).catch(() => false);

  if (hasReady) {
    // 두 번째 방어선: 애니메이션 time을 0으로 되돌려 starter tick 템플릿 불일치를 완화
    // 예: lastTick이 performance.now()를 써서 폰트 로딩 시간이 첫 프레임 dt에 포함되는 경우
    // 참고 references/animation-pitfalls.md §12
    const seekCorrected = await page.evaluate(() => {
      if (typeof window.__seek === 'function') {
        window.__seek(0);
        return true;
      }
      return false;
    });
    if (seekCorrected) {
      // rAF 두 번을 기다려 seek가 반영되고 t=0 화면이 렌더링되게 합니다
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    animationStartSec = (Date.now() - T0) / 1000;
    console.log(`▸ Ready at ${animationStartSec.toFixed(2)}s (from window.__ready${seekCorrected ? ' + __seek(0) correction' : ''})`);
  } else {
    await page.waitForTimeout(FONT_WAIT * 1000);
    animationStartSec = (Date.now() - T0) / 1000;
    // Fallback offset is unreliable: animation may have started in raf loop
    // already, so trim could land mid-cycle. Add 0.5s safety margin (see
    // animation-pitfalls.md §13). Loud warning so user knows to fix the HTML.
    console.log('');
    console.log(`  ⚠️  WARNING: window.__ready signal not detected within ${READY_TIMEOUT}s`);
    console.log(`     Recording will use fallback trim of ${animationStartSec.toFixed(2)}s + 0.5s safety margin.`);
    console.log(`     This is UNRELIABLE — your video may start mid-animation or skip frames.`);
    console.log('');
    console.log(`     FIX: in your HTML's animation tick (or rAF first frame), add:`);
    console.log(`        window.__ready = true;`);
    console.log(`     animations.jsx-based HTML does this automatically. If you wrote your`);
    console.log(`     own Stage, see references/animation-pitfalls.md §12 for the pattern.`);
    console.log('');
  }

  // Now let the animation play out its full duration
  await page.waitForTimeout(DURATION * 1000 + 300);

  await page.close();
  await recordCtx.close();
  await browser.close();

  const webmFiles = fs.readdirSync(TMP_DIR).filter(f => f.endsWith('.webm'));
  if (webmFiles.length === 0) {
    console.error('✗ WebM 파일이 생성되지 않았습니다');
    process.exit(1);
  }
  const webmPath = path.join(TMP_DIR, webmFiles[0]);
  console.log(`▸ WebM: ${(fs.statSync(webmPath).size / 1024 / 1024).toFixed(1)} MB`);

  // 최종 trim offset 결정:
  //   - manual --trim=X       → use X (explicit user override)
  //   - hasReady              → animationStartSec + 0.05s (Babel-commit nudge)
  //   - fallback (no __ready) → animationStartSec + 0.5s safety margin (raf
  //                             loop may have started running already; without
  //                             this we'd capture mid-cycle frames)
  const resolvedTrim = TRIM_OVERRIDE !== null
    ? parseBoundedNumber('trim', TRIM_OVERRIDE, { min: 0, max: Math.max(DURATION + 120, 120) })
    : animationStartSec + (hasReady ? 0.05 : 0.5);

  console.log(`▸ ffmpeg: trim=${resolvedTrim.toFixed(2)}s${TRIM_OVERRIDE !== null ? ' (manual)' : ' (auto)'}, encode H.264…`);
  if (!Number.isFinite(resolvedTrim) || resolvedTrim < 0) {
    console.error(`잘못된 trim 값입니다: ${resolvedTrim}`);
    process.exit(1);
  }

  const ffmpegArgs = [
    '-y',
    '-ss', String(resolvedTrim),
    '-i', webmPath,
    '-t', String(DURATION),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-preset', 'medium',
    '-movflags', '+faststart',
    MP4_OUT,
  ];
  const ffmpeg = spawnSync('ffmpeg', ffmpegArgs, {
    cwd: DIR,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  if (ffmpeg.status !== 0) {
    console.error('✗ ffmpeg 실패:\n' + ffmpeg.stderr.toString().slice(-2000));
    process.exit(1);
  }

  fs.rmSync(TMP_DIR, { recursive: true, force: true });

  const mp4Size = (fs.statSync(MP4_OUT).size / 1024 / 1024).toFixed(1);
  console.log(`✓ Done: ${MP4_OUT} (${mp4Size} MB)`);
})();
