# DESIGN.md — SE Primer

**Görsel kimlik:** Olay Kayıt Defteri
**Kaynak:** Google Stitch projesi "SE Primer Olay Defteri" (Giriş, Sahne ve ek hâlleri, Son: Kontrol altına alındı / Veri ihlali); v2 bileşenleri §9'da
**Sürüm:** 2.0

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

## 9. (v2) Yeni bileşenler

Hepsi aynı kimliğin içinden gelir; yeni renk veya font eklenmez. Her yeni görselde şu soru sorulur: "Bunu başka bir yapay zekâ projesi de böyle yapardı mı?" Cevap evetse malzeme ya da metafor değişir.

### Log dökümü (log konsolu)
Sürekli yazıcı kâğıdı gibi: `--fis` zemin, iki kenarda 12 px'lik delik şeridi (her 16 px'te bir 6 px çaplı `--cizgi` çerçeveli boş daire), satırlar arasında her iki satırda bir çok soluk yatay bant (`--kagit`). Satırlar IBM Plex Mono 13 px: solda saat (`--soluk`), ortada kaynak (`--soluk`, büyük harf), sonra metin. Aramada eşleşen kısım `--fosfor` zeminle "fosforlu kalem" gibi vurgulanır; vurgu satır yüksekliğinin alt %60'ını kaplar, kenarları düz değil hafif eğik (kalem izi). Satırın sağında "İŞARETLE" (Mono, 12 px, ikincil düğme). İşaretlenen satırın solunda küçük, eğik bir "BULUNDU" damgası.

Arama kutusu bir form alanı gibidir: üstte Mono "LOGDA ARA" etiketi, altında tek satır kutu, sağında sonuç sayısı ("3 satır"). Kutu boşken altında "CANLI AKIŞ · SON 10 SATIR" (Mono, `--soluk`) etiketiyle en yeni satırlar. Destek modunda kutunun üstünde "EKİPTEN ÖNERİ" etiketiyle üç küçük düğme (Mono, 1 px kesik çerçeve).

**Aranabilir ifade:** Kanıt, mesaj, anlatım ve log metinlerinde IBM Plex Mono, 1 px düz `--murekkep` alt çizgi (terimdeki noktalı alt çizgiden ayrılsın diye düz). Dokunma alanı en az 44 px yükseklik için satır içinde dikey dolgu.

### Kanıt panosu, "Senin bulduğun"
Sahnenin kanıtları v1'deki gibi. Altında kesik çizgiyle ayrılmış "SENİN BULDUĞUN" bölümü; satırlar log dökümü biçiminde (delik şeridi olmadan) ve solda kendi etiket damgası.

### Karakter kartı
Bir personel kimlik kartı: 1 px `--cizgi` çerçeve, sol üstte 96×96 px portre, sağında ad (IBM Plex Sans 16 px, 600) ve görev (Mono 12 px, `--soluk`, büyük harf), altta bir cümlelik tanım. Portre **1-bit piksel çizim** (yalnızca `--murekkep` pikseller, saydam zemin; düz mürekkep alanlar, kalın hatlar, orta ton için tek dama deseni; gri ton yok, fotoğraf yok). Her boy (24, 48, 96 px) kendi pikselinde çizilmiş ayrı dosyadır ve ölçeklenmeden gösterilir. Mesaj balonunda portre 48×48 px hâliyle konuşanın adının solunda durur. Yapay zekâ ile üretilen portreler bu stile çevrilmeden kullanılmaz.

### Ekibin güveni göstergesi
v1'deki "EKİP" gösterge kutusu; etiketin altında güven kişisinin 24 px portresi ve adı. Değer düşünce portre %60 opaklığa iner.

### Mürekkep gösterge
Bir gösterge değiştiğinde eski değer kaybolmaz: üstü 1.5 px `--murekkep` çizgiyle elle çizilmiş gibi (hafif eğik) çizilir, yeni değer sağına yazılır. 1,5 sn sonra eski değer solarak kalkar. `prefers-reduced-motion` açıksa çizgi animasyonsuz görünür ve eski değer hemen kalkar.

### Titreşimli damga ve damga bildirimi
Damga basılırken 300 ms'de %115 büyüklükten %100'e iner ve 2 px "mürekkep taşması" (aynı renkte, %20 opak bir gölge değil, damganın 1 px kaymış ikinci kopyası) bırakır. Aynı anda `navigator.vibrate`. Damga bildirimi ekranın üstünde 16 px kenar boşluklu, `--fis` zeminli, 1 px çerçeveli bir şerit: solda küçük damga, sağda tek satır açıklama; 3 sn sonra yukarı kayarak kalkar. Gölge yok.

### Yönetmen damgası
"YÖNETMEN · DESTEK" (`--onay`), "YÖNETMEN · BASKI" (`--pas`). Damga biçimindedir, sahne başlığının altında durur; Olağan modda damga yoktur. Kırmızı kullanılmaz (baskı bir kayıp değildir).

### Canlı sistem haritası
Fişin üstünde 64 px yüksekliğinde tek satırlık şema: dört kutu (RANDEVU EKRANI → API → VERİTABANI → SMS SERVİSİ), aralarında 1 px oklar. Kutular Mono 12 px büyük harf, 1 px çerçeve. Durumlar: normal (`--cizgi` çerçeve), bozuk (`--pas` çerçeve ve "BOZUK" mini damga), çöktü (`--damga` çerçeve, "ÇÖKTÜ"), düzeldi (`--onay` "DÜZELDİ" mini damga). SMS servisi yetki dışı olduğu için kesik çerçevelidir ve altında "ENTEGRASYON EKİBİ" yazar. Kararın dokunduğu kutu "Ne oldu" paneli açıkken `--fosfor` zeminle vurgulanır.

### Hazır soru düğmeleri (tutor)
Yazı alanının üstünde üç satır, her biri form satırı biçiminde ikincil düğme (en az 44 px yükseklik). Israr sayacı devreye girince sohbetin içinde ortalanmış, `--soluk` Mono bir ayraç satırı: "— AYNI KANITA DÖNELİM —".

### İtiraz (şeytanın avukatı)
"Ne oldu" panelinde, "Devam"ın üstünde kesik çizgiyle ayrılmış blok: solda konuşanın 28 px portresi ve adı, Mono küçük etiket "İTİRAZ", altında itiraz metni (italik değil, IBM Plex Sans). Altında tek satırlık "Kararını savun (isteğe bağlı)" kutusu ve iki ikincil düğme: "Savun", "Atla". Sonrasında kaygı metni `--soluk` renkte, solunda 3 px `--cizgi` şerit. Renk vurgusu yok; itiraz bir hata bildirimi gibi görünmemeli.

### Sonuç ekranı ekleri
- **Karar tarzın:** bir kutu, solda tarzın adı (Fraunces 20 px), altında bir cümle.
- **Yönetmen izi:** zaman çizelgesindeki ilgili kararın yanında küçük Yönetmen damgası.
- **Dekker sorusu:** her zaman çizelgesi adımında "BU KARAR O AN NEDEN MANTIKLIYDI?" (Mono etiket) ve altında metin.
- **Postmortem:** üç form alanı (KÖK NEDEN, TETİKLEYİCİ, KALICI DÜZELTME), her biri seçim kutucuklu liste; "Onayla" birincil düğme; doğruysa "POSTMORTEM ONAYLANDI" damgası.
- **O anın bilgisiyle:** zaman çizelgesinde bir karara dokununca alttan açılan panel; üstte "O AN BİLDİKLERİN" başlığı, yalnızca o an görülen kanıtlar ve işaretlenen satırlar; sonradan öğrenilenler `--cizgi` kesik çerçeveli boş kutular ("henüz bilinmiyor") olarak görünür.
- **Raporu indir:** ikincil düğme; indirilen PNG fişin kendisidir (360 px genişlik, 2× çözünürlük).

### Veri toplama modu
Giriş ekranında, başla düğmesinin üstünde `--fis` zeminli kesik çerçeveli bir not kutusu: "VERİ TOPLAMA MODU" etiketi, bir cümle açıklama ve "Kabul ediyorum" seçim kutucuğu. Sonuç ekranında "Oturum verisini indir" ikincil düğmesi.
