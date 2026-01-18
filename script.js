// DOM 요소
const urlInput = document.getElementById('urlInput');
const shortenBtn = document.getElementById('shortenBtn');
const resultSection = document.getElementById('result');
const shortUrlInput = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const copyMessage = document.getElementById('copyMessage');
const historyList = document.getElementById('historyList');

// 로컬 스토리지 키
const STORAGE_KEY = 'urlShortenerHistory';

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

// 복사 버튼 클릭 이벤트
copyBtn.addEventListener('click', copyToClipboard);

// URL 단축 함수
function shortenUrl() {
    const originalUrl = urlInput.value.trim();

    // URL 유효성 검사
    if (!originalUrl) {
        alert('URL을 입력해주세요.');
        return;
    }

    if (!isValidUrl(originalUrl)) {
        alert('올바른 URL 형식을 입력해주세요. (예: https://example.com)');
        return;
    }

    // 짧은 코드 생성
    const shortCode = generateShortCode();

    // 현재 페이지 URL을 기반으로 단축 URL 생성
    const baseUrl = window.location.origin + window.location.pathname;
    const shortUrl = `${baseUrl}#${shortCode}`;

    // 기록에 저장
    saveToHistory(originalUrl, shortCode);

    // 결과 표시
    shortUrlInput.value = shortUrl;
    resultSection.classList.remove('hidden');

    // 기록 목록 업데이트
    loadHistory();

    // 입력 필드 초기화
    urlInput.value = '';
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
function saveToHistory(originalUrl, shortCode) {
    const history = getHistory();

    // 중복 확인 (같은 원본 URL이 있으면 기존 것 사용)
    const existing = history.find(item => item.originalUrl === originalUrl);
    if (existing) {
        return existing.shortCode;
    }

    // 새 항목 추가 (최대 10개 유지)
    history.unshift({
        originalUrl,
        shortCode,
        createdAt: new Date().toISOString()
    });

    if (history.length > 10) {
        history.pop();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return shortCode;
}

// 기록 목록 불러오기
function loadHistory() {
    const history = getHistory();
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<li style="color: #999; text-align: center;">아직 단축한 URL이 없습니다.</li>';
        return;
    }

    const baseUrl = window.location.origin + window.location.pathname;

    history.forEach(item => {
        const li = document.createElement('li');

        const originalSpan = document.createElement('span');
        originalSpan.className = 'original-url';
        originalSpan.textContent = item.originalUrl;
        originalSpan.title = item.originalUrl;

        const shortLink = document.createElement('a');
        shortLink.className = 'short-url';
        shortLink.href = `${baseUrl}#${item.shortCode}`;
        shortLink.textContent = `#${item.shortCode}`;
        shortLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(`${baseUrl}#${item.shortCode}`);
            alert('URL이 복사되었습니다!');
        });

        li.appendChild(originalSpan);
        li.appendChild(shortLink);
        historyList.appendChild(li);
    });
}
