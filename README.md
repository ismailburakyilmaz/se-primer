# SE Primer v2 — Sabah Randevu Krizi

Yazılım mühendisleri için telefonda oynanan bir kriz ve karar oyunu. Bir hastanenin randevu sistemi bozuluyor; oyuncu nöbetçi mühendis ya da takım lideri olarak karar veriyor ve sonunda suçlamasız bir olay raporu alıyor. Tutor ipucu veriyor ama doğru seçeneği söylemiyor.

**v2'de:** Küçük bir model her karardan sonra oyunun kötü bitme olasılığını (p) tahmin ediyor. **Olay Yönetmeni** bu tahmine göre sonraki sahneyi ayarlıyor: zorlanan oyuncu desteklenir, iyi giden oyuncu zorlanır. Kurallar ve son değişmez.

| | |
| --- | --- |
| Oyna | https://ai.studio/apps/20efef14-f93d-4c63-a045-860f81f32461 ("Continue to the app"e basın) |
| Model | https://huggingface.co/iburakyilmaz/se-primer-kotu-son · commit [`c623127`](https://huggingface.co/iburakyilmaz/se-primer-kotu-son/tree/c623127a5ea85535de658940a1519b0f721c3471) |
| Demo (65 sn) | https://github.com/ismailburakyilmaz/se-primer/blob/main/cypress/videos/v2-demo.cy.js.mp4 |

## Kurulum

```bash
git clone https://github.com/ismailburakyilmaz/se-primer && cd se-primer
npm install
npm run dev
```

`http://localhost:3000/?mock=1` adresinde Gemini anahtarı olmadan oynanır. Anahtarla oynamak için `.env.example` dosyasını `.env` olarak kopyalayın; `.env` repoya gönderilmez.

## Olay Yönetmeni

| p | Mod | Sonraki sahne |
| --- | --- | --- |
| ≥ 0,60 | Destek | Sayaç kalkar, ekipten biri doğru kanıta yönlendirir, yeşil damga |
| < 0,30 | Baskı | 45 sn sayaç, müdür sıkıştırır |
| arası | Olağan | v1 davranışı |

Model `StandardScaler → LogisticRegression` (11 özellik) ve tarayıcıda `onnxruntime-web` ile çalışıyor; veri cihazdan çıkmıyor. Model Hugging Face'ten commit'e sabit adresten indiriliyor (`src/config/model.ts`). Yüklenemezse oyun Olağan modda sürüyor. Veri toplama modunda model yalnızca gölgede çalışıyor. Bonus olarak sunucu tüketicisi `POST /api/model` aynı girdilere aynı sonucu veriyor.

## Veri, eğitim ve sürüm

```bash
pip install -r requirements.txt
python train.py egit        # kapıların hepsi geçerse model/ yazılır, yoksa durur
python tests/parite.py      # Python kahini, 5 referans girdi
```

- **Veri:** 20 gerçek oturum (95 karar) ve 150 sentetik oturum, `data/oturumlar.csv`. Her satırda `kaynak` (`gercek`/`sentetik`) sütunu var; kişisel veri yok. Sütunların anlamı `data/SOZLUK.md`'de.
- **Sentetik üretici** (tohum **2026**): Her oyuncuya gizli bir "dikkat" değeri `d ~ Beta(2,2)` atanıyor. Konsol araması `Poisson(3d)`, karar süresi `LogNormal(ln(8+40d), 0,35)`, önerilen eylemi seçme olasılığı `0,30 + 0,55d`. Sonu, uygulamadaki motorun Python karşılığı (`scripts/motor.py`) belirliyor. Sentetik satırlar eğitime giriyor, ölçüme girmiyor.
- **Ölçüm:** Oturum bazlı 5 katlı çapraz doğrulama, yalnızca gerçek satırlarla. ROC-AUC **0,747** (%95 GA 0,52–0,92), kalan süre tabanı 0,575, kötü son duyarlılığı 0,73, ONNX ile sklearn arasındaki fark 1,5e-07. Ayrıntılar `model/README.md`'de.
- **Eşik revizyonu:** Eşik veri toplanmadan önce 0,75 olarak yazıldı. Kapı modeli üç kez durdurdu (0,692 → 0,661 → 0,747). Daha fazla deneme yapmak yerine eşiği gerekçesiyle 0,70'e indirip bir güven aralığı kapısı ekledik (`spec.md` §13.4.1).
- **Sürüm:** Geri alma, gölge → %5 kanarya → kademeli geçiş ve tarayıcı / mobil / sunucu ödünleşim matrisi `RELEASE.md`'de.

## Testler

```bash
npm i -D cypress
npx cypress run --spec "cypress/e2e/**"    # npm run dev açıkken; 28/28 geçti
```

`01`–`07` v1 regresyonu, `08` tarayıcı ile Python arasındaki parite (|Δ| < 1e-4), `09` Yönetmen modları. Demo videosu `cypress/video/v2-demo.cy.js` ile kaydedildi.

## Sınırlar

- 20 gerçek oturumun 18'i geliştiricinin, son 2'si (`409bbd65`, `3274751f`) arkadaşlarının. Hepsi geliştiricinin bilgisayarında toplandığı için CSV'de `gelistirici` diye kayıtlı; yayınlanan model kartı da böyle diyor. CSV'nin özeti modele yazılı olduğu için dosya değiştirilmedi. Bu etiket modelin girdisi değil.
- Veri az ve oyuncu çeşitliliği sınırlı; eşik sonuç görüldükten sonra düşürüldü. Model tek bir olay için geçerli ve kişiyi değerlendirmek için kullanılmamalı.
- Bütün kişi, kurum ve hasta bilgileri kurgudur.

**v2.1:** Farklı oyunculardan 40 oturumla 0,75 eşiği yeniden hedeflenecek; ayrıca yeni olaylar (nöbet serisi) eklenecek.

Diğer belgeler: `spec.md` (kurallar, kabul örnekleri, model gereksinimi), `DESIGN.md`, `SINAV_TASARIMI.md`, `eval/` (v1 tutor eval'i).

## Yapay zekâ araçları beyanı

1. **Google Stitch (tasarım):** v2 ekran taslakları. Promptu Claude ile hazırladım, Stitch'te ben çalıştırdım. Önerdiği renk paletini, fontları ve cevabı ele veren örnek metinleri almadık.
2. **Google AI Studio / Gemini (uygulama):** Uygulamanın iskeleti ve arayüz kodu. Promptları Claude yazdı, ben verdim. Model bağlantısını eksik uyguladı ve parite sonuçlarını hesaplamak yerine kopyaladı; o kısım Claude'un koduyla değiştirildi ve kodu ben yapıştırdım.
3. **Claude (spec, model, test, sürüm ve uygulamadaki model kodu):** Spec ve eşikler, `train.py`, sentetik üretici, parite betiği, Cypress testleri, `RELEASE.md`, model kartı, README; `modelService`, Olay Yönetmeni, parite sayfası, `/api/model`, log konsolu ve oyun hissi değişiklikleri. Testleri ve oyunu ben çalıştırdım.
4. **Benim kararlarım:** Model hedefi ve kesin eklenecek özellikler (log konsolu, titreşimli damga), çıkarılacak özellikler, eşik revizyonu, gerçek oturumları oynamak ve oynatmak. Oynarken bulduğum sorunlar düzeltildi: log konsolunun yeniden tasarımı, "DENENDİ" kilidi, portreler, düğme metinleri.
5. **Gemini (oyunun içinde):** Tutor ve anlatıcı. Çıktı şemaya göre doğrulanıyor, geçersizse kayıtlı metin gösteriliyor (`eval/eval.md`).

Fikir kaynakları: log konsolu *Her Story*'den, "her nöbette yeni kural" *Papers, Please*'ten. Mimari kaynaklar (Amershi, Shankar, Breck, Sculley, Mitchell, Sommerville) `RELEASE.md` sonunda.
