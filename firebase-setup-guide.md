# 🔥 Firebase 설정 가이드

Firebase를 사용하여 영화 평점 아카이브에 사용자 인증과 데이터베이스 기능을 추가하는 방법을 안내합니다.

## 📋 목차
1. [Firebase 프로젝트 생성](#1-firebase-프로젝트-생성)
2. [Authentication 설정](#2-authentication-설정)
3. [Firestore 데이터베이스 설정](#3-firestore-데이터베이스-설정)
4. [웹 앱 설정](#4-웹-앱-설정)
5. [보안 규칙 설정](#5-보안-규칙-설정)

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. Google 계정으로 로그인
3. "프로젝트 추가" 클릭

### 1.2 프로젝트 설정
1. **프로젝트 이름**: `movie-archive` (또는 원하는 이름)
2. **Google Analytics**: 선택 사항 (권장: 사용)
3. **Analytics 계정**: 기본값 또는 새로 생성

## 2. Authentication 설정

### 2.1 Authentication 활성화
1. 왼쪽 메뉴에서 "Authentication" 클릭
2. "시작하기" 버튼 클릭

### 2.2 로그인 방법 설정
1. "Sign-in method" 탭 클릭
2. **이메일/비밀번호** 활성화:
   - "이메일/비밀번호" 클릭
   - "사용 설정" 토글 ON
   - "저장" 클릭

3. **Google** 활성화:
   - "Google" 클릭  
   - "사용 설정" 토글 ON
   - "프로젝트 지원 이메일" 선택
   - "저장" 클릭

## 3. Firestore 데이터베이스 설정

### 3.1 Firestore 생성
1. 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. **보안 규칙**: "테스트 모드에서 시작" 선택
4. **위치**: `asia-northeast3 (Seoul)` 선택
5. "완료" 클릭

### 3.2 데이터베이스 구조
```
users (collection)
  └── {userId} (document)
      ├── uid: string
      ├── email: string  
      ├── displayName: string
      ├── photoURL: string
      ├── createdAt: timestamp
      └── ratings (subcollection)
          └── {movieId} (document)
              ├── movieId: number
              ├── title: string
              ├── poster: string
              ├── rating: number
              ├── overview: string
              ├── releaseDate: string
              ├── voteAverage: number
              ├── createdAt: timestamp
              └── updatedAt: timestamp
```

## 4. 웹 앱 설정

### 4.1 웹 앱 등록
1. 프로젝트 개요 페이지에서 "웹" 아이콘 클릭
2. **앱 별명**: `movie-archive-web`
3. **Firebase Hosting**: 체크 (선택사항)
4. "앱 등록" 클릭

### 4.2 설정 정보 복사
Firebase SDK 구성 정보가 표시됩니다:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 4.3 firebase-config.js 업데이트
1. `firebase-config.js` 파일 열기
2. `firebaseConfig` 객체를 복사한 정보로 교체:

```javascript
const firebaseConfig = {
    apiKey: "여기에_복사한_API_KEY",
    authDomain: "여기에_복사한_AUTH_DOMAIN", 
    projectId: "여기에_복사한_PROJECT_ID",
    storageBucket: "여기에_복사한_STORAGE_BUCKET",
    messagingSenderId: "여기에_복사한_SENDER_ID",
    appId: "여기에_복사한_APP_ID"
};
```

## 5. 보안 규칙 설정

### 5.1 Firestore 보안 규칙
1. Firestore Database > "규칙" 탭 클릭
2. 다음 규칙으로 교체:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서: 본인만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // 사용자의 평점: 본인만 읽기/쓰기 가능
      match /ratings/{ratingId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. "게시" 클릭

### 5.2 Authentication 도메인 설정
1. Authentication > "설정" 탭 클릭
2. "승인된 도메인" 섹션에서 다음 도메인 추가:
   - `localhost` (로컬 개발용)
   - `your-username.github.io` (GitHub Pages용)

## 🎯 완료 확인

설정이 완료되면:

1. **로컬에서 테스트**:
   ```bash
   # 로컬 서버 실행 (예: Live Server)
   # index.html 파일 열기
   ```

2. **기능 테스트**:
   - ✅ Google 로그인 작동
   - ✅ 이메일 회원가입/로그인 작동  
   - ✅ 영화 평점 저장
   - ✅ 내 평점 목록 표시
   - ✅ 평점 삭제 기능

3. **GitHub Pages 배포**:
   ```bash
   git add .
   git commit -m "Firebase 인증 및 데이터베이스 기능 추가"
   git push origin main
   ```

## 🔧 문제 해결

### 자주 발생하는 오류

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Authentication > 설정 > 승인된 도메인에 현재 도메인 추가

2. **"Missing or insufficient permissions"**  
   - Firestore 보안 규칙 확인 및 수정

3. **"Firebase: Error (auth/popup-blocked)"**
   - 브라우저 팝업 차단 해제

4. **설정 정보 오류**
   - `firebase-config.js`의 설정 정보 재확인

## 📚 추가 리소스

- [Firebase 문서](https://firebase.google.com/docs)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

🎉 **축하합니다!** Firebase 설정이 완료되었습니다. 이제 사용자별 개인 평점 관리가 가능한 영화 아카이브를 사용할 수 있습니다!
