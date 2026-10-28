import React, { useState, useEffect } from 'react';
import { Sahne, Eylem, Rol, Seviye, Hedef, Terim, Mesaj } from '../types/game.js';
import { SCENARIO, formatClock } from '../utils/engine.js';
import { Gauges } from '../components/Gauges.js';
import { RubberStamp } from '../components/RubberStamp.js';
import { Timer } from '../components/Timer.js';
import { HighlightedText } from '../components/HighlightedText.js';
import { ClueModal } from '../components/ClueModal.js';
import { TutorModal } from '../components/TutorModal.js';
import { TermModal } from '../components/TermModal.js';

interface Props {
  sahne: Sahne;
  rol: Rol;
  seviye: Seviye;
  hedef: Hedef;
  sureDk: number;
  etki: number;
  risk: number;
  koordinasyon: number;
  sayacAcik: boolean;
  oncekiKararlarMetinleri: string[];
  ekstraMesajlar?: Mesaj[];
  isMock: boolean;
  onSelectEylem: (eylem: Eylem) => void;
  onTimeout: () => void;
  onOpenTutorOfferDirectly?: boolean;
  onClearTutorOfferDirectly?: () => void;
}

export const SceneScreen: React.FC<Props> = ({
  sahne,
  rol,
  seviye,
  hedef,
  sureDk,
  etki,
  risk,
  koordinasyon,
  sayacAcik,
  oncekiKararlarMetinleri,
  ekstraMesajlar = [],
  isMock,
  onSelectEylem,
  onTimeout,
  onOpenTutorOfferDirectly = false,
  onClearTutorOfferDirectly,
}) => {
  const [anlatim, setAnlatim] = useState<string>(sahne.kayitli_anlatim);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>(sahne.mesajlar);
  const [isLoadingNarrator, setIsLoadingNarrator] = useState<boolean>(true);
  const [selectedTerm, setSelectedTerm] = useState<Terim | null>(null);
  const [isClueOpen, setIsClueOpen] = useState<boolean>(false);
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(onOpenTutorOfferDirectly);
  const [isActionProcessing, setIsActionProcessing] = useState<boolean>(false);
  const [tutorOfferMode, setTutorOfferMode] = useState<'karar_oncesi' | 'karar_sonrasi'>(
    onOpenTutorOfferDirectly ? 'karar_sonrasi' : 'karar_oncesi'
  );

  const clock = formatClock(sureDk);

  // Fetch AI narration on scene entry (unless mock)
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingNarrator(!isMock);

    async function loadNarrator() {
      if (isMock) {
        setAnlatim(sahne.kayitli_anlatim);
        setMesajlar(sahne.mesajlar);
        setIsLoadingNarrator(false);
        return;
      }

      try {
        const kanitlarForRole = sahne.kanitlar.map((k) => ({
          etiket: k.etiket,
          metin: rol === 'backend' ? k.metin_backend : k.metin_lider,
        }));

        const res = await fetch('/api/narrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            olay_ozeti: SCENARIO.ozet,
            sahne_id: sahne.id,
            sahne_basligi: sahne.baslik,
            rol: rol === 'backend' ? 'Backend geliştirici' : 'Takım lideri',
            seviye,
            hedef,
            saat: clock,
            kanitlar: kanitlarForRole,
            izinli_kisiler: SCENARIO.kisiler,
            mesaj_icerikleri: sahne.mesajlar,
            onceki_kararlar: oncekiKararlarMetinleri,
            gizli: sahne.yasak_kelimeler || [],
            kayitli_anlatim: sahne.kayitli_anlatim,
            kayitli_mesajlar: sahne.mesajlar,
            mock: isMock,
          }),
        });

        if (!res.ok) throw new Error('Narrator network error');
        const data = await res.json();
        if (!isCancelled) {
          setAnlatim(data.anlatim || sahne.kayitli_anlatim);
          setMesajlar(data.mesajlar && data.mesajlar.length > 0 ? data.mesajlar : sahne.mesajlar);
        }
      } catch (err) {
        console.warn('Failed to fetch narrator, using recorded:', err);
        if (!isCancelled) {
          setAnlatim(sahne.kayitli_anlatim);
          setMesajlar(sahne.mesajlar);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingNarrator(false);
        }
      }
    }

    loadNarrator();
    return () => {
      isCancelled = true;
    };
  }, [sahne.id, rol, seviye, hedef, isMock]);

  // Combine extra messages (e.g. from previous action ek_mesaj or timeout) with scene messages
  const combinedMessages: Mesaj[] = [...ekstraMesajlar, ...mesajlar].slice(0, 2);

  // Check if timer should be paused:
  // "Sayaç şu durumlarda durur: yapay zekâ anlatımı beklenirken, Ne oldu, tutor, terim veya ipucu paneli açıkken, sekme arka plandayken."
  const isTimerPaused =
    isLoadingNarrator || isClueOpen || isTutorOpen || Boolean(selectedTerm);

  const handleActionClick = (eylem: Eylem) => {
    if (isActionProcessing) return; // Prevent double click
    setIsActionProcessing(true);
    onSelectEylem(eylem);
  };

  const handleSendTutorMessage = async (msg: string) => {
    const kanitlarForRole = sahne.kanitlar.map((k) => ({
      etiket: k.etiket,
      metin: rol === 'backend' ? k.metin_backend : k.metin_lider,
    }));
    const secenekMetinleri = sahne.eylemler.map((e) =>
      rol === 'backend' ? e.metin_backend : e.metin_lider
    );

    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        olay_ozeti: SCENARIO.ozet,
        rol: rol === 'backend' ? 'Backend geliştirici' : 'Takım lideri',
        seviye,
        hedef,
        gorunen_kanitlar: kanitlarForRole,
        secenek_metinleri: secenekMetinleri,
        ogrenme_odagi: sahne.ogrenme_odagi,
        onceki_kararlar: oncekiKararlarMetinleri,
        mod: tutorOfferMode,
        son_mesajlar: combinedMessages,
        ogrenci_girdisi: msg,
        hazir_ipucu: sahne.hazir_ipucu,
        mock: isMock,
      }),
    });

    if (!res.ok) {
      throw new Error('Tutor network error');
    }
    const data = await res.json();
    return {
      answer: data.cevap,
      isFallback: Boolean(data.fallback),
      error: data.error,
    };
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 bg-[var(--kagit)] min-h-screen flex flex-col justify-between">
      <div>
        {/* Top Header Fiş */}
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-3">
          <div className="font-mono-code text-[11px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            OLAY KAYIT FİŞİ · No: 0428
          </div>
          <div className="flex items-center gap-2">
            <Timer
              isActive={sayacAcik && seviye === 'Deneyimliyim'}
              isPaused={isTimerPaused}
              onTimeout={onTimeout}
              resetKey={sahne.id}
            />
            <RubberStamp text={sahne.id} />
          </div>
        </div>

        {/* Sahne Başlığı ve Saat */}
        <div className="flex items-baseline justify-between mb-2">
          <h2
            data-testid="sahne-baslik"
            className="font-serif-heading text-[22px] font-semibold text-[var(--murekkep)]"
          >
            {sahne.baslik}
          </h2>
          <span
            data-testid="sahne-saat"
            className="font-mono-code text-[14px] font-semibold text-[var(--soluk)]"
          >
            {clock}
          </span>
        </div>

        {/* Göstergeler */}
        <Gauges
          sureDk={sureDk}
          etki={etki}
          risk={risk}
          koordinasyon={koordinasyon}
        />

        {/* Anlatım Kartı */}
        <div className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-code text-[11px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
              DURUM BİLDİRİMİ
            </span>
            <span className="font-mono-code text-[11px] text-[var(--soluk)]">
              {rol === 'backend' ? 'ROL: BACKEND' : 'ROL: LİDER'}
            </span>
          </div>

          {isLoadingNarrator ? (
            <div className="space-y-2 py-2">
              <span className="text-[13px] text-[var(--soluk)] font-mono-code block mb-1">
                Sahne hazırlanıyor...
              </span>
              <div className="h-4 bg-[var(--cizgi)]/40 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-[var(--cizgi)]/40 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-[var(--cizgi)]/40 rounded animate-pulse w-4/6"></div>
            </div>
          ) : (
            <div
              data-testid="anlatim"
              className="text-[15px] leading-relaxed text-[var(--murekkep)]"
            >
              <HighlightedText
                text={anlatim}
                onSelectTerm={(term) => setSelectedTerm(term)}
              />
            </div>
          )}
        </div>

        {/* Ekip Mesajları */}
        {combinedMessages.length > 0 && (
          <div className="space-y-2 my-3">
            {combinedMessages.map((msg, idx) => {
              const kisiAdi = SCENARIO.kisiler[msg.kisi] || msg.kisi;
              return (
                <div
                  key={idx}
                  data-testid={`mesaj-${idx}`}
                  className="bg-[var(--fis)] border border-[var(--cizgi)] border-l-[3px] border-l-[var(--soluk)] rounded-[4px] p-2.5 text-[14px]"
                >
                  <div className="font-mono-code text-[11px] text-[var(--soluk)] font-semibold mb-0.5">
                    {kisiAdi}
                  </div>
                  <div className="text-[var(--murekkep)] leading-snug">
                    <HighlightedText
                      text={msg.metin}
                      onSelectTerm={(term) => setSelectedTerm(term)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kanıtlar */}
        <div className="my-4">
          <div className="font-mono-code text-[11px] font-semibold text-[var(--soluk)] uppercase tracking-wider mb-2">
            İNCELENEN KANITLAR
          </div>
          <div className="space-y-2">
            {sahne.kanitlar.map((kanit) => {
              const kanitMetni = rol === 'backend' ? kanit.metin_backend : kanit.metin_lider;
              return (
                <div
                  key={kanit.id}
                  data-testid={`kanit-${kanit.id}`}
                  className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-3 flex items-start gap-2.5"
                >
                  <div className="shrink-0 pt-0.5">
                    <RubberStamp text={kanit.etiket} />
                  </div>
                  <div className="text-[14px] text-[var(--murekkep)] leading-relaxed flex-1">
                    <HighlightedText
                      text={kanitMetni}
                      onSelectTerm={(term) => setSelectedTerm(term)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eylemler / Karar Seçenekleri */}
        <div className="my-5">
          <div className="font-mono-code text-[11px] font-semibold text-[var(--soluk)] uppercase tracking-wider mb-2">
            BİR MÜDAHALE SEÇİN
          </div>
          <div className="space-y-2.5">
            {sahne.eylemler.map((eylem) => {
              const eylemMetni = rol === 'backend' ? eylem.metin_backend : eylem.metin_lider;
              return (
                <button
                  key={eylem.id}
                  type="button"
                  data-testid={`eylem-${eylem.id}`}
                  onClick={() => handleActionClick(eylem)}
                  disabled={isActionProcessing}
                  className="w-full text-left p-3.5 bg-[var(--fis)] border border-[var(--cizgi)] hover:border-[var(--tukenmez)] rounded-[4px] min-h-[48px] flex items-start gap-3 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--tukenmez)] disabled:opacity-50"
                >
                  <div className="w-5 h-5 rounded-[2px] border border-[var(--cizgi)] bg-white flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] text-[var(--tukenmez)] font-mono-code font-bold">
                      →
                    </span>
                  </div>
                  <div className="text-[15px] font-medium text-[var(--murekkep)] leading-snug flex-1">
                    <HighlightedText
                      text={eylemMetni}
                      onSelectTerm={(term) => setSelectedTerm(term)}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alt Araç Çubuğu: İpucu ve Tutora Sor */}
      <div className="mt-4 pt-3 border-t border-[var(--cizgi)] flex items-center justify-between gap-2">
        {seviye === 'Yeni başladım' ? (
          <button
            type="button"
            data-testid="dugme-ipucu"
            onClick={() => setIsClueOpen(true)}
            className="h-10 px-3 bg-[var(--fis)] border border-[var(--murekkep)] text-[var(--murekkep)] rounded-[4px] font-mono-code text-[12px] flex items-center gap-1.5 cursor-pointer hover:bg-[var(--kagit)]"
          >
            <span>[?]</span> İpucu
          </button>
        ) : (
          <div></div>
        )}

        <button
          type="button"
          data-testid="dugme-tutor"
          onClick={() => {
            setTutorOfferMode('karar_oncesi');
            setIsTutorOpen(true);
          }}
          className="h-10 px-3 bg-[var(--fis)] border border-[var(--tukenmez)] text-[var(--tukenmez)] font-mono-code text-[12px] font-medium rounded-[4px] flex items-center gap-1.5 cursor-pointer hover:bg-[var(--kagit)]"
        >
          <span>💬</span> Tutora Sor
        </button>
      </div>

      {/* Modals */}
      <TermModal
        term={selectedTerm}
        onClose={() => setSelectedTerm(null)}
      />

      <ClueModal
        clue={sahne.hazir_ipucu}
        isOpen={isClueOpen}
        onClose={() => setIsClueOpen(false)}
      />

      <TutorModal
        isOpen={isTutorOpen}
        onClose={() => {
          setIsTutorOpen(false);
          if (onClearTutorOfferDirectly) onClearTutorOfferDirectly();
        }}
        onSendMessage={handleSendTutorMessage}
        hazirIpucu={sahne.hazir_ipucu}
      />
    </div>
  );
};
