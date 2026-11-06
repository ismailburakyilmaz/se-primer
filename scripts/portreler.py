"""Karakter portreleri: kodla çizilen basit büstler, 1-bit (iki renk) piksel portre.
Yapay zekâ görseli kullanılmaz. Küçük boyda okunsun diye düz mürekkep alanlar, kalın hatlar
ve gövdede tek düzenli nokta deseni (dama) kullanılır; ince kumlama (dithering) yoktur.

Çıktı: assets/portreler/<kisi>-<boy>.png, boy = 48 (mesaj balonu), 96 (karakter kartı), 24 (gösterge)
Noktalar --murekkep (#1F2430), zemin saydam. Her boy kendi pikselinde çizilir; ekranda ölçeklenmez.
"""
import pathlib
from PIL import Image, ImageDraw

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "portreler"
MUREKKEP = (0x1F, 0x24, 0x30, 255)
S = 56  # tasarım ızgarası (56×56); diğer boylar buradan en yakın komşu değil, yeniden çizimle üretilir

# Katmanlar: 0 boş, 1 mürekkep (dolu), 2 dama deseni (orta ton)
def ciz(boy, f):
    k = boy / S
    im = Image.new("L", (boy, boy), 0)
    d = ImageDraw.Draw(im)
    def r(x0, y0, x1, y1):
        a, b = round(x0 * k), round(y0 * k)
        return [a, b, max(a, round(x1 * k) - 1), max(b, round(y1 * k) - 1)]
    f(d, r, max(1, round(2 * k)))
    out = Image.new("RGBA", (boy, boy), (0, 0, 0, 0))
    src, px = im.load(), out.load()
    for y in range(boy):
        for x in range(boy):
            v = src[x, y]
            if v == 1 or (v == 2 and (x + y) % 2 == 0):
                px[x, y] = MUREKKEP
    return out

def bust(d, r, w, govde=2):
    d.ellipse(r(6, 40, 50, 74), fill=govde)            # omuzlar
    d.rectangle(r(24, 34, 32, 42), fill=0)              # boyun boş
    d.ellipse(r(16, 10, 40, 38), fill=0, outline=1, width=w)  # yüz: boş iç, mürekkep hat

def gozler(d, r, y=23):
    d.rectangle(r(22, y, 25, y + 3), fill=1); d.rectangle(r(31, y, 34, y + 3), fill=1)

def mudur(d, r, w):
    bust(d, r, w, govde=1)
    d.polygon([tuple(r(28, 40, 28, 40)[:2]), tuple(r(22, 40, 22, 40)[:2]), tuple(r(28, 47, 28, 47)[:2])], fill=0)  # sol yaka
    d.polygon([tuple(r(28, 40, 28, 40)[:2]), tuple(r(34, 40, 34, 40)[:2]), tuple(r(28, 47, 28, 47)[:2])], fill=0)  # sağ yaka
    d.rectangle(r(27, 43, 30, 56), fill=1)                         # kravat
    d.chord(r(16, 8, 40, 26), 180, 360, fill=1)                    # saç (kısa, düz)
    gozler(d, r); d.rectangle(r(24, 31, 32, 33), fill=1)           # düz ağız

def hemsire(d, r, w):
    bust(d, r, w, govde=0)
    d.ellipse(r(6, 40, 50, 74), outline=1, width=w)                # beyaz önlük: yalnız hat
    d.chord(r(14, 9, 42, 30), 180, 360, fill=1)                    # saç
    d.rectangle(r(13, 18, 17, 34), fill=1); d.rectangle(r(39, 18, 43, 34), fill=1)
    d.rectangle(r(19, 4, 37, 11), fill=0, outline=1, width=w)      # bone
    d.rectangle(r(27, 5, 29, 10), fill=1); d.rectangle(r(25, 7, 31, 8), fill=1)  # artı
    gozler(d, r); d.arc(r(23, 27, 33, 34), 20, 160, fill=1, width=w)

def vty(d, r, w):
    bust(d, r, w, govde=2)
    d.chord(r(15, 7, 41, 27), 180, 360, fill=1)                    # koyu saç
    d.rectangle(r(15, 16, 18, 27), fill=1); d.rectangle(r(38, 16, 41, 27), fill=1)
    d.rectangle(r(19, 20, 27, 27), outline=1, width=w)             # gözlük
    d.rectangle(r(29, 20, 37, 27), outline=1, width=w)
    d.rectangle(r(27, 22, 29, 24), fill=1)
    d.rectangle(r(25, 31, 31, 33), fill=1)

def entegrasyon(d, r, w):
    bust(d, r, w, govde=2)
    d.chord(r(16, 9, 40, 28), 180, 360, fill=1)                    # saç
    d.arc(r(11, 6, 45, 40), 190, 350, fill=1, width=w + 1)         # kulaklık bandı
    d.rectangle(r(10, 20, 15, 30), fill=1); d.rectangle(r(41, 20, 46, 30), fill=1)  # kulaklıklar
    d.line(r(14, 30, 24, 35)[:2] + r(24, 35, 24, 35)[:2], fill=1, width=w)          # mikrofon
    gozler(d, r); d.arc(r(23, 27, 33, 34), 20, 160, fill=1, width=w)

for ad, f in {"mudur": mudur, "hemsire": hemsire, "vty": vty, "entegrasyon": entegrasyon}.items():
    for boy in (24, 48, 96):
        ciz(boy, f).save(OUT / f"{ad}-{boy}.png", optimize=True)
    print("✓", ad)
