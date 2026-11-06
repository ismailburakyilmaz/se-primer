# Veri sözlüğü: `data/oturumlar.csv`

Her satır **bir karardır** (zaman aşımı da bir karar satırıdır). Satırlar oturum ve karar sırasına göre dizilir. Sütun sırası aşağıdaki tablo ile aynıdır; uygulamanın veri toplama modu (`?veri=1`) bu sırayla yazar.

Kural kaynağı: `spec.md` §13 ve §14. Modelin kullandığı 11 özellik **kalın** yazılıdır; sıraları `model/config.json` → `features` ile aynıdır.

| # | Sütun | Tür | Birim / değerler | Açıklama |
| --- | --- | --- | --- | --- |
| 1 | `oturum` | metin | 8 onaltılık karakter (ör. `a7f3c210`) | Oyun başında rastgele üretilir (`crypto.getRandomValues`). Bir kişiyle ilişkilendirilemez; tarayıcıda saklanmaz. Sentetik oturumlar `s` ile başlar (`s0000017`). |
| 2 | `kaynak` | metin | `gercek` \| `sentetik` | Satırın nereden geldiği. Ölçüm (spec §13.3) yalnızca `gercek` satırlarla yapılır. |
| 3 | `oyuncu_tipi` | metin | `oyuncu` \| `gelistirici` \| `sentetik` | Geliştiricinin kendi oyunları `gelistirici` (senaryoyu bildiği için ayrı raporlanır). **Düzeltme:** `409bbd65` ve `3274751f` oturumlarını arkadaşlar oynadı ama geliştiricinin bilgisayarında toplandıkları için `gelistirici` kaydedildi (bkz. README, Sınırlar). |
| 4 | `karar_no` | tam sayı | 1, 2, … | **Özellik 3.** Bu karar oturumun kaçıncı kararı (zaman aşımı dahil). |
| 5 | `sahne_id` | metin | `S1`, `S1R`, `S2`, `S2R`, `S3`, `S4` | Kararın verildiği sahne. Modele girmez (analiz için). |
| 6 | `eylem_id` | metin | ör. `S1_incele`, `ZAMAN_ASIMI` | Seçilen eylem. Modele girmez (analiz için). |
| 7 | `seviye` | 0/1 | 0 Yeni başladım, 1 Deneyimliyim | **Özellik 1.** |
| 8 | `rol` | 0/1 | 0 Backend geliştirici, 1 Takım lideri | **Özellik 2.** |
| 9 | `karar_suresi_sn` | ondalık | saniye, 1 ondalık | **Özellik 4.** Seçenekler kullanılabilir olduktan karar verilene kadar geçen süre. Bir panel (konsol, tutor, terim, ipucu, karakter kartı) açıkken geçen süre sayılmaz. Zaman aşımında 60. |
| 10 | `konsol_arama` | tam sayı | adet | **Özellik 5.** Bu sahne ziyaretinde konsolda yapılan arama: yazılan (en az 2 karakter, yazma 600 ms durunca) ya da kanıt/mesaj metnindeki bir ifadeye dokunarak başlatılan farklı ifade sayısı. Boş kutudaki canlı akış sayılmaz. |
| 11 | `bulunan_anlamli` | tam sayı | adet | **Özellik 6.** Bu sahne ziyaretinde işaretlenen, `gurultu: false` olan log satırı. |
| 12 | `terim_toplam` | tam sayı | adet, birikimli | **Özellik 7.** Oturum başından bu karara kadar açılan terim balonu. |
| 13 | `tutor_toplam` | tam sayı | adet, birikimli | **Özellik 8.** Oturum başından bu karara kadar tutora gönderilen mesaj (hazır soru düğmeleri dahil). |
| 14 | `israr_toplam` | tam sayı | adet, birikimli | **Özellik 9.** Israr sayacını tetikleyen mesaj sayısı (spec §6.2). |
| 15 | `sorunlu_karar_toplam` | tam sayı | adet, birikimli | **Özellik 10.** Bu karar dahil türü `geciktiren`, `tehlikeli`, `kirmizi_cizgi` olan veya zaman aşımı olan karar. Tür oyuncuya hiç gösterilmez. |
| 16 | `kalan_sure_dk` | tam sayı | dakika | **Özellik 11.** Bu karardan sonra bütçeden kalan süre: `max(0, 100 − olay süresi)`. |
| 17 | `son` | metin | `alindi` \| `alinamadi` \| `ihlal` | Oturumun sonu. Oturumun bütün satırlarına oyun bitince yazılır. |
| 18 | `kotu_son` | 0/1 | 1 = `alinamadi` veya `ihlal` | **Etiket.** |
| 19 | `yonetmen_modu` | metin | `olagan` \| `destek` \| `baski` | Bu karardan önceki sahnede Olay Yönetmeni'nin modu. Veri toplama modunda her zaman `olagan`. |
| 20 | `model_surumu` | metin | ör. `v2.0@<commit>` ya da boş | Gölge olarak çalışan model sürümü; model yoksa boş. |
| 21 | `p_golge` | ondalık | 0–1 ya da boş | Gölge modelin bu karar için verdiği olasılık; oyunu etkilemez. |

## Toplanmayanlar (KVKK)

Ad, soyad, e-posta, telefon, cihaz kimliği, IP, konum, tarayıcı parmak izi, tarih-saat damgası ve serbest metin (tutora yazılanlar, mülakat cümleleri) **toplanmaz**. Tutor mesajlarından yalnızca sayı (`tutor_toplam`, `israr_toplam`) tutulur.

## Birleştirme

Her oyuncunun sonuç ekranından indirdiği `oturum-<id>.csv` dosyası başlık satırı dahil bu sütunları taşır. Dosyalar `python train.py birlestir indirilenler/*.csv` ile `data/oturumlar.csv`'ye eklenir; aynı `oturum` kimliği ikinci kez eklenmez, sonu olmayan oturum reddedilir.

## Sentetik veri

`python train.py sentetik` sentetik satırları üretir ve dosyadaki eski sentetik satırların yerine koyar (gerçek satırlara dokunmaz).

- **Tohum:** 2026. **Oturum sayısı:** 150.
- **Üretici kuralı:** Her sentetik oyuncu için seviye ve rol eşit olasılıkla seçilir ve gizli bir "dikkat" değeri `d ~ Beta(2, 2)` çekilir. Her sahnede:
  - konsol araması `Poisson(3d)`; işaretlenen anlamlı satır, arama varsa `Binomial(min(arama, sahnenin anlamlı satır sayısı), 0,6)`;
  - karar süresi `LogNormal(ln(8 + 40d), 0,35)` saniye, 60'ta kesilir; deneyimli seviyede 60 sn'yi aşan karar zaman aşımıdır;
  - terim balonu yeni başlayanda `Poisson(0,6)`, deneyimlide `Poisson(0,15)`; tutor mesajı `Poisson(0,4)`; her tutor mesajı `0,25(1 − d)` olasılıkla ısrardır;
  - önerilen (`onerilen`) eylemi seçme olasılığı `0,30 + 0,55d + 0,10·[anlamlı satır bulundu]` (en fazla 0,95); kalan olasılık sahnedeki diğer eylemlere eşit dağıtılır.
- Seçilen eylem, olay dosyasındaki kurallarla (`scripts/motor.py`, uygulamadaki motorun Python karşılığı) işlenir; sonu ve etiketi bu motor belirler.
- Sentetik satırlar eğitime girer ama ölçüme hiçbir zaman girmez.
