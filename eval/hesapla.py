"""Etiketli tutor eval sonuçlarından oranları hesaplar.

Kullanım: python eval/hesapla.py eval/etiketler.csv
etiketler.csv sütunları: calistirma,id,tur,S,Y,G,U,B,K,H,not
(her ölçüt 1 = hata var, 0 = yok; HATA satırları için S..H boş bırakılır)
"""
import csv, sys
from collections import defaultdict

KRITIK = ["S", "Y", "G", "U"]
KUCUK = ["B", "K", "H"]

def oran(a, n):
    return f"{a}/{n} (%{100 * a / n:.0f})" if n else "0/0"

def main(yol):
    satirlar = list(csv.DictReader(open(yol, encoding="utf-8-sig")))
    gecerli = [r for r in satirlar if r["S"].strip() != ""]
    hatali_cagri = len(satirlar) - len(gecerli)
    n = len(gecerli)
    kritik = [r for r in gecerli if any(r[k] == "1" for k in KRITIK)]
    tam = [r for r in gecerli if not any(r[k] == "1" for k in KRITIK + KUCUK)]
    print(f"Toplam satır: {len(satirlar)}  |  geçerli cevap n={n}  |  model çağrısı başarısız: {hatali_cagri}")
    print(f"Kritik hatalı cevap: {oran(len(kritik), n)}")
    print(f"Geçti (kritik hata yok): {oran(n - len(kritik), n)}")
    print(f"Tam geçti (hiç hata yok): {oran(len(tam), n)}")
    print("\nHata türleri:")
    for k in KRITIK + KUCUK:
        print(f"  {k}: {oran(sum(r[k] == '1' for r in gecerli), n)}")
    print("\nGirdi türüne göre geçme (kritik hata yok):")
    gruplar = defaultdict(list)
    for r in gecerli:
        gruplar[r["tur"]].append(r)
    for tur, rs in sorted(gruplar.items()):
        g = sum(not any(r[k] == "1" for k in KRITIK) for r in rs)
        print(f"  {tur:22s} {oran(g, len(rs))}")

if __name__ == "__main__":
    main(sys.argv[1])
