import React, { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';

export const BackgroundGrid = () => {
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      <div className="fixed inset-0 bg-swiss-grid pointer-events-none z-0 opacity-70" />
      <motion.div
        className="fixed inset-0 pointer-events-none z-0 hidden md:block"
        style={{
          background: useMotionTemplate`radial-gradient(520px circle at ${mouseX}px ${mouseY}px, color-mix(in srgb, var(--accent) 6%, transparent), transparent 75%)`,
        }}
      />
    </>
  );
};
