# 한국어 번역 스타일 가이드

## 원칙

- 기본 문체는 간결한 존댓말 대신 **작업 지시형 평서문**을 사용한다.
- 사용자-facing 문구, 오류, 도움말, README, 테스트 프롬프트는 한국어를 우선한다.
- API, 파일명, 함수명, CSS 속성, 명령어, 제품명은 영어 원문을 유지한다.
- “AI slop”, “deck”, “prototype”, “Tweaks”처럼 프로젝트에서 의미가 고정된 용어는 필요할 때 영어를 병기한다.
- 중국어 고유명 또는 upstream 출처는 활성 런타임 경로에서 제거하고, 보존이 필요하면 감사 문서에 이유를 남긴다.

## 용어표

| 원문 | 한국어 |
|---|---|
| slide deck | 슬라이드 deck |
| prototype | 프로토타입 / 원형 |
| motion design | 모션 디자인 |
| infographic | 인포그래픽 |
| design direction | 디자인 방향 |
| fallback advisor | 방향 추천 모드 |
| expert review | 전문가 리뷰 |
| render/export | 렌더링 / 내보내기 |
| high-fidelity | 고충실도 |
| anti-slop | AI 느낌 방지 / anti-slop |

## 코드 주석

- 동작 설명 주석은 한국어로 작성한다.
- 표준 API 이름은 번역하지 않는다. 예: `MutationObserver`, `localStorage`, `requestAnimationFrame`.
- 보안 관련 주석은 “왜 제한하는지”를 함께 적는다.
