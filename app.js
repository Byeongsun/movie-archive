// Movie Archive App
// 간단하고 깔끔한 영화 평점 관리 앱

class MovieApp {
    constructor() {
        this.currentUser = null;
        this.ratings = {};
        this.tmdbApiKey = 'f5cfc47bffc5559f582dffc0397b5841';
        this.tmdbBaseUrl = 'https://api.themoviedb.org/3';
        this.useDummyData = false; // 실제 API 사용
        
        this.init();
    }

    // 앱 초기화
    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.checkLoginStatus();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 로그인 버튼
        document.getElementById('google-login').addEventListener('click', () => this.login('google'));
        
        // 이메일 로그인 폼
        document.getElementById('email-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login('email');
        });

        // 로그아웃 버튼
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // 검색
        document.getElementById('search-btn').addEventListener('click', () => this.searchMovies());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchMovies();
        });
    }

    // 로그인 상태 확인
    checkLoginStatus() {
        if (this.currentUser) {
            this.showMainApp();
        } else {
            this.showLoginModal();
        }
    }

    // 로그인
    login(type) {
        let user;
        
        if (type === 'google') {
            user = {
                id: 'google_' + Date.now(),
                email: 'test@gmail.com',
                name: '테스트 사용자',
                loginTime: new Date().toISOString()
            };
        } else {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                alert('이메일과 비밀번호를 입력해주세요.');
                return;
            }
            
            user = {
                id: 'email_' + Date.now(),
                email: email,
                name: email.split('@')[0],
                loginTime: new Date().toISOString()
            };
        }

        this.currentUser = user;
        this.saveUserData();
        this.showMainApp();
    }

    // 로그아웃
    logout() {
        this.currentUser = null;
        this.saveUserData();
        this.showLoginModal();
    }

    // 로그인 모달 표시
    showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    // 메인 앱 표시
    showMainApp() {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        document.getElementById('user-name').textContent = this.currentUser.name;
        this.loadUserRatings();
    }

    // 영화 검색
    async searchMovies() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        // 더미 데이터 사용
        if (this.useDummyData || this.tmdbApiKey === 'YOUR_TMDB_API_KEY') {
            this.displayMovies(this.getDummyMovies(query));
            return;
        }

        try {
            const response = await fetch(
                `${this.tmdbBaseUrl}/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(query)}&language=ko-KR`
            );
            
            if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                this.displayMovies(data.results);
            } else {
                this.displayMovies(this.getDummyMovies(query));
            }
        } catch (error) {
            console.error('검색 오류:', error);
            console.log('더미 데이터로 대체합니다.');
            this.displayMovies(this.getDummyMovies(query));
        }
    }

    // 더미 영화 데이터
    getDummyMovies(query) {
        const dummyMovies = [
            {
                id: 1,
                title: '어벤져스',
                release_date: '2012-04-25',
                poster_path: null,
                overview: '지구의 운명을 건 최고의 영웅들의 대결'
            },
            {
                id: 2,
                title: '어벤져스: 엔드게임',
                release_date: '2019-04-24',
                poster_path: null,
                overview: '무한대결의 최종 결전'
            },
            {
                id: 3,
                title: '스파이더맨: 노 웨이 홈',
                release_date: '2021-12-15',
                poster_path: null,
                overview: '다중 우주의 스파이더맨들이 만나다'
            },
            {
                id: 4,
                title: '토르: 러브 앤 썬더',
                release_date: '2022-07-06',
                poster_path: null,
                overview: '토르의 새로운 모험'
            },
            {
                id: 5,
                title: '블랙 위도우',
                release_date: '2021-07-07',
                poster_path: null,
                overview: '나타샤 로마노프의 숨겨진 과거'
            }
        ];

        // 검색어에 따라 필터링
        return dummyMovies.filter(movie => 
            movie.title.toLowerCase().includes(query.toLowerCase())
        );
    }

    // 영화 목록 표시
    displayMovies(movies) {
        const container = document.getElementById('movies-grid');
        const resultsSection = document.getElementById('results');
        
        container.innerHTML = '';
        
        if (!movies || !Array.isArray(movies) || movies.length === 0) {
            container.innerHTML = '<p>검색 결과가 없습니다.</p>';
            resultsSection.classList.remove('hidden');
            return;
        }
        
        movies.forEach(movie => {
            const movieCard = this.createMovieCard(movie);
            container.appendChild(movieCard);
        });
        
        resultsSection.classList.remove('hidden');
    }

    // 영화 카드 생성
    createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.movieId = movie.id;
        
        const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
            : '';

        const userRating = this.getMovieRating(movie.id);
        
        card.innerHTML = `
            <div class="movie-poster">
                ${posterUrl ? `<img src="${posterUrl}" alt="${movie.title}">` : '<i class="fas fa-film"></i>'}
            </div>
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</div>
                <div class="movie-rating">
                    ${this.createStarRating(movie.id, userRating)}
                </div>
            </div>
        `;
        
        return card;
    }

    // 별점 생성
    createStarRating(movieId, userRating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const activeClass = i <= userRating ? 'active' : '';
            stars += `<i class="fas fa-star star ${activeClass}" data-rating="${i}"></i>`;
        }
        return stars;
    }

    // 별점 클릭 이벤트 (이벤트 위임 사용)
    setupStarRating() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('star')) {
                const movieCard = e.target.closest('.movie-card');
                const movieId = parseInt(movieCard.dataset.movieId);
                const rating = parseInt(e.target.dataset.rating);
                
                this.rateMovie(movieId, rating);
                
                // 별점 UI 업데이트
                const stars = movieCard.querySelectorAll('.star');
                stars.forEach((star, index) => {
                    star.classList.toggle('active', index < rating);
                });
            }
        });
    }

    // 영화 평점 등록
    rateMovie(movieId, rating) {
        this.ratings[movieId] = {
            rating: rating,
            timestamp: new Date().toISOString()
        };
        this.saveRatings();
        this.loadUserRatings();
    }

    // 영화 평점 가져오기
    getMovieRating(movieId) {
        return this.ratings[movieId] ? this.ratings[movieId].rating : 0;
    }

    // 사용자 평점 목록 로드
    loadUserRatings() {
        const container = document.getElementById('rated-movies');
        container.innerHTML = '';
        
        const ratedMovieIds = Object.keys(this.ratings);
        if (ratedMovieIds.length === 0) {
            container.innerHTML = '<p>아직 평점을 등록한 영화가 없습니다.</p>';
            return;
        }
        
        // 평점이 있는 영화들의 상세 정보를 가져와서 표시
        ratedMovieIds.forEach(movieId => {
            this.fetchMovieDetails(movieId).then(movie => {
                if (movie) {
                    const movieCard = this.createMovieCard(movie);
                    container.appendChild(movieCard);
                }
            });
        });
    }

    // 영화 상세 정보 가져오기
    async fetchMovieDetails(movieId) {
        try {
            const response = await fetch(
                `${this.tmdbBaseUrl}/movie/${movieId}?api_key=${this.tmdbApiKey}&language=ko-KR`
            );
            return await response.json();
        } catch (error) {
            console.error('영화 정보 가져오기 오류:', error);
            return null;
        }
    }

    // 사용자 데이터 저장
    saveUserData() {
        localStorage.setItem('movieArchive_user', JSON.stringify(this.currentUser));
        localStorage.setItem('movieArchive_ratings', JSON.stringify(this.ratings));
    }

    // 사용자 데이터 로드
    loadUserData() {
        const userData = localStorage.getItem('movieArchive_user');
        const ratingsData = localStorage.getItem('movieArchive_ratings');
        
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
        
        if (ratingsData) {
            this.ratings = JSON.parse(ratingsData);
        }
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.movieApp = new MovieApp();
    window.movieApp.setupStarRating();
});
