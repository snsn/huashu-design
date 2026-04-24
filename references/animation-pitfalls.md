# 애니메이션 실패 방지

이 문서는 Huashu Design의 한국어 우선 작업 흐름에서 `animation-pitfalls.md` 역할을 맡는다.

## 핵심 규칙

- 첫 프레임 검은 화면을 막기 위해 `window.__ready = true`를 사용한다.
- requestAnimationFrame의 이전 timestamp를 폰트 로딩 이후에 초기화한다.
- recording 상태에서는 loop를 끄고 마지막 프레임에서 멈춘다.
- 컨트롤 UI에는 `.no-record` 또는 `data-record="hidden"`을 사용한다.

## 보안/현지화 메모

- 사용자에게 보이는 문구는 한국어를 기본으로 작성한다.
- 외부 CDN, 원격 폰트, 무결성 없는 스크립트는 새로 추가하지 않는다.
- 동적 데이터는 `textContent` 또는 명시적 DOM 생성으로 렌더링한다.

## 완료 기준

- 결과물이 브라우저에서 열린다.
- 콘솔 오류가 없다.
- 필요한 export 또는 smoke test가 실행된다.
