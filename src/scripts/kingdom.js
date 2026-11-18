/**
 * ============================================================================
 * KRUUULOVE — PRINCESS DAY INTERACTIVE LOGIC (FINAL REVISED VERSION)
 * ============================================================================
 */

import {
  KINGDOM_CONFIG,
  ROYAL_INVITATION,
  KINGDOM_WELCOME,
  ROYAL_LETTER,
  SPECIAL_REASONS,
  ROYAL_PROMISES,
  ROYAL_HUG,
  ROYAL_FINALE,
  MICROCOPY
} from '../data/kingdomData.js';

let audioPlayer = null;
let isAudioPlaying = false;
const flippedCardIds = new Set();

document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initAudio();
  renderAllSections();
  setupInvitationInteraction();
  setupCardInteractions();
  setupHugInteraction();
  setupReplay();
  setupSmoothScroll();
});

/**
 * 1. NIGHT SKY CANVAS: Twinkling Stars & Shooting Stars
 */
function initStarfield() {
  const canvas = document.getElementById('kingdom-star-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createStars();
  });

  const stars = [];
  const shootingStars = [];

  function createStars() {
    stars.length = 0;
    const starCount = Math.floor((width * height) / 3200);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.3,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
        color: Math.random() > 0.3 ? '#ffffff' : Math.random() > 0.5 ? '#fbcfe8' : '#e9d5ff'
      });
    }
  }

  function maybeAddShootingStar() {
    if (Math.random() < 0.015 && shootingStars.length < 2) {
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * (height * 0.4),
        length: Math.random() * 80 + 40,
        speed: Math.random() * 10 + 12,
        angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
        opacity: 1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw static twinkling stars
    for (const star of stars) {
      star.alpha += star.speed;
      if (star.alpha > 1 || star.alpha < 0.1) {
        star.speed = -star.speed;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
      ctx.shadowBlur = star.radius > 1 ? 6 : 0;
      ctx.shadowColor = star.color;
      ctx.fill();
      ctx.restore();
    }

    // Draw shooting stars
    maybeAddShootingStar();
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      const endX = s.x - Math.cos(s.angle) * s.length;
      const endY = s.y - Math.sin(s.angle) * s.length;

      const grad = ctx.createLinearGradient(s.x, s.y, endX, endY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
      grad.addColorStop(0.3, `rgba(244, 63, 94, ${s.opacity * 0.7})`);
      grad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f43f5e';
      ctx.stroke();
      ctx.restore();

      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.opacity -= 0.02;

      if (s.opacity <= 0 || s.x > width || s.y > height) {
        shootingStars.splice(i, 1);
      }
    }

    requestAnimationFrame(draw);
  }

  createStars();
  draw();
}

/**
 * 2. AUDIO INTEGRATION
 */
function initAudio() {
  audioPlayer = new Audio(KINGDOM_CONFIG.musicSrc);
  audioPlayer.loop = true;
  audioPlayer.volume = 0.75;

  const audioBtn = document.getElementById('kingdom-audio-toggle');
  if (!audioBtn) return;

  audioBtn.addEventListener('click', toggleAudio);
}

function toggleAudio() {
  const audioBtn = document.getElementById('kingdom-audio-toggle');
  if (!audioPlayer) return;

  if (isAudioPlaying) {
    audioPlayer.pause();
    isAudioPlaying = false;
    if (audioBtn) {
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<span>🎵 Play Music</span>';
    }
  } else {
    audioPlayer.play().then(() => {
      isAudioPlaying = true;
      if (audioBtn) {
        audioBtn.classList.add('playing');
        audioBtn.innerHTML = '<span>🔊 Playing: Ehsaas</span>';
      }
    }).catch(err => {
      console.log('Audio playback waiting for gesture:', err);
    });
  }
}

/**
 * 3. RENDER ALL EXPERIENCE SECTIONS
 */
function renderAllSections() {
  renderInvitation();
  renderWelcomeCards();
  renderLetter();
  renderSpecialCards();
  renderPromises();
  renderHug();
  renderFinale();
}

function renderInvitation() {
  const container = document.getElementById('invitation-content-wrap');
  if (!container) return;

  container.innerHTML = `
    <div class="envelope-ornament-top"></div>
    <div class="royal-seal-container" id="wax-seal-btn" title="Click to break seal and enter">
      <div class="seal-ring"></div>
      <div class="royal-wax-seal">
        ${ROYAL_INVITATION.crestEmoji}
      </div>
    </div>
    <span class="royal-badge-pill">${escapeHtml(ROYAL_INVITATION.smallHeading)}</span>
    <h1 class="invitation-title">${escapeHtml(ROYAL_INVITATION.mainHeading)}</h1>
    <p class="invitation-text">${escapeHtml(ROYAL_INVITATION.invitation)}</p>
    <button class="btn-break-seal" id="btn-enter-kingdom" type="button">
      <span>${escapeHtml(ROYAL_INVITATION.buttonText)}</span>
    </button>
  `;
}

function renderWelcomeCards() {
  const container = document.getElementById('welcome-three-cards');
  if (!container) return;

  container.innerHTML = KINGDOM_WELCOME.threeCards.map(c => `
    <div class="welcome-card-pill">
      <span>${escapeHtml(c.text)}</span>
    </div>
  `).join('');
}

function renderLetter() {
  const container = document.getElementById('royal-letter-body');
  if (!container) return;

  const parasHtml = ROYAL_LETTER.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');

  container.innerHTML = `
    <div class="parchment-letter-header">
      <div>
        <span class="royal-badge-pill" style="margin-bottom: 0;">${escapeHtml(ROYAL_LETTER.envelopeInstruction)}</span>
      </div>
      <div style="font-size: 1.8rem;">💌</div>
    </div>
    <div class="letter-salutation-hand">${escapeHtml(ROYAL_LETTER.salutation)}</div>
    <div class="letter-body-hand">
      ${parasHtml}
    </div>
    <div class="letter-signoff-hand">
      <div>${escapeHtml(ROYAL_LETTER.signoff)}</div>
      <div class="signoff-name">${escapeHtml(ROYAL_LETTER.author)}</div>
    </div>
  `;
}

function renderSpecialCards() {
  const container = document.getElementById('special-cards-grid');
  if (!container) return;

  container.innerHTML = SPECIAL_REASONS.cards.map(card => `
    <div class="flip-card-item" data-card-id="${card.id}">
      <div class="flip-card-inner">
        <div class="flip-card-front">
          <div class="card-icon-big">${card.icon}</div>
          <h3 class="card-title-front">${escapeHtml(card.title)}</h3>
          <span class="card-hint-tap">${escapeHtml(MICROCOPY.tapToReveal)}</span>
        </div>
        <div class="flip-card-back">
          <div class="card-back-quote-icon">“</div>
          <p class="card-back-text">${escapeHtml(card.text)}</p>
          <span class="card-back-signature">— Forever Yours, Soham</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPromises() {
  const container = document.getElementById('promises-grid');
  if (!container) return;

  container.innerHTML = ROYAL_PROMISES.list.map(p => `
    <div class="promise-row-card">
      <div class="promise-num-badge">${p.num}</div>
      <div style="font-size: 1.4rem;">${p.icon}</div>
      <p class="promise-pledge">“${escapeHtml(p.text)}”</p>
    </div>
  `).join('');

  const finalParaEl = document.getElementById('promises-final-para');
  if (finalParaEl) {
    finalParaEl.textContent = ROYAL_PROMISES.finalParagraph;
  }
}

function renderHug() {
  const msgEl = document.getElementById('hug-message-main');
  if (msgEl) {
    msgEl.textContent = ROYAL_HUG.message;
  }

  const btnEl = document.getElementById('btn-tight-hug');
  if (btnEl) {
    btnEl.innerHTML = `<span>${escapeHtml(ROYAL_HUG.buttonText)}</span>`;
  }
}

function renderFinale() {
  const titleEl = document.getElementById('finale-title');
  if (titleEl) {
    titleEl.textContent = ROYAL_FINALE.heading;
  }

  const msgEl = document.getElementById('finale-message');
  if (msgEl) {
    msgEl.textContent = ROYAL_FINALE.message;
  }

  const replayBtn = document.getElementById('btn-replay-exp');
  if (replayBtn) {
    replayBtn.textContent = ROYAL_FINALE.finalButtonText;
  }
}

/**
 * 4. INVITATION UNSEAL INTERACTION
 */
function setupInvitationInteraction() {
  const overlay = document.getElementById('royal-invitation-overlay');
  const enterBtn = document.getElementById('btn-enter-kingdom');
  const sealBtn = document.getElementById('wax-seal-btn');

  function breakSeal() {
    if (!overlay) return;
    createSparkleBurst(window.innerWidth / 2, window.innerHeight / 2);
    overlay.classList.add('unsealed');

    if (audioPlayer && !isAudioPlaying) {
      toggleAudio();
    }
  }

  if (enterBtn) enterBtn.addEventListener('click', breakSeal);
  if (sealBtn) sealBtn.addEventListener('click', breakSeal);
}

/**
 * 5. 3D CARD FLIPS & ALL CARDS UNLOCKED CELEBRATION
 */
function setupCardInteractions() {
  const cards = document.querySelectorAll('.flip-card-item');
  const unlockedBanner = document.getElementById('cards-unlocked-banner');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      createFloatingHearts(card);

      const cardId = card.getAttribute('data-card-id');
      if (cardId) {
        flippedCardIds.add(cardId);
      }

      if (flippedCardIds.size === SPECIAL_REASONS.cards.length && unlockedBanner) {
        unlockedBanner.style.display = 'block';
        createBigHeartFlurry();
      }
    });
  });
}

/**
 * 6. ROYAL HUG INTERACTION
 */
function setupHugInteraction() {
  const hugBtn = document.getElementById('btn-tight-hug');
  const hugBox = document.getElementById('virtual-hug-box');
  const statusMsgEl = document.getElementById('hug-status-msg');

  if (!hugBtn || !hugBox) return;

  function doHug() {
    hugBox.classList.add('hugging');
    hugBtn.classList.add('holding');

    if (statusMsgEl) {
      statusMsgEl.textContent = ROYAL_HUG.afterInteraction;
    }

    createBigHeartFlurry();

    setTimeout(() => {
      hugBox.classList.remove('hugging');
      hugBtn.classList.remove('holding');
    }, 2800);
  }

  hugBtn.addEventListener('click', doHug);
}

/**
 * 7. REPLAY & NAVIGATION
 */
function setupReplay() {
  const replayBtn = document.getElementById('btn-replay-exp');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function setupSmoothScroll() {
  const exploreBtn = document.getElementById('btn-lets-explore');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('letter');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/**
 * FX: Sparkle Burst & Floating Hearts
 */
function createSparkleBurst(x, y) {
  const container = document.getElementById('kingdom-particles-container');
  if (!container) return;

  const count = 25;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.style.position = 'fixed';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.width = '6px';
    p.style.height = '6px';
    p.style.borderRadius = '50%';
    p.style.backgroundColor = Math.random() > 0.5 ? '#f43f5e' : '#fbbf24';
    p.style.boxShadow = '0 0 10px #f43f5e';
    p.style.pointerEvents = 'none';
    p.style.zIndex = '9999';
    p.style.transition = 'all 1s ease-out';

    container.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150 + 50;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance;

    requestAnimationFrame(() => {
      p.style.transform = `translate(${destX}px, ${destY}px) scale(0)`;
      p.style.opacity = '0';
    });

    setTimeout(() => p.remove(), 1000);
  }
}

function createFloatingHearts(targetEl) {
  const container = document.getElementById('kingdom-particles-container');
  if (!container || !targetEl) return;

  const rect = targetEl.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  for (let i = 0; i < 6; i++) {
    const heart = document.createElement('div');
    heart.style.position = 'fixed';
    heart.style.left = `${startX}px`;
    heart.style.top = `${startY}px`;
    heart.style.fontSize = `${Math.random() * 1.2 + 1}rem`;
    heart.style.zIndex = '999';
    heart.style.pointerEvents = 'none';
    heart.style.transition = 'all 1.6s cubic-bezier(0.1, 0.8, 0.3, 1)';
    heart.textContent = Math.random() > 0.5 ? '💖' : '✨';

    container.appendChild(heart);

    const offX = Math.random() * 100 - 50;
    const offY = -(Math.random() * 120 + 60);

    requestAnimationFrame(() => {
      heart.style.transform = `translate(${offX}px, ${offY}px) scale(1.4)`;
      heart.style.opacity = '0';
    });

    setTimeout(() => heart.remove(), 1600);
  }
}

function createBigHeartFlurry() {
  const container = document.getElementById('kingdom-particles-container');
  if (!container) return;

  const hearts = ['💖', '💕', '🌸', '✨', '👑', '💜', '🫠'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = `${Math.random() * window.innerWidth}px`;
    el.style.top = `${window.innerHeight + 20}px`;
    el.style.fontSize = `${Math.random() * 1.5 + 1.2}rem`;
    el.style.zIndex = '999';
    el.style.pointerEvents = 'none';
    el.style.transition = `all ${Math.random() * 2 + 2}s cubic-bezier(0.15, 0.85, 0.35, 1)`;
    el.textContent = hearts[Math.floor(Math.random() * hearts.length)];

    container.appendChild(el);

    const destX = Math.random() * 80 - 40;
    const destY = -(window.innerHeight + 80);

    requestAnimationFrame(() => {
      el.style.transform = `translate(${destX}px, ${destY}px) scale(1.2)`;
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), 3500);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
