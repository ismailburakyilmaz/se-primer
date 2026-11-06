import * as ort from 'onnxruntime-web';
import {
  MODEL_URL,
  CONFIG_URL,
  MODEL_SURUMU_TAG,
  ModelConfig,
} from '../config/model.js';
import { OturumSatiri } from './iz.js';

// WASM CDN yolu (Prompt A.2)
if (typeof window !== 'undefined' && (ort as any).env?.wasm) {
  (ort as any).env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
  // Önizleme iframe'i crossOriginIsolated değil: çok iş parçacıklı wasm çalışmaz
  (ort as any).env.wasm.numThreads = 1;
  (ort as any).env.wasm.proxy = false;
}

// Teşhis için model durumu (giriş ekranında gösterilir)
export type ModelDurum = { durum: 'yukleniyor' | 'hazir' | 'kapali' | 'sabit' | 'hata'; mesaj: string };
let modelDurum: ModelDurum = { durum: 'yukleniyor', mesaj: 'model yükleniyor…' };
const durumDinleyicileri = new Set<(d: ModelDurum) => void>();
function durumAyarla(d: ModelDurum) {
  modelDurum = d;
  durumDinleyicileri.forEach((f) => f(d));
}
export function getModelDurum(): ModelDurum {
  return modelDurum;
}
export function onModelDurum(f: (d: ModelDurum) => void): () => void {
  durumDinleyicileri.add(f);
  return () => durumDinleyicileri.delete(f);
}

let sessionInstance: ort.InferenceSession | null = null;
let configInstance: ModelConfig | null = null;
let initPromise: Promise<void> | null = null;
let hasWarned = false;
let calismaKuyrugu: Promise<unknown> = Promise.resolve();

// Test kancaları
export function getModelParam(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('model');
}

export function isModelKapali(): boolean {
  return getModelParam() === 'kapali';
}

export function getFixedModelProb(): number | null {
  const param = getModelParam();
  if (param && param.startsWith('sabit:')) {
    const val = parseFloat(param.split(':')[1]);
    if (!isNaN(val)) return val;
  }
  return null;
}

export async function initModel(): Promise<{
  session: ort.InferenceSession | null;
  config: ModelConfig | null;
}> {
  if (isModelKapali()) {
    durumAyarla({ durum: 'kapali', mesaj: 'model kapalı (?model=kapali)' });
    return { session: null, config: null };
  }

  if (initPromise) {
    await initPromise;
    return { session: sessionInstance, config: configInstance };
  }

  initPromise = (async () => {
    try {
      // 1. Config yükle
      const configRes = await fetch(CONFIG_URL);
      if (!configRes.ok) {
        throw new Error(`Config fetch failed: ${configRes.statusText}`);
      }
      configInstance = (await configRes.json()) as ModelConfig;

      // Sabit model parametresi varsa ONNX indirmeyi atla
      if (getFixedModelProb() !== null) {
        durumAyarla({ durum: 'sabit', mesaj: `model sabit p=${getFixedModelProb()}` });
        return;
      }

      // 2. ONNX modelini indir ve oturum oluştur
      const modelRes = await fetch(MODEL_URL);
      if (!modelRes.ok) {
        throw new Error(`Model fetch failed: ${modelRes.statusText}`);
      }
      const modelBuffer = await modelRes.arrayBuffer();
      sessionInstance = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
      });
      durumAyarla({ durum: 'hazir', mesaj: `model ${MODEL_SURUMU_TAG} · hazır` });
    } catch (err: any) {
      durumAyarla({ durum: 'hata', mesaj: `model yüklenemedi: ${String(err?.message || err).slice(0, 80)}` });
      if (!hasWarned) {
        hasWarned = true;
        console.warn(
          'Olay Yönetmeni modeli yüklenemedi; oyun Olağan modda devam ediyor:',
          err?.message || err
        );
      }
      sessionInstance = null;
      configInstance = configInstance || {
        title: 'SE Primer fallback',
        target: 'kotu_son',
        task: '',
        classes: ['iyi son', 'kötü son'],
        class_labels: { '0': 'iyi son', '1': 'kötü son' },
        features: [],
        onnx: {
          input: 'input',
          input_type: 'float32',
          input_shape: [null, 11],
          output: 'probabilities',
          output_shape: [null, 2],
          positive_index: 1,
        },
        yonetmen: { destek_esigi: 0.6, baski_esigi: 0.3 },
      };
    }
  })();

  await initPromise;
  return { session: sessionInstance, config: configInstance };
}

export async function predictKotuSonProb(
  row: Partial<OturumSatiri> | Record<string, number>
): Promise<number | null> {
  // Test kancası: ?model=sabit:<sayı>
  const fixed = getFixedModelProb();
  if (fixed !== null) {
    return fixed;
  }

  // Test kancası: ?model=kapali
  if (isModelKapali()) {
    return null;
  }

  const { session, config } = await initModel();
  if (!session || !config || !config.features || config.features.length === 0) {
    return null;
  }

  try {
    const inputName = config.onnx?.input || 'input';
    const outputName = config.onnx?.output || 'probabilities';
    const positiveIdx = config.onnx?.positive_index ?? 1;

    // config.features sırasıyla değerleri al
    const featureValues = new Float32Array(
      config.features.map((f) => {
        const val = (row as any)[f.name];
        return typeof val === 'number' ? val : 0;
      })
    );

    const tensor = new ort.Tensor('float32', featureValues, [1, config.features.length]);
    // onnxruntime-web aynı oturumda eşzamanlı çalıştırmaya izin vermez: çağrılar sıraya alınır
    const calistir = calismaKuyrugu.then(() => session.run({ [inputName]: tensor }));
    calismaKuyrugu = calistir.catch(() => undefined);
    const results = await calistir;
    const outputTensor = results[outputName];
    if (!outputTensor || !outputTensor.data) {
      return null;
    }

    const prob = Number(outputTensor.data[positiveIdx]);
    return isNaN(prob) ? null : prob;
  } catch (err) {
    if (!hasWarned) {
      hasWarned = true;
      console.warn('Model çıkarımı sırasında hata:', err);
    }
    return null;
  }
}

export function computeYonetmenModu(
  p: number | null,
  isVeriMode: boolean = false
): 'olagan' | 'destek' | 'baski' {
  // Veri toplama modunda model gölgedir, Yönetmen daima olağan kalır (spec §13.6)
  if (isVeriMode) {
    return 'olagan';
  }

  if (p === null) {
    return 'olagan';
  }

  const destekEsigi = configInstance?.yonetmen?.destek_esigi ?? 0.6;
  const baskiEsigi = configInstance?.yonetmen?.baski_esigi ?? 0.3;

  if (p >= destekEsigi) {
    return 'destek';
  }
  if (p < baskiEsigi) {
    return 'baski';
  }
  return 'olagan';
}

export { MODEL_SURUMU_TAG };
