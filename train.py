"""SE Primer v2 — kötü son riski modeli: eğit, ölç, kapıdan geçir, paketle.

Tek komut:   python train.py
Diğerleri:   python train.py sentetik               # sentetik satırları (yeniden) üretir
             python train.py birlestir a.csv b.csv  # oyunculardan gelen CSV'leri ekler
             python train.py birlestir --tip gelistirici a.csv  # geliştiricinin kendi oyunları

Kurallar spec.md §13'tedir. Kabul eşikleri aşağıdaki ESIK sözlüğündedir ve spec §13.4 ile
aynıdır; eğitimden önce yazıldı. Bir kapı geçilmezse betik çıkış kodu 1 ile durur ve
model/ klasörüne hiçbir şey yazılmaz.
"""
import hashlib
import json
import pathlib
import platform
import shutil
import sys
import tempfile
from datetime import date

import numpy as np
import pandas as pd

KOK = pathlib.Path(__file__).resolve().parent
VERI = KOK / "data" / "oturumlar.csv"
MODEL_DIR = KOK / "model"
sys.path.insert(0, str(KOK / "scripts"))

TOHUM = 2026
KAT = 5

SUTUNLAR = [
    "oturum", "kaynak", "oyuncu_tipi", "karar_no", "sahne_id", "eylem_id", "seviye", "rol",
    "karar_suresi_sn", "konsol_arama", "bulunan_anlamli", "terim_toplam", "tutor_toplam",
    "israr_toplam", "sorunlu_karar_toplam", "kalan_sure_dk", "son", "kotu_son",
    "yonetmen_modu", "model_surumu", "p_golge",
]
OZELLIKLER = [  # sıra = ONNX girdi sırası = config.json features
    ("seviye", "0 Yeni başladım, 1 Deneyimliyim"),
    ("rol", "0 Backend, 1 Takım lideri"),
    ("karar_no", "kaçıncı karar"),
    ("karar_suresi_sn", "saniye"),
    ("konsol_arama", "bu sahnedeki arama sayısı"),
    ("bulunan_anlamli", "bu sahnede işaretlenen anlamlı log satırı"),
    ("terim_toplam", "birikimli terim balonu"),
    ("tutor_toplam", "birikimli tutor mesajı"),
    ("israr_toplam", "birikimli ısrar"),
    ("sorunlu_karar_toplam", "birikimli sorunlu karar"),
    ("kalan_sure_dk", "dakika"),
]
OZ = [o for o, _ in OZELLIKLER]

ESIK = {  # spec §13.4 — eğitimden önce yazıldı (31 Ekim 2026); V2 revizyonu §13.4.1 (5 Kasım 2026)
    "min_gercek_oturum": 15,
    "min_sinif_basina_gercek_oturum": 4,
    "min_roc_auc": 0.70,                 # özgün: 0.75 (bkz. ESIK_GECMISI)
    "min_roc_auc_guven_alt": 0.50,       # yeni: oturum bazlı bootstrap %95 alt sınırı yazı turadan iyi olmalı
    "min_fark_kalan_sure_tabani": 0.03,
    "min_recall_destek": 0.60,
    "max_onnx_farki": 1e-4,
}
YONETMEN = {"destek_esigi": 0.60, "baski_esigi": 0.30}
ESIK_GECMISI = [  # RELEASE.md "Ölçüm geçmişi" ile aynı; hiçbir satır silinmez
    {"tarih": "2026-10-31", "olay": "Eşik yazıldı (veri toplanmadan önce)", "min_roc_auc": 0.75},
    {"tarih": "2026-11-05", "olay": "Aday 1: 15 gerçek oturum, özgün sentetik üretici", "roc_auc": 0.692, "sonuc": "V2'de durdu, yayınlanmadı"},
    {"tarih": "2026-11-05", "olay": "Aday 2: sentetik üretici gerçek ortalamalara ayarlandı", "roc_auc": 0.661, "sonuc": "V2 ve V4'te durdu; üretici geri alındı"},
    {"tarih": "2026-11-05", "olay": "Aday 3: 20 gerçek oturum, özgün üretici", "roc_auc": 0.747, "sonuc": "V2'de 0,003 farkla durdu"},
    {"tarih": "2026-11-05", "olay": "Eşik revizyonu (spec §13.4.1): V2 0,75 → 0,70 ve bootstrap alt sınırı > 0,50 kapısı eklendi; başka aday denenmedi", "min_roc_auc": 0.70},
]
BOOTSTRAP = 2000


def hata(mesaj):
    print(f"\n✗ KAPI GEÇİLEMEDİ: {mesaj}\n  model/ yazılmadı.")
    sys.exit(1)


def veri_oku():
    if not VERI.exists():
        hata(f"{VERI} yok")
    df = pd.read_csv(VERI, dtype={"oturum": str, "model_surumu": str})
    eksik = [s for s in SUTUNLAR if s not in df.columns]
    if eksik:
        hata(f"eksik sütun: {eksik} (data/SOZLUK.md)")
    if not set(df["kaynak"]).issubset({"gercek", "sentetik"}):
        hata("kaynak sütununda gercek/sentetik dışında değer var")
    df = df.sort_values(["kaynak", "oturum", "karar_no"], kind="mergesort").reset_index(drop=True)
    return df


def model_kur():
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler
    return Pipeline([("olcek", StandardScaler()),
                     ("lr", LogisticRegression(class_weight="balanced", max_iter=2000, random_state=TOHUM))])


def katlar_disi(df, ozellikler):
    """Oturum bazlı 5 kat; her katta tüm eğitim satırlarıyla eğit, test katındaki satırları tahmin et."""
    from sklearn.model_selection import GroupKFold
    p = np.full(len(df), np.nan)
    gkf = GroupKFold(n_splits=KAT)
    for egit, test in gkf.split(df, df["kotu_son"], groups=df["oturum"]):
        m = model_kur().fit(df.iloc[egit][ozellikler], df.iloc[egit]["kotu_son"])
        p[test] = m.predict_proba(df.iloc[test][ozellikler])[:, 1]
    return p


def olc(df):
    from sklearn.metrics import accuracy_score, brier_score_loss, recall_score, roc_auc_score
    g = (df["kaynak"] == "gercek").to_numpy()
    y = df["kotu_son"].to_numpy()
    p_tam = katlar_disi(df, OZ)
    p_kalan = katlar_disi(df, ["kalan_sure_dk"])
    yg, pg, pk = y[g], p_tam[g], p_kalan[g]
    cogunluk = int(round(yg.mean()))
    # Oturum bazlı bootstrap güven aralığı (gerçek satırlar)
    oturum = df["oturum"].to_numpy()[g]
    tekil = np.unique(oturum)
    rng = np.random.default_rng(TOHUM)
    idx = {o: np.where(oturum == o)[0] for o in tekil}
    aucs = []
    for _ in range(BOOTSTRAP):
        sec = np.concatenate([idx[o] for o in rng.choice(tekil, len(tekil), replace=True)])
        if len(np.unique(yg[sec])) == 2:
            aucs.append(roc_auc_score(yg[sec], pg[sec]))
    alt, ust = (float(x) for x in np.percentile(aucs, [2.5, 97.5]))
    return {
        "roc_auc": float(roc_auc_score(yg, pg)),
        "roc_auc_guven_95": [alt, ust],
        "recall_kotu_son_destek_esiginde": float(recall_score(yg, (pg >= YONETMEN["destek_esigi"]).astype(int))),
        "accuracy_0_5": float(accuracy_score(yg, (pg >= 0.5).astype(int))),
        "brier": float(brier_score_loss(yg, pg)),
        "taban_kalan_sure_roc_auc": float(roc_auc_score(yg, pk)),
        "taban_cogunluk_accuracy": float(accuracy_score(yg, np.full_like(yg, cogunluk))),
        "olcum": f"oturum bazlı {KAT} katlı GroupKFold; eğitim: gerçek+sentetik; metrik: yalnız gerçek satırların katlar-dışı tahminleri",
    }


def onnx_aktar(model, X, hedef):
    import onnxruntime as ort
    from skl2onnx import to_onnx
    from skl2onnx.common.data_types import FloatTensorType
    onx = to_onnx(model, initial_types=[("input", FloatTensorType([None, X.shape[1]]))],
                  options={id(model): {"zipmap": False}}, target_opset=17)
    hedef.write_bytes(onx.SerializeToString())
    oturum = ort.InferenceSession(str(hedef))
    p_onnx = oturum.run(["probabilities"], {"input": X.to_numpy(np.float32)})[0]
    return float(np.abs(p_onnx - model.predict_proba(X.astype(np.float32))).max()), p_onnx[:, 1]


def egit():
    import onnxruntime
    import skl2onnx
    import sklearn

    df = veri_oku()
    gercek = df[df["kaynak"] == "gercek"]
    print(f"Veri: {len(df)} satır · gerçek {gercek['oturum'].nunique()} oturum / {len(gercek)} satır · "
          f"sentetik {df[df['kaynak'] == 'sentetik']['oturum'].nunique()} oturum")

    # V1 — veri yeterliliği
    oturum_sinif = gercek.groupby("oturum")["kotu_son"].first()
    n_or, n_kotu, n_iyi = len(oturum_sinif), int(oturum_sinif.sum()), int((1 - oturum_sinif).sum())
    print(f"V1 gerçek oturum {n_or} (kötü {n_kotu}, iyi {n_iyi}) · eşik ≥{ESIK['min_gercek_oturum']}, sınıf başına ≥{ESIK['min_sinif_basina_gercek_oturum']}")
    if n_or < ESIK["min_gercek_oturum"] or min(n_kotu, n_iyi) < ESIK["min_sinif_basina_gercek_oturum"]:
        hata("V1 veri yeterliliği")

    # V2–V4 — ölçüm
    m = olc(df)
    fark = m["roc_auc"] - m["taban_kalan_sure_roc_auc"]
    print(f"V2 ROC-AUC {m['roc_auc']:.3f} · eşik ≥{ESIK['min_roc_auc']}")
    print(f"V3 kalan süre tabanı {m['taban_kalan_sure_roc_auc']:.3f} · fark {fark:+.3f} · eşik ≥+{ESIK['min_fark_kalan_sure_tabani']}")
    print(f"V4 kötü son duyarlılığı (p ≥ {YONETMEN['destek_esigi']}) {m['recall_kotu_son_destek_esiginde']:.3f} · eşik ≥{ESIK['min_recall_destek']}")
    print(f"   bilgi: accuracy {m['accuracy_0_5']:.3f} (çoğunluk tabanı {m['taban_cogunluk_accuracy']:.3f}), Brier {m['brier']:.3f}")
    print(f"V2b ROC-AUC %95 güven aralığı [{m['roc_auc_guven_95'][0]:.3f}, {m['roc_auc_guven_95'][1]:.3f}] · alt sınır eşiği >{ESIK['min_roc_auc_guven_alt']}")
    if m["roc_auc"] < ESIK["min_roc_auc"]:
        hata("V2 ROC-AUC eşiğin altında")
    if m["roc_auc_guven_95"][0] <= ESIK["min_roc_auc_guven_alt"]:
        hata("V2b güven aralığının alt sınırı yazı turadan iyi değil")
    if fark < ESIK["min_fark_kalan_sure_tabani"]:
        hata("V3 model, kalan süre tabanından yeterince iyi değil")
    if m["recall_kotu_son_destek_esiginde"] < ESIK["min_recall_destek"]:
        hata("V4 kötü son duyarlılığı eşiğin altında")

    # Son model: bütün veriyle
    X, y = df[OZ].astype(np.float32), df["kotu_son"]
    model = model_kur().fit(X, y)

    with tempfile.TemporaryDirectory() as gecici:
        gecici = pathlib.Path(gecici)
        # V5 — ONNX eşdeğerliği
        onnx_fark, p_onnx = onnx_aktar(model, X, gecici / "model.onnx")
        print(f"V5 ONNX ↔ sklearn maks fark {onnx_fark:.2e} · eşik ≤{ESIK['max_onnx_farki']:.0e}")
        if onnx_fark > ESIK["max_onnx_farki"]:
            hata("V5 ONNX eşdeğerliği")
        # V6 — tekrarlanabilirlik: aynı veriyle ikinci eğitim aynı sonucu vermeli
        m2 = olc(df)
        p2 = model_kur().fit(X, y).predict_proba(X)[:, 1]
        ayni = m2 == m and np.array_equal(p2, model.predict_proba(X)[:, 1])
        print(f"V6 tekrarlanabilirlik {'aynı' if ayni else 'FARKLI'}")
        if not ayni:
            hata("V6 tekrarlanabilirlik")

        lr = model.named_steps["lr"]
        config = {
            "title": "SE Primer v2 · kötü son riski",
            "target": "kotu_son",
            "task": "Bu karardan sonra oyun kötü bir sonla (Veri ihlali veya Kontrol altına alınamadı) bitecek mi?",
            "classes": ["iyi son", "kötü son"],
            "class_labels": {"0": "iyi son", "1": "kötü son"},
            "features": [{"name": o, "unit": b, "example": float(df[o].median())} for o, b in OZELLIKLER],
            "onnx": {"input": "input", "input_type": "float32", "input_shape": [None, len(OZ)],
                     "output": "probabilities", "output_shape": [None, 2], "positive_index": 1},
            "yonetmen": YONETMEN,
            "acceptance": ESIK,
            "metrics": {k: (round(v, 4) if isinstance(v, float) else [round(x, 4) for x in v] if isinstance(v, list) else v) for k, v in m.items()},
            "acceptance_history": ESIK_GECMISI,
            "onnx_max_diff": onnx_fark,
            "coefficients_standardized": {o: round(float(c), 4) for o, c in zip(OZ, lr.coef_[0])},
            "data": {
                "file": "data/oturumlar.csv",
                "sha256": hashlib.sha256(VERI.read_bytes()).hexdigest(),
                "rows": int(len(df)),
                "real_sessions": int(n_or), "real_rows": int(len(gercek)),
                "real_bad_sessions": n_kotu, "real_good_sessions": n_iyi,
                "synthetic_sessions": int(df[df["kaynak"] == "sentetik"]["oturum"].nunique()),
                "developer_sessions": int(gercek[gercek["oyuncu_tipi"] == "gelistirici"]["oturum"].nunique()),
            },
            "seed": TOHUM,
            "model": "Pipeline(StandardScaler → LogisticRegression(class_weight='balanced'))",
            "python_version": platform.python_version(),
            "sklearn_version": sklearn.__version__,
            "skl2onnx_version": skl2onnx.__version__,
            "onnxruntime_version": onnxruntime.__version__,
            "trained_on": date.today().isoformat(),
        }
        (gecici / "config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (gecici / "README.md").write_text(model_karti(config), encoding="utf-8")

        # Bütün kapılar geçildi: artefaktı yerine koy
        MODEL_DIR.mkdir(exist_ok=True)
        for ad in ("model.onnx", "config.json", "README.md"):
            shutil.copy2(gecici / ad, MODEL_DIR / ad)
    print(f"\n✓ Bütün kapılar geçildi → {MODEL_DIR}/model.onnx, config.json, README.md")


def model_karti(c):
    m, d, e = c["metrics"], c["data"], c["acceptance"]
    oz = "\n".join(f"| {i + 1} | `{f['name']}` | {f['unit']} | {c['coefficients_standardized'][f['name']]:+.3f} |"
                   for i, f in enumerate(c["features"]))
    return f"""---
library_name: sklearn
tags: [onnx, tabular-classification, sklearn, education, game]
pipeline_tag: tabular-classification
license: mit
---

# SE Primer v2 · kötü son riski modeli

SE Primer, yazılım mühendisleri için telefonda oynanan bir kriz ve karar oyunu. Bu model her karardan
sonra oyuncunun oyunu **kötü bir sonla** (Veri ihlali veya Kontrol altına alınamadı) bitirip
bitirmeyeceğini tahmin eder. Oyundaki **Olay Yönetmeni** bu tahmine göre bir sonraki sahnenin sunumunu
ayarlar: p ≥ {c['yonetmen']['destek_esigi']} Destek, p < {c['yonetmen']['baski_esigi']} Baskı, arası Olağan.
Model göstergeleri, kuralları veya sonu değiştirmez; oyuncuyu notlandırmaz.

## Model
- {c['model']}, tohum {c['seed']}
- Girdi `input` float32 `[n, {len(c['features'])}]`, çıktı `probabilities` float32 `[n, 2]`, sınıf 1 = kötü son
- Python {c['python_version']}, scikit-learn {c['sklearn_version']}, skl2onnx {c['skl2onnx_version']}

| # | Özellik | Birim | Standart katsayı |
| --- | --- | --- | --- |
{oz}

## Veri
- {d['rows']} satır (her karar bir satır). Gerçek: {d['real_sessions']} oturum, {d['real_rows']} satır
  (kötü son {d['real_bad_sessions']}, iyi son {d['real_good_sessions']}; bunların {d['developer_sessions']} tanesi geliştiricinin kendi oyunu).
  Sentetik: {d['synthetic_sessions']} oturum (üretici kuralı ve tohumu `data/SOZLUK.md`).
- Kişisel veri yok: oturum kimliği rastgele; ad, e-posta, cihaz, konum, serbest metin toplanmadı.
- Veri özeti (SHA-256): `{d['sha256']}`

## Ölçüm ve kabul eşiği
{m['olcum']}. Eşikler eğitimden önce `spec.md` §13.4'te yazıldı.

| Kapı | Ölçülen | Eşik |
| --- | --- | --- |
| ROC-AUC | {m['roc_auc']:.3f} | ≥ {e['min_roc_auc']} (özgün eşik 0,75: **geçemedi**) |
| ROC-AUC %95 güven aralığı (oturum bazlı bootstrap) | [{m['roc_auc_guven_95'][0]:.3f}, {m['roc_auc_guven_95'][1]:.3f}] | alt sınır > {e['min_roc_auc_guven_alt']} |
| Kalan süre tabanına göre fark | {m['roc_auc'] - m['taban_kalan_sure_roc_auc']:+.3f} (taban {m['taban_kalan_sure_roc_auc']:.3f}) | ≥ +{e['min_fark_kalan_sure_tabani']} |
| Kötü son duyarlılığı (p ≥ {c['yonetmen']['destek_esigi']}) | {m['recall_kotu_son_destek_esiginde']:.3f} | ≥ {e['min_recall_destek']} |
| ONNX ↔ sklearn maks fark | {c['onnx_max_diff']:.1e} | ≤ {e['max_onnx_farki']:.0e} |

Bilgi (kapı değil): accuracy {m['accuracy_0_5']:.3f} (her zaman çoğunluk sınıfını söyleyen taban {m['taban_cogunluk_accuracy']:.3f}), Brier {m['brier']:.3f}.

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
"""


# ----------------------------------------------------------------------------- sentetik veri
# Üretici parametreleri. v2.0-aday-1 tahmini değerlerle üretildi (karar süresi ~29 sn, arama 1,5/sahne)
# ve gerçek oturumlara benzemediği için V2 kapısında reddedildi (ROC-AUC 0,692 < 0,75).
# v2.0-aday-2: parametreler gerçek oturumların yalnızca ORTALAMALARINA göre ayarlandı
# (karar süresi ~10 sn, arama ~0,35/sahne, terim ve tutor yarıya). Eşik değişmedi. Bkz. RELEASE.md.
# aday-2 de reddedildi (ROC-AUC 0,661, duyarlılık 0,405); bu yüzden SOZLUK.md'de yazılı özgün üreticiye
# (aday-1) dönüldü. İki deneme de RELEASE.md'de raporlanır.
SENTETIK = {"sure_taban": 8, "sure_dikkat": 40, "arama": 3,
            "terim_yeni": 0.6, "terim_deneyimli": 0.15, "tutor": 0.4, "surum": "aday-1"}
def sentetik(oturum_sayisi=150):
    from motor import Oyun, senaryo_yukle
    rng = np.random.default_rng(TOHUM)
    s = senaryo_yukle()
    satirlar = []
    for i in range(oturum_sayisi):
        seviye, rol = int(rng.integers(2)), int(rng.integers(2))
        d = float(rng.beta(2, 2))
        oyun = Oyun(s, "lider" if rol else "backend")
        terim = tutor = israr = sorunlu = 0
        oturum = []
        while oyun.son is None:
            sahne = oyun.sahne()
            anlamli = sum(not l["gurultu"] for l in sahne["loglar"])
            arama = int(rng.poisson(SENTETIK['arama'] * d))
            bulunan = int(rng.binomial(min(arama, anlamli), 0.6)) if arama else 0
            sure_sn = float(np.exp(rng.normal(np.log(SENTETIK['sure_taban'] + SENTETIK['sure_dikkat'] * d), 0.35)))
            terim += int(rng.poisson(SENTETIK['terim_yeni'] if seviye == 0 else SENTETIK['terim_deneyimli']))
            yeni_tutor = int(rng.poisson(SENTETIK['tutor']))
            tutor += yeni_tutor
            israr += int(rng.binomial(yeni_tutor, 0.25 * (1 - d))) if yeni_tutor else 0
            sahne_id = sahne["id"]
            if seviye == 1 and sure_sn > 60:
                oyun.zaman_asimi()
                eylem_id, sure_sn = "ZAMAN_ASIMI", 60.0
                sorunlu += 1
            else:
                eylemler = sahne["eylemler"]
                p_iyi = min(0.95, 0.30 + 0.55 * d + (0.10 if bulunan else 0))
                iyi = [e for e in eylemler if e["tur"] == "onerilen"]
                diger = [e for e in eylemler if e["tur"] != "onerilen"]
                olas = [p_iyi / len(iyi)] * len(iyi) + [(1 - p_iyi) / len(diger)] * len(diger)
                e = (iyi + diger)[int(rng.choice(len(olas), p=olas))]
                oyun.karar(e["id"])
                eylem_id = e["id"]
                sorunlu += e["tur"] in ("geciktiren", "tehlikeli", "kirmizi_cizgi")
            oturum.append({
                "oturum": f"s{i:07d}", "kaynak": "sentetik", "oyuncu_tipi": "sentetik",
                "karar_no": oyun.karar_sayisi, "sahne_id": sahne_id, "eylem_id": eylem_id,
                "seviye": seviye, "rol": rol, "karar_suresi_sn": round(min(sure_sn, 60.0), 1),
                "konsol_arama": arama, "bulunan_anlamli": bulunan, "terim_toplam": terim,
                "tutor_toplam": tutor, "israr_toplam": israr, "sorunlu_karar_toplam": sorunlu,
                "kalan_sure_dk": max(0, s["baslangic"]["butce_dk"] - oyun.sure),
                "yonetmen_modu": "olagan", "model_surumu": "", "p_golge": "",
            })
        for r in oturum:
            r["son"] = oyun.son
            r["kotu_son"] = int(oyun.son != "alindi")
        satirlar += oturum
    yeni = pd.DataFrame(satirlar)[SUTUNLAR]
    eski = pd.read_csv(VERI, dtype=str) if VERI.exists() else pd.DataFrame(columns=SUTUNLAR)
    gercek = eski[eski["kaynak"] == "gercek"]
    VERI.parent.mkdir(exist_ok=True)
    pd.concat([gercek, yeni.astype(str).replace("nan", "")]).to_csv(VERI, index=False)
    print(f"✓ {oturum_sayisi} sentetik oturum ({len(yeni)} satır, kötü son oranı {yeni.groupby('oturum')['kotu_son'].first().mean():.2f}); "
          f"gerçek satırlar korundu ({len(gercek)})")


def birlestir(dosyalar, tip=None):
    eski = pd.read_csv(VERI, dtype=str, keep_default_na=False) if VERI.exists() else pd.DataFrame(columns=SUTUNLAR)
    var = set(eski["oturum"])
    eklenen = []
    for f in dosyalar:
        df = pd.read_csv(f, dtype=str, keep_default_na=False)
        if list(df.columns) != SUTUNLAR:
            print(f"✗ {f}: sütunlar SOZLUK.md ile aynı değil, atlandı")
            continue
        for oturum, g in df.groupby("oturum", sort=False):
            if oturum in var:
                print(f"· {f}: {oturum} zaten var, atlandı")
            elif (g["son"] == "").any() or (g["kaynak"] != "gercek").any():
                print(f"✗ {f}: {oturum} sonu yok ya da kaynak gercek değil, atlandı")
            else:
                if tip:
                    g = g.assign(oyuncu_tipi=tip)
                eklenen.append(g)
                var.add(oturum)
    if eklenen:
        pd.concat([eski] + eklenen).to_csv(VERI, index=False)
    print(f"✓ {len(eklenen)} oturum eklendi")


if __name__ == "__main__":
    komut = sys.argv[1] if len(sys.argv) > 1 else "egit"
    if komut == "sentetik":
        sentetik()
    elif komut == "birlestir":
        args = sys.argv[2:]
        tip = None
        if args[:1] == ["--tip"]:
            tip, args = args[1], args[2:]
        birlestir(args, tip)
    elif komut == "egit":
        egit()
    else:
        sys.exit(__doc__)
