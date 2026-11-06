import React, { useState, useEffect, useMemo } from 'react';
import { Sahne, Eylem, Rol, Seviye, Hedef, Terim, Mesaj, LogSatiri } from '../types/game.js';
import { SCENARIO, formatClock } from '../utils/engine.js';
import { Gauges } from '../components/Gauges.js';
import { RubberStamp } from '../components/RubberStamp.js';
import { Timer } from '../components/Timer.js';
import { HighlightedText } from '../components/HighlightedText.js';
import { ClueModal } from '../components/ClueModal.js';
import { TutorModal } from '../components/TutorModal.js';
import { TermModal } from '../components/TermModal.js';
import { Portre } from '../components/Portre.js';
import { CharacterCardModal } from '../components/CharacterCardModal.js';
import { LogConsoleModal } from '../components/LogConsoleModal.js';
import { SistemHaritasi } from '../components/SistemHaritasi.js';
import { triggerStamp } from '../utils/stampNotification.js';
import { shuffleActions } from '../utils/shuffle.js';

interface Props {
  sahne: Sahne;
  rol: Rol;
  seviye: Seviye;
  hedef: Hedef;
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
  sayacAcik: boolean;
  oncekiKararlarMetinleri: string[];
  ekstraMesajlar?: Mesaj[];
  sogukMesaj?: Mesaj | null;
  allAccumulatedLogs: LogSatiri[];
  markedLogs: LogSatiri[];
  onMarkLog: (log: LogSatiri) => void;
  isMock: boolean;
  oturumId?: string;
  isWhatHappenedOpen?: boolean;
  lastChosenEylem?: Eylem | null;
  gaugeHighlights?: {
    sure?: boolean;
    etki?: boolean;
    risk?: boolean;
    koordinasyon?: boolean;
  };
  lastEvaluatedActionInfo?: {
    secilen_eylem_metni: string;
    ne_oldu: string;
    neden_oldu: string;
  } | null;
  ziyaret: number;
  denenenEylemler?: string[];
  denemeSayisi?: number;
  yonetmenModu?: 'olagan' | 'destek' | 'baski';
  onSelectEylem: (
    eylem: Eylem,
    stats: { kararSuresiSn: number; konsolArama: number; bulunanAnlamli: number }
  ) => void;
  onTimeout: (
    stats: { kararSuresiSn: number; konsolArama: number; bulunanAnlamli: number }
  ) => void;
  onExitGame: () => void;
  onTermOpened?: () => void;
  onTutorMessageSent?: (isIsrar: boolean) => void;
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
  previousGauges,
  sayacAcik,
  oncekiKararlarMetinleri,
  ekstraMesajlar = [],
  sogukMesaj = null,
  allAccumulatedLogs = [],
  markedLogs = [],
  onMarkLog,
  isMock,
  oturumId = '',
  isWhatHappenedOpen = false,
  lastChosenEylem = null,
  gaugeHighlights = {},
  lastEvaluatedActionInfo = null,
  ziyaret,
  denenenEylemler = [],
  denemeSayisi = 1,
  yonetmenModu = 'olagan',
  onSelectEylem,
  onTimeout,
  onExitGame,
  onTermOpened,
  onTutorMessageSent,
  onOpenTutorOfferDirectly = false,
  onClearTutorOfferDirectly,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<Terim | null>(null);
  const [isClueOpen, setIsClueOpen] = useState<boolean>(false);
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(onOpenTutorOfferDirectly);
  const [isLogConsoleOpen, setIsLogConsoleOpen] = useState<boolean>(false);
  const [logConsoleInitialQuery, setLogConsoleInitialQuery] = useState<string>('');
  const [openedCardKisiId, setOpenedCardKisiId] = useState<string | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState<boolean>(false);
  const [secilenEylemId, setSecilenEylemId] = useState<string | null>(null);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState<boolean>(false);
  const [tutorOfferMode, setTutorOfferMode] = useState<'karar_oncesi' | 'karar_sonrasi'>(
    onOpenTutorOfferDirectly ? 'karar_sonrasi' : 'karar_oncesi'
  );

  // Eylemlerin sırası oturum kimliği tohumuyla karışık gösterilir (?mock=1 iken karıştırılmaz)
  const displayedActions = useMemo(() => {
    return shuffleActions(sahne.eylemler, oturumId, sahne.id, Boolean(isMock));
  }, [sahne.eylemler, sahne.id, oturumId, isMock]);

  // Decision timing & stats for trace (spec §13.2 / Requirement F.5)
  const [activeTimeMs, setActiveTimeMs] = useState<number>(0);
  const [sceneSearchQueries, setSceneSearchQueries] = useState<Set<string>>(new Set());
  const [sceneBulunanAnlamli, setSceneBulunanAnlamli] = useState<number>(0);

  const handleSearchExpression = (expression: string) => {
    setLogConsoleInitialQuery(expression);
    setIsLogConsoleOpen(true);
    const normalized = expression
      .toLocaleLowerCase('tr-TR')
      .replace(/i̇/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .trim();
    if (normalized.length >= 2) {
      setSceneSearchQueries((prev) => new Set(prev).add(normalized));
    }
  };

  const clock = formatClock(sureDk);
  const decisionNumber = oncekiKararlarMetinleri.length + 1;

  // Anlatım: canlı anlatıcı kaldırıldı (spec §2, §6.1, Requirement A.1)
  const anlatim =
    hedef === 'Baskı altında karar' && sahne.kayitli_anlatim_kisa
      ? sahne.kayitli_anlatim_kisa
      : sahne.kayitli_anlatim;

  // Scroll to top on scene change (C4) and reset local scene stats
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setActiveTimeMs(0);
    setSceneSearchQueries(new Set());
    setSceneBulunanAnlamli(0);
    triggerStamp({
      text: sahne.id,
      description: `${sahne.id} · ${sahne.baslik}`,
    });
  }, [sahne.id, ziyaret]);

  // Trap back button (B3)
  useEffect(() => {
    window.history.pushState({ scene: sahne.id }, '');
    const handlePopState = () => {
      window.history.pushState({ scene: sahne.id }, '');
      setIsExitConfirmOpen(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [sahne.id]);

  // Messages: cold message (if team trust dropped) -> extra messages -> scene messages
  // Olay Yönetmeni mesajı en üstte (spec §13.5)
  const yonetmenMesaji: Mesaj | null =
    yonetmenModu !== 'olagan' && (sahne as any).yonetmen?.[yonetmenModu]
      ? {
          kisi: (sahne as any).yonetmen[yonetmenModu].kisi,
          metin: (sahne as any).yonetmen[yonetmenModu].metin,
        }
      : null;

  // Yönetmen damgası: sahne ziyareti başında bir kez basılır
  useEffect(() => {
    if (yonetmenModu === 'olagan') return;
    triggerStamp({
      text: yonetmenModu === 'destek' ? 'YÖNETMEN · DESTEK' : 'YÖNETMEN · BASKI',
      type: yonetmenModu === 'destek' ? 'BULUNDU' : 'BASKI',
      description:
        yonetmenModu === 'destek'
          ? 'Olay Yönetmeni devrede: ekip sana bir kanıt gösteriyor'
          : 'Olay Yönetmeni devrede: baskı arttı',
      isYonetmen: true,
    });
  }, [yonetmenModu]);

  // Yönetmen mesajından önce kısa "yazıyor…" (yalnızca Yönetmen mesajı; veri toplamadaki davranışı değiştirmez)
  const [yonetmenYaziyor, setYonetmenYaziyor] = useState<boolean>(false);
  useEffect(() => {
    if (yonetmenModu === 'olagan') return;
    const azHareket = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (azHareket) return;
    setYonetmenYaziyor(true);
    const t = setTimeout(() => setYonetmenYaziyor(false), 900);
    return () => clearTimeout(t);
  }, [yonetmenModu]);

  const messagePool: Mesaj[] = [
    ...(yonetmenMesaji ? [yonetmenMesaji] : []),
    ...(sogukMesaj ? [sogukMesaj] : []),
    ...ekstraMesajlar,
    ...sahne.mesajlar,
  ];
  const combinedMessages: Mesaj[] = messagePool.slice(0, 2);

  // Sayaç duraklatma kontrolleri (açık panellerde durur)
  const isTimerPaused =
    isClueOpen ||
    isTutorOpen ||
    isLogConsoleOpen ||
    Boolean(selectedTerm) ||
    Boolean(openedCardKisiId) ||
    isWhatHappenedOpen ||
    isExitConfirmOpen;

  // Measure decision duration (excluding paused intervals)
  useEffect(() => {
    if (isTimerPaused || isActionProcessing) return;
    const interval = setInterval(() => {
      setActiveTimeMs((prev) => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isTimerPaused, isActionProcessing]);

  const handleActionClick = (eylem: Eylem) => {
    if (isActionProcessing) return; // Prevent double click
    setIsActionProcessing(true);
    setSecilenEylemId(eylem.id);
    // Karar süresi tıklama anında ölçülür; tik animasyonu ölçüme girmez
    const kararSuresiSn = Number((activeTimeMs / 1000).toFixed(1));
    const istatistik = {
      kararSuresiSn,
      konsolArama: sceneSearchQueries.size,
      bulunanAnlamli: sceneBulunanAnlamli,
    };
    const azHareket =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Kutucuğa mürekkeple tik atılır, sonra "Ne oldu" açılır
    setTimeout(() => onSelectEylem(eylem, istatistik), azHareket ? 0 : 240);
  };

  const handleTimeoutTriggered = () => {
    onTimeout({
      kararSuresiSn: 60,
      konsolArama: sceneSearchQueries.size,
      bulunanAnlamli: sceneBulunanAnlamli,
    });
  };

  const handleMarkLogItem = (log: LogSatiri) => {
    onMarkLog(log);
    if (!log.gurultu) {
      setSceneBulunanAnlamli((prev) => prev + 1);
    }
    triggerStamp({
      text: 'BULUNDU',
      type: 'BULUNDU',
      description: 'Kanıt panosuna eklendi',
    });
  };

  const handleOpenTermModal = (term: Terim) => {
    setSelectedTerm(term);
    if (onTermOpened) {
      onTermOpened();
    }
  };

  const handleSendTutorMessage = async (
    msg: string,
    isAfterIsrar: boolean,
    resetHistory: boolean
  ) => {
    const kanitlarForRole = sahne.kanitlar.map((k) => ({
      etiket: k.etiket,
      metin: rol === 'backend' ? k.metin_backend : k.metin_lider,
    }));
    const secenekMetinleri = sahne.eylemler.map((e) =>
      rol === 'backend' ? e.metin_backend : e.metin_lider
    );
    const oyuncununBulduguLoglar = markedLogs.map((l) =>
      rol === 'backend' ? l.metin_backend : l.metin_lider
    );

    const bodyPayload: any = {
      olay_ozeti: SCENARIO.ozet,
      rol: rol === 'backend' ? 'Backend geliştirici' : 'Takım lideri',
      seviye,
      hedef,
      gorunen_kanitlar: kanitlarForRole,
      oyuncunun_buldugu_loglar: oyuncununBulduguLoglar,
      secenek_metinleri: secenekMetinleri,
      ogrenme_odagi: sahne.ogrenme_odagi,
      onceki_kararlar: oncekiKararlarMetinleri,
      mod: tutorOfferMode,
      son_mesajlar: resetHistory ? [] : combinedMessages,
      ogrenci_girdisi: msg,
      hazir_ipucu: sahne.hazir_ipucu,
      is_after_israr: isAfterIsrar,
      mock: isMock,
    };

    if (tutorOfferMode === 'karar_sonrasi' && lastEvaluatedActionInfo) {
      bodyPayload.secilen_eylem_metni = lastEvaluatedActionInfo.secilen_eylem_metni;
      bodyPayload.ne_oldu = lastEvaluatedActionInfo.ne_oldu;
      bodyPayload.neden_oldu = lastEvaluatedActionInfo.neden_oldu;
    }

    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
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
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 bg-[var(--kagit)] min-h-screen flex flex-col justify-between animate-scene-enter">
      <div>
        {/* Top Header Fiş: Karar N (Requirement A.3) */}
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-3">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
            <span>OLAY KAYIT FİŞİ · No: 0428 · Karar {decisionNumber}</span>
            {hedef === 'Baskı altında karar' && (
              <RubberStamp text="BASKI" type="BASKI" className="text-[12px] py-0 px-1 ml-1" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Timer
              isActive={
                yonetmenModu === 'destek'
                  ? false
                  : yonetmenModu === 'baski'
                  ? true
                  : sayacAcik && seviye === 'Deneyimliyim'
              }
              sureSn={yonetmenModu === 'baski' ? 45 : 60}
              isPaused={isTimerPaused}
              onTimeout={handleTimeoutTriggered}
              resetKey={`${sahne.id}-${ziyaret}`}
            />
            <RubberStamp text={sahne.id} bas={true} className="animate-stamp-press" />
            <button
              type="button"
              data-testid="dugme-cikis"
              onClick={() => setIsExitConfirmOpen(true)}
              className="text-[12px] font-mono-code text-[var(--soluk)] hover:text-[var(--murekkep)] whitespace-nowrap shrink-0 px-2 py-1 border border-[var(--cizgi)] rounded-[2px] bg-[var(--fis)] cursor-pointer"
              title="Olaydan çık"
            >
              Olaydan çık
            </button>
          </div>
        </div>

        {/* Canlı Sistem Haritası (spec §15.7, DESIGN.md §9) */}
        <SistemHaritasi
          harita={sahne.harita}
          highlightPart={isWhatHappenedOpen ? lastChosenEylem?.harita_dokunus : null}
        />

        {/* Olaydan Çık Onay Satırı */}
        {isExitConfirmOpen && (
          <div className="mb-3 p-2.5 bg-[var(--fis)] border border-[var(--damga)] rounded-[4px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[13px] text-[var(--murekkep)]">
            <span className="text-[var(--damga)] font-medium">
              Olay kaydı kapanacak, ilerleme kaybolacak.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="dugme-cikis-onay"
                onClick={onExitGame}
                className="px-2.5 py-1 bg-[var(--damga)] text-white text-[12px] font-mono-code rounded-[2px] hover:opacity-90 cursor-pointer"
              >
                Girişe dön
              </button>
              <button
                type="button"
                onClick={() => setIsExitConfirmOpen(false)}
                className="px-2.5 py-1 bg-[var(--kagit)] border border-[var(--cizgi)] text-[var(--murekkep)] text-[12px] font-mono-code rounded-[2px] hover:bg-[var(--fis)] cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

        {/* Sahne Başlığı ve Saat */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2
              data-testid="sahne-baslik"
              className="font-serif-heading text-[22px] font-semibold text-[var(--murekkep)]"
            >
              {sahne.baslik}
            </h2>
            <span data-testid="yonetmen-mod" data-mod={yonetmenModu} className="hidden" />
            {denemeSayisi >= 2 && (
              <span
                data-testid="sahne-deneme"
                className="font-mono-code text-[12px] font-semibold text-[var(--pas)]"
              >
                {denemeSayisi}. DENEME · {clock}
              </span>
            )}
          </div>
          <span
            data-testid="sahne-saat"
            className="font-mono-code text-[14px] font-semibold text-[var(--soluk)]"
          >
            {clock}
          </span>
        </div>

        {yonetmenModu !== 'olagan' && (
          <div className="mb-2 -mt-1">
            <RubberStamp
              text={yonetmenModu === 'destek' ? 'YÖNETMEN · DESTEK' : 'YÖNETMEN · BASKI'}
              type={yonetmenModu === 'destek' ? 'BULUNDU' : 'BASKI'}
              bas={true}
              className="text-[12px]"
            />
          </div>
        )}

        {/* Göstergeler */}
        <Gauges
          sureDk={sureDk}
          etki={etki}
          risk={risk}
          koordinasyon={koordinasyon}
          previousGauges={previousGauges}
        />

        {/* Anlatım Kartı */}
        <div className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
              DURUM BİLDİRİMİ
            </span>
            <span className="font-mono-code text-[12px] text-[var(--soluk)]">
              {rol === 'backend' ? 'ROL: BACKEND' : 'ROL: LİDER'}
            </span>
          </div>

          <div
            data-testid="anlatim"
            className="text-[15px] leading-relaxed text-[var(--murekkep)]"
          >
            <HighlightedText
              text={anlatim}
              onSelectTerm={handleOpenTermModal}
              onSearchExpression={handleSearchExpression}
            />
          </div>
        </div>

        {/* Ekip Mesajları with 1-bit dotted portraits (Requirement C.10) */}
        {combinedMessages.length > 0 && (
          <div className="space-y-2 my-3">
            {combinedMessages.map((msg, idx) => {
              const karakter = (SCENARIO as any).karakterler?.[msg.kisi] || {
                ad: (SCENARIO as any).kisiler?.[msg.kisi] || msg.kisi,
                gorev: 'EKİP ÜYESİ',
              };

              return (
                <div
                  key={idx}
                  data-testid={`mesaj-${idx}`}
                  className="bg-[var(--fis)] border border-[var(--cizgi)] border-l-[3px] border-l-[var(--soluk)] rounded-[4px] p-2.5 text-[14px]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Portre
                      kisiId={msg.kisi}
                      boy={48}
                      onClick={() => setOpenedCardKisiId(msg.kisi)}
                      title={`${karakter.ad} (${karakter.gorev})`}
                    />
                    <div className="min-w-0">
                      <div className="font-mono-code text-[13px] text-[var(--murekkep)] font-semibold leading-tight">
                        {karakter.ad}
                      </div>
                      {karakter.gorev && (
                        <div className="font-mono-code text-[12px] text-[var(--soluk)] uppercase tracking-wider leading-tight mt-1">
                          {karakter.gorev}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[var(--murekkep)] leading-snug">
                    {idx === 0 && yonetmenMesaji && yonetmenYaziyor ? (
                      <span className="yaziyor font-mono-code text-[13px] text-[var(--soluk)]" aria-label="yazıyor">
                        yazıyor<span>.</span><span>.</span><span>.</span>
                      </span>
                    ) : (
                      <HighlightedText
                        text={msg.metin}
                        onSelectTerm={handleOpenTermModal}
                        onSearchExpression={handleSearchExpression}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kanıtlar ve SENİN BULDUĞUN (Requirement B.8) */}
        <div className="my-4">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider mb-2">
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
                      onSelectTerm={handleOpenTermModal}
                      onSearchExpression={handleSearchExpression}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* SENİN BULDUĞUN Bölümü */}
          {markedLogs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-[var(--cizgi)]">
              <div className="font-mono-code text-[12px] font-semibold text-[var(--pas)] uppercase tracking-wider mb-2">
                SENİN BULDUĞUN
              </div>
              <div className="space-y-2">
                {markedLogs.map((log) => {
                  const logText = rol === 'backend' ? log.metin_backend : log.metin_lider;
                  return (
                    <div
                      key={log.id}
                      data-testid={`kanit-bulunan-${log.id}`}
                      className="fosfor-ciz bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-3 flex items-start gap-2.5"
                    >
                      <div className="shrink-0 pt-0.5 flex flex-col gap-1 items-start">
                        <RubberStamp text={log.etiket} />
                        <RubberStamp text="BULUNDU" type="BULUNDU" bas={true} />
                      </div>
                      <div className="font-mono-code text-[13px] text-[var(--murekkep)] leading-relaxed flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[var(--soluk)] text-[12px]">{log.saat}</span>
                          <span className="text-[var(--soluk)] text-[12px] uppercase font-semibold">{log.kaynak}</span>
                        </div>
                        <div>
                          <HighlightedText
                            text={logText}
                            onSelectTerm={handleOpenTermModal}
                            onSearchExpression={handleSearchExpression}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Eylemler / Karar Seçenekleri - v1'deki gibi form kutucuğu, harf ve açıklama yok */}
        <div className="my-5">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider mb-2">
            BİR MÜDAHALE SEÇİN
          </div>
          <div className="space-y-2.5">
            {displayedActions.map((eylem) => {
              const eylemMetni = rol === 'backend' ? eylem.metin_backend : eylem.metin_lider;
              const allActionsLocked =
                displayedActions.length > 0 &&
                displayedActions.every((e) => denenenEylemler.includes(e.id));
              const isEylemLocked = !allActionsLocked && denenenEylemler.includes(eylem.id);

              if (isEylemLocked) {
                return (
                  <div
                    key={eylem.id}
                    data-testid={`eylem-${eylem.id}`}
                    aria-disabled="true"
                    className="w-full text-left p-3 bg-[var(--fis)] border border-dashed border-[var(--cizgi)] rounded-[4px] min-h-[48px] flex flex-col gap-1.5 opacity-60 cursor-not-allowed select-none"
                  >
                    <div>
                      <RubberStamp
                        text="DENENDİ · SONUÇ DEĞİŞMEDİ"
                        testId={`denendi-${eylem.id}`}
                        className="text-[12px] py-0 px-1 border-dashed"
                      />
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-[2px] border border-[var(--cizgi)] bg-[var(--kagit)] shrink-0 mt-0.5 line-through" />
                      <div className="text-[15px] font-medium text-[var(--soluk)] leading-snug flex-1 line-through">
                        {eylemMetni}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={eylem.id}
                  type="button"
                  data-testid={`eylem-${eylem.id}`}
                  onClick={() => handleActionClick(eylem)}
                  disabled={isActionProcessing}
                  className={`w-full text-left p-3.5 bg-[var(--fis)] border border-[var(--cizgi)] hover:border-[var(--tukenmez)] rounded-[4px] min-h-[48px] flex items-start gap-3 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--tukenmez)] ${
                    secilenEylemId === eylem.id ? 'border-[var(--tukenmez)]' : 'disabled:opacity-50'
                  }`}
                >
                  <div className="w-5 h-5 rounded-[2px] border border-[var(--cizgi)] bg-white shrink-0 mt-0.5 flex items-center justify-center">
                    {secilenEylemId === eylem.id && (
                      <svg viewBox="0 0 20 20" className="w-4 h-4 tik-ciz" aria-hidden="true">
                        <path
                          d="M3 10.5 L8 15 L17 4.5"
                          fill="none"
                          stroke="var(--tukenmez)"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="text-[15px] font-medium text-[var(--murekkep)] leading-snug flex-1">
                    {eylemMetni}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alt Araç Çubuğu: Logda ara, İpucu ve Tutora Sor (Requirement B.5) */}
      <div className="mt-4 pt-3 border-t border-[var(--cizgi)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="dugme-konsol"
            onClick={() => {
              setLogConsoleInitialQuery('');
              setIsLogConsoleOpen(true);
            }}
            className="h-10 px-3 bg-[var(--fis)] border border-[var(--murekkep)] text-[var(--murekkep)] rounded-[4px] font-mono-code text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-[var(--kagit)]"
          >
            Logda ara
          </button>

          {seviye === 'Yeni başladım' && (
            <button
              type="button"
              data-testid="dugme-ipucu"
              onClick={() => setIsClueOpen(true)}
              className="h-10 px-3 bg-[var(--fis)] border border-[var(--murekkep)] text-[var(--murekkep)] rounded-[4px] font-mono-code text-[12px] flex items-center gap-1.5 cursor-pointer hover:bg-[var(--kagit)]"
            >
              İpucu
            </button>
          )}
        </div>

        <button
          type="button"
          data-testid="dugme-tutor"
          onClick={() => {
            setTutorOfferMode('karar_oncesi');
            setIsTutorOpen(true);
          }}
          className="h-10 px-3 bg-[var(--fis)] border border-[var(--tukenmez)] text-[var(--tukenmez)] font-mono-code text-[12px] font-medium rounded-[4px] flex items-center gap-1.5 cursor-pointer hover:bg-[var(--kagit)]"
        >
          Tutora sor
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
        israrKaliplari={(SCENARIO as any).israr_kaliplari || []}
        sceneResetKey={`${sahne.id}-${ziyaret}`}
        onTutorMessageSent={onTutorMessageSent}
      />

      {isLogConsoleOpen && (
        <LogConsoleModal
          allLogs={allAccumulatedLogs}
          currentSceneSuggestions={yonetmenModu === 'destek' ? sahne.konsol_onerileri || [] : []}
          rol={rol}
          seviye={seviye}
          markedLogIds={markedLogs.map((l) => l.id)}
          initialQuery={logConsoleInitialQuery}
          onMarkLog={handleMarkLogItem}
          onSearchRecorded={(term) => setSceneSearchQueries((prev) => new Set(prev).add(term))}
          onClose={() => {
            setIsLogConsoleOpen(false);
            setLogConsoleInitialQuery('');
          }}
        />
      )}

      {openedCardKisiId && (
        <CharacterCardModal
          kisiId={openedCardKisiId}
          onClose={() => setOpenedCardKisiId(null)}
        />
      )}
    </div>
  );
};
