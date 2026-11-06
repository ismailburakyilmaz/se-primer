import React, { useState } from 'react';
import { Seviye, Rol, Hedef } from '../types/game.js';
import { RubberStamp } from '../components/RubberStamp.js';

interface Props {
  onStart: (params: {
    seviye: Seviye;
    rol: Rol;
    hedef: Hedef;
    sayacAcik: boolean;
    isVeriMode?: boolean;
  }) => void;
  onOpenEval: () => void;
  isVeriMode?: boolean;
}

export const IntroScreen: React.FC<Props> = ({ onStart, onOpenEval, isVeriMode = false }) => {
  const [seviye, setSeviye] = useState<Seviye>('Yeni başladım');
  const [rolSecimi, setRolSecimi] = useState<'backend' | 'lider'>('backend');
  const [hedef, setHedef] = useState<Hedef>('Öğrenmek');
  const [sayacAcik, setSayacAcik] = useState<boolean>(false);
  const [veriKatil, setVeriKatil] = useState<boolean>(Boolean(isVeriMode));
  const [veriKabul, setVeriKabul] = useState<boolean>(false);
  const [versionClickCount, setVersionClickCount] = useState<number>(0);
  const [isNasilOynanirOpen, setIsNasilOynanirOpen] = useState<boolean>(false);
  const [hasHafiza, setHasHafiza] = useState<boolean>(() => {
    if (isVeriMode) return false;
    try {
      return Boolean(localStorage.getItem('seprimer_hafiza'));
    } catch (e) {
      return false;
    }
  });

  const handleClearHafiza = () => {
    try {
      localStorage.removeItem('seprimer_hafiza');
    } catch (e) {}
    setHasHafiza(false);
  };

  const handleSeviyeChange = (newSeviye: Seviye) => {
    setSeviye(newSeviye);
    if (newSeviye === 'Deneyimliyim') {
      setSayacAcik(true);
    } else {
      setSayacAcik(false);
    }
  };

  const handleHedefChange = (newHedef: Hedef) => {
    setHedef(newHedef);
    if (newHedef === 'Baskı altında karar' && seviye === 'Deneyimliyim') {
      setSayacAcik(true);
    }
  };

  const handleStart = () => {
    if (veriKatil && !veriKabul) return;

    onStart({
      seviye,
      rol: rolSecimi,
      hedef,
      sayacAcik,
      isVeriMode: Boolean(isVeriMode || (veriKatil && veriKabul)),
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
        <div className="mb-4">
          <h1 className="font-serif-heading text-[32px] font-semibold text-[var(--murekkep)] leading-tight mb-1">
            SE Primer
          </h1>
          <p className="text-[14px] text-[var(--soluk)]">
            Sabah Randevu Krizi · Suçlamasız Olay Müdahale Simülasyonu
          </p>
        </div>

        {/* Nasıl Oynanır? Açılır-Kapanır Bölüm */}
        <div className="mb-5 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-3">
          <button
            type="button"
            onClick={() => setIsNasilOynanirOpen(!isNasilOynanirOpen)}
            className="w-full flex items-center justify-between text-left font-mono-code text-[12px] font-semibold text-[var(--tukenmez)] hover:underline cursor-pointer"
          >
            <span>Nasıl oynanır?</span>
            <span className="text-[12px]">{isNasilOynanirOpen ? '▲ Kapat' : '▼ Aç'}</span>
          </button>
          {isNasilOynanirOpen && (
            <div data-testid="nasil-oynanir" className="mt-3 pt-2.5 border-t border-[var(--cizgi)] space-y-2 text-[13px] text-[var(--murekkep)]">
              <div className="flex items-start gap-2">
                <span className="font-mono-code text-[12px] text-[var(--soluk)] font-bold">1.</span>
                <span>Kanıtları oku: <strong>DOĞRULANDI</strong> kesin, <strong>BELİRTİ</strong> ipucudur.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono-code text-[12px] text-[var(--soluk)] font-bold">2.</span>
                <span>Bir müdahale seç; her kararın ne olduğunu ve neden olduğunu göreceksin.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono-code text-[12px] text-[var(--soluk)] font-bold">3.</span>
                <span>Takılırsan tutora sor: cevabı söylemez, düşünmene yardım eder.</span>
              </div>
            </div>
          )}
        </div>

        {/* 1. Soru: Seviye */}
        <div className="mb-5 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4">
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-2">
            1. SEVİYENİZİ SEÇİN
          </span>
          <div className="space-y-2">
            <button
              type="button"
              data-testid="secim-seviye-yeni"
              onClick={() => handleSeviyeChange('Yeni başladım')}
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
              onClick={() => handleSeviyeChange('Deneyimliyim')}
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
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-2">
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
          </div>
        </div>

        {/* 3. Soru: Hedef */}
        <div className="mb-5 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4">
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-2">
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

        {/* Veri Toplama Katılımı & Notu */}
        <div className="mb-5">
          <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--murekkep)] select-none">
            <input
              type="checkbox"
              data-testid="veri-katil"
              checked={veriKatil}
              onChange={(e) => {
                const checked = e.target.checked;
                setVeriKatil(checked);
                if (!checked) {
                  setVeriKabul(false);
                }
              }}
              className="w-4 h-4 text-[var(--tukenmez)] border-[var(--cizgi)] rounded-[2px]"
            />
            <span className="font-medium">Veri toplamaya katıl</span>
          </label>

          {veriKatil && (
            <div className="mt-3 p-3.5 bg-[var(--fis)] border border-dashed border-[var(--cizgi)] rounded-[4px]">
              <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase tracking-wider block mb-1">
                VERİ TOPLAMA MODU
              </span>
              <p className="text-[13px] text-[var(--murekkep)] mb-2.5 leading-relaxed">
                Kararların ve süreler kaydedilir; ad, e-posta, cihaz veya konum kaydedilmez. Veriyi oyun sonunda sen indirip göndereceksin.
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--murekkep)] select-none">
                <input
                  type="checkbox"
                  data-testid="veri-onay"
                  checked={veriKabul}
                  onChange={(e) => setVeriKabul(e.target.checked)}
                  className="w-4 h-4 text-[var(--tukenmez)] border-[var(--cizgi)] rounded-[2px]"
                />
                <span>Kabul ediyorum</span>
              </label>
            </div>
          )}
        </div>

        {/* Ekibin Hafızasını Sil Düğmesi (spec §15.2, Prompt 3 madde 10) */}
        {hasHafiza && !isVeriMode && !veriKatil && (
          <div className="mb-3 text-center">
            <button
              type="button"
              data-testid="dugme-hafiza-sil"
              onClick={handleClearHafiza}
              className="text-[12px] font-mono-code text-[var(--soluk)] hover:text-[var(--damga)] underline cursor-pointer"
            >
              Ekibin hafızasını sil
            </button>
          </div>
        )}

        {/* Başla Düğmesi */}
        <button
          type="button"
          data-testid="dugme-basla"
          onClick={handleStart}
          disabled={veriKatil && !veriKabul}
          className={`w-full h-12 font-medium rounded-[4px] text-[16px] tracking-wide transition-opacity ${
            veriKatil && !veriKabul
              ? 'bg-[var(--cizgi)] text-[var(--soluk)] cursor-not-allowed'
              : 'bg-[var(--tukenmez)] hover:opacity-95 text-white cursor-pointer'
          }`}
        >
          Olay Defterini Aç
        </button>
      </div>

      {/* Sürüm yazısı */}
      <div className="mt-8 pt-4 border-t border-[var(--cizgi)] flex justify-between items-center text-[12px] text-[var(--soluk)] font-mono-code">
        <span>SE Primer · Şifa Hastanesi Olayı</span>
        <button
          type="button"
          data-testid="surum-yazisi"
          onClick={handleVersionClick}
          className="cursor-pointer hover:text-[var(--murekkep)] underline"
          title="Tutor test / eval modu için 5 kez tıkla"
        >
          v2.0
        </button>
      </div>
    </div>
  );
};

