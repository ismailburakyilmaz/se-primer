import React from 'react';

export type StampType =
  | 'DOĞRULANDI'
  | 'BELİRTİ'
  | 'VARSAYIM'
  | 'BİLİNMİYOR'
  | 'YENİ KAYIT'
  | 'KONTROL ALTINA ALINDI'
  | 'KONTROL ALTINA ALINAMADI'
  | 'VERİ İHLALİ';

interface Props {
  text: string;
  type?: StampType;
  large?: boolean;
  className?: string;
  testId?: string;
}

export const RubberStamp: React.FC<Props> = ({ text, type, large = false, className = '', testId }) => {
  const normalized = (type || text).trim().toUpperCase();

  let colorClass = 'text-[var(--soluk)] border-[var(--soluk)]';
  let isDashed = false;

  if (normalized.includes('DOĞRULANDI') || normalized.includes('KONTROL ALTINA ALINDI')) {
    colorClass = 'text-[var(--onay)] border-[var(--onay)]';
  } else if (normalized.includes('BELİRTİ')) {
    colorClass = 'text-[var(--pas)] border-[var(--pas)]';
  } else if (normalized.includes('VERİ İHLALİ') || normalized.includes('KONTROL ALTINA ALINAMADI')) {
    colorClass = 'text-[var(--damga)] border-[var(--damga)]';
  } else if (normalized.includes('BİLİNMİYOR')) {
    colorClass = 'text-[var(--soluk)] border-[var(--soluk)]';
    isDashed = true;
  }

  return (
    <span
      data-testid={testId}
      className={`font-mono-code uppercase font-semibold tracking-wider inline-flex items-center justify-center select-none ${
        large ? 'rubber-stamp-lg' : 'rubber-stamp'
      } ${colorClass} ${isDashed ? 'border-dashed' : ''} ${className}`}
      style={{
        boxShadow: isDashed ? 'none' : undefined,
      }}
    >
      {text}
    </span>
  );
};
