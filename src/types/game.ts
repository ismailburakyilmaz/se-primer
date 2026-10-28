export type Seviye = 'Yeni başladım' | 'Deneyimliyim';
export type Rol = 'backend' | 'lider';
export type Hedef = 'Öğrenmek' | 'Mülakat pratiği' | 'Baskı altında karar';

export type EylemTuru = 'onerilen' | 'kabul_edilebilir' | 'geciktiren' | 'tehlikeli' | 'kirmizi_cizgi';

export interface Kanit {
  id: string;
  etiket: 'Doğrulandı' | 'Belirti' | 'Varsayım' | 'Bilinmiyor';
  metin_backend: string;
  metin_lider: string;
}

export interface Mesaj {
  kisi: string;
  metin: string;
}

export interface Eylem {
  id: string;
  metin_backend: string;
  metin_lider: string;
  tur: EylemTuru;
  sure_dk: number;
  etkiler: {
    risk: number;
    koordinasyon: {
      backend: number;
      lider: number;
    };
    bayraklar?: Record<string, boolean>;
  };
  sonraki: string;
  toparlanma?: boolean;
  etki_sifirla?: boolean;
  ek_mesaj?: Mesaj;
  ne_oldu: string;
  neden_oldu: string;
  neden_oldu_uzun?: string;
  degerlendirme: {
    o_an: string;
    sonradan: string;
    varsayim: string;
  };
}

export interface Sahne {
  id: string;
  baslik: string;
  hizmet: 'bozuk' | 'cokmus' | 'kismi' | 'duzeldi';
  giris_etkisi?: { etki: number };
  kanitlar: Kanit[];
  mesajlar: Mesaj[];
  kayitli_anlatim: string;
  hazir_ipucu: string;
  ogrenme_odagi: string;
  yasak_kelimeler: string[];
  eylemler: Eylem[];
}

export interface KararKaydi {
  saat: string;
  kararMetni: string;
  oAn: string;
  sonradan: string;
  varsayim?: string;
  isZamanAsimi?: boolean;
}

export interface Terim {
  id: string;
  terim: string;
  eslesme: string[];
  tanim: string;
}

export interface EvalInput {
  id: string;
  sahne: string;
  rol: 'backend' | 'lider';
  seviye: Seviye;
  hedef: Hedef;
  tur: string;
  onceki_kararlar: string[];
  ogrenci_girdisi: string;
  beklenen: string;
}
