import React, { useEffect, useState, useRef } from 'react';

interface Props {
  isActive: boolean;
  isPaused: boolean;
  onTimeout: () => void;
  resetKey: any;
}

export const Timer: React.FC<Props> = ({ isActive, isPaused, onTimeout, resetKey }) => {
  const [secondsLeft, setSecondsLeft] = useState(60);
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
    setSecondsLeft(60);
    hasTimedOutRef.current = false;
  }, [resetKey]);

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

  if (!isActive) return null;

  const isLow = secondsLeft <= 10;
  const strokeColor = isLow ? 'var(--pas)' : 'var(--tukenmez)';
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / 60) * circumference;

  return (
    <div
      data-testid="sayac"
      className="flex items-center gap-1.5 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] px-2 py-1 select-none"
      title="Karar için kalan süre"
    >
      <svg className="w-5 h-5 -rotate-90 transform" viewBox="0 0 40 40">
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
