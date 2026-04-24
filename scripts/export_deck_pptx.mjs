#!/usr/bin/env node
/**
 * export_deck_pptx.mjs — 여러 파일 slide deck을 편집 가능한 PPTX로 내보냅니다
 *
 * 사용법:
 *   node export_deck_pptx.mjs --slides <dir> --out <file.pptx>
 *
 * 동작:
 *   - scripts/html2pptx.js로 HTML DOM을 PowerPoint 객체로 변환
 *   - 텍스트는 실제 텍스트 박스라 PPT에서 직접 편집 가능
 *   - body 크기 960pt × 540pt（LAYOUT_WIDE，13.333″ × 7.5″）
 *
 * ⚠️ HTML은 references/editable-pptx.md의 4가지 제약을 지켜야 합니다：
 *   1. 텍스트는 <p>/<h1>-<h6>에 넣고 div 직접 텍스트는 피함
 *   2. CSS 그라데이션 미사용
 *   3. <p>/<h*>에는 background/border/shadow를 두지 않고 외부 div 사용
 *   4. div background-image 대신 <img> 사용
 *
 * 시각 중심 HTML은 통과가 어렵기 때문에 처음부터 제약에 맞춰 작성해야 합니다.
 * 시각 자유도가 우선인 경우(애니메이션, web component, CSS 그라데이션, 복잡한 SVG)
 * export_deck_pdf.mjs / export_deck_stage_pdf.mjs로 PDF를 내보내세요.
 *
 * 필요 조건:npm install playwright pptxgenjs sharp
 *
 * 파일명 기준 정렬（01-xxx.html → 02-xxx.html → ...）。
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printUsage() {
  console.log('사용법: node export_deck_pptx.mjs --slides <dir> --out <file.pptx>');
  console.log('');
  console.log('주의: HTML은 references/editable-pptx.md의 4가지 제약을 따라야 합니다.');
  console.log('시각 자유도가 우선인 경우 export_deck_pdf.mjs로 PDF를 내보내세요.');
}

function parseArgs() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('사용법: node export_deck_pptx.mjs --slides <dir> --out <file.pptx>');
    process.exit(0);
  }
  const args = {};
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
    console.error('');
    console.error('⚠️ HTML은 references/editable-pptx.md의 4가지 제약을 지켜야 합니다。');
    console.error('   시각 자유도가 우선이면 export_deck_pdf.mjs로 PDF를 내보내세요.');
    process.exit(1);
  }
  return args;
}

async function importPptxGen() {
  try {
    const mod = await import('pptxgenjs');
    return mod.default;
  } catch (error) {
    console.error('오류: pptxgenjs 모듈을 찾을 수 없습니다.');
    console.error('설치 예: npm install pptxgenjs');
    console.error(`상세: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const { slides, out } = parseArgs();
  const pptxgen = await importPptxGen();
  const slidesDir = path.resolve(slides);
  const outFile = path.resolve(out);

  const files = (await fs.readdir(slidesDir))
    .filter(f => f.endsWith('.html'))
    .sort();
  if (!files.length) {
    console.error(`.html 파일을 찾지 못했습니다: ${slidesDir}`);
    process.exit(1);
  }

  console.log(`${files.length}개 슬라이드를 html2pptx로 변환합니다...`);

  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  let html2pptx;
  try {
    html2pptx = require(path.join(__dirname, 'html2pptx.js'));
  } catch (e) {
    console.error(`✗ html2pptx.js 로드 실패: ${e.message}`);
    console.error(`  의존성이 없으면 실행: npm install playwright pptxgenjs sharp`);
    process.exit(1);
  }

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';  // 13.333 × 7.5 inch，HTML body에 대응 960 × 540 pt

  const errors = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const fullPath = path.join(slidesDir, f);
    try {
      await html2pptx(fullPath, pres);
      console.log(`  [${i + 1}/${files.length}] ${f} ✓`);
    } catch (e) {
      console.error(`  [${i + 1}/${files.length}] ${f} ✗  ${e.message}`);
      errors.push({ file: f, error: e.message });
    }
  }

  if (errors.length) {
    console.error(`\n⚠️ ${errors.length} 개 slide 변환 실패. 일반적인 원인: HTML이 4가지 제약을 만족하지 않음.`);
    console.error(`  참고: references/editable-pptx.md의 일반 오류 표`);
    if (errors.length === files.length) {
      console.error(`✗ 모두 실패하여 PPTX를 생성하지 않습니다.`);
      process.exit(1);
    }
  }

  await pres.writeFile({ fileName: outFile });
  console.log(`\n✓ Wrote ${outFile}  (${files.length - errors.length}/${files.length} slides, 편집 가능 PPTX)`);
}

main().catch(e => { console.error(e); process.exit(1); });
