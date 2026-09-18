import { CONFIG } from '../data/config.js';
import { STORY_CHAPTERS } from '../data/story.js';
import { MEMORIES } from '../data/memories.js';
import { THINGS_I_LOVE, THINGS_I_NOTICE, YOU_DONT_SEE, TAKE_YOUR_TIME, NOT_PERFECT, THE_WAY_I_LOVE_YOU, OUR_PROMISE } from '../data/loves.js';
import { FUTURE_DREAMS, TRAVEL_PLACES, FINAL_LETTER } from '../data/future.js';

import { initOpeningScreen } from './opening.js';
import { initRelationshipTimer } from './timer.js';
import { initThoughtsCanvas } from './thoughts-canvas.js';
import { initHeartCanvas } from './heart-canvas.js';
import { initAudioPlayer } from './audio-player.js';
import { initScrollSystem } from './story-scroll.js';
import { initPerformanceGuard } from './performance-monitor.js';

document.addEventListener('DOMContentLoaded', () => {
  // Render Dynamic Content
  renderStoryChapters();
  renderMemories();
  renderLoves();
  renderNotices();
  renderTravel();
  renderFutureDreams();
  renderLetter();

  // Initialize interactive modules
  initOpeningScreen();
  initRelationshipTimer();
  initThoughtsCanvas();
  initHeartCanvas();
  initAudioPlayer();
  initPerformanceGuard();

  // Initialize scroll reveals
  setTimeout(() => {
    initScrollSystem();
  }, 50);
});

function renderStoryChapters() {
  const container = document.getElementById('story-chapters-wrap');
  if (!container) return;

  container.innerHTML = STORY_CHAPTERS.map((ch) => {
    const paragraphs = ch.content.map(p => `<p>${p}</p>`).join('');

    return `
      <article class="story-chapter reveal-on-scroll" id="${ch.id}">
        <div class="story-content">
          <span class="story-date-badge">${ch.badge}</span>
          <h3 class="story-title">${ch.title}</h3>
          <blockquote class="story-quote">"${ch.quote}"</blockquote>
          <div class="story-text">
            ${paragraphs}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderMemories() {
  const container = document.getElementById('gallery-grid-wrap');
  if (!container) return;

  container.innerHTML = MEMORIES.map(m => `
    <div class="memory-polaroid reveal-on-scroll">
      <div class="memory-polaroid-img-wrap">
        <img src="${m.image}" alt="${m.title}" loading="lazy" decoding="async" />
      </div>
      <span class="memory-polaroid-date">${m.date} · ${m.location}</span>
      <h4 class="memory-polaroid-title">${m.title}</h4>
      <p class="memory-polaroid-caption">${m.caption}</p>
    </div>
  `).join('');
}

function renderLoves() {
  const container = document.getElementById('loves-grid-wrap');
  if (!container) return;

  container.innerHTML = THINGS_I_LOVE.map((item, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    return `
      <div class="love-card reveal-on-scroll">
        <div class="love-card-num">${num}</div>
        <h4 class="love-card-title">${item.title}</h4>
        <p class="love-card-desc">${item.text}</p>
      </div>
    `;
  }).join('');
}

function renderNotices() {
  const container = document.getElementById('notices-wrap');
  if (!container) return;

  container.innerHTML = THINGS_I_NOTICE.map(n => `
    <div class="notice-pill reveal-on-scroll">
      <span class="notice-heart">♥</span>
      <span>${n.text}</span>
    </div>
  `).join('');
}

function renderTravel() {
  const container = document.getElementById('travel-grid-wrap');
  if (!container) return;

  container.innerHTML = TRAVEL_PLACES.map(t => `
    <div class="travel-card reveal-on-scroll">
      <img src="${t.image}" alt="${t.country}" loading="lazy" decoding="async" />
      <div class="travel-overlay">
        <span class="travel-country">${t.country}</span>
        <h4 class="travel-city">${t.city}</h4>
        <p class="travel-vibe">${t.vibe}</p>
      </div>
    </div>
  `).join('');
}

function renderFutureDreams() {
  const container = document.getElementById('future-grid-wrap');
  if (!container) return;

  container.innerHTML = FUTURE_DREAMS.map(d => `
    <div class="future-item reveal-on-scroll">
      <div class="future-icon">${d.icon}</div>
      <div>
        <h4 class="future-title">${d.title}</h4>
        <p class="future-desc">${d.desc}</p>
      </div>
    </div>
  `).join('');
}

function renderLetter() {
  const letterBody = document.getElementById('letter-body-wrap');
  const letterSignoff = document.getElementById('letter-signoff-wrap');

  if (letterBody) {
    letterBody.innerHTML = FINAL_LETTER.paragraphs.map(p => `<p>${p}</p>`).join('');
  }
  if (letterSignoff) {
    letterSignoff.innerHTML = FINAL_LETTER.signoff.replace(/\n/g, '<br>');
  }
}
