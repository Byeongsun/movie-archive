// 로컬 스토리지 기반 인증 시스템
console.log('🚀 인증 시스템 초기화 중...');

// 로컬 스토리지 키
const STORAGE_KEYS = {
    USER: 'movie_archive_user',
    RATINGS: 'movie_archive_ratings'
};

// 전역 변수
let currentUser = null;
let ratingManager = null;

// 평점 관리자 클래스
class RatingManager {
    constructor() {
        this.ratings = this.loadRatings();
    }

    loadRatings() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.RATINGS);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('평점 로드 오류:', error);
            return {};
        }
    }

    saveRatings() {
        try {
            localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(this.ratings));
        } catch (error) {
            console.error('평점 저장 오류:', error);
        }
    }

    saveRating(movieId, rating) {
        if (!currentUser) return false;
        
        this.ratings[movieId] = {
            userId: currentUser.id,
            rating: rating,
            timestamp: new Date().toISOString()
        };
        this.saveRatings();
        return true;
    }

    deleteRating(movieId) {
        if (!currentUser) return false;
        
        if (this.ratings[movieId]) {
            delete this.ratings[movieId];
            this.saveRatings();
            return true;
        }
        return false;
    }

    getMovieRating(movieId) {
        if (!currentUser) return 0;
        
        const rating = this.ratings[movieId];
        return rating && rating.userId === currentUser.id ? rating.rating : 0;
    }

    getUserRatings() {
        if (!currentUser) return [];
        
        return Object.entries(this.ratings)
            .filter(([_, rating]) => rating.userId === currentUser.id)
            .map(([movieId, rating]) => ({
                movieId: parseInt(movieId),
                rating: rating.rating,
                timestamp: rating.timestamp
            }));
    }
}

// UI 상태 관리 함수들
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('✅ 로그인 모달 표시');
    }
}

function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('✅ 로그인 모달 숨김');
    }
}

function showMainContent() {
    const sections = ['search-section', 'results-section', 'rated-movies-section'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    });
    console.log('✅ 메인 콘텐츠 표시');
}

function hideMainContent() {
    const sections = ['search-section', 'results-section', 'rated-movies-section'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
    console.log('✅ 메인 콘텐츠 숨김');
}

function updateAuthUI(isLoggedIn, user = null) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    
    if (isLoggedIn && user) {
        // 로그인된 상태
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = user.name || user.email;
        document.body.classList.add('logged-in');
    } else {
        // 로그아웃된 상태
        if (loginBtn) loginBtn.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        document.body.classList.remove('logged-in');
    }
}

// 인증 함수들
async function signInWithGoogle() {
    console.log('🔄 Google 로그인 시작...');
    
    try {
        // 사용자 정보 생성
        const user = {
            id: 'google_user_' + Date.now(),
            email: 'test@gmail.com',
            name: '테스트 사용자',
            loginTime: new Date().toISOString()
        };
        
        // 로컬 스토리지에 저장
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        currentUser = user;
        
        console.log('✅ Google 로그인 성공:', user.email);
        
        // UI 업데이트
        updateAuthUI(true, user);
        hideLoginModal();
        showMainContent();
        
        // 평점 로드
        if (typeof loadUserRatings === 'function') {
            loadUserRatings();
        }
        
        return { success: true, user };
        
    } catch (error) {
        console.error('❌ Google 로그인 실패:', error);
        return { success: false, error: error.message };
    }
}

async function signInWithEmail(email, password) {
    console.log('🔄 이메일 로그인 시작...');
    
    if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return { success: false, error: '입력값 누락' };
    }
    
    try {
        // 사용자 정보 생성
        const user = {
            id: 'email_user_' + Date.now(),
            email: email,
            name: email.split('@')[0],
            loginTime: new Date().toISOString()
        };
        
        // 로컬 스토리지에 저장
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        currentUser = user;
        
        console.log('✅ 이메일 로그인 성공:', user.email);
        
        // UI 업데이트
        updateAuthUI(true, user);
        hideLoginModal();
        showMainContent();
        
        // 평점 로드
        if (typeof loadUserRatings === 'function') {
            loadUserRatings();
        }
        
        return { success: true, user };
        
    } catch (error) {
        console.error('❌ 이메일 로그인 실패:', error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    console.log('🔄 로그아웃 시작...');
    
    try {
        // 로컬 스토리지에서 사용자 정보 제거
        localStorage.removeItem(STORAGE_KEYS.USER);
        currentUser = null;
        
        console.log('✅ 로그아웃 성공');
        
        // UI 업데이트
        updateAuthUI(false);
        hideMainContent();
        showLoginModal();
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ 로그아웃 실패:', error);
        return { success: false, error: error.message };
    }
}

// 기존 로그인 상태 확인
function checkExistingLogin() {
    console.log('🔍 기존 로그인 상태 확인...');
    
    try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            console.log('✅ 기존 로그인 발견:', currentUser.email);
            
            // UI 업데이트
            updateAuthUI(true, currentUser);
            hideLoginModal();
            showMainContent();
            
            // 평점 로드
            if (typeof loadUserRatings === 'function') {
                loadUserRatings();
            }
            
            return true;
        } else {
            console.log('ℹ️ 로그인되지 않은 상태');
            
            // 초기 화면 설정
            updateAuthUI(false);
            hideMainContent();
            showLoginModal();
            
            return false;
        }
    } catch (error) {
        console.error('❌ 로그인 상태 확인 오류:', error);
        
        // 오류 시 초기 상태로 설정
        updateAuthUI(false);
        hideMainContent();
        showLoginModal();
        
        return false;
    }
}

// 평점 관련 함수들
function saveMovieRating(movieId, rating) {
    if (!ratingManager) return false;
    return ratingManager.saveRating(movieId, rating);
}

function getUserMovieRating(movieId) {
    if (!ratingManager) return 0;
    return ratingManager.getMovieRating(movieId);
}

function loadUserRatings() {
    if (!ratingManager || !currentUser) return [];
    
    const ratings = ratingManager.getUserRatings();
    console.log('📊 사용자 평점 로드:', ratings.length + '개');
    return ratings;
}

function updateUIForLoggedInUser(user) {
    updateAuthUI(true, user);
}

function updateUIForLoggedOutUser() {
    updateAuthUI(false);
}

function clearUserData() {
    localStorage.removeItem(STORAGE_KEYS.RATINGS);
    if (ratingManager) {
        ratingManager = new RatingManager();
    }
}

// 데이터 백업/복원
function exportUserData() {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const data = {
        user: currentUser,
        ratings: ratingManager ? ratingManager.ratings : {},
        exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movie_archive_${currentUser.email}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importUserData(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.ratings && ratingManager) {
                ratingManager.ratings = data.ratings;
                ratingManager.saveRatings();
                alert('데이터 가져오기가 완료되었습니다.');
                
                if (currentUser && typeof loadUserRatings === 'function') {
                    loadUserRatings();
                }
            }
        } catch (error) {
            alert('파일 형식이 올바르지 않습니다.');
            console.error('데이터 가져오기 오류:', error);
        }
    };
    reader.readAsText(file);
}

// 초기화
function initializeAuth() {
    console.log('🚀 인증 시스템 초기화...');
    
    // 평점 관리자 초기화
    ratingManager = new RatingManager();
    
    // 기존 로그인 상태 확인
    checkExistingLogin();
    
    console.log('✅ 인증 시스템 초기화 완료');
}

// 전역 함수로 노출
window.signInWithGoogle = signInWithGoogle;
window.signInWithEmail = signInWithEmail;
window.signOut = signOut;
window.saveMovieRating = saveMovieRating;
window.getUserMovieRating = getUserMovieRating;
window.loadUserRatings = loadUserRatings;
window.updateUIForLoggedInUser = updateUIForLoggedInUser;
window.updateUIForLoggedOutUser = updateUIForLoggedOutUser;
window.clearUserData = clearUserData;
window.exportUserData = exportUserData;
window.importUserData = importUserData;
window.showLoginModal = showLoginModal;
window.hideLoginModal = hideLoginModal;

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

console.log('✅ supabase-config.js 로드 완료');