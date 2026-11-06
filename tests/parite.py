"""Test Kahini (Oracle): aynı model.onnx'i Python'da çalıştırır (spec §8 kabul örneği 10).

  python tests/parite.py --yaz                 # model/model.onnx ile p değerlerini parite.json'a yazar
  python tests/parite.py                       # parite.json'daki p'leri yeniden hesaplayıp karşılaştırır
  python tests/parite.py --url <resolve-url>   # aynı kontrol, Hugging Face'teki commit'e sabit dosyayla
  python tests/parite.py --sunucu <api-url>    # bonus: sunucu tüketicisinin cevaplarını karşılaştırır

Fark tolerans (1e-4) değerini aşarsa çıkış kodu 1.
"""
import argparse
import hashlib
import json
import pathlib
import sys
import urllib.request

import numpy as np
import onnxruntime as ort

KOK = pathlib.Path(__file__).resolve().parent.parent
PARITE = KOK / "tests" / "parite.json"
CONFIG = KOK / "model" / "config.json"


def model_baytlari(url):
    if url:
        with urllib.request.urlopen(url, timeout=60) as r:
            return r.read()
    return (KOK / "model" / "model.onnx").read_bytes()


def hesapla(bayt, girdiler, ozellikler):
    oturum = ort.InferenceSession(bayt)
    X = np.array([[g["x"][o] for o in ozellikler] for g in girdiler], dtype=np.float32)
    return oturum.run(["probabilities"], {"input": X})[0][:, 1].astype(float)


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--yaz", action="store_true")
    a.add_argument("--url")
    a.add_argument("--commit")
    a.add_argument("--sunucu")
    arg = a.parse_args()

    par = json.loads(PARITE.read_text(encoding="utf-8"))
    ozellikler = [f["name"] for f in json.loads(CONFIG.read_text(encoding="utf-8"))["features"]]
    bayt = model_baytlari(arg.url)
    p = hesapla(bayt, par["girdiler"], ozellikler)
    tol = par["tolerans"]

    if arg.yaz:
        for g, v in zip(par["girdiler"], p):
            g["p"] = round(float(v), 6)
        par["model"] = {"kaynak": arg.url or "model/model.onnx", "commit": arg.commit,
                        "sha256": hashlib.sha256(bayt).hexdigest()}
        PARITE.write_text(json.dumps(par, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        for g in par["girdiler"]:
            print(f"{g['id']}  p={g['p']:.6f}  {g['ad']}")
        print(f"✓ yazıldı → {PARITE}")
        return

    hatali = 0
    karsi = None
    if arg.sunucu:
        karsi = []
        for g in par["girdiler"]:
            istek = urllib.request.Request(arg.sunucu, data=json.dumps({"inputs": g["x"]}).encode(),
                                           headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(istek, timeout=60) as r:
                karsi.append(float(json.loads(r.read())["p"]))
    for i, g in enumerate(par["girdiler"]):
        hedef = karsi[i] if karsi else float(p[i])
        fark = abs(hedef - g["p"])
        durum = "✓" if fark < tol else "✗"
        hatali += fark >= tol
        print(f"{durum} {g['id']}  beklenen {g['p']:.6f}  bulunan {hedef:.6f}  |Δ|={fark:.1e}")
    if hatali:
        sys.exit(f"✗ {hatali} girdi tolerans dışında ({tol})")
    print(f"✓ 5 girdinin hepsi |Δ| < {tol}")


if __name__ == "__main__":
    main()
