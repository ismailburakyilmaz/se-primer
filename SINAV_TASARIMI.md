# Sınav tasarımı: kavramı senaryoda tanımak

**Fikir:** Bu sınavda terimler kısa tanımlarıyla birlikte verilir. Amaç, öğrencinin bir senaryoda hangi kavramın işe yaradığını görüp **nedenini bir cümleyle** açıklayabilmesi. Biçim derste yapılan kısa sınava benziyor.

**Sizinle uyumlanma:** Öğrenci 4 sorudan **3'ünü seçer**. Herkes en iyi anladığı konuları gösterebilir; sınav öğrencinin güçlü yanına uyar. The Primer'da da oyuncu kendi rolünü seçiyordu.

## Terim kâğıdı (sınavla birlikte verilir)

| | |
| --- | --- |
| **A** Diferansiyel test: aynı girdiyi iki sisteme verip çıktıları karşılaştırmak | **B** Test kâhini: "doğru cevap bu" kabul edilen referans |
| **C** Regresyon testi: yeni değişiklik eskiyi bozdu mu? | **D** Tolerans: kabul edilen küçük fark (ör. 10⁻⁴) |
| **E** Doğrulama: ürünü doğru yaptık mı? (spec'e uyuyor mu) | **F** Geçerleme: doğru ürünü mü yaptık? (kullanıcının işine yarıyor mu) |
| **G** Gölge dağıtım: yeni sürüm sessizce çalışır, sonucu kullanılmaz | **H** Kanarya: yeni sürüm önce küçük bir gruba açılır |
| **I** Geri alma: sorun çıkınca eski sürüme dönmek | **J** Kabul eşiği: modelin geçmesi gereken ölçüt, eğitimden önce yazılır |

## Sorular (4 sorudan 3'ünü seçin; toplam 100 puan)

**1.** Bir model Python'da eğitilip tarayıcıya taşındı. Ekip 5 örnek girdiyi iki ortamda çalıştırıyor ve sonuçlar arasındaki fark 0,0001'den küçükse "tamam" diyor. Hangi 3 kavram var? Biri için nedenini yazın.

**2.** Bütün testler geçiyor ama kullanıcılar "Oyun bana yardım etmiyor, tersine zorlaştırıyor" diye şikâyet ediyor. Ekip "Testler geçti, sorun yok" diyor. Hangi iki kavram karışmış? Farkı bir cümleyle açıklayın.

**3.** Oyuna yeni bir kural eklendi ve geçen haftanın bir testi kırıldı. Hangi test türü bunu yakaladı? Kural bilerek değiştiyse, düzeltilmesi gereken kod mu yoksa test mi? Neden?

**4.** Modelin yeni sürümü hazır. Ekip onu hemen herkese açmak yerine önce sessizce çalıştırıyor, sonra kullanıcıların %5'ine açıyor ve sorun çıkarsa eski sürüme dönebiliyor. Bu üç adımın adı ne? Neden doğrudan herkese açılmıyor?

## Beklenen cevaplar

| Soru | Kavramlar | Yeterli gerekçe | Sık yapılan yanlış |
| --- | --- | --- | --- |
| 1 | A, B, D | İki ortam aynı sonucu vermeli; Python referans; küçük fark sayısal yuvarlamadan | "Fark küçükse model doğru tahmin ediyor" |
| 2 | E, F | Testler spec'e uyduğunu gösterir; şikâyet kullanıcının işine yaramadığını gösterir | "Testler geçtiyse ürün doğrudur" |
| 3 | C | Kural bilerek değiştiyse test eski davranışı bekliyordur; test güncellenir | "Test kırıldıysa kod hatalıdır" |
| 4 | G, H, I | Hata önce az kişiyi etkiler; gerçek veride denenmeden herkese açılmaz | "Testlerden geçtiyse herkese açılabilir" |

Puanlama: her soruda doğru kavramlar 20, gerekçe cümlesi 13 puan; toplam 99'a 1 puan eklenir. Gerekçe kendi cümlenle ve mantıklıysa tam puan alır; tanımı kelimesi kelimesine yazmak gerekmez.

1, 3 ve 4. soruların senaryoları bu ödevde gerçekten yaşandı: Python ile tarayıcı arasındaki parite testi, DENENDİ kuralının eski bir testi kırması ve modelin gölgede çalıştırılması. 2. soru varsayımsal.
