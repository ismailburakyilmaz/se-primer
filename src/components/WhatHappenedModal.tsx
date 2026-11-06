import React, { useState, useEffect } from 'react';
import { Eylem, Hedef } from '../types/game.js';
import { Portre } from './Portre.js';
import { SCENARIO, getKarakter } from '../utils/engine.js';

interface Props {
  eylem: Eylem | null;
  isOpen: boolean;
  hedef: Hedef;
  isEndGame?: boolean;
  gaugeChangesText?: string;
  onContinue: (mulakatCümlesi?: string, savunmaMetni?: string) => void;
  onOpenTutorOffer: () => void;
}

export const WhatHappenedModal: React.FC<Props> = ({
  eylem,
  isOpen,
  hedef,
  isEndGame = false,
  gaugeChangesText = '',
  onContinue,
  onOpenTutorOffer,
}) => {
  const [mulakatText, setMulakatText] = useState<string>('');
  const [savunmaInput, setSavunmaInput] = useState<string>('');
  const [savedSavunma, setSavedSavunma] = useState<string>('');
  const [showKaygi, setShowKaygi] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSavunmaInput('');
      setSavedSavunma('');
      setShowKaygi(false);
      setMulakatText('');
    }
  }, [isOpen, eylem?.id]);

  if (!isOpen || !eylem) return null;

  const showLongReason = hedef === 'Öğrenmek' && Boolean(eylem.neden_oldu_uzun);
  const reasonText = showLongReason ? eylem.neden_oldu_uzun : eylem.neden_oldu;
  const showTutorOffer = !isEndGame && ['geciktiren', 'tehlikeli', 'kirmizi_cizgi'].includes(eylem.tur);

  const seytan = hedef === 'Mülakat pratiği' && eylem.seytanin_avukati ? eylem.seytanin_avukati : null;
  const seytanKarakter = seytan ? getKarakter(seytan.kisi) : null;

  const handleContinue = () => {
    const finalSavunma = savedSavunma || (savunmaInput.trim() ? savunmaInput.trim() : undefined);
    onContinue(mulakatText.trim() || undefined, finalSavunma);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div
        data-testid="panel-ne-oldu"
        className="animate-fis-cik w-full sm:max-w-lg bg-[var(--fis)] border border-[var(--cizgi)] rounded-t-[4px] sm:rounded-[4px] p-5 text-[var(--murekkep)] max-h-[85vh] overflow-y-auto"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-3 gap-1">
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            MÜDAHALE SONUCU · DEĞERLENDİRME
          </span>
          {gaugeChangesText ? (
            <span className="font-mono-code text-[12px] text-[var(--tukenmez)] font-semibold">
              {gaugeChangesText}
            </span>
          ) : (
            <span className="font-mono-code text-[12px] text-[var(--soluk)]">
              +{eylem.sure_dk} dk
            </span>
          )}
        </div>

        {/* Ne oldu */}
        <div className="mb-4">
          <span className="font-mono-code text-[12px] font-bold text-[var(--murekkep)] uppercase tracking-wider block mb-1">
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
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase tracking-wider">
              NEDEN OLDU:
            </span>
            {showLongReason && (
              <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] border border-[var(--cizgi)] px-1.5 py-0.5 rounded-[2px]">
                UZUN AÇIKLAMA
              </span>
            )}
          </div>
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

        {/* Mülakat Pratiği Tek Satırlık Kutu */}
        {hedef === 'Mülakat pratiği' && (
          <div className="mb-4 p-3 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[4px]">
            <label
              htmlFor="mulakat-kutu-input"
              className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-1.5"
            >
              Bunu mülakatta nasıl anlatırdın?
            </label>
            <input
              id="mulakat-kutu-input"
              data-testid="mulakat-kutu"
              type="text"
              value={mulakatText}
              onChange={(e) => setMulakatText(e.target.value)}
              placeholder="İsteğe bağlı: Kararının arkasındaki gerekçeyi yaz..."
              className="w-full px-3 py-2 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[2px] font-sans text-[13px] text-[var(--murekkep)] focus:outline-none focus:border-[var(--tukenmez)]"
            />
          </div>
        )}

        {/* Şeytanın Avukatı / İtiraz (spec §15.10, DESIGN.md §9) */}
        {seytan && seytanKarakter && (
          <div
            data-testid="itiraz"
            className="mb-4 pt-3 border-t border-dashed border-[var(--cizgi)]"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Portre kisiId={seytan.kisi} boy={24} />
              <div>
                <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase tracking-wider block">
                  İTİRAZ · {seytanKarakter.ad}
                </span>
              </div>
            </div>

            <p className="text-[14px] font-sans text-[var(--murekkep)] leading-relaxed mb-3">
              "{seytan.metin}"
            </p>

            {!showKaygi ? (
              <div className="space-y-2">
                <input
                  data-testid="itiraz-savunma"
                  type="text"
                  value={savunmaInput}
                  onChange={(e) => setSavunmaInput(e.target.value)}
                  placeholder="Kararını savun (isteğe bağlı)..."
                  className="w-full px-3 py-2 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] font-sans text-[13px] text-[var(--murekkep)] focus:outline-none focus:border-[var(--murekkep)]"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (savunmaInput.trim()) {
                        setSavedSavunma(savunmaInput.trim());
                      }
                      setShowKaygi(true);
                    }}
                    className="px-3 py-1.5 bg-[var(--kagit)] border border-[var(--cizgi)] text-[var(--murekkep)] text-[12px] font-mono-code rounded-[2px] hover:bg-[var(--fis)] cursor-pointer"
                  >
                    Savun
                  </button>
                  <button
                    type="button"
                    data-testid="itiraz-atla"
                    onClick={() => setShowKaygi(true)}
                    className="px-3 py-1.5 bg-[var(--kagit)] border border-[var(--cizgi)] text-[var(--soluk)] text-[12px] font-mono-code rounded-[2px] hover:bg-[var(--fis)] cursor-pointer"
                  >
                    Atla
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {savedSavunma && (
                  <div className="text-[13px] text-[var(--murekkep)] mb-2 font-medium">
                    <span className="font-mono-code text-[12px] text-[var(--soluk)] uppercase font-semibold">
                      SAVUNMAN:{' '}
                    </span>
                    {savedSavunma}
                  </div>
                )}
                <div
                  data-testid="itiraz-kaygi"
                  className="p-2.5 bg-[var(--kagit)] border-l-[3px] border-[var(--cizgi)] text-[13px] text-[var(--soluk)] leading-relaxed"
                >
                  {seytan.kaygi}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="tear-line my-4" />

        {/* Devam butonu */}
        <button
          data-testid="dugme-devam"
          onClick={handleContinue}
          className="w-full h-12 bg-[var(--tukenmez)] hover:opacity-95 text-white font-medium rounded-[4px] cursor-pointer text-[15px]"
        >
          Devam Et
        </button>
      </div>
    </div>
  );
};
