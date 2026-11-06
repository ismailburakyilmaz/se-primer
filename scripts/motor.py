"""Oyun motorunun Python karşılığı (src/utils/engine.ts ile aynı kurallar, spec §3).

Yalnızca sentetik veri üretimi ve testler için. Uygulamadaki motor TypeScript'tir;
iki motorun aynı sonucu verdiği tests/test_motor.py ile kontrol edilir.
"""
import json
import pathlib

SENARYO_YOLU = pathlib.Path(__file__).resolve().parent.parent / "scenarios" / "sabah-randevu.json"


def senaryo_yukle(yol=SENARYO_YOLU):
    return json.loads(pathlib.Path(yol).read_text(encoding="utf-8"))


class Oyun:
    def __init__(self, senaryo, rol):
        self.s = senaryo
        self.rol = rol  # 'backend' | 'lider'
        b = senaryo["baslangic"]
        self.sahne_id = b["ilk_sahne"]
        self.sure = b["sure_dk"]
        self.etki = b["etki"]
        self.risk = b["risk"]
        self.koord = b["koordinasyon"]
        self.bayrak = {}
        self.karar_sayisi = 0
        self.son = None

    def sahne(self, sid=None):
        sid = sid or self.sahne_id
        return next(x for x in self.s["sahneler"] if x["id"] == sid)

    def _bitis(self, eylem_tur=None):
        k = self.s["kurallar"]
        if eylem_tur == "kirmizi_cizgi":
            return "ihlal"
        if self.risk >= k["risk_kayip_esigi"] or self.sure > self.s["baslangic"]["butce_dk"]:
            return "alinamadi"
        if all(self.bayrak.get(b) for b in ("hizmet_duzeldi", "uzlastirildi", "devredildi")):
            return "alindi"
        if self.karar_sayisi >= k["karar_siniri"]:
            return "alinamadi"
        return None

    def karar(self, eylem_id):
        k = self.s["kurallar"]
        sahne = self.sahne()
        e = next(x for x in sahne["eylemler"] if x["id"] == eylem_id)
        ek = k["daginik_ek_sure_dk"] if self.koord == 0 else 0
        dk = e["sure_dk"] + ek
        self.sure += dk
        self.etki += k["etki_artisi_dakika_basina"].get(sahne["hizmet"], 0) * dk
        if e.get("etki_sifirla"):
            self.etki = 0
        self.risk += e["etkiler"].get("risk", 0)
        self.koord = max(0, min(2, self.koord + e["etkiler"]["koordinasyon"].get(self.rol, 0)))
        self.bayrak.update(e["etkiler"].get("bayraklar", {}))
        self.karar_sayisi += 1
        self.son = self._bitis(e["tur"])
        if self.son is None:
            self.sahne_id = e["sonraki"]
        return e

    def zaman_asimi(self):
        k = self.s["kurallar"]
        sahne = self.sahne()
        dk = k["zaman_asimi_dk"]
        self.sure += dk
        self.etki += k["etki_artisi_dakika_basina"].get(sahne["hizmet"], 0) * dk
        self.karar_sayisi += 1
        if self.sure > self.s["baslangic"]["butce_dk"] or self.karar_sayisi >= k["karar_siniri"]:
            self.son = "alinamadi"
