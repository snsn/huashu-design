# 슬라이드 deck 지침

이 문서는 Huashu Design의 한국어 우선 작업 흐름에서 `slide-decks.md` 역할을 맡는다.

## 핵심 규칙

- 짧은 deck은 단일 `deck_stage.js`, 긴 deck은 `deck_index.html` 다중 파일 구조를 쓴다.
- 한 페이지 한 메시지, 발표용 본문 24px 이상을 지킨다.
- 페이지 번호와 speaker notes는 시각 레이어와 분리한다.

## 보안/현지화 메모

- 사용자에게 보이는 문구는 한국어를 기본으로 작성한다.
- 외부 CDN, 원격 폰트, 무결성 없는 스크립트는 새로 추가하지 않는다.
- 동적 데이터는 `textContent` 또는 명시적 DOM 생성으로 렌더링한다.

## 완료 기준

- 결과물이 브라우저에서 열린다.
- 콘솔 오류가 없다.
- 필요한 export 또는 smoke test가 실행된다.
