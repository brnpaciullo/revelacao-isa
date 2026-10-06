import { useEffect, useRef } from 'react';

// Confete em canvas. `colors` define a paleta (usamos tons do lado revelado + dourado).
export default function Confetti({ colors = ['#ffffff', '#c9a227', '#f0d060'] }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let running = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N = 180;
    const bits = Array.from({ length: N }, () => spawn(canvas));

    function spawn(c) {
      return {
        x: Math.random() * c.width,
        y: Math.random() * -c.height,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 4,
        vx: -1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: -0.15 + Math.random() * 0.3,
      };
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const b of bits) {
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.vr;
        if (b.y > canvas.height + 20) {
          b.y = -20;
          b.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [colors]);

  return <canvas ref={ref} className="confete-canvas" />;
}
