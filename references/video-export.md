# 영상 export 지침

이 문서는 Huashu Design의 한국어 우선 작업 흐름에서 `video-export.md` 역할을 맡는다.

## 핵심 규칙

- `scripts/render-video.js`는 Playwright 녹화 후 ffmpeg로 MP4를 만든다.
- 입력 HTML은 로컬 파일이어야 하며 ready 신호를 제공해야 한다.
- ffmpeg 인자는 고정 배열로 전달하고 shell 문자열 실행을 사용하지 않는다.

## 보안/현지화 메모

- 사용자에게 보이는 문구는 한국어를 기본으로 작성한다.
- 외부 CDN, 원격 폰트, 무결성 없는 스크립트는 새로 추가하지 않는다.
- 동적 데이터는 `textContent` 또는 명시적 DOM 생성으로 렌더링한다.

## 완료 기준

- 결과물이 브라우저에서 열린다.
- 콘솔 오류가 없다.
- 필요한 export 또는 smoke test가 실행된다.
