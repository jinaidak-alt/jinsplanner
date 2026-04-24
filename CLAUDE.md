# CLAUDE.md — jinsplanner 프로젝트 지침

새 세션 시작 시 Claude Code가 자동으로 읽는 파일. 프로젝트 맥락·작업 원칙·배포 절차·주의사항 정리.

---

## 한 줄 요약

**"오늘도, 한 걸음" (jinsplanner)** — 단일 HTML 개인 할 일 관리 앱. Firebase Auth/Firestore 동기화 + PWA + iOS 네이티브 앱(WKWebView).

## 핵심 파일

| 파일 | 역할 |
|---|---|
| [index.html](index.html) | 모든 로직·UI·CSS 인라인 (약 3,300줄) |
| [sw.js](sw.js) | Service Worker (캐시 버전 관리 포함) |
| [manifest.json](manifest.json) | PWA 매니페스트 |
| [firebase.json](firebase.json) / [.firebaserc](.firebaserc) | Firebase Hosting 설정 |
| [privacy.html](privacy.html) / [support.html](support.html) | 개인정보·고객지원 (App Store 심사용) |
| [icons/](icons/) | 아이콘 리소스 |

## 참고 문서

- [20260303_분석_daily_routine.md](20260303_분석_daily_routine.md) — 프로젝트 분석(기능·아키텍처) + 수정 이력
- [20260424_QA_report.md](20260424_QA_report.md) — QA 이슈 트래킹 (처리 상태 포함)

## 작업 원칙

| 원칙 | 내용 |
|---|---|
| **질문 우선** | 모호한 요구사항은 구현 전 선택지 제시, 사용자가 결정 |
| **UI 텍스트만 변경** | 변수·함수·CSS 클래스명은 유지 (JS 로직에서 참조하므로) |
| **불필요 코드 제거** | 기능 교체 시 구버전(모달 HTML, 관련 함수, 이벤트 바인딩) 완전 삭제 |
| **최소 범위 수정** | 요청 외 리팩터링·추가 기능·스타일 개선 금지 |
| **커밋 메시지** | `Feat/Fix: <한글 요약>`, 본문에 이유·영향 포함 |

## 배포 절차

```bash
# (옵션) 프리뷰 채널로 먼저 검증
firebase hosting:channel:deploy preview-<이름> --expires 7d

# 프로덕션 배포
firebase deploy --only hosting
```

배포 URL: **https://jinsplanner.web.app**

배포 후:
1. Service Worker v21 이후 버전이 activated 상태인지 DevTools에서 확인
2. 첫 방문 시 `controllerchange` 발화로 자동 새로고침 한 번 발생 — 정상

**주의**: sw.js 수정 시 `CACHE_NAME` 버전 수동으로 올릴 것 (예: `v21` → `v22`). 안 올리면 신규 버전 캐시 교체 안 됨.

## 아키텍처 핵심

### 데이터 저장 (localStorage + Firestore 이중)
- **localStorage keys**: `cats`, `routines`, `checks`, `notes`, `tasks`, `skips`(레거시), `notifSettings`, `routineOrder`, `taskOrder`, `dailySortMode`
- **Firestore**: `users/{uid}` 단일 문서에 `appData` 필드(모든 localStorage 값을 JSON 문자열로 묶음). 1MB 제한 주의.
- `saveXxx()` 호출 시 자동으로 `saveToCloud()` 트리거.

### 인증 흐름
- Google/Apple 모두 `signInWithPopup` 사용 (iOS/데스크탑 통일, 2026-03-10 결정)
- `authDomain: jinsplanner.firebaseapp.com` 유지 (2026-03-10 원복)
- iOS WKWebView에서 팝업 허용하려면 Swift `ViewController.swift`에 `createWebViewWith` delegate 필요

### iOS 네이티브 알림 브릿지
Swift가 `WKScriptMessageHandler`로 5개 핸들러 등록해야 함:
- `scheduleNotification` / `cancelNotification` — 하루 요약 알림
- `scheduleTaskNotification` / `cancelTaskNotification` — 할 일별 알림
- `testNotification` — 설정 모달의 5초 테스트 버튼

JS 측에서는 핸들러 존재 여부로 분기 (네이티브 경로 vs 브라우저 setTimeout 경로).

### 루틴·테스크 이원 구조
- **루틴 (반복)**: `repeat: {type, days, dates}`, `startDate`/`endDate`, `excludedDates[]`
- **테스크 (단발)**: `startDate`, `dueDate`, `alarmOffset`, `done`
- "오늘만 수정"은 루틴의 `excludedDates` 추가 + 일회성 테스크 생성으로 구현
- "오늘부터 변경"은 루틴 `endDate`를 어제로 + 새 루틴 생성

## 주의사항

### Google Cloud API 키 HTTP referrer 제한
API 키에 referrer 화이트리스트가 걸려 있음. 허용 목록:
- `https://jinsplanner.web.app/*`
- `https://jinsplanner.firebaseapp.com/*`
- `https://jinaidak-alt.github.io/*` (레거시)
- `http://localhost/*`

**프리뷰 채널 쓸 때는** 해당 URL(`https://jinsplanner--<name>-<hash>.web.app/*`)을 임시 추가해야 로그인 가능. 일회성이면 개별 추가, 자주 쓰면 와일드카드(`https://jinsplanner--*.web.app/*`)로.

설정 위치: https://console.cloud.google.com/apis/credentials?project=jinsplanner

### Firebase Hosting 단일화 (2026-04-24)
- **유일한 배포 도메인**: `jinsplanner.web.app` (Firebase Hosting, 루트 서빙)
- GitHub Pages(`jinaidak-alt.github.io/jinsplanner`)는 **Auth 동작 불가**라 사실상 무용. [public/index.html](public/index.html)은 GitHub Pages 방문자를 Firebase Hosting으로 리다이렉트하는 역할만.
- 모든 경로는 루트 기준(`/sw.js`, `/manifest.json`, `/icons/*`). `/jinsplanner/` prefix 사용 금지.

### 되돌리기 어려운 작업 — 반드시 확인 후 실행
- `firebase deploy` (프로덕션 반영)
- `git push` (공개 저장소)
- Firestore 문서 삭제 (계정 삭제·전체 초기화)
- `btn-clear-all`은 로컬 + Firestore 둘 다 지움 (2026-04-24 수정)

### 테스트 환경
- 브라우저: Chrome/Safari 최신
- 실기기: iPhone (iOS WKWebView), iPad
- 프리뷰 채널 쓸 땐 API 키 referrer 제한 해결부터

## 현재 외부 의존성 상태 (2026-04-24 기준)

- Firebase SDK 12.10.0 (CDN)
- 앱 버전: 1.1 (App Store 심사 제출 완료, 2026-03-21)
- Service Worker 캐시: `jinsplanner-v21`
