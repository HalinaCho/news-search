# TechPulse

AI·로봇 등 미래 기술 키워드로 네이버 뉴스를 검색하는 작은 웹 앱이다.
[PRD](./PRD_네이버뉴스검색사이트.md)에 정의된 요구사항을 Next.js App Router로 구현했다.

**배포된 사이트 → https://news-search-zeta.vercel.app/**

- **검색(`/`)** — 카테고리 탭(기술트렌드·주식·크립토) 아래 키워드 칩, 정확도순/최신순 정렬, 페이지네이션
- 같은 검색 조합은 30분간 캐시해 호출 한도를 아낀다. 결과 개수 아래 "N분 전 갱신"이 실제 데이터 시각
- 검색 상태(검색어·정렬·페이지)는 URL 쿼리스트링에 그대로 담겨 새로고침해도 유지된다
- 네이버 API 키는 서버 프록시(`/api/news`) 안에서만 쓰이고 브라우저로 나가지 않는다

Google 로 로그인하면 개인화 기능이 붙는다. 로그인하지 않아도 검색은 그대로 쓸 수 있다.

- **읽음 표시** — "원문보기"로 기사를 연 순간 읽음으로 기록된다. 읽은 카드는 흐려지고, 제목 왼쪽 점을 눌러 언제든 되돌릴 수 있다
- **저장함(`/saved`)** — 카드 오른쪽 위 북마크로 담는다. 기사 내용을 통째로 복사해 두므로 검색 결과에서 밀려나도 계속 보인다
- **키워드 편집** — 검색 화면의 카테고리와 키워드 칩을 직접 고친다. 언제든 기본값으로 되돌릴 수 있다
- 계정에 저장되므로 PC에서 읽은 기사가 폰에서도 읽음으로 보인다

## 준비 — 네이버 API 키 발급

검색 API는 네이버 개발자센터(`openapi.naver.com`)에서 **NAVER API HUB**(네이버 클라우드 플랫폼)로 이관됐다.
신규 발급 키는 개발자센터 방식으로는 인증되지 않으니(401), HUB 콘솔에서 발급받아야 한다.

1. [NAVER API HUB](https://www.ncloud.com/product/applicationService/naverApiHub)에서 **검색(Search)** 상품을 신청한다.
2. 발급되는 **API Key ID**와 **API Key**를 받아둔다.

> 개발자센터에서 이미 검색 API를 쓰고 있었다면 한시적으로 기존 방식이 유지된다.
> 그 경우 `src/app/api/news/route.ts`의 엔드포인트를 `https://openapi.naver.com/v1/search/news.json`,
> 헤더를 `X-Naver-Client-Id` / `X-Naver-Client-Secret`으로 되돌리면 된다.

## 준비 — Supabase & Google 로그인

읽음 표시·저장함·키워드 편집을 쓰려면 필요하다. 건너뛰어도 검색 기능은 정상 동작한다.

**1. 스키마 적용** — Supabase 대시보드 > SQL Editor 에 [`supabase/schema.sql`](./supabase/schema.sql)을 붙여넣고 실행한다.
테이블 3개와 RLS 정책이 만들어진다. 여러 번 실행해도 안전하다.

**2. Google OAuth 클라이언트 만들기** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서

- 프로젝트를 고르고 **사용자 인증 정보 > 사용자 인증 정보 만들기 > OAuth 클라이언트 ID**
- 애플리케이션 유형은 **웹 애플리케이션**
- **승인된 리디렉션 URI**에 `https://<프로젝트ref>.supabase.co/auth/v1/callback` 을 넣는다 — 우리 사이트 주소가 아니라 Supabase 주소다
- 만들어진 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사한다

**3. Supabase에 연결** — 대시보드 > Authentication 에서

- **Sign In / Providers > Google** 을 켜고 위의 Client ID / Client Secret 을 넣는다
- **URL Configuration > Redirect URLs** 에 `http://localhost:3000/auth/callback` 과 배포 주소의 `/auth/callback` 을 등록한다

> Supabase 는 이 목록을 **쿼리스트링까지 포함한 전체 URL로** 대조한다. 목록에 `.../auth/callback` 이
> 있어도 `.../auth/callback?next=/` 는 일치로 보지 않고, 그러면 조용히 **Site URL 로 폴백해서**
> 인가 코드가 엉뚱한 주소로 날아간다. 그래서 이 앱은 로그인 후 돌아갈 경로를 쿼리가 아니라
> 쿠키(`tp-auth-next`)로 넘긴다 — 덕분에 허용 목록을 와일드카드 없이 좁게 유지할 수 있다.
> 로그인이 성공했는데 엉뚱한 사이트로 튕긴다면 이 매칭부터 의심한다.

> 처음에는 카카오 로그인으로 붙였다가 Google 로 바꿨다. Supabase 의 카카오 제공자는
> `account_email`·`profile_image`·`profile_nickname` 을 **항상** 요청하고 클라이언트가 넘긴
> `scopes` 는 교체가 아니라 뒤에 덧붙이기만 한다. 앞의 두 항목은 카카오 비즈니스 앱 전환과
> 심사를 거쳐야 켤 수 있어서, 코드로는 `KOE205`(설정하지 않은 동의 항목)를 피할 방법이 없었다.
> 카카오를 다시 쓰려면 비즈앱 전환이 선행돼야 한다.

## 로컬 실행

```bash
npm install

# 환경변수 템플릿을 복사한 뒤 발급받은 값을 채운다.
# ⚠️ 처음 한 번만 실행한다 — 이미 .env.local 이 있다면 빈 템플릿으로 덮여 기존 키가 전부 날아간다.
#    나중에 항목이 추가됐을 때는 복사하지 말고 필요한 줄만 직접 옮겨 적는다.
cp -n .env.local.example .env.local

npm run dev   # http://localhost:3000
```

`.env.local`에 채울 값:

```env
NAVER_API_KEY_ID=발급받은_api_key_id
NAVER_API_KEY=발급받은_api_key

# Supabase 대시보드 > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://프로젝트ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=발급받은_anon_key
```

네이버 키가 비어 있어도 앱은 뜨지만 검색은 실패하고, 서버 콘솔에 환경변수 안내가 찍힌다.
Supabase 값이 비어 있으면 로그인 버튼이 아예 나타나지 않고 검색 기능만으로 동작한다.

## 키를 안전하게 다루는 규칙

- `.env.local`은 `.gitignore`에 걸려 있어 커밋되지 않는다. 저장소에는 값이 빈 `.env.local.example`만 올라간다.
- 키는 `NEXT_PUBLIC_` 접두사 없이 쓴다. 서버 전용 파일인 `src/app/api/news/route.ts` 안에서만 `process.env`로 읽으므로 클라이언트 번들에 포함되지 않는다.
- 실수로 키를 커밋했다면 `git rm --cached`로 추적을 끊는 것만으로는 부족하다. 히스토리에 남은 키는 무효화가 유일한 해결책이니 **HUB 콘솔에서 반드시 재발급**한다.
- Supabase의 `NEXT_PUBLIC_*` 두 값은 성격이 다르다. 브라우저에 노출되는 게 정상이고, 이 키로 할 수 있는 일은 RLS 정책이 허용하는 범위뿐이다. 즉 **이 앱의 데이터 보안은 전적으로 `supabase/schema.sql`의 RLS에 달려 있다** — 대시보드에서 세 테이블의 RLS가 켜져 있는지 반드시 확인한다. `service_role` 키는 이 앱 어디에서도 쓰지 않으며, 절대 `NEXT_PUBLIC_`으로 두면 안 된다.

## 배포

Vercel에 올라가 있다 — https://news-search-zeta.vercel.app/

`.env.local` 파일을 업로드하는 게 아니라, Vercel 프로젝트의 **Settings → Environment Variables**에
`.env.local`과 같은 이름으로 네 개를 등록한다 — `NAVER_API_KEY_ID`, `NAVER_API_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. 값을 바꾼 뒤에는 재배포해야 반영된다.

Supabase 쪽에도 배포 주소를 알려줘야 로그인이 돌아온다 — Authentication > URL Configuration 의
Site URL 과 Redirect URLs 에 배포 도메인이 등록돼 있어야 한다.

## 구조

```
src/
├─ proxy.ts               매 요청 Supabase 세션 갱신 (Next 16에서 middleware의 새 이름)
├─ app/
│  ├─ api/news/route.ts   서버 프록시 — 네이버 API 호출, 30분 캐시, 에러 코드 매핑
│  ├─ auth/callback/      Google 로그인 후 인가 코드를 세션으로 교환
│  ├─ page.tsx            검색 화면 (Suspense 경계)
│  ├─ saved/page.tsx      저장함
│  └─ error.tsx           예상치 못한 오류 화면
├─ components/
│  ├─ AuthProvider.tsx    로그인 상태 (Google OAuth)
│  ├─ UserDataProvider.tsx 읽음·북마크·키워드를 한곳에서 관리, 쓰기는 낙관적 업데이트
│  ├─ KeywordEditor.tsx   검색 카테고리와 키워드를 고치는 다이얼로그
│  └─ …                   검색창·키워드 칩·카드·페이지네이션·상태 화면
├─ hooks/useNewsSearch.ts 요청 취소·지수 백오프 재시도·캐시·최소 로딩 시간
└─ lib/
   ├─ supabase/           클라이언트(브라우저·서버)와 쿼리 모음
   └─ …                   타입, 상수, 표시용 포맷터, 에러 메시지
supabase/schema.sql       테이블 3개 + RLS 정책
```

기본 키워드는 `src/lib/constants.ts`의 `KEYWORD_CATEGORIES` 한 곳에서 바꾼다. 로그인한 사용자가
화면에서 고친 값은 `keyword_settings` 테이블에 저장되고, 저장한 적이 없으면 이 기본값으로 되돌아간다.

예전에 `/search`에 있던 검색 화면은 루트로 옮겼다. `/search`는 `next.config.ts`의 리다이렉트로
`/`에 넘겨주며, `query`·`sort`·`page` 쿼리스트링은 Next가 그대로 보존하므로 옛 링크도 살아 있다.

> Next 16에서 `middleware.ts`가 `proxy.ts`로 이름이 바뀌었다. Supabase 공식 문서는 아직
> `middleware.ts` 기준이라 그대로 옮기면 세션이 갱신되지 않아 조용히 로그아웃된다.

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
