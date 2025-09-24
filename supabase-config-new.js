// 로컬 스토리지 기반 인증 시스템
console.log('✅ 로컬 인증 시스템 로딩됨');

// 로컬 스토리지 키
const STORAGE_KEYS = {
    USER: 'moviesite_user',
    RATINGS: 'moviesite_ratings'
};

// 현재 사용자 상태
let currentUser = null;

// 페이지 로드 시 기존 로그인 확인
document.addEventListener('DOMContentLoaded', function() {
    checkExistingLogin();
});

// 기존 로그인 확인
function checkExistingLogin() {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('✅ 기존 로그인 발견:', currentUser.email);
            
            // 인증 상태 변경 이벤트 발생
            setTimeout(() => {
                if (typeof updateUIForLoggedInUser === 'function') {
                    updateUIForLoggedInUser(currentUser);
                }
                if (typeof loadUserRatings === 'function') {
                    loadUserRatings();
                }
            }, 100);
        } catch (error) {
            console.error('❌ 저장된 사용자 정보 파싱 실패:', error);
            localStorage.removeItem(STORAGE_KEYS.USER);
        }
    }
}

// 평점 관리 클래스
class RatingManager {
    constructor() {
        this.ratings = this.loadFromLocalStorage();
    }
    
    // 로컬 스토리지에서 평점 로드
    loadFromLocalStorage() {
        const saved = localStorage.getItem(STORAGE_KEYS.RATINGS);
        return saved ? JSON.parse(saved) : {};
    }
    
    // 평점 저장
    saveRating(movieId, movieData, rating) {
        this.ratings[movieId] = {
            id: movieId,
            title: movieData.title,
            poster_path: movieData.poster_path,
            rating: rating,
            overview: movieData.overview,
            release_date: movieData.release_date,
            vote_average: movieData.vote_average,
            rated_at: new Date().toISOString()
        };
        
        // 로컬 스토리지에 저장
        localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(this.ratings));
        console.log('✅ 평점 저장됨:', movieData.title, rating);
        
        return this.ratings[movieId];
    }
    
    // 평점 삭제
    deleteRating(movieId) {
        if (this.ratings[movieId]) {
            delete this.ratings[movieId];
            localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(this.ratings));
            console.log('✅ 평점 삭제됨:', movieId);
        }
    }
    
    // 사용자 평점 가져오기
    getUserRatings() {
        return Object.values(this.ratings);
    }
    
    // 특정 영화 평점 가져오기
    getMovieRating(movieId) {
        return this.ratings[movieId]?.rating || 0;
    }
    
    // 데이터 내보내기
    exportData() {
        const dataStr = JSON.stringify(this.ratings, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `movie_ratings_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        console.log('📁 평점 데이터 다운로드됨');
    }
    
    // 데이터 가져오기
    importData(jsonData) {
        try {
            this.ratings = JSON.parse(jsonData);
            localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(this.ratings));
            console.log('📂 평점 데이터 가져오기 완료');
            return true;
        } catch (error) {
            console.error('❌ 데이터 가져오기 실패:', error);
            return false;
        }
    }
}

// 전역 평점 관리자 인스턴스
const ratingManager = new RatingManager();

// 로컬 스토리지 기반 유틸리티 함수들
const SupabaseUtils = {
    // 현재 사용자 정보 가져오기
    getCurrentUser: async () => {
        return currentUser;
    },

    // 사용자 프로필 생성/업데이트 (로컬에서는 불필요)
    upsertUserProfile: async (user) => {
        console.log('✅ 사용자 프로필 처리됨:', user.email);
        return user;
    },

    // 사용자 평점 가져오기
    getUserRatings: async () => {
        if (!currentUser) return [];
        return ratingManager.getUserRatings();
    },

    // 사용자 프로필 가져오기
    getUserProfile: async (authId) => {
        return currentUser;
    },

    // 평점 저장/업데이트
    saveRating: async (movieData, rating) => {
        if (!currentUser) throw new Error('로그인이 필요합니다');
        return ratingManager.saveRating(movieData.id, movieData, rating);
    },

    // 평점 삭제
    deleteRating: async (movieId) => {
        if (!currentUser) throw new Error('로그인이 필요합니다');
        ratingManager.deleteRating(movieId);
    }
};

// 로컬 스토리지 기반 인증 함수들
async function signInWithGoogle() {
    console.log('🔄 Google 로그인 시뮬레이션...');
    
    // 로그인 시뮬레이션 (1초 지연)
    setTimeout(() => {
        const user = {
            email: 'sunson0@gmail.com',
            name: 'Test User',
            id: 'local_user_' + Date.now(),
            loginTime: new Date().toISOString()
        };
        
        // 로컬 스토리지에 저장
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        currentUser = user;
        
        console.log('✅ 로그인 성공:', user.email);
        
        // UI 업데이트
        if (typeof updateUIForLoggedInUser === 'function') {
            updateUIForLoggedInUser(user);
        }
        
        // 로그인 모달 닫기
        if (typeof hideLoginModal === 'function') {
            hideLoginModal();
        }
        
        // 평점 로드
        if (typeof loadUserRatings === 'function') {
            loadUserRatings();
        }
    }, 1000);
}

async function signInWithEmail(email, password) {
    console.log('🔄 이메일 로그인 시뮬레이션...');
    
    // 간단한 유효성 검사
    if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
    }
    
    if (password.length < 6) {
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }
    
    // 로그인 시뮬레이션
    setTimeout(() => {
        const user = {
            email: email,
            name: email.split('@')[0],
            id: 'local_user_' + Date.now(),
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        currentUser = user;
        
        console.log('✅ 이메일 로그인 성공:', user.email);
        
        if (typeof updateUIForLoggedInUser === 'function') {
            updateUIForLoggedInUser(user);
        }
        
        if (typeof hideLoginModal === 'function') {
            hideLoginModal();
        }
        
        if (typeof loadUserRatings === 'function') {
            loadUserRatings();
        }
    }, 1000);
}

async function signUpWithEmail(name, email, password) {
    console.log('🔄 이메일 회원가입 시뮬레이션...');
    
    // 간단한 유효성 검사
    if (!name || !email || !password) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (password.length < 6) {
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }
    
    // 회원가입 시뮬레이션
    setTimeout(() => {
        const user = {
            email: email,
            name: name,
            id: 'local_user_' + Date.now(),
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        currentUser = user;
        
        console.log('✅ 회원가입 성공:', user.email);
        alert('회원가입이 완료되었습니다!');
        
        if (typeof updateUIForLoggedInUser === 'function') {
            updateUIForLoggedInUser(user);
        }
        
        if (typeof hideLoginModal === 'function') {
            hideLoginModal();
        }
        
        if (typeof loadUserRatings === 'function') {
            loadUserRatings();
        }
    }, 1000);
}

async function signOut() {
    console.log('🔄 로그아웃...');
    
    // 로컬 스토리지에서 사용자 정보 제거
    localStorage.removeItem(STORAGE_KEYS.USER);
    currentUser = null;
    
    console.log('✅ 로그아웃 성공');
    
    // UI 업데이트
    if (typeof updateUIForLoggedOutUser === 'function') {
        updateUIForLoggedOutUser();
    }
    
    if (typeof clearUserData === 'function') {
        clearUserData();
    }
}

async function sendPasswordReset(email) {
    console.log('🔄 비밀번호 재설정 시뮬레이션...');
    
    if (!email) {
        alert('이메일을 입력해주세요.');
        return;
    }
    
    // 비밀번호 재설정 시뮬레이션
    setTimeout(() => {
        console.log('✅ 비밀번호 재설정 이메일 발송 시뮬레이션');
        alert('비밀번호 재설정 이메일을 발송했습니다. (시뮬레이션)');
        
        if (typeof hidePasswordResetForm === 'function') {
            hidePasswordResetForm();
        }
    }, 1000);
}

async function changePassword(newPassword, confirmPassword) {
    console.log('🔄 비밀번호 변경 시뮬레이션...');
    
    if (newPassword !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }
    
    // 비밀번호 변경 시뮬레이션
    setTimeout(() => {
        console.log('✅ 비밀번호 변경 성공');
        alert('비밀번호가 성공적으로 변경되었습니다. (시뮬레이션)');
        
        const modal = document.getElementById('password-change-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }, 1000);
}

// UI 업데이트 함수들
function updateUIForLoggedInUser(user) {
    console.log('🎨 로그인 사용자 UI 업데이트:', user.email);
    
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) {
        userInfo.style.display = 'flex';
        userInfo.classList.remove('hidden');
    }
    if (userName) userName.textContent = user.email;
    if (logoutBtn) logoutBtn.style.display = 'flex';
}

function updateUIForLoggedOutUser() {
    console.log('🎨 로그아웃 사용자 UI 업데이트');
    
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
}

function clearUserData() {
    console.log('🧹 사용자 데이터 정리');
    
    // 평점 목록 정리
    const ratedMoviesContainer = document.getElementById('rated-movies');
    if (ratedMoviesContainer) {
        ratedMoviesContainer.innerHTML = '<p class="no-results">로그인 후 평가한 영화를 확인할 수 있습니다.</p>';
    }
}

// 사용자 평점 로드
async function loadUserRatings() {
    console.log('📊 사용자 평점 로드...');
    
    if (!currentUser) return;
    
    try {
        const ratings = ratingManager.getUserRatings();
        console.log('평점 데이터:', ratings);
        
        // 로컬 스토리지 형식으로 변환 (기존 코드 호환성)
        const ratedMovies = {};
        ratings.forEach(rating => {
            ratedMovies[rating.id] = {
                id: rating.id,
                title: rating.title,
                poster_path: rating.poster_path,
                rating: rating.rating,
                rated_at: rating.rated_at
            };
        });
        
        // 전역 변수 업데이트
        window.ratedMovies = ratedMovies;
        
        // UI 업데이트
        if (typeof displayRatedMovies === 'function') {
            displayRatedMovies();
        }
        
    } catch (error) {
        console.error('사용자 평점 로드 실패:', error);
    }
}

// 영화 평점 저장
async function saveMovieRating(userId, movieData, rating) {
    console.log('💾 영화 평점 저장:', movieData.title, rating);
    
    try {
        const result = ratingManager.saveRating(movieData.id, movieData, rating);
        console.log('✅ 평점 저장 성공:', result);
        
        // 평점 목록 새로고침
        await loadUserRatings();
        
        return result;
        
    } catch (error) {
        console.error('평점 저장 실패:', error);
        throw error;
    }
}

// 사용자 영화 평점 가져오기
async function getUserMovieRating(movieId) {
    if (!currentUser) return 0;
    return ratingManager.getMovieRating(movieId);
}

// 전역 함수로 노출 (기존 코드 호환성)
window.signInWithGoogle = signInWithGoogle;
window.signInWithEmail = signInWithEmail;
window.signUpWithEmail = signUpWithEmail;
window.signOut = signOut;
window.sendPasswordReset = sendPasswordReset;
window.changePassword = changePassword;
window.saveMovieRating = saveMovieRating;
window.getUserMovieRating = getUserMovieRating;
window.loadUserRatings = loadUserRatings;
window.updateUIForLoggedInUser = updateUIForLoggedInUser;
window.updateUIForLoggedOutUser = updateUIForLoggedOutUser;
window.clearUserData = clearUserData;
window.ratingManager = ratingManager;
