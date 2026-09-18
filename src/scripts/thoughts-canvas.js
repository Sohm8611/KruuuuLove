import { THOUGHT_FRAGMENTS } from '../data/thoughts.js';

export function initThoughtsCanvas() {
  const canvas = document.getElementById('thoughts-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0, height = 0;
  let animationFrameId = null;
  let isVisible = false;
  let lastTime = performance.now();

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: -1000, y: -1000, radius: 120 };
  let nodes = [];

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || 580;
    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = w;
    height = h;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    initNodes();
  }

  function initNodes() {
    if (width <= 0 || height <= 0) return;

    nodes = THOUGHT_FRAGMENTS.map((text, i) => {
      const angle = (i / THOUGHT_FRAGMENTS.length) * Math.PI * 2;
      const radiusX = width * 0.35;
      const radiusY = height * 0.32;

      const baseX = width / 2 + Math.cos(angle) * (radiusX * (0.6 + Math.random() * 0.4));
      const baseY = height / 2 + Math.sin(angle) * (radiusY * (0.6 + Math.random() * 0.4));

      return {
        text,
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        floatAngle: Math.random() * Math.PI * 2,
        floatSpeed: 0.0015 + Math.random() * 0.001,
        floatAmp: 12 + Math.random() * 10,
        size: width < 600 ? 11 : 13,
        alpha: 0.75 + Math.random() * 0.25
      };
    });
  }

  function animate(currentTime) {
    if (!isVisible) return;

    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    ctx.clearRect(0, 0, width, height);

    // Subtle connecting lines
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 180) {
          const alpha = (1 - dist / 180) * 0.12;
          ctx.strokeStyle = `rgba(243, 166, 188, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];

      if (!isReducedMotion) {
        n.floatAngle += n.floatSpeed * (dt * 60);
        const floatOffsetX = Math.cos(n.floatAngle) * n.floatAmp;
        const floatOffsetY = Math.sin(n.floatAngle) * n.floatAmp;

        const targetX = n.baseX + floatOffsetX;
        const targetY = n.baseY + floatOffsetY;

        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          n.x += (dx / dist) * force * 15;
          n.y += (dy / dist) * force * 15;
        }

        n.x += (targetX - n.x) * 0.04;
        n.y += (targetY - n.y) * 0.04;
      }

      ctx.fillStyle = `rgba(243, 166, 188, ${n.alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `400 ${n.size}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(n.text);
      const textW = metrics.width + 20;
      const textH = n.size + 14;

      ctx.fillStyle = 'rgba(20, 18, 20, 0.7)';
      ctx.strokeStyle = 'rgba(243, 166, 188, 0.2)';
      ctx.lineWidth = 1;

      const px = n.x - textW / 2;
      const py = n.y - textH / 2;
      ctx.beginPath();
      ctx.roundRect(px, py, textW, textH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = `rgba(250, 248, 249, ${n.alpha})`;
      ctx.fillText(n.text, n.x, n.y);
    }

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

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    mouse.y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
  }

  function onPointerLeave() {
    mouse.x = -1000;
    mouse.y = -1000;
  }

  canvas.addEventListener('mousemove', onPointerMove, { passive: true });
  canvas.addEventListener('mouseleave', onPointerLeave, { passive: true });
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });
  canvas.addEventListener('touchend', onPointerLeave, { passive: true });

  window.addEventListener('resize', () => {
    resize();
  }, { passive: true });

  resize();
}
