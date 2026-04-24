<sub><b>🌐 한국어</b> · <a href="README.en.md">English</a></sub>

<div align="center">

# Huashu Design

> *“한 문장을 입력하면, 전달 가능한 디자인이 나온다.”*

Huashu Design은 에이전트가 HTML을 사용해 고충실도 프로토타입, 발표 슬라이드, 모션 영상, 정보그래픽, 디자인 변형을 제작하도록 돕는 한국어 우선 스킬이다. Figma나 영상 편집기를 대체한다고 주장하지 않는다. 대신 대화형 작업 흐름 안에서 빠르게 보고, 수정하고, export 가능한 결과물을 만드는 데 집중한다.

<br>

**Claude Code, Cursor, Codex, OpenClaw, Hermes 같은 에이전트에서 바로 쓰는 HTML 디자인 스킬입니다.**

3~30분 안에 제품 출시용 모션, 클릭 가능한 앱 프로토타입, 발표 가능한 HTML/PPTX 슬라이드, 인쇄 품질 인포그래픽을 만들 수 있습니다. 브랜드 자산(로고, 색상, UI 스크린샷)을 주면 그 맥락을 읽고, 자산이 없어도 내장된 디자인 원칙과 스타일 라이브러리로 흔한 AI 느낌을 피합니다.

```bash
mkdir -p ~/.codex/skills
cp -R huashu-design ~/.codex/skills/huashu-design
```

[데모](#데모) · [설치](#설치) · [주요 기능](#주요-기능) · [핵심 원칙](#핵심-원칙) · [검증과 보안](#검증과-보안)

</div>

---

## 설치

```bash
mkdir -p ~/.codex/skills
cp -R huashu-design ~/.codex/skills/huashu-design
```

설치 후 에이전트에게 자연어로 요청합니다.

```text
AI 심리학 강연용 피치덱을 만들고, 먼저 3가지 시각 방향을 추천해줘.
Pomodoro 앱 iOS 프로토타입을 만들어줘. 핵심 4개 화면은 실제로 클릭 가능해야 해.
이 개념을 30초 HTML 애니메이션으로 설명하고 MP4 내보내기 준비까지 해줘.
이 디자인을 5개 기준으로 전문가 리뷰해줘.
```

버튼이나 별도 GUI 없이 대화형 워크플로로 동작합니다.

---

## 주요 기능

| 기능 | 산출물 | 일반적인 소요 |
|---|---|---|
| 인터랙티브 프로토타입 | 단일 HTML, 실제 기기 프레임, 클릭 흐름, Playwright 검증 | 10~15분 |
| 슬라이드 deck | 브라우저 발표용 HTML + PDF/PPTX 내보내기 | 15~25분 |
| 모션 디자인 | Stage/Sprite 타임라인, MP4/GIF 렌더 준비 | 8~12분 |
| 디자인 변형 | 3개 이상 방향 비교, Tweaks 실시간 조정 | 10분 |
| 인포그래픽 | 정교한 타이포그래피와 데이터 기반 레이아웃 | 10분 |
| 디자인 방향 추천 | 20개 디자인 철학에서 3개 차별화 방향 제안 | 5분 |
| 전문가 리뷰 | 레이더 차트, Keep/Fix/Quick Wins 목록 | 3분 |

---

## 데모

저장소의 `demos/` 폴더에는 앱 프로토타입, 슬라이드, 모션, 인포그래픽, 전문가 리뷰, 브랜드 프로토콜 예제가 들어 있습니다. 한국어 우선 전환 중에도 대표 데모는 브라우저에서 열리고 콘솔 오류 없이 실행되는 것을 목표로 합니다.

- `demos/c1-ios-prototype.html` — iOS 앱 프로토타입
- `demos/c2-slides-pptx.html` — HTML 슬라이드와 PPTX 흐름
- `demos/c3-motion-design.html` — 타임라인 모션 디자인
- `demos/c5-infographic.html` — 데이터 기반 인포그래픽
- `demos/w3-fallback-advisor.html` — 모호한 요청을 위한 디자인 방향 추천

---

## 핵심 원칙

### 1. 디자인 맥락 먼저

고품질 디자인은 빈 화면에서 시작하지 않습니다. 브랜드 가이드, 제품 이미지, UI 스크린샷, 기존 컴포넌트가 있으면 먼저 읽고 색상·간격·타이포그래피·톤을 추출합니다. 특정 제품이나 최신 사양은 기억으로 추측하지 않고 검색으로 확인합니다.

### 2. HTML은 원본 산출물

슬라이드, 애니메이션, 프로토타입의 원본은 HTML입니다. PDF, PPTX, MP4, GIF는 HTML에서 파생되는 전달 형식입니다. 따라서 HTML을 먼저 검증하고 그다음 내보내기를 수행합니다.

### 3. Anti-slop 디자인

흔한 AI 스타일을 피합니다. 의미 없는 보라색 그라데이션, 이모지 아이콘, 둥근 카드+왼쪽 포인트 라인, 실제 제품 사진을 대체하는 CSS 실루엣을 사용하지 않습니다. CSS Grid, 의도 있는 타이포그래피, 실측 기반 색상, 충분한 정보 밀도로 설계합니다.

### 4. 한국어 우선

이 포크는 한국어 사용자를 기본 대상으로 합니다. `SKILL.md`, 스크립트 도움말, 테스트 프롬프트, 핵심 문서는 한국어를 우선합니다. 고유명사, API 이름, 코드 식별자는 영어를 유지합니다.

---

## 검증과 보안

핵심 런타임은 다음 기준을 따릅니다.

- 사용자 입력과 매니페스트 라벨은 HTML로 해석하지 않고 `textContent` 또는 DOM API로 삽입합니다.
- `ffmpeg` 같은 외부 실행은 고정된 명령과 검증된 숫자/경로 인자만 허용합니다.
- 원격 CDN과 폰트는 데모 편의 목적으로만 남기고, 핵심 런타임은 로컬 폰트 스택을 우선합니다.
- 새 창 외부 링크에는 `rel="noopener noreferrer"`를 사용합니다.

대표 검증 명령:

```bash
node --check scripts/render-video.js
node scripts/export_deck_pdf.mjs --help
node scripts/export_deck_stage_pdf.mjs --help
node scripts/export_deck_pptx.mjs --help
python3 scripts/verify.py demos/w3-fallback-advisor.html --wait 500
```

의존성이 설치되지 않은 환경에서는 문법 검사와 도움말 경로를 우선 확인하고, Playwright 기반 브라우저 검증은 가능한 환경에서 수행합니다.

---

## 라이선스

이 저장소는 개인 사용 라이선스 정책을 따릅니다. 자세한 내용은 [LICENSE](LICENSE)를 확인하세요.
