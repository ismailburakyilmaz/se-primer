import React, { useEffect } from 'react';
import { KararKaydi, Hedef, Rol } from '../types/game.js';
import { SCENARIO, formatClock, getCoordLabel } from '../utils/engine.js';
import { RubberStamp } from '../components/RubberStamp.js';

interface Props {
  endGame: 'alindi' | 'alinamadi' | 'ihlal';
  endReasons: string[];
  kararlar: KararKaydi[];
  sureDk: number;
  etki: number;
  maxEtki: number;
  risk: number;
  koordinasyon: number;
  hedef: Hedef;
  currentRol: Rol;
  onPlayOtherRole: () => void;
  onRestart: () => void;
}

export const ResultScreen: React.FC<Props> = ({
  endGame,
  endReasons,
  kararlar,
  sureDk,
  etki,
  maxEtki,
  risk,
  koordinasyon,
  hedef,
  currentRol,
  onPlayOtherRole,
  onRestart,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const sonConfig = SCENARIO.sonlar[endGame];
  const clock = formatClock(sureDk);
  const totalKarar = kararlar.length;

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 bg-[var(--kagit)] min-h-screen flex flex-col justify-between animate-scene-enter">
      <div>
        {/* Fiş Başlığı per DESIGN.md §5 */}
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-4">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            OLAY RAPORU · No: 0428
          </div>
          <div className="font-mono-code text-[12px] text-[var(--soluk)]">
            ŞİFA HASTANESİ
          </div>
        </div>

        {/* Sonuç Damgası ve Başlık */}
        <div className="my-5 flex flex-col items-center text-center">
          <RubberStamp
            text={sonConfig.damga}
            testId="son-damga"
            large
            className="mb-3 animate-stamp-press"
          />
          <h1 className="font-serif-heading text-[26px] font-semibold text-[var(--murekkep)] mb-2">
            {sonConfig.baslik}
          </h1>

          <p className="text-[14px] text-[var(--soluk)] max-w-md leading-relaxed">
            {sonConfig.aciklama}
          </p>

          {/* Kontrol altına alınamadı ise neden(ler) */}
          {endGame === 'alinamadi' && endReasons.length > 0 && (
            <div className="mt-3 p-3 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] text-left w-full">
              <span className="font-mono-code text-[12px] font-semibold text-[var(--damga)] uppercase block mb-1">
                KONTROL DIŞINA ÇIKMA NEDENLERİ:
              </span>
              <ul className="list-disc list-inside text-[13px] text-[var(--murekkep)] space-y-1">
                {endReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Özet Satırı ve Son Göstergeler */}
        <div className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 my-4">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider mb-2">
            OLAY KAPANIŞ GÖSTERGELERİ
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)]">
              <span className="font-mono-code text-[12px] text-[var(--soluk)] block uppercase">SÜRE</span>
              <span className="font-mono-code text-[15px] font-bold text-[var(--murekkep)]">{sureDk} dk</span>
              <span className="text-[12px] text-[var(--soluk)] font-mono-code block">({clock})</span>
            </div>
            <div className="p-2 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)]">
              <span className="font-mono-code text-[12px] text-[var(--soluk)] block uppercase">KARAR</span>
              <span className="font-mono-code text-[15px] font-bold text-[var(--murekkep)]">{totalKarar}</span>
              <span className="text-[12px] text-[var(--soluk)] font-mono-code block">/ 8 sınır</span>
            </div>
            <div className="p-2 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)]">
              <span className="font-mono-code text-[12px] text-[var(--soluk)] block uppercase">VERİ RİSKİ</span>
              <span className={`font-mono-code text-[15px] font-bold ${risk >= 70 ? 'text-[var(--damga)]' : 'text-[var(--murekkep)]'}`}>
                {risk} / 100
              </span>
              <span className="text-[12px] text-[var(--soluk)] font-mono-code block">risk puanı</span>
            </div>
            <div className="p-2 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)]">
              <span className="font-mono-code text-[12px] text-[var(--soluk)] block uppercase">EKİP</span>
              <span className="font-mono-code text-[13px] font-bold text-[var(--murekkep)]">
                {getCoordLabel(koordinasyon)}
              </span>
              <span className="text-[12px] text-[var(--soluk)] font-mono-code block">koordinasyon</span>
            </div>
          </div>
          <div className="mt-2 text-center text-[12px] text-[var(--soluk)] font-mono-code">
            En yüksek bekleyen talep etkisi: <strong className="text-[var(--murekkep)]">{maxEtki}</strong>
          </div>
        </div>

        {/* Suçlamasız Değerlendirme (Blameless Post-Mortem) */}
        <div className="my-6">
          <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-1 mb-3">
            <span className="font-mono-code text-[12px] font-semibold text-[var(--murekkep)] uppercase tracking-wider">
              SUÇLAMASIZ DEĞERLENDİRME
            </span>
            <span className="font-mono-code text-[12px] text-[var(--soluk)]">
              ZAMAN ÇİZELGESİ
            </span>
          </div>

          <div className="space-y-4">
            {kararlar.map((k, idx) => (
              <div
                key={idx}
                data-testid={`degerlendirme-satir-${idx}`}
                className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-3 text-[14px]"
              >
                <div className="flex items-baseline justify-between border-b border-[var(--cizgi)] pb-1 mb-2">
                  <span className="font-mono-code text-[12px] font-bold text-[var(--tukenmez)]">
                    #{idx + 1} ADIM · {k.saat}
                  </span>
                  {k.isZamanAsimi && (
                    <span className="font-mono-code text-[12px] text-[var(--pas)] font-bold">
                      ZAMAN AŞIMI
                    </span>
                  )}
                </div>

                <div className="font-medium text-[var(--murekkep)] mb-2">
                  "{k.kararMetni}"
                </div>

                <div className="space-y-2 text-[13px]">
                  <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                    <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase block mb-0.5">
                      O AN BİLDİKLERİN:
                    </span>
                    <span className="text-[var(--murekkep)]">{k.oAn}</span>
                  </div>

                  <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                    <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase block mb-0.5">
                      SONRADAN ÖĞRENDİKLERİN:
                    </span>
                    <span className="text-[var(--murekkep)]">{k.sonradan}</span>
                  </div>

                  {hedef === 'Mülakat pratiği' && k.varsayim && (
                    <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                      <span className="font-mono-code text-[12px] font-bold text-[var(--tukenmez)] uppercase block mb-0.5">
                        VARSAYIMIN:
                      </span>
                      <span className="text-[var(--murekkep)] italic">{k.varsayim}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bu Olaydan Tek İlke */}
        <div className="my-6 bg-[var(--fis)] border border-[var(--murekkep)] rounded-[4px] p-4 text-center">
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-1">
            BU OLAYDAN TEK İLKE
          </span>
          <div
            data-testid="son-ilke"
            className="font-serif-heading text-[17px] font-semibold text-[var(--murekkep)] italic leading-relaxed"
          >
            "{sonConfig.ilke}"
          </div>
        </div>
      </div>

      {/* Aksiyon Düğmeleri */}
      <div className="space-y-2.5 pt-4 border-t border-[var(--cizgi)]">
        <button
          type="button"
          data-testid="dugme-baska-rol"
          onClick={onPlayOtherRole}
          className="w-full h-12 bg-[var(--tukenmez)] hover:opacity-95 text-white font-medium rounded-[4px] cursor-pointer text-[15px]"
        >
          Başka rolle oyna
        </button>

        <button
          type="button"
          data-testid="dugme-tekrar"
          onClick={onRestart}
          className="w-full h-11 bg-[var(--fis)] hover:bg-[var(--kagit)] border border-[var(--murekkep)] text-[var(--murekkep)] font-medium rounded-[4px] cursor-pointer text-[14px]"
        >
          Tekrar oyna
        </button>
      </div>
    </div>
  );
};
