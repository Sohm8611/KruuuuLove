import { CONFIG } from '../data/config.js';

export function initHeartCanvas() {
  const canvas = document.getElementById('climax-heart-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0, height = 0;
  let animationFrameId = null;
  let isVisible = false;
  let lastTime = performance.now();

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const particles = [];
  const textSample = "I love you";

  let phase = 0;
  let phaseTime = 0;
  const CONVERGE_DURATION = 4.5;
  const HOLD_DURATION = 4.0;
  const DISSOLVE_DURATION = 3.0;

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;
    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = w;
    height = h;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    initParticles();
  }

  function getHeartPoint(t, scale) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return {
      x: x * scale,
      y: y * scale
    };
  }

  function initParticles() {
    particles.length = 0;
    if (width <= 0 || height <= 0) return;

    const isMobile = width < 768;
    const totalCount = isMobile ? CONFIG.maxParticlesMobile : CONFIG.maxParticlesDesktop;
    const heartScale = Math.min(width, height) / (isMobile ? 38 : 34);

    for (let i = 0; i < totalCount; i++) {
      const t = Math.random() * Math.PI * 2;
      const isInterior = Math.random() > 0.45;
      const scaleMultiplier = isInterior ? Math.sqrt(Math.random()) : (0.95 + Math.random() * 0.1);
      const target = getHeartPoint(t, heartScale * scaleMultiplier);

      const targetX = width / 2 + target.x;
      const targetY = height / 2 + target.y - 15;

      const startAngle = Math.random() * Math.PI * 2;
      const startDist = Math.max(width, height) * (0.4 + Math.random() * 0.6);
      const startX = width / 2 + Math.cos(startAngle) * startDist;
      const startY = height / 2 + Math.sin(startAngle) * startDist;

      const isText = i % 7 === 0;

      particles.push({
        x: startX,
        y: startY,
        startX,
        startY,
        targetX,
        targetY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        isText,
        size: isText ? (isMobile ? 9 : 11) : (1.5 + Math.random() * 2),
        color: Math.random() > 0.85 ? '#D9415D' : (Math.random() > 0.3 ? '#F3A6BC' : '#FAF8F9'),
        alpha: 0.35 + Math.random() * 0.6,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  function animate(currentTime) {
    if (!isVisible) return;

    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    phaseTime += dt;

    if (phase === 0 && phaseTime > CONVERGE_DURATION) {
      phase = 1;
      phaseTime = 0;
    } else if (phase === 1 && phaseTime > HOLD_DURATION) {
      phase = 2;
      phaseTime = 0;
    } else if (phase === 2 && phaseTime > DISSOLVE_DURATION) {
      phase = 0;
      phaseTime = 0;
      particles.forEach(p => {
        p.startX = p.x;
        p.startY = p.y;
      });
    }

    ctx.fillStyle = 'rgba(5, 5, 5, 0.25)';
    ctx.fillRect(0, 0, width, height);

    const pulseFactor = phase === 1 ? (1 + Math.sin(currentTime * 0.006) * 0.04) : 1;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (isReducedMotion) {
        p.x = p.targetX;
        p.y = p.targetY;
      } else {
        if (phase === 0) {
          const progress = Math.min(phaseTime / CONVERGE_DURATION, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          p.x = p.startX + (p.targetX - p.startX) * ease + Math.sin(currentTime * 0.003 + p.pulseOffset) * 2;
          p.y = p.startY + (p.targetY - p.startY) * ease + Math.cos(currentTime * 0.003 + p.pulseOffset) * 2;
        } else if (phase === 1) {
          const dx = p.targetX - width / 2;
          const dy = p.targetY - height / 2;
          p.x = width / 2 + dx * pulseFactor + Math.sin(currentTime * 0.004 + p.pulseOffset) * 1.5;
          p.y = height / 2 + dy * pulseFactor + Math.cos(currentTime * 0.004 + p.pulseOffset) * 1.5;
        } else if (phase === 2) {
          const dissolveSpeed = 35 * dt;
          const angle = Math.atan2(p.y - height / 2, p.x - width / 2);
          p.x += Math.cos(angle) * dissolveSpeed + (Math.random() - 0.5) * 1;
          p.y += Math.sin(angle) * dissolveSpeed + (Math.random() - 0.5) * 1;
        }
      }

      ctx.globalAlpha = p.alpha;
      if (p.isText) {
        ctx.font = `500 ${p.size}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textSample, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    animationFrameId = requestAnimationFrame(animate);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isVisible = true;
        if (width === 0 || height === 0) {
          resize();
        }
        lastTime = performance.now();
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(animate);
        }
      } else {
        isVisible = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    });
  }, { threshold: 0.05 });

  observer.observe(canvas);

  window.addEventListener('resize', () => {
    resize();
  }, { passive: true });

  resize();
}
