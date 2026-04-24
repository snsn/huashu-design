#!/usr/bin/env node
/**
 * export_deck_pdf.mjs — 여러 파일 slide deck을 하나의 벡터 PDF로 내보냅니다
 *
 * 사용법:
 *   node export_deck_pdf.mjs --slides <dir> --out <file.pdf> [--width 1920] [--height 1080]
 *
 * 특징:
 *   - 텍스트를 벡터로 유지(복사/검색 가능)
 *   - 배경/그래픽을 1:1로 보존(Playwright 내장 Chromium 렌더링)
 *   - HTML 수정 불필요
 *   - 시각 손실 최소화(PDF는 브라우저 출력물)
 *
 * trade-off：
 *   - PDF 텍스트는 직접 편집하지 않고 HTML 원본을 수정
 *
 * 필요 조건:playwright pdf-lib
 *   npm install playwright pdf-lib
 *
 * 파일명 기준 정렬（01-xxx.html → 02-xxx.html → ...）
 */

import fs from 'fs/promises';
import path from 'path';

function printUsage() {
  console.log('사용법: node export_deck_pdf.mjs --slides <dir> --out <file.pdf> [--width 1920] [--height 1080]');
}

function parseArgs() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('사용법: node export_deck_pdf.mjs --slides <dir> --out <file.pdf> [--width 1920] [--height 1080]');
    process.exit(0);
  }
  const args = { width: 1920, height: 1080 };
  const a = process.argv.slice(2);
  if (a.includes('--help') || a.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  for (let i = 0; i < a.length; i += 2) {
    const k = a[i].replace(/^--/, '');
    args[k] = a[i + 1];
  }
  if (!args.slides || !args.out) {
    printUsage();
    process.exit(1);
  }
  args.width = parseInt(args.width);
  args.height = parseInt(args.height);
  return args;
}

async function importDependency(name) {
  try {
    return await import(name);
  } catch (error) {
    console.error(`오류: ${name} 모듈을 찾을 수 없습니다.`);
    console.error('설치 예: npm install playwright pdf-lib');
    console.error(`상세: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const { slides, out, width, height } = parseArgs();
  const { chromium } = await importDependency('playwright');
  const { PDFDocument } = await importDependency('pdf-lib');
  const slidesDir = path.resolve(slides);
  const outFile = path.resolve(out);

  const files = (await fs.readdir(slidesDir))
    .filter(f => f.endsWith('.html'))
    .sort();
  if (!files.length) {
    console.error(`No .html files found in ${slidesDir}`);
    process.exit(1);
  }
  console.log(`Found ${files.length} slides in ${slidesDir}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height } });

  // 1) Render each HTML to its own PDF buffer
  const pageBuffers = [];
  for (const f of files) {
    const page = await ctx.newPage();
    const url = 'file://' + path.join(slidesDir, f);
    await page.goto(url, { waitUntil: 'networkidle' }).catch(() => page.goto(url));
    await page.waitForTimeout(1200);  // web-font paint
    // emulate "screen" so CSS colors/backgrounds render the same as browser
    await page.emulateMedia({ media: 'screen' });
    const buf = await page.pdf({
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false,
    });
    pageBuffers.push(buf);
    await page.close();
    console.log(`  [${pageBuffers.length}/${files.length}] ${f}`);
  }

  await browser.close();

  // 2) Merge into a single PDF
  const merged = await PDFDocument.create();
  for (const buf of pageBuffers) {
    const src = await PDFDocument.load(buf);
    const copied = await merged.copyPages(src, src.getPageIndices());
    copied.forEach(p => merged.addPage(p));
  }
  const bytes = await merged.save();
  await fs.writeFile(outFile, bytes);

  const kb = (bytes.byteLength / 1024).toFixed(0);
  console.log(`\n✓ Wrote ${outFile}  (${kb} KB, ${files.length} pages, vector)`);
}

main().catch(e => { console.error(e); process.exit(1); });
