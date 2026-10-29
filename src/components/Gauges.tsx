import React from 'react';
import { getCoordLabel, formatClock } from '../utils/engine.js';

interface Props {
  sureDk: number;
  etki: number;
  risk: number;
  koordinasyon: number;
  highlights?: {
    sure?: boolean;
    etki?: boolean;
    risk?: boolean;
    koordinasyon?: boolean;
  };
}

export const Gauges: React.FC<Props> = ({
  sureDk,
  etki,
  risk,
  koordinasyon,
  highlights = {},
}) => {
  const clock = formatClock(sureDk);
  const isHighRisk = risk >= 70;

  return (
    <div className="grid grid-cols-2 gap-2 my-3">
      {/* Olay Süresi */}
      <div
        data-testid="gosterge-sure"
        className={`border border-[var(--cizgi)] rounded-[4px] p-2 flex flex-col justify-between highlight-transition ${
          highlights.sure ? 'bg-[var(--fosfor)]' : 'bg-[var(--fis)]'
        }`}
      >
        <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
          OLAY SÜRESİ
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-mono-code text-[17px] font-semibold text-[var(--murekkep)]">
            {sureDk} <span className="text-[12px] font-normal text-[var(--soluk)]">dk</span>
          </span>
          <span className="font-mono-code text-[12px] text-[var(--soluk)] font-medium">
            ({clock})
          </span>
        </div>
      </div>

      {/* Etki */}
      <div
        data-testid="gosterge-etki"
        className={`border border-[var(--cizgi)] rounded-[4px] p-2 flex flex-col justify-between highlight-transition ${
          highlights.etki ? 'bg-[var(--fosfor)]' : 'bg-[var(--fis)]'
        }`}
      >
        <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
          ETKİ
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-mono-code text-[17px] font-semibold text-[var(--murekkep)]">
            {etki}
          </span>
          <span className="text-[12px] text-[var(--soluk)] font-normal truncate max-w-[90px]">
            bekleyen talep
          </span>
        </div>
      </div>

      {/* Veri Riski */}
      <div
        data-testid="gosterge-risk"
        className={`border border-[var(--cizgi)] rounded-[4px] p-2 flex flex-col justify-between highlight-transition ${
          highlights.risk ? 'bg-[var(--fosfor)]' : 'bg-[var(--fis)]'
        }`}
      >
        <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
          VERİ RİSKİ
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span
            className={`font-mono-code text-[17px] font-semibold ${
              isHighRisk ? 'text-[var(--damga)] font-bold' : 'text-[var(--murekkep)]'
            }`}
          >
            {risk} <span className="text-[12px] font-normal text-[var(--soluk)]">/ 100</span>
          </span>
          {isHighRisk && (
            <span className="font-mono-code text-[12px] text-[var(--damga)] font-bold">
              KRİTİK
            </span>
          )}
        </div>
      </div>

      {/* Ekip Koordinasyonu */}
      <div
        data-testid="gosterge-ekip"
        className={`border border-[var(--cizgi)] rounded-[4px] p-2 flex flex-col justify-between highlight-transition ${
          highlights.koordinasyon ? 'bg-[var(--fosfor)]' : 'bg-[var(--fis)]'
        }`}
      >
        <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
          EKİP KOORDİNASYONU
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-mono-code text-[15px] font-semibold text-[var(--murekkep)]">
            {getCoordLabel(koordinasyon)}
          </span>
          {koordinasyon === 0 && (
            <span className="font-mono-code text-[12px] text-[var(--pas)] font-semibold">
              +5 dk/eylem
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
