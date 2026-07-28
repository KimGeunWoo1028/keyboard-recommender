# 라이트 모드 색상 인벤토리

Source: `frontend/src/app/globals.css` (`:root`) + `frontend/src` 하드코딩 클래스 색  
Design: Precision Editorial light (Manus deep indigo)

---

## 핵심 브랜드 & 면

캔버스 「브랜드 & 면」과 동일한 스와치입니다.

| 스와치 | 라벨 | HEX | RGB |
|--------|------|-----|-----|
| ![Primary](assets/color-swatches/primary.png) | Primary | `#372FA3` | `55 48 163` |
| ![Surface](assets/color-swatches/surface.png) | Surface | `#FFFFFF` | `255 255 255` |
| ![Page wash](assets/color-swatches/page-wash.png) | Page wash | `#F8F8FC` | `248 248 252` |
| ![Neutral wash](assets/color-swatches/neutral-wash.png) | Neutral wash | `#F8F9FA` | `248 249 250` |
| ![Card border](assets/color-swatches/card-border.png) | Card border | `#DCDCEE` | `220 220 238` |
| ![Ink / footer](assets/color-swatches/ink-footer.png) | Ink / footer | `#0F0F19` | `15 15 25` |
| ![Indigo tint](assets/color-swatches/indigo-tint.png) | Indigo tint | `#EEEBFF` | `238 235 255` |
| ![Emerald](assets/color-swatches/emerald.png) | Emerald | `#10B981` | `16 185 129` |
| ![Gold](assets/color-swatches/gold.png) | Gold | `#F59E0B` | `245 158 11` |

Primary는 CSS 주석 기준 Manus deep indigo `#3730A3`에 대응. 토큰 값은 RGB `55 48 163` → `#372FA3`.

---

## 1. 디자인 토큰 (`:root`)

`globals.css`의 space-separated RGB. Tailwind는 `bg-primary`, `text-ca-on-surface` 등으로 참조.

| Token | HEX | RGB | 역할 | 어디에 |
|-------|-----|-----|------|--------|
| `--background` / `--ca-background` | `#FFFFFF` | `255 255 255` | 페이지 기본 배경 | body 배경, 카탈로그 루트 `bg-white`/`bg-ca-*` 계열 |
| `--foreground` / `--ca-on-background` / `--ca-on-surface` / `--ca-base` | `#0F0F19` | `15 15 25` | 기본 본문·제목 텍스트 | `text-ca-on-surface`, `text-foreground`, 헤더 워드마크 |
| `--card` / `--ca-surface` / `--ca-surface-bright` / `--ca-surface-container-lowest` | `#FFFFFF` | `255 255 255` | 카드·패널 면 | 헤더/카드 `bg-white`, `bg-ca-surface`, 결과·마이페이지 카드 |
| `--primary` / `--ca-primary` / `--ring` / `--focus-ring` / `--ca-surface-tint` | `#372FA3` | `55 48 163` | 브랜드 프라이머리 (Manus indigo ≈ `#3730A3`) | CTA `bg-primary`, 링크, 포커스 링, 좌측 액센트 보더, 홈 CTA 밴드 |
| `--primary-foreground` / `--ca-on-primary` | `#FFFFFF` | `255 255 255` | 프라이머리 위 글자 | Primary 버튼 라벨 |
| `--ca-primary-container` | `#4F46E5` | `79 70 229` | 프라이머리 컨테이너(밝은 인디고) | 강조 칩/컨테이너 배경 계열 |
| `--ca-on-primary-container` | `#EEEBFF` | `238 235 255` | 프라이머리 컨테이너 위 글자 | 인디고 컨테이너 안 텍스트 |
| `--ca-inverse-primary` | `#A5B4FC` | `165 180 252` | 역전 프라이머리(연한 인디고) | 다크 대비용 토큰(라이트에서도 정의됨) |
| `--secondary` / `--ca-secondary` / `--ca-viz-gold` | `#F59E0B` | `245 158 11` | 앰버/골드 액센트 | 보조 강조, 비주얼 골드 |
| `--secondary-foreground` / `--ca-on-secondary` | `#0F0F19` | `15 15 25` | 세컨더리 위 글자 | 골드 면 위 텍스트 |
| `--ca-secondary-container` | `#FDE68A` | `253 230 138` | 세컨더리 컨테이너 | 앰버 칩/배지 배경 |
| `--ca-on-secondary-container` | `#784600` | `120 70 0` | 세컨더리 컨테이너 글자 | 앰버 배지 텍스트 |
| `--muted` | `#F5F5FC` | `245 245 252` | 뮤트 면 | `bg-muted`, ghost/secondary hover |
| `--muted-foreground` | `#5A5A78` | `90 90 120` | 보조 텍스트 | `text-muted-foreground`, 네비 비활성 |
| `--border` | `#DCDCEB` | `220 220 235` | 기본 보더 | `border-border`, 입력/카드 테두리 |
| `--ca-surface-dim` / `--ca-surface-variant` | `#EEEEF8` | `238 238 248` | 약간 어두운 표면 | 딤 서피스, 변형 면 |
| `--ca-surface-container-low` | `#F8F8FC` | `248 248 252` | 페이지·섹션 바탕(연보라 크림) | `bg-ca-surface-container-low`, 결과/마이페이지 페이지 배경 |
| `--ca-surface-container` | `#F3F3FC` | `243 243 252` | 컨테이너 면 | `bg-ca-surface-container` |
| `--ca-surface-container-high` | `#EBEBFA` | `235 235 250` | 높은 컨테이너 | 계층형 패널 |
| `--ca-surface-container-highest` | `#E1E1F5` | `225 225 245` | 가장 높은 컨테이너 | 헤더 검색 등 elevated 컨트롤 |
| `--ca-on-surface-variant` | `#50506E` | `80 80 110` | 보조 본문 | `text-ca-on-surface-variant`, 설명문·캡션 |
| `--ca-inverse-surface` | `#141428` | `20 20 40` | 역전 면(거의 검정 인디고) | 인버스 서피스 |
| `--ca-inverse-on-surface` | `#F5F5FF` | `245 245 255` | 역전 면 위 글자 | 인버스 텍스트 |
| `--ca-outline` | `#8C8CAA` | `140 140 170` | 아웃라인 | 강한 윤곽선 |
| `--ca-outline-variant` | `#D2D2E6` | `210 210 230` | 약한 아웃라인 | 키캡 뱃지 하단 쉐도우 등 |
| `--ca-tertiary` / `--ca-viz-emerald` | `#10B981` | `16 185 129` | 에메랄드(성공/비주얼) | `text-ca-viz-emerald`, 성공 안내 |
| `--ca-on-tertiary` | `#FFFFFF` | `255 255 255` | 터셔리 위 글자 | 에메랄드 면 위 텍스트 |
| `--ca-tertiary-container` | `#A7F3D0` | `167 243 208` | 터셔리 컨테이너 | 연한 그린 배지 |
| `--ca-on-tertiary-container` | `#005032` | `0 80 50` | 터셔리 컨테이너 글자 | 그린 배지 텍스트 |
| `--ca-error` | `#DC2626` | `220 38 38` | 에러 | `text-destructive`/`ca-error`, 폼 에러 |
| `--ca-on-error` | `#FFFFFF` | `255 255 255` | 에러 면 위 글자 | 에러 버튼 |
| `--ca-error-container` | `#FEE2E2` | `254 226 226` | 에러 컨테이너 | 연한 레드 배경 |
| `--ca-on-error-container` | `#991B1B` | `153 27 27` | 에러 컨테이너 글자 | 에러 안내문 |
| `--ca-ghost-border` (+ opacity 0.1) | `#0F0F19` | `15 15 25 @ 10%` | 고스트 보더 | 얇은 구분선 |
| `--ca-glass-fill` (+ opacity 0.92) | `#FFFFFF` | `255 255 255 @ 92%` | 글래스 패널 채움 | `.ca-glass-panel` |
| `--ca-input-fill` | `#FFFFFF` | `255 255 255` | 인풋 배경 | `.ca-input` |

---

## 2. 하드코딩 라이트 색 (클래스 리터럴)

토큰 대신 `bg-[rgb(...)]` / `bg-[#...]`로 박힌 값. 다크에서는 대체로 `dark:` 페어가 있음.

| HEX | RGB | 역할 | 적용 위치 |
|-----|-----|------|-----------|
| `#F8F8FC` | `248 248 252` | 페이지/셸 연보라 바탕 (토큰 surface-container-low와 동일) | auth 로그인·가입·비번찾기·리셋 / account-deleted / mypage / results / manus-secondary-shell / debug layout / mypage 섹션 헤더·비활성 인풋 / results matching table 헤더 / mypage overview 헤더 |
| `#F8F9FA` | `248 249 250` | 중립 연회색 섹션 바탕 (토큰과 미세 차이) | 홈 process/parts 섹션 / catalog browse 상단·필터·빈상태 / survey-page-shell / results-page-shell / results shared reasons / results retake 버튼 / home workshop guest / mypage saved chips |
| `#FFFFFF` | `255 255 255` | 카드·헤더·면 (대부분 `bg-white`) | 사이트 헤더 / 인증 카드 / 카탈로그·결과·마이페이지 카드 / 홈 스위치 가이드 카드 등 전역 |
| `#DCDCEE` | `220 220 238` | 카드·구분 보더 (토큰 `--border` 220 220 235와 거의 같음) | auth/signup 카드·OTP 빈칸·진행바 / manus-surface-card / mypage hub·overview·section-card / results datasheet·matching·shared header / catalog 카드 / survey 옵션 / privacy·terms·terminology-demo / debug layout |
| `#EEEBFF` | `238 235 255` | 연한 인디고 칩/콜아웃 (≈ on-primary-container) | results evidence confidence callout / overview datasheet 칩 / mypage overview 칩 |
| `#EEF2FF` | `238 242 255` | 히어로 우측 인디고 워시 | home hero `from-[#EEF2FF]` |
| `#0F0F19` | `15 15 25` | 푸터 거의-검정 (토큰 on-surface와 동일) | site-footer `bg-[rgb(15_15_25)]` |
| `#646478` | `100 100 120` | 섹션 라벨(대문자 트래킹) | privacy / terms / terminology-demo / mypage overview·section-card 헤더 라벨 |
| `#828296` | `130 130 150` | 아주 작은 캡션/메타 | results datasheet 라벨 / compare build 캡션 / mypage overview 라벨 |
| `#505064` | `80 80 100` | 보조 본문 (토큰 on-surface-variant와 근접) | results compare / confidence callout / datasheet 배지 텍스트 |
| `#3C3C50` | `60 60 80` | 표·리스트 라벨(조금 더 진함) | results matching table / mypage overview 행 라벨·최근 저장 제목 |
| `#94A3B8` / `#64748B` / `#475569` | slate-400/500/600 | 레이아웃 다이어그램 스트로크(고정) | `layout-diagram.tsx` (카탈로그 배열 도면) — LOCK 대상 지오메트리와 함께 고정 색 |

---

## 3. Tailwind 시맨틱 → 라이트 HEX

| 유틸 | 라이트 HEX | 용도 |
|------|------------|------|
| `bg-primary` / `text-primary` | `#372FA3` (`55 48 163`) | 버튼·링크·액센트 |
| `bg-background` / `text-foreground` | `#FFFFFF` / `#0F0F19` | 페이지·본문 |
| `bg-muted` / `text-muted-foreground` | `#F5F5FC` / `#5A5A78` | 비활성·보조 |
| `border-border` | `#DCDCEB` | 기본 테두리 |
| `bg-card` | `#FFFFFF` | 카드 |
| `text-destructive` | 에러 계열 ≈ `#DC2626` | 폼 에러 |
| `ca-viz-emerald` | `#10B981` | 성공·체크 |
| `ca-viz-gold` | `#F59E0B` | 골드 강조 |

---

## 그림자·글로우 (라이트)

| Token | 값 |
|-------|-----|
| `--ca-elevated-shadow` | `0 1px 3px rgb(15 15 25 / 0.08), 0 8px 24px rgb(55 48 163 / 0.08)` |
| `--ca-btn-glow` | `0 8px 24px rgb(55 48 163 / 0.25)` |
| `--ca-focus-glow` | `0 0 0 3px rgb(55 48 163 / 0.2)` |

---

## 참고

`bg-white` / `text-white` / Tailwind palette(`indigo-50`, `amber-*`, `emerald-*`, `red-*`)도 라이트 UI에 다수 사용됩니다. 이 문서는 브랜드 토큰 + 프로젝트에 박아 둔 커스텀 HEX/RGB 중심입니다.
