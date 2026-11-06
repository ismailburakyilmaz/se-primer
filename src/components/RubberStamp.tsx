export type StampType =
  | 'DOĞRULANDI'
  | 'BELİRTİ'
  | 'VARSAYIM'
  | 'BİLİNMİYOR'
  | 'YENİ KAYIT'
  | 'KONTROL ALTINA ALINDI'
  | 'KONTROL ALTINA ALINAMADI'
  | 'VERİ İHLALİ'
  | 'BULUNDU'
  | 'BASKI'
  | 'ONAYLANDI';

interface Props {
  text: string;
  type?: StampType;
  large?: boolean;
  bas?: boolean;
  className?: string;
  testId?: string;
}

export const RubberStamp: React.FC<Props> = ({
  text,
  type,
  large = false,
  bas = false,
  className = '',
  testId,
}) => {
  const normalized = (type || text).trim().toLocaleUpperCase('tr-TR');

  let colorClass = 'text-[var(--soluk)] border-[var(--soluk)]';
  let isDashed = false;

  if (
    normalized.includes('DOĞRULANDI') ||
    normalized.includes('KONTROL ALTINA ALINDI') ||
    normalized.includes('BULUNDU') ||
    normalized.includes('DESTEK') ||
    normalized.includes('ONAY')
  ) {
    colorClass = 'text-[var(--onay)] border-[var(--onay)]';
  } else if (normalized.includes('BELİRTİ') || normalized.includes('BASKI')) {
    colorClass = 'text-[var(--pas)] border-[var(--pas)]';
  } else if (normalized.includes('VERİ İHLALİ') || normalized.includes('KONTROL ALTINA ALINAMADI')) {
    colorClass = 'text-[var(--damga)] border-[var(--damga)]';
  } else if (normalized.includes('BİLİNMİYOR') || normalized.includes('DENENDİ')) {
    colorClass = 'text-[var(--soluk)] border-[var(--soluk)]';
    isDashed = true;
  }

  const animationClass = bas ? 'animate-stamp-press stamp-bleed' : '';

  return (
    <span
      data-testid={testId}
      className={`font-mono-code uppercase font-semibold tracking-wider inline-flex items-center justify-center select-none ${
        large ? 'rubber-stamp-lg' : 'rubber-stamp'
      } ${colorClass} ${isDashed ? 'border-dashed' : ''} ${animationClass} ${className}`}
      style={{
        boxShadow: isDashed ? 'none' : undefined,
      }}
    >
      {text.toLocaleUpperCase('tr-TR')}
    </span>
  );
};

