const videoInput = document.getElementById('videoInput');
const videoPlayer = document.getElementById('videoPlayer');
const progressBarContainer = document.getElementById('progressBarContainer');
const repeatRangeDisplay = document.getElementById('repeatRangeDisplay');
const repeatStatusDisplay = document.getElementById('repeatStatusDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const resetButton = document.getElementById('resetButton');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const goStartBtn = document.getElementById('goStartBtn');
const mobileControls = document.getElementById('mobileControls');

let repeatStart = null;
let repeatEnd = null;
let isRepeating = true; // 常にONなのでtrue固定

// マーカー作成
const startMarker = createMarker('startMarker', '#39b54a');
const endMarker = createMarker('endMarker', '#2196f3');
const currentMarker = createMarker('currentMarker', '#e74c3c');

function createMarker(id, color) {
  const marker = document.createElement('div');
  marker.id = id;
  marker.classList.add('marker');
  marker.style.background = color;
  progressBarContainer.appendChild(marker);
  return marker;
}

// 動画ファイル読み込み
videoInput.addEventListener('change', () => {
  const file = videoInput.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.play();
    resetRepeat();
  }
});

// 再生バーのクリックで再生位置移動
progressBarContainer.addEventListener('click', (e) => {
  if (!videoPlayer.duration) return;
  const rect = progressBarContainer.getBoundingClientRect();
  const clickRatio = (e.clientX - rect.left) / rect.width;
  const clickedTime = videoPlayer.duration * clickRatio;
  videoPlayer.currentTime = clickedTime;
});

// マーカー更新
function updateMarkers() {
  if (repeatStart !== null && videoPlayer.duration) {
    startMarker.style.left = (repeatStart / videoPlayer.duration * 100) + '%';
    startMarker.style.display = 'block';
  } else {
    startMarker.style.display = 'none';
  }
  if (repeatEnd !== null && videoPlayer.duration) {
    endMarker.style.left = (repeatEnd / videoPlayer.duration * 100) + '%';
    endMarker.style.display = 'block';
  } else {
    endMarker.style.display = 'none';
  }
}

// 現在位置マーカー更新
function updateCurrentMarker() {
  if (!videoPlayer.duration) {
    currentMarker.style.display = 'none';
    return;
  }
  const percent = videoPlayer.currentTime / videoPlayer.duration * 100;
  currentMarker.style.left = percent + '%';
  currentMarker.style.display = 'block';
}

// 時刻表示更新
function updateTimeDisplay() {
  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }
  const current = formatTime(videoPlayer.currentTime);
  const duration = videoPlayer.duration ? formatTime(videoPlayer.duration) : '00:00';
  timeDisplay.textContent = `${current} / ${duration}`;
}

// 動画再生時間の更新時処理
videoPlayer.addEventListener('timeupdate', () => {
  updateCurrentMarker();
  updateTimeDisplay();
  if (isRepeating && repeatStart !== null && repeatEnd !== null) {
    if (videoPlayer.currentTime > repeatEnd) {
      videoPlayer.currentTime = repeatStart;
      videoPlayer.play();
    }
  }
});

// 区間リセット
function resetRepeat() {
  repeatStart = null;
  repeatEnd = null;
  updateMarkers();
  repeatRangeDisplay.textContent = 'リピート区間: 未設定';
}

// リピート区間リセットボタン
resetButton.addEventListener('click', () => {
  resetRepeat();
});

// 再生速度変更同期
speedRange.addEventListener('input', () => {
  speedValue.value = speedRange.value;
  videoPlayer.playbackRate = parseFloat(speedRange.value);
});
speedValue.addEventListener('change', () => {
  let val = parseFloat(speedValue.value);
  if (isNaN(val)) val = 1;
  if (val < 0.25) val = 0.25;
  if (val > 4) val = 4;
  speedValue.value = val.toFixed(2);
  speedRange.value = val;
  videoPlayer.playbackRate = val;
});

// キーボードショートカット
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return; // 入力中は無視
  switch(e.key.toLowerCase()) {
    case 'z':
      if (videoPlayer.duration) {
        repeatStart = videoPlayer.currentTime;
        updateMarkers();
        updateRepeatDisplay();
      }
      break;
    case 'x':
      if (videoPlayer.duration) {
        if (repeatStart !== null && videoPlayer.currentTime <= repeatStart) {
          alert('終了位置は開始位置より後に設定してください。');
          break;
        }
        repeatEnd = videoPlayer.currentTime;
        updateMarkers();
        updateRepeatDisplay();
      }
      break;
    case 'c':
      resetRepeat();
      break;
    case 'v':
      if (repeatStart !== null) {
        videoPlayer.currentTime = repeatStart;
      }
      break;
    case ' ':
      e.preventDefault();
      if (videoPlayer.paused) videoPlayer.play();
      else videoPlayer.pause();
      break;
  }
});

// ボタン操作で区間設定
setStartBtn.addEventListener('click', () => {
  if (videoPlayer.duration) {
    repeatStart = videoPlayer.currentTime;
    updateMarkers();
    updateRepeatDisplay();
  }
});
setEndBtn.addEventListener('click', () => {
  if (videoPlayer.duration) {
    if (repeatStart !== null && videoPlayer.currentTime <= repeatStart) {
      alert('終了位置は開始位置より後に設定してください。');
      return;
    }
    repeatEnd = videoPlayer.currentTime;
    updateMarkers();
    updateRepeatDisplay();
  }
});
goStartBtn.addEventListener('click', () => {
  if (repeatStart !== null) {
    videoPlayer.currentTime = repeatStart;
  }
});

// リピート区間表示更新
function updateRepeatDisplay() {
  const startStr = repeatStart !== null ? repeatStart.toFixed(2) : '未設定';
  const endStr = repeatEnd !== null ? repeatEnd.toFixed(2) : '未設定';
  repeatRangeDisplay.textContent = `リピート区間: 開始 ${startStr} 秒 - 終了 ${endStr} 秒`;
}

// テーマ切り替え（簡易版）
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  if (document.body.classList.contains('light-theme')) {
    themeToggleBtn.textContent = '🌙';
  } else {
    themeToggleBtn.textContent = '☀️';
  }
});

// モバイルか判定してモバイル用ボタン表示切り替え
function detectMobile() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    mobileControls.style.display = 'block';
  } else {
    mobileControls.style.display = 'none';
  }
}
detectMobile();
// 動画タップで再生/停止切替（スマホでの操作補助）
videoPlayer.addEventListener('click', () => {
  if (videoPlayer.paused) videoPlayer.play();
  else videoPlayer.pause();
});
