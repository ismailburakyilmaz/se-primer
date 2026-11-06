import React, { useEffect, useState, useRef } from 'react';

interface Props {
  isActive: boolean;
  isPaused: boolean;
  onTimeout: () => void;
  resetKey: any;
  sureSn?: number;
}

export const Timer: React.FC<Props> = ({ isActive, isPaused, onTimeout, resetKey, sureSn = 60 }) => {
  const [secondsLeft, setSecondsLeft] = useState(sureSn);
  const [isTabHidden, setIsTabHidden] = useState(
    typeof document !== 'undefined' ? document.hidden : false
  );
  const onTimeoutRef = useRef(onTimeout);
  const hasTimedOutRef = useRef(false);

  // Keep onTimeout in a ref so effect doesn't re-run on every render
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Tab visibility listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Reset when resetKey changes (new scene visit)
  useEffect(() => {
    setSecondsLeft(sureSn);
    hasTimedOutRef.current = false;
  }, [resetKey, sureSn]);

  useEffect(() => {
    // If not active, paused, tab hidden, or already timed out in this visit, do nothing
    if (!isActive || isPaused || isTabHidden || hasTimedOutRef.current) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasTimedOutRef.current) {
            hasTimedOutRef.current = true;
            onTimeoutRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isPaused, isTabHidden]);

  // Son 3 saniyede kısa titreşim (telefonda)
  useEffect(() => {
    if (!isActive || isPaused || secondsLeft > 3 || secondsLeft < 1) return;
    const azHareket = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!azHareket && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {}
    }
  }, [secondsLeft, isActive, isPaused]);

  if (!isActive) return null;

  const isLow = secondsLeft <= 10;
  const strokeColor = isLow ? 'var(--pas)' : 'var(--tukenmez)';
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / sureSn) * circumference;

  return (
    <div
      data-testid="sayac"
      className="flex items-center gap-1.5 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] px-2 py-1 select-none"
      title="Karar için kalan süre"
    >
      <svg className={`w-5 h-5 -rotate-90 transform ${isLow && !isPaused ? 'animate-nabiz' : ''}`} viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="var(--cizgi)"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3.5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <span
        className={`font-mono-code text-[12px] font-semibold ${
          isLow ? 'text-[var(--pas)] font-bold' : 'text-[var(--murekkep)]'
        }`}
      >
        {secondsLeft}s
      </span>
    </div>
  );
};
