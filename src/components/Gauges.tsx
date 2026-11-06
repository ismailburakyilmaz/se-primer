import React, { useState, useEffect } from 'react';
import { Portre } from './Portre.js';
import { SCENARIO, formatClock, getCoordLabel, getKarakter } from '../utils/engine.js';

interface Props {
  sureDk: number;
  etki: number;
  risk: number;
  koordinasyon: number;
  previousGauges?: {
    sureDk?: number;
    etki?: number;
    risk?: number;
    koordinasyon?: number;
  } | null;
  highlights?: {
    sure?: boolean;
    etki?: boolean;
    risk?: boolean;
    koordinasyon?: boolean;
  };
}

// Sayı bir önceki değerden yeni değere 500 ms'de sayarak gelir (yalnızca görünüm)
function useSayac(hedef: number, baslangic?: number): number {
  const [deger, setDeger] = useState<number>(baslangic ?? hedef);
  useEffect(() => {
    const azHareket =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bas = baslangic ?? hedef;
    if (azHareket || bas === hedef) {
      setDeger(hedef);
      return;
    }
    let kare = 0;
    const t0 = performance.now();
    const adim = (t: number) => {
      const k = Math.min(1, (t - t0) / 500);
      setDeger(Math.round(bas + (hedef - bas) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) kare = requestAnimationFrame(adim);
    };
    kare = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(kare);
  }, [hedef, baslangic]);
  return deger;
}

export const Gauges: React.FC<Props> = ({
  sureDk,
  etki,
  risk,
  koordinasyon,
  previousGauges,
}) => {
  const gorunenSure = useSayac(sureDk, previousGauges?.sureDk);
  const gorunenEtki = useSayac(etki, previousGauges?.etki);
  const clock = formatClock(gorunenSure);
  const isHighRisk = risk >= 70;
  const guvenKisisiId = (SCENARIO as any).guven_kisisi || 'vty';
  const guvenKisisi = getKarakter(guvenKisisiId);

  const [showOld, setShowOld] = useState<boolean>(false);

  useEffect(() => {
    if (previousGauges) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        setShowOld(true);
        const timer = setTimeout(() => {
          setShowOld(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    setShowOld(false);
  }, [previousGauges, sureDk, etki, risk, koordinasyon]);

  const hasOldSure =
    showOld &&
    previousGauges?.sureDk !== undefined &&
    previousGauges.sureDk !== sureDk;
  const hasOldEtki =
    showOld &&
    previousGauges?.etki !== undefined &&
    previousGauges.etki !== etki;
  const hasOldRisk =
    showOld &&
    previousGauges?.risk !== undefined &&
    previousGauges.risk !== risk;
  const hasOldCoord =
    showOld &&
    previousGauges?.koordinasyon !== undefined &&
    previousGauges.koordinasyon !== koordinasyon;

  return (
    <div className="grid grid-cols-2 gap-2 my-3">
      {/* Olay Süresi */}
      <div
        data-testid="gosterge-sure"
        className="border border-[var(--cizgi)] rounded-[4px] p-2 flex flex-col justify-between bg-[var(--fis)]"
      >
        <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
          OLAY SÜRESİ
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline flex-wrap">
            {hasOldSure && (
              <span
                aria-hidden="true"
                className="font-mono-code text-[14px] text-[var(--soluk)] line-through decoration-[var(--murekkep)] decoration-[1.5px] -rotate-2 mr-1 inline-block select-none animate-ink-fade"
              >
                {previousGauges?.sureDk}
              </span>
            )}
            <span className="font-mono-code text-[17px] font-semibold text-[var(--murekkep)]">
              {gorunenSure} <span className="text-[12px] font-normal text-[var(--soluk)]">dk</span>
            </span>
          </div>
          <span className="font-mono-code text-[12px] text-[var(--soluk)] font-medium">
            ({clock})
          </span>
        </div>
      </div>

      {/* Etki */}
      <div
        data-testid="gosterge-etki"
        className="border border-[var(--cizgi)] rounded-[4px] p-2 flex flex-col justify-between bg-[var(--fis)]"
      >
        <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
          ETKİ
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline flex-wrap">
            {hasOldEtki && (
              <span
                aria-hidden="true"
                className="font-mono-code text-[14px] text-[var(--soluk)] line-through decoration-[var(--murekkep)] decoration-[1.5px] -rotate-2 mr-1 inline-block select-none animate-ink-fade"
              >
                {previousGauges?.etki}
              </span>
            )}
            <span className="font-mono-code text-[17px] font-semibold text-[var(--murekkep)]">
              {gorunenEtki}
            </span>
          </div>
          <span className="text-[12px] text-[var(--soluk)] font-normal truncate max-w-[90px]">
            bekleyen talep
          </span>
        </div>
      </div>

      {/* Veri Riski */}
      <div
        data-testid="gosterge-risk"
        className="border border-[var(--cizgi)] rounded-[4px] p-2 flex flex-col justify-between bg-[var(--fis)]"
      >
        <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
          VERİ RİSKİ
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline flex-wrap">
            {hasOldRisk && (
              <span
                aria-hidden="true"
                className="font-mono-code text-[14px] text-[var(--soluk)] line-through decoration-[var(--murekkep)] decoration-[1.5px] -rotate-2 mr-1 inline-block select-none animate-ink-fade"
              >
                {previousGauges?.risk}
              </span>
            )}
            <span
              className={`font-mono-code text-[17px] font-semibold ${
                isHighRisk ? 'text-[var(--damga)] font-bold' : 'text-[var(--murekkep)]'
              }`}
            >
              {risk} <span className="text-[12px] font-normal text-[var(--soluk)]">/ 100</span>
            </span>
          </div>
          {isHighRisk && (
            <span className="font-mono-code text-[12px] text-[var(--damga)] font-bold">
              KRİTİK
            </span>
          )}
        </div>
      </div>

      {/* Ekibin Güveni */}
      <div
        data-testid="gosterge-ekip"
        className="border border-[var(--cizgi)] rounded-[4px] p-2 flex flex-col justify-between bg-[var(--fis)]"
      >
        <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
          EKİBİN GÜVENİ
        </span>
        <div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="flex items-baseline flex-wrap">
              {hasOldCoord && (
                <span
                  aria-hidden="true"
                  className="font-mono-code text-[12px] text-[var(--soluk)] line-through decoration-[var(--murekkep)] decoration-[1.5px] -rotate-2 mr-1 inline-block select-none animate-ink-fade"
                >
                  {getCoordLabel(previousGauges?.koordinasyon ?? 1)}
                </span>
              )}
              <span className="font-mono-code text-[15px] font-semibold text-[var(--murekkep)]">
                {getCoordLabel(koordinasyon)}
              </span>
            </div>
            {koordinasyon === 0 && (
              <span className="font-mono-code text-[12px] text-[var(--pas)] font-semibold">
                +5 dk/eylem
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-dashed border-[var(--cizgi)]">
            <Portre
              kisiId={guvenKisisiId}
              boy={24}
              dimmed={koordinasyon === 0}
            />
            <span className="font-mono-code text-[12px] text-[var(--soluk)] truncate">
              {guvenKisisi.ad}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
