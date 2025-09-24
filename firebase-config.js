// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDcssZeknf32BFZugraxYrUK0ddKtTbsjU",
    authDomain: "movie-archive-fa1e0.firebaseapp.com",
    projectId: "movie-archive-fa1e0",
    storageBucket: "movie-archive-fa1e0.firebasestorage.app",
    messagingSenderId: "890265343346",
    appId: "1:890265343346:web:6e60da7d2251b774bbf9eb"
};

// Firebase 초기화 확인
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // 이미 초기화된 경우 기존 앱 사용
}

// Firebase 서비스 초기화
const auth = firebase.auth();
const db = firebase.firestore();

// Firebase 연결 상태 확인
console.log('Firebase 초기화 완료:', {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
});

// Google 로그인 프로바이더 설정
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// 페이지 로드 시 리다이렉트 결과 먼저 확인
let redirectResultChecked = false;

// 리다이렉트 결과 확인 함수
async function checkRedirectResult() {
    if (redirectResultChecked) return;
    redirectResultChecked = true;
    
    try {
        console.log('🔍 리다이렉트 결과 확인 중...');
        const result = await auth.getRedirectResult();
        
        if (result && result.user) {
            console.log('✅ 리다이렉트 로그인 성공:', result.user.email);
            console.log('사용자 정보:', {
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                uid: result.user.uid
            });
            
            // 사용자 프로필 저장
            await saveUserProfile(result.user);
            
            // UI 업데이트
            hideLoading();
            if (typeof hideLoginModal === 'function') {
                hideLoginModal();
            }
            
            showNotification('Google 로그인 성공!', 'success');
            
            // 사용자 정보 표시 (onAuthStateChanged가 호출되기 전에)
            showUserInfo(result.user);
            loadUserRatings(result.user.uid);
            
        } else if (result) {
            console.log('📝 리다이렉트 결과 있지만 사용자 없음');
            console.log('리다이렉트 결과 상세:', {
                user: result.user,
                credential: result.credential,
                operationType: result.operationType,
                additionalUserInfo: result.additionalUserInfo
            });
            
            // 결과는 있지만 사용자가 없는 경우 처리
            if (result.credential) {
                console.log('🔄 credential 정보가 있음, 재인증 시도...');
                try {
                    // credential을 사용하여 재인증 시도
                    const reAuthResult = await auth.signInWithCredential(result.credential);
                    if (reAuthResult.user) {
                        console.log('✅ 재인증 성공:', reAuthResult.user.email);
                        await saveUserProfile(reAuthResult.user);
                        showUserInfo(reAuthResult.user);
                        loadUserRatings(reAuthResult.user.uid);
                        showNotification('Google 로그인 성공!', 'success');
                    }
                } catch (reAuthError) {
                    console.error('❌ 재인증 실패:', reAuthError);
                }
            }
            
        } else {
            console.log('📝 리다이렉트 결과 없음');
            
            // localStorage에서 로그인 시도 기록 확인
            const loginAttempt = localStorage.getItem('googleLoginAttempt');
            if (loginAttempt) {
                const attemptTime = parseInt(loginAttempt);
                const timeDiff = Date.now() - attemptTime;
                
                console.log(`🔍 이전 로그인 시도 발견 (${Math.round(timeDiff/1000)}초 전)`);
                
                if (timeDiff < 300000) { // 5분 이내
                    console.log('⚠️ 최근 로그인 시도가 있었으나 결과가 없음');
                    console.log('💡 Google 로그인이 취소되었거나 실패했을 가능성');
                    
                    // 로그인 시도 기록 삭제
                    localStorage.removeItem('googleLoginAttempt');
                    
                    // 사용자에게 알림
                    showNotification('Google 로그인이 취소되었습니다. 다시 시도해주세요.', 'warning');
                }
            }
            
            // URL에 Google 로그인 관련 파라미터가 있는지 확인
            const urlParams = new URLSearchParams(window.location.search);
            const hasAuthParams = urlParams.has('state') || urlParams.has('code') || 
                                 window.location.hash.includes('access_token');
            
            if (hasAuthParams) {
                console.log('🔍 URL에 인증 파라미터 발견, 재시도 예정...');
                // 1초 후 다시 확인
                setTimeout(async () => {
                    console.log('🔄 리다이렉트 결과 재확인...');
                    try {
                        const retryResult = await auth.getRedirectResult();
                        if (retryResult && retryResult.user) {
                            console.log('✅ 재시도로 로그인 성공:', retryResult.user.email);
                            await saveUserProfile(retryResult.user);
                            showUserInfo(retryResult.user);
                            loadUserRatings(retryResult.user.uid);
                            showNotification('Google 로그인 성공!', 'success');
                        }
                    } catch (retryError) {
                        console.error('❌ 재시도 실패:', retryError);
                    }
                }, 1000);
            } else {
                console.log('📝 일반 페이지 로드 (로그인 시도 없음)');
            }
        }
        
    } catch (error) {
        console.error('❌ 리다이렉트 결과 처리 오류:', error);
        hideLoading();
        
        // 오류 메시지 표시
        let errorMessage = '로그인 처리 중 오류가 발생했습니다.';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = '로그인이 취소되었습니다.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = '네트워크 연결을 확인해주세요.';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// 페이지 로드 시 즉시 리다이렉트 결과 확인
checkRedirectResult();

// 인증 상태 변경 리스너
auth.onAuthStateChanged(async (user) => {
    // 리다이렉트 결과가 아직 확인되지 않았다면 확인
    if (!redirectResultChecked) {
        await checkRedirectResult();
    }
    
    if (user) {
        // 사용자가 로그인됨
        console.log('👤 사용자 로그인 상태 변경:', user.email);
        showUserInfo(user);
        loadUserRatings(user.uid);
    } else {
        // 사용자가 로그아웃됨
        console.log('👤 사용자 로그아웃 상태');
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
    
    console.log('사용자 정보 표시:', user.email);
    
    if (loginBtn) {
        loginBtn.classList.add('hidden');
        loginBtn.style.display = 'none';
    }
    
    if (userInfo) {
        userInfo.classList.remove('hidden');
        userInfo.style.display = 'flex';
    }
    
    // 사용자 아바타 설정
    if (userAvatar) {
        if (user.photoURL) {
            userAvatar.src = user.photoURL;
        } else {
            userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=667eea&color=fff`;
        }
    }
    
    // 사용자 이름 설정
    if (userName) {
        userName.textContent = user.displayName || user.email.split('@')[0];
    }
}

// 로그인 버튼 표시
function showLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    
    console.log('로그인 버튼 표시');
    
    if (loginBtn) {
        loginBtn.classList.remove('hidden');
        loginBtn.style.display = 'flex';
    }
    
    if (userInfo) {
        userInfo.classList.add('hidden');
        userInfo.style.display = 'none';
    }
    
    // 사용자 정보 초기화
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    if (userAvatar) {
        userAvatar.src = '';
    }
    
    if (userName) {
        userName.textContent = '';
    }
}

// Google 로그인 (리다이렉트 방식 사용)
async function signInWithGoogle() {
    try {
        console.log('Google 로그인 시도 시작...');
        showLoading('Google 로그인 중...');
        
        // Firebase Auth 초기화 확인
        if (!auth) {
            throw new Error('Firebase Auth가 초기화되지 않았습니다.');
        }
        
        // Google Provider 확인
        if (!googleProvider) {
            throw new Error('Google Provider가 설정되지 않았습니다.');
        }
        
        // 모바일 환경 감지
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        window.innerWidth <= 768;
        
        // 로컬 환경 및 GitHub Pages 환경 감지
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isGitHubPages = window.location.hostname.includes('github.io');
        
        if (isLocal || isGitHubPages) {
            console.log('환경 감지:', { isLocal, isGitHubPages, hostname: window.location.hostname });
            console.log('모바일 환경 감지:', isMobile);
            
            // 모바일에서는 바로 리다이렉트 사용
            if (isMobile) {
                console.log('📱 모바일 환경 - 리다이렉트 로그인 사용...');
                
                // 리다이렉트 시작 전 상태 저장
                localStorage.setItem('googleLoginAttempt', Date.now().toString());
                
                console.log('Google 리다이렉트 시작...');
                await auth.signInWithRedirect(googleProvider);
                return;
            }
            
            // 데스크톱에서는 팝업 시도, 실패 시 리다이렉트
            try {
                console.log('🖥️ 데스크톱 환경 - 팝업 로그인 시도...');
                const result = await auth.signInWithPopup(googleProvider);
                const user = result.user;
                
                console.log('✅ 팝업 로그인 성공:', user.email);
                await saveUserProfile(user);
                hideLoading();
                hideLoginModal();
                showNotification('Google 로그인 성공!', 'success');
                return;
                
            } catch (popupError) {
                console.log('❌ 팝업 로그인 실패:', popupError.code);
                
                // 팝업이 실패하면 리다이렉트로 시도
                if (popupError.code === 'auth/popup-blocked' || 
                    popupError.code === 'auth/popup-closed-by-user' ||
                    popupError.message.includes('Cross-Origin-Opener-Policy')) {
                    
                    console.log('🔄 팝업 실패로 인한 리다이렉트 방식으로 전환...');
                    
                    // 리다이렉트 시작 전 상태 저장
                    localStorage.setItem('googleLoginAttempt', Date.now().toString());
                    
                    console.log('Google 리다이렉트 시작...');
                    await auth.signInWithRedirect(googleProvider);
                    return;
                } else {
                    throw popupError; // 다른 오류는 그대로 전파
                }
            }
        }
        
        // 프로덕션 환경에서도 모바일 고려
        if (isMobile) {
            console.log('📱 프로덕션 모바일 환경 - 리다이렉트 로그인 사용...');
            
            // 리다이렉트 시작 전 상태 저장
            localStorage.setItem('googleLoginAttempt', Date.now().toString());
            
            await auth.signInWithRedirect(googleProvider);
            return;
        }
        
        // 데스크톱에서는 팝업 시도
        console.log('🖥️ 프로덕션 데스크톱 - 팝업 로그인 시도...');
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        console.log('Google 로그인 성공:', user.email);
        
        // 사용자 정보를 Firestore에 저장
        await saveUserProfile(user);
        
        hideLoading();
        hideLoginModal();
        showNotification('Google 로그인 성공!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Google 로그인 상세 오류:', error);
        
        let errorMessage = 'Google 로그인에 실패했습니다.';
        
        // COOP 정책 오류 처리
        if (error.message && error.message.includes('Cross-Origin-Opener-Policy')) {
            console.log('COOP 정책 오류 감지 - 리다이렉트 방식으로 재시도...');
            try {
                await auth.signInWithRedirect(googleProvider);
                return;
            } catch (redirectError) {
                console.error('리다이렉트 로그인도 실패:', redirectError);
                errorMessage = '로그인 방식을 변경하여 다시 시도해주세요.';
            }
        }
        
        switch (error.code) {
            case 'auth/popup-blocked':
                errorMessage = '팝업이 차단되었습니다. 리다이렉트 방식으로 재시도합니다.';
                // 팝업이 차단된 경우 리다이렉트로 재시도
                try {
                    await auth.signInWithRedirect(googleProvider);
                    return;
                } catch (redirectError) {
                    errorMessage = '로그인에 실패했습니다. 브라우저 설정을 확인해주세요.';
                }
                break;
            case 'auth/popup-closed-by-user':
                errorMessage = '로그인이 취소되었습니다.';
                break;
            case 'auth/unauthorized-domain':
                errorMessage = '승인되지 않은 도메인입니다. Firebase 설정을 확인해주세요.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Google 로그인이 활성화되지 않았습니다.';
                break;
            default:
                errorMessage = `로그인 오류: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
    }
}

// 이메일 로그인
async function signInWithEmail(email, password) {
    try {
        console.log('이메일 로그인 시도:', email);
        showLoading('로그인 중...');
        
        // Firebase Auth 초기화 확인
        if (!auth) {
            throw new Error('Firebase Auth가 초기화되지 않았습니다.');
        }
        
        // 입력값 검증
        if (!email || !password) {
            throw new Error('이메일과 비밀번호를 모두 입력해주세요.');
        }
        
        console.log('Firebase 로그인 시도...');
        const result = await auth.signInWithEmailAndPassword(email, password);
        const user = result.user;
        
        console.log('이메일 로그인 성공:', user.email);
        
        hideLoading();
        hideLoginModal();
        showNotification('로그인 성공!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('이메일 로그인 상세 오류:', error);
        
        let errorMessage = '로그인에 실패했습니다.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = '등록되지 않은 이메일입니다. 회원가입을 먼저 해주세요.';
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
            case 'auth/too-many-requests':
                errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
                break;
            case 'auth/network-request-failed':
                errorMessage = '네트워크 연결을 확인해주세요.';
                break;
            case 'auth/invalid-login-credentials':
                errorMessage = '이메일 또는 비밀번호가 잘못되었습니다. 다시 확인해주세요.';
                break;
            case 'auth/invalid-credential':
                errorMessage = '잘못된 로그인 정보입니다. 이메일과 비밀번호를 확인해주세요.';
                break;
            default:
                errorMessage = `로그인 오류: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
    }
}

// 이메일 회원가입
async function signUpWithEmail(name, email, password) {
    try {
        console.log('이메일 회원가입 시도:', email);
        showLoading('회원가입 중...');
        
        // Firebase Auth 초기화 확인
        if (!auth) {
            throw new Error('Firebase Auth가 초기화되지 않았습니다.');
        }
        
        // 입력값 검증
        if (!name || !email || !password) {
            throw new Error('모든 필드를 입력해주세요.');
        }
        
        if (password.length < 6) {
            throw new Error('비밀번호는 6자 이상이어야 합니다.');
        }
        
        console.log('Firebase 회원가입 시도...');
        const result = await auth.createUserWithEmailAndPassword(email, password);
        const user = result.user;
        
        console.log('회원가입 성공, 프로필 업데이트 중...');
        
        // 사용자 프로필 업데이트
        await user.updateProfile({
            displayName: name
        });
        
        // 사용자 정보를 Firestore에 저장
        await saveUserProfile(user, name);
        
        hideLoading();
        hideLoginModal();
        showNotification('회원가입 성공!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('회원가입 상세 오류:', error);
        
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
            case 'auth/operation-not-allowed':
                errorMessage = '이메일 회원가입이 활성화되지 않았습니다.';
                break;
            default:
                errorMessage = `회원가입 오류: ${error.message}`;
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

// 비밀번호 재설정 이메일 발송
async function sendPasswordReset(email) {
    try {
        console.log('비밀번호 재설정 이메일 발송 시도:', email);
        
        // Firebase Auth 초기화 확인
        if (!auth) {
            throw new Error('Firebase Auth가 초기화되지 않았습니다.');
        }
        
        // 이메일 검증
        if (!email || !email.trim()) {
            throw new Error('이메일 주소를 입력해주세요.');
        }
        
        console.log('Firebase 비밀번호 재설정 이메일 발송...');
        await auth.sendPasswordResetEmail(email.trim());
        
        console.log('비밀번호 재설정 이메일 발송 성공');
        showNotification(`비밀번호 재설정 이메일이 ${email}로 발송되었습니다. 이메일을 확인해주세요.`, 'success');
        
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        
        let errorMessage = '비밀번호 재설정에 실패했습니다.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = '등록되지 않은 이메일 주소입니다.';
                break;
            case 'auth/invalid-email':
                errorMessage = '유효하지 않은 이메일 형식입니다.';
                break;
            case 'auth/too-many-requests':
                errorMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.';
                break;
            case 'auth/network-request-failed':
                errorMessage = '네트워크 연결을 확인해주세요.';
                break;
            default:
                errorMessage = `비밀번호 재설정 오류: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
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

// Firebase 함수들을 전역으로 설정 (script.js에서 접근 가능하도록)
window.signInWithGoogle = signInWithGoogle;
window.signInWithEmail = signInWithEmail;
window.signUpWithEmail = signUpWithEmail;
window.signOut = signOut;
window.sendPasswordReset = sendPasswordReset;
window.getUserMovieRating = getUserMovieRating;
window.saveMovieRating = saveMovieRating;
window.removeMovieRating = removeMovieRating;

// 디버깅용 함수
window.testSignup = function(name, email, password) {
    console.log('테스트 회원가입 호출:', { name, email, password: '***' });
    return signUpWithEmail(name, email, password);
};

console.log('Firebase 함수들이 전역으로 설정되었습니다:', {
    signInWithGoogle: typeof window.signInWithGoogle,
    signInWithEmail: typeof window.signInWithEmail,
    signUpWithEmail: typeof window.signUpWithEmail,
    signOut: typeof window.signOut
});

// Firebase 설정 상태 확인 함수
window.checkFirebaseConfig = function() {
    console.log('=== Firebase 설정 상태 ===');
    console.log('Firebase 앱:', firebase.apps.length > 0 ? '초기화됨' : '초기화 안됨');
    console.log('Auth 서비스:', auth ? '사용 가능' : '사용 불가');
    console.log('Firestore 서비스:', db ? '사용 가능' : '사용 불가');
    console.log('현재 도메인:', window.location.hostname);
    console.log('현재 프로토콜:', window.location.protocol);
    console.log('현재 사용자:', auth.currentUser ? auth.currentUser.email : '없음');
    console.log('리다이렉트 결과 확인됨:', redirectResultChecked);
    console.log('=========================');
};

// 수동 리다이렉트 결과 확인 함수
window.manualCheckRedirect = async function() {
    console.log('🔄 수동 리다이렉트 결과 확인...');
    
    // URL 파라미터 확인
    console.log('현재 URL:', window.location.href);
    console.log('URL 파라미터:', window.location.search);
    console.log('URL 해시:', window.location.hash);
    
    // 직접 getRedirectResult 호출
    try {
        const result = await auth.getRedirectResult();
        console.log('리다이렉트 결과 원본:', result);
        
        if (result) {
            console.log('결과 상세 정보:');
            console.log('- user:', result.user);
            console.log('- credential:', result.credential);
            console.log('- operationType:', result.operationType);
            console.log('- additionalUserInfo:', result.additionalUserInfo);
        }
        
        // 강제로 checkRedirectResult 재실행
        redirectResultChecked = false;
        await checkRedirectResult();
        
    } catch (error) {
        console.error('수동 확인 오류:', error);
    }
};

// 강제 로그인 상태 새로고침
window.refreshAuthState = function() {
    console.log('🔄 인증 상태 새로고침...');
    const currentUser = auth.currentUser;
    if (currentUser) {
        console.log('현재 사용자 발견:', currentUser.email);
        showUserInfo(currentUser);
        loadUserRatings(currentUser.uid);
    } else {
        console.log('현재 사용자 없음');
        showLoginButton();
        clearUserRatings();
    }
};

// 강제 팝업 로그인 테스트
window.testPopupLogin = async function() {
    console.log('🪟 강제 팝업 로그인 테스트...');
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        console.log('팝업 창 열기 시도...');
        const result = await auth.signInWithPopup(provider);
        
        console.log('✅ 팝업 로그인 성공:', result.user.email);
        await saveUserProfile(result.user);
        showUserInfo(result.user);
        loadUserRatings(result.user.uid);
        showNotification('팝업 로그인 성공!', 'success');
        
    } catch (error) {
        console.error('❌ 팝업 로그인 실패:', error);
        console.log('오류 코드:', error.code);
        console.log('오류 메시지:', error.message);
    }
};

// 강제 리다이렉트 로그인 테스트
window.testRedirectLogin = async function() {
    console.log('🔄 강제 리다이렉트 로그인 테스트...');
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // 리다이렉트 시작 전 상태 저장
        localStorage.setItem('googleLoginAttempt', Date.now().toString());
        
        console.log('리다이렉트 시작...');
        await auth.signInWithRedirect(provider);
        
    } catch (error) {
        console.error('❌ 리다이렉트 로그인 실패:', error);
        localStorage.removeItem('googleLoginAttempt');
    }
};
