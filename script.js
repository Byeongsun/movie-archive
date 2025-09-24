// TMDB API 설정
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNWNmYzQ3YmZmYzU1NTlmNTgyZGZmYzAzOTdiNTg0MSIsIm5iZiI6MTc1ODMyNjYzNS41NDMsInN1YiI6IjY4Y2RlZjZiMTM4ZmQ5NjFiOGNlYjliNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Czn-63l7mLCxRTCfAZfBkM923ODU68R396O06w_1DAY';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM 요소 선택
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const loading = document.getElementById('loading');
const resultsContainer = document.getElementById('results-container');
const movieModal = document.getElementById('movie-modal');
const closeModal = document.getElementById('close-modal');
const movieDetails = document.getElementById('movie-details');
const ratedMoviesContainer = document.getElementById('rated-movies');

// 필터 관련 DOM 요소
const toggleFiltersBtn = document.getElementById('toggle-filters');
const filterPanel = document.getElementById('filter-panel');
const genreFilter = document.getElementById('genre-filter');
const yearFilter = document.getElementById('year-filter');
const sortFilter = document.getElementById('sort-filter');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');

// 로컬 스토리지에서 평가한 영화 데이터 관리 (Firebase로 이전됨)
let ratedMovies = JSON.parse(localStorage.getItem('ratedMovies')) || {};

// 추가 DOM 요소 (DOMContentLoaded 후에 선택하도록 변경)
let loginBtn, loginModal, closeLoginModal, googleLoginBtn, emailLoginBtn, emailSignupBtn, switchToSignupBtn, logoutBtn;

// DOM 요소 초기화 함수
function initializeDOM() {
    console.log('🔄 DOM 요소 초기화 시작...');
    
    // DOM 요소 선택
    loginBtn = document.getElementById('login-btn');
    loginModal = document.getElementById('login-modal');
    closeLoginModal = document.getElementById('close-login-modal');
    googleLoginBtn = document.getElementById('google-login-btn');
    emailLoginBtn = document.getElementById('email-login-btn');
    emailSignupBtn = document.getElementById('email-signup-btn');
    switchToSignupBtn = document.getElementById('switch-to-signup');
    logoutBtn = document.getElementById('logout-btn');
    
    // DOM 요소 존재 확인
    const domStatus = {
        loginBtn: !!loginBtn,
        loginModal: !!loginModal,
        closeLoginModal: !!closeLoginModal,
        googleLoginBtn: !!googleLoginBtn,
        emailLoginBtn: !!emailLoginBtn,
        emailSignupBtn: !!emailSignupBtn,
        switchToSignupBtn: !!switchToSignupBtn,
        logoutBtn: !!logoutBtn
    };
    
    console.log('📋 DOM 요소 확인 결과:', domStatus);
    
    // 중요한 요소들이 없으면 경고
    const criticalElements = ['loginBtn', 'loginModal', 'googleLoginBtn'];
    const missingElements = criticalElements.filter(elem => !domStatus[elem]);
    
    if (missingElements.length > 0) {
        console.error('❌ 중요한 DOM 요소들이 누락됨:', missingElements);
        console.error('🔧 HTML 구조를 확인하거나 DOM 로딩을 기다려야 합니다.');
        
        // 재시도 카운터 추가 (무한루프 방지)
        if (!window.domRetryCount) window.domRetryCount = 0;
        
        if (window.domRetryCount < 3) {
            window.domRetryCount++;
            console.log(`🔄 DOM 요소 재시도 (${window.domRetryCount}/3)...`);
            setTimeout(() => {
                const success = initializeDOM();
                if (success) {
                    attachEventListeners();
                }
            }, 500);
        } else {
            console.error('❌ DOM 요소 재시도 횟수 초과. 수동으로 확인이 필요합니다.');
        }
        
        return false;
    }
    
    return true;
}

// 이벤트 리스너 연결 함수 (별도 분리)
function attachEventListeners() {
    console.log('🔗 이벤트 리스너 연결 시작...');
    
    // 로그인 관련 이벤트 리스너 연결 (안전하게)
    if (googleLoginBtn) {
        // 기존 리스너 제거 후 새로 연결 (중복 방지)
        googleLoginBtn.removeEventListener('click', handleGoogleLogin);
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
        console.log('✅ Google 로그인 버튼 이벤트 리스너 연결됨');
    } else {
        console.error('❌ google-login-btn 요소를 찾을 수 없습니다!');
    }
    
    if (emailLoginBtn) {
        emailLoginBtn.removeEventListener('click', handleEmailLogin);
        emailLoginBtn.addEventListener('click', handleEmailLogin);
        console.log('✅ 이메일 로그인 버튼 이벤트 리스너 연결됨');
    } else {
        console.error('❌ email-login-btn 요소를 찾을 수 없습니다!');
    }
    
    if (emailSignupBtn) {
        emailSignupBtn.removeEventListener('click', handleEmailSignup);
        emailSignupBtn.addEventListener('click', handleEmailSignup);
        console.log('✅ 이메일 회원가입 버튼 이벤트 리스너 연결됨');
    } else {
        console.error('❌ email-signup-btn 요소를 찾을 수 없습니다!');
    }
    
    if (switchToSignupBtn) {
        switchToSignupBtn.removeEventListener('click', toggleAuthMode);
        switchToSignupBtn.addEventListener('click', toggleAuthMode);
        console.log('✅ 회원가입 전환 버튼 이벤트 리스너 연결됨');
    } else {
        console.error('❌ switch-to-signup 요소를 찾을 수 없습니다!');
    }
    
    if (logoutBtn) {
        logoutBtn.removeEventListener('click', handleLogout);
        logoutBtn.addEventListener('click', handleLogout);
        console.log('✅ 로그아웃 버튼 이벤트 리스너 연결됨');
    } else {
        console.warn('⚠️ logout-btn 요소를 찾을 수 없습니다 (로그아웃 상태에서는 정상)');
    }
    
    // 기타 로그인 모달 관련 이벤트
    if (loginBtn) {
        loginBtn.removeEventListener('click', showLoginModal);
        loginBtn.addEventListener('click', showLoginModal);
        console.log('✅ 로그인 버튼 이벤트 리스너 연결됨');
    }
    
    if (closeLoginModal) {
        closeLoginModal.removeEventListener('click', hideLoginModal);
        closeLoginModal.addEventListener('click', hideLoginModal);
        console.log('✅ 로그인 모달 닫기 버튼 이벤트 리스너 연결됨');
    }
    
    if (loginModal) {
        loginModal.removeEventListener('click', handleModalClick);
        loginModal.addEventListener('click', handleModalClick);
        console.log('✅ 로그인 모달 배경 클릭 이벤트 리스너 연결됨');
    }
    
    // 비밀번호 변경 모달 이벤트 리스너
    const passwordChangeForm = document.getElementById('password-change-form');
    if (passwordChangeForm) {
        passwordChangeForm.removeEventListener('submit', handlePasswordChange);
        passwordChangeForm.addEventListener('submit', handlePasswordChange);
        console.log('✅ 비밀번호 변경 폼 이벤트 리스너 연결됨');
    }
    
    const closePasswordChangeModalBtn = document.getElementById('close-password-change-modal');
    if (closePasswordChangeModalBtn) {
        closePasswordChangeModalBtn.removeEventListener('click', hidePasswordChangeModal);
        closePasswordChangeModalBtn.addEventListener('click', hidePasswordChangeModal);
        console.log('✅ 비밀번호 변경 모달 닫기 버튼 이벤트 리스너 연결됨');
    }
}

// 모달 배경 클릭 핸들러
function handleModalClick(e) {
    if (e.target === loginModal) {
        hideLoginModal();
    }
}

// 초기화 함수
function init() {
    console.log('🚀 초기화 함수 시작...');
    
    // DOM 요소 초기화 및 이벤트 리스너 연결
    const domInitialized = initializeDOM();
    if (domInitialized) {
        attachEventListeners();
    }
    
    // 기본 검색 기능 이벤트 리스너
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // 필터 관련 이벤트 리스너
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', toggleFilters);
    }
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // 영화 상세 모달 이벤트 리스너
    if (closeModal) {
        closeModal.addEventListener('click', hideModal);
    }
    if (movieModal) {
        movieModal.addEventListener('click', (e) => {
            if (e.target === movieModal) {
                hideModal();
            }
        });
    }

    // 평가한 영화들 표시 (Supabase에서 로드)
    displayRatedMovies();
    
    console.log('✅ 초기화 완료');
}

// 영화 검색 함수
async function searchMovies(query) {
    const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=ko-KR&page=1`;
    
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('영화 검색 중 오류 발생:', error);
        throw error;
    }
}

// 영화 상세 정보 가져오기
async function getMovieDetails(movieId) {
    const url = `${BASE_URL}/movie/${movieId}?language=ko-KR`;
    
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('영화 상세 정보 조회 중 오류 발생:', error);
        throw error;
    }
}

// 검색 처리 함수
async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('검색할 영화 제목을 입력해주세요.');
        return;
    }

    // 로딩 표시
    showLoading();
    clearResults();

    try {
        const movies = await searchMovies(query);
        displaySearchResults(movies);
    } catch (error) {
        alert('영화 검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        hideLoading();
    }
}

// 검색 결과 표시
function displaySearchResults(movies) {
    if (!movies || movies.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">검색 결과가 없습니다.</p>';
        return;
    }

    resultsContainer.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="showMovieDetails(${movie.id})">
            <img 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" 
                alt="${movie.title}" 
                class="movie-poster"
                onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'"
            >
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : '미정'}</p>
                <p class="movie-overview">${movie.overview || '줄거리 정보가 없습니다.'}</p>
                <div class="movie-rating">
                    <div class="tmdb-rating">
                        <i class="fas fa-star"></i>
                        <span>${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                    </div>
                    ${ratedMovies[movie.id] ? `
                        <div class="my-rating">
                            <i class="fas fa-heart"></i>
                            <span>${ratedMovies[movie.id].rating}/5</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// 영화 상세 정보 모달 표시
async function showMovieDetails(movieId) {
    console.log('영화 상세 정보 표시:', movieId);
    showModal();
    movieDetails.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 로딩 중...</div>';

    try {
        const movie = await getMovieDetails(movieId);
        console.log('영화 정보 로드 완료:', movie.title);
        
        // 사용자 평점 가져오기 (Supabase 연동)
        let userRating = 0;
        if (typeof getUserMovieRating === 'function') {
            userRating = await getUserMovieRating(movieId) || 0;
        }
        
        displayMovieDetails(movie, userRating);
    } catch (error) {
        console.error('영화 상세 정보 로드 오류:', error);
        movieDetails.innerHTML = '<p>영화 정보를 불러오는데 실패했습니다.</p>';
    }
}

// 영화 상세 정보 표시
function displayMovieDetails(movie, userRating = 0) {
    // 로컬 스토리지에서도 확인 (백업용)
    const localRating = ratedMovies[movie.id]?.rating || 0;
    const finalRating = userRating || localRating;
    
    movieDetails.innerHTML = `
        <div class="movie-detail-header">
            <img 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" 
                alt="${movie.title}" 
                class="movie-detail-poster"
                onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'"
            >
            <div class="movie-detail-info">
                <h2 class="movie-detail-title">${movie.title}</h2>
                <div class="movie-detail-meta">
                    <span><strong>개봉일:</strong> ${movie.release_date || '미정'}</span>
                    <span><strong>상영시간:</strong> ${movie.runtime ? movie.runtime + '분' : '미정'}</span>
                    <span><strong>평점:</strong> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10</span>
                </div>
                ${movie.genres && movie.genres.length > 0 ? `
                    <div class="movie-genres">
                        ${movie.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
                    </div>
                ` : ''}
                <p class="movie-detail-overview">${movie.overview || '줄거리 정보가 없습니다.'}</p>
            </div>
        </div>
        
        <div class="my-rating-section">
            <h3>내 평점</h3>
            <div class="rating-input">
                <div class="rating-stars" data-movie-id="${movie.id}">
                    ${[1, 2, 3, 4, 5].map(star => `
                        <i class="fas fa-star star ${star <= finalRating ? 'active' : ''}" 
                           data-rating="${star}" 
                           onclick="setRating(${movie.id}, ${star})"></i>
                    `).join('')}
                </div>
                <span id="rating-text">${finalRating > 0 ? `${finalRating}/5` : '평점을 선택해주세요'}</span>
            </div>
            <button class="save-rating-btn" onclick="saveRating(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path || ''}')">
                평점 저장
            </button>
        </div>
    `;
}

// 별점 설정
function setRating(movieId, rating) {
    const stars = document.querySelectorAll(`[data-movie-id="${movieId}"] .star`);
    const ratingText = document.getElementById('rating-text');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    ratingText.textContent = `${rating}/5`;
}

// 평점 저장 (Supabase 연동)
async function saveRating(movieId, title, posterPath, overview = '', releaseDate = '', voteAverage = 0) {
    // 로그인 확인
    const user = await SupabaseUtils.getCurrentUser();
    if (!user) {
        alert('평점을 저장하려면 로그인이 필요합니다.');
        showLoginModal();
        return;
    }

    const activeStars = document.querySelectorAll(`[data-movie-id="${movieId}"] .star.active`);
    const rating = activeStars.length;
    
    if (rating === 0) {
        alert('평점을 선택해주세요.');
        return;
    }
    
    try {
        // Supabase에 저장
        const movieData = {
            id: movieId,
            title: title,
            poster_path: posterPath,
            overview: overview,
            release_date: releaseDate,
            vote_average: voteAverage
        };
        
        await saveMovieRating(user.id, movieData, rating);
        
        // 로컬 스토리지에도 저장 (오프라인 지원용)
        ratedMovies[movieId] = {
            id: movieId,
            title: title,
            poster_path: posterPath,
            rating: rating,
            rated_at: new Date().toISOString()
        };
        localStorage.setItem('ratedMovies', JSON.stringify(ratedMovies));
        
        // 평가한 영화 목록 업데이트
        await loadUserRatings();
        
        // 모달 닫기
        hideModal();
        
        alert('평점이 저장되었습니다!');
        
    } catch (error) {
        console.error('평점 저장 오류:', error);
        alert('평점 저장에 실패했습니다. 다시 시도해주세요.');
    }
}

// 평가한 영화들 표시
function displayRatedMovies() {
    const ratedMoviesList = Object.values(ratedMovies).sort((a, b) => 
        new Date(b.rated_at) - new Date(a.rated_at)
    );
    
    if (ratedMoviesList.length === 0) {
        ratedMoviesContainer.innerHTML = '<p class="no-results">아직 평가한 영화가 없습니다.</p>';
        return;
    }
    
    ratedMoviesContainer.innerHTML = ratedMoviesList.map(movie => `
        <div class="rated-movie-card" onclick="showMovieDetails(${movie.id})">
            <img 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" 
                alt="${movie.title}" 
                class="rated-movie-poster"
                onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'"
            >
            <div class="rated-movie-info">
                <h4 class="rated-movie-title">${movie.title}</h4>
                <div class="rated-movie-rating">
                    <div class="my-rating">
                        <i class="fas fa-star"></i>
                        <span>${movie.rating}/5</span>
                    </div>
                    <small>${new Date(movie.rated_at).toLocaleDateString('ko-KR')}</small>
                </div>
            </div>
        </div>
    `).join('');
}

// 유틸리티 함수들 (개선된 로딩 시스템)
function showLoading(message = '영화를 검색하는 중...') {
    if (loading) {
        loading.classList.remove('hidden');
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p class="loading-message">${message}</p>
            </div>
        `;
    }
}

function hideLoading() {
    if (loading) {
        loading.classList.add('hidden');
    }
}

// 특정 작업용 로딩 함수들
function showRatingLoading(movieId) {
    const ratingContainer = document.querySelector(`[data-movie-id="${movieId}"] .rating-container`);
    if (ratingContainer) {
        ratingContainer.innerHTML = `
            <div class="rating-loading">
                <div class="mini-spinner"></div>
                <span>평점 저장 중...</span>
            </div>
        `;
    }
}

function showAuthLoading(message = '로그인 중...') {
    const authButtons = document.querySelectorAll('.auth-btn');
    authButtons.forEach(btn => {
        btn.disabled = true;
        const originalContent = btn.innerHTML;
        btn.innerHTML = `
            <div class="mini-spinner"></div>
            <span>${message}</span>
        `;
        btn.dataset.originalContent = originalContent;
    });
}

function hideAuthLoading() {
    const authButtons = document.querySelectorAll('.auth-btn');
    authButtons.forEach(btn => {
        btn.disabled = false;
        if (btn.dataset.originalContent) {
            btn.innerHTML = btn.dataset.originalContent;
            delete btn.dataset.originalContent;
        }
    });
}

function clearResults() {
    resultsContainer.innerHTML = '';
}

function showModal() {
    movieModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    movieModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// 부드러운 스크롤 기능
function smoothScroll(target) {
    document.querySelector(target).scrollIntoView({
        behavior: 'smooth'
    });
}

// 네비게이션 링크에 부드러운 스크롤 적용
document.querySelectorAll('.nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('href');
        smoothScroll(target);
    });
});

// 로그인 모달 관련 함수들
function showLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('hidden');
    }
}

function hideLoginModal() {
    if (loginModal) {
        loginModal.classList.add('hidden');
        resetAuthForms();
    }
}

// Supabase에서 사용할 수 있도록 전역 함수로 설정
window.hideLoginModal = hideLoginModal;

// script.js 로딩 확인
console.log('✅ script.js 파일 로딩됨');

// Supabase 연동 함수들 (supabase-config.js에서 호출)
function handleGoogleLogin() {
    alert('handleGoogleLogin 함수 호출됨!\nsignInWithGoogle: ' + typeof signInWithGoogle);
    
    if (typeof signInWithGoogle === 'function') {
        alert('signInWithGoogle 함수 호출 시작!');
        signInWithGoogle();
    } else {
        alert('signInWithGoogle 함수를 찾을 수 없음!\nSupabase가 아직 설정되지 않았습니다.');
    }
}

function handleLogout() {
    if (typeof signOut === 'function') {
        signOut();
    } else {
        alert('Supabase가 아직 설정되지 않았습니다.');
    }
}

// UI 상태 업데이트 함수들
function updateUIForLoggedInUser(user) {
    console.log('✅ 로그인 UI 업데이트:', user.email);
    
    // 로그인/로그아웃 버튼 상태 변경
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const userName = document.getElementById('user-name');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) {
        userInfo.style.display = 'flex';
        userInfo.classList.remove('hidden');
    }
    if (userName) userName.textContent = user.email;
    if (logoutBtn) logoutBtn.style.display = 'flex';
    
    // 로그인 모달 닫기
    hideLoginModal();
    
    // 사용자 평점 로드
    if (typeof loadUserRatings === 'function') {
        loadUserRatings();
    }
}

function updateUIForLoggedOutUser() {
    console.log('🔄 로그아웃 UI 업데이트');
    
    // 로그인/로그아웃 버튼 상태 변경
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userInfo) {
        userInfo.style.display = 'none';
        userInfo.classList.add('hidden');
    }
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    // 사용자 데이터 초기화
    clearUserData();
}

function resetAuthForms() {
    // 입력 필드 초기화
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const signupNameInput = document.getElementById('signup-name-input');
    const signupEmailInput = document.getElementById('signup-email-input');
    const signupPasswordInput = document.getElementById('signup-password-input');
    const resetEmailInput = document.getElementById('reset-email-input');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (signupNameInput) signupNameInput.value = '';
    if (signupEmailInput) signupEmailInput.value = '';
    if (signupPasswordInput) signupPasswordInput.value = '';
    if (resetEmailInput) resetEmailInput.value = '';
    
    // 모든 폼 상태 초기화
    const loginForm = document.getElementById('email-login-form');
    const signupForm = document.getElementById('email-signup-form');
    const resetForm = document.getElementById('password-reset-form');
    const authSwitch = document.getElementById('auth-switch-text');
    const authSwitchContainer = authSwitch?.parentElement;
    
    // 로그인 폼만 표시, 나머지는 숨김
    if (loginForm) loginForm.classList.remove('hidden');
    if (signupForm) signupForm.classList.add('hidden');
    if (resetForm) resetForm.classList.add('hidden');
    if (authSwitchContainer) authSwitchContainer.classList.remove('hidden');
    
    // 기본 텍스트로 복원
    if (authSwitch) {
        authSwitch.innerHTML = '계정이 없으신가요? <button id="switch-to-signup" class="switch-btn">회원가입</button>';
        
        // 이벤트 리스너 재등록
        const switchBtn = document.getElementById('switch-to-signup');
        if (switchBtn) {
            switchBtn.addEventListener('click', toggleAuthMode);
        }
    }
}

function toggleAuthMode() {
    console.log('인증 모드 전환...');
    
    const loginForm = document.getElementById('email-login-form');
    const signupForm = document.getElementById('email-signup-form');
    const switchText = document.getElementById('auth-switch-text');
    
    if (loginForm.classList.contains('hidden')) {
        // 회원가입 -> 로그인
        console.log('회원가입 폼에서 로그인 폼으로 전환');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        switchText.innerHTML = '계정이 없으신가요? <button id="switch-to-signup" class="switch-btn">회원가입</button>';
        
        // 이벤트 리스너 재연결
        const newSwitchBtn = document.getElementById('switch-to-signup');
        if (newSwitchBtn) {
            newSwitchBtn.addEventListener('click', toggleAuthMode);
        }
    } else {
        // 로그인 -> 회원가입
        console.log('로그인 폼에서 회원가입 폼으로 전환');
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        switchText.innerHTML = '이미 계정이 있으신가요? <button id="switch-to-login" class="switch-btn">로그인</button>';
        
        // 이벤트 리스너 재연결
        const newSwitchBtn = document.getElementById('switch-to-login');
        if (newSwitchBtn) {
            newSwitchBtn.addEventListener('click', toggleAuthMode);
        }
        
        // 회원가입 버튼 이벤트 리스너 재확인
        const signupBtn = document.getElementById('email-signup-btn');
        if (signupBtn) {
            // 기존 이벤트 리스너 제거 후 재연결
            signupBtn.removeEventListener('click', handleEmailSignup);
            signupBtn.addEventListener('click', handleEmailSignup);
            console.log('회원가입 버튼 이벤트 리스너 재연결됨');
        }
    }
}

function handleEmailLogin() {
    console.log('이메일 로그인 핸들러 호출...');
    
    const email = document.getElementById('email-input')?.value.trim();
    const password = document.getElementById('password-input')?.value.trim();
    
    console.log('입력값 확인:', { email, password: password ? '***' : '' });
    
    if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
    }
    
    // Supabase 함수 존재 여부 확인
    if (typeof signInWithEmail === 'function') {
        console.log('signInWithEmail 함수 호출...');
        signInWithEmail(email, password);
    } else {
        console.error('signInWithEmail 함수를 찾을 수 없습니다.');
        alert('Supabase가 아직 설정되지 않았습니다. supabase-config.js를 확인해주세요.');
    }
}

function handleEmailSignup() {
    console.log('회원가입 시도...');
    
    const name = document.getElementById('signup-name-input')?.value.trim();
    const email = document.getElementById('signup-email-input')?.value.trim();
    const password = document.getElementById('signup-password-input')?.value.trim();
    
    console.log('입력값:', { name, email, password: password ? '***' : '' });
    
    if (!name || !email || !password) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (password.length < 6) {
        alert('비밀번호는 6자 이상이어야 합니다.');
        return;
    }
    
    // Supabase 함수 존재 여부 확인
    if (typeof signUpWithEmail === 'function') {
        console.log('signUpWithEmail 함수 호출...');
        signUpWithEmail(name, email, password);
    } else {
        console.error('signUpWithEmail 함수를 찾을 수 없습니다.');
        alert('Supabase가 아직 설정되지 않았습니다. supabase-config.js를 확인해주세요.');
    }
}

// 이 함수는 supabase-config.js에서 사용하는 함수이므로 주석 처리
// async function showMovieDetails(movieId) {
//     try {
//         showLoading();
//         const movie = await getMovieDetails(movieId);
//         
//         // 사용자 평점 가져오기
//         const userRating = await getUserMovieRating(movieId);
//         
//         const modalContent = generateMovieDetailsHTML(movie, userRating);
//         movieDetails.innerHTML = modalContent;
//         movieModal.classList.remove('hidden');
//         
//         hideLoading();
//     } catch (error) {
//         hideLoading();
//         showNotification('영화 상세 정보를 불러오는데 실패했습니다.', 'error');
//     }
// }

// 별점 HTML 생성 함수 (supabase-config.js에서 사용)
function generateStarsHTML(rating) {
    return Array.from({length: 5}, (_, i) => {
        return `<i class="fas fa-star ${i < rating ? 'active' : ''}"></i>`;
    }).join('');
}

// showNotification 함수는 supabase-config.js에서만 정의됨

// 비밀번호 재설정 폼 표시
function showPasswordResetForm() {
    console.log('비밀번호 재설정 폼 표시');
    
    const loginForm = document.getElementById('email-login-form');
    const signupForm = document.getElementById('email-signup-form');
    const resetForm = document.getElementById('password-reset-form');
    const authSwitch = document.getElementById('auth-switch-text')?.parentElement;
    
    console.log('폼 요소들:', {
        loginForm: !!loginForm,
        signupForm: !!signupForm,
        resetForm: !!resetForm,
        authSwitch: !!authSwitch
    });
    
    // 모든 폼 숨기기
    if (loginForm) {
        loginForm.classList.add('hidden');
        console.log('로그인 폼 숨김');
    }
    if (signupForm) {
        signupForm.classList.add('hidden');
        console.log('회원가입 폼 숨김');
    }
    if (authSwitch) {
        authSwitch.classList.add('hidden');
        console.log('인증 스위치 숨김');
    }
    
    // 재설정 폼 표시
    if (resetForm) {
        resetForm.classList.remove('hidden');
        console.log('재설정 폼 표시');
    } else {
        console.error('재설정 폼을 찾을 수 없습니다!');
    }
    
    // 이메일 입력 필드에 로그인 폼의 이메일 복사
    const loginEmail = document.getElementById('email-input')?.value;
    const resetEmail = document.getElementById('reset-email-input');
    if (loginEmail && resetEmail) {
        resetEmail.value = loginEmail;
        console.log('이메일 복사됨:', loginEmail);
    }
}

// 비밀번호 재설정 폼 숨기기
function hidePasswordResetForm() {
    console.log('비밀번호 재설정 폼 숨기기');
    
    const loginForm = document.getElementById('email-login-form');
    const resetForm = document.getElementById('password-reset-form');
    const authSwitch = document.getElementById('auth-switch-text').parentElement;
    
    // 재설정 폼 숨기기
    if (resetForm) resetForm.classList.add('hidden');
    
    // 로그인 폼 표시
    if (loginForm) loginForm.classList.remove('hidden');
    if (authSwitch) authSwitch.classList.remove('hidden');
    
    // 입력 필드 초기화
    const resetEmail = document.getElementById('reset-email-input');
    if (resetEmail) resetEmail.value = '';
}

// 비밀번호 재설정 처리
function handlePasswordReset() {
    console.log('비밀번호 재설정 처리...');
    
    const email = document.getElementById('reset-email-input')?.value.trim();
    
    if (!email) {
        alert('이메일 주소를 입력해주세요.');
        return;
    }
    
    // Supabase 함수 존재 여부 확인
    if (typeof sendPasswordReset === 'function') {
        console.log('sendPasswordReset 함수 호출...');
        sendPasswordReset(email);
    } else {
        console.error('sendPasswordReset 함수를 찾을 수 없습니다.');
        alert('Supabase가 아직 설정되지 않았습니다.');
    }
}

// 필터 관련 함수들
function toggleFilters() {
    if (filterPanel) {
        filterPanel.classList.toggle('hidden');
        const isHidden = filterPanel.classList.contains('hidden');
        
        if (toggleFiltersBtn) {
            toggleFiltersBtn.innerHTML = isHidden 
                ? '<i class="fas fa-filter"></i> 고급 필터'
                : '<i class="fas fa-filter"></i> 필터 닫기';
        }
    }
}

function applyFilters() {
    const query = searchInput.value.trim();
    if (!query) {
        alert('검색어를 입력해주세요.');
        return;
    }
    
    searchMoviesWithFilters(query);
}

function resetFilters() {
    if (genreFilter) genreFilter.value = '';
    if (yearFilter) yearFilter.value = '';
    if (sortFilter) sortFilter.value = 'popularity.desc';
    
    // 기본 검색 실행
    const query = searchInput.value.trim();
    if (query) {
        searchMovies();
    }
}

async function searchMoviesWithFilters(query) {
    if (!query.trim()) {
        alert('검색어를 입력해주세요.');
        return;
    }

    // 로딩 표시
    showLoading('필터 적용하여 검색 중...');
    clearResults();

    try {
        // 필터 값 가져오기
        const genre = genreFilter ? genreFilter.value : '';
        const year = yearFilter ? yearFilter.value : '';
        const sortBy = sortFilter ? sortFilter.value : 'popularity.desc';
        
        // API URL 구성
        let url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}`;
        
        if (genre) {
            url += `&with_genres=${genre}`;
        }
        if (year) {
            url += `&primary_release_year=${year}`;
        }
        url += `&sort_by=${sortBy}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displayMovies(data.results);
        } else {
            showNoResults();
        }
        
    } catch (error) {
        console.error('필터 검색 오류:', error);
        alert('영화 검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        hideLoading();
    }
}

// 로딩 함수들은 위에서 정의됨

// 수동 디버깅 함수들 (콘솔에서 사용 가능)
window.debugLogin = function() {
    console.log('=== 로그인 디버깅 ===');
    console.log('DOM 요소들:');
    console.log('- login-btn:', document.getElementById('login-btn'));
    console.log('- google-login-btn:', document.getElementById('google-login-btn'));
    console.log('- login-modal:', document.getElementById('login-modal'));
    
    console.log('전역 함수들:');
    console.log('- signInWithGoogle:', typeof window.signInWithGoogle);
    console.log('- showLoginModal:', typeof window.showLoginModal);
    console.log('- hideLoginModal:', typeof window.hideLoginModal);
    
    console.log('Supabase 상태:');
    if (typeof supabaseClient !== 'undefined') {
        console.log('- Supabase 클라이언트:', !!supabaseClient);
        console.log('- Auth:', !!supabaseClient.auth);
    } else {
        console.log('- Supabase: 로드되지 않음');
    }
};

window.forceGoogleLogin = function() {
    console.log('🔄 강제 Google 로그인 시도...');
    if (typeof window.signInWithGoogle === 'function') {
        window.signInWithGoogle();
    } else {
        console.error('❌ signInWithGoogle 함수가 없습니다!');
    }
};

window.forceShowModal = function() {
    console.log('🔄 강제 로그인 모달 표시...');
    if (typeof window.showLoginModal === 'function') {
        window.showLoginModal();
    } else {
        console.error('❌ showLoginModal 함수가 없습니다!');
    }
};

window.reinitializeDOM = function() {
    console.log('🔄 DOM 재초기화...');
    window.domRetryCount = 0;
    const success = initializeDOM();
    if (success) {
        attachEventListeners();
        console.log('✅ DOM 재초기화 완료');
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    init();
    checkUrlParams();
    initializeFirstScreen();
});

// 첫 화면 초기화
function initializeFirstScreen() {
    console.log('🎬 첫 화면 초기화...');
    
    // 배경 데이터 초기화
    clearResults();
    clearUserData();
    
    // 로그인 모달 자동 표시 (비밀번호 재설정이 아닌 경우)
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action !== 'reset-password') {
        showLoginModal();
    }
    
    // 기본 상태로 UI 설정
    updateUIForLoggedOutUser();
}

// URL 파라미터 확인 (비밀번호 재설정 등)
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'reset-password') {
        // 비밀번호 재설정 후 비밀번호 변경 모달 표시
        showPasswordChangeModal();
    }
}

// 비밀번호 변경 모달 표시
function showPasswordChangeModal() {
    // URL에서 action 파라미터 제거
    const url = new URL(window.location);
    url.searchParams.delete('action');
    window.history.replaceState({}, document.title, url);
    
    // 비밀번호 변경 모달 표시
    const modal = document.getElementById('password-change-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // 유효성 검사 설정
        setTimeout(() => {
            setupPasswordValidation();
        }, 100);
    }
}

// 비밀번호 변경 폼 제출 처리
function handlePasswordChange(event) {
    event.preventDefault();
    console.log('🔄 비밀번호 변경 폼 제출됨');
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // 유효성 검사
    if (!newPassword || !confirmPassword) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 비밀번호 변경 실행
    if (typeof changePassword === 'function') {
        changePassword(newPassword, confirmPassword);
    } else {
        alert('비밀번호 변경 기능을 사용할 수 없습니다.');
    }
}

// 비밀번호 입력 실시간 유효성 검사
function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const matchMessage = document.getElementById('password-match-message');
    
    if (newPasswordInput && confirmPasswordInput && matchMessage) {
        function checkPasswordMatch() {
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (confirmPassword.length > 0) {
                if (newPassword === confirmPassword) {
                    matchMessage.textContent = '✅ 비밀번호가 일치합니다';
                    matchMessage.style.color = '#28a745';
                    matchMessage.style.display = 'block';
                } else {
                    matchMessage.textContent = '❌ 비밀번호가 일치하지 않습니다';
                    matchMessage.style.color = '#dc3545';
                    matchMessage.style.display = 'block';
                }
            } else {
                matchMessage.style.display = 'none';
            }
        }
        
        newPasswordInput.addEventListener('input', checkPasswordMatch);
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
}

// 비밀번호 변경 모달 닫기
function hidePasswordChangeModal() {
    const modal = document.getElementById('password-change-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // 폼 초기화
    const form = document.getElementById('password-change-form');
    if (form) {
        form.reset();
    }
}
