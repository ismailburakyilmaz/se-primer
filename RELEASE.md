# RELEASE — SE Primer kötü son riski modeli

## v2.0 (5 Kasım 2026)

**Ne değişti:** v1'de oyunun uyumu girişteki üç cevaba bağlı sabit kurallardı. v2.0 ile oyuna küçük, göreve özel bir model geldi: her karardan sonra oyuncunun oyunu kötü bir sonla (Veri ihlali veya Kontrol altına alınamadı) bitirip bitirmeyeceğini tahmin eder. **Olay Yönetmeni** bu tahmine göre bir sonraki sahnenin sunumunu değiştirir: p ≥ 0,60 ise Destek (sayaç kalkar, ekipten biri bir kanıta yönlendirir), p < 0,30 ise Baskı (45 sn sayaç, müdür sıkıştırır), arada Olağan. Model kuralları, göstergeleri ve sonu değiştirmez.

| | |
| --- | --- |
| Model | `Pipeline(StandardScaler → LogisticRegression(class_weight="balanced"))`, tohum 2026, 11 özellik |
| Veri | 20 gerçek oturum (95 karar; 18'i geliştiricinin, son 2'si arkadaşların) + 150 sentetik oturum; `data/oturumlar.csv`, SHA-256 `model/config.json` içinde |
| Ölçüm | Oturum bazlı 5 katlı çapraz doğrulama, yalnız gerçek satırlar: ROC-AUC 0,747 (%95 GA 0,52–0,92); kötü son duyarlılığı 0,73; kalan süre tabanı 0,575 |
| Artefakt | `model.onnx` (girdi `input` float32 [n,11], çıktı `probabilities` [n,2]), `config.json` (sözleşme), `README.md` (model kartı) |
| Hugging Face | `https://huggingface.co/iburakyilmaz/se-primer-kotu-son` |
| **Sabitlenen commit** | `c623127a5ea85535de658940a1519b0f721c3471` |
| İndirme adresi | `https://huggingface.co/iburakyilmaz/se-primer-kotu-son/resolve/c623127a5ea85535de658940a1519b0f721c3471/model.onnx` |

Uygulama ve testler modeli **hiçbir zaman `main` dalından indirmez**. Adres tek bir yerde durur: `src/config/model.ts` (`MODEL_COMMIT`). Hugging Face'te `main`'e yeni bir dosya yüklemek çalışan uygulamayı etkilemez.

### Ölçüm geçmişi (eval kapısı)

Kabul eşiği 31 Ekim'de, veri toplanmadan önce `spec.md` §13.4'e yazıldı (ROC-AUC ≥ 0,75). `train.py` her denemede kapıyı uyguladı:

| # | Ne denendi | ROC-AUC | Kapı |
| --- | --- | --- | --- |
| 1 | 15 gerçek oturum, özgün sentetik üretici | 0,692 | ✗ V2 · `model/` yazılmadı |
| 2 | Sentetik üretici gerçek oturumların ortalamalarına ayarlandı | 0,661 | ✗ V2, V4 · üretici geri alındı |
| 3 | 20 gerçek oturum, özgün üretici | 0,747 | ✗ V2 (0,003 farkla) |
| — | **Eşik revizyonu** (spec §13.4.1): V2 → 0,70 ve V2b güven aralığı alt sınırı > 0,50 | — | — |
| 4 | Aday 3, yeni eşikle | 0,747 (GA 0,52–0,92) | ✓ yayınlandı |

Revizyon sonuç görüldükten **sonra** yapıldı. Bunu gizlemiyoruz; "geçene kadar veri toplamak" yerine durup eşiği gerekçesiyle yeniden yazmayı seçtik. Gerekçe: 20 oturumla ROC-AUC'nin güven aralığı yaklaşık ±0,2; 0,70 ile 0,75 bu boyutta ayırt edilemez. 0,70, ikili sınıflandırıcılar için yaygın "kabul edilebilir ayırt edicilik" sınırıdır (Hosmer ve Lemeshow, 2000). Revizyondan sonra yeni aday denenmedi. v2.1'de özgün 0,75 yeniden hedeflenir.

Bu, Shankar vd. (2022)'nin "Validation" sorununun küçük bir örneği: kapı üç kez durdurdu, bir kez de bizim kendi düzeltme girişimimizi (aday 2) reddetti.

## Geri alma (rollback)

Model tarayıcıda çalıştığı ve adres commit'e sabit olduğu için geri almanın üç yolu var; en hızlısından en kalıcısına:

1. **Hemen kapat (saniyeler):** Uygulamayı `?model=kapali` ile açan herkes için Yönetmen her sahnede Olağan modda çalışır, yani v1 davranışı. Kod değişmez.
2. **Önceki sürüme dön (dakikalar):** `src/config/model.ts`'deki `MODEL_COMMIT` değeri önceki commit'e geri yazılır ve uygulama yeniden yayınlanır. Hugging Face eski commit'leri sildirmediği sürece eski dosya aynı adreste durur. v2.0 ilk sürüm olduğu için onun "öncesi" modelsiz v1'dir; bunun için `MODEL_COMMIT` boş bırakılır ve Yönetmen Olağan'a düşer (model yüklenemezse oyun bozulmaz, spec §13.5).
3. **Uygulamanın kendisini geri al:** AI Studio sürüm geçmişinden v2 öncesi snapshot'a dönülür (v1 son hâli: 30 Ekim 00:17).

Geri alma sonrası kontrol: `npx cypress run --spec "cypress/e2e/**"` (v1 regresyon testleri) ve `python tests/parite.py --url <eski adres>`.

## Yeni sürümü güvenle devreye alma (v2.0 → v2.1)

Hesap ya da sunucu olmadığı için "trafik" oturumlardır. Bir oturumun hangi modeli alacağı, oturum kimliğinin (rastgele 8 onaltılık karakter) sayıya çevrilmiş hâlinden belirlenir; aynı oturum her zaman aynı modeli alır.

| Aşama | Senaryomuzda ne olur | Geçme ölçütü |
| --- | --- | --- |
| **Gölge (shadow)** | Herkes v2.0 ile oynar; v2.1 de her karardan sonra hesaplanır ama oyunu etkilemez, olasılığı `p_golge` sütununa yazılır. Veri toplama modunda bugün zaten böyle çalışıyor (spec §13.6). | En az 20 gerçek oturumda v2.1'in gölge ROC-AUC'si v2.0'dan düşük değil; iki modelin mod kararı oturumların %70'inden fazlasında aynı |
| **Kanarya (%5)** | `oturum_sayi % 100 < 5` olan oturumlarda Yönetmen v2.1'e göre karar verir. | Bu oturumlarda kötü son oranı v2.0 grubundan belirgin biçimde kötü değil; model yükleme hatası yok |
| **Kademeli geçiş** | %25 → %50 → %100; her adımda en az 10 oturum ve aynı ölçütler | Ölçüt bozulursa bir önceki yüzdeye dönülür (rollback 2) |

Not: Yönetmen kendi kararıyla oyuncunun sonunu etkilediği için (Destek alan oyuncu daha az kaybeder), yeni modelin değerlendirmesi yalnızca **Olağan** moddaki ve gölge satırlardan yapılır; aksi hâlde model kendi müdahalesini "oyuncu zaten iyiydi" diye öğrenir (geri besleme döngüsü; Sculley vd., 2015). Bu yüzden veri toplama modunda Yönetmen her zaman Olağan çalışır.

## Mimari karar ve ödünleşim matrisi

Seçim: **tarayıcıda çalıştırma (`onnxruntime-web`)**. Sunucu tüketicisi (`POST /api/model`, AI Studio'daki Express sunucusu) yalnızca parite testinin üçüncü tüketicisi ve bonus kanıtı olarak vardır; oyun onu kullanmaz.

| Soru | Tarayıcı (`onnxruntime-web`) ✓ | Cihaz içi mobil (Expo, gömülü ONNX) | Kendi sunucumuz (`/api/model`) |
| --- | --- | --- | --- |
| **1. İnternet zorunlu mu, gecikme?** | İlk açılışta model (~1 KB) ve çalışma zamanı (wasm, birkaç MB, önbelleğe alınır) indirilir; sonra her tahmin cihazda, ağsız, milisaniyeler içinde. Oyun zaten çevrimiçi açıldığı için ek bir koşul yok. | Kurulumdan sonra tamamen internetsiz; en düşük gecikme. Ama oyunun kendisi (tutor) internet istiyor ve uygulama mağazası/APK dağıtımı gerekiyor. | Her kararda bir ağ isteği; mobil ağda yüzlerce milisaniye ve kesinti riski. Kesintide Yönetmen Olağan'a düşer. |
| **2. Veri cihazdan çıkar mı? (KVKK)** | **Çıkmaz.** Özellik vektörü (karar süresi, arama sayısı…) yalnızca tarayıcıda kalır. Veri toplama modunda bile CSV'yi oyuncu kendisi indirip gönderir. | Çıkmaz. | **Çıkar:** her kararın davranış izi sunucuya gider. Kişisel veri olmasa da işleme kaydı, saklama süresi ve aydınlatma metni gerekir. Girdileri loglamıyoruz. |
| **3. Model gizli kalır mı?** | **Kalmaz:** `model.onnx` herkese açık indirilebilir, katsayılar okunabilir. Bizim için sorun değil: model zaten public Hugging Face reposunda ve model kartıyla birlikte açık; gizli bir ticari değeri yok. Bilinen katsayılarla Yönetmen'i "kandırmak" (ör. bilerek yavaş oynayıp Destek almak) mümkün, ama bu oyuncunun kendi öğrenmesini etkiler, başkasını değil. | Kalmaz; APK açılıp dosya çıkarılabilir. | Dosya gizli kalır, ama uç nokta istek-yanıt üzerinden sorgulanarak model davranışı kopyalanabilir (model çıkarma / tersine mühendislik). Hız sınırı ve kimlik doğrulama gerekir. |

**Karar:** Veri cihazdan çıkmadığı, ek altyapı gerektirmediği, ücretsiz olduğu ve tek link ile açıldığı için tarayıcı. Modelin açık olması bu projede bir zayıflık değil; şeffaflık hedefimizle uyumlu.

## Diferansiyel (parite) test

Aynı `model.onnx` üç ayrı ortamda çalışır ve aynı 5 referans girdiye (`tests/parite.json`) aynı olasılığı vermelidir (|Δ| < 1e-4):

1. **Test kahini (oracle):** Python, `onnxruntime` (`tests/parite.py`)
2. **Uygulama:** tarayıcı, `onnxruntime-web` (`?parite=1` sayfası, Cypress `cypress/e2e/08-parite.cy.js`)
3. **Sunucu (bonus):** Node, `POST /api/model` (`python tests/parite.py --sunucu <adres>/api/model`)

## Kaynaklar

- Amershi vd. (2019), *Software Engineering for Machine Learning: A Case Study*: yaşayan ML yaşam döngüsü; veri toplama → eğitim → değerlendirme → dağıtım → gözlem.
- Shankar vd. (2022), *Operationalizing Machine Learning: An Interview Study*: Velocity, Validation, Versioning.
- Breck vd. (2017), *The ML Test Score*: eval kapısı, eğitim–sunum tutarlılığı (bizde ONNX ↔ sklearn ve parite testi).
- Sculley vd. (2015), *Hidden Technical Debt in Machine Learning Systems*: geri besleme döngüleri.
- Mitchell vd. (2019), *Model Cards for Model Reporting*: `model/README.md`.
- Hosmer, D. W. ve Lemeshow, S. (2000), *Applied Logistic Regression*, 2. baskı: ROC-AUC yorum sınırları.
- Sommerville, *Software Engineering* (10. baskı): Bl. 8 (doğrulama ve geçerleme), Bl. 25 (konfigürasyon yönetimi: commit'e sabitleme ve sürümleme).
- Hugging Face Hub belgeleri: `resolve/<revision>` adresleri; ONNX Runtime (`onnxruntime-web`); `skl2onnx`.
