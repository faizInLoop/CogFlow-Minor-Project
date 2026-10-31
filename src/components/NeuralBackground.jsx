import { useEffect, useRef } from 'react';

// RGB color vectors for each mood theme
const THEME_PARTICLE_COLORS = {
  dark: {
    particle: [129, 140, 248],
    glow: [99, 102, 241],
    synapse: [99, 102, 241],
    pointer: [168, 85, 247]
  },
  calm: {
    particle: [56, 189, 248],     // Ocean cyan
    glow: [14, 165, 233],
    synapse: [14, 165, 233],
    pointer: [56, 189, 248]
  },
  nature: {
    particle: [52, 211, 153],    // Emerald peaceful
    glow: [16, 185, 129],
    synapse: [16, 185, 129],
    pointer: [110, 231, 183]
  },
  relaxing: {
    particle: [192, 132, 252],   // Twilight dusk purple
    glow: [168, 85, 247],
    synapse: [168, 85, 247],
    pointer: [216, 180, 254]
  },
  solar: {
    particle: [251, 191, 36],    // Solar amber
    glow: [245, 158, 11],
    synapse: [245, 158, 11],
    pointer: [253, 230, 138]
  },
  happy: {
    particle: [251, 113, 133],   // Sprint vitality ruby
    glow: [244, 63, 94],
    synapse: [244, 63, 94],
    pointer: [253, 164, 175]
  },
  overwhelmed: {
    particle: [148, 163, 184],   // Low sensory muted slate
    glow: [100, 116, 139],
    synapse: [100, 116, 139],
    pointer: [203, 213, 225]
  }
};

export default function NeuralBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool
    const count = Math.min(50, Math.floor(window.innerWidth / 28));
    const particles = [];
    const mouse = { x: -1000, y: -1000, radius: 160 };

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.5 + 1,
        alpha: Math.random() * 0.4 + 0.2,
      });
    }

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // Smooth color interpolation state
    let currentThemeKey = document.documentElement.getAttribute('data-theme') || 'dark';
    let targetColors = THEME_PARTICLE_COLORS[currentThemeKey] || THEME_PARTICLE_COLORS.dark;
    let activeR = targetColors.particle[0];
    let activeG = targetColors.particle[1];
    let activeB = targetColors.particle[2];

    const checkTheme = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      if (newTheme !== currentThemeKey && THEME_PARTICLE_COLORS[newTheme]) {
        currentThemeKey = newTheme;
        targetColors = THEME_PARTICLE_COLORS[newTheme];
      }
    };

    const onThemeChange = (e) => {
      const theme = e.detail?.theme;
      if (theme && THEME_PARTICLE_COLORS[theme]) {
        currentThemeKey = theme;
        targetColors = THEME_PARTICLE_COLORS[theme];
      }
    };
    window.addEventListener('cogflow-theme-change', onThemeChange);

    const render = () => {
      checkTheme();

      // Smooth color lerp towards target theme
      activeR += (targetColors.particle[0] - activeR) * 0.05;
      activeG += (targetColors.particle[1] - activeG) * 0.05;
      activeB += (targetColors.particle[2] - activeB) * 0.05;

      const r = Math.round(activeR);
      const g = Math.round(activeG);
      const b = Math.round(activeB);

      ctx.clearRect(0, 0, width, height);

      // Render & update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        // Interactive mouse push/pull
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x -= (dx / dist) * force * 1.5;
          p.y -= (dy / dist) * force * 1.5;
        }

        // Draw particle dot with mood theme color
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect with nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distNodes = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (distNodes < 130) {
            const alpha = (1 - distNodes / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Connect to mouse cursor
        if (dist < mouse.radius) {
          const alpha = (1 - dist / mouse.radius) * 0.35;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('cogflow-theme-change', onThemeChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.75,
      }}
    />
  );
}
