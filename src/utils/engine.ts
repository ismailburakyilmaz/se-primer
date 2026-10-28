import scenarioData from '../../scenarios/sabah-randevu.json' assert { type: 'json' };
import glossaryData from '../../content/glossary.json' assert { type: 'json' };
import evalData from '../../content/eval_inputs.json' assert { type: 'json' };
import { Sahne, Eylem, KararKaydi, Rol, Seviye, Hedef } from '../types/game.js';

export const SCENARIO = scenarioData as any;
export const GLOSSARY = glossaryData.terimler as any[];
export const EVAL_INPUTS = evalData.girdiler as any[];

export function formatClock(minutesFromStart: number): string {
  const startMinute = 8 * 60; // 08:00
  const total = startMinute + minutesFromStart;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function getSahne(sahneId: string): Sahne | undefined {
  return SCENARIO.sahneler.find((s: any) => s.id === sahneId);
}

export function getCoordLabel(val: number): string {
  const labels = SCENARIO.kurallar.koordinasyon_seviyeleri || ['Dağınık', 'Yeterli', 'Güçlü'];
  const clamped = Math.max(0, Math.min(2, val));
  return labels[clamped];
}

export interface StepResult {
  nextSahneId: string;
  sureDk: number;
  etki: number;
  maxEtki: number;
  risk: number;
  koordinasyon: number;
  bayraklar: Record<string, boolean>;
  kararKaydi: KararKaydi;
  endGame: 'alindi' | 'alinamadi' | 'ihlal' | null;
  endReasons: string[];
  ekMesaj?: { kisi: string; metin: string };
}

export function processDecision(params: {
  currentSahne: Sahne;
  eylem: Eylem;
  rol: Rol;
  hedef: Hedef;
  sureDk: number;
  etki: number;
  maxEtki: number;
  risk: number;
  koordinasyon: number;
  bayraklar: Record<string, boolean>;
  decisionCount: number;
}): StepResult {
  const { currentSahne, eylem, rol, hedef, sureDk, etki, maxEtki, risk, koordinasyon, bayraklar, decisionCount } = params;

  // 1. Ek süre kuralı: Dağınık iken +5 dk
  const daginikEk = koordinasyon === 0 ? SCENARIO.kurallar.daginik_ek_sure_dk : 0;
  const eyleminSuresi = eylem.sure_dk + daginikEk;
  const newSure = sureDk + eyleminSuresi;

  // 2. Etki artışı: sahnenin hizmet durumuna göre dakika başına
  const perMinuteRate = SCENARIO.kurallar.etki_artisi_dakika_basina[currentSahne.hizmet] ?? 0;
  let newEtki = etki + (perMinuteRate * eyleminSuresi);

  // Eğer eylem etki_sifirla ise
  if (eylem.etki_sifirla) {
    newEtki = 0;
  }

  // 3. Risk artışı
  const newRisk = risk + (eylem.etkiler.risk || 0);

  // 4. Koordinasyon değişimi (0-2 arasında tutulur)
  const coordDelta = eylem.etkiler.koordinasyon[rol] || 0;
  const newCoord = Math.max(0, Math.min(2, koordinasyon + coordDelta));

  // 5. Bayraklar
  const newBayraklar = { ...bayraklar, ...(eylem.etkiler.bayraklar || {}) };

  // 6. Sonraki sahne girişi etkisi (varsa)
  const nextSahne = getSahne(eylem.sonraki);
  if (nextSahne && nextSahne.giris_etkisi?.etki) {
    newEtki += nextSahne.giris_etkisi.etki;
  }

  const newMaxEtki = Math.max(maxEtki, newEtki);

  // Karar kaydı
  const kararMetni = rol === 'backend' ? eylem.metin_backend : eylem.metin_lider;
  const kararKaydi: KararKaydi = {
    saat: formatClock(newSure),
    kararMetni,
    oAn: eylem.degerlendirme.o_an,
    sonradan: eylem.degerlendirme.sonradan,
    varsayim: eylem.degerlendirme.varsayim,
  };

  // 7. Bitiş kontrol sırası (spec §3.8):
  // 1. Seçilen eylem kirmizi_cizgi ise -> Veri ihlali
  // 2. Veri riski >= 100 veya olay süresi > 100 dk ise -> Kontrol altına alınamadı
  // 3. hizmet_duzeldi, uzlastirildi ve devredildi doğruysa -> Kontrol altına alındı
  // 4. Karar sayısı 8'e ulaştıysa -> Kontrol altına alınamadı
  let endGame: 'alindi' | 'alinamadi' | 'ihlal' | null = null;
  const endReasons: string[] = [];

  if (eylem.tur === 'kirmizi_cizgi') {
    endGame = 'ihlal';
  } else if (newRisk >= SCENARIO.kurallar.risk_kayip_esigi || newSure > SCENARIO.baslangic.butce_dk) {
    endGame = 'alinamadi';
    if (newSure > SCENARIO.baslangic.butce_dk) {
      endReasons.push(SCENARIO.sonlar.alinamadi.nedenler.sure);
    }
    if (newRisk >= SCENARIO.kurallar.risk_kayip_esigi) {
      endReasons.push(SCENARIO.sonlar.alinamadi.nedenler.risk);
    }
  } else if (newBayraklar.hizmet_duzeldi && newBayraklar.uzlastirildi && newBayraklar.devredildi) {
    endGame = 'alindi';
  } else if (decisionCount + 1 >= SCENARIO.kurallar.karar_siniri) {
    endGame = 'alinamadi';
    endReasons.push(SCENARIO.sonlar.alinamadi.nedenler.karar_siniri);
  }

  return {
    nextSahneId: eylem.sonraki,
    sureDk: newSure,
    etki: newEtki,
    maxEtki: newMaxEtki,
    risk: newRisk,
    koordinasyon: newCoord,
    bayraklar: newBayraklar,
    kararKaydi,
    endGame,
    endReasons,
    ekMesaj: eylem.ek_mesaj,
  };
}

export function processTimeout(params: {
  currentSahne: Sahne;
  sureDk: number;
  etki: number;
  maxEtki: number;
  risk: number;
  koordinasyon: number;
  bayraklar: Record<string, boolean>;
  decisionCount: number;
}): StepResult {
  const { currentSahne, sureDk, etki, maxEtki, risk, koordinasyon, bayraklar, decisionCount } = params;

  // spec §3.7: olay süresine 15 dk eklenir, etki 15 dk normal kurala göre artar
  const timeoutMins = SCENARIO.kurallar.zaman_asimi_dk || 15;
  const newSure = sureDk + timeoutMins;
  const perMinuteRate = SCENARIO.kurallar.etki_artisi_dakika_basina[currentSahne.hizmet] ?? 0;
  const newEtki = etki + (perMinuteRate * timeoutMins);
  const newMaxEtki = Math.max(maxEtki, newEtki);

  const kararKaydi: KararKaydi = {
    saat: formatClock(newSure),
    kararMetni: 'Karar verilmedi; olay 15 dakika ilerledi.',
    oAn: 'Karar sayacı doldu; müdahale gecikti.',
    sonradan: 'Bekleme süresince randevu talepleri ve kuyruk birikmeye devam etti.',
    varsayim: 'Karar vermeyi ertelemenin yeni bilgi getireceğini varsaydın.',
    isZamanAsimi: true,
  };

  let endGame: 'alindi' | 'alinamadi' | 'ihlal' | null = null;
  const endReasons: string[] = [];

  if (newSure > SCENARIO.baslangic.butce_dk) {
    endGame = 'alinamadi';
    endReasons.push(SCENARIO.sonlar.alinamadi.nedenler.sure);
  } else if (decisionCount + 1 >= SCENARIO.kurallar.karar_siniri) {
    endGame = 'alinamadi';
    endReasons.push(SCENARIO.sonlar.alinamadi.nedenler.karar_siniri);
  }

  return {
    nextSahneId: currentSahne.id,
    sureDk: newSure,
    etki: newEtki,
    maxEtki: newMaxEtki,
    risk,
    koordinasyon,
    bayraklar,
    kararKaydi,
    endGame,
    endReasons,
    ekMesaj: SCENARIO.kurallar.zaman_asimi_mesaji,
  };
}
