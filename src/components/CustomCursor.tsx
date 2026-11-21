import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export const CustomCursor = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isWindowHovered, setIsWindowHovered] = useState(true);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 28, stiffness: 450 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isOverIframe, setIsOverIframe] = useState(false);

  useEffect(() => {
    const finePointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkEnabled = () => finePointerQuery.matches && !reducedMotionQuery.matches;
    setIsEnabled(checkEnabled());

    const handleChange = () => setIsEnabled(checkEnabled());
    finePointerQuery.addEventListener('change', handleChange);
    reducedMotionQuery.addEventListener('change', handleChange);

    if (!checkEnabled()) {
      return () => {
        finePointerQuery.removeEventListener('change', handleChange);
        reducedMotionQuery.removeEventListener('change', handleChange);
      };
    }

    const updateCursor = (e: MouseEvent) => {
      setIsWindowHovered(true);
      cursorX.set(e.clientX - 10);
      cursorY.set(e.clientY - 10);

      const target = e.target as Element | null;
      if (target && target.tagName === 'IFRAME') {
        setIsOverIframe(true);
        return;
      }
      setIsOverIframe(false);

      let isClickable = false;
      if (target && target.nodeType === Node.ELEMENT_NODE) {
        try {
          const isButtonOrLink = Boolean(
            target.closest('a, button, [role="button"], input, select, textarea, label, [tabindex="0"]')
          );
          const computedCursor = window.getComputedStyle(target)?.cursor;
          isClickable = isButtonOrLink || computedCursor === 'pointer';
        } catch {
          // Graceful fallback
        }
      }
      setIsHovering(isClickable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsWindowHovered(false);
    const handleMouseEnter = () => setIsWindowHovered(true);
    const handleWindowBlur = () => {
      // If focus moved into an embedded YouTube/Odysee iframe, hide custom cursor
      if (document.activeElement?.tagName === 'IFRAME') {
        setIsOverIframe(true);
      }
    };

    window.addEventListener('mousemove', updateCursor, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    document.body.style.cursor = 'none';

    const style = document.createElement('style');
    style.id = 'hide-default-cursor';
    style.innerHTML = `
      a, button, [role="button"], label, * {
        cursor: none !important;
      }
      input, textarea, [contenteditable="true"], iframe {
        cursor: auto !important;
      }
      input, textarea, [contenteditable="true"] {
        cursor: text !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      finePointerQuery.removeEventListener('change', handleChange);
      reducedMotionQuery.removeEventListener('change', handleChange);
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.body.style.cursor = 'auto';
      const existing = document.getElementById('hide-default-cursor');
      if (existing) existing.remove();
    };
  }, [cursorX, cursorY]);

  if (!isEnabled) return null;

  return (
    <div style={{ opacity: isWindowHovered && !isOverIframe ? 1 : 0, transition: 'opacity 0.15s ease-out' }}>
      {/* Center Dot */}
      <motion.div
        className="fixed top-0 left-0 w-[5px] h-[5px] bg-[var(--accent)] rounded-full pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: 7.5,
          translateY: 7.5,
        }}
      />
      {/* Architectural Square Reticle */}
      <motion.div
        className="fixed top-0 left-0 w-5 h-5 border border-[var(--accent)] pointer-events-none z-[9998] flex items-center justify-center"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isClicking ? 0.78 : isHovering ? 1.45 : 1,
          rotate: isHovering ? 45 : 0,
          opacity: isHovering ? 0.95 : 0.55,
        }}
        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
      />
    </div>
  );
};
