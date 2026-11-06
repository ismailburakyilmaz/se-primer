import React, { useState } from 'react';

export type PortreBoy = 24 | 48 | 96;

interface Props {
  kisiId: string;
  boy?: PortreBoy;
  size?: number;
  className?: string;
  onClick?: () => void;
  title?: string;
  dimmed?: boolean;
}

export const Portre: React.FC<Props> = ({
  kisiId,
  boy,
  size,
  className = '',
  onClick,
  title,
  dimmed = false,
}) => {
  const [loadError, setLoadError] = useState<boolean>(false);
  const initial = (kisiId || '').charAt(0).toUpperCase();

  // Resolve boy: 24, 48, or 96
  const resolvedBoy: PortreBoy =
    boy || (size && size >= 72 ? 96 : size && size >= 36 ? 48 : 24);

  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden border border-[var(--cizgi)] rounded-[2px] select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${dimmed ? 'opacity-60' : ''} ${className}`}
      style={{
        width: `${resolvedBoy}px`,
        height: `${resolvedBoy}px`,
        backgroundColor: 'var(--fis)',
        imageRendering: 'pixelated',
      }}
    >
      {!loadError ? (
        <img
          src={`/portreler/${kisiId}-${resolvedBoy}.png`}
          alt={title || kisiId}
          width={resolvedBoy}
          height={resolvedBoy}
          onError={() => setLoadError(true)}
          className="block"
          style={{
            width: `${resolvedBoy}px`,
            height: `${resolvedBoy}px`,
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <span
          className="font-mono-code font-bold text-[var(--soluk)] flex items-center justify-center"
          style={{ fontSize: Math.max(10, Math.floor(resolvedBoy * 0.45)) }}
        >
          {initial}
        </span>
      )}
    </div>
  );
};
