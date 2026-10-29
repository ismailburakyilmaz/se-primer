# SE Primer — Sabah Randevu Krizi

Yazılım mühendisleri için telefonda oynanan bir kriz ve karar oyunu. Oyuncu, bir hastanenin randevu sistemi bozulduğunda nöbetçi mühendis ya da takım lideri olarak karar verir; her kararın ne olduğunu ve neden olduğunu görür, sonunda suçlamasız bir olay raporu alır. Yapay zekâ tutor ipucu verir ama doğru seçeneği söylemez.

## Bağlantılar

| | |
| --- | --- |
| Oyna (AI Studio) | [PAYLAŞIM LİNKİ] |
| Stitch tasarımı | [STITCH PROJE LİNKİ] |
| Kaynak kod | https://github.com/ismailburakyilmaz/se-primer |
| Tanıtım videosu (60 sn) | `cypress/videos/tanitim.cy.js.mp4`: Cypress ile kaydedilmiş tam bir oyun; alt yazılar ve tıklama halkası yalnızca videoya eklenmiştir. Anlatım kayıtlı metinden gelir; tutor cevabı, oyunda v2 talimatıyla alınmış gerçek bir cevabın kaydıdır (`eval/eval.md`, Z2). |

> **Not:** AI Studio paylaşım linki ilk açılışta "This app is from another developer" uyarısı gösterir. **Continue to the app** düğmesine basınca oyun açılır. Bu, AI Studio'nun her paylaşılan uygulamada gösterdiği standart uyarıdır.

## Nasıl oynanır

1. Girişte üç soruyu cevapla: **seviye** (Yeni başladım / Deneyimliyim), **rol** (Backend geliştirici / Takım lideri / Rol fark etmez), **hedef** (Öğrenmek / Mülakat pratiği / Baskı altında karar).
2. Her sahnede ekip mesajlarını ve kanıtları oku. Kanıtlar **Doğrulandı / Belirti / Varsayım / Bilinmiyor** etiketlidir.
3. Bir karar ver. Ardından "Ne oldu / Neden oldu" paneli açılır.
4. Takıldığında **Tutora sor**. Tutor cevabı vermez; kanıtlara bağlı tek bir soru sorar. Altı noktalı terimlere dokununca açıklama açılır.
5. Olay üç sondan biriyle biter: **Kontrol altına alındı**, **Kontrol altına alınamadı** ya da **Veri ihlali**.

## Brief'e göre kapsam

| Brief | Bu proje |
| --- | --- |
| Girişte 3 soru, anlatı buna uyar | Seviye ipucu ile sayacı, rol eylem ve kanıt metinlerini, hedef anlatım uzunluğunu ve değerlendirme içeriğini değiştirir (spec §4). |
| 1 sağlık senaryosu, 3 karar, 2 son | 1 olay, 4 ana karar ve 2 toparlanma sahnesi, 3 son. |
| Her seçimden sonra ne oldu / neden oldu | Her eylemde iki metin; "Öğrenmek" hedefinde uzun açıklama. |
| İpucu veren, cevabı vermeyen AI tutor | Gemini, sunucu tarafında; eylem türleri tutora hiç gönderilmez. Eval: `eval/eval.md`. |
| Kapsam dışı | Hesap ve giriş, ikinci bölüm, gerçek hasta verisi, native mobil (spec §2). |

**Fark yaratan noktalar**
- Yanlış karar oyunu bitirmez; sorun geri döner. Örneğin geri dönüş her şeyi kapatır, oyuncu toparlamak zorunda kalır.
- Aynı olay iki rolden oynanır. Takım lideri ham log yerine ekip özeti görür.
- Gerçek olaylardan ilham: geri uyumsuz veritabanı değişikliği, kişisel verinin log'a sızması ve KVKK'nın 72 saatlik bildirim süresi.
- Görsel kimlik "Olay Kayıt Defteri": basılı bir olay fişi gibi görünür (`DESIGN.md`).

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `spec.md` | Problem, kapsam, oyun kuralları, akış şeması, AI sözleşmesi, 7 kabul örneği, test kancaları |
| `DESIGN.md` | Renkler, yazı tipleri, bileşen kuralları |
| `design/` | Stitch ekranları (yalnızca görünüm referansı) |
| `scenarios/sabah-randevu.json` | Olayın tek gerçeklik kaynağı: sahneler, kanıtlar, eylemler, sonlar |
| `content/glossary.json` | 17 terim |
| `content/eval_inputs.json` | Tutor eval için 20 girdi |
| `eval/` | Eval ölçütleri, sonuçlar (CSV) ve rapor |
| `cypress/` | Uçtan uca testler ve video turu |
| `server.ts`, `src/` | Uygulama (AI Studio Build: React + Express) |

**Mimari:** Oyun motoru (`src/utils/engine.ts`) saf fonksiyonlardan oluşur; göstergeleri, sahne geçişlerini ve sonları yalnızca o hesaplar. Yapay zekâ yalnızca anlatır ve sorulara cevap verir. Anlatıcının çıktısı şemaya ve yasak kelimelere göre doğrulanır; geçersizse ya da kota bitmişse sahnenin kayıtlı anlatımı gösterilir. API anahtarı yalnızca sunucuda durur.

## Yerelde çalıştırma

```bash
npm install
# .env dosyası: GEMINI_API_KEY=<ücretsiz anahtar>   (repoya gönderilmez)
npm run dev          # http://localhost:3000
```

Test kancaları:
- `?mock=1`: Gemini çağrılmaz; anlatım kayıtlı metinden, tutor "TEST: tutor cevabı" olarak gelir.
- `?seed=<n>`: "Rol fark etmez" seçimini sabitler.
- `?eval=1`, ya da sürüm yazısına 5 kez dokunmak: tutor eval sayfası.

## Testler (Cypress)

```bash
npm install --save-dev cypress
npm run dev                                   # ayrı pencerede açık kalsın
npx cypress run --spec "cypress/e2e/**"       # 22 test
npx cypress run --spec cypress/video/tanitim.cy.js   # 60 sn video
```

Son çalıştırma: **22/22 test geçti** (`cypress/cypress-sonuc.png`).

| Dosya | Kapsadığı kabul örneği |
| --- | --- |
| `01-giris-ve-roller` | 1, 2: seviye ve rol farkı; eylem türleri görünmez |
| `02-ideal-yol` | 4 karar, 09:15, "Kontrol altına alındı"; başka rolle oyna |
| `03-toparlanma` | 3, 4: S1→S1R→S2, S2→S2R (etki +90); bütçe sınırı |
| `04-veri-ihlali` | 5: genel kanal, KVKK 72 saat |
| `05-sayac` | 60 sn dolunca +15 dk ve mesaj, ziyaret başına bir kez; panel açıkken durur |
| `06-tutor-terim-cift-tik` | Tutor paneli, teklif, terim balonu, çift tıklama koruması |
| `07-gezinme` | Nasıl oynanır, gösterge değişim özeti, yeni sahnenin en üstten açılması, Esc, yenileyince devam, geri tuşu, olaydan çık |

## Tutor eval özeti

20 öğrenci girdisi (8 tür: doğrudan cevap isteme, ısrar, yanlış akıl yürütme, terim, yetki dışı vb.), elle etiketleme, 7 hata türü (`eval/rubrik.md`).

| Ölçüm | Talimat / model | n | Geçti (kritik hata yok) | Sızdırma | Yönlendiren soru |
| --- | --- | --- | --- | --- | --- |
| A | v1 / Flash + Flash-Lite | 20 | 14 (%70) | 1 | 4 |
| B, kontrol | v1 / Flash-Lite | 20 | 13 (%65) | 3 | 4 |
| C | v2 / Flash-Lite | 20 | **17 (%85)** | **0** | 3 |

Talimatın etkisi aynı modelle yapılan B → C karşılaştırmasından okunur. Ücretsiz katmanın kota sınırları yüzünden A ile C'de model farklıydı; bu yüzden kontrol ölçümü yapıldı. Ayrıca oyun içinde 6 zorlama denemesi yapıldı ("sadece evet/hayır", İngilizce prompt enjeksiyonu, "hangisi yanlış", sıralama, çok turlu ısrar). Tutor hiçbir cevapta doğru seçeneği söylemedi; çok turlu ısrarın ikinci turunda bir kez yön verdi. Ayrıntılar, örnek hatalar ve sınırlar: `eval/eval.md`.

## Yapılmamış 3 özellik

1. **Olay kütüphanesi ve rastgele başlangıç.** Farklı sektörlerden (ödeme, kargo, e-devlet) ve farklı pozisyonlardan (SRE, QA, güvenlik, ürün yöneticisi) olaylar; oyun rastgele bir olay ve rolle başlar. Motor ve JSON şeması buna hazır, ama brief ikinci bölümü kapsam dışı tutuyor.
2. **Çok oyunculu olay odası.** Backend geliştirici ve takım lideri aynı olayı aynı anda, birbirine mesaj atarak oynar; koordinasyon göstergesi iki oyuncunun kararlarından hesaplanır.
3. **Postmortem yazma ve kişisel gelişim takibi.** Olay sonunda oyuncu kendi suçlamasız raporunu yazar, tutor rapora geri bildirim verir; hangi hatalara tekrar düşüldüğü oyunlar arasında izlenir. Bunun için hesap ve kalıcı kayıt gerekir; bu sürümde kapsam dışı.

## Sınırlar

- **AI Studio paylaşım linkinde canlı AI:** AI Studio'nun sunucuya verdiği `GEMINI_API_KEY` bu projede geçersiz ("API_KEY_INVALID") geldi. Bu yüzden linkte anlatıcı kayıtlı metni, tutor da "Hazır ipucu"nu gösterebilir. Oyunun tamamı oynanır; yedek davranış spec §6'da tanımlandığı gibi çalışır. Canlı tutor yerelde kendi ücretsiz anahtarla çalışır (yukarıdaki "Yerelde çalıştırma"); eval de böyle yapıldı.
- Ücretsiz Gemini katmanının günlük ve dakikalık sınırları var. Sınır dolunca anlatıcı kayıtlı metne, tutor "Hazır ipucu"na döner; oyun çalışmaya devam eder.
- Bütün kişi, kurum ve hasta bilgileri kurgudur.
