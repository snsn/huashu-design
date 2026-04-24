# 편집 가능한 PPTX 제약

이 문서는 Huashu Design의 한국어 우선 작업 흐름에서 `editable-pptx.md` 역할을 맡는다.

## 핵심 규칙

- 텍스트는 `p` 또는 heading 태그 안에 둔다.
- 텍스트 요소 자체에는 background, border, shadow를 직접 주지 않는다.
- CSS gradient와 background-image는 PPTX 변환에서 피한다.
- 시각 자유도가 우선이면 PPTX 대신 PDF export를 사용한다.

## 보안/현지화 메모

- 사용자에게 보이는 문구는 한국어를 기본으로 작성한다.
- 외부 CDN, 원격 폰트, 무결성 없는 스크립트는 새로 추가하지 않는다.
- 동적 데이터는 `textContent` 또는 명시적 DOM 생성으로 렌더링한다.

## 완료 기준

- 결과물이 브라우저에서 열린다.
- 콘솔 오류가 없다.
- 필요한 export 또는 smoke test가 실행된다.
