# 🚀 GitHub Pages 배포 가이드

친구들과 영화 평점 아카이브를 공유하기 위한 단계별 가이드입니다.

## 📋 준비사항

1. **GitHub 계정** (없다면 [github.com](https://github.com)에서 무료 가입)
2. **프로젝트 파일들** (index.html, styles.css, script.js, README.md)

## 🔧 1단계: GitHub 저장소 생성

### 1-1. GitHub에 로그인 후 새 저장소 생성
1. GitHub 홈페이지에서 **"New repository"** 클릭
2. Repository name: `movie-archive` (또는 원하는 이름)
3. **Public**으로 설정 (중요: Private이면 GitHub Pages 무료 사용 불가)
4. **"Add a README file"** 체크 해제 (이미 있으니까)
5. **"Create repository"** 클릭

### 1-2. 로컬 파일을 GitHub에 업로드

#### 방법 1: GitHub 웹사이트에서 직접 업로드
1. 새로 만든 저장소 페이지에서 **"uploading an existing file"** 클릭
2. 다음 파일들을 드래그 앤 드롭으로 업로드:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. Commit message: "Initial commit - Movie Archive Website"
4. **"Commit changes"** 클릭

#### 방법 2: Git 명령어 사용 (고급 사용자용)
```bash
# 프로젝트 폴더에서 실행
git init
git add .
git commit -m "Initial commit - Movie Archive Website"
git branch -M main
git remote add origin https://github.com/[사용자명]/movie-archive.git
git push -u origin main
```

## 🌐 2단계: GitHub Pages 활성화

### 2-1. Pages 설정
1. 저장소 페이지에서 **"Settings"** 탭 클릭
2. 왼쪽 메뉴에서 **"Pages"** 클릭
3. Source 섹션에서:
   - **"Deploy from a branch"** 선택
   - Branch: **"main"** 선택
   - Folder: **"/ (root)"** 선택
4. **"Save"** 클릭

### 2-2. 배포 완료 확인
- 몇 분 후 페이지 상단에 초록색 체크마크와 함께 URL이 표시됩니다
- URL 형식: `https://[사용자명].github.io/movie-archive/`

## 📱 3단계: 친구들과 공유하기

### 3-1. 공유 URL
- **웹사이트 주소**: `https://[사용자명].github.io/movie-archive/`
- **GitHub 저장소**: `https://github.com/[사용자명]/movie-archive`

### 3-2. 공유 방법들
1. **카카오톡/메신저**: URL 직접 전송
2. **소셜미디어**: URL과 함께 스크린샷 공유
3. **QR코드**: QR코드 생성기로 모바일 접근 편의성 제공

## 🔄 4단계: 업데이트 방법

### 파일 수정 후 업데이트하기
1. GitHub 저장소에서 수정할 파일 클릭
2. **연필 아이콘(Edit)** 클릭
3. 코드 수정
4. **"Commit changes"** 클릭
5. 몇 분 후 웹사이트에 자동 반영

## ⚡ 빠른 체크리스트

- [ ] GitHub 계정 생성/로그인
- [ ] Public 저장소 생성
- [ ] 모든 파일 업로드 (index.html, styles.css, script.js, README.md)
- [ ] Settings > Pages에서 배포 설정
- [ ] 배포 완료 확인 (초록색 체크마크)
- [ ] 친구들에게 URL 공유

## 🎉 완료!

이제 친구들이 언제든지 `https://[사용자명].github.io/movie-archive/`에 접속해서 여러분의 영화 평점 아카이브를 확인할 수 있습니다!

## 🔧 문제 해결

### 자주 발생하는 문제들

**1. 페이지가 404 에러를 보여줘요**
- Settings > Pages에서 올바른 branch(main)가 선택되었는지 확인
- index.html 파일이 루트 폴더에 있는지 확인

**2. 변경사항이 반영되지 않아요**
- GitHub Pages는 업데이트에 몇 분이 소요됩니다
- 브라우저 캐시를 새로고침 (Ctrl+F5)

**3. API가 작동하지 않아요**
- HTTPS 환경에서만 API 호출이 가능합니다
- GitHub Pages는 자동으로 HTTPS를 제공합니다

## 💡 추가 팁

- **커스텀 도메인**: Settings > Pages에서 자신만의 도메인 연결 가능
- **분석**: Google Analytics 연동으로 방문자 통계 확인 가능
- **SEO**: README.md에 키워드 추가로 검색 노출 향상

---

**🎬 Happy Movie Rating! 🌟**
