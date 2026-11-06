// Model yapılandırması (spec §13.7)
// Adresler commit'e sabit olsun (asla main değil)

export const MODEL_KULLANICI = 'iburakyilmaz';
export const MODEL_REPO = 'se-primer-kotu-son';
export const MODEL_COMMIT = 'c623127a5ea85535de658940a1519b0f721c3471';
export const MODEL_SURUM = 'v2.0';
export const MODEL_SURUMU_TAG = `v2.0@${MODEL_COMMIT.slice(0, 7)}`; // "v2.0@c623127"

export const MODEL_URL = `https://huggingface.co/${MODEL_KULLANICI}/${MODEL_REPO}/resolve/${MODEL_COMMIT}/model.onnx`;
export const CONFIG_URL = `https://huggingface.co/${MODEL_KULLANICI}/${MODEL_REPO}/resolve/${MODEL_COMMIT}/config.json`;

export interface ModelFeature {
  name: string;
  unit: string;
  example: number;
}

export interface ModelConfig {
  title: string;
  target: string;
  task: string;
  classes: string[];
  class_labels: Record<string, string>;
  features: ModelFeature[];
  onnx: {
    input: string;
    input_type: string;
    input_shape: (number | null)[];
    output: string;
    output_shape: (number | null)[];
    positive_index: number;
  };
  yonetmen: {
    destek_esigi: number;
    baski_esigi: number;
  };
  [key: string]: any;
}
