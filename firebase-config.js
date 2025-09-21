// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDcssZeknf32BFZugraxYrUK0ddKtTbsjU",
    authDomain: "movie-archive-fa1e0.firebaseapp.com",
    projectId: "movie-archive-fa1e0",
    storageBucket: "movie-archive-fa1e0.firebasestorage.app",
    messagingSenderId: "890265343346",
    appId: "1:890265343346:web:6e60da7d2251b774bbf9eb"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase 서비스 초기화
const auth = firebase.auth();
const db = firebase.firestore();

// Google 로그인 프로바이더 설정
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// 인증 상태 변경 리스너
auth.onAuthStateChanged((user) => {
    if (user) {
        // 사용자가 로그인됨
        console.log('사용자 로그인:', user);
        showUserInfo(user);
        loadUserRatings(user.uid);
    } else {
        // 사용자가 로그아웃됨
        console.log('사용자 로그아웃');
        showLoginButton();
        clearUserRatings();
    }
});

// 사용자 정보 표시
function showUserInfo(user) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    loginBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    
    // 사용자 아바타 설정
    if (user.photoURL) {
        userAvatar.src = user.photoURL;
    } else {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=667eea&color=fff`;
    }
    
    // 사용자 이름 설정
    userName.textContent = user.displayName || user.email.split('@')[0];
}

// 로그인 버튼 표시
function showLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    
    loginBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
}

// Google 로그인
async function signInWithGoogle() {
    try {
        showLoading('Google 로그인 중...');
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // 사용자 정보를 Firestore에 저장
        await saveUserProfile(user);
        
        hideLoading();
        closeLoginModal();
        showNotification('Google 로그인 성공!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Google 로그인 오류:', error);
        showNotification('Google 로그인에 실패했습니다: ' + error.message, 'error');
    }
}

// 이메일 로그인
async function signInWithEmail(email, password) {
    try {
        showLoading('로그인 중...');
        const result = await auth.signInWithEmailAndPassword(email, password);
        
        hideLoading();
        closeLoginModal();
        showNotification('로그인 성공!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('이메일 로그인 오류:', error);
        
        let errorMessage = '로그인에 실패했습니다.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = '등록되지 않은 이메일입니다.';
                break;
            case 'auth/wrong-password':
                errorMessage = '비밀번호가 잘못되었습니다.';
                break;
            case 'auth/invalid-email':
                errorMessage = '유효하지 않은 이메일 형식입니다.';
                break;
            case 'auth/user-disabled':
                errorMessage = '비활성화된 계정입니다.';
                break;
        }
        
        showNotification(errorMessage, 'error');
    }
}

// 이메일 회원가입
async function signUpWithEmail(name, email, password) {
    try {
        showLoading('회원가입 중...');
        const result = await auth.createUserWithEmailAndPassword(email, password);
        const user = result.user;
        
        // 사용자 프로필 업데이트
        await user.updateProfile({
            displayName: name
        });
        
        // 사용자 정보를 Firestore에 저장
        await saveUserProfile(user, name);
        
        hideLoading();
        closeLoginModal();
        showNotification('회원가입 성공!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('회원가입 오류:', error);
        
        let errorMessage = '회원가입에 실패했습니다.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = '이미 사용 중인 이메일입니다.';
                break;
            case 'auth/weak-password':
                errorMessage = '비밀번호는 6자 이상이어야 합니다.';
                break;
            case 'auth/invalid-email':
                errorMessage = '유효하지 않은 이메일 형식입니다.';
                break;
        }
        
        showNotification(errorMessage, 'error');
    }
}

// 로그아웃
async function signOut() {
    try {
        await auth.signOut();
        showNotification('로그아웃되었습니다.', 'success');
    } catch (error) {
        console.error('로그아웃 오류:', error);
        showNotification('로그아웃에 실패했습니다.', 'error');
    }
}

// 사용자 프로필 저장
async function saveUserProfile(user, displayName = null) {
    try {
        const userDoc = {
            uid: user.uid,
            email: user.email,
            displayName: displayName || user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(user.uid).set(userDoc, { merge: true });
    } catch (error) {
        console.error('사용자 프로필 저장 오류:', error);
    }
}

// 사용자별 평점 저장
async function saveMovieRating(userId, movieData, rating) {
    try {
        const ratingDoc = {
            movieId: movieData.id,
            title: movieData.title,
            poster: movieData.poster_path,
            rating: rating,
            overview: movieData.overview || '',
            releaseDate: movieData.release_date || '',
            voteAverage: movieData.vote_average || 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(userId).collection('ratings').doc(movieData.id.toString()).set(ratingDoc);
        
        showNotification('평점이 저장되었습니다!', 'success');
        
    } catch (error) {
        console.error('평점 저장 오류:', error);
        showNotification('평점 저장에 실패했습니다.', 'error');
    }
}

// 사용자 평점 불러오기
async function loadUserRatings(userId) {
    try {
        const snapshot = await db.collection('users').doc(userId).collection('ratings').orderBy('updatedAt', 'desc').get();
        
        const ratings = [];
        snapshot.forEach(doc => {
            ratings.push({ id: doc.id, ...doc.data() });
        });
        
        displayUserRatings(ratings);
        
    } catch (error) {
        console.error('평점 불러오기 오류:', error);
    }
}

// 사용자 평점 표시
function displayUserRatings(ratings) {
    const container = document.getElementById('rated-movies');
    
    if (ratings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star-half-alt"></i>
                <h3>아직 평가한 영화가 없습니다</h3>
                <p>영화를 검색하고 평점을 매겨보세요!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = ratings.map(rating => `
        <div class="rated-movie-card">
            <div class="rated-movie-poster">
                <img src="${rating.poster ? `https://image.tmdb.org/t/p/w200${rating.poster}` : '/api/placeholder/200/300'}" 
                     alt="${rating.title}" 
                     onerror="this.src='/api/placeholder/200/300'">
            </div>
            <div class="rated-movie-info">
                <h3 class="rated-movie-title">${rating.title}</h3>
                <div class="rated-movie-rating">
                    <div class="stars">
                        ${generateStarsHTML(rating.rating)}
                    </div>
                    <span class="rating-score">${rating.rating}/5</span>
                </div>
                <p class="rated-movie-date">평가일: ${formatDate(rating.updatedAt)}</p>
                <button class="remove-rating-btn" onclick="removeMovieRating('${rating.movieId}')">
                    <i class="fas fa-trash"></i>
                    삭제
                </button>
            </div>
        </div>
    `).join('');
}

// 평점 삭제
async function removeMovieRating(movieId) {
    const user = auth.currentUser;
    if (!user) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }
    
    if (!confirm('이 평점을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        await db.collection('users').doc(user.uid).collection('ratings').doc(movieId).delete();
        
        showNotification('평점이 삭제되었습니다.', 'success');
        loadUserRatings(user.uid); // 목록 새로고침
        
    } catch (error) {
        console.error('평점 삭제 오류:', error);
        showNotification('평점 삭제에 실패했습니다.', 'error');
    }
}

// 사용자 평점 초기화 (로그아웃 시)
function clearUserRatings() {
    const container = document.getElementById('rated-movies');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-sign-in-alt"></i>
            <h3>로그인하여 평점을 확인하세요</h3>
            <p>로그인하면 개인 평점 기록을 볼 수 있습니다.</p>
        </div>
    `;
}

// 특정 영화의 사용자 평점 가져오기
async function getUserMovieRating(movieId) {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
        const doc = await db.collection('users').doc(user.uid).collection('ratings').doc(movieId.toString()).get();
        return doc.exists ? doc.data().rating : null;
    } catch (error) {
        console.error('사용자 평점 조회 오류:', error);
        return null;
    }
}

// 날짜 포맷팅
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 알림 표시 (전역 함수로 설정)
window.showNotification = function(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 제거
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 로딩 표시
function showLoading(message = '로딩 중...') {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            ${message}
        `;
        loading.classList.remove('hidden');
    }
}

// 로딩 숨기기
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}
