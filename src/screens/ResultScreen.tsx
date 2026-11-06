import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { RubberStamp } from '../components/RubberStamp.js';
import { triggerStamp } from '../utils/stampNotification.js';
import { OturumSatiri, downloadTraceCSV, shareTraceCSV, canShareTraceFiles } from '../utils/iz.js';
import { KararKaydi, Hedef, Rol, LogSatiri, Sahne } from '../types/game.js';
import { SCENARIO, formatClock, getCoordLabel, getSahne } from '../utils/engine.js';

interface Props {
  endGame: 'alindi' | 'alinamadi' | 'ihlal';
  endReasons: string[];
  kararlar: KararKaydi[];
  sureDk: number;
  etki: number;
  maxEtki: number;
  risk: number;
  koordinasyon: number;
  hedef: Hedef;
  currentRol: Rol;
  isVeriMode?: boolean;
  oturumTrace?: OturumSatiri[];
  oturumId?: string;
  markedLogs?: LogSatiri[];
  yonetmenIzi?: { sahneId: string; mod: 'destek' | 'baski'; saat: string }[];
  onPlayOtherRole: () => void;
  onRestart: () => void;
}

function computeKararTarzi(
  kararlar: KararKaydi[],
  oturumTrace: OturumSatiri[]
): { key: string; ad: string; aciklama: string } {
  const rules = SCENARIO.profil_kurallari || {};
  const total = kararlar.length;
  if (total === 0) {
    return {
      key: 'dengeli',
      ad: rules.dengeli?.ad || 'Dengeli',
      aciklama: rules.dengeli?.aciklama || '',
    };
  }

  // 1. kanitci: konsol_arama > 0 olan kararların oranı >= 0.5
  const searchCount = oturumTrace.filter((r) => Number(r.konsol_arama) > 0).length;
  const isKanitci = total > 0 && searchCount / total >= 0.5;

  // 2. aceleci: karar_suresi_sn < 10 && konsol_arama == 0 olan kararların oranı >= 0.5
  const fastNoSearchCount = oturumTrace.filter(
    (r) => Number(r.karar_suresi_sn) < 10 && Number(r.konsol_arama) === 0
  ).length;
  const isAceleci = total > 0 && fastNoSearchCount / total >= 0.5;

  // 3. otoriteye_uyan: seçilen eylemlerden birinde mudur_onerisi: true
  const isOtoriteyeUyan = kararlar.some((k) => k.mudurOnerisi);

  // 4. yetki_zorlayan: yetki_disi: true olan bir eylem seçildi
  const isYetkiZorlayan = kararlar.some((k) => k.yetkiDisi);

  // 5. veriyi_hafife_alan: veri_korumayan: true olan bir eylem seçildi
  const isVeriyiHafifeAlan = kararlar.some((k) => k.veriKorumayan);

  const matches: Record<string, boolean> = {
    veriyi_hafife_alan: isVeriyiHafifeAlan,
    yetki_zorlayan: isYetkiZorlayan,
    otoriteye_uyan: isOtoriteyeUyan,
    aceleci: isAceleci,
    kanitci: isKanitci,
    dengeli: true,
  };

  const priorityOrder: string[] = rules.oncelik || [
    'veriyi_hafife_alan',
    'yetki_zorlayan',
    'otoriteye_uyan',
    'aceleci',
    'kanitci',
    'dengeli',
  ];

  for (const key of priorityOrder) {
    if (matches[key]) {
      const conf = rules[key] || { ad: key, aciklama: '' };
      return { key, ad: conf.ad, aciklama: conf.aciklama };
    }
  }

  return {
    key: 'dengeli',
    ad: rules.dengeli?.ad || 'Dengeli',
    aciklama: rules.dengeli?.aciklama || '',
  };
}

function shuffleList<T>(items: T[], seedStr: string): T[] {
  return [...items].sort((a: any, b: any) => {
    const strA = (a.id || a.metin || '') + seedStr;
    const strB = (b.id || b.metin || '') + seedStr;
    let hashA = 0;
    for (let i = 0; i < strA.length; i++) {
      hashA = (hashA * 31 + strA.charCodeAt(i)) | 0;
    }
    let hashB = 0;
    for (let i = 0; i < strB.length; i++) {
      hashB = (hashB * 31 + strB.charCodeAt(i)) | 0;
    }
    return hashA - hashB;
  });
}

export const ResultScreen: React.FC<Props> = ({
  endGame,
  endReasons,
  kararlar,
  sureDk,
  etki,
  maxEtki,
  risk,
  koordinasyon,
  hedef,
  currentRol,
  isVeriMode = false,
  oturumTrace = [],
  oturumId = '',
  yonetmenIzi = [],
  markedLogs = [],
  onPlayOtherRole,
  onRestart,
}) => {
  const sonConfig = SCENARIO.sonlar[endGame];
  const clock = formatClock(sureDk);
  const totalKarar = kararlar.length;
  const reportRef = useRef<HTMLDivElement>(null);
  const [canShare, setCanShare] = useState<boolean>(false);

  // Karar Tarzı (spec §15.3, DESIGN.md §9)
  const kararTarzi = useMemo(
    () => computeKararTarzi(kararlar, oturumTrace),
    [kararlar, oturumTrace]
  );

  // Postmortem (Obra Dinn, spec §15.5, DESIGN.md §9)
  const postmortemDef = SCENARIO.postmortem || {};
  const [selectedPm, setSelectedPm] = useState({
    kok_neden: '',
    tetikleyici: '',
    kalici_duzeltme: '',
  });
  const [pmError, setPmError] = useState<string>('');
  const [postmortemSuccess, setPostmortemSuccess] = useState<boolean>(false);

  // Shuffled postmortem options
  const shuffledPmOptions = useMemo(() => {
    return {
      kok_neden: shuffleList(postmortemDef.kok_neden?.secenekler || [], oturumId + '_kn'),
      tetikleyici: shuffleList(postmortemDef.tetikleyici?.secenekler || [], oturumId + '_tt'),
      kalici_duzeltme: shuffleList(postmortemDef.kalici_duzeltme?.secenekler || [], oturumId + '_kd'),
    };
  }, [postmortemDef, oturumId]);

  const handleVerifyPostmortem = () => {
    const knCorrect = postmortemDef.kok_neden?.secenekler?.find((o: any) => o.id === selectedPm.kok_neden)?.dogru;
    const ttCorrect = postmortemDef.tetikleyici?.secenekler?.find((o: any) => o.id === selectedPm.tetikleyici)?.dogru;
    const kdCorrect = postmortemDef.kalici_duzeltme?.secenekler?.find((o: any) => o.id === selectedPm.kalici_duzeltme)?.dogru;

    if (knCorrect && ttCorrect && kdCorrect) {
      setPostmortemSuccess(true);
      setPmError('');
      triggerStamp({
        text: 'POSTMORTEM ONAYLANDI',
        type: 'ONAYLANDI',
        description: 'Postmortem başarıyla tamamlandı',
      });
    } else {
      setPostmortemSuccess(false);
      setPmError('Üçü birden doğru değil.');
    }
  };

  // Sully Tekrar ("O Anın Bilgisiyle", spec §15.6, DESIGN.md §9)
  const [selectedSullyDecision, setSelectedSullyDecision] = useState<KararKaydi | null>(null);
  const [sullyFeedback, setSullyFeedback] = useState<string>('');

  const sullyScene: Sahne | undefined = useMemo(() => {
    if (!selectedSullyDecision?.sahneId) return undefined;
    return getSahne(selectedSullyDecision.sahneId);
  }, [selectedSullyDecision?.sahneId]);

  // Report PNG download (spec §15.4, DESIGN.md §9)
  const handleDownloadReportPng = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#F3EEE3',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `se-primer-rapor-${oturumId || 'oturum'}.png`;
      link.click();
    } catch (e) {
      console.error('Report png export error', e);
    }
  };

  useEffect(() => {
    setCanShare(canShareTraceFiles());
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    triggerStamp({
      text: sonConfig.damga,
      description: sonConfig.baslik,
    });
  }, [sonConfig.damga, sonConfig.baslik]);

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 bg-[var(--kagit)] min-h-screen flex flex-col justify-between animate-scene-enter">
      <div ref={reportRef} className="animate-rapor-bas p-2 sm:p-4 bg-[var(--kagit)]">
        {/* Fiş Başlığı per DESIGN.md §5 */}
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-4">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
            OLAY RAPORU · No: 0428
          </div>
          <div className="font-mono-code text-[12px] text-[var(--soluk)]">
            ŞİFA HASTANESİ
          </div>
        </div>

        {/* Sonuç Damgası ve Başlık */}
        <div className="my-5 flex flex-col items-center text-center">
          <RubberStamp
            text={sonConfig.damga}
            testId="son-damga"
            large
            bas={true}
            className="mb-3 animate-stamp-press"
          />
          <h1 className="font-serif-heading text-[26px] font-semibold text-[var(--murekkep)] mb-2">
            {sonConfig.baslik}
          </h1>

          <p className="text-[14px] text-[var(--soluk)] max-w-md leading-relaxed">
            {sonConfig.aciklama}
          </p>

          {/* Kontrol altına alınamadı ise neden(ler) */}
          {endGame === 'alinamadi' && endReasons.length > 0 && (
            <div className="mt-3 p-3 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] text-left w-full">
              <span className="font-mono-code text-[12px] font-semibold text-[var(--damga)] uppercase block mb-1">
                KONTROL DIŞINA ÇIKMA NEDENLERİ:
              </span>
              <ul className="list-disc list-inside text-[13px] text-[var(--murekkep)] space-y-1">
                {endReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Karar Tarzın (spec §15.3, DESIGN.md §9) */}
        <div
          data-testid="karar-tarzi"
          className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 my-4"
        >
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-1">
            KARAR TARZIN
          </span>
          <h2 className="font-serif-heading text-[20px] font-semibold text-[var(--murekkep)] mb-1">
            {kararTarzi.ad}
          </h2>
          <p className="text-[14px] text-[var(--soluk)] leading-relaxed">
            {kararTarzi.aciklama}
          </p>
        </div>

        {/* Olay Yönetmeni izi (spec §7, §13.5) */}
        {yonetmenIzi.length > 0 && (
          <div
            data-testid="yonetmen-izi"
            className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 my-4"
          >
            <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-2">
              OLAY YÖNETMENİ İZİ
            </span>
            <ul className="space-y-2">
              {yonetmenIzi.map((iz, i) => (
                <li key={i} className="flex items-center gap-2 text-[14px] text-[var(--murekkep)]">
                  <RubberStamp
                    text={iz.mod === 'destek' ? 'DESTEK' : 'BASKI'}
                    type={iz.mod === 'destek' ? 'BULUNDU' : 'BASKI'}
                    className="text-[12px] py-0 px-1"
                  />
                  <span>
                    Olay Yönetmeni {iz.saat} · {iz.sahneId} sahnesinde {iz.mod === 'destek' ? 'Destek' : 'Baskı'} modunda devreye girdi.
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Özet Satırı ve Son Göstergeler */}
        <div className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 my-4">
          <div className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider mb-2">
            OLAY KAPANIŞ GÖSTERGELERİ
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)]">
              <span className="font-mono-code text-[12px] text-[var(--soluk)] block uppercase">SÜRE</span>
              <span className="font-mono-code text-[15px] font-bold text-[var(--murekkep)]">{sureDk} dk</span>
              <span className="text-[12px] text-[var(--soluk)] font-mono-code block">({clock})</span>
            </div>
            <div className="p-2 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)]">
              <span className="font-mono-code text-[12px] text-[var(--soluk)] block uppercase">KARAR</span>
              <span className="font-mono-code text-[15px] font-bold text-[var(--murekkep)]">{totalKarar}</span>
              <span className="text-[12px] text-[var(--soluk)] font-mono-code block">karar verildi</span>
            </div>
            <div className="p-2 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)]">
              <span className="font-mono-code text-[12px] text-[var(--soluk)] block uppercase">VERİ RİSKİ</span>
              <span className={`font-mono-code text-[15px] font-bold ${risk >= 70 ? 'text-[var(--damga)]' : 'text-[var(--murekkep)]'}`}>
                {risk} / 100
              </span>
              <span className="text-[12px] text-[var(--soluk)] font-mono-code block">risk puanı</span>
            </div>
            <div className="p-2 border border-[var(--cizgi)] rounded-[4px] bg-[var(--kagit)]">
              <span className="font-mono-code text-[12px] text-[var(--soluk)] block uppercase">EKİBİN GÜVENİ</span>
              <span className="font-mono-code text-[13px] font-bold text-[var(--murekkep)]">
                {getCoordLabel(koordinasyon)}
              </span>
              <span className="text-[12px] text-[var(--soluk)] font-mono-code block">seviye</span>
            </div>
          </div>
          <div className="mt-2 text-center text-[12px] text-[var(--soluk)] font-mono-code">
            En yüksek bekleyen talep etkisi: <strong className="text-[var(--murekkep)]">{maxEtki}</strong>
          </div>
        </div>

        {/* Suçlamasız Değerlendirme (Blameless Post-Mortem) */}
        <div className="my-6">
          <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-1 mb-3">
            <span className="font-mono-code text-[12px] font-semibold text-[var(--murekkep)] uppercase tracking-wider">
              SUÇLAMASIZ DEĞERLENDİRME
            </span>
            <span className="font-mono-code text-[12px] text-[var(--soluk)]">
              ZAMAN ÇİZELGESİ
            </span>
          </div>

          <div className="space-y-4">
            {kararlar.map((k, idx) => (
              <div
                key={idx}
                data-testid={`degerlendirme-satir-${idx}`}
                className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-3 text-[14px]"
              >
                <div className="flex items-baseline justify-between border-b border-[var(--cizgi)] pb-1 mb-2">
                  <span className="font-mono-code text-[12px] font-bold text-[var(--tukenmez)]">
                    #{idx + 1} ADIM · {k.saat}
                  </span>
                  {k.isZamanAsimi && (
                    <span className="font-mono-code text-[12px] text-[var(--pas)] font-bold">
                      ZAMAN AŞIMI
                    </span>
                  )}
                </div>

                <div className="font-medium text-[var(--murekkep)] mb-2">
                  "{k.kararMetni}"
                </div>

                <div className="space-y-2 text-[13px]">
                  <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                    <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase block mb-0.5">
                      O AN BİLDİKLERİN:
                    </span>
                    <span className="text-[var(--murekkep)]">{k.oAn}</span>
                  </div>

                  <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                    <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase block mb-0.5">
                      SONRADAN ÖĞRENDİKLERİN:
                    </span>
                    <span className="text-[var(--murekkep)]">{k.sonradan}</span>
                  </div>

                  {/* Dekker'in Sorusu (spec §7, §15.8, DESIGN.md §9) */}
                  <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                    <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase block mb-0.5">
                      BU KARAR O AN NEDEN MANTIKLIYDI?
                    </span>
                    <span className="text-[var(--murekkep)] leading-relaxed">
                      {k.oAnMantigi || (k.isZamanAsimi
                        ? 'Karar vermemek de bir karardı: o an bilgi eksikti ve her seçeneğin bir bedeli vardı.'
                        : k.oAn)}
                    </span>
                  </div>

                  {/* Güvenilmez Kaynak Uyarısı (spec §7, Prompt 3 madde 6) */}
                  {k.guvenilmezMesajUyarisi && (
                    <div
                      data-testid="guvenilmez-not"
                      className="p-2.5 bg-[var(--kagit)] border border-[var(--damga)] rounded-[2px] text-[13px] text-[var(--murekkep)]"
                    >
                      <div className="font-mono-code text-[12px] font-bold text-[var(--damga)] uppercase tracking-wider mb-1">
                        {k.guvenilmezMesajUyarisi.soru}
                      </div>
                      <div className="text-[13px] text-[var(--soluk)]">
                        <span className="font-semibold text-[var(--murekkep)]">
                          {k.guvenilmezMesajUyarisi.sahibi}:
                        </span>{' '}
                        "{k.guvenilmezMesajUyarisi.metin}"
                      </div>
                    </div>
                  )}

                  {hedef === 'Mülakat pratiği' && (
                    <>
                      {k.varsayim && (
                        <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                          <span className="font-mono-code text-[12px] font-bold text-[var(--tukenmez)] uppercase block mb-0.5">
                            VARSAYIMIN:
                          </span>
                          <span className="text-[var(--murekkep)] italic">{k.varsayim}</span>
                        </div>
                      )}
                      {k.mulakatMetni && (
                        <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                          <span className="font-mono-code text-[12px] font-bold text-[var(--tukenmez)] uppercase block mb-0.5">
                            SENİN CÜMLEN:
                          </span>
                          <span className="text-[var(--murekkep)]">{k.mulakatMetni}</span>
                        </div>
                      )}
                      {k.savunmaMetni && (
                        <div className="bg-[var(--kagit)] p-2 rounded-[2px] border border-[var(--cizgi)]">
                          <span className="font-mono-code text-[12px] font-bold text-[var(--tukenmez)] uppercase block mb-0.5">
                            SAVUNMAN:
                          </span>
                          <span className="text-[var(--murekkep)]">{k.savunmaMetni}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* O anın bilgisiyle incele butonu */}
                {k.sahneId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSullyDecision(k);
                      setSullyFeedback('');
                    }}
                    className="mt-2.5 text-[12px] font-mono-code text-[var(--tukenmez)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    O anın bilgisiyle incele →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Postmortem (Obra Dinn, spec §15.5, DESIGN.md §9) */}
        <div className="bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] p-4 my-6">
          <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-3">
            <div>
              <span className="font-mono-code text-[12px] font-semibold text-[var(--murekkep)] uppercase tracking-wider block">
                OLAY POSTMORTEMİ
              </span>
              <span className="text-[12px] text-[var(--soluk)]">
                Return of the Obra Dinn esiniyle: Olayın üç unsurunu belirle.
              </span>
            </div>
            {postmortemSuccess && (
              <RubberStamp
                text="POSTMORTEM ONAYLANDI"
                bas={true}
                className="animate-stamp-press text-[var(--onay)]"
              />
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="pm-kok-neden"
                className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase block mb-1"
              >
                1. KÖK NEDEN
              </label>
              <select
                id="pm-kok-neden"
                data-testid="postmortem-kok_neden"
                value={selectedPm.kok_neden}
                onChange={(e) => {
                  setSelectedPm({ ...selectedPm, kok_neden: e.target.value });
                  setPmError('');
                }}
                className="w-full p-2 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] text-[13px] text-[var(--murekkep)] font-sans focus:outline-none focus:border-[var(--murekkep)]"
              >
                <option value="">Seçiniz...</option>
                {shuffledPmOptions.kok_neden.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.metin}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="pm-tetikleyici"
                className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase block mb-1"
              >
                2. TETİKLEYİCİ
              </label>
              <select
                id="pm-tetikleyici"
                data-testid="postmortem-tetikleyici"
                value={selectedPm.tetikleyici}
                onChange={(e) => {
                  setSelectedPm({ ...selectedPm, tetikleyici: e.target.value });
                  setPmError('');
                }}
                className="w-full p-2 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] text-[13px] text-[var(--murekkep)] font-sans focus:outline-none focus:border-[var(--murekkep)]"
              >
                <option value="">Seçiniz...</option>
                {shuffledPmOptions.tetikleyici.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.metin}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="pm-kalici-duzeltme"
                className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase block mb-1"
              >
                3. KALICI DÜZELTME
              </label>
              <select
                id="pm-kalici-duzeltme"
                data-testid="postmortem-kalici_duzeltme"
                value={selectedPm.kalici_duzeltme}
                onChange={(e) => {
                  setSelectedPm({ ...selectedPm, kalici_duzeltme: e.target.value });
                  setPmError('');
                }}
                className="w-full p-2 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] text-[13px] text-[var(--murekkep)] font-sans focus:outline-none focus:border-[var(--murekkep)]"
              >
                <option value="">Seçiniz...</option>
                {shuffledPmOptions.kalici_duzeltme.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.metin}
                  </option>
                ))}
              </select>
            </div>

            {pmError && (
              <div className="font-mono-code text-[13px] text-[var(--damga)] font-medium">
                {pmError}
              </div>
            )}

            {!postmortemSuccess && (
              <button
                type="button"
                data-testid="postmortem-onayla"
                onClick={handleVerifyPostmortem}
                className="w-full h-10 bg-[var(--murekkep)] hover:opacity-95 text-white font-mono-code text-[13px] rounded-[4px] cursor-pointer mt-1"
              >
                Onayla
              </button>
            )}
          </div>
        </div>

        {/* Bu Olaydan Tek İlke */}
        <div className="my-6 bg-[var(--fis)] border border-[var(--murekkep)] rounded-[4px] p-4 text-center">
          <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider block mb-1">
            BU OLAYDAN TEK İLKE
          </span>
          <div
            data-testid="son-ilke"
            className="font-serif-heading text-[17px] font-semibold text-[var(--murekkep)] italic leading-relaxed"
          >
            "{sonConfig.ilke}"
          </div>
        </div>
      </div>

      {/* "O Anın Bilgisiyle" Modal (Sully, spec §15.6, DESIGN.md §9) */}
      {selectedSullyDecision && sullyScene && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
          <div
            data-testid="tekrar-o-an"
            className="w-full sm:max-w-lg bg-[var(--fis)] border border-[var(--cizgi)] rounded-t-[4px] sm:rounded-[4px] p-5 text-[var(--murekkep)] max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-3">
              <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
                O AN BİLDİKLERİN · {selectedSullyDecision.saat}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSullyDecision(null);
                  setSullyFeedback('');
                }}
                className="text-[12px] font-mono-code text-[var(--soluk)] hover:text-[var(--murekkep)] px-2 py-0.5 border border-[var(--cizgi)] rounded-[2px] cursor-pointer"
              >
                Kapat
              </button>
            </div>

            {/* O Anki Kanıtlar */}
            <div className="mb-4">
              <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase tracking-wider block mb-1.5">
                O ANIN KANITLARI
              </span>
              <div className="space-y-1.5">
                {sullyScene.kanitlar.map((k, i) => (
                  <div
                    key={i}
                    className="p-2 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] text-[13px]"
                  >
                    <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] block uppercase">
                      {k.etiket}
                    </span>
                    <span>{currentRol === 'backend' ? k.metin_backend : k.metin_lider}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* İşaretlenen Log Satırları */}
            <div className="mb-4">
              <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase tracking-wider block mb-1.5">
                İŞARETLEDİĞİN LOG SATIRLARI
              </span>
              {markedLogs.length > 0 ? (
                <div className="space-y-1">
                  {markedLogs.map((l, i) => (
                    <div
                      key={i}
                      className="p-1.5 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] font-mono-code text-[12px]"
                    >
                      <span className="text-[var(--soluk)] mr-1.5">{l.saat}</span>
                      <span>{currentRol === 'backend' ? l.metin_backend : l.metin_lider}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 border border-dashed border-[var(--cizgi)] text-[12px] text-[var(--soluk)] font-mono-code">
                  Henüz işaretlenmiş log satırı yoktu.
                </div>
              )}
            </div>

            {/* O anki Mesajlar */}
            {sullyScene.mesajlar && sullyScene.mesajlar.length > 0 && (
              <div className="mb-4">
                <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase tracking-wider block mb-1.5">
                  EKİP MESAJLARI
                </span>
                <div className="space-y-1.5">
                  {sullyScene.mesajlar.map((m, i) => (
                    <div
                      key={i}
                      className="p-2 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] text-[13px]"
                    >
                      <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] block uppercase">
                        {m.kisi}
                      </span>
                      <span>{m.metin}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sonraki Sahnelerin Kanıtları (Kesik çerçeveli boş kutular) */}
            <div className="mb-4">
              <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase tracking-wider block mb-1.5">
                SONRAKİ BİLGİLER
              </span>
              <div className="p-3 border border-dashed border-[var(--cizgi)] rounded-[2px] text-center font-mono-code text-[12px] text-[var(--soluk)]">
                henüz bilinmiyor
              </div>
            </div>

            {/* O Anki Eylemler */}
            <div className="mb-2">
              <span className="font-mono-code text-[12px] font-bold text-[var(--soluk)] uppercase tracking-wider block mb-1.5">
                O ANKİ SEÇENEKLER
              </span>
              <div className="space-y-1.5">
                {sullyScene.eylemler.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSullyFeedback('Bu yol o an açıktı.')}
                    className="w-full text-left p-2.5 bg-[var(--kagit)] hover:bg-[var(--fis)] border border-[var(--cizgi)] rounded-[2px] text-[13px] text-[var(--murekkep)] cursor-pointer"
                  >
                    {currentRol === 'backend' ? e.metin_backend : e.metin_lider}
                  </button>
                ))}
              </div>
              {sullyFeedback && (
                <div className="mt-2 font-mono-code text-[12px] text-[var(--tukenmez)] font-semibold">
                  {sullyFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aksiyon Düğmeleri */}
      <div className="space-y-2.5 pt-4 border-t border-[var(--cizgi)]">
        {/* Raporu İndir (spec §15.4, DESIGN.md §9) */}
        <button
          type="button"
          data-testid="dugme-rapor-indir"
          onClick={handleDownloadReportPng}
          className="w-full h-11 bg-[var(--fis)] hover:bg-[var(--kagit)] border border-[var(--murekkep)] text-[var(--murekkep)] font-semibold font-mono-code text-[14px] rounded-[4px] cursor-pointer flex items-center justify-center gap-2"
        >
          Raporu indir
        </button>

        {isVeriMode && oturumTrace.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="dugme-veri-indir"
              onClick={() => downloadTraceCSV(oturumTrace, oturumId || 'anonim')}
              className="flex-1 h-11 bg-[var(--fis)] hover:bg-[var(--kagit)] border border-[var(--tukenmez)] text-[var(--tukenmez)] font-semibold font-mono-code text-[14px] rounded-[4px] cursor-pointer flex items-center justify-center gap-2"
            >
              Oturum verisini indir
            </button>
            {canShare && (
              <button
                type="button"
                data-testid="dugme-veri-gonder"
                onClick={() => shareTraceCSV(oturumTrace, oturumId || 'anonim')}
                className="h-11 px-4 bg-[var(--fis)] hover:bg-[var(--kagit)] border border-[var(--tukenmez)] text-[var(--tukenmez)] font-semibold font-mono-code text-[14px] rounded-[4px] cursor-pointer flex items-center justify-center shrink-0"
              >
                Gönder
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          data-testid="dugme-baska-rol"
          onClick={onPlayOtherRole}
          className="w-full h-12 bg-[var(--tukenmez)] hover:opacity-95 text-white font-medium rounded-[4px] cursor-pointer text-[15px]"
        >
          Başka rolle oyna
        </button>

        <button
          type="button"
          data-testid="dugme-tekrar"
          onClick={onRestart}
          className="w-full h-11 bg-[var(--fis)] hover:bg-[var(--kagit)] border border-[var(--cizgi)] text-[var(--murekkep)] font-medium rounded-[4px] cursor-pointer text-[14px]"
        >
          Tekrar oyna
        </button>
      </div>
    </div>
  );
};
