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
  guvenilmez?: boolean;
  celisen_log?: string;
}

export interface Karakter {
  ad: string;
  gorev: string;
  tanim: string;
}

export interface LogSatiri {
  id: string;
  saat: string;
  kaynak: string;
  etiket: 'Doğrulandı' | 'Belirti' | 'Varsayım' | 'Bilinmiyor';
  metin_backend: string;
  metin_lider: string;
  anahtar: string[];
  gurultu: boolean;
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
    o_an_mantigi?: string;
  };
  harita_dokunus?: string | null;
  mudur_onerisi?: boolean;
  yetki_disi?: boolean;
  veri_korumayan?: boolean;
  seytanin_avukati?: {
    kisi: string;
    metin: string;
    kaygi: string;
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
  kayitli_anlatim_kisa?: string;
  hazir_ipucu: string;
  ogrenme_odagi: string;
  yasak_kelimeler: string[];
  eylemler: Eylem[];
  loglar?: LogSatiri[];
  konsol_onerileri?: string[];
  harita?: Record<string, string>;
  yonetmen?: {
    destek?: { kisi: string; metin: string };
    baski?: { kisi: string; metin: string };
  };
}

export interface KararKaydi {
  saat: string;
  kararMetni: string;
  oAn: string;
  sonradan: string;
  varsayim?: string;
  oAnMantigi?: string;
  mulakatMetni?: string;
  savunmaMetni?: string;
  eylemId?: string;
  eylemTur?: string;
  sahneId?: string;
  mudurOnerisi?: boolean;
  yetkiDisi?: boolean;
  veriKorumayan?: boolean;
  guvenilmezMesajUyarisi?: {
    soru: string;
    sahibi: string;
    metin: string;
  };
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

