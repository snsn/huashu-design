# 한국어 우선 로컬라이제이션 인벤토리

## 완료

- `SKILL.md`를 한국어 우선 운용 가이드로 재작성했다.
- `README.md`를 한국어 기본 README로 교체했다.
- `test-prompts.json`을 한국어 테스트 프롬프트로 교체했다.
- 핵심 런타임 에셋 주석과 배너 텍스트 일부를 한국어로 전환했다.
- `scripts/verify.py`, `scripts/render-video.js`, `scripts/export_deck_*.mjs`의 도움말/오류 경로를 한국어 우선으로 조정했다.

## 부분 완료

- 대표 데모의 위험한 DOM 삽입은 제거했지만, 데모 본문 텍스트 전체 한국어화는 아직 완료되지 않았다.
- `README.en.md`는 영어 호환 문서로 남겼고, 한국어 포크 안내만 반영했다.

## 남은 중국어 잔여 영역

- `references/*.md`: upstream 상세 디자인 지식 문서가 대량으로 남아 있다. 핵심 실행 가이드는 `SKILL.md`에서 한국어로 대체했으므로, references는 후속 번역/선별 대상이다.
- `assets/showcases/**`: 샘플 쇼케이스의 중국어 UI 문자열과 CDN 예제가 남아 있다.
- `demos/*`: 기본 데모 중 일부는 아직 중국어 UI 텍스트를 포함한다.
- `LICENSE`: upstream 연락처/라이선스 텍스트 일부가 남아 있다. 법적 의미가 있으므로 별도 라이선스 검토 후 수정해야 한다.

## 우선순위

1. 활성 에이전트 진입점: `SKILL.md`, `README.md`, `test-prompts.json` — 완료.
2. 실행/검증 스크립트: 도움말, 오류, 보안 제한 — 완료.
3. 공유 런타임 에셋: deck/runtime/frame 주석 — 부분 완료.
4. 데모와 references: 잔여 영역이며 후속 대량 번역 필요.
