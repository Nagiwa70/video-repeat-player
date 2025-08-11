const videoInput = document.getElementById('videoInput');
const videoPlayer = document.getElementById('videoPlayer');
const progressBarContainer = document.getElementById('progressBarContainer');
const repeatRangeDisplay = document.getElementById('repeatRangeDisplay');
const repeatStatusDisplay = document.getElementById('repeatStatusDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const resetButton = document.getElementById('resetButton');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');

let repeatStart = null;
let repeatEnd = null;
let isRepeating = false; // 常にONなのであまり意味なし

const startMarker = createMarker('startMarker', 'green');
const endMarker = createMarker('endMarker', 'blue');
const currentMarker = createMarker('currentMarker', 'red');

function createMarker(id, color) {
  const marker = document.createElement('div');
  marker.id = id;
  marker.classList.add('marker');
  marker.style.background = color;
  marker.style.display = 'none';
  progressBarContainer.appendChild(marker);
  return marker;
}

videoInput.addEventListener('change', () => {
  const file = videoInput.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.play();
    resetRepeat();
  }
});

progressBarContainer.addEventListener('click', (e) => {
  if (!videoPlayer.duration) return;

  const rect = progressBarContainer.getBoundingClientRect();
  const clickRatio = (e.clientX - rect.left) / rect.width;
  const clickedTime = videoPlayer.duration * clickRatio;

  if (repeatStart === null) {
    repeatStart = clickedTime;
    repeatEnd = null;
    updateMarkers();
    updateRepeatDisplay();
  } else if (repeatEnd === null) {
    if (clickedTime <= repeatStart) {
      alert('終了時間は開始時間より後にしてください。');
      return;
    }
    repeatEnd = clickedTime;
    updateMarkers();
    updateRepeatDisplay();
  } else {
    // 既に開始終了設定済なら再クリックでリセットして開始設定からやり直す
    repeatStart = clickedTime;
    repeatEnd = null;
    updateMarkers();
    updateRepeatDisplay();
  }
});

window.addEventListener('keydown', (e) => {
  if (!videoPlayer.duration) return;

  switch (e.code) {
    case 'KeyZ': // Zで開始位置設定
      repeatStart = videoPlayer.currentTime;
      if (repeatEnd !== null && repeatEnd <= repeatStart) {
        repeatEnd = null;
      }
      updateMarkers();
      updateRepeatDisplay();
      break;

    case 'KeyX': // Xで終了位置設定
      if (repeatStart === null) {
        alert('先に開始位置を設定してください。');
        break;
      }
      if (videoPlayer.currentTime <= repeatStart) {
        alert('終了位置は開始位置より後にしてください。');
        break;
      }
      repeatEnd = videoPlayer.currentTime;
      updateMarkers();
      updateRepeatDisplay();
      break;

    case 'KeyC': // Cでリセット
      resetRepeat();
      break;

    case 'KeyV': // Vで開始位置に移動
      if (repeatStart !== null) {
        videoPlayer.currentTime = repeatStart;
      }
      break;

    case 'Space': // スペースで再生/停止
      e.preventDefault(); // スクロール防止
      if (videoPlayer.paused) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
      break;
  }
});

videoPlayer.addEventListener('timeupdate', () => {
  updateCurrentMarker();
  updateTimeDisplay();

  if (repeatStart !== null && repeatEnd !== null) {
    if (videoPlayer.currentTime >= repeatEnd) {
      videoPlayer.currentTime = repeatStart;
    }
  }
});

resetButton.addEventListener('click', () => {
  resetRepeat();
});
// 動画クリックで再生・一時停止切り替え
videoPlayer.addEventListener('click', () => {
  if (videoPlayer.paused) {
    videoPlayer.play();
  } else {
    videoPlayer.pause();
  }
});

// スマホ用ボタン取得
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const goStartBtn = document.getElementById('goStartBtn');

setStartBtn.addEventListener('click', () => {
  repeatStart = videoPlayer.currentTime;
  if (repeatEnd !== null && repeatEnd <= repeatStart) {
    repeatEnd = null;
  }
  updateMarkers();
  updateRepeatRangeDisplay();
});

setEndBtn.addEventListener('click', () => {
  if (repeatStart === null) {
    alert('先に開始位置を設定してください');
    return;
  }
  if (videoPlayer.currentTime <= repeatStart) {
    alert('終了位置は開始位置より後にしてください');
    return;
  }
  repeatEnd = videoPlayer.currentTime;
  updateMarkers();
  updateRepeatRangeDisplay();
});

goStartBtn.addEventListener('click', () => {
  if (repeatStart !== null) {
    videoPlayer.currentTime = repeatStart;
    videoPlayer.play();
  }
});

// リピート区間表示更新（既存の箇所と重複しないように共通化）
function updateRepeatRangeDisplay() {
  if (repeatStart === null && repeatEnd === null) {
    repeatRangeDisplay.textContent = 'リピート区間: 未設定';
  } else if (repeatStart !== null && repeatEnd === null) {
    repeatRangeDisplay.textContent = `リピート区間: 開始 ${repeatStart.toFixed(2)}秒 - 未設定`;
  } else {
    repeatRangeDisplay.textContent = `リピート区間: 開始 ${repeatStart.toFixed(2)}秒 - 終了 ${repeatEnd.toFixed(2)}秒`;
  }
}

// 再生速度スライダーと数値連動
speedRange.addEventListener('input', () => {
  const val = parseFloat(speedRange.value);
  speedValue.value = val.toFixed(2);
  videoPlayer.playbackRate = val;
});
speedValue.addEventListener('input', () => {
  let val = parseFloat(speedValue.value);
  if (isNaN(val)) return;
  val = Math.min(Math.max(val, parseFloat(speedRange.min)), parseFloat(speedRange.max));
  speedValue.value = val.toFixed(2);
  speedRange.value = val;
  videoPlayer.playbackRate = val;
});

function resetRepeat() {
  repeatStart = null;
  repeatEnd = null;
  updateMarkers();
  updateRepeatDisplay();
}

function updateMarkers() {
  if (!videoPlayer.duration) return;

  if (repeatStart !== null) {
    startMarker.style.left = (repeatStart / videoPlayer.duration * 100) + '%';
    startMarker.style.display = 'block';
  } else {
    startMarker.style.display = 'none';
  }
  if (repeatEnd !== null) {
    endMarker.style.left = (repeatEnd / videoPlayer.duration * 100) + '%';
    endMarker.style.display = 'block';
  } else {
    endMarker.style.display = 'none';
  }
}

function updateCurrentMarker() {
  if (!videoPlayer.duration) return;
  currentMarker.style.left = (videoPlayer.currentTime / videoPlayer.duration * 100) + '%';
  currentMarker.style.display = 'block';
}

function updateTimeDisplay() {
  timeDisplay.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
}

function updateRepeatDisplay() {
  if (repeatStart === null) {
    repeatRangeDisplay.textContent = 'リピート区間: 未設定';
  } else if (repeatEnd === null) {
    repeatRangeDisplay.textContent = `リピート区間: 開始 ${repeatStart.toFixed(2)}秒 - 未設定`;
  } else {
    repeatRangeDisplay.textContent = `リピート区間: 開始 ${repeatStart.toFixed(2)}秒 - 終了 ${repeatEnd.toFixed(2)}秒`;
  }
}

function formatTime(sec) {
  if (!isFinite(sec)) return '00:00';
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
