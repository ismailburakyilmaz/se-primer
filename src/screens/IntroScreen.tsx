import React, { useState } from 'react';
import { Seviye, Rol, Hedef } from '../types/game.js';
import { RubberStamp } from '../components/RubberStamp.js';

interface Props {
  onStart: (params: {
    seviye: Seviye;
    rol: Rol;
    hedef: Hedef;
    sayacAcik: boolean;
  }) => void;
  onOpenEval: () => void;
  seedParam?: string | null;
}

export const IntroScreen: React.FC<Props> = ({ onStart, onOpenEval, seedParam }) => {
  const [seviye, setSeviye] = useState<Seviye>('Yeni başladım');
  const [rolSecimi, setRolSecimi] = useState<'backend' | 'lider' | 'farketmez'>('backend');
  const [hedef, setHedef] = useState<Hedef>('Öğrenmek');
  const [sayacAcik, setSayacAcik] = useState<boolean>(false);
  const [versionClickCount, setVersionClickCount] = useState<number>(0);

  const handleHedefChange = (newHedef: Hedef) => {
    setHedef(newHedef);
    if (newHedef === 'Baskı altında karar') {
      setSayacAcik(true);
    }
  };

  const handleStart = () => {
    let resolvedRol: Rol;
    if (rolSecimi === 'farketmez') {
      if (seedParam) {
        // Deterministic pseudo-random seed
        let num = 0;
        for (let i = 0; i < seedParam.length; i++) {
          num = (num * 31 + seedParam.charCodeAt(i)) >>> 0;
        }
        resolvedRol = num % 2 === 0 ? 'backend' : 'lider';
      } else {
        resolvedRol = Math.random() < 0.5 ? 'backend' : 'lider';
      }
    } else {
      resolvedRol = rolSecimi;
    }

    onStart({
      seviye,
      rol: resolvedRol,
      hedef,
      sayacAcik,
    });
  };

  const handleVersionClick = () => {
    const nextCount = versionClickCount + 1;
    setVersionClickCount(nextCount);
    if (nextCount >= 5) {
      onOpenEval();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 bg-[var(--kagit)] min-h-screen flex flex-col justify-between">
      <div>
        {/* Fiş Başlığı per DESIGN.md §5 */}
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-4">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            OLAY KAYIT FİŞİ · No: 0428
          </div>
          <RubberStamp text="YENİ KAYIT" />
        </div>

        {/* Başlık */}
        <div className="mb-6">
          <h1 className="font-serif-heading text-[32px] font-semibold text-[var(--murekkep)] leading-tight mb-1">
            SE Primer
          </h1>
          <p className="text-[14px] text-[var(--soluk)]">
            Sabah Randevu Krizi · Suçlamasız Olay Müdahale Simülasyonu
          </p>
        </div>

        {/* 1. Soru: Seviye */}
        <div className="mb-5 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4">
          <span className="font-mono-code text-[11px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-2">
            1. SEVİYENİZİ SEÇİN
          </span>
          <div className="space-y-2">
            <button
              type="button"
              data-testid="secim-seviye-yeni"
              onClick={() => setSeviye('Yeni başladım')}
              className={`w-full text-left p-3 border rounded-[4px] min-h-[48px] flex items-center gap-3 cursor-pointer transition-colors ${
                seviye === 'Yeni başladım'
                  ? 'border-[var(--tukenmez)] bg-[var(--kagit)]'
                  : 'border-[var(--cizgi)] bg-[var(--fis)] hover:border-[var(--soluk)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  seviye === 'Yeni başladım'
                    ? 'border-[var(--tukenmez)] bg-[var(--tukenmez)] text-white'
                    : 'border-[var(--cizgi)] bg-white'
                }`}
              >
                {seviye === 'Yeni başladım' && <span className="text-[12px]">✓</span>}
              </div>
              <div>
                <span className="text-[15px] font-medium text-[var(--murekkep)] block">
                  Yeni başladım
                </span>
                <span className="text-[12px] text-[var(--soluk)]">
                  Sade anlatım, her kararda hazır ipucu düğmesi
                </span>
              </div>
            </button>

            <button
              type="button"
              data-testid="secim-seviye-deneyimli"
              onClick={() => setSeviye('Deneyimliyim')}
              className={`w-full text-left p-3 border rounded-[4px] min-h-[48px] flex items-center gap-3 cursor-pointer transition-colors ${
                seviye === 'Deneyimliyim'
                  ? 'border-[var(--tukenmez)] bg-[var(--kagit)]'
                  : 'border-[var(--cizgi)] bg-[var(--fis)] hover:border-[var(--soluk)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  seviye === 'Deneyimliyim'
                    ? 'border-[var(--tukenmez)] bg-[var(--tukenmez)] text-white'
                    : 'border-[var(--cizgi)] bg-white'
                }`}
              >
                {seviye === 'Deneyimliyim' && <span className="text-[12px]">✓</span>}
              </div>
              <div>
                <span className="text-[15px] font-medium text-[var(--murekkep)] block">
                  Deneyimliyim
                </span>
                <span className="text-[12px] text-[var(--soluk)]">
                  Teknik loglar, süre sayacı seçeneği, doğrudan sorumluluk
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Soru: Rol */}
        <div className="mb-5 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4">
          <span className="font-mono-code text-[11px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-2">
            2. KRİZDEKİ ROLÜNÜZ
          </span>
          <div className="space-y-2">
            <button
              type="button"
              data-testid="secim-rol-backend"
              onClick={() => setRolSecimi('backend')}
              className={`w-full text-left p-3 border rounded-[4px] min-h-[48px] flex items-center gap-3 cursor-pointer ${
                rolSecimi === 'backend'
                  ? 'border-[var(--tukenmez)] bg-[var(--kagit)]'
                  : 'border-[var(--cizgi)] bg-[var(--fis)] hover:border-[var(--soluk)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  rolSecimi === 'backend'
                    ? 'border-[var(--tukenmez)] bg-[var(--tukenmez)] text-white'
                    : 'border-[var(--cizgi)] bg-white'
                }`}
              >
                {rolSecimi === 'backend' && <span className="text-[12px]">✓</span>}
              </div>
              <div>
                <span className="text-[15px] font-medium text-[var(--murekkep)] block">
                  Backend geliştirici
                </span>
                <span className="text-[12px] text-[var(--soluk)]">
                  Ham loglar, şema değişiklikleri ve teknik müdahaleler
                </span>
              </div>
            </button>

            <button
              type="button"
              data-testid="secim-rol-lider"
              onClick={() => setRolSecimi('lider')}
              className={`w-full text-left p-3 border rounded-[4px] min-h-[48px] flex items-center gap-3 cursor-pointer ${
                rolSecimi === 'lider'
                  ? 'border-[var(--tukenmez)] bg-[var(--kagit)]'
                  : 'border-[var(--cizgi)] bg-[var(--fis)] hover:border-[var(--soluk)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  rolSecimi === 'lider'
                    ? 'border-[var(--tukenmez)] bg-[var(--tukenmez)] text-white'
                    : 'border-[var(--cizgi)] bg-white'
                }`}
              >
                {rolSecimi === 'lider' && <span className="text-[12px]">✓</span>}
              </div>
              <div>
                <span className="text-[15px] font-medium text-[var(--murekkep)] block">
                  Takım lideri
                </span>
                <span className="text-[12px] text-[var(--soluk)]">
                  Ekip koordinasyonu, paydaş yönetimi ve stratejik kararlar
                </span>
              </div>
            </button>

            <button
              type="button"
              data-testid="secim-rol-farketmez"
              onClick={() => setRolSecimi('farketmez')}
              className={`w-full text-left p-3 border rounded-[4px] min-h-[48px] flex items-center gap-3 cursor-pointer ${
                rolSecimi === 'farketmez'
                  ? 'border-[var(--tukenmez)] bg-[var(--kagit)]'
                  : 'border-[var(--cizgi)] bg-[var(--fis)] hover:border-[var(--soluk)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  rolSecimi === 'farketmez'
                    ? 'border-[var(--tukenmez)] bg-[var(--tukenmez)] text-white'
                    : 'border-[var(--cizgi)] bg-white'
                }`}
              >
                {rolSecimi === 'farketmez' && <span className="text-[12px]">✓</span>}
              </div>
              <div>
                <span className="text-[15px] font-medium text-[var(--murekkep)] block">
                  Rol fark etmez
                </span>
                <span className="text-[12px] text-[var(--soluk)]">
                  İki rolden biri rastgele atanır
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Soru: Hedef */}
        <div className="mb-5 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4">
          <span className="font-mono-code text-[11px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-2">
            3. HEDEFİNİZ
          </span>
          <div className="space-y-2">
            <button
              type="button"
              data-testid="secim-hedef-ogrenmek"
              onClick={() => handleHedefChange('Öğrenmek')}
              className={`w-full text-left p-3 border rounded-[4px] min-h-[48px] flex items-center gap-3 cursor-pointer ${
                hedef === 'Öğrenmek'
                  ? 'border-[var(--tukenmez)] bg-[var(--kagit)]'
                  : 'border-[var(--cizgi)] bg-[var(--fis)] hover:border-[var(--soluk)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  hedef === 'Öğrenmek'
                    ? 'border-[var(--tukenmez)] bg-[var(--tukenmez)] text-white'
                    : 'border-[var(--cizgi)] bg-white'
                }`}
              >
                {hedef === 'Öğrenmek' && <span className="text-[12px]">✓</span>}
              </div>
              <div>
                <span className="text-[15px] font-medium text-[var(--murekkep)] block">
                  Öğrenmek
                </span>
                <span className="text-[12px] text-[var(--soluk)]">
                  Her karardan sonra detaylı teknik açıklama
                </span>
              </div>
            </button>

            <button
              type="button"
              data-testid="secim-hedef-mulakat"
              onClick={() => handleHedefChange('Mülakat pratiği')}
              className={`w-full text-left p-3 border rounded-[4px] min-h-[48px] flex items-center gap-3 cursor-pointer ${
                hedef === 'Mülakat pratiği'
                  ? 'border-[var(--tukenmez)] bg-[var(--kagit)]'
                  : 'border-[var(--cizgi)] bg-[var(--fis)] hover:border-[var(--soluk)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  hedef === 'Mülakat pratiği'
                    ? 'border-[var(--tukenmez)] bg-[var(--tukenmez)] text-white'
                    : 'border-[var(--cizgi)] bg-white'
                }`}
              >
                {hedef === 'Mülakat pratiği' && <span className="text-[12px]">✓</span>}
              </div>
              <div>
                <span className="text-[15px] font-medium text-[var(--murekkep)] block">
                  Mülakat pratiği
                </span>
                <span className="text-[12px] text-[var(--soluk)]">
                  Tutor gerekçelendirme üzerinden sorar, raporda varsayımların incelenir
                </span>
              </div>
            </button>

            <button
              type="button"
              data-testid="secim-hedef-baski"
              onClick={() => handleHedefChange('Baskı altında karar')}
              className={`w-full text-left p-3 border rounded-[4px] min-h-[48px] flex items-center gap-3 cursor-pointer ${
                hedef === 'Baskı altında karar'
                  ? 'border-[var(--tukenmez)] bg-[var(--kagit)]'
                  : 'border-[var(--cizgi)] bg-[var(--fis)] hover:border-[var(--soluk)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  hedef === 'Baskı altında karar'
                    ? 'border-[var(--tukenmez)] bg-[var(--tukenmez)] text-white'
                    : 'border-[var(--cizgi)] bg-white'
                }`}
              >
                {hedef === 'Baskı altında karar' && <span className="text-[12px]">✓</span>}
              </div>
              <div>
                <span className="text-[15px] font-medium text-[var(--murekkep)] block">
                  Baskı altında karar
                </span>
                <span className="text-[12px] text-[var(--soluk)]">
                  Kısa anlatımlar, 60 saniyelik sayaç aktif gelir
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Sayaç Anahtarı */}
        <div className="mb-6 flex items-center justify-between p-3 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px]">
          <div>
            <span className="text-[14px] font-medium text-[var(--murekkep)] block">
              60 Saniyelik Karar Sayacı
            </span>
            <span className="text-[12px] text-[var(--soluk)]">
              {seviye === 'Deneyimliyim'
                ? 'Süre bitince +15 dk ceza ve gecikme işlenir'
                : 'Yalnızca "Deneyimliyim" seviyesinde çalışır'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              data-testid="anahtar-sayac"
              checked={sayacAcik}
              onChange={(e) => setSayacAcik(e.target.checked)}
              disabled={seviye !== 'Deneyimliyim'}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--cizgi)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--tukenmez)]"></div>
          </label>
        </div>

        {/* Başla Düğmesi */}
        <button
          type="button"
          data-testid="dugme-basla"
          onClick={handleStart}
          className="w-full h-12 bg-[var(--tukenmez)] hover:opacity-95 text-white font-medium rounded-[4px] cursor-pointer text-[16px] tracking-wide"
        >
          Olay Defterini Aç
        </button>
      </div>

      {/* Sürüm yazısı */}
      <div className="mt-8 pt-4 border-t border-[var(--cizgi)] flex justify-between items-center text-[11px] text-[var(--soluk)] font-mono-code">
        <span>SE Primer · Şifa Hastanesi Olayı</span>
        <button
          type="button"
          data-testid="surum-yazisi"
          onClick={handleVersionClick}
          className="cursor-pointer hover:text-[var(--murekkep)] underline"
          title="Tutor test / eval modu için 5 kez tıkla"
        >
          v1.0
        </button>
      </div>
    </div>
  );
};
