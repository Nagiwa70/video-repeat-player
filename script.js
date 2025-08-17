document.addEventListener('DOMContentLoaded', () => {
  // --- 要素の取得 ---
  const videoInput = document.getElementById('videoInput');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoContainer = document.getElementById('videoContainer');
  const videoUploadContainer = document.getElementById('videoUploadContainer');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const progressBarContainer = document.getElementById('progressBarContainer');
  const repeatRangeDisplay = document.getElementById('repeatRangeDisplay');
  const timeDisplay = document.getElementById('timeDisplay');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const speedRange = document.getElementById('speedRange');
  const speedValue = document.getElementById('speedValue');
  const videoOverlay = document.getElementById('videoOverlay');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const setStartBtn = document.getElementById('setStartBtn');
  const setEndBtn = document.getElementById('setEndBtn');
  const goStartBtn = document.getElementById('goStartBtn');
  const resetButton = document.getElementById('resetButton');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const progressBar = document.getElementById('progressBar');
  const progressTimeTooltip = document.getElementById('progressTimeTooltip');
  const repeatRangeBar = document.getElementById('repeatRangeBar');

  // --- 状態変数 ---
  let repeatStart = null;
  let repeatEnd = null;
  const isRepeating = true;
  let isDragging = false;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  let controlsTimer = null;
  let inactiveTimer = null;

  // --- マーカー作成 ---
  const startMarker = createMarker('startMarker');
  const endMarker = createMarker('endMarker');
  const currentMarker = createMarker('currentMarker');
  
  // --- 全画面切り替え用のSVGアイコン ---
  const FULLSCREEN_ICON = '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg>';
  const EXIT_FULLSCREEN_ICON = '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg>';

  // --- 初期化処理 ---
  if (isMobile) {
    videoContainer.classList.add('is-mobile');
  }

  // --- 関数定義 ---

  function createMarker(id) {
    const marker = document.createElement('div');
    marker.id = id;
    marker.classList.add('marker');
    progressBarContainer.appendChild(marker);
    return marker;
  }
  
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    const MAX_TOASTS = 3;
    while (container.children.length >= MAX_TOASTS) {
      container.removeChild(container.firstChild);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }
  
  function setStartTime(time) {
    if (!videoPlayer.duration) return;
    const newStartTime = (time !== undefined) ? time : videoPlayer.currentTime;
    
    if (repeatEnd !== null && newStartTime >= repeatEnd) {
      showToast('開始位置は終了位置より前に設定してください。');
      return;
    }
    repeatStart = newStartTime;
    updateUI();
    showToast(`開始位置を設定: ${formatTime(repeatStart)}`);
  }

  function setEndTime(time) {
    if (!videoPlayer.duration) return;
    const newEndTime = (time !== undefined) ? time : videoPlayer.currentTime;

    if (repeatStart === null || newEndTime <= repeatStart) {
      const message = repeatStart === null
        ? '先に開始位置を設定してください。'
        : '終了位置は開始位置より後に設定してください。';
      showToast(message);
      return;
    }
    repeatEnd = newEndTime;
    updateUI();
    showToast(`終了位置を設定: ${formatTime(repeatEnd)}`);
  }

  function resetRepeat() {
    repeatStart = null;
    repeatEnd = null;
    updateUI();
    showToast('リピート区間をリセットしました。');
  }

  function goToStart() {
    if (repeatStart !== null) {
      videoPlayer.currentTime = repeatStart;
    }
  }
  
  function togglePlayPause() {
    if (videoPlayer.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }

  function setPlaybackSpeed(speed, showNotice = false) {
    if (isNaN(speed) || !videoPlayer.duration) return;
    const validatedSpeed = Math.max(0.25, Math.min(speed, 4));
    videoPlayer.playbackRate = validatedSpeed;
    speedRange.value = validatedSpeed;
    speedValue.value = validatedSpeed.toFixed(2);
    if (showNotice) {
      showToast(`再生速度: ${validatedSpeed.toFixed(2)}x`);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const requestMethod = videoContainer.requestFullscreen || videoContainer.mozRequestFullScreen || videoContainer.webkitRequestFullScreen || videoContainer.msRequestFullScreen;
      if (requestMethod) {
        requestMethod.call(videoContainer);
      }
    } else {
      const exitMethod = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exitMethod) {
        exitMethod.call(document);
      }
    }
  }

  function updateFullscreenIcon() {
    fullscreenBtn.innerHTML = document.fullscreenElement ? EXIT_FULLSCREEN_ICON : FULLSCREEN_ICON;
  }
  
  function updateMarkers() {
    const duration = videoPlayer.duration;
    if (!duration) return;
    startMarker.style.display = repeatStart !== null ? 'block' : 'none';
    if (repeatStart !== null) {
      startMarker.style.left = (repeatStart / duration * 100) + '%';
    }
    endMarker.style.display = repeatEnd !== null ? 'block' : 'none';
    if (repeatEnd !== null) {
      endMarker.style.left = (repeatEnd / duration * 100) + '%';
    }
    if (repeatStart !== null && repeatEnd !== null) {
      const startPercent = (repeatStart / duration) * 100;
      const endPercent = (repeatEnd / duration) * 100;
      const widthPercent = endPercent - startPercent;
      repeatRangeBar.style.left = `${startPercent}%`;
      repeatRangeBar.style.width = `${widthPercent}%`;
      repeatRangeBar.style.display = 'block';
    } else {
      repeatRangeBar.style.display = 'none';
    }
  }

  function updateProgressUI() {
    if (!videoPlayer.duration) return;
    const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressBar.style.width = percent + '%';
    currentMarker.style.left = percent + '%';
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function updateTimeDisplay() {
    const current = formatTime(videoPlayer.currentTime);
    const duration = formatTime(videoPlayer.duration);
    timeDisplay.textContent = `${current} / ${duration}`;
  }

  function updateRepeatDisplay() {
    const startStr = repeatStart !== null ? formatTime(repeatStart) : '未設定';
    const endStr = repeatEnd !== null ? formatTime(repeatEnd) : '未設定';
    repeatRangeDisplay.textContent = `リピート区間: ${startStr} - ${endStr}`;
  }

  function updateUI() {
    updateMarkers();
    updateRepeatDisplay();
  }
  
  function flashPlayPauseIcon() {
    updateCentralPlayPauseIcon();
    videoOverlay.classList.add('feedback-flash');
    setTimeout(() => videoOverlay.classList.remove('feedback-flash'), 500);
  }

  function updateCentralPlayPauseIcon() {
     playPauseIcon.className = videoPlayer.paused ? 'play' : 'pause';
  }
  
  function hideMobileControls() {
    videoContainer.classList.remove('mobile-controls-visible');
    clearTimeout(controlsTimer);
  }

  function showMobileControls() {
    videoContainer.classList.add('mobile-controls-visible');
    updateCentralPlayPauseIcon();
    clearTimeout(controlsTimer);
    controlsTimer = setTimeout(hideMobileControls, 3000);
  }
  
  function resetInactiveTimer() {
    clearTimeout(inactiveTimer);
    videoContainer.classList.remove('is-inactive');
    if (document.fullscreenElement && !isMobile) {
      inactiveTimer = setTimeout(() => {
        videoContainer.classList.add('is-inactive');
      }, 3000);
    }
  }

  const handleDragMove = (e) => {
    if (!isDragging || !videoPlayer.duration) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = progressBarContainer.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = ratio * videoPlayer.duration;
    
    videoPlayer.currentTime = newTime;
    updateProgressUI(); 
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.classList.remove('is-scrubbing');
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
  };
  
  const handleDragStart = (e) => {
    if (!videoPlayer.duration || e.shiftKey || e.altKey) {
        return;
    }
    e.preventDefault();
    isDragging = true;
    document.body.classList.add('is-scrubbing');
    handleDragMove(e);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
  };
  
  // --- イベントリスナー設定 ---

  videoInput.addEventListener('change', () => {
    const file = videoInput.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      videoPlayer.src = url;
      videoContainer.style.display = 'block';
      videoUploadContainer.style.display = 'none';
      videoPlayer.play();
      repeatStart = null;
      repeatEnd = null;
      updateUI();
    }
  });

  // --- ここからが修正箇所 ---
  
  // ドラッグ操作は mousedown で開始
  progressBarContainer.addEventListener('mousedown', handleDragStart);
  progressBarContainer.addEventListener('touchstart', handleDragStart);

  // クリック操作（シークとリピート設定）は click イベントで処理
  progressBarContainer.addEventListener('click', (e) => {
    if (!videoPlayer.duration || isDragging) return;

    const rect = progressBarContainer.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const clickedTime = videoPlayer.duration * ratio;

    if (e.shiftKey && e.altKey) {
      // Shift + Alt + クリック: 終了位置を設定 (シークしない)
      e.preventDefault();
      setEndTime(clickedTime);
    } else if (e.shiftKey) {
      // Shift + クリック: 開始位置を設定 (シークしない)
      e.preventDefault();
      setStartTime(clickedTime);
    } else {
      // 通常のクリック: 再生位置をシークする
      videoPlayer.currentTime = clickedTime;
    }
  });

  // --- ここまでが修正箇所 ---

  progressBarContainer.addEventListener('mousemove', (e) => {
    if (!videoPlayer.duration) return;
    const rect = progressBarContainer.getBoundingClientRect();
    const hoverRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const hoverTime = videoPlayer.duration * hoverRatio;
    progressTimeTooltip.textContent = formatTime(hoverTime);
    progressTimeTooltip.style.left = `${hoverRatio * 100}%`;
  });

  videoPlayer.addEventListener('timeupdate', () => {
    if (!isDragging) {
      updateProgressUI();
    }
    updateTimeDisplay();
    if (isRepeating && repeatStart !== null && repeatEnd !== null) {
      if (videoPlayer.currentTime >= repeatEnd || videoPlayer.currentTime < repeatStart) {
        videoPlayer.currentTime = repeatStart;
        if (videoPlayer.paused) videoPlayer.play();
      }
    }
  });
  
  videoPlayer.addEventListener('loadedmetadata', updateTimeDisplay);
  videoPlayer.addEventListener('play', updateCentralPlayPauseIcon);
  videoPlayer.addEventListener('pause', updateCentralPlayPauseIcon);
  
  videoContainer.addEventListener('click', (e) => {
    const clickedOnUI = 
        e.target === progressBarContainer || progressBarContainer.contains(e.target) ||
        e.target === fullscreenBtn || fullscreenBtn.contains(e.target);

    if (isMobile) {
      if (videoContainer.classList.contains('mobile-controls-visible')) {
        if (e.target === playPauseIcon) {
          togglePlayPause();
          hideMobileControls();
        } else if (!clickedOnUI) {
          hideMobileControls();
        }
      } else {
        showMobileControls();
      }
    } else {
      if (!clickedOnUI) {
        togglePlayPause();
        flashPlayPauseIcon();
      }
    }
  });
  
  setStartBtn.addEventListener('click', () => setStartTime());
  setEndBtn.addEventListener('click', () => setEndTime());
  goStartBtn.addEventListener('click', goToStart);
  resetButton.addEventListener('click', resetRepeat);
  
  speedRange.addEventListener('input', (e) => setPlaybackSpeed(parseFloat(e.target.value)));
  speedValue.addEventListener('change', (e) => setPlaybackSpeed(parseFloat(e.target.value)));
  
  fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFullscreen();
  });
  
  function handleFullscreenChange() {
    updateFullscreenIcon();
    if (document.fullscreenElement && !isMobile) {
      resetInactiveTimer();
    } else {
      clearTimeout(inactiveTimer);
      videoContainer.classList.remove('is-inactive');
    }
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event =>
    document.addEventListener(event, handleFullscreenChange)
  );
  
  videoContainer.addEventListener('mousemove', () => {
      if (!isMobile && document.fullscreenElement) {
          resetInactiveTimer();
      }
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    const keysToPrevent = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f'];
    if (keysToPrevent.includes(e.key.toLowerCase())) {
      e.preventDefault();
    }

    switch(e.key.toLowerCase()) {
      case 'z': setStartTime(); break;
      case 'x': setEndTime(); break;
      case 'c': resetRepeat(); break;
      case 'v': goToStart(); break;
      case ' ': 
        togglePlayPause();
        flashPlayPauseIcon();
        break;
      case 'arrowright': setPlaybackSpeed(videoPlayer.playbackRate + 0.1, true); break;
      case 'arrowleft': setPlaybackSpeed(videoPlayer.playbackRate - 0.1, true); break;
      case 'arrowup': setPlaybackSpeed(videoPlayer.playbackRate + 0.01, true); break;
      case 'arrowdown': setPlaybackSpeed(videoPlayer.playbackRate - 0.01, true); break;
      case 'f': toggleFullscreen(); break;
    }
  });
  
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggleBtn.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
  });
  
  // 初期化処理
  updateUI();
});