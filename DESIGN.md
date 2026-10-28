# DESIGN.md — SE Primer

**Görsel kimlik:** Olay Kayıt Defteri
**Kaynak:** Google Stitch projesi "SE Primer Olay Defteri" (Giriş, Sahne ve ek hâlleri, Son: Kontrol altına alındı / Veri ihlali)

Bu dosya uygulamanın görünüm sözleşmesidir. Kod yalnızca buradaki renkleri, yazı tiplerini ve bileşen kurallarını kullanır; bunların dışında renk veya font eklemez.

## 1. Amaç ve hava

SE Primer, nöbetçi bir mühendisin tuttuğu **basılı bir olay kayıt fişi** gibi görünür. Her olay numaralı bir fiştir; kanıtlar lastik damgalıdır; kararlar form kutucuklarına işaretlenir; sonuç resmî bir olay raporudur.

Hava: sakin, ciddi, kâğıt üzerinde düzenli. Kriz ekrandaki renklerden değil, içerikten hissedilir.

**Olmaması gereken:** tipik yapay zekâ ile üretilmiş uygulama görünümü; koyu lacivert/mor tema, gradyan, cam efekti, gölgeli yüzen kartlar, emoji ikonlar.

## 2. Renkler

Tüm renkler tek bir tema dosyasında CSS değişkeni olarak tanımlanır ve her yerde değişken üzerinden kullanılır.

| Değişken | Hex | Kullanım |
| --- | --- | --- |
| `--kagit` | #F3EEE3 | Sayfa zemini |
| `--fis` | #FBF8F1 | Kart, panel, kutu zemini (mavi veya lila tonlu zemin kullanılmaz) |
| `--cizgi` | #D8CFBF | İnce çerçeveler, ayraçlar, kesik yırtma çizgileri |
| `--murekkep` | #1F2430 | Ana metin |
| `--soluk` | #5A5F6B | İkincil metin, "Varsayım" ve "Bilinmiyor" damgaları, "YENİ KAYIT" damgası |
| `--tukenmez` | #2B4C9B | Birincil düğme, seçili kutucuk, odak çerçevesi |
| `--onay` | #2F6B3A | "DOĞRULANDI" damgası, "KONTROL ALTINA ALINDI" damgası |
| `--pas` | #9A5212 | "BELİRTİ" damgası, uyarı |
| `--damga` | #B8322A | Yalnızca veri riski, "VERİ İHLALİ", "KONTROL ALTINA ALINAMADI" |
| `--fosfor` | #F2D04B | Yalnızca zemin vurgusu (terim altı, kritik satır); üzerindeki metin `--murekkep` |

Kurallar:
- Kırmızı (`--damga`) yalnızca risk ve kayıp durumları içindir; giriş ekranında, başlıklarda veya süs olarak kullanılmaz.
- Metin her zaman `--fis` veya `--kagit` üzerinde `--murekkep` ya da `--soluk` rengindedir.
- Hazır Tailwind renkleri (indigo, violet, slate, gray, blue vb.) kullanılmaz.

## 3. Yazı tipleri

Google Fonts'tan yüklenir; üçü de Türkçe karakterleri destekler.

| Rol | Font | Boyut | Ağırlık |
| --- | --- | --- | --- |
| Büyük başlık ("SE Primer", "OLAY RAPORU") | Fraunces | 32–36 px | 600 |
| Bölüm başlığı | Fraunces | 20–22 px | 600 |
| Gövde, anlatım, seçenek metni | IBM Plex Sans | en az 16 px, satır aralığı 1.5 | 400 |
| Etiket, fiş numarası, saat, gösterge değeri, log, damga | IBM Plex Mono | 12–14 px (damga ve etiket büyük harf) | 500–600 |

Inter, Roboto, Courier Prime, sistem varsayılanı veya el yazısı fontlar kullanılmaz.

## 4. Boşluk, çerçeve, köşe

- Boşluk ölçüsü 4 px'in katlarıdır: 4, 8, 12, 16, 24, 32.
- Ekran kenar boşluğu 16 px.
- Kartlar ve kutular 1 px `--cizgi` çerçeveli; **gölge yok**.
- Köşe yuvarlatma en fazla 4 px.
- Bölümler arasında 1 px kesik çizgi (yırtma çizgisi) kullanılır.

## 5. Bileşenler

### Fiş başlığı
Her ekranın en üstünde: `OLAY KAYIT FİŞİ · No: 0428` (Mono, büyük harf, `--soluk`) ve sağda durum damgası. Son ekranında başlık `OLAY RAPORU · No: 0428`.

### Damga
Durum etiketlerinin tek biçimi. Büyük harf Mono metin, çift çerçeve (2 px dış, 1 px iç), yaklaşık −3° eğik, zemin şeffaf, renk durumun rengi. Metin her zaman okunur; durum renk olmadan da anlaşılır.

| Damga | Renk |
| --- | --- |
| DOĞRULANDI | `--onay` |
| BELİRTİ | `--pas` |
| VARSAYIM | `--soluk` |
| BİLİNMİYOR | `--soluk`, kesik çerçeve |
| YENİ KAYIT | `--soluk` |
| KONTROL ALTINA ALINDI | `--onay` |
| KONTROL ALTINA ALINAMADI | `--damga` |
| VERİ İHLALİ | `--damga` |

### Seçim kutucuğu (giriş formu ve eylemler)
Form satırı biçiminde: solda 20 px kare kutucuk, sağda metin. Satır yüksekliği en az 48 px, 1 px `--cizgi` çerçeve, `--fis` zemin. Seçilince kutucuğa `--tukenmez` tik, çerçeve `--tukenmez`. Eylem kartlarının hepsi aynı boyut ve tondadır; hiçbir eylem görsel olarak öne çıkarılmaz.

### Gösterge kutusu
Formdaki doldurulmuş alan gibi: üstte Mono büyük harf etiket ("OLAY SÜRESİ", "ETKİ", "VERİ RİSKİ", "EKİP"), altta değer. Dar ekranda 2×2 ızgara. Veri riski 70 ve üzerinde değer `--damga` renginde yazılır.

### Kanıt satırı
Solda damga, sağda metin. Log ve kod parçaları Mono.

### Mesaj balonu
Ekip mesajları: üstte konuşanın adı (Mono, küçük), altta metin; 1 px çerçeve, sol kenarda 3 px `--cizgi` şerit. En fazla iki balon.

### Terim
Metindeki teknik terim 1 px noktalı alt çizgiyle gösterilir. Dokununca küçük bir balon açılır: terim kalın, altında 1–2 cümle tanım; zemin `--fis`, çerçeve `--cizgi`.

### Sayaç
Sağ üstte dairesel, 60 saniye. Kalan süre Mono yazılır. Son 10 saniyede halka `--pas` olur; kırmızı kullanılmaz.

### Paneller (alttan açılır)
"Ne oldu / Neden oldu", Tutor ve İpucu panelleri ekranın altından açılır; zemin `--fis`, üstte 1 px kesik çizgi. "Ne oldu" ve "Neden oldu" başlıkları Mono büyük harf.

### Tutor paneli
Sohbet görünümü: oyuncu mesajı sağda, tutor mesajı solda. Altta yazı alanı ve "Gönder". Canlı tutor kullanılamıyorsa üstte "Tutor şu an kullanılamıyor" notu ve "HAZIR İPUCU" damgalı bir kart.

### Düğmeler
- Birincil: tam genişlik, `--tukenmez` zemin, beyaz metin, en az 48 px yükseklik.
- İkincil: `--fis` zemin, 1 px `--murekkep` çerçeve.

### Son ekranı
`OLAY RAPORU` başlığı, büyük sonuç damgası, özet satırı (saat · karar sayısı · dakika), göstergelerin son hâli, "Suçlamasız değerlendirme" dikey zaman çizelgesi (her adım: saat, karar, "O an bildiklerin", "Sonradan öğrendiklerin"), "Bu olaydan tek ilke" kutusu, "Başka rolle oyna" ve "Tekrar oyna".

## 6. Durumlar

- **Yükleme:** "Sahne hazırlanıyor..." metni ve çizgili iskelet satırlar (`--cizgi`); dönen ikon yok.
- **Devre dışı düğme:** `--soluk` metin, kesik çerçeve, %60 opaklık.
- **Hata / yedek:** "Tutor şu an kullanılamıyor" gibi notlar `--pas` renkte, damga biçiminde değil düz metin.
- **Odak:** 2 px `--tukenmez` dış çerçeve.

## 7. Erişilebilirlik ve dar ekran

- Dokunma alanları en az 44×44 px.
- Gövde metni en az 16 px; metin ve zemin kontrastı en az 4.5:1.
- Her durum renk dışında metinle de anlaşılır.
- 360 px genişlikte yatay kaydırma olmaz; uzun Türkçe kelimeler (ör. "uzlaştırılmamış") satır sonunda kırılır (`overflow-wrap: anywhere`).

## 8. Yap / Yapma

**Yap:** krem kâğıt zemin, ince çerçeve, damga, Mono etiketler, form kutucukları, kesik yırtma çizgileri, gerçek içerik.

**Yapma:** gradyan, cam efekti, neon, mor/indigo, mavi veya lila panel zemini, gölgeli yüzen kart, 4 px'ten büyük köşe, emoji ikon, Inter/Roboto/Courier Prime, kırmızıyı süs olarak kullanmak, eylemlerden birini görsel olarak öne çıkarmak.
