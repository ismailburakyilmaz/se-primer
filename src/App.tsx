import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Seviye, Rol, Hedef, Eylem, KararKaydi, Mesaj, LogSatiri } from './types/game.js';
import { SCENARIO, getSahne, processDecision, processTimeout, StepResult, getCoordLabel } from './utils/engine.js';
import { IntroScreen } from './screens/IntroScreen.js';
import { SceneScreen } from './screens/SceneScreen.js';
import { ResultScreen } from './screens/ResultScreen.js';
import { EvalScreen } from './screens/EvalScreen.js';
import { WhatHappenedModal } from './components/WhatHappenedModal.js';
import { StampNotificationBar } from './components/StampNotificationBar.js';
import { OturumSatiri, generateSessionId } from './utils/iz.js';
import { PariteScreen } from './screens/PariteScreen.js';
import {
  initModel,
  predictKotuSonProb,
  computeYonetmenModu,
  getFixedModelProb,
  getModelDurum,
  onModelDurum,
  ModelDurum,
  MODEL_SURUMU_TAG,
} from './utils/modelService.js';
import { formatClock } from './utils/engine.js';

type YonetmenModu = 'olagan' | 'destek' | 'baski';

const STORAGE_KEY = 'se_primer_session_v2';

function saveSessionState(state: any) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore quota or disabled storage
  }
}

function clearSessionState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

export const App: React.FC = () => {
  const [screen, setScreen] = useState<'intro' | 'scene' | 'result' | 'eval' | 'parite'>('intro');

  // v2 Olay Yönetmeni (spec §13.5)
  const [yonetmenModu, setYonetmenModu] = useState<YonetmenModu>('olagan');
  const [yonetmenIzi, setYonetmenIzi] = useState<{ sahneId: string; mod: 'destek' | 'baski'; saat: string }[]>([]);
  const sonrakiModRef = useRef<Promise<YonetmenModu> | null>(null);
  const [modelDurum, setModelDurum] = useState<ModelDurum>(getModelDurum());

  // URL query params
  const [isMock, setIsMock] = useState<boolean>(false);
  const [isVeriMode, setIsVeriMode] = useState<boolean>(false);
  const [isGelistirici, setIsGelistirici] = useState<boolean>(false);
  const [modelParam, setModelParam] = useState<string>('');

  // Player configuration
  const [seviye, setSeviye] = useState<Seviye>('Yeni başladım');
  const [rol, setRol] = useState<Rol>('backend');
  const [hedef, setHedef] = useState<Hedef>('Öğrenmek');
  const [sayacAcik, setSayacAcik] = useState<boolean>(false);

  // Game state
  const [currentSahneId, setCurrentSahneId] = useState<string>('S1');
  const [ziyaret, setZiyaret] = useState<number>(0);
  const [sureDk, setSureDk] = useState<number>(0);
  const [etki, setEtki] = useState<number>(180);
  const [maxEtki, setMaxEtki] = useState<number>(180);
  const [risk, setRisk] = useState<number>(10);
  const [koordinasyon, setKoordinasyon] = useState<number>(1);
  const [bayraklar, setBayraklar] = useState<Record<string, boolean>>({});
  const [kararlar, setKararlar] = useState<KararKaydi[]>([]);
  const [ekstraMesajlar, setEkstraMesajlar] = useState<Mesaj[]>([]);

  // v2 additions: visited scenes, marked logs, cold message
  const [visitedSahneIds, setVisitedSahneIds] = useState<string[]>(['S1']);
  const [markedLogs, setMarkedLogs] = useState<LogSatiri[]>([]);
  const [isColdMessagePending, setIsColdMessagePending] = useState<boolean>(false);

  // v2 Session trace state (Requirement F.5, F.6, G.7, G.8)
  const [oturumId, setOturumId] = useState<string>(() => generateSessionId());
  const [oturumRows, setOturumRows] = useState<OturumSatiri[]>([]);
  const [terimToplam, setTerimToplam] = useState<number>(0);
  const [tutorToplam, setTutorToplam] = useState<number>(0);
  const [israrToplam, setIsrarToplam] = useState<number>(0);
  const [sorunluKararToplam, setSorunluKararToplam] = useState<number>(0);

  // End Game State
  const [endGame, setEndGame] = useState<'alindi' | 'alinamadi' | 'ihlal' | null>(null);
  const [endReasons, setEndReasons] = useState<string[]>([]);

  // What Happened modal state
  const [lastChosenEylem, setLastChosenEylem] = useState<Eylem | null>(null);
  const [lastEvaluatedActionInfo, setLastEvaluatedActionInfo] = useState<{
    secilen_eylem_metni: string;
    ne_oldu: string;
    neden_oldu: string;
  } | null>(null);
  const [isWhatHappenedOpen, setIsWhatHappenedOpen] = useState<boolean>(false);
  const [pendingStep, setPendingStep] = useState<StepResult | null>(null);
  const [openTutorOfferDirectly, setOpenTutorOfferDirectly] = useState<boolean>(false);

  // Gösterge değişim metni ve vurgusu
  const [gaugeChangesText, setGaugeChangesText] = useState<string>('');
  const [pendingChangedGauges, setPendingChangedGauges] = useState<{
    sure?: boolean;
    etki?: boolean;
    risk?: boolean;
    koordinasyon?: boolean;
  }>({});
  const [gaugeHighlights, setGaugeHighlights] = useState<{
    sure?: boolean;
    etki?: boolean;
    risk?: boolean;
    koordinasyon?: boolean;
  }>({});
  const [previousGauges, setPreviousGauges] = useState<{
    sureDk: number;
    etki: number;
    risk: number;
    koordinasyon: number;
  } | null>(null);
  const [denenenEylemlerBuSahne, setDenenenEylemlerBuSahne] = useState<string[]>([]);
  const [denemeSayisi, setDenemeSayisi] = useState<number>(1);

  // Read URL query parameters and sessionStorage on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mock') === '1') {
      setIsMock(true);
    }
    if (params.get('veri') === '1') {
      setIsVeriMode(true);
    }
    if (params.get('gelistirici') === '1') {
      setIsGelistirici(true);
    }
    const model = params.get('model');
    if (model) {
      setModelParam(model);
    }
    if (params.get('eval') === '1') {
      setScreen('eval');
      return;
    }
    if (params.get('parite') === '1') {
      setScreen('parite');
      return;
    }

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.currentSahneId) {
          setScreen(parsed.screen || 'scene');
          setSeviye(parsed.seviye || 'Yeni başladım');
          setRol(parsed.rol || 'backend');
          setHedef(parsed.hedef || 'Öğrenmek');
          setSayacAcik(Boolean(parsed.sayacAcik));
          setCurrentSahneId(parsed.currentSahneId || 'S1');
          setZiyaret(parsed.ziyaret || 0);
          setSureDk(parsed.sureDk || 0);
          setEtki(parsed.etki ?? 180);
          setMaxEtki(parsed.maxEtki ?? 180);
          setRisk(parsed.risk ?? 10);
          setKoordinasyon(parsed.koordinasyon ?? 1);
          setBayraklar(parsed.bayraklar || {});
          setKararlar(parsed.kararlar || []);
          setEkstraMesajlar(parsed.ekstraMesajlar || []);
          setVisitedSahneIds(parsed.visitedSahneIds || ['S1']);
          setMarkedLogs(parsed.markedLogs || []);
          setIsColdMessagePending(Boolean(parsed.isColdMessagePending));
          setOturumId(parsed.oturumId || generateSessionId());
          setOturumRows(parsed.oturumRows || []);
          setTerimToplam(parsed.terimToplam || 0);
          setTutorToplam(parsed.tutorToplam || 0);
          setIsrarToplam(parsed.israrToplam || 0);
          setSorunluKararToplam(parsed.sorunluKararToplam || 0);
          if (typeof parsed.isVeriMode === 'boolean') {
            setIsVeriMode(parsed.isVeriMode);
          }
          setEndGame(parsed.endGame || null);
          setEndReasons(parsed.endReasons || []);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Model bir kez yüklenir; durumu giriş ekranında gösterilir
  useEffect(() => {
    const kapat = onModelDurum(setModelDurum);
    initModel();
    return kapat;
  }, []);

  // Bir karar satırı için modeli çalıştırır, satırı p_golge ile günceller, sonraki sahnenin modunu döndürür
  const modelCalistir = async (row: OturumSatiri, veriModu: boolean): Promise<YonetmenModu> => {
    const p = await predictKotuSonProb(row as any);
    const mod = computeYonetmenModu(p, veriModu);
    const sabit = getFixedModelProb() !== null;
    console.info(`[yonetmen] p=${p === null ? 'yok' : p.toFixed(6)} mod=${mod} veriModu=${veriModu}`);
    setOturumRows((prev) =>
      prev.map((r) =>
        r.oturum === row.oturum && r.karar_no === row.karar_no
          ? {
              ...r,
              p_golge: p === null ? '' : p.toFixed(6),
              model_surumu: p === null ? '' : sabit ? 'sabit' : MODEL_SURUMU_TAG,
            }
          : r
      )
    );
    return mod;
  };

  // Sonraki sahne açılırken bekleyen modu uygular
  const sonrakiModuUygula = (sahneId: string, yeniSureDk: number) => {
    const bekleyen = sonrakiModRef.current;
    sonrakiModRef.current = null;
    setYonetmenModu('olagan');
    if (!bekleyen) return;
    bekleyen.then((mod) => {
      setYonetmenModu(mod);
      if (mod !== 'olagan') {
        setYonetmenIzi((prev) => [...prev, { sahneId, mod, saat: formatClock(yeniSureDk) }]);
      }
    });
  };

  // Accumulated logs across visited scenes (spec §12.2)
  const allAccumulatedLogs = useMemo(() => {
    const list: LogSatiri[] = [];
    const seen = new Set<string>();
    for (const sId of visitedSahneIds) {
      const s = getSahne(sId);
      if (s && s.loglar) {
        for (const log of s.loglar) {
          if (!seen.has(log.id)) {
            seen.add(log.id);
            list.push(log);
          }
        }
      }
    }
    return list;
  }, [visitedSahneIds]);

  const handleStartGame = (params: {
    seviye: Seviye;
    rol: Rol;
    hedef: Hedef;
    sayacAcik: boolean;
    isVeriMode?: boolean;
  }) => {
    setSeviye(params.seviye);
    setRol(params.rol);
    setHedef(params.hedef);
    setSayacAcik(params.sayacAcik);
    if (typeof params.isVeriMode === 'boolean') {
      setIsVeriMode(params.isVeriMode);
    }

    // Reset initial game state from SCENARIO
    const initialSahne = SCENARIO.baslangic.ilk_sahne || 'S1';
    const initialSure = SCENARIO.baslangic.sure_dk || 0;
    const initialEtki = SCENARIO.baslangic.etki || 180;
    const initialRisk = SCENARIO.baslangic.risk || 10;
    const initialCoord = SCENARIO.baslangic.koordinasyon || 1;

    const newOturumId = generateSessionId();

    setCurrentSahneId(initialSahne);
    setZiyaret(0);
    setSureDk(initialSure);
    setEtki(initialEtki);
    setMaxEtki(initialEtki);
    setRisk(initialRisk);
    setKoordinasyon(initialCoord);
    let initialEkstraMesajlar: Mesaj[] = [];
    if (!params.isVeriMode) {
      try {
        const memStr = localStorage.getItem('seprimer_hafiza');
        if (memStr) {
          const mem = JSON.parse(memStr);
          const hMesajlar = (SCENARIO as any).hafiza_mesajlari || {};
          let hKey = '';
          if (mem.son === 'ihlal') {
            hKey = 'onceki_ihlal';
          } else if (mem.ilk_eylem === 'S1_geri_don') {
            hKey = 'onceki_geri_don';
          } else if (mem.son === 'alinamadi') {
            hKey = 'onceki_alinamadi';
          } else if (mem.son === 'alindi') {
            hKey = 'onceki_alindi';
          }
          if (hKey && hMesajlar[hKey]) {
            initialEkstraMesajlar = [
              {
                kisi: hMesajlar[hKey].kisi,
                metin: hMesajlar[hKey].metin,
              },
            ];
          }
        }
      } catch (e) {}
    }

    setBayraklar({});
    setKararlar([]);
    setEkstraMesajlar(initialEkstraMesajlar);
    setVisitedSahneIds([initialSahne]);
    setMarkedLogs([]);
    setIsColdMessagePending(false);
    setOturumId(newOturumId);
    setOturumRows([]);
    setTerimToplam(0);
    setTutorToplam(0);
    setIsrarToplam(0);
    setSorunluKararToplam(0);
    setEndGame(null);
    setEndReasons([]);
    setLastChosenEylem(null);
    setLastEvaluatedActionInfo(null);
    setIsWhatHappenedOpen(false);
    setPendingStep(null);
    setOpenTutorOfferDirectly(false);
    setGaugeChangesText('');
    setPendingChangedGauges({});
    setGaugeHighlights({});
    setDenenenEylemlerBuSahne([]);
    setDenemeSayisi(1);
    setYonetmenModu('olagan');
    setYonetmenIzi([]);
    sonrakiModRef.current = null;

    clearSessionState();
    setScreen('scene');
  };

  const handleSelectEylem = (
    eylem: Eylem,
    stats: { kararSuresiSn: number; konsolArama: number; bulunanAnlamli: number }
  ) => {
    const currentSahne = getSahne(currentSahneId) || SCENARIO.sahneler[0];
    const step = processDecision({
      currentSahne,
      eylem,
      rol,
      hedef,
      sureDk,
      etki,
      maxEtki,
      risk,
      koordinasyon,
      bayraklar,
      decisionCount: kararlar.length,
    });

    const isSorunlu = ['geciktiren', 'tehlikeli', 'kirmizi_cizgi'].includes(eylem.tur);
    const newSorunluToplam = sorunluKararToplam + (isSorunlu ? 1 : 0);
    setSorunluKararToplam(newSorunluToplam);

    // Record trace row (spec §13.2 / SOZLUK.md)
    const traceRow: OturumSatiri = {
      oturum: oturumId,
      kaynak: 'gercek',
      oyuncu_tipi: 'oyuncu',
      karar_no: kararlar.length + 1,
      sahne_id: currentSahneId,
      eylem_id: eylem.id,
      seviye: seviye === 'Yeni başladım' ? 0 : 1,
      rol: rol === 'backend' ? 0 : 1,
      karar_suresi_sn: stats.kararSuresiSn,
      konsol_arama: stats.konsolArama,
      bulunan_anlamli: stats.bulunanAnlamli,
      terim_toplam: terimToplam,
      tutor_toplam: tutorToplam,
      israr_toplam: israrToplam,
      sorunlu_karar_toplam: newSorunluToplam,
      kalan_sure_dk: Math.max(0, 100 - step.sureDk),
      son: '',
      kotu_son: '',
      yonetmen_modu: yonetmenModu,
      model_surumu: '',
      p_golge: '',
    };
    setOturumRows((prev) => [...prev, traceRow]);
    // Model, "Ne oldu" paneli açıkken çalışır; sonuç bir sonraki sahnenin modunu belirler (spec §13.1)
    sonrakiModRef.current = modelCalistir(traceRow, isVeriMode);

    const eylemMetni = rol === 'backend' ? eylem.metin_backend : eylem.metin_lider;
    const nedenOlduMetni = (hedef === 'Öğrenmek' && eylem.neden_oldu_uzun) || eylem.neden_oldu;
    setLastEvaluatedActionInfo({
      secilen_eylem_metni: eylemMetni,
      ne_oldu: eylem.ne_oldu,
      neden_oldu: nedenOlduMetni,
    });

    // Göstergelerdeki değişimi hesapla (Requirement 6)
    const diffParts: string[] = [];
    const changed = {
      sure: false,
      etki: false,
      risk: false,
      koordinasyon: false,
    };

    const diffSure = step.sureDk - sureDk;
    if (diffSure !== 0) {
      diffParts.push(`Süre ${diffSure > 0 ? '+' : ''}${diffSure} dk`);
      changed.sure = true;
    }

    const diffEtki = step.etki - etki;
    if (diffEtki !== 0) {
      diffParts.push(`Etki ${diffEtki > 0 ? '+' : ''}${diffEtki}`);
      changed.etki = true;
    }

    const diffRisk = step.risk - risk;
    if (diffRisk !== 0) {
      diffParts.push(`Veri riski ${diffRisk > 0 ? '+' : ''}${diffRisk}`);
      changed.risk = true;
    }

    if (step.koordinasyon !== koordinasyon) {
      diffParts.push(`Ekip: ${getCoordLabel(koordinasyon)} → ${getCoordLabel(step.koordinasyon)}`);
      changed.koordinasyon = true;
    }

    const unreliableMsg = (currentSahne?.mesajlar as any[])?.find((m: any) => m.guvenilmez);
    if (unreliableMsg && eylem.tur === 'geciktiren') {
      const isCelisenMarked = markedLogs.some((l) => l.id === unreliableMsg.celisen_log);
      if (!isCelisenMarked) {
        const gKarakter = (SCENARIO as any).karakterler?.[unreliableMsg.kisi] || { ad: unreliableMsg.kisi };
        step.kararKaydi.guvenilmezMesajUyarisi = {
          soru: 'Bu bilgi kimden geldi, doğrulandı mı?',
          sahibi: gKarakter.ad || unreliableMsg.kisi,
          metin: unreliableMsg.metin,
        };
      }
    }

    setGaugeChangesText(diffParts.join(' · '));
    setPendingChangedGauges(changed);
    setPendingStep(step);
    setLastChosenEylem(eylem);
    setIsWhatHappenedOpen(true);
  };

  const handleContinueAfterWhatHappened = (mulakatCümlesi?: string, savunmaMetni?: string) => {
    if (!pendingStep) return;

    if (mulakatCümlesi && pendingStep.kararKaydi) {
      pendingStep.kararKaydi.mulakatMetni = mulakatCümlesi;
    }
    if (savunmaMetni && pendingStep.kararKaydi) {
      pendingStep.kararKaydi.savunmaMetni = savunmaMetni;
    }

    setIsWhatHappenedOpen(false);

    // Ink strike-through previous gauges:
    setPreviousGauges({
      sureDk,
      etki,
      risk,
      koordinasyon,
    });
    setTimeout(() => {
      setPreviousGauges(null);
    }, 1500);

    // Apply calculated step
    const newSureDk = pendingStep.sureDk;
    const newEtki = pendingStep.etki;
    const newMaxEtki = pendingStep.maxEtki;
    const newRisk = pendingStep.risk;
    const newCoord = pendingStep.koordinasyon;
    const newBayraklar = pendingStep.bayraklar;
    const newKararlar = [...kararlar, pendingStep.kararKaydi];
    const newEkstraMesajlar = pendingStep.ekMesaj ? [pendingStep.ekMesaj] : [];
    const nextSahneId = pendingStep.nextSahneId;
    const nextEndGame = pendingStep.endGame;
    const nextEndReasons = pendingStep.endReasons;
    const nextZiyaret = ziyaret + 1;

    // Check if team trust dropped -> trigger cold message for next scene
    let nextColdPending = isColdMessagePending;
    if (newCoord < koordinasyon) {
      nextColdPending = true;
    }

    setSureDk(newSureDk);
    setEtki(newEtki);
    setMaxEtki(newMaxEtki);
    setRisk(newRisk);
    setKoordinasyon(newCoord);
    setBayraklar(newBayraklar);
    setKararlar(newKararlar);
    setEkstraMesajlar(newEkstraMesajlar);
    setIsColdMessagePending(nextColdPending);

    // Update visited scenes
    const nextVisited = visitedSahneIds.includes(nextSahneId)
      ? visitedSahneIds
      : [...visitedSahneIds, nextSahneId];
    setVisitedSahneIds(nextVisited);

    if (nextEndGame) {
      setEndGame(nextEndGame);
      setEndReasons(nextEndReasons);

      // Memory save (spec §15.2, Prompt 3 madde 10)
      if (!isVeriMode) {
        try {
          const profileRules = (SCENARIO as any).profil_kurallari || {};
          const searchCount = oturumRows.filter((r) => Number(r.konsol_arama) > 0).length;
          const isKanitci = newKararlar.length > 0 && searchCount / newKararlar.length >= 0.5;
          const fastNoSearchCount = oturumRows.filter((r) => Number(r.karar_suresi_sn) < 10 && Number(r.konsol_arama) === 0).length;
          const isAceleci = newKararlar.length > 0 && fastNoSearchCount / newKararlar.length >= 0.5;
          const isOtorite = newKararlar.some((k) => k.mudurOnerisi);
          const isYetki = newKararlar.some((k) => k.yetkiDisi);
          const isVeri = newKararlar.some((k) => k.veriKorumayan);
          const matches: Record<string, boolean> = {
            veriyi_hafife_alan: isVeri,
            yetki_zorlayan: isYetki,
            otoriteye_uyan: isOtorite,
            aceleci: isAceleci,
            kanitci: isKanitci,
            dengeli: true,
          };
          const order = profileRules.oncelik || ['veriyi_hafife_alan', 'yetki_zorlayan', 'otoriteye_uyan', 'aceleci', 'kanitci', 'dengeli'];
          let finalKey = 'dengeli';
          for (const key of order) {
            if (matches[key]) {
              finalKey = key;
              break;
            }
          }
          const memory = {
            son: nextEndGame,
            karar_tarzi: finalKey,
            ilk_eylem: newKararlar[0]?.eylemId || '',
          };
          localStorage.setItem('seprimer_hafiza', JSON.stringify(memory));
        } catch (e) {}
      }

      // Seal all trace rows with final outcome
      setOturumRows((prev) =>
        prev.map((r) => ({
          ...r,
          son: nextEndGame,
          kotu_son: nextEndGame === 'alindi' ? 0 : 1,
        }))
      );
      setScreen('result');
      clearSessionState();
    } else {
      if (nextSahneId === currentSahneId) {
        const chosenEylemId = pendingStep.kararKaydi?.eylemId;
        if (chosenEylemId) {
          setDenenenEylemlerBuSahne((prev) =>
            prev.includes(chosenEylemId) ? prev : [...prev, chosenEylemId]
          );
        }
        setDenemeSayisi((prev) => prev + 1);
      } else {
        setDenenenEylemlerBuSahne([]);
        setDenemeSayisi(1);
      }

      setCurrentSahneId(nextSahneId);
      setZiyaret(nextZiyaret);
      sonrakiModuUygula(nextSahneId, newSureDk);

      saveSessionState({
        screen: 'scene',
        seviye,
        rol,
        hedef,
        sayacAcik,
        currentSahneId: nextSahneId,
        ziyaret: nextZiyaret,
        sureDk: newSureDk,
        etki: newEtki,
        maxEtki: newMaxEtki,
        risk: newRisk,
        koordinasyon: newCoord,
        bayraklar: newBayraklar,
        kararlar: newKararlar,
        ekstraMesajlar: newEkstraMesajlar,
        visitedSahneIds: nextVisited,
        markedLogs,
        isColdMessagePending: nextColdPending,
        oturumId,
        oturumRows,
        terimToplam,
        tutorToplam,
        israrToplam,
        sorunluKararToplam,
        isVeriMode,
        endGame: null,
        endReasons: [],
      });
    }

    setPendingStep(null);
  };

  const handleOpenTutorFromOffer = () => {
    // When tutor offer accepted from What Happened panel
    setIsWhatHappenedOpen(false);
    if (!pendingStep) return;

    const newSureDk = pendingStep.sureDk;
    const newEtki = pendingStep.etki;
    const newMaxEtki = pendingStep.maxEtki;
    const newRisk = pendingStep.risk;
    const newCoord = pendingStep.koordinasyon;
    const newBayraklar = pendingStep.bayraklar;
    const newKararlar = [...kararlar, pendingStep.kararKaydi];
    const newEkstraMesajlar = pendingStep.ekMesaj ? [pendingStep.ekMesaj] : [];
    const nextSahneId = pendingStep.nextSahneId;
    const nextEndGame = pendingStep.endGame;
    const nextEndReasons = pendingStep.endReasons;
    const nextZiyaret = ziyaret + 1;

    let nextColdPending = isColdMessagePending;
    if (newCoord < koordinasyon) {
      nextColdPending = true;
    }

    setSureDk(newSureDk);
    setEtki(newEtki);
    setMaxEtki(newMaxEtki);
    setRisk(newRisk);
    setKoordinasyon(newCoord);
    setBayraklar(newBayraklar);
    setKararlar(newKararlar);
    setEkstraMesajlar(newEkstraMesajlar);
    setIsColdMessagePending(nextColdPending);

    const nextVisited = visitedSahneIds.includes(nextSahneId)
      ? visitedSahneIds
      : [...visitedSahneIds, nextSahneId];
    setVisitedSahneIds(nextVisited);

    setPreviousGauges({
      sureDk,
      etki,
      risk,
      koordinasyon,
    });
    setTimeout(() => {
      setPreviousGauges(null);
    }, 1500);

    if (nextEndGame) {
      setEndGame(nextEndGame);
      setEndReasons(nextEndReasons);
      setOturumRows((prev) =>
        prev.map((r) => ({
          ...r,
          son: nextEndGame,
          kotu_son: nextEndGame === 'alindi' ? 0 : 1,
        }))
      );
      setScreen('result');
      clearSessionState();
    } else {
      if (nextSahneId === currentSahneId) {
        const chosenEylemId = pendingStep.kararKaydi?.eylemId;
        if (chosenEylemId) {
          setDenenenEylemlerBuSahne((prev) =>
            prev.includes(chosenEylemId) ? prev : [...prev, chosenEylemId]
          );
        }
        setDenemeSayisi((prev) => prev + 1);
      } else {
        setDenenenEylemlerBuSahne([]);
        setDenemeSayisi(1);
      }

      setCurrentSahneId(nextSahneId);
      setOpenTutorOfferDirectly(true);
      setZiyaret(nextZiyaret);
      sonrakiModuUygula(nextSahneId, newSureDk);

      saveSessionState({
        screen: 'scene',
        seviye,
        rol,
        hedef,
        sayacAcik,
        currentSahneId: nextSahneId,
        ziyaret: nextZiyaret,
        sureDk: newSureDk,
        etki: newEtki,
        maxEtki: newMaxEtki,
        risk: newRisk,
        koordinasyon: newCoord,
        bayraklar: newBayraklar,
        kararlar: newKararlar,
        ekstraMesajlar: newEkstraMesajlar,
        visitedSahneIds: nextVisited,
        markedLogs,
        isColdMessagePending: nextColdPending,
        oturumId,
        oturumRows,
        terimToplam,
        tutorToplam,
        israrToplam,
        sorunluKararToplam,
        endGame: null,
        endReasons: [],
      });
    }

    setPendingStep(null);
  };

  const handleTimeout = (stats: {
    kararSuresiSn: number;
    konsolArama: number;
    bulunanAnlamli: number;
  }) => {
    const currentSahne = getSahne(currentSahneId) || SCENARIO.sahneler[0];
    const timeoutStep = processTimeout({
      currentSahne,
      sureDk,
      etki,
      maxEtki,
      risk,
      koordinasyon,
      bayraklar,
      decisionCount: kararlar.length,
    });

    const newSorunluToplam = sorunluKararToplam + 1;
    setSorunluKararToplam(newSorunluToplam);

    const traceRow: OturumSatiri = {
      oturum: oturumId,
      kaynak: 'gercek',
      oyuncu_tipi: 'oyuncu',
      karar_no: kararlar.length + 1,
      sahne_id: currentSahneId,
      eylem_id: 'ZAMAN_ASIMI',
      seviye: seviye === 'Yeni başladım' ? 0 : 1,
      rol: rol === 'backend' ? 0 : 1,
      karar_suresi_sn: 60,
      konsol_arama: stats.konsolArama,
      bulunan_anlamli: stats.bulunanAnlamli,
      terim_toplam: terimToplam,
      tutor_toplam: tutorToplam,
      israr_toplam: israrToplam,
      sorunlu_karar_toplam: newSorunluToplam,
      kalan_sure_dk: Math.max(0, 100 - timeoutStep.sureDk),
      son: timeoutStep.endGame || '',
      kotu_son: timeoutStep.endGame ? (timeoutStep.endGame === 'alindi' ? 0 : 1) : '',
      yonetmen_modu: yonetmenModu,
      model_surumu: '',
      p_golge: '',
    };
    setOturumRows((prev) => [...prev, traceRow]);
    // Zaman aşımında aynı sahne sürer; tahmin kaydedilir, mod bir sonraki sahne geçişinde yeni kararla belirlenir
    modelCalistir(traceRow, isVeriMode);

    const newSureDk = timeoutStep.sureDk;
    const newEtki = timeoutStep.etki;
    const newMaxEtki = timeoutStep.maxEtki;
    const newRisk = timeoutStep.risk;
    const newCoord = timeoutStep.koordinasyon;
    const newBayraklar = timeoutStep.bayraklar;
    const newKararlar = [...kararlar, timeoutStep.kararKaydi];
    const newEkstraMesajlar = timeoutStep.ekMesaj ? [timeoutStep.ekMesaj] : ekstraMesajlar;

    setPreviousGauges({
      sureDk,
      etki,
      risk,
      koordinasyon,
    });
    setTimeout(() => {
      setPreviousGauges(null);
    }, 1500);

    setSureDk(newSureDk);
    setEtki(newEtki);
    setMaxEtki(newMaxEtki);
    setRisk(newRisk);
    setKoordinasyon(newCoord);
    setBayraklar(newBayraklar);
    setKararlar(newKararlar);
    setEkstraMesajlar(newEkstraMesajlar);

    if (timeoutStep.endGame) {
      setEndGame(timeoutStep.endGame);
      setEndReasons(timeoutStep.endReasons);

      if (!isVeriMode) {
        try {
          const memory = {
            son: timeoutStep.endGame,
            karar_tarzi: 'dengeli',
            ilk_eylem: newKararlar[0]?.eylemId || '',
          };
          localStorage.setItem('seprimer_hafiza', JSON.stringify(memory));
        } catch (e) {}
      }

      setOturumRows((prev) =>
        prev.map((r) => ({
          ...r,
          son: timeoutStep.endGame!,
          kotu_son: timeoutStep.endGame === 'alindi' ? 0 : 1,
        }))
      );
      setScreen('result');
      clearSessionState();
    } else {
      setDenemeSayisi((prev) => prev + 1);
      saveSessionState({
        screen: 'scene',
        seviye,
        rol,
        hedef,
        sayacAcik,
        currentSahneId,
        ziyaret,
        sureDk: newSureDk,
        etki: newEtki,
        maxEtki: newMaxEtki,
        risk: newRisk,
        koordinasyon: newCoord,
        bayraklar: newBayraklar,
        kararlar: newKararlar,
        ekstraMesajlar: newEkstraMesajlar,
        visitedSahneIds,
        markedLogs,
        isColdMessagePending,
        oturumId,
        oturumRows,
        terimToplam,
        tutorToplam,
        israrToplam,
        sorunluKararToplam: newSorunluToplam,
        endGame: null,
        endReasons: [],
      });
    }
  };

  const handleMarkLog = (log: LogSatiri) => {
    setMarkedLogs((prev) => {
      if (prev.some((l) => l.id === log.id)) return prev;
      const updated = [...prev, log];
      saveSessionState({
        screen: 'scene',
        seviye,
        rol,
        hedef,
        sayacAcik,
        currentSahneId,
        ziyaret,
        sureDk,
        etki,
        maxEtki,
        risk,
        koordinasyon,
        bayraklar,
        kararlar,
        ekstraMesajlar,
        visitedSahneIds,
        markedLogs: updated,
        isColdMessagePending,
        oturumId,
        oturumRows,
        terimToplam,
        tutorToplam,
        israrToplam,
        sorunluKararToplam,
        isVeriMode,
        endGame: null,
        endReasons: [],
      });
      return updated;
    });
  };

  const handleTermOpened = () => {
    setTerimToplam((prev) => prev + 1);
  };

  const handleTutorMessageSent = (isIsrar: boolean) => {
    setTutorToplam((prev) => prev + 1);
    if (isIsrar) {
      setIsrarToplam((prev) => prev + 1);
    }
  };

  const handleExitGame = () => {
    clearSessionState();
    setScreen('intro');
  };

  const handleRestart = () => {
    clearSessionState();
    setScreen('intro');
  };

  const handlePlayOtherRole = () => {
    clearSessionState();
    const otherRol: Rol = rol === 'backend' ? 'lider' : 'backend';
    handleStartGame({
      seviye,
      rol: otherRol,
      hedef,
      sayacAcik,
    });
  };

  const currentSahne = getSahne(currentSahneId) || SCENARIO.sahneler[0];
  const oncekiKararlarMetinleri = kararlar.map((k) => k.kararMetni);

  return (
    <div className="min-h-screen bg-[var(--kagit)] text-[var(--murekkep)] font-sans-body">
      <StampNotificationBar />

      {screen === 'intro' && (
        <IntroScreen
          onStart={handleStartGame}
          onOpenEval={() => setScreen('eval')}
          isVeriMode={isVeriMode}
        />
      )}

      {screen === 'scene' && (
        <SceneScreen
          key={`${currentSahneId}-${ziyaret}`}
          sahne={currentSahne}
          rol={rol}
          seviye={seviye}
          hedef={hedef}
          sureDk={sureDk}
          etki={etki}
          risk={risk}
          koordinasyon={koordinasyon}
          sayacAcik={sayacAcik}
          oncekiKararlarMetinleri={oncekiKararlarMetinleri}
          ekstraMesajlar={ekstraMesajlar}
          sogukMesaj={isColdMessagePending ? ((SCENARIO as any).soguk_mesaj || null) : null}
          allAccumulatedLogs={allAccumulatedLogs}
          markedLogs={markedLogs}
          onMarkLog={handleMarkLog}
          isMock={isMock}
          oturumId={oturumId}
          isWhatHappenedOpen={isWhatHappenedOpen}
          lastChosenEylem={lastChosenEylem}
          previousGauges={previousGauges}
          gaugeHighlights={gaugeHighlights}
          lastEvaluatedActionInfo={lastEvaluatedActionInfo}
          ziyaret={ziyaret}
          denenenEylemler={denenenEylemlerBuSahne}
          denemeSayisi={denemeSayisi}
          yonetmenModu={yonetmenModu}
          onSelectEylem={handleSelectEylem}
          onTimeout={handleTimeout}
          onExitGame={handleExitGame}
          onTermOpened={handleTermOpened}
          onTutorMessageSent={handleTutorMessageSent}
          onOpenTutorOfferDirectly={openTutorOfferDirectly}
          onClearTutorOfferDirectly={() => setOpenTutorOfferDirectly(false)}
        />
      )}

      {screen === 'result' && endGame && (
        <ResultScreen
          endGame={endGame}
          endReasons={endReasons}
          kararlar={kararlar}
          sureDk={sureDk}
          etki={etki}
          maxEtki={maxEtki}
          risk={risk}
          koordinasyon={koordinasyon}
          hedef={hedef}
          currentRol={rol}
          isVeriMode={isVeriMode}
          oturumTrace={oturumRows}
          oturumId={oturumId}
          markedLogs={markedLogs}
          yonetmenIzi={yonetmenIzi}
          onPlayOtherRole={handlePlayOtherRole}
          onRestart={handleRestart}
        />
      )}

      {screen === 'intro' && (
        <div
          data-testid="model-durum"
          className="max-w-xl mx-auto px-6 pb-4 -mt-2 font-mono-code text-[12px] text-[var(--soluk)]"
        >
          {modelDurum.mesaj}
        </div>
      )}

      {screen === 'parite' && <PariteScreen />}

      {screen === 'eval' && (
        <EvalScreen
          onBack={() => setScreen('intro')}
          isMock={isMock}
        />
      )}

      <WhatHappenedModal
        eylem={lastChosenEylem}
        isOpen={isWhatHappenedOpen}
        hedef={hedef}
        isEndGame={Boolean(pendingStep?.endGame)}
        gaugeChangesText={gaugeChangesText}
        onContinue={handleContinueAfterWhatHappened}
        onOpenTutorOffer={handleOpenTutorFromOffer}
      />
    </div>
  );
};

export default App;
