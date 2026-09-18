import { CONFIG } from '../data/config.js';

export function initAudioPlayer() {
  const widget = document.getElementById('audio-player-widget');
  if (!widget) return;

  const playBtn = document.getElementById('audio-play-btn');
  const playIcon = document.getElementById('audio-play-icon');
  const prevBtn = document.getElementById('audio-prev-btn');
  const nextBtn = document.getElementById('audio-next-btn');

  const titleEl = document.getElementById('audio-title');
  const artistEl = document.getElementById('audio-artist');
  const artImg = document.getElementById('audio-art-img');

  const progressContainer = document.getElementById('audio-progress-container');
  const progressBar = document.getElementById('audio-progress-bar');
  const progressThumb = document.getElementById('audio-progress-thumb');
  const currentTimeEl = document.getElementById('audio-current-time');
  const totalDurationEl = document.getElementById('audio-total-duration');

  const volumeBtn = document.getElementById('audio-volume-btn');
  const volumeSlider = document.getElementById('audio-volume-slider');
  const volIconHigh = document.getElementById('vol-icon-high');
  const volIconMute = document.getElementById('vol-icon-mute');

  const songTabs = document.querySelectorAll('.song-tab');

  const playlist = CONFIG.playlist || [
    {
      id: "ehsaas",
      title: "Ehsaas (acoustic)",
      artist: "Faheem Abdullah",
      src: "/assets/music/ehsaas-acoustic.mp3",
      cover: "/assets/images/album-ehsaas.jpg",
      duration: 83
    },
    {
      id: "meri-banogi-kya",
      title: "Meri Banogi Kya",
      artist: "Rito Riba, Rajat Nagpal",
      src: "/assets/music/meri-banogi-kya.mp3",
      cover: "/assets/images/album-meri-banogi.jpg",
      duration: 215
    }
  ];

  let currentIndex = 0;
  let isPlaying = false;
  let isSeeking = false;
  let previousVolume = 0.85;

  const audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.85;

  // Format seconds to mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Load song at given index
  function loadSong(index, startPlaying = false) {
    currentIndex = index;
    const song = playlist[currentIndex];

    audio.src = song.src;
    audio.currentTime = 0;

    // Update Track Details
    if (titleEl) titleEl.textContent = song.title;
    if (artistEl) artistEl.textContent = song.artist;
    if (artImg) {
      artImg.src = song.cover;
      artImg.alt = `${song.title} album cover`;
    }

    // Reset Progress
    if (progressBar) progressBar.style.width = '0%';
    if (progressThumb) progressThumb.style.left = '0%';
    if (currentTimeEl) currentTimeEl.textContent = '0:00';
    if (totalDurationEl) totalDurationEl.textContent = formatTime(song.duration);

    // Update active tab styling
    songTabs.forEach((tab, i) => {
      if (i === currentIndex) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    if (startPlaying) {
      playSong();
    }
  }

  function playSong() {
    isPlaying = true;
    widget.classList.add('playing');
    if (playIcon) playIcon.innerHTML = '&#10074;&#10074;'; // Pause symbol

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Audio play prevented or file not supported:", err);
      });
    }
  }

  function pauseSong() {
    isPlaying = false;
    audio.pause();
    widget.classList.remove('playing');
    if (playIcon) playIcon.innerHTML = '&#9658;'; // Play symbol
  }

  function togglePlay() {
    if (isPlaying) {
      pauseSong();
    } else {
      playSong();
    }
  }

  function prevSong() {
    const wasPlaying = isPlaying;
    let newIndex = currentIndex - 1;
    if (newIndex < 0) newIndex = playlist.length - 1;
    loadSong(newIndex, wasPlaying);
  }

  function nextSong() {
    const wasPlaying = isPlaying;
    let newIndex = (currentIndex + 1) % playlist.length;
    loadSong(newIndex, wasPlaying);
  }

  // Update seek timeline
  function updateProgress() {
    if (isSeeking) return;
    const duration = audio.duration || playlist[currentIndex].duration || 1;
    const currentTime = audio.currentTime || 0;
    const percent = Math.min((currentTime / duration) * 100, 100);

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressThumb) progressThumb.style.left = `${percent}%`;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);

    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', Math.round(percent));
    }
  }

  // Seek position calculation
  function seekTo(event) {
    if (!progressContainer) return;
    const rect = progressContainer.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = offsetX / rect.width;

    const duration = audio.duration || playlist[currentIndex].duration || 1;
    const targetTime = ratio * duration;

    audio.currentTime = targetTime;
    if (progressBar) progressBar.style.width = `${ratio * 100}%`;
    if (progressThumb) progressThumb.style.left = `${ratio * 100}%`;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(targetTime);
  }

  // Event Listeners
  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (prevBtn) prevBtn.addEventListener('click', prevSong);
  if (nextBtn) nextBtn.addEventListener('click', nextSong);

  // Tab switcher
  songTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetIndex = parseInt(tab.getAttribute('data-index'), 10);
      if (!isNaN(targetIndex) && targetIndex !== currentIndex) {
        loadSong(targetIndex, isPlaying);
      }
    });
  });

  // Audio element events
  audio.addEventListener('timeupdate', updateProgress);

  audio.addEventListener('loadedmetadata', () => {
    if (audio.duration && !isNaN(audio.duration) && totalDurationEl) {
      totalDurationEl.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('ended', () => {
    // Automatically transition to next song
    nextSong();
  });

  // Scrubbing & Seeking
  if (progressContainer) {
    progressContainer.addEventListener('mousedown', (e) => {
      isSeeking = true;
      seekTo(e);

      const onMouseMove = (moveEvent) => {
        if (isSeeking) seekTo(moveEvent);
      };

      const onMouseUp = () => {
        isSeeking = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // Touch support for seeking
    progressContainer.addEventListener('touchstart', (e) => {
      isSeeking = true;
      seekTo(e);

      const onTouchMove = (moveEvent) => {
        if (isSeeking) seekTo(moveEvent);
      };

      const onTouchEnd = () => {
        isSeeking = false;
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };

      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
    }, { passive: true });
  }

  // Volume control
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      audio.volume = val;
      if (val > 0) {
        previousVolume = val;
        if (volIconHigh) volIconHigh.style.display = 'block';
        if (volIconMute) volIconMute.style.display = 'none';
      } else {
        if (volIconHigh) volIconHigh.style.display = 'none';
        if (volIconMute) volIconMute.style.display = 'block';
      }
    });
  }

  if (volumeBtn) {
    volumeBtn.addEventListener('click', () => {
      if (audio.volume > 0) {
        previousVolume = audio.volume;
        audio.volume = 0;
        if (volumeSlider) volumeSlider.value = 0;
        if (volIconHigh) volIconHigh.style.display = 'none';
        if (volIconMute) volIconMute.style.display = 'block';
      } else {
        const restoreVal = previousVolume > 0 ? previousVolume : 0.85;
        audio.volume = restoreVal;
        if (volumeSlider) volumeSlider.value = restoreVal;
        if (volIconHigh) volIconHigh.style.display = 'block';
        if (volIconMute) volIconMute.style.display = 'none';
      }
    });
  }

  // Initial load without autoplay
  loadSong(0, false);
}
