// DOM 요소
const urlInput = document.getElementById('urlInput');
const aliasInput = document.getElementById('aliasInput');
const shortenBtn = document.getElementById('shortenBtn');
const warningSection = document.getElementById('warning');
const warningMessage = document.getElementById('warningMessage');
const resultSection = document.getElementById('result');
const shortUrlInput = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const copyMessage = document.getElementById('copyMessage');
const historyList = document.getElementById('historyList');

// 로컬 스토리지 키
const STORAGE_KEY = 'urlShortenerHistory';

// 짧은 URL 기준 (이 길이 이하면 이미 짧다고 판단)
const SHORT_URL_THRESHOLD = 50;

// 페이지 로드 시 기록 불러오기
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    checkRedirect();
});

// URL 해시 기반 리디렉션 확인
function checkRedirect() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const history = getHistory();
        const entry = history.find(item => item.shortCode === hash);
        if (entry) {
            window.location.href = entry.originalUrl;
        }
    }
}

// 단축 버튼 클릭 이벤트
shortenBtn.addEventListener('click', shortenUrl);

// 엔터 키 이벤트
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        shortenUrl();
    }
});

aliasInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        shortenUrl();
    }
});

// 복사 버튼 클릭 이벤트
copyBtn.addEventListener('click', copyToClipboard);

// URL 단축 함수
function shortenUrl() {
    const originalUrl = urlInput.value.trim();
    const customAlias = aliasInput.value.trim();

    // 경고 메시지 초기화
    warningSection.classList.add('hidden');

    // URL 유효성 검사
    if (!originalUrl) {
        showWarning('URL을 입력해주세요.', 'error');
        return;
    }

    if (!isValidUrl(originalUrl)) {
        showWarning('올바른 URL 형식을 입력해주세요. (예: https://example.com)', 'error');
        return;
    }

    // 별칭 유효성 검사
    if (customAlias && !isValidAlias(customAlias)) {
        showWarning('별칭은 영문, 숫자, 하이픈(-)만 사용 가능합니다. (2~20자)', 'error');
        return;
    }

    // 별칭 중복 확인
    if (customAlias) {
        const history = getHistory();
        const existing = history.find(item => item.shortCode === customAlias);
        if (existing) {
            showWarning(`"${customAlias}" 별칭은 이미 사용 중입니다. 다른 별칭을 입력하세요.`, 'error');
            return;
        }
    }

    // URL 파싱해서 도메인 추출
    const urlObj = new URL(originalUrl);
    const domain = urlObj.origin; // https://analytics.google.com

    // 별칭 생성
    const finalCode = customAlias || generateShortCode();

    // 단축 URL = 도메인 + / + 별칭
    const finalShortUrl = `${domain}/${finalCode}`;

    // 이미 짧은 URL 감지
    if (originalUrl.length <= SHORT_URL_THRESHOLD) {
        showWarning(`⚡ 이 URL은 이미 충분히 짧습니다! (${originalUrl.length}자)`, 'info');
    } else if (finalShortUrl.length < originalUrl.length) {
        const saved = originalUrl.length - finalShortUrl.length;
        showWarning(`✅ ${saved}자 단축되었습니다! (${originalUrl.length}자 → ${finalShortUrl.length}자)`, 'info');
    }

    // 기록에 저장
    saveToHistory(originalUrl, finalCode, finalShortUrl);

    // 결과 표시
    shortUrlInput.value = finalShortUrl;
    resultSection.classList.remove('hidden');

    // 기록 목록 업데이트
    loadHistory();

    // 별칭 입력만 초기화 (URL은 유지)
    aliasInput.value = '';
}

// 경고 메시지 표시
function showWarning(message, type) {
    warningMessage.textContent = message;
    warningSection.className = `warning-section ${type}`;
    warningSection.classList.remove('hidden');
}

// URL 유효성 검사
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// 별칭 유효성 검사
function isValidAlias(alias) {
    const aliasRegex = /^[a-zA-Z0-9-]{2,20}$/;
    return aliasRegex.test(alias);
}

// 짧은 코드 생성 (6자리 랜덤 문자열)
function generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 클립보드에 복사
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(shortUrlInput.value);
        copyMessage.classList.remove('hidden');
        setTimeout(() => {
            copyMessage.classList.add('hidden');
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        shortUrlInput.select();
        document.execCommand('copy');
        copyMessage.classList.remove('hidden');
        setTimeout(() => {
            copyMessage.classList.add('hidden');
        }, 2000);
    }
}

// 로컬 스토리지에서 기록 가져오기
function getHistory() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 기록에 저장
function saveToHistory(originalUrl, shortCode, shortUrl) {
    const history = getHistory();

    // 새 항목 추가 (최대 10개 유지)
    history.unshift({
        originalUrl,
        shortCode,
        shortUrl,
        createdAt: new Date().toISOString()
    });

    if (history.length > 10) {
        history.pop();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// 기록 목록 불러오기
function loadHistory() {
    const history = getHistory();
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<li style="color: #999; text-align: center;">아직 단축한 URL이 없습니다.</li>';
        return;
    }

    history.forEach(item => {
        const li = document.createElement('li');

        const originalSpan = document.createElement('span');
        originalSpan.className = 'original-url';
        originalSpan.textContent = item.originalUrl;
        originalSpan.title = item.originalUrl;

        const shortSpan = document.createElement('span');
        shortSpan.className = 'short-code';
        shortSpan.textContent = item.shortUrl || `#${item.shortCode}`;
        shortSpan.title = item.shortUrl || '';

        li.appendChild(originalSpan);
        li.appendChild(shortSpan);
        historyList.appendChild(li);
    });
}

// 토스트 메시지 표시
function showToast(message) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
