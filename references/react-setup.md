# React/Babel 사용 지침

이 문서는 Huashu Design의 한국어 우선 작업 흐름에서 `react-setup.md` 역할을 맡는다.

## 핵심 규칙

- 가능하면 순수 HTML/CSS/JS와 starter assets를 우선한다.
- React UMD가 꼭 필요하면 버전과 integrity를 고정하고 사용 이유를 문서화한다.
- 외부 API 키나 비밀값을 HTML에 넣지 않는다.
- 데모 코드에서 외부 API 호출 예시는 mock 데이터로 대체한다.

## 보안/현지화 메모

- 사용자에게 보이는 문구는 한국어를 기본으로 작성한다.
- 외부 CDN, 원격 폰트, 무결성 없는 스크립트는 새로 추가하지 않는다.
- 동적 데이터는 `textContent` 또는 명시적 DOM 생성으로 렌더링한다.

## 완료 기준

- 결과물이 브라우저에서 열린다.
- 콘솔 오류가 없다.
- 필요한 export 또는 smoke test가 실행된다.
