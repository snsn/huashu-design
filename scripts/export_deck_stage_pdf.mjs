#!/usr/bin/env node
/**
 * export_deck_stage_pdf.mjs — 단일 파일 <deck-stage> 구조 전용 PDF 내보내기
 *
 * 사용법:
 *   node export_deck_stage_pdf.mjs --html <deck.html> --out <file.pdf> [--width 1920] [--height 1080]
 *
 * 이 스크립트를 쓰는 경우:
 *   - deck이 단일 HTML 파일이고 모든 slide가 `<section>`이며 외부가 `<deck-stage>`로 감싸진 경우
 *   - 이때는 여러 파일 전용 `export_deck_pdf.mjs`가 맞지 않습니다
 *
 * `page.pdf()`를 바로 쓰지 않는 이유：
 *   1. deck-stage의 shadow CSS `::slotted(section) { display: none }` 때문에 active slide만 보입니다
 *   2. print media에서 외부 `!important`만으로는 shadow DOM 규칙을 이길 수 없습니다
 *   3. 결과: PDF가 항상 active slide 한 페이지만 생성됩니다
 *
 * 해결책:
 *   HTML을 연 뒤 page.evaluate로 모든 section을 deck-stage slot에서 꺼냅니다.
 *   body 아래 일반 div에 붙이고 inline style로 position:relative와 고정 크기를 강제합니다.
 *   각 section에 page-break-after: always를 적용하고 마지막만 auto로 바꿔 빈 끝 페이지를 피합니다.
 *
 * 필요 조건:playwright
 *   npm install playwright
 *
 * 출력 특징:
 *   - 텍스트를 벡터로 유지(복사/검색 가능)
 *   - 시각 1:1 보존
 *   - 폰트는 Chromium이 로드할 수 있어야 합니다(로컬 또는 Google Fonts)
 */

import fs from 'fs/promises';
import path from 'path';

function printUsage() {
  console.log('사용법: node export_deck_stage_pdf.mjs --html <deck.html> --out <file.pdf> [--width 1920] [--height 1080]');
}

function parseArgs() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('사용법: node export_deck_stage_pdf.mjs --html <deck.html> --out <file.pdf> [--width 1920] [--height 1080]');
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
  if (!args.html || !args.out) {
    printUsage();
    process.exit(1);
  }
  args.width = parseInt(args.width);
  args.height = parseInt(args.height);
  return args;
}

async function importPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    console.error('오류: playwright 모듈을 찾을 수 없습니다.');
    console.error('설치 예: npm install playwright');
    console.error(`상세: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const { html, out, width, height } = parseArgs();
  const { chromium } = await importPlaywright();
  const htmlAbs = path.resolve(html);
  const outFile = path.resolve(out);

  await fs.access(htmlAbs).catch(() => {
    console.error(`HTML file not found: ${htmlAbs}`);
    process.exit(1);
  });

  console.log(`Rendering ${path.basename(htmlAbs)} → ${path.basename(outFile)}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();

  await page.goto('file://' + htmlAbs, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);  // Google Fonts + deck-stage 초기화 대기

  // 핵심 보정: section을 deck-stage slot에서 꺼내 펼침
  const sectionCount = await page.evaluate(({ W, H }) => {
    const stage = document.querySelector('deck-stage');
    if (!stage) throw new Error('<deck-stage> not found — 이 스크립트는 단일 파일 deck-stage 구조에만 사용할 수 있습니다');
    const sections = Array.from(stage.querySelectorAll(':scope > section'));
    if (!sections.length) throw new Error('No <section> found inside <deck-stage>');

    // 프린트 스타일 삽입
    const style = document.createElement('style');
    style.textContent = `
      @page { size: ${W}px ${H}px; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff; }
      deck-stage { display: none !important; }
    `;
    document.head.appendChild(style);

    // body 아래로 펼침
    const container = document.createElement('div');
    container.id = 'print-container';
    sections.forEach(s => {
      // inline style로 우선순위를 확보하고 position:relative로 absolute 자식의 기준을 고정
      s.style.cssText = `
        width: ${W}px !important;
        height: ${H}px !important;
        display: block !important;
        position: relative !important;
        overflow: hidden !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
      container.appendChild(s);
    });
    // 마지막 페이지는 page break를 제거해 빈 끝 페이지를 피함
    const last = sections[sections.length - 1];
    last.style.pageBreakAfter = 'auto';
    last.style.breakAfter = 'auto';
    document.body.appendChild(container);
    return sections.length;
  }, { W: width, H: height });

  await page.waitForTimeout(800);

  await page.pdf({
    path: outFile,
    width: `${width}px`,
    height: `${height}px`,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  const stat = await fs.stat(outFile);
  const kb = (stat.size / 1024).toFixed(0);
  console.log(`\n✓ Wrote ${outFile}  (${kb} KB, ${sectionCount} pages, vector)`);
  console.log(`  페이지 수 검증：mdimport "${outFile}" && pdfinfo "${outFile}" | grep Pages`);
}

main().catch(e => { console.error(e); process.exit(1); });
