import React, { useEffect, useState } from 'react';

interface Props {
  isActive: boolean;
  isPaused: boolean;
  onTimeout: () => void;
  resetKey: any;
}

export const Timer: React.FC<Props> = ({ isActive, isPaused, onTimeout, resetKey }) => {
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    setSecondsLeft(60);
  }, [resetKey]);

  useEffect(() => {
    if (!isActive || isPaused) return;

    if (secondsLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isPaused, secondsLeft, onTimeout]);

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
