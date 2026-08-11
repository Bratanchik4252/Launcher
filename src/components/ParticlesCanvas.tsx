import { useEffect, useRef } from "react";

type P = { x: number; y: number; r: number; vy: number; drift: number; phase: number };

export function ParticlesCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let parts: P[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const spawn = (): P => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.12 + Math.random() * 0.35,
      drift: 0.15 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(80, Math.max(30, Math.floor((w * h) / 14000)));
      parts = Array.from({ length: count }, spawn);
    };

    let t = 0;
    const tick = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy;
        p.x += Math.sin(t * 0.6 + p.phase) * p.drift * 0.4;
        if (p.y < -8) {
          p.y = h + 8;
          p.x = Math.random() * w;
        }
        const alpha = 0.12 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.2 + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="particles-canvas" aria-hidden />;
}
