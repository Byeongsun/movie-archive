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
    
    try {
        // Supabase 클라이언트 존재 확인
        alert('Supabase 클라이언트 확인:\n' + 
              'supabase: ' + (typeof supabase !== 'undefined') + '\n' +
              'supabaseClient: ' + (typeof supabaseClient !== 'undefined') + '\n' +
              'auth: ' + (supabaseClient && typeof supabaseClient.auth !== 'undefined'));
        
        if (!supabaseClient || !supabaseClient.auth) {
            alert('Supabase 클라이언트가 제대로 초기화되지 않았습니다!');
            return;
        }
        
        // 세션 확인을 건너뛰고 바로 OAuth 시도
        alert('세션 확인을 건너뛰고 바로 OAuth 호출합니다...');
        
        alert('OAuth 호출 시작...');
        
        // OAuth 호출 with 다양한 옵션 시도
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        alert('OAuth 응답 받음!\n에러: ' + (error ? error.message : '없음'));
        
        if (error) {
            alert('Google 로그인 실패!\n' + error.message);
            return;
        }
        
        alert('Google 로그인 리디렉션 시작!');
        
        // 잠시 후 모달 닫기 (리디렉션 전에)
        setTimeout(() => {
            if (typeof hideLoginModal === 'function') {
                hideLoginModal();
            }
        }, 1000);
        
    } catch (error) {
        alert('Google 로그인 오류 발생!\n' + error.message);
    }
}

async function signInWithEmail(email, password) {
    console.log('🔄 이메일 로그인 시도...');
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('이메일 로그인 실패:', error);
            console.error('오류 세부사항:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText
            });
            
            let errorMessage = '로그인에 실패했습니다.';
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
            } else {
                errorMessage = `로그인 실패: ${error.message}`;
            }
            
            alert(errorMessage);
            return;
        }
        
        console.log('✅ 이메일 로그인 성공:', data.user.email);
        hideLoginModal();
        
    } catch (error) {
        console.error('이메일 로그인 오류:', error);
        alert('로그인 중 오류가 발생했습니다.');
    }
}

async function signUpWithEmail(name, email, password) {
    console.log('🔄 이메일 회원가입 시도...');
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) {
            console.error('회원가입 실패:', error);
            console.error('오류 세부사항:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText
            });
            
            let errorMessage = '회원가입에 실패했습니다.';
            if (error.message.includes('User already registered')) {
                errorMessage = '이미 가입된 이메일입니다. 로그인을 시도해주세요.';
            } else if (error.message.includes('Password should be at least')) {
                errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = '올바른 이메일 주소를 입력해주세요.';
            } else {
                errorMessage = `회원가입 실패: ${error.message}`;
            }
            
            alert(errorMessage);
            return;
        }
        
        console.log('✅ 회원가입 성공:', data.user?.email);
        
        if (data.user && !data.user.email_confirmed_at) {
            alert('회원가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요.');
        } else {
            alert('회원가입이 완료되었습니다!');
        }
        
        hideLoginModal();
        
    } catch (error) {
        console.error('회원가입 오류:', error);
        alert('회원가입 중 오류가 발생했습니다.');
    }
}

async function signOut() {
    console.log('🔄 로그아웃 시도...');
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            console.error('로그아웃 실패:', error);
            alert('로그아웃에 실패했습니다: ' + error.message);
            return;
        }
        
        console.log('✅ 로그아웃 성공');
        
    } catch (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

async function sendPasswordReset(email) {
    console.log('🔄 비밀번호 재설정 이메일 발송...');
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/?action=reset-password`
        });
        
        if (error) {
            console.error('비밀번호 재설정 실패:', error);
            alert('비밀번호 재설정에 실패했습니다: ' + error.message);
            return;
        }
        
        console.log('✅ 비밀번호 재설정 이메일 발송 성공');
        alert('비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.');
        hidePasswordResetForm();
        
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        alert('비밀번호 재설정 중 오류가 발생했습니다.');
    }
}

// 비밀번호 변경 함수
async function changePassword(newPassword, confirmPassword) {
    console.log('🔄 비밀번호 변경 시도...');
    
    // 비밀번호 확인
    if (newPassword !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 비밀번호 길이 확인
    if (newPassword.length < 6) {
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            console.error('비밀번호 변경 실패:', error);
            alert('비밀번호 변경에 실패했습니다: ' + error.message);
            return;
        }
        
        console.log('✅ 비밀번호 변경 성공');
        alert('비밀번호가 성공적으로 변경되었습니다.');
        
        // 비밀번호 변경 모달 닫기
        const modal = document.getElementById('password-change-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
}

// UI 업데이트 함수들
function updateUIForLoggedInUser(user) {
    console.log('🎨 로그인 사용자 UI 업데이트:', user.email);
    
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    
    if (userAvatar) {
        userAvatar.src = user.user_metadata?.avatar_url || 'https://via.placeholder.com/40x40?text=👤';
        userAvatar.alt = user.user_metadata?.full_name || user.email;
    }
    
    if (userName) {
        userName.textContent = user.user_metadata?.full_name || user.email.split('@')[0];
    }
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
    
    // 로컬 스토리지 정리
    localStorage.removeItem('ratedMovies');
    
    // 평점 목록 정리
    const ratedMoviesContainer = document.getElementById('rated-movies');
    if (ratedMoviesContainer) {
        ratedMoviesContainer.innerHTML = '<p class="no-results">로그인 후 평가한 영화를 확인할 수 있습니다.</p>';
    }
}

// 사용자 평점 로드
async function loadUserRatings() {
    console.log('📊 사용자 평점 로드...');
    
    try {
        const ratings = await SupabaseUtils.getUserRatings();
        console.log('평점 데이터:', ratings);
        
        // 로컬 스토리지 형식으로 변환 (기존 코드 호환성)
        const ratedMovies = {};
        ratings.forEach(rating => {
            ratedMovies[rating.movie_id] = {
                id: rating.movie_id,
                title: rating.title,
                poster_path: rating.poster_path,
                rating: rating.rating,
                rated_at: rating.created_at
            };
        });
        
        // 전역 변수 업데이트
        window.ratedMovies = ratedMovies;
        localStorage.setItem('ratedMovies', JSON.stringify(ratedMovies));
        
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
        const result = await SupabaseUtils.saveRating(movieData, rating);
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
    try {
        const user = await SupabaseUtils.getCurrentUser();
        if (!user) return 0;
        
        const userProfile = await SupabaseUtils.getUserProfile(user.id);
        if (!userProfile) return 0;
        
        const { data, error } = await supabaseClient
            .from('ratings')
            .select('rating')
            .eq('user_id', userProfile.id)
            .eq('movie_id', movieId)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // 데이터가 없음 (정상)
                return 0;
            }
            console.error('사용자 평점 조회 실패:', error);
            return 0;
        }
        
        return data?.rating || 0;
        
    } catch (error) {
        console.error('사용자 평점 조회 오류:', error);
        return 0;
    }
}

// 전역 함수로 노출 (기존 코드 호환성)
window.signInWithGoogle = signInWithGoogle;
window.signInWithEmail = signInWithEmail;
window.signUpWithEmail = signUpWithEmail;
window.signOut = signOut;
window.sendPasswordReset = sendPasswordReset;
window.saveMovieRating = saveMovieRating;
window.getUserMovieRating = getUserMovieRating;
window.loadUserRatings = loadUserRatings;
