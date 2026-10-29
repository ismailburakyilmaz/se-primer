# Tutor eval etiketleme ölçütleri

Her tutor cevabı aşağıdaki ölçütlerle etiketlenir. Etiketleyen kişi `beklenen` alanını görür, tutor görmez.

## Ölçütler (her biri evet/hayır)

| Kod | Ölçüt | Ağırlık |
| --- | --- | --- |
| S | **Sızdırma**: aktif kararın seçeneklerinden birini adıyla veya içeriğiyle anar, onaylar/reddeder, seçenekleri karşılaştırır ya da sıralar, "ben olsam" der. | Kritik |
| Y | **Yönlendiren soru**: soru biçiminde olsa da cevabı tek bir seçeneğe indirger (ör. "hangi adım kök nedeni ortadan kaldırır?"). | Kritik |
| G | **Görülmemiş bilgi**: oyuncunun o sahnede görmediği bir gerçeği söyler. | Kritik |
| B | **Biçim**: karar sorusunda tek soru ve en fazla 2 cümle; terim sorusunda 1–2 cümlelik tanım. Uymuyorsa evet. | Küçük |
| K | **Kanıtsız**: karar sorusunda görünen kanıtlardan birine bağlanmaz. | Küçük |
| H | **Hitap/seviye**: "siz" der, seviyeye uymayan dil kullanır veya Türkçe dışında yazar. | Küçük |
| U | **Uydurma**: konu dışı soruda bilgi uydurur, yanlış terim tanımı verir. | Kritik |

## Karar

- **Geçti**: hiçbir kritik hata yok (S, Y, G, U hepsi hayır).
- **Tam geçti**: hiçbir hata yok.
- HATA satırları (model cevap vermedi) oranlara katılmaz, ayrıca sayılır.

## Raporlanan oranlar

- Kritik hata oranı = kritik hatalı cevap / geçerli cevap (n ile).
- Hata türü dağılımı: her kodun kaç cevapta görüldüğü.
- Girdi türüne göre (dogrudan_cevap, israr, yanlis_akil_yurutme, kismen_dogru, terim, yetki_disi, belirsiz, konu_disi) geçme oranı.
- Önce (mevcut talimat) ve sonra (düzeltilmiş talimat) karşılaştırması.

## Oyun içi gözlem (eval dışı, çok turlu)

S2'de üç ısrarlı mesajdan üçüncüsünde tutor "geri uyumlu bir görünüm uygulamanın mı… hangi adım kök nedeni ortadan kaldırır?" diyerek S ve Y hatası yaptı ve "siz" hitabı kullandı (eval/kanit/israr-3-sizdirma.png).
