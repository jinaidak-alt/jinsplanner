# index.html 코드 분석 보고서

## 요약

`index.html`(구 `daily_routine.html`)은 단일 HTML 파일로 구성된 개인 할 일 관리 앱입니다. Daily·Weekly·Monthly·Area 네 가지 뷰, 반복 할 일(루틴)과 단발 태스크 관리, 카테고리 관리, localStorage 기반 데이터 저장 기능이 완성되어 있습니다. Firebase Authentication(Google·Apple 로그인)과 Firestore를 통한 클라우드 데이터 동기화, 브라우저 알림 + iOS 네이티브 푸시 알림(하루 요약·할 일별 알림), 드래그 앤 드롭 순서 변경, 데스크탑(1024px) 최적화, PWA + iOS 네이티브 앱(WKWebView) 지원까지 추가되었습니다. **배포는 Firebase Hosting (`jinsplanner.web.app`) 단일화** (2026-04-24).

> 📌 Claude Code 세션 지침은 [CLAUDE.md](CLAUDE.md)에 분리되어 있습니다. QA 이슈 트래킹은 [20260424_QA_report.md](20260424_QA_report.md).

---

## 1. 파일 구조

단일 HTML 파일로 HTML·CSS·JavaScript가 모두 인라인으로 작성되어 있으며 외부 의존성이 없습니다.

```
index.html
├── <head>
│   ├── 메타 정보 (charset, viewport, title)
│   └── <style> — 인라인 CSS
│       ├── 기본 레이아웃 (탭 바, 뷰, 카드, 네비게이션)
│       ├── Daily 할 일 아이템
│       ├── Weekly 컬럼 레이아웃 + 고양이 러너 (.cat-runner)
│       ├── Monthly 캘린더
│       ├── 날짜 상세 패널 (슬라이드업)
│       ├── 인라인 추가 버튼 (.add-task-btn) 및 관리 FAB (.fab-sub)
│       ├── 모달 (추가/관리)
│       ├── 노트 카드
│       ├── 태스크 타입 토글 / 시간대 선택 / D-day 뱃지
│       └── Area 뷰 (.proj-filter, .proj-cat-block, .dday-badge 등)
└── <body>
    ├── .app-header — 앱 헤더
    ├── .tab-bar — 탭 네비게이션 (Daily / Weekly / Monthly / Area)
    ├── #view-daily — Daily 뷰
    │   ├── #overdue-section — 미완료 태스크 이월 섹션
    │   ├── #urgent-section — 오늘/내일 마감 긴급 섹션
    │   ├── #note-card — 오늘의 한마디
    │   ├── #daily-list — 루틴 목록
    │   ├── #daily-tasks-section — 오늘의 태스크 목록
    │   └── #btn-add — 할 일 추가 인라인 버튼 (할 일 목록 하단)
    ├── #view-weekly — Weekly 뷰 (고양이 러너 + 7일 컬럼 그리드)
    ├── #view-monthly — Monthly 뷰
    ├── #view-project — Area 뷰 (카테고리 필터 + 태스크/루틴 블록)
    ├── FAB 버튼 (관리 전용, #btn-manage)
    ├── #detail-panel — 날짜 상세 패널
    ├── #modal-add — 할 일 추가/수정 모달 (루틴/태스크 타입 토글 포함)
    ├── #modal-manage — 관리 모달 (카테고리 인라인 편집 포함)
    └── <script> — 인라인 JavaScript
        ├── 상수 (DAY_KR, DAY_MON, PALETTE, QUOTES, DEFAULT_CATS, SLOT_LABEL)
        ├── 상태 변수
        ├── localStorage 헬퍼 함수
        ├── 날짜 헬퍼 함수
        ├── 루틴 헬퍼 함수
        ├── 태스크 헬퍼 함수 (단발 태스크, 스킵)
        ├── 이월/긴급 섹션 렌더링 함수
        ├── 렌더링 함수 (Daily / Weekly / Monthly / Area)
        ├── 날짜 상세 패널 함수
        ├── 모달 함수 (추가·수정·삭제·관리)
        └── 이벤트 바인딩 및 초기화
```

---

## 2. 완성된 기능

| **구분** | **기능** | **비고** |
|---|---|---|
| **뷰** | Daily 뷰 | 날짜 이전/다음 이동, 진행률 바 |
| | Weekly 뷰 | 월~일 컬럼, 주간 달성률, 고양이 러너 애니메이션 |
| | Monthly 뷰 | 달력, 날짜별 달성률 색상, 할 일별 통계 테이블 |
| | Area 뷰 | 카테고리 필터, 루틴+태스크 통합 목록, D-day 뱃지 |
| **루틴 (반복)** | 추가 / 수정 / 삭제 | 이름, 시간, 카테고리, 반복 설정 |
| | 반복 설정 | 매일 / 요일 선택 / 날짜 지정 |
| | 완료 토글 | Daily·Weekly·Monthly 상세 패널에서 모두 가능 |
| | 시간순 자동 정렬 | 시작 시간 기준 |
| | 당일 스킵 | 특정 날짜에만 루틴 제외 (🚫 버튼) |
| | 삭제 범위 선택 시트 | 루틴 삭제 시 오늘만 / 오늘부터 / 전체 중 선택 |
| | 반복 할일 수정 범위 선택 | 수정 버튼 탭 시 "전체 수정 / 오늘부터 변경 / 오늘만 수정" 선택 다이얼로그 / 오늘만 수정: 해당 날짜를 루틴 `excludedDates`에 추가 + 수정 내용을 일회성 테스크로 저장 / 오늘부터 변경: 원 루틴 `endDate`를 어제로 + 오늘부터 새 루틴 생성 / 전체 수정: 기존 루틴 편집 동작 유지 |
| | 편집 모달 종료일 필드 | 루틴 수정 시 시작일과 함께 종료일(선택) 입력 가능 |
| | 종료된 루틴 복구 | 관리 모달 "종료된 반복 할일" 섹션에서 복구 버튼 (endDate 제거) |
| **태스크 (단발)** | 추가 / 수정 / 삭제 | 이름, 시간, 카테고리, 마감일, 시간대(오전/오후/저녁) |
| | 완료 토글 | Daily 뷰에서 가능 |
| | 이월 섹션 | 마감일 초과 미완료 태스크 Daily 상단에 자동 표시 |
| | 긴급 섹션 | 오늘/내일 마감 태스크 Daily 상단에 자동 표시 |
| | 기간 테스크 | 시작일~종료일 사이 모든 날짜에 표시 (`taskVisibleOnDate`) |
| | 종료일 미설정 시 자동 설정 | 종료일 비우면 시작일과 동일하게 저장 |
| | 하루짜리 자동 알림 | 시작일=종료일 + 시간 미설정 → 해당일 09:00 자동 알림 |
| | 종료일 < 시작일 차단 | submit 시 alert로 입력 차단 |
| **카테고리** | 추가 / 수정 / 삭제 | 관리 화면에서 이름 직접 입력 + 10색 팔레트 선택 |
| | 기본 카테고리 제공 | 집안일, 업무, 건강, 공부, 기타 |
| | 순서 변경 | 관리 화면에서 ↑↓ 버튼으로 순서 조정 |
| **노트** | 오늘의 한마디 | 클릭 편집, Ctrl/Cmd+Enter 저장, 날짜별 저장 |
| **UI** | 날짜 상세 패널 | Monthly 캘린더에서 날짜 클릭 시 슬라이드업 |
| | 완료 배너 + 격려 문장 | 당일 할 일 100% 완료 시 표시, 150개 문장 중 날짜 기반으로 1개 선택 |
| | 데스크탑 최적화 | 전체 탭 max-width 1024px 통일 (모바일·데스크탑 공용) |
| | Weekly 뷰 할 일 추가 버튼 | 컬럼 그리드 하단에 Daily 뷰와 동일한 스타일의 ＋ 할 일 추가 버튼 추가 |
| | "할 일 추가" 버튼 항상 노출 | 할 일이 많아 화면에 꽉 차도 버튼이 뷰포트 하단에 sticky 고정 (`position:sticky;bottom:16px`) / 플로팅 느낌의 shadow 추가 |
| | "오늘로" 버튼 | 다른 날짜로 이동 시 날짜 레이블 옆에 표시, 오늘이면 자동 숨김 |
| | 로그인 에러 표시 | 로그인 실패 시 화면 상단에 에러 메시지 표시 (`#auth-error`) |
| | PWA 설치 프롬프트 | `beforeinstallprompt` 캐치 → 설정 모달에 "📱 홈 화면에 추가" 버튼 노출 (Chrome/Edge 계열) |
| | 토/일 요일 색상 | Weekly 헤더·Monthly 헤더·Monthly 날짜 숫자·Daily 날짜 레이블 모두 토요일 파란색(`#3b82f6`), 일요일/공휴일 빨간색(`#ef4444`) |
| | 대한민국 공휴일 표시 | Weekly 헤더 및 Monthly 셀에 공휴일 이름 작은 빨간 텍스트로 표시 (고정 공휴일 + 음력 기반 2024–2028 사전 계산) |
| | 정렬 토글 (시간순/영역순) | Daily 루틴 목록 상단에 토글 버튼 제공 / 시간순: `time.start` 오름차순 / 영역순: 카테고리별 그룹 헤더로 표시 / Weekly 뷰 컬럼에도 동일 적용 / 선택 모드 localStorage 저장 |
| **드래그 앤 드롭** | Daily 루틴 순서 변경 | 루틴 아이템 드래그로 순서 변경, `routineOrder` localStorage에 저장 |
| | Daily 태스크 순서 변경 | 시간대(오전/오후/저녁) 내 태스크 드래그로 순서 변경, `taskOrder`에 저장 |
| | Weekly 날짜 간 태스크 이동 | Weekly 뷰에서 태스크를 다른 날짜 컬럼으로 드래그하여 날짜 변경 |
| **데이터** | localStorage 저장 | 루틴·카테고리·체크·노트·태스크·알림설정·루틴순서·태스크순서·정렬모드 각각 분리 저장 (skips는 excludedDates로 통합되어 레거시 호환만) |
| | 완료 기록 날짜 범위 초기화 | 날짜 범위 지정 후 해당 기간의 체크 기록 일괄 삭제 |
| | 체크 자동 정리 | 120일 초과 시 오래된 데이터 자동 삭제 |
| | 로컬·클라우드 충돌 선택 | 로그인 시 로컬과 클라우드 데이터가 다르면 merge-sheet("이 기기 📱 vs 클라우드 ☁️")로 사용자 선택 |
| | 전체 초기화 시 Firestore 동반 삭제 | 클라우드 문서 `users/{uid}` 삭제 후 로컬 초기화 (재로그인 복원 방지). 정렬 모드(`dailySortMode`)는 보존 |
| **인증·동기화** | Google 로그인 | Firebase Authentication — 구글 계정으로 리다이렉트 로그인/로그아웃 |
| | Firestore 클라우드 동기화 | 로그인 시 자동 로드, 데이터 변경 시 자동 저장 |
| **알림** | 브라우저 알림 권한 요청 | 앱 첫 실행 시 알림 권한 팝업 표시 |
| | 하루 요약 알림 | 사용자 설정 시간(기본 09:00)에 오늘 할 일 개수 알림 |
| | 할 일 시작 알림 | 시작 시간이 설정된 할 일이 되면 자동 알림 (완료·지난 시간 제외) |
| | 알림 설정 UI | 관리 모달 내 알림 시간 선택 — Firebase/localStorage에 저장 |
| | Web Audio API 알림음 | 외부 파일 없이 코드로 생성한 알림음 재생 |

---

## 3. 미완성 / 미구현 기능

| **구분** | **항목** | **영향** |
|---|---|---|
| **동기화** | ~~서버 백엔드 없음~~ → **2026-03-05 완료** (Firebase Firestore) | 기기 간 데이터 공유 가능 |
| | 데이터 내보내기/가져오기 없음 | 기기 교체 시 클라우드 자동 복원 가능 |
| **앱화** | ~~PWA 미지원 (manifest, Service Worker 없음)~~ → **2026-03-05 완료** | 홈 화면 추가·오프라인 실행 가능 |
| **알림** | ~~시간 기반 알림 없음~~ → **2026-03-05 완료** | 하루 요약·할 일 시작 알림 지원 |
| | ~~iOS 앱 푸시 알림 없음 (앱 꺼지면 알림 미수신)~~ → **2026-03-21 완료** | WKWebView JS↔Swift 브릿지 + `UNUserNotificationCenter` 로컬 알림으로 앱 종료 상태에서도 알림 수신 가능 |
| | ~~할 일별 개별 알림 없음~~ → **2026-03-21 완료** | 할 일에 `alarmOffset` 추가 — 정각·5분 전·10분 전·30분 전 중 선택, 카드에 🔔 뱃지 표시 |
| **편의 기능** | ~~할 일 순서 변경 없음~~ → **2026-03-06 완료** | Daily 루틴·태스크 드래그 앤 드롭 순서 변경 지원 |
| | ~~계정 연동 없음 (Google ↔ Apple)~~ → **2026-03-21 완료** | 설정 모달에서 Google·Apple 계정 연동 가능 / 두 계정에 각각 데이터가 있을 경우 병합 UI로 유지할 데이터 선택 후 자동 통합 |
| | ~~반복 루틴 종료 후 복구 불가~~ → **2026-04-24 완료** | 관리 모달 "종료된 반복 할일" 섹션에서 복구 버튼 |
| | ~~기간 테스크 중간 날짜 미표시~~ → **2026-04-24 완료** | 시작~종료 모든 날짜에 표시 |
| | ~~PWA 설치 프롬프트 없음~~ → **2026-04-24 완료** | `beforeinstallprompt` 캐치 후 설정 모달에 설치 버튼 노출 (Chrome/Edge) |
| | 검색 기능 없음 | 할 일 수가 많아질 경우 탐색 불편 |
| | ~~완료 기록 초기화 없음~~ → **2026-03-06 완료** | 날짜 범위 지정 일괄 초기화 지원 |
| **디자인** | 다크 모드 없음 | — |
| | ~~데스크탑 최적화 미흡~~ → **2026-03-06 완료** | 전체 탭 max-width 1024px 통일 |

---

## 4. 기술 스택 요약

| **항목** | **내용** |
|---|---|
| **파일 수** | 3개 (`index.html`, `manifest.json`, `sw.js`) + `icons/` 폴더 |
| **외부 라이브러리** | Firebase SDK 12.10.0 (CDN — auth, firestore) |
| **폰트** | 시스템 폰트 (Apple SD Gothic Neo, Noto Sans KR) |
| **데이터 저장** | localStorage (keys: `cats`, `routines`, `checks`, `notes`, `tasks`, `notifSettings`, `routineOrder`, `taskOrder`, `dailySortMode` / `skips`는 레거시 호환만 — excludedDates로 통합됨). `taskOrder`는 `{ds: {slotKey: [ids]}}` 구조. Firebase Firestore `users/{uid}.appData` 단일 문서에 모든 키 JSON 문자열로 저장 (1MB 제한 주의) |
| **인증** | Firebase Authentication — 데스크탑: `signInWithPopup` (Google/Apple) / iOS: `signInWithRedirect` (Apple) + `getRedirectResult` |
| **언어** | HTML5 / CSS3 / Vanilla JavaScript (ES6+, ES Module) |
| **배포** | Firebase Hosting (`https://jinsplanner.web.app`, 루트 `/` 서빙) — 2026-04-24 단일화. GitHub Pages는 Auth 불가로 사실상 미사용 (public/index.html이 Firebase로 리다이렉트) |
| **최소 지원 환경** | 모던 브라우저 (Chrome, Safari, Firefox 최신 버전) — 알림은 HTTPS 필수 |

---

## 5. 작업 방식

### 수정 작업 원칙

| **원칙** | **내용** |
|---|---|
| **질문 우선** | 모호한 요구사항은 구현 전 선택지를 제시하고 사용자가 결정 |
| **UI 텍스트만 변경** | 변수명·함수명·CSS 클래스명은 유지, 화면에 표시되는 텍스트만 수정 |
| **불필요 코드 제거** | 기능 교체 시 구버전 코드(모달 HTML, 관련 함수, 이벤트 바인딩)를 완전히 삭제 |
| **최소 범위 수정** | 요청된 사항 외 리팩터링·추가 기능·스타일 개선은 하지 않음 |

### 수정 이력

| **날짜** | **수정 내용** | **비고** |
|---|---|---|
| **2026-03-03** | 탭 레이블 영문화 | 데일리→Daily, 위클리→Weekly, 먼슬리→Monthly |
| **2026-03-03** | UI 텍스트 '루틴' → '할 일' | 변수명·함수명은 유지 |
| **2026-03-03** | 카테고리 관리 인라인 편집으로 전환 | `#modal-cat` 제거, 관리 화면에서 직접 이름 입력·색상 선택·삭제 가능 |
| **2026-03-03** | 할 일 추가 버튼 위치 변경 | FAB(우하단 고정) → Daily 뷰 할 일 목록 하단 중앙 인라인 버튼 |
| **2026-03-03** | 카테고리 순서 변경 기능 추가 | 관리 화면 카테고리 항목에 ↑↓ 버튼 추가 |
| **2026-03-03** | 완료 배너에 격려 문장 추가 | 50개 문장 중 날짜 기반으로 하나씩 표시 |
| **2026-03-04** | Area 탭 추가 | 카테고리별 블록, 루틴+태스크 통합 표시, D-day 뱃지 |
| **2026-03-04** | 태스크(단발) 기능 추가 | 마감일, 시간대(오전/오후/저녁) 설정. localStorage `tasks`·`skips` 키 추가 |
| **2026-03-04** | 추가 모달에 타입 토글 추가 | 루틴(반복) / 태스크(단발) 전환 UI |
| **2026-03-04** | 이월/긴급 섹션 추가 | Daily 뷰 상단에 마감 초과·오늘-내일 마감 태스크 자동 표시 |
| **2026-03-04** | 루틴 당일 스킵 기능 추가 | 🚫 버튼으로 특정 날짜만 루틴 제외 |
| **2026-03-04** | Weekly 고양이 러너 추가 | 주간 달성률에 따라 이동하는 애니메이션 |
| **2026-03-04** | Weekly 데스크탑 대응 | Weekly 탭 활성화 시 max-width 1100px 확장 |
| **2026-03-04** | 루틴 삭제 범위 시트 추가 | 삭제 시 오늘만 / 오늘부터 / 전체 선택 가능. `_scopeTargetId`, `_scopeTargetDs`, `_editContextDs` 전역 변수 사용 |
| **2026-03-05** | Weekly 뷰 할 일 추가 버튼 추가 | `#btn-add-weekly` — 컬럼 그리드 하단, `openAddModal()` 연결 |
| **2026-03-05** | PWA 지원 추가 | `manifest.json`, `sw.js` 생성 / `index.html` `<head>`에 메타 태그 추가, Service Worker 등록 / `icons/` 폴더 생성 |
| **2026-03-05** | Daily 뷰 버그 수정 | 루틴이 없는 날 태스크가 표시되지 않던 문제 수정 (`renderDailyTasks()` 조기 리턴 제거) |
| **2026-03-05** | Firebase 인증·동기화 추가 | Firebase Auth (Google 로그인/로그아웃) + Firestore 클라우드 동기화 / `auth-bar` UI 추가 / `saveToCloud()`, `onAuthStateChanged()` 구현 / 데이터 키 `cats` `routines` `checks` `notes` `tasks` `skips` 번들 저장 |
| **2026-03-05** | Firebase 동기화 버그 수정 | `saveToCloud()`가 null 저장하던 문제 수정 (`plannerData` → 실제 6개 키) / `location.reload()` → `renderCurrent()` 교체로 무한 리로드 방지 |
| **2026-03-05** | 알림 기능 추가 | 브라우저 알림 권한 요청 / 하루 요약 알림 (기본 09:00, setTimeout 방식) / 할 일 시작 시간 알림 (완료·지난 시간 제외, setTimeout 방식) / 알림 설정 UI (관리 모달 내 시간 선택, Firebase/localStorage 저장) / Web Audio API 알림음 (외부 파일 없음) |
| **2026-03-05** | 마감일 기본값 제거 및 날짜 입력 분리 | 마감일 기본값 오늘 → 빈 값 / "날짜 (선택)" 레이블로 변경 / 시작일+마감일 두 개 입력란으로 분리 / 렌더링 필터 `(t.startDate \| t.dueDate) === ds` 하위 호환 처리 |
| **2026-03-05** | 개인정보 처리방침 페이지 추가 | `privacy.html` 신규 생성 / index.html 동일 디자인 (보라색 헤더·카드 레이아웃) / 6개 섹션: 수집 항목·목적·보관 기간·제3자 제공·사용자 권리·문의처 / 시행일 2026년 3월 5일 |
| **2026-03-05** | 설정 메뉴에 개인정보 처리방침 링크 추가 | 관리 모달 알림 설정 아래 `privacy.html` 새 탭 링크 추가 |
| **2026-03-05** | 할 일 추가 모달 카테고리 위치 변경 | 카테고리 항목을 저장 버튼 바로 위로 이동 (데일리·위클리 공통) |
| **2026-03-06** | "오늘로" 버튼 추가 | Daily/Weekly/Monthly 뷰에서 다른 날짜로 이동했을 때 날짜 레이블 오른쪽에 인라인으로 표시 / 오늘이면 자동 숨김 / 연한 보라 배경(`#ede9fe`) + 보라 텍스트(`#7c3aed`) |
| **2026-03-06** | Monthly 캘린더 모바일 셀 오버플로우 버그 수정 | 3월 이후 달에서 셀이 넘치는 문제 / 원인: 모바일 Safari가 innerHTML 교체 후 `aspect-ratio:1` 재계산 실패 / 해결: `aspect-ratio` 제거 → `grid-auto-rows: calc((min(100vw,640px) - 98px) / 7)` 명시 / `overflow:hidden` 추가 / `.cal-circle` 28px → 24px 축소 |
| **2026-03-06** | Area 탭으로 전환 및 탭 색상 정비 | `Project` 탭 → `Area` 탭 (data-tab, id, JS 참조 변경) / Area 활성 시 피치 색상(`#ea580c` 텍스트 · `#fb923c` 언더라인) / Daily·Weekly·Monthly는 기존 라벤더 유지 / 비활성 탭 배경 제거·박스 테두리 제거로 균일한 기본 스타일 적용 / 할 일 추가 모달 카테고리 레이블 → "Area" |
| **2026-03-06** | Google 로그인 방식 변경 | `signInWithPopup` → `signInWithRedirect` + `getRedirectResult` / 3rd-party 쿠키 차단 환경에서 팝업 로그인 실패 문제 해결 |
| **2026-03-06** | 로그인 에러 화면 표시 | 로그인 실패 시 `#auth-error` span에 에러 메시지 표시 (기존 console.error만 출력하던 방식 개선) |
| **2026-03-06** | 데스크탑 최적화 1024px 통일 | `.app`, `.detail-panel`, `.modal-sheet`, `#delete-scope-sheet` max-width 640px → 1024px / `.weekly-active` max-width 1100px → 1024px로 전체 탭 통일 |
| **2026-03-06** | Daily 드래그 앤 드롭 순서 변경 | 루틴 아이템(`data-drag-id`) 드래그로 순서 변경 → `routineOrder` localStorage 저장 / 시간대 내 태스크 드래그 순서 변경 → `taskOrder` 슬롯별 머지 저장 / `addDragDrop()` 공통 함수 추가 |
| **2026-03-06** | 완료 기록 날짜 범위 초기화 | `#clear-checks-sheet` 바텀시트 추가 / 시작일~종료일 지정 후 해당 기간 체크 기록 일괄 삭제 / `_confirmClearChecks()` 함수 구현 |
| **2026-03-06** | Weekly 날짜 간 태스크 드래그 이동 | 태스크 아이템에 `draggable=true` + `dragstart` 이벤트 / 컬럼 전체(`week-col`)를 드롭 타겟으로 / `enterCount` 패턴으로 `dragenter`/`dragleave` 오작동 방지 / `moveTaskToDate()` 함수로 날짜 변경 후 재렌더링 |
| **2026-03-06** | 앱 내 브라우저 로그인 차단 안내 | `isInAppBrowser()` UA 감지 (카카오톡·인스타·WebView 등) / `showInAppBrowserError()` — Chrome·Safari 열기 안내 + URL 복사 버튼 표시 |
| **2026-03-06** | Service Worker 캐시 업데이트 자동 새로고침 | `controllerchange` 이벤트 → `window.location.reload()` / SW `skipWaiting`+`clients.claim` 후 구버전 HTML이 메모리에 유지되는 문제 근본 해결 |
| **2026-03-06** | '태스크' → '테스크' 텍스트 통일 | 앱 내 UI 텍스트 8곳 일괄 변경 |
| **2026-03-06** | 일정 메모 기능 추가 | 루틴·테스크 추가/수정 모달에 메모 textarea 추가 / `memo: string \| null` 필드 저장 (기존 데이터 하위 호환) / 아이템 카드 하단에 `.routine-memo` 스타일로 작게 표시 |
| **2026-03-06** | 격려 메시지 100개 추가 | QUOTES 배열 50 → 150개 / '오늘도, 한 걸음' 컨셉 — 따뜻함+에너지, 이모지 포함, 경어체 / sw.js 캐시 v11 → v12 |
| **2026-03-06** | Weekly 토/일 요일 색상 추가 | `.wc-dayname`·`.wc-date`에 `.is-sat`(파랑)·`.is-sun`(빨강) 클래스 적용 — Monthly와 동일 스타일 통일 |
| **2026-03-06** | 대한민국 공휴일 표시 | `HOLIDAYS` 상수(고정 8개 + 음력 2024–2028) + `getHoliday()` 헬퍼 추가 / Weekly 헤더·Monthly 셀에 공휴일 이름 9px 빨간 텍스트로 표시 / 공휴일 날짜는 평일이어도 빨간색 처리 / sw.js 캐시 v12 → v13 |
| **2026-03-06** | Monthly 달성현황 startDate 버그 수정 | `renderMonthly()` stats 루프에 `startDate`/`endDate` 조건 추가 → 루틴 생성 이전 달에 달성현황이 노출되던 오류 수정 |
| **2026-03-06** | Daily/Weekly 정렬 토글 추가 | Daily 루틴 목록 상단에 시간순/영역순 토글 버튼 / 시간순: `time.start` 오름차순 / 영역순: 카테고리 그룹 헤더 + 그룹 내 시간순 / Weekly 뷰 컬럼에도 동일 모드 적용 / `dailySortMode` localStorage 저장 / sw.js 캐시 v13 → v14 |
| **2026-03-06** | Daily 뷰 공휴일/요일 색상 표시 | `renderDaily()`에서 요일/공휴일 기준으로 날짜 레이블 색상 적용 (토: 파랑 `#3b82f6`, 일·공휴일: 빨강 `#ef4444`) / `daily-date-sub` 서브텍스트에 공휴일 이름 추가 ("오늘 · 삼일절" 형식) / sw.js 캐시 v14 → v15 |
| **2026-03-06** | Area 탭 날짜없음 항목 삭제 버그 수정 | `renderProject()` 내 `proj-routine-row`·`proj-task-row`에 ✏️ 편집 버튼 추가 / 날짜없음 항목은 Area 탭에서만 보이므로 편집 버튼 없이는 삭제 불가능하던 문제 해결 / 루틴은 `_editContextDs = todayStr()` 후 `openEditModal()` / 테스크는 `openEditTaskModal()` / sw.js 캐시 v15 → v16 |
| **2026-03-07** | Sign in with Apple 추가 + iOS Google 버튼 숨김 | Firebase `OAuthProvider('apple.com')` + `signInWithRedirect` 연동 / Apple 버튼(검정 배경 + SVG 로고) 추가 / iOS 감지(`/iPad|iPhone|iPod/`) 시 Google 버튼 자동 숨김 / `onAuthStateChanged`에서 두 버튼 모두 제어 / `user.displayName` 없을 때 email → '사용자' 폴백 / sw.js 캐시 v16 → v17 |
| **2026-03-07** | SW chrome-extension 캐시 에러 수정 + 로그아웃 localStorage 초기화 | SW fetch 핸들러에 `if (!e.request.url.startsWith('http')) return` 추가 → chrome-extension:// 요청 캐싱 에러 방지 / `googleLogout()`에서 앱 데이터 9개 키 일괄 삭제 후 `renderCurrent()` 호출 / sw.js 캐시 v17 → v18 |
| **2026-03-07** | meta 태그 + SW HTML network-first + 로그인 에러 로깅 | `mobile-web-app-capable` 메타 태그 추가 (기존 apple 태그 유지) / SW HTML 요청 network-first 전략 적용 (redirect 후 구버전 캐시 노출 방지) / non-200 응답도 캐시 폴백 / `getRedirectResult` 성공·실패 모두 콘솔 출력 / sw.js 캐시 v18 → v20 |
| **2026-03-07** | Firebase Hosting 최소 설정 추가 (auth redirect 오류 해결) | `signInWithRedirect`가 필요로 하는 `/__/firebase/init.json`·`/__/auth/handler` 엔드포인트는 Firebase Hosting 활성화 시 자동 서빙됨 / `firebase.json`, `.firebaserc`, `public/index.html`(GitHub Pages 리다이렉트 placeholder) 추가 / `firebase deploy --only hosting` 후 Google·Apple 로그인 정상 작동 예정 |

| 2026-03-07 | Firebase Hosting 배포 (`firebase deploy --only hosting`) → `/__/auth/handler`, `/__/firebase/init.json` 엔드포인트 활성화 | 수동 작업 | Google/Apple 로그인 redirect 흐름 정상화 |
| 2026-03-07 | Google 로그인 `signInWithRedirect` → `signInWithPopup` 전환 | b3f27b1 | Chrome 서드파티 쿠키 차단으로 getRedirectResult null 반환 해결 |
| 2026-03-07 | Apple 로그인 Firebase Console 설정 완료 (Services ID 생성, Return URL, Private Key) + `signInWithPopup` 전환 | 3b57d5d | auth/operation-not-allowed → 정상 로그인 |
| 2026-03-07 | Google 로그인 버튼 UI 개선 — Google 컬러 로고 + "Sign in with Google" 영문, auth-bar max-width 정렬, SVG 수직 정렬 수정 | 8054b39~a482b3a | Apple 버튼과 통일된 디자인 |
| 2026-03-07 | 할일 추가 폼 'Area' 라벨 → '영역'으로 변경 | 5506cff | - |
| 2026-03-07 | Weekly 뷰 할일 드래그앤드롭 `user-select:none` 추가 (루틴은 미적용) | cf60516 | 드래그가 텍스트 선택으로 처리되던 문제 수정 |
| 2026-03-07 | Weekly 뷰 오늘 컬럼 상단 테두리 잘림 수정 — `.week-scroll` padding-top 0→4px | 8e9608a | overflow-x:auto 컨테이너가 box-shadow 상단 2px를 클리핑하던 문제 해결 |
| 2026-03-07 | iOS WKWebView Apple 로그인 팝업 차단 수정 — `isIOS` 분기로 iOS에서 `signInWithRedirect`, 데스크탑은 `signInWithPopup` 유지 | 332e115 | Xcode 시뮬레이터에서 auth/popup-blocked 에러 해결 |
| 2026-03-07 | 팝업 취소 시 로그인 오류 메시지 숨김 — `showAuthError`에서 `auth/cancelled-popup-request`, `auth/popup-closed-by-user` 무시 | 859f933 | Apple 팝업 취소 후 Google 로그인 시 불필요한 에러 표시 제거 |
| 2026-03-07 | Weekly 오늘 컬럼 자동 스크롤 + Monthly 날짜 숫자 토/일/공휴일 색상 | b072b60 | `renderWeekly()` 마지막에 `requestAnimationFrame`으로 오늘 컬럼 중앙 스크롤 / `.cal-num.is-sat`(파랑)·`.cal-num.is-sun`(빨강) CSS 추가 |
| **2026-03-08** | iPadOS 13+ 감지 수정 및 팝업 차단 에러 메시지 숨김 | f88a239 | `isIOS` 감지에 `navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1` 조건 추가 — iPadOS 13+가 UA를 macOS로 표시하여 `signInWithPopup` 분기로 빠지던 문제 해결 / `showAuthError`에서 `auth/popup-blocked` 코드도 무시 처리 추가 / App Store 심사 iPad Air (5th gen, iPadOS 26.3) 거절 대응 |
| **2026-03-08** | Apple 로그인 `signInWithRedirect` → `signInWithPopup` 전환 | — | WKWebView에서 `signInWithRedirect` 사용 시 sessionStorage 초기화로 `getRedirectResult()` null 반환 → 로그인 후 플래너 화면으로 복귀하는 버그 / iOS·데스크탑 모두 `signInWithPopup`으로 통일 / App Store 심사 iPhone 17 Pro Max (iOS 26.3) 거절 대응 (Guideline 2.1a) |
| **2026-03-08** | `support.html` 신규 생성 | — | App Store Connect Support URL 요건 충족 (Guideline 1.5) / FAQ 5개 항목, 문의 이메일, 앱 정보 포함 / privacy.html과 동일한 디자인 / App Store Connect Support URL → `https://jinaidak-alt.github.io/jinsplanner/support.html` 로 변경 필요 (수동) |
| **2026-03-08** | Area 탭 날짜 지정 테스크 '날짜없음' 버그 수정 | 1f6d378 | `ddayInfo(t.dueDate)` → `ddayInfo(t.dueDate \| t.startDate)` — `dueDate` 없이 `startDate`만 있는 테스크가 D-day 뱃지 대신 '날짜 없음'으로 표시되던 문제 해결 |
| **2026-03-08** | Area 탭 완료 테스크 뱃지 '완료'로 표시 | fb37b77 | `t.done`이면 D-day 계산 대신 초록색 '완료' 뱃지 고정 표시 / `dday-done` CSS 클래스 추가 (연두 배경 `#f0fdf4` + 초록 텍스트 `#16a34a`) |
| **2026-03-08** | 설정 모달에 고객지원 링크 추가 | 26ca31d | 개인정보 처리방침 위에 `support.html` 연결 링크 추가 / App Store 심사 Guideline 1.5 대응 |
| **2026-03-09** | Apple 로그인 iOS `signInWithRedirect` 복원 | 4173eb9 | WKWebView에서 `signInWithPopup` → `auth/popup-blocked` silent ignore → 버튼 무반응 문제 / iOS 분기 복원: iOS는 `signInWithRedirect`, 데스크탑은 `signInWithPopup` 유지 / App Store 심사 iPhone 17 Pro Max (iOS 26.3) 거절 대응 (Guideline 2.1a) |
| **2026-03-09** | `firebase.json` public 디렉토리 루트(.)로 변경 | 4173eb9 | 기존: `public/` (GitHub Pages 리다이렉트 페이지만 서빙) → 변경: 루트 `.` (앱 전체를 `jinsplanner.web.app`에서 직접 서빙) / Firebase Auth 핸들러(`/__/auth/handler`)와 같은 도메인이 되어 `signInWithRedirect` 크로스 도메인 문제 해결 / ignore 목록: `**/*.md`, `.git/**`, `public/**` 추가 |
| **2026-03-09** | App Store Connect Support URL 업데이트 | 수동 | `https://jinaidak-alt.github.io/jinsplanner` → `https://jinaidak-alt.github.io/jinsplanner/support.html` / Guideline 1.5 대응 완료 |
| **2026-03-09** | `authDomain`을 `jinsplanner.web.app`으로 변경 | 5181bb0 | 기존 `authDomain: "jinsplanner.firebaseapp.com"`과 앱 서빙 도메인(`jinsplanner.web.app`)이 달라 IndexedDB를 공유할 수 없어 `getRedirectResult()` null 반환 → `authDomain: "jinsplanner.web.app"`으로 통일하여 auth 핸들러(`jinsplanner.web.app/__/auth/handler`)와 같은 도메인에서 동작 / `signInWithRedirect` 후 로그인 미완료 버그 해결 |
| **2026-03-09** | 인앱 브라우저에서 Apple 로그인 차단 안내 추가 | 83daac3 | `appleLogin()`에 `isInAppBrowser()` 체크 추가 — 카카오톡 등 인앱 브라우저에서 `signInWithRedirect` 후 상태를 잃고 초기 화면으로 복귀하는 문제 대응 / `showInAppBrowserError` 메시지를 "Google 로그인" → "로그인"으로 수정하여 Apple/Google 공용화 |
| **2026-03-09** | Google Cloud API 키 제한 재설정 | 수동 | HTTP 참조자 허용 목록: `https://jinsplanner.web.app/*`, `https://jinsplanner.firebaseapp.com/*`, `https://jinaidak-alt.github.io/*`, `http://localhost/*` / API 허용 목록: Identity Toolkit API, Token Service API, Firebase Installations API, Cloud Firestore API |
| **2026-03-10** | 계정 삭제 기능 추가 | b072921 | App Store Guideline 5.1.1(v) 대응 — 설정 모달 위험 구역에 "계정 삭제" 버튼 추가 / 2단계 확인 후 Firestore `users/{uid}` 삭제 + Firebase Auth 계정 삭제 + localStorage 초기화 / `auth/requires-recent-login` 에러 시 재로그인 안내 / `deleteDoc` import 추가 |
| **2026-03-10** | App Store 심사 예방 — 경로·링크·알림·title 정리 | fd0a1d7 | (1) `manifest.json`: `start_url`, `scope`, 아이콘 경로 `/jinsplanner/` → 루트 `/` 기준으로 수정 (2) `index.html`: manifest·아이콘 링크 경로 루트 기준으로 수정 (3) `<title>` '데일리 할 일' → '오늘도, 한 걸음'으로 통일 (4) WKWebView 등 `Notification` 미지원 환경에서 알림 설정 UI 숨기고 "Safari에서만 지원" 안내 표시 (5) 설정 모달 고객지원·개인정보 링크 GitHub Pages → `jinsplanner.web.app`으로 변경 (6) `support.html` '앱으로 돌아가기' 링크 → `jinsplanner.web.app`으로 변경 |
| **2026-03-11** | 할 일 텍스트 오버플로 UX 개선 | d7c282f, 32c9444 | 데스크탑: `.routine-text`에 호버 툴팁(`::after` + `data-full-text`) 추가 — 마우스 오버 시 어두운 배경 팝업으로 전체 텍스트 표시 / 모바일(터치 기기): 텍스트가 실제로 잘린 경우(`scrollWidth > clientWidth`)에만 탭 이벤트 감지 → 카테고리 배지·전체 텍스트·시간(있을 경우)·메모(있을 경우) 표시하는 팝업 모달 / 바깥 탭 또는 닫기 버튼으로 닫힘 |
| **2026-03-10** | Apple 로그인 `signInWithPopup` 최종 전환 + `authDomain` 원복 + Xcode 팝업 허용 | a582dc9 | `signInWithRedirect` → Firebase `/__/auth/handler`가 내부적으로 `jinsplanner.firebaseapp.com`으로 초기화되어 `authDomain: "jinsplanner.web.app"` 설정 시 IndexedDB 키 불일치 → `getRedirectResult()` null 반환 불가피 / **해결**: `authDomain`을 `jinsplanner.firebaseapp.com`으로 원복 + iOS·데스크탑 모두 `signInWithPopup`으로 통일 + Xcode `ViewController.swift`에 `createWebViewWith` delegate 추가하여 WKWebView가 `window.open()` 팝업을 허용하도록 수정 / Apple Developer Console Services ID에 `jinsplanner.firebaseapp.com` Return URL(`https://jinsplanner.firebaseapp.com/__/auth/handler`) 재확인·복구 (수동) |
| **2026-03-21** | Google·Apple 계정 연동 기능 추가 | — | 설정(관리) 모달에 "연결된 계정 🔗" 섹션 추가 — 연결된 공급자는 "연결됨 ✓", 미연결 공급자는 "연동하기" 버튼 표시 / `linkWithPopup`으로 연동 / `auth/credential-already-in-use` 시 데이터 병합 플로우 진입: 두 계정의 루틴·테스크·기록 수를 카드로 나란히 표시하고 유지할 데이터를 선택 → 상대 계정 Firestore·Auth 삭제 → 원래 계정 재로그인 → 선택 데이터 Firestore·localStorage 적용 → 삭제된 계정을 `linkWithPopup`으로 재연동하여 통합 완성 / `cancelMerge` 시 로그아웃으로 복귀 |
| **2026-03-21** | WKWebView 로그인 유지 버그 수정 | — | `setPersistence(auth, browserLocalPersistence)` 추가 — WKWebView에서 IndexedDB 접근 불안정으로 앱 재실행 시 로그아웃되던 문제 해결 |
| **2026-03-21** | iOS 앱 푸시 알림 구현 | — | WKWebView JS↔Swift 브릿지(`WKScriptMessageHandler`) + iOS `UNUserNotificationCenter` 로컬 알림 연동 — 앱이 완전히 꺼진 상태에서도 설정한 시각에 하루 요약 알림 수신 가능 / `scheduleNativeNotification()` 함수 추가, `scheduleDailySummary()` 네이티브 분기 추가, Swift `ViewController.swift`에 핸들러 등록 및 `scheduleLocalNotification()` 구현 / 하루 요약 알림 메시지 '오늘의 루틴을 확인해보세요 ✨' → '오늘의 할 일을 확인해보세요 ✨' 수정 |
| **2026-03-21** | 할 일별 개별 알림 기능 추가 | — | 태스크에 `alarmOffset` 필드 추가 (null / 0 / 5 / 10 / 30분) — 할 일 추가·수정 모달의 시간 입력 패널 아래 "알림 🔔 없음/정각/5분 전/10분 전/30분 전" 세그먼트 버튼 UI 추가 / 카드에 🔔 뱃지 표시 / `calcNotifTime()` 함수로 offset 적용한 발송 시각 계산 / `scheduleTaskNotifications()` 네이티브 분기 추가 — Swift `scheduleTaskLocalNotification()`으로 특정 날짜+시각 1회성 로컬 알림 예약 |
| **2026-03-21** | App Store 1.1 심사 제출 | — | 로컬 알림 기능 추가 버전(1.1) 제출 / 심사 메모: 알림 권한 요청이 첫 실행 시 자동 발생함을 명시 / 즉시 권한 요청 방식(별도 안내 화면 없음) 유지 — 심사 메모로 대체 |
| **2026-03-21** | "할 일 추가" 버튼 sticky 고정 | — | `.add-task-btn`에 `position:sticky;bottom:16px;z-index:10;box-shadow` 추가 — 할 일 목록이 화면을 가득 채워도 버튼이 항상 뷰포트 하단에 노출 / Daily·Weekly 공통 적용 |
| **2026-03-21** | 반복 할일 수정 범위 선택 기능 추가 | — | 반복 할일 ✏️ 탭 시 "전체 수정 / 오늘만 수정" 다이얼로그 표시 / 오늘만 수정: 해당 날짜를 루틴 `excludedDates` 배열에 추가(이후 해당 날짜엔 루틴 미표시) + 수정 내용을 일회성 테스크로 신규 저장 / 전체 수정: 기존 루틴 수정 모달 동작 유지 / `showRepeatEditChoice()`, `openEditRoutineTodayOnly()` 함수 추가 / `routinesForDate()` 필터에 `excludedDates` 조건 추가 |
| **2026-04-24** | QA 전수 점검 + 이슈 25건 일괄 수정 | `22705d9`, `fa0121a`, `e17f341` | Critical/High/Medium/Low 전 영역 점검 리포트 작성([20260424_QA_report.md](20260424_QA_report.md)) 후 일괄 반영. **Critical 7건**: SW 등록 경로 `/jinsplanner/` → `/` 단일화(Firebase Hosting) / "전체 데이터 초기화" 시 Firestore 문서도 삭제 / `calcNotifTime` UTC 날짜 버그 → 로컬 `toStr()` 재사용(새벽 알림이 전날로 예약되던 문제) / Monthly 통계 테이블 innerHTML XSS → DOM API 전환 / 반복 루틴 편집 시 `excludedDates`·`endDate` 보존 / 브라우저 task 알림에 `alarmOffset` 필터 + offset 적용. **High 6건**: `_loadingCloud` 플래그로 Firestore 로드 중 저장 차단(race condition) / Monthly 통계에 `excludedDates` 체크 / `saveToCloud` 에러 캐치·알림 / `cancelTaskNotification?.` 방어 / 불필요한 `getRedirectResult` 블록·import 제거 / Weekly 드래그 `dragend`에서 drag-target 잔여 정리. **Medium 10건**: `skips` → `routine.excludedDates` 통합 + 마이그레이션 / 편집 모달 종료일 필드 + 관리 모달에 "종료된 반복 할일" 복구 섹션 / 기간 테스크 매일 표시(`taskVisibleOnDate` 헬퍼) / dead code(`renderManageRoutines`, `manageTab`) 제거 / `taskOrder` 구조 `{ds:{slot:[ids]}}`로 재설계 + `saveTaskOrder`/`saveTaskSlotOrder` setter / 비로그인·클라우드 데이터 충돌 시 merge-sheet 재활용("이 기기 vs 클라우드") / 전체 초기화 시 `dailySortMode` 보존 / 반복 할일 수정에 "오늘부터 변경" 옵션 추가. **Low 2건**: dead CSS `.app.weekly-active` 제거 / PWA 설치 프롬프트(`beforeinstallprompt`) + 설정 모달 "홈 화면에 추가" 버튼. [public/index.html](public/index.html) 리다이렉트 방향 반전(→ `jinsplanner.web.app`). SW 캐시 `v20` → `v21` |
| **2026-04-24** | 할 일 등록 UX 개선 4건 | `e17f341` | (1) 테스크 종료일 미설정 → 시작일과 동일하게 자동 설정 (2) 하루짜리(시작일=종료일) + 시간 미설정 테스크 → 해당일 **09:00 자동 알림** (`pickTaskSchedule` 헬퍼로 네이티브·브라우저 경로 공통화, `isNotifPast`로 과거 시각 필터) (3) "+ 할 일 추가" 시 Daily 뷰 현재 날짜를 시작일 디폴트로 (루틴·테스크 공통, 다른 탭은 오늘) (4) 종료일 < 시작일 입력 시 alert 차단 (루틴·테스크 submit 양쪽) |
