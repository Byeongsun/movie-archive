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

// 로컬 스토리지에서 평가한 영화 데이터 관리
let ratedMovies = JSON.parse(localStorage.getItem('ratedMovies')) || {};

// 초기화 함수
function init() {
    // 이벤트 리스너 등록
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    closeModal.addEventListener('click', hideModal);
    movieModal.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            hideModal();
        }
    });

    // 평가한 영화들 표시
    displayRatedMovies();
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
    showModal();
    movieDetails.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 로딩 중...</div>';

    try {
        const movie = await getMovieDetails(movieId);
        displayMovieDetails(movie);
    } catch (error) {
        movieDetails.innerHTML = '<p>영화 정보를 불러오는데 실패했습니다.</p>';
    }
}

// 영화 상세 정보 표시
function displayMovieDetails(movie) {
    const userRating = ratedMovies[movie.id]?.rating || 0;
    
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
                        <i class="fas fa-star star ${star <= userRating ? 'active' : ''}" 
                           data-rating="${star}" 
                           onclick="setRating(${movie.id}, ${star})"></i>
                    `).join('')}
                </div>
                <span id="rating-text">${userRating > 0 ? `${userRating}/5` : '평점을 선택해주세요'}</span>
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

// 평점 저장
function saveRating(movieId, title, posterPath) {
    const activeStars = document.querySelectorAll(`[data-movie-id="${movieId}"] .star.active`);
    const rating = activeStars.length;
    
    if (rating === 0) {
        alert('평점을 선택해주세요.');
        return;
    }
    
    // 로컬 스토리지에 저장
    ratedMovies[movieId] = {
        id: movieId,
        title: title,
        poster_path: posterPath,
        rating: rating,
        rated_at: new Date().toISOString()
    };
    
    localStorage.setItem('ratedMovies', JSON.stringify(ratedMovies));
    
    alert('평점이 저장되었습니다!');
    
    // 평가한 영화 목록 업데이트
    displayRatedMovies();
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

// 유틸리티 함수들
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
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

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', init);
