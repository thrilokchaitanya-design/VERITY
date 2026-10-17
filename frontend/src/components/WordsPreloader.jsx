import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './WordsPreloader.css';

const GREETINGS = [
  { text: 'Hello', lang: 'en' },
  { text: 'Hola', lang: 'es' },
  { text: 'Bonjour', lang: 'fr' },
  { text: 'Ciao', lang: 'it' },
  { text: 'Olá', lang: 'pt' },
  { text: 'Hallo', lang: 'de' },
  { text: 'Привет', lang: 'ru' },
  { text: 'こんにちは', lang: 'ja' },
  { text: '안녕하세요', lang: 'ko' },
  { text: 'नमस्ते', lang: 'hi' },
  { text: 'مرحباً', lang: 'ar', dir: 'rtl' },
  { text: '你好', lang: 'zh' },
  { text: 'Hello', lang: 'en' },
];

const REVEAL = { rx: 80, ry: 180 };
const REVEAL_EASE = [0.65, 0, 0.35, 1];

export default function WordsPreloader({ onComplete }) {
  const reducedMotion = useReducedMotion();
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [phase, setPhase] = useState('greetings');
  const ellipseRef = useRef(null);
  const completeRef = useRef(onComplete);
  const maskId = `hello-reveal-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'greetings') return undefined;

    let step = 0;
    let timeline;
    const advance = () => {
      if (step < GREETINGS.length - 1) {
        step += 1;
        setGreetingIndex(step);
      } else {
        setPhase('reveal');
      }
    };
    const startTimeline = () => {
      if (document.hidden || timeline !== undefined) return;
      timeline = window.setInterval(advance, reducedMotion ? 240 : 490);
    };
    const handleVisibility = () => {
      if (document.hidden) {
        window.clearInterval(timeline);
        timeline = undefined;
      } else {
        startTimeline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startTimeline();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(timeline);
    };
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== 'reveal') return undefined;

    const duration = reducedMotion ? 0.7 : 1.2;
    let elapsed = 0;
    let lastTime;
    let frame;
    const animateOpening = now => {
      frame = undefined;
      if (document.hidden) return;
      if (lastTime !== undefined) elapsed += Math.min(now - lastTime, 50);
      lastTime = now;
      const linearProgress = Math.min(elapsed / (duration * 1000), 1);
      const progress = linearProgress < 0.5
        ? 4 * linearProgress ** 3
        : 1 - ((-2 * linearProgress + 2) ** 3) / 2;
      const ellipse = ellipseRef.current;
      if (ellipse) {
        ellipse.setAttribute('rx', String(0.15 + (REVEAL.rx - 0.15) * progress));
        ellipse.setAttribute('ry', String(0.15 + (REVEAL.ry - 0.15) * progress));
      }
      if (linearProgress < 1) frame = window.requestAnimationFrame(animateOpening);
      else completeRef.current?.();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        if (frame !== undefined) window.cancelAnimationFrame(frame);
        frame = undefined;
        lastTime = undefined;
      } else if (frame === undefined) {
        frame = window.requestAnimationFrame(animateOpening);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    if (!document.hidden) frame = window.requestAnimationFrame(animateOpening);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [phase, reducedMotion]);

  const greeting = GREETINGS[greetingIndex];
  const textMotion = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

  return <div className="hello-preloader" data-phase={phase} role="status" aria-live="polite" aria-label={greeting.text}>
    <svg
      className="hello-preloader__surface"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="white" />
          {phase === 'reveal' && <ellipse
            ref={ellipseRef}
            cx="50"
            cy="100"
            rx="0.15"
            ry="0.15"
            fill="black"
          />}
        </mask>
      </defs>
      <rect width="100" height="100" fill="#0b0b0d" mask={`url(#${maskId})`} />
    </svg>

    <div className="hello-preloader__greeting-stage">
      <AnimatePresence mode="sync" initial={false}>
        {phase === 'greetings' && <motion.span
          className="hello-preloader__greeting"
          key={greetingIndex}
          lang={greeting.lang}
          dir={greeting.dir || 'ltr'}
          initial={textMotion.initial}
          animate={textMotion.animate}
          exit={textMotion.exit}
          transition={{ duration: reducedMotion ? 0.1 : 0.23, ease: REVEAL_EASE }}
        >
          {greeting.text}
        </motion.span>}
      </AnimatePresence>
    </div>
  </div>;
}
