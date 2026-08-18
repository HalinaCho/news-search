# TechPulse

AI·로봇 등 미래 기술 키워드로 네이버 뉴스를 검색하는 작은 웹 앱이다.
[PRD](./PRD_네이버뉴스검색사이트.md)에 정의된 요구사항을 Next.js App Router로 구현했다.

- 인기 키워드 칩으로 한 번에 검색, 정확도순/최신순 정렬
- 검색 상태(검색어·정렬·페이지)는 URL 쿼리스트링에 그대로 담겨 새로고침해도 유지된다
- 네이버 API 키는 서버 프록시(`/api/news`) 안에서만 쓰이고 브라우저로 나가지 않는다

## 준비 — 네이버 API 키 발급

검색 API는 네이버 개발자센터(`openapi.naver.com`)에서 **NAVER API HUB**(네이버 클라우드 플랫폼)로 이관됐다.
신규 발급 키는 개발자센터 방식으로는 인증되지 않으니(401), HUB 콘솔에서 발급받아야 한다.

1. [NAVER API HUB](https://www.ncloud.com/product/applicationService/naverApiHub)에서 **검색(Search)** 상품을 신청한다.
2. 발급되는 **API Key ID**와 **API Key**를 받아둔다.

> 개발자센터에서 이미 검색 API를 쓰고 있었다면 한시적으로 기존 방식이 유지된다.
> 그 경우 `src/app/api/news/route.ts`의 엔드포인트를 `https://openapi.naver.com/v1/search/news.json`,
> 헤더를 `X-Naver-Client-Id` / `X-Naver-Client-Secret`으로 되돌리면 된다.

## 로컬 실행

```bash
npm install

# 환경변수 템플릿을 복사한 뒤 발급받은 값을 채운다
cp .env.local.example .env.local

npm run dev   # http://localhost:3000
```

`.env.local`에 채울 값:

```env
NAVER_API_KEY_ID=발급받은_api_key_id
NAVER_API_KEY=발급받은_api_key
```

키가 비어 있어도 앱은 뜨지만 검색은 실패하고, 서버 콘솔에 환경변수 안내가 찍힌다.

## 키를 안전하게 다루는 규칙

- `.env.local`은 `.gitignore`에 걸려 있어 커밋되지 않는다. 저장소에는 값이 빈 `.env.local.example`만 올라간다.
- 키는 `NEXT_PUBLIC_` 접두사 없이 쓴다. 서버 전용 파일인 `src/app/api/news/route.ts` 안에서만 `process.env`로 읽으므로 클라이언트 번들에 포함되지 않는다.
- 실수로 키를 커밋했다면 `git rm --cached`로 추적을 끊는 것만으로는 부족하다. 히스토리에 남은 키는 무효화가 유일한 해결책이니 **HUB 콘솔에서 반드시 재발급**한다.

## 배포

Vercel 등에 올릴 때는 `.env.local` 파일을 업로드하는 게 아니라, 호스팅 플랫폼의 **환경변수 설정 화면**에
`NAVER_API_KEY_ID` / `NAVER_API_KEY`를 같은 이름으로 등록한다.

## 구조

```
src/
├─ app/
│  ├─ api/news/route.ts   서버 프록시 — 네이버 API 호출과 에러 코드 매핑
│  ├─ page.tsx            Suspense 경계
│  └─ error.tsx           예상치 못한 오류 화면
├─ components/            검색창·키워드 칩·카드·페이지네이션·상태 화면
├─ hooks/useNewsSearch.ts 요청 취소·재시도·캐시·최소 로딩 시간
└─ lib/                   타입, 상수, 표시용 포맷터, 에러 메시지
```

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
