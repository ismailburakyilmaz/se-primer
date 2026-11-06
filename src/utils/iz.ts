// Oturum izi ve veri toplama yönetimi (spec §13.2, §14, data/SOZLUK.md)

export interface OturumSatiri {
  oturum: string;
  kaynak: 'gercek' | 'sentetik';
  oyuncu_tipi: 'oyuncu' | 'gelistirici' | 'sentetik';
  karar_no: number;
  sahne_id: string;
  eylem_id: string;
  seviye: 0 | 1; // 0: Yeni başladım, 1: Deneyimliyim
  rol: 0 | 1; // 0: Backend geliştirici, 1: Takım lideri
  karar_suresi_sn: number;
  konsol_arama: number;
  bulunan_anlamli: number;
  terim_toplam: number;
  tutor_toplam: number;
  israr_toplam: number;
  sorunlu_karar_toplam: number;
  kalan_sure_dk: number;
  son: 'alindi' | 'alinamadi' | 'ihlal' | '';
  kotu_son: 0 | 1 | '';
  yonetmen_modu: 'olagan' | 'destek' | 'baski';
  model_surumu: string;
  p_golge: string;
}

export const SOZLUK_HEADERS: (keyof OturumSatiri)[] = [
  'oturum',
  'kaynak',
  'oyuncu_tipi',
  'karar_no',
  'sahne_id',
  'eylem_id',
  'seviye',
  'rol',
  'karar_suresi_sn',
  'konsol_arama',
  'bulunan_anlamli',
  'terim_toplam',
  'tutor_toplam',
  'israr_toplam',
  'sorunlu_karar_toplam',
  'kalan_sure_dk',
  'son',
  'kotu_son',
  'yonetmen_modu',
  'model_surumu',
  'p_golge',
];

export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(16).substring(2, 10);
}

export function exportTraceToCSV(rows: OturumSatiri[]): string {
  const headerLine = SOZLUK_HEADERS.join(',');
  const rowLines = rows.map((row) =>
    SOZLUK_HEADERS.map((key) => {
      const val = row[key];
      if (typeof val === 'number') {
        return Number.isInteger(val) ? val.toString() : val.toFixed(1);
      }
      return val ?? '';
    }).join(',')
  );
  return [headerLine, ...rowLines].join('\n');
}

export function downloadTraceCSV(rows: OturumSatiri[], oturumId: string): void {
  const csvContent = exportTraceToCSV(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const fileName = `oturum-${oturumId}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareTraceCSV(rows: OturumSatiri[], oturumId: string): Promise<void> {
  const csvContent = exportTraceToCSV(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const fileName = `oturum-${oturumId}.csv`;

  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare
  ) {
    try {
      const file = new File([blob], fileName, { type: 'text/csv' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `SE Primer Oturum Kaydı (${oturumId})`,
          text: `SE Primer v2.0 Oturum Verisi: ${oturumId}`,
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share error:', err);
      }
    }
  }
}

export function canShareTraceFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const testFile = new File([''], 'test.csv', { type: 'text/csv' });
    return Boolean(navigator.canShare({ files: [testFile] }));
  } catch {
    return false;
  }
}

