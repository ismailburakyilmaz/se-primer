import React, { useEffect, useState } from 'react';
import { initModel, predictKotuSonProb, getModelDurum } from '../utils/modelService.js';
import pariteData from '../data/parite.json';
import { MODEL_URL } from '../config/model.js';

interface ResultItem {
  id: string;
  ad: string;
  beklenen: number;
  hesaplanan: number | null;
  fark: number | null;
}

export const PariteScreen: React.FC = () => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function runPariteTest() {
      try {
        setLoading(true);
        // Oyunun kullandığı AYNI model servisi: test, oyunda çalışan kodu ölçer
        const { session, config } = await initModel();
        if (!session || !config) {
          throw new Error(getModelDurum().mesaj);
        }

        const calculated: ResultItem[] = [];
        for (const item of (pariteData as any).girdiler) {
          const prob = await predictKotuSonProb(item.x);
          if (prob === null) throw new Error('model çıkarımı başarısız');
          calculated.push({
            id: item.id,
            ad: item.ad,
            beklenen: item.p,
            hesaplanan: prob,
            fark: Math.abs(prob - item.p),
          });
        }

        if (isMounted) {
          setResults(calculated);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Bilinmeyen hata');
          setLoading(false);
        }
      }
    }

    runPariteTest();

    return () => {
      isMounted = false;
    };
  }, []);

  const firstP = results[0]?.hesaplanan !== null && results[0]?.hesaplanan !== undefined
    ? results[0].hesaplanan.toFixed(6)
    : '';

  return (
    <div
      className="min-h-screen bg-[var(--kagit)] text-[var(--murekkep)] p-6 font-sans flex flex-col items-center"
      {...(!loading && !error ? { 'data-cy': 'parite-hazir' } : {})}
    >
      <div className="w-full max-w-2xl bg-[var(--fis)] border border-[var(--cizgi)] p-6 rounded-[2px] shadow-sm">
        <h1 className="text-2xl font-serif font-bold text-[var(--murekkep)] mb-2">
          Parite testi
        </h1>
        <p className="font-mono-code text-[12px] text-[var(--soluk)] mb-4">
          Diferansiyel test: Hugging Face commit-sabit ONNX modeli vs. Python Test Kahini
        </p>

        <div className="mb-5 pb-3 border-b border-[var(--cizgi)]">
          <div className="font-mono-code text-[12px] uppercase tracking-wider text-[var(--soluk)] mb-1">
            Model Adresi
          </div>
          <div
            data-cy="model-url"
            className="font-mono-code text-[12px] text-[var(--tukenmez)] break-all select-all bg-[var(--kagit)] p-2 border border-[var(--cizgi)] rounded-[2px]"
          >
            {MODEL_URL}
          </div>
        </div>

        {loading && (
          <div className="font-mono-code text-[13px] text-[var(--soluk)] py-8 text-center animate-pulse">
            Model indiriliyor ve çıkarım yapılıyor...
          </div>
        )}

        {error && (
          <div className="font-mono-code text-[13px] text-[var(--pas)] py-4">
            Hata: {error}
          </div>
        )}

        {!loading && !error && (
          <div>
            {/* data-cy="p" ilk satırın olasılığı */}
            <div className="hidden" data-cy="p">
              {firstP}
            </div>

            <div className="space-y-4">
              {results.map((res, index) => {
                const pFormatted = res.hesaplanan !== null ? res.hesaplanan.toFixed(6) : '-';
                const pass = res.fark !== null && res.fark < 0.0001;

                return (
                  <div
                    key={res.id}
                    className="p-3 border border-[var(--cizgi)] bg-[var(--kagit)] rounded-[2px]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono-code text-[12px] font-bold text-[var(--murekkep)]">
                        {res.id} · {res.ad}
                      </span>
                      <span
                        className={`font-mono-code text-[12px] px-1.5 py-0.5 rounded-[2px] ${
                          pass
                            ? 'bg-[var(--onay)]/15 text-[var(--onay)] border border-[var(--onay)]'
                            : 'bg-[var(--pas)]/15 text-[var(--pas)] border border-[var(--pas)]'
                        }`}
                      >
                        {pass ? 'PARİTE GEÇTİ' : 'FARK > 1e-4'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-dashed border-[var(--cizgi)] font-mono-code text-[13px]">
                      <span className="text-[var(--soluk)] text-[12px]">Hesaplanan olasılık:</span>
                      <span
                        data-cy={`p-${index}`}
                        className="font-bold text-[14px] text-[var(--murekkep)]"
                      >
                        {pFormatted}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-[12px] font-mono-code text-[var(--soluk)] mt-1">
                      <span>Python Kahini (beklenen): {res.beklenen.toFixed(6)}</span>
                      <span>Fark: {res.fark !== null ? res.fark.toExponential(2) : '-'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
