import React from 'react';
import { Eylem, Hedef } from '../types/game.js';

interface Props {
  eylem: Eylem | null;
  isOpen: boolean;
  hedef: Hedef;
  onContinue: () => void;
  onOpenTutorOffer: () => void;
}

export const WhatHappenedModal: React.FC<Props> = ({
  eylem,
  isOpen,
  hedef,
  onContinue,
  onOpenTutorOffer,
}) => {
  if (!isOpen || !eylem) return null;

  const showLongReason = hedef === 'Öğrenmek' && eylem.neden_oldu_uzun;
  const reasonText = showLongReason ? eylem.neden_oldu_uzun : eylem.neden_oldu;
  const showTutorOffer = ['geciktiren', 'tehlikeli', 'kirmizi_cizgi'].includes(eylem.tur);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div
        data-testid="panel-ne-oldu"
        className="w-full sm:max-w-lg bg-[var(--fis)] border border-[var(--cizgi)] rounded-t-[4px] sm:rounded-[4px] p-5 text-[var(--murekkep)] max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-3">
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            MÜDAHALE SONUCU · DEĞERLENDİRME
          </span>
          <span className="font-mono-code text-[11px] text-[var(--soluk)]">
            +{eylem.sure_dk} dk
          </span>
        </div>

        {/* Ne oldu */}
        <div className="mb-4">
          <span className="font-mono-code text-[11px] font-bold text-[var(--murekkep)] uppercase tracking-wider block mb-1">
            NE OLDU:
          </span>
          <div
            data-testid="ne-oldu"
            className="p-3 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[4px] text-[15px] leading-relaxed text-[var(--murekkep)]"
          >
            {eylem.ne_oldu}
          </div>
        </div>

        {/* Neden oldu */}
        <div className="mb-4">
          <span className="font-mono-code text-[11px] font-bold text-[var(--soluk)] uppercase tracking-wider block mb-1">
            NEDEN OLDU:
          </span>
          <div
            data-testid="neden-oldu"
            className="p-3 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[4px] text-[14px] leading-relaxed text-[var(--soluk)]"
          >
            {reasonText}
          </div>
        </div>

        {/* Tutor Teklifi */}
        {showTutorOffer && (
          <div className="mb-4 p-3 border border-[var(--cizgi)] rounded-[4px] bg-[var(--fis)] flex flex-col gap-2">
            <span className="text-[13px] text-[var(--soluk)]">
              Bu müdahalede beklenmedik bir sonuç ortaya çıktı.
            </span>
            <button
              data-testid="teklif-tutor"
              onClick={onOpenTutorOffer}
              className="text-[13px] font-medium text-[var(--tukenmez)] hover:underline text-left cursor-pointer"
            >
              Ne kaçırıldığını tutorla birlikte düşünmek ister misin? →
            </button>
          </div>
        )}

        <div className="tear-line my-4" />

        {/* Devam butonu */}
        <button
          data-testid="dugme-devam"
          onClick={onContinue}
          className="w-full h-12 bg-[var(--tukenmez)] hover:opacity-95 text-white font-medium rounded-[4px] cursor-pointer text-[15px]"
        >
          Devam Et
        </button>
      </div>
    </div>
  );
};
