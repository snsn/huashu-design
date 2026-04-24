# 보안 감사 기록

## 이번 변경에서 완화한 항목

| 영역 | 조치 | 파일 |
|---|---|---|
| 동적 HTML 삽입 | 문자열 기반 DOM 삽입으로 구현된 카운터/라벨/데모 셀/JSON 표시를 `textContent`, `replaceChildren`, DOM 생성 방식으로 변경 | `assets/deck_index.html`, `assets/deck_stage.js`, `demos/w3-fallback-advisor*.html`, `demos/c5-infographic*.html` |
| Shadow DOM 템플릿 | `<deck-stage>`의 정적 HTML 문자열 삽입을 DOM API 생성으로 변경 | `assets/deck_stage.js` |
| 영상 렌더 외부 실행 | HTML 파일 존재/확장자, 숫자 인자 범위, trim 범위, ffmpeg 실행 cwd를 제한 | `scripts/render-video.js` |
| 도움말 스모크 테스트 | 선택 의존성이 없어도 `--help`가 먼저 동작하도록 export 스크립트의 heavy import를 동적 import로 이동 | `scripts/export_deck_*.mjs` |
| 원격 폰트 최소화 | 배너 SVG의 Google Fonts `@import` 제거 | `assets/banner.svg` |

## 남아 있는 항목과 판단

- `scripts/render-video.js`는 MP4 인코딩을 위해 `ffmpeg`를 실행한다. 명령명은 고정되어 있고 인자는 검증된 숫자와 로컬 파일 경로로 제한했다.
- `assets/showcases/**`와 일부 `demos/**`에는 Google Fonts와 `unpkg` 예제가 남아 있다. 이들은 쇼케이스/데모 편의용이며 핵심 런타임(`SKILL.md`, `assets/deck_*`, export scripts)은 원격 의존 없이 시작할 수 있게 정리했다.
- `references/react-setup.md`에는 CDN 예제가 남아 있다. 고정 버전과 SRI를 설명하는 문서 예시이므로 즉시 제거하지 않고 후속 한국어 문서화 대상으로 둔다.
- 외부 README 배지/이미지는 문서 장식용이다. 릴리스 자산을 로컬화하려면 별도 아카이빙 작업이 필요하다.

## 권장 후속 작업

1. `assets/showcases/**`의 CDN 스크립트와 폰트를 로컬 fallback 또는 SVG 아이콘으로 대체한다.
2. 오래된 upstream 개인 링크와 중국어 전용 데모를 보존용 archive로 이동하거나 한국어 버전으로 교체한다.
3. CI에서 문자열 기반 DOM 삽입 패턴 검색과 원격 도메인 inventory를 주기적으로 실행한다.
