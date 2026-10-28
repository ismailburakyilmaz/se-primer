import React, { useState, useEffect } from 'react';
import { Seviye, Rol, Hedef, Eylem, Sahne, KararKaydi, Mesaj } from './types/game.js';
import { SCENARIO, getSahne, processDecision, processTimeout, StepResult } from './utils/engine.js';
import { IntroScreen } from './screens/IntroScreen.js';
import { SceneScreen } from './screens/SceneScreen.js';
import { ResultScreen } from './screens/ResultScreen.js';
import { EvalScreen } from './screens/EvalScreen.js';
import { WhatHappenedModal } from './components/WhatHappenedModal.js';

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

  // Read URL query parameters on load
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
    setCurrentSahneId(SCENARIO.baslangic.ilk_sahne || 'S1');
    setZiyaret(0);
    setSureDk(SCENARIO.baslangic.sure_dk || 0);
    setEtki(SCENARIO.baslangic.etki || 180);
    setMaxEtki(SCENARIO.baslangic.etki || 180);
    setRisk(SCENARIO.baslangic.risk || 10);
    setKoordinasyon(SCENARIO.baslangic.koordinasyon || 1);
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

    setPendingStep(step);
    setLastChosenEylem(eylem);
    setIsWhatHappenedOpen(true);
  };

  const handleContinueAfterWhatHappened = () => {
    if (!pendingStep) return;

    setIsWhatHappenedOpen(false);

    // Apply calculated step
    setSureDk(pendingStep.sureDk);
    setEtki(pendingStep.etki);
    setMaxEtki(pendingStep.maxEtki);
    setRisk(pendingStep.risk);
    setKoordinasyon(pendingStep.koordinasyon);
    setBayraklar(pendingStep.bayraklar);
    setKararlar((prev) => [...prev, pendingStep.kararKaydi]);

    if (pendingStep.ekMesaj) {
      setEkstraMesajlar([pendingStep.ekMesaj]);
    } else {
      setEkstraMesajlar([]);
    }

    if (pendingStep.endGame) {
      setEndGame(pendingStep.endGame);
      setEndReasons(pendingStep.endReasons);
      setScreen('result');
    } else {
      setCurrentSahneId(pendingStep.nextSahneId);
      // Karar sonrası sahneye geçiş: yeni ziyaret
      setZiyaret((prev) => prev + 1);
    }

    setPendingStep(null);
  };

  const handleOpenTutorFromOffer = () => {
    // When tutor offer accepted from What Happened panel
    setIsWhatHappenedOpen(false);
    if (!pendingStep) return;

    // Apply state changes first
    setSureDk(pendingStep.sureDk);
    setEtki(pendingStep.etki);
    setMaxEtki(pendingStep.maxEtki);
    setRisk(pendingStep.risk);
    setKoordinasyon(pendingStep.koordinasyon);
    setBayraklar(pendingStep.bayraklar);
    setKararlar((prev) => [...prev, pendingStep.kararKaydi]);

    if (pendingStep.ekMesaj) {
      setEkstraMesajlar([pendingStep.ekMesaj]);
    } else {
      setEkstraMesajlar([]);
    }

    if (pendingStep.endGame) {
      setEndGame(pendingStep.endGame);
      setEndReasons(pendingStep.endReasons);
      setScreen('result');
    } else {
      setCurrentSahneId(pendingStep.nextSahneId);
      setOpenTutorOfferDirectly(true);
      // Karar sonrası sahneye geçiş: yeni ziyaret
      setZiyaret((prev) => prev + 1);
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

    setSureDk(timeoutStep.sureDk);
    setEtki(timeoutStep.etki);
    setMaxEtki(timeoutStep.maxEtki);
    setRisk(timeoutStep.risk);
    setKoordinasyon(timeoutStep.koordinasyon);
    setBayraklar(timeoutStep.bayraklar);
    setKararlar((prev) => [...prev, timeoutStep.kararKaydi]);

    if (timeoutStep.ekMesaj) {
      setEkstraMesajlar([timeoutStep.ekMesaj]);
    }

    if (timeoutStep.endGame) {
      setEndGame(timeoutStep.endGame);
      setEndReasons(timeoutStep.endReasons);
      setScreen('result');
    }
    // NOT: Zaman aşımı yeni ziyaret sayılmaz (spec 3.7) -> setZiyaret çağrılmaz
  };

  const handlePlayOtherRole = () => {
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
          lastEvaluatedActionInfo={lastEvaluatedActionInfo}
          onSelectEylem={handleSelectEylem}
          onTimeout={handleTimeout}
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
          onRestart={() => setScreen('intro')}
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
        onContinue={handleContinueAfterWhatHappened}
        onOpenTutorOffer={handleOpenTutorFromOffer}
      />
    </div>
  );
};

export default App;
