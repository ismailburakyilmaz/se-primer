import React, { useState } from 'react';
import { EVAL_INPUTS, SCENARIO, getSahne } from '../utils/engine.js';

interface EvalRowResult {
  id: string;
  sahne: string;
  rol: string;
  tur: string;
  seviye: string;
  hedef: string;
  ogrenci_girdisi: string;
  beklenen: string;
  cevap: string;
  model: string;
  durationMs: number;
  tarihSaat: string;
  status: 'idle' | 'running' | 'success' | 'error';
}

interface Props {
  onBack: () => void;
  isMock: boolean;
}

export const EvalScreen: React.FC<Props> = ({ onBack, isMock }) => {
  const [results, setResults] = useState<EvalRowResult[]>(() =>
    EVAL_INPUTS.map((inp) => ({
      id: inp.id,
      sahne: inp.sahne,
      rol: inp.rol,
      tur: inp.tur || '',
      seviye: inp.seviye,
      hedef: inp.hedef,
      ogrenci_girdisi: inp.ogrenci_girdisi,
      beklenen: inp.beklenen,
      cevap: '',
      model: '',
      durationMs: 0,
      tarihSaat: '',
      status: 'idle',
    }))
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const runSingleEval = async (index: number): Promise<void> => {
    const item = EVAL_INPUTS[index];
    const sahneObj = getSahne(item.sahne) || SCENARIO.sahneler[0];

    const kanitlarForRole = sahneObj.kanitlar.map((k: any) => ({
      etiket: k.etiket,
      metin: item.rol === 'backend' ? k.metin_backend : k.metin_lider,
    }));
    const secenekMetinleri = sahneObj.eylemler.map((e: any) =>
      item.rol === 'backend' ? e.metin_backend : e.metin_lider
    );

    // Map onceki_kararlar ids to texts
    const oncekiKararlarMetinleri: string[] = [];
    for (const actionId of item.onceki_kararlar || []) {
      for (const s of SCENARIO.sahneler) {
        const found = s.eylemler.find((e: any) => e.id === actionId);
        if (found) {
          oncekiKararlarMetinleri.push(
            item.rol === 'backend' ? found.metin_backend : found.metin_lider
          );
        }
      }
    }

    setResults((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'running' };
      return next;
    });

    const startTime = performance.now();
    const timestamp = new Date().toLocaleString('tr-TR');

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          olay_ozeti: SCENARIO.ozet,
          rol: item.rol === 'backend' ? 'Backend geliştirici' : 'Takım lideri',
          seviye: item.seviye,
          hedef: item.hedef,
          gorunen_kanitlar: kanitlarForRole,
          secenek_metinleri: secenekMetinleri,
          ogrenme_odagi: sahneObj.ogrenme_odagi,
          onceki_kararlar: oncekiKararlarMetinleri,
          mod: 'karar_oncesi',
          son_mesajlar: sahneObj.mesajlar,
          ogrenci_girdisi: item.ogrenci_girdisi,
          hazir_ipucu: sahneObj.hazir_ipucu,
          mock: isMock,
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (!res.ok) {
        setResults((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            cevap: 'HATA',
            model: 'error',
            durationMs: elapsed,
            tarihSaat: timestamp,
            status: 'error',
          };
          return next;
        });
        return;
      }

      const data = await res.json();

      // Bir satırda hata olursa veya cevap model 'hazir_ipucu' ile dönerse (fallback: true) tutor_yaniti yerine "HATA" yaz
      if (data.fallback || data.model === 'hazir_ipucu') {
        setResults((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            cevap: 'HATA',
            model: data.model || 'hazir_ipucu',
            durationMs: elapsed,
            tarihSaat: timestamp,
            status: 'error',
          };
          return next;
        });
      } else {
        setResults((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            cevap: data.cevap,
            model: data.model || 'unknown',
            durationMs: elapsed,
            tarihSaat: timestamp,
            status: 'success',
          };
          return next;
        });
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setResults((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          cevap: 'HATA',
          model: 'error',
          durationMs: elapsed,
          tarihSaat: timestamp,
          status: 'error',
        };
        return next;
      });
    }
  };

  const handleRunAll = async () => {
    setIsRunning(true);
    setProgress(0);

    for (let i = 0; i < EVAL_INPUTS.length; i++) {
      if (i > 0) {
        // İstekler arasında 5 saniye bekle
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      await runSingleEval(i);
      setProgress(i + 1);
    }
    setIsRunning(false);
  };

  const handleDownloadCsv = () => {
    const headers = [
      'ID',
      'Sahne',
      'Rol',
      'Tür',
      'Seviye',
      'Hedef',
      'Öğrenci Girdisi',
      'Beklenen Değerlendirme',
      'Tutor Cevabı',
      'Kullanılan Model',
      'Süre (ms)',
      'Tarih-Saat',
      'Durum',
    ];

    const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = results.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.sahne),
      escapeCsv(r.rol),
      escapeCsv(r.tur),
      escapeCsv(r.seviye),
      escapeCsv(r.hedef),
      escapeCsv(r.ogrenci_girdisi),
      escapeCsv(r.beklenen),
      escapeCsv(r.cevap),
      escapeCsv(r.model),
      r.durationMs.toString(),
      escapeCsv(r.tarihSaat),
      escapeCsv(r.status),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tutor_eval_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 bg-[var(--kagit)] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-3 mb-4">
        <div>
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            SE PRIMER · TUTOR EVAL DEĞERLENDİRME MASASI
          </div>
          <h1 className="font-serif-heading text-[24px] font-semibold text-[var(--murekkep)]">
            20 Öğrenci Girdisi Test Seti
          </h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 border border-[var(--murekkep)] rounded-[4px] bg-[var(--fis)] font-mono-code text-[12px] hover:bg-[var(--kagit)] cursor-pointer"
        >
          ← Oyuna Dön
        </button>
      </div>

      {/* Description & Action buttons */}
      <div className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-[13px] text-[var(--soluk)] max-w-xl">
          Tutor modelinin kurallara uyumunu (doğru seçeneği söylememe, kanıtlara dayalı tek soru sorma, terim tanımı vb.) test eder. Test girdileri <code className="font-mono-code">eval_inputs.json</code> dosyasından alınır. İstekler arasında 5 saniye beklenir.
          {isMock && (
            <span className="block mt-1 text-[var(--pas)] font-mono-code font-bold">
              [Mock Modu Aktif: Yapay zekâ çağrılmaz, test yanıtları döner]
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="eval-calistir"
            onClick={handleRunAll}
            disabled={isRunning}
            className="px-4 py-2 bg-[var(--tukenmez)] text-white font-medium text-[13px] rounded-[4px] hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? `Çalışıyor (${progress}/${EVAL_INPUTS.length})...` : 'Eval Setini Çalıştır'}
          </button>

          <button
            type="button"
            data-testid="eval-csv"
            onClick={handleDownloadCsv}
            className="px-3 py-2 bg-[var(--fis)] border border-[var(--cizgi)] text-[var(--murekkep)] font-mono-code text-[12px] rounded-[4px] hover:bg-[var(--kagit)] cursor-pointer"
          >
            CSV İndir
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto border border-[var(--cizgi)] rounded-[4px] bg-[var(--fis)]">
        <table data-testid="eval-tablo" className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[var(--cizgi)] bg-[var(--kagit)] font-mono-code text-[11px] text-[var(--soluk)]">
              <th className="p-2 border-r border-[var(--cizgi)]">ID</th>
              <th className="p-2 border-r border-[var(--cizgi)]">Sahne / Rol</th>
              <th className="p-2 border-r border-[var(--cizgi)]">Tür</th>
              <th className="p-2 border-r border-[var(--cizgi)]">Öğrenci Girdisi</th>
              <th className="p-2 border-r border-[var(--cizgi)]">Beklenen Davranış</th>
              <th className="p-2 border-r border-[var(--cizgi)]">Tutor Cevabı</th>
              <th className="p-2 border-r border-[var(--cizgi)]">Model</th>
              <th className="p-2 border-r border-[var(--cizgi)]">Süre</th>
              <th className="p-2">Tarih-Saat</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--cizgi)] last:border-b-0 hover:bg-[var(--kagit)] transition-colors"
              >
                <td className="p-2 border-r border-[var(--cizgi)] font-mono-code font-bold">
                  {row.id}
                </td>
                <td className="p-2 border-r border-[var(--cizgi)] font-mono-code text-[11px]">
                  {row.sahne} · {row.rol}
                </td>
                <td className="p-2 border-r border-[var(--cizgi)] font-mono-code text-[11px] text-[var(--soluk)]">
                  {row.tur}
                </td>
                <td className="p-2 border-r border-[var(--cizgi)] font-medium text-[var(--murekkep)] max-w-xs">
                  "{row.ogrenci_girdisi}"
                </td>
                <td className="p-2 border-r border-[var(--cizgi)] text-[var(--soluk)] text-[12px] max-w-xs">
                  {row.beklenen}
                </td>
                <td className="p-2 border-r border-[var(--cizgi)] max-w-md">
                  {row.status === 'running' && (
                    <span className="font-mono-code text-[11px] text-[var(--tukenmez)] animate-pulse">
                      Çalışıyor...
                    </span>
                  )}
                  {row.status === 'idle' && (
                    <span className="font-mono-code text-[11px] text-[var(--soluk)]">
                      Bekliyor
                    </span>
                  )}
                  {row.status === 'error' && (
                    <span className="text-[var(--damga)] font-mono-code text-[12px] font-bold">
                      {row.cevap}
                    </span>
                  )}
                  {row.status === 'success' && (
                    <span className="text-[var(--murekkep)] leading-relaxed">
                      {row.cevap}
                    </span>
                  )}
                </td>
                <td className="p-2 border-r border-[var(--cizgi)] font-mono-code text-[11px] whitespace-nowrap">
                  {row.model}
                </td>
                <td className="p-2 border-r border-[var(--cizgi)] font-mono-code text-[11px] whitespace-nowrap">
                  {row.durationMs ? `${row.durationMs} ms` : '-'}
                </td>
                <td className="p-2 font-mono-code text-[11px] text-[var(--soluk)] whitespace-nowrap">
                  {row.tarihSaat || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
