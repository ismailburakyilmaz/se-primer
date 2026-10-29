import React, { useState, useEffect } from 'react';
import { Seviye, Rol, Hedef, Eylem, Sahne, KararKaydi, Mesaj } from './types/game.js';
import { SCENARIO, getSahne, processDecision, processTimeout, StepResult, getCoordLabel } from './utils/engine.js';
import { IntroScreen } from './screens/IntroScreen.js';
import { SceneScreen } from './screens/SceneScreen.js';
import { ResultScreen } from './screens/ResultScreen.js';
import { EvalScreen } from './screens/EvalScreen.js';
import { WhatHappenedModal } from './components/WhatHappenedModal.js';

const STORAGE_KEY = 'se_primer_session_v1';

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
  const [screen, setScreen] = useState<'intro' | 'scene' | 'result' | 'eval'>('intro');

  // URL query params
  const [isMock, setIsMock] = useState<boolean>(false);
  const [seedParam, setSeedParam] = useState<string | null>(null);

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

  // Read URL query parameters and sessionStorage on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mock') === '1') {
      setIsMock(true);
    }
    const seed = params.get('seed');
    if (seed) {
      setSeedParam(seed);
    }
    if (params.get('eval') === '1') {
      setScreen('eval');
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
          setEndGame(parsed.endGame || null);
          setEndReasons(parsed.endReasons || []);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleStartGame = (params: {
    seviye: Seviye;
    rol: Rol;
    hedef: Hedef;
    sayacAcik: boolean;
  }) => {
    setSeviye(params.seviye);
    setRol(params.rol);
    setHedef(params.hedef);
    setSayacAcik(params.sayacAcik);

    // Reset initial game state from SCENARIO
    const initialSahne = SCENARIO.baslangic.ilk_sahne || 'S1';
    const initialSure = SCENARIO.baslangic.sure_dk || 0;
    const initialEtki = SCENARIO.baslangic.etki || 180;
    const initialRisk = SCENARIO.baslangic.risk || 10;
    const initialCoord = SCENARIO.baslangic.koordinasyon || 1;

    setCurrentSahneId(initialSahne);
    setZiyaret(0);
    setSureDk(initialSure);
    setEtki(initialEtki);
    setMaxEtki(initialEtki);
    setRisk(initialRisk);
    setKoordinasyon(initialCoord);
    setBayraklar({});
    setKararlar([]);
    setEkstraMesajlar([]);
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

    clearSessionState();
    setScreen('scene');
  };

  const handleSelectEylem = (eylem: Eylem) => {
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

    setGaugeChangesText(diffParts.join(' · '));
    setPendingChangedGauges(changed);
    setPendingStep(step);
    setLastChosenEylem(eylem);
    setIsWhatHappenedOpen(true);
  };

  const handleContinueAfterWhatHappened = () => {
    if (!pendingStep) return;

    setIsWhatHappenedOpen(false);

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

    setSureDk(newSureDk);
    setEtki(newEtki);
    setMaxEtki(newMaxEtki);
    setRisk(newRisk);
    setKoordinasyon(newCoord);
    setBayraklar(newBayraklar);
    setKararlar(newKararlar);
    setEkstraMesajlar(newEkstraMesajlar);

    // 1 saniyelik fosfor vurgusu tetikle (Requirement 6)
    if (pendingChangedGauges) {
      setGaugeHighlights(pendingChangedGauges);
      setTimeout(() => {
        setGaugeHighlights({});
      }, 1000);
    }

    if (nextEndGame) {
      setEndGame(nextEndGame);
      setEndReasons(nextEndReasons);
      setScreen('result');
      clearSessionState();
    } else {
      setCurrentSahneId(nextSahneId);
      setZiyaret(nextZiyaret);

      // SessionStorage kaydet (Requirement B2)
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

    setSureDk(newSureDk);
    setEtki(newEtki);
    setMaxEtki(newMaxEtki);
    setRisk(newRisk);
    setKoordinasyon(newCoord);
    setBayraklar(newBayraklar);
    setKararlar(newKararlar);
    setEkstraMesajlar(newEkstraMesajlar);

    if (pendingChangedGauges) {
      setGaugeHighlights(pendingChangedGauges);
      setTimeout(() => {
        setGaugeHighlights({});
      }, 1000);
    }

    if (nextEndGame) {
      setEndGame(nextEndGame);
      setEndReasons(nextEndReasons);
      setScreen('result');
      clearSessionState();
    } else {
      setCurrentSahneId(nextSahneId);
      setOpenTutorOfferDirectly(true);
      setZiyaret(nextZiyaret);

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
        endGame: null,
        endReasons: [],
      });
    }

    setPendingStep(null);
  };

  const handleTimeout = () => {
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

    const newSureDk = timeoutStep.sureDk;
    const newEtki = timeoutStep.etki;
    const newMaxEtki = timeoutStep.maxEtki;
    const newRisk = timeoutStep.risk;
    const newCoord = timeoutStep.koordinasyon;
    const newBayraklar = timeoutStep.bayraklar;
    const newKararlar = [...kararlar, timeoutStep.kararKaydi];
    const newEkstraMesajlar = timeoutStep.ekMesaj ? [timeoutStep.ekMesaj] : ekstraMesajlar;

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
      setScreen('result');
      clearSessionState();
    } else {
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
        endGame: null,
        endReasons: [],
      });
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
      {screen === 'intro' && (
        <IntroScreen
          onStart={handleStartGame}
          onOpenEval={() => setScreen('eval')}
          seedParam={seedParam}
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
          isMock={isMock}
          isWhatHappenedOpen={isWhatHappenedOpen}
          gaugeHighlights={gaugeHighlights}
          lastEvaluatedActionInfo={lastEvaluatedActionInfo}
          onSelectEylem={handleSelectEylem}
          onTimeout={handleTimeout}
          onExitGame={handleExitGame}
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
          onPlayOtherRole={handlePlayOtherRole}
          onRestart={handleRestart}
        />
      )}

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
