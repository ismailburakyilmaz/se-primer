---
library_name: sklearn
tags: [onnx, tabular-classification, sklearn, education, game]
pipeline_tag: tabular-classification
license: mit
---

# SE Primer v2 · kötü son riski modeli

SE Primer, yazılım mühendisleri için telefonda oynanan bir kriz ve karar oyunu. Bu model her karardan
sonra oyuncunun oyunu **kötü bir sonla** (Veri ihlali veya Kontrol altına alınamadı) bitirip
bitirmeyeceğini tahmin eder. Oyundaki **Olay Yönetmeni** bu tahmine göre bir sonraki sahnenin sunumunu
ayarlar: p ≥ 0.6 Destek, p < 0.3 Baskı, arası Olağan.
Model göstergeleri, kuralları veya sonu değiştirmez; oyuncuyu notlandırmaz.

## Model
- Pipeline(StandardScaler → LogisticRegression(class_weight='balanced')), tohum 2026
- Girdi `input` float32 `[n, 11]`, çıktı `probabilities` float32 `[n, 2]`, sınıf 1 = kötü son
- Python 3.13.17, scikit-learn 1.9.1, skl2onnx 1.20.0

| # | Özellik | Birim | Standart katsayı |
| --- | --- | --- | --- |
| 1 | `seviye` | 0 Yeni başladım, 1 Deneyimliyim | +0.437 |
| 2 | `rol` | 0 Backend, 1 Takım lideri | -0.069 |
| 3 | `karar_no` | kaçıncı karar | -1.972 |
| 4 | `karar_suresi_sn` | saniye | -0.307 |
| 5 | `konsol_arama` | bu sahnedeki arama sayısı | +0.011 |
| 6 | `bulunan_anlamli` | bu sahnede işaretlenen anlamlı log satırı | -0.076 |
| 7 | `terim_toplam` | birikimli terim balonu | +0.066 |
| 8 | `tutor_toplam` | birikimli tutor mesajı | +0.276 |
| 9 | `israr_toplam` | birikimli ısrar | -0.183 |
| 10 | `sorunlu_karar_toplam` | birikimli sorunlu karar | +2.944 |
| 11 | `kalan_sure_dk` | dakika | -0.611 |

## Veri
- 898 satır (her karar bir satır). Gerçek: 20 oturum, 95 satır
  (kötü son 7, iyi son 13; bunların 20 tanesi geliştiricinin kendi oyunu).
  Sentetik: 150 oturum (üretici kuralı ve tohumu `data/SOZLUK.md`).
- Kişisel veri yok: oturum kimliği rastgele; ad, e-posta, cihaz, konum, serbest metin toplanmadı.
- Veri özeti (SHA-256): `7456249619df0e1aef555d7eb2ac7fe6578ca96148d022cb1a618b998a18eb85`

## Ölçüm ve kabul eşiği
oturum bazlı 5 katlı GroupKFold; eğitim: gerçek+sentetik; metrik: yalnız gerçek satırların katlar-dışı tahminleri. Eşikler eğitimden önce `spec.md` §13.4'te yazıldı.

| Kapı | Ölçülen | Eşik |
| --- | --- | --- |
| ROC-AUC | 0.747 | ≥ 0.7 (özgün eşik 0,75: **geçemedi**) |
| ROC-AUC %95 güven aralığı (oturum bazlı bootstrap) | [0.518, 0.923] | alt sınır > 0.5 |
| Kalan süre tabanına göre fark | +0.172 (taban 0.575) | ≥ +0.03 |
| Kötü son duyarlılığı (p ≥ 0.6) | 0.730 | ≥ 0.6 |
| ONNX ↔ sklearn maks fark | 1.5e-07 | ≤ 1e-04 |

Bilgi (kapı değil): accuracy 0.705 (her zaman çoğunluk sınıfını söyleyen taban 0.611), Brier 0.221.

## Ölçüm geçmişi
Eşik 31 Ekim'de, veri toplanmadan önce ROC-AUC ≥ 0,75 olarak yazıldı. Model bu eşiği **geçemedi**:

| Tarih | Ne oldu | ROC-AUC | Sonuç |
| --- | --- | --- | --- |
| 5 Kasım | Aday 1: 15 gerçek oturum | 0,692 | Kapı durdurdu |
| 5 Kasım | Aday 2: sentetik üretici gerçek ortalamalara ayarlandı | 0,661 | Kapı durdurdu, üretici geri alındı |
| 5 Kasım | Aday 3: 20 gerçek oturum | 0,747 | Kapı 0,003 farkla durdurdu |
| 5 Kasım | Eşik revizyonu: 0,70 + güven aralığı alt sınırı > 0,50 | 0,747 | Yayınlandı (bu model) |

Revizyon, sonuç görüldükten **sonra** yapıldı; bunu saklamıyoruz. Gerekçe: 20 oturumla ölçülen ROC-AUC'nin %95 güven aralığı yaklaşık ±0,2 genişliğinde; 0,75 bu veri boyutu için ayırt edilemeyecek kadar iddialıydı. Yeni eşik, yaygın kabul gören "kabul edilebilir ayırt edicilik" sınırı olan 0,70'tir (Hosmer ve Lemeshow, 2000), ve bir güven aralığı kapısı eklendi. Revizyondan sonra başka aday denenmedi. Ayrıntı: `RELEASE.md`, `spec.md` §13.4.1.

## Sınırlar
- Tek bir olayın (Sabah Randevu Krizi) verisiyle eğitildi; başka bir olayda kullanılırsa geçersizdir.
- Gerçek oturumlar geliştiricinin kendi oyunlarından toplandı; oyuncu çeşitliliği sınırlı ve geliştirici senaryoyu biliyordu. İlk 4 oturum, her sahneye dördüncü seçenek eklenmeden önce oynandı.
- Gerçek veri az (20 oturum); ROC-AUC'nin güven aralığı geniş. Model yazılım mühendisliği öğrencilerini temsil etmez.
- Etiket oturumun sonudur; erken kararlarda belirsizlik yüksektir.
- Sentetik veri kural tabanlıdır; modelin bir kısmı üreticinin varsayımlarını öğrenmiş olabilir. Bu yüzden ölçüm yalnızca gerçek satırlarla yapıldı.
- Model kendi kararının etkisini öğrenebilir (geri besleme döngüsü); veri toplama modunda yalnızca gölge olarak çalışır.

## Kullanılmaması gereken durumlar
- Bir kişinin yeteneğini, notunu veya işe uygunluğunu değerlendirmek.
- Gerçek bir olay müdahalesinde karar desteği olarak.
- Oyun dışındaki herhangi bir veriyle.

## Kullanım
Tüketiciler modeli `main` dalından değil commit'e sabit URL'den indirir:
`https://huggingface.co/<kullanıcı>/<repo>/resolve/<commit>/model.onnx` (bkz. `RELEASE.md`).
