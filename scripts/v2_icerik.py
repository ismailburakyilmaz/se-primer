"""SE Primer v2 içerik eklemesi (spec 2.0, §3.2, §3.4, §3.6, §12, §13.5, §15).

scenarios/sabah-randevu.json'a v2 alanlarını ekler. Mevcut alanlara dokunmaz
(motorun ve v1 testlerinin kullandığı her şey aynen kalır). Tekrar çalıştırılabilir.

Çalıştırma: python scripts/v2_icerik.py
"""
import json
import pathlib

YOL = pathlib.Path(__file__).resolve().parent.parent / "scenarios" / "sabah-randevu.json"
d = json.loads(YOL.read_text(encoding="utf-8"))

d["surum"] = "2.0"

# --- Karakter kartları (§3.6). `kisiler` v1 ile uyum için aynen kalır. ---
d["karakterler"] = {
    "mudur": {"ad": "Kemal Aras", "gorev": "Bilgi İşlem Müdürü",
              "tanim": "Yirmi yıldır hastanede. Kısa konuşur, başhekime hesap verir; belirsizlikten hoşlanmaz."},
    "hemsire": {"ad": "Sevgi Doğan", "gorev": "Poliklinik Sorumlu Hemşiresi",
                "tanim": "Bankonun önündeki kalabalığı ilk gören kişi. Sistemi değil hastayı konuşur."},
    "vty": {"ad": "Deniz Kaya", "gorev": "Veritabanı Yöneticisi",
            "tanim": "Temkinli. Geri alınamayacak bir işlemi onaysız yapmaz; bir şeyi sormadan önce logu açar."},
    "entegrasyon": {"ad": "Burcu Tan", "gorev": "Entegrasyon Ekibi",
                    "tanim": "SMS onay servisinin sahibi ekipte. Kendi servisine testsiz dokunulmasına izin vermez."},
}
d["guven_kisisi"] = "vty"
d["soguk_mesaj"] = {"kisi": "vty", "metin": "Herkes bir yerden dokunuyor. Ne yapacağımızı tek kişi söylesin, ben bekliyorum."}

# --- Tutor ısrar kalıpları (§6.2) ---
d["israr_kaliplari"] = ["hangisi", "hangisini", "doğru cevap", "dogru cevap", "cevabı söyle",
                        "söyle", "seçeyim", "seceyim", "evet mi hayır mı", "sadece evet", "a mı b mi"]

# Kanıt, mesaj, anlatım ve log metinlerinde dokunulabilen, dokununca konsolda aranan ifadeler (§12.1)
d["aranabilir_ifadeler"] = ["hasta_tel", "iletisim_tel", "v4.1", "v4.2", "column", "kolon", "sms", "disk",
                             "420", "test", "telefon", "entegrasyon", "görünüm", "bekleyen", "kanal",
                             "maskele", "hata oranı", "%38"]

# --- Karar tarzı kuralları (§15.3) ---
d["profil_kurallari"] = {
    "kanitci": {"ad": "Kanıtçı", "aciklama": "Kararlarının çoğundan önce kanıtı kendin aradın.",
                "kural": "konsol_aramali_karar_orani >= 0.5"},
    "aceleci": {"ad": "Acele eden", "aciklama": "Kararlarının çoğunu kanıta bakmadan, hızlıca verdin. Krizde hız değerlidir; ama ilk dakikalar genellikle en çok bilgi kazandıran dakikalardır.",
                "kural": "hizli_ve_aramasiz_karar_orani >= 0.5 (hızlı: karar_suresi_sn < 10)"},
    "otoriteye_uyan": {"ad": "Otoriteye uyan", "aciklama": "Müdürün söylediğini yaptın. Baskı gerçekti; ama yöneticinin isteği bir kanıt değildir.",
                       "kural": "mudur_onerisi: true olan bir eylem seçildi"},
    "yetki_zorlayan": {"ad": "Yetkisini zorlayan", "aciklama": "Başka bir ekibin sorumluluğundaki bir şeye kendin müdahale etmeye çalıştın.",
                       "kural": "yetki_disi: true olan bir eylem seçildi"},
    "veriyi_hafife_alan": {"ad": "Veriyi hafife alan", "aciklama": "Kişisel veriyi korumayan bir yol seçtin.",
                           "kural": "veri_korumayan: true olan bir eylem seçildi"},
    "dengeli": {"ad": "Dengeli", "aciklama": "Belirgin tek bir eğilim görünmedi.", "kural": "hiçbiri uymazsa"},
    "oncelik": ["veriyi_hafife_alan", "yetki_zorlayan", "otoriteye_uyan", "aceleci", "kanitci", "dengeli"],
}

# --- Postmortem (§15.5) ---
d["postmortem"] = {
    "kok_neden": {
        "soru": "Kök neden",
        "secenekler": [
            {"id": "kn_kolon", "metin": "v4.2, başka bir servisin hâlâ okuduğu bir kolonun adını değiştirdi.", "dogru": True},
            {"id": "kn_disk", "metin": "Rapor sunucusunun diski doldu.", "dogru": False},
            {"id": "kn_sms", "metin": "SMS onay servisinde bir yazılım hatası vardı.", "dogru": False},
            {"id": "kn_surum", "metin": "v4.2 sürümü gece yarısı yayınlandı.", "dogru": False},
        ],
    },
    "tetikleyici": {
        "soru": "Tetikleyici",
        "secenekler": [
            {"id": "tt_surum", "metin": "Kolon değişikliğinin, onu kullanan servislere sorulmadan yayına alınması.", "dogru": True},
            {"id": "tt_geri", "metin": "Sabah yapılan geri dönüş.", "dogru": False},
            {"id": "tt_trafik", "metin": "Sabah 08:00'deki yoğun randevu trafiği.", "dogru": False},
        ],
    },
    "kalici_duzeltme": {
        "soru": "Kalıcı düzeltme",
        "secenekler": [
            {"id": "kd_sozlesme", "metin": "Entegrasyon Ekibi SMS servisini yeni kolona taşır; kolon değişiklikleri bundan sonra iki aşamada yapılır (önce ekle, herkes geçince eskiyi kaldır).", "dogru": True},
            {"id": "kd_gorunum", "metin": "Geri uyumlu görünüm kalıcı olarak bırakılır.", "dogru": False},
            {"id": "kd_gece", "metin": "Sürümler gece değil gündüz yayınlanır.", "dogru": False},
        ],
    },
}

# --- Hafıza mesajları (§15.8) ---
d["hafiza_mesajlari"] = {
    "onceki_geri_don": {"kisi": "vty", "metin": "Geçen sefer ilk iş geri dönmüştük, hatırlıyor musun? Bu sefer önce bir bakalım."},
    "onceki_ihlal": {"kisi": "mudur", "metin": "Geçen seferki log olayından sonra hukuk hâlâ bizi arıyor. Bugün dikkatli olalım."},
    "onceki_alindi": {"kisi": "hemsire", "metin": "Geçen sefer çabuk toparladınız, bugün de size güveniyoruz."},
    "onceki_alinamadi": {"kisi": "entegrasyon", "metin": "Geçen sefer devir notu gelmemişti. Bu sefer bize ne yaptığınızı yazın lütfen."},
}


def satir(i, saat, kaynak, etiket, backend, lider, anahtar, gurultu=False):
    return {"id": i, "saat": saat, "kaynak": kaynak, "etiket": etiket,
            "metin_backend": backend, "metin_lider": lider,
            "anahtar": anahtar, "gurultu": gurultu}


LOG = {
    "S1": [
        satir("S1_l1", "23:29:40", "deploy", "Doğrulandı",
              "deploy randevu-web v4.2 started by ci-bot (change #4821)",
              "#yayin 23:29 · CI: randevu-web v4.2 yayını başladı (değişiklik #4821)",
              ["deploy", "v4.2", "4821", "yayın"]),
        satir("S1_l2", "23:31:05", "db-migrate", "Doğrulandı",
              "migration 0412_iletisim: ALTER TABLE randevu RENAME COLUMN hasta_tel TO iletisim_tel; OK",
              "#veritabani 23:31 · Gece yayınıyla bir tablo değişikliği uygulandı: 'hasta_tel' kolonunun adı 'iletisim_tel' oldu",
              ["migration", "hasta_tel", "iletisim_tel", "alter", "kolon", "column"]),
        satir("S1_l3", "23:33:10", "deploy", "Doğrulandı",
              "deploy randevu-web v4.2 finished; healthcheck 200",
              "#yayin 23:33 · CI: yayın tamamlandı, sağlık kontrolü başarılı",
              ["deploy", "healthcheck", "v4.2"]),
        satir("S1_l4", "07:58:12", "sms-onay", "Belirti",
              "ERROR sms-onay: column \"hasta_tel\" does not exist (query: SELECT hasta_tel FROM randevu WHERE id=$1)",
              "#entegrasyon 07:58 · SMS servisi 'hasta_tel kolonu yok' hatası veriyor",
              ["hasta_tel", "column", "sms", "error", "hata"]),
        satir("S1_l5", "07:58:13", "randevu-web", "Belirti",
              "WARN randevu-web: /onay POST 502 upstream=sms-onay latency=1840ms",
              "#backend 07:58 · Onay adımı SMS servisinden cevap alamıyor",
              ["502", "onay", "sms", "warn"]),
        satir("S1_l6", "08:00:00", "izleme", "Doğrulandı",
              "ALERT onay_hata_orani=38% (esik 5%) since 07:58",
              "#alarm 08:00 · Onay hata oranı %38 (eşik %5)",
              ["alert", "alarm", "onay", "38"]),
        satir("S1_l7", "06:12:44", "rapor-sunucu", "Belirti",
              "WARN disk /var/rapor 85% used",
              "#altyapi 06:12 · Rapor sunucusunda disk %85 dolu",
              ["disk", "rapor", "85"], gurultu=True),
        satir("S1_l8", "07:45:02", "randevu-web", "Bilinmiyor",
              "INFO randevu-web: /randevu GET 200 latency=120ms",
              "#backend 07:45 · Randevu sorgulama normal",
              ["randevu", "200", "info"], gurultu=True),
        satir("S1_l9", "07:50:30", "auth", "Bilinmiyor",
              "INFO auth: token refresh ok (1243 aktif oturum)",
              "#altyapi 07:50 · Giriş servisi normal",
              ["auth", "token", "oturum"], gurultu=True),
        satir("S1_l10", "07:55:00", "cron", "Bilinmiyor",
              "INFO cron: gece_yedek tamamlandı (12m40s)",
              "#altyapi 07:55 · Gece yedeği tamamlandı",
              ["yedek", "cron", "backup"], gurultu=True),
        satir("S1_l11", "07:59:41", "sms-onay", "Belirti",
              "ERROR sms-onay: column \"hasta_tel\" does not exist (retry 3/3, giving up)",
              "#entegrasyon 07:59 · SMS servisi üç denemeden sonra vazgeçiyor",
              ["hasta_tel", "retry", "sms", "error"]),
        satir("S1_l12", "08:01:15", "lab", "Bilinmiyor",
              "INFO lab-entegrasyon: 48 sonuç aktarıldı",
              "#lab 08:01 · Laboratuvar aktarımı normal",
              ["lab", "sonuç"], gurultu=True),
        satir("S1_l13", "08:02:03", "randevu-web", "Bilinmiyor",
              "INFO randevu-web: /randevu/ara GET 200 latency=95ms",
              "#backend 08:02 · Randevu arama normal",
              ["arama", "200"], gurultu=True),
        satir("S1_l14", "08:02:50", "izleme", "Bilinmiyor",
              "INFO cpu randevu-db 22%, bağlantı 41/200",
              "#alarm 08:02 · Veritabanı yükü normal",
              ["cpu", "db", "veritabani"], gurultu=True),
    ],
    "S1R": [
        satir("S1R_l1", "08:12:40", "deploy", "Doğrulandı",
              "rollback randevu-web v4.1 finished; healthcheck 500",
              "#yayin 08:12 · v4.1'e dönüldü; sağlık kontrolü başarısız",
              ["rollback", "v4.1", "500", "geri"]),
        satir("S1R_l2", "08:12:55", "randevu-web", "Doğrulandı",
              "ERROR randevu-web: column \"hasta_tel\" does not exist (v4.1 RandevuRepo.findAll)",
              "#backend 08:12 · Eski sürüm de 'hasta_tel kolonu yok' diyor; bütün ekranlar etkilendi",
              ["hasta_tel", "column", "v4.1", "error"]),
        satir("S1R_l3", "08:13:20", "izleme", "Doğrulandı",
              "ALERT randevu_hata_orani=100% /randevu /onay /iptal",
              "#alarm 08:13 · Bütün randevu ekranlarında hata %100",
              ["alert", "100", "randevu"]),
        satir("S1R_l4", "08:14:02", "db", "Doğrulandı",
              "INFO randevu-db: 420 satırda iletisim_tel dolu (23:31 sonrası kayıtlar)",
              "#veritabani 08:14 · Gece yarısından beri 420 yeni randevunun telefonu yeni kolonda",
              ["420", "iletisim_tel", "kayit", "db"]),
        satir("S1R_l5", "08:14:30", "cron", "Bilinmiyor",
              "INFO cron: rapor_ozet tamamlandı",
              "#altyapi 08:14 · Rapor özeti tamamlandı",
              ["rapor", "cron"], gurultu=True),
    ],
    "S2": [
        satir("S2_l1", "08:16:10", "git", "Doğrulandı",
              "sms-onay@main src/OnayRepo.java:42 SELECT hasta_tel FROM randevu (son değişiklik 14 ay önce)",
              "#entegrasyon 08:16 · SMS servisinin kodu eski kolon adını okuyor; 14 aydır değişmemiş",
              ["sms", "hasta_tel", "kod", "git"]),
        satir("S2_l2", "08:17:00", "sahiplik", "Doğrulandı",
              "CODEOWNERS sms-onay/* @entegrasyon-ekibi (deploy: yalnızca entegrasyon pipeline)",
              "#entegrasyon 08:17 · SMS servisinin sahibi ve dağıtıcısı Entegrasyon Ekibi",
              ["owner", "sahip", "codeowners", "yetki", "deploy"]),
        satir("S2_l3", "08:17:45", "db", "Doğrulandı",
              "INFO randevu-db: VIEW desteği açık; test ortamı (randevu-db-test) güncel",
              "#veritabani 08:17 · Test veritabanı güncel, görünüm (view) tanımlanabilir",
              ["view", "görünüm", "test", "db"]),
        satir("S2_l4", "08:18:20", "izleme", "Belirti",
              "INFO kuyruk onay_bekliyor=231",
              "#alarm 08:18 · Onay bekleyen talep 231",
              ["kuyruk", "bekliyor", "onay"]),
        satir("S2_l5", "08:18:40", "randevu-web", "Bilinmiyor",
              "INFO randevu-web: /randevu GET 200 latency=110ms",
              "#backend 08:18 · Randevu sorgulama normal",
              ["randevu", "200"], gurultu=True),
        satir("S2_l6", "08:19:05", "auth", "Bilinmiyor",
              "INFO auth: token refresh ok (1310 aktif oturum)",
              "#altyapi 08:19 · Giriş servisi normal",
              ["auth", "oturum"], gurultu=True),
    ],
    "S2R": [
        satir("S2R_l1", "08:24:00", "sms-onay", "Doğrulandı",
              "INFO sms-onay: devre dışı (feature flag sms_adimi=false); gönderilen=0",
              "#entegrasyon 08:24 · SMS adımı kapalı; sabahtan beri hiç SMS gitmedi",
              ["sms", "flag", "kapalı", "gönderilen"]),
        satir("S2R_l2", "08:30:10", "cagri-merkezi", "Doğrulandı",
              "INFO çağrı merkezi: 'randevu saatim ne' araması 64 (son 30 dk)",
              "#poliklinik 08:30 · Çağrı merkezine saat soran 64 arama",
              ["çağrı", "arama", "hasta"]),
        satir("S2R_l3", "08:31:00", "sms-onay", "Doğrulandı",
              "ERROR sms-onay (test): column \"hasta_tel\" does not exist",
              "#entegrasyon 08:31 · SMS açılırsa aynı kolon hatası tekrar edecek (testte denendi)",
              ["hasta_tel", "test", "sms", "error"]),
        satir("S2R_l4", "08:31:30", "cron", "Bilinmiyor",
              "INFO cron: rapor_ozet tamamlandı",
              "#altyapi 08:31 · Rapor özeti tamamlandı",
              ["rapor", "cron"], gurultu=True),
    ],
    "S3": [
        satir("S3_l1", "08:41:00", "izleme", "Doğrulandı",
              "INFO onay_hata_orani=0% since 08:40",
              "#alarm 08:41 · Onay hata oranı %0",
              ["onay", "0", "hata"]),
        satir("S3_l2", "08:41:30", "randevu-web", "Doğrulandı",
              "ERROR dump: hasta=A*** Y****, tel=05** *** ** 12, tc=***********, hata=column not found",
              "#backend 08:41 · Hata kayıtlarında hasta adı, soyadı ve telefon açık duruyor (örnek maskelendi)",
              ["hasta", "ad", "tel", "kişisel", "kvkk", "dump"]),
        satir("S3_l3", "08:42:00", "maskeleme", "Doğrulandı",
              "tools/maskele.py --alanlar ad,soyad,tel,tc mevcut (son kullanım: 3 hafta önce, onaylı)",
              "#guvenlik 08:42 · Onaylı maskeleme betiği hazır: ad, soyad, telefon, TC",
              ["maskele", "maske", "betik", "kvkk"]),
        satir("S3_l4", "08:42:20", "kanal", "Doğrulandı",
              "kanal #genel: 312 üye (dış tedarikçiler dahil) · kanal #olay-0412: 9 üye",
              "#yonetim 08:42 · Genel kanalda dış tedarikçiler dahil 312 kişi var; olay kanalında 9",
              ["kanal", "genel", "olay", "üye"]),
        satir("S3_l5", "08:43:00", "randevu-web", "Belirti",
              "INFO log şeması: ad ve soyad 'hasta' alanında, telefon ayrı 'tel' alanında",
              "#backend 08:43 · Kayıtta ad-soyad ile telefon ayrı alanlarda tutuluyor",
              ["şema", "alan", "tel", "hasta", "sütun"]),
        satir("S3_l6", "08:43:30", "auth", "Bilinmiyor",
              "INFO auth: token refresh ok",
              "#altyapi 08:43 · Giriş servisi normal",
              ["auth"], gurultu=True),
    ],
    "S4": [
        satir("S4_l1", "08:52:00", "izleme", "Doğrulandı",
              "INFO onay_hata_orani=0%; kuyruk onay_bekliyor=214 (en eski 07:58)",
              "#alarm 08:52 · Hata %0 ama 214 talep hâlâ onay bekliyor (en eskisi 07:58)",
              ["kuyruk", "bekliyor", "214", "onay"]),
        satir("S4_l2", "08:52:30", "sms-onay", "Doğrulandı",
              "INFO sms-onay: 07:58–08:40 arası gönderilemeyen 187 SMS (yeniden gönderilmedi)",
              "#entegrasyon 08:52 · Sabah gönderilemeyen 187 SMS bekliyor",
              ["sms", "187", "gönderilemeyen"]),
        satir("S4_l3", "08:53:00", "db", "Doğrulandı",
              "INFO randevu-db: VIEW randevu_eski_uyum aktif (geçici, sahibi: vty)",
              "#veritabani 08:53 · Geçici görünüm çalışıyor; kalıcı çözüm değil",
              ["view", "görünüm", "geçici"]),
        satir("S4_l4", "08:53:20", "takip", "Bilinmiyor",
              "JIRA ENT-311 'SMS servisini iletisim_tel kolonuna taşı' durum=ATANMADI",
              "#entegrasyon 08:53 · Kalıcı düzeltme kaydı açık, kimseye atanmamış",
              ["jira", "kalıcı", "devir", "ent-311"]),
        satir("S4_l5", "08:54:00", "cron", "Bilinmiyor",
              "INFO cron: rapor_ozet tamamlandı",
              "#altyapi 08:54 · Rapor özeti tamamlandı",
              ["rapor"], gurultu=True),
    ],
}

ONERI = {
    "S1": ["hasta_tel", "deploy", "disk"],
    "S1R": ["v4.1", "hasta_tel", "420"],
    "S2": ["sahip", "view", "hasta_tel"],
    "S2R": ["sms", "test", "çağrı"],
    "S3": ["maskele", "kanal", "tel"],
    "S4": ["bekliyor", "sms", "kalıcı"],
}

# Olay Yönetmeni mesajları (§13.5). Cevabı söylemez; bir kanıta ya da aramaya yönlendirir.
YONETMEN = {
    "S1R": {"destek": {"kisi": "vty", "metin": "Bir dakika. Eski sürüm neyi arıyor, veritabanında ne duruyor? Logda gece yarısına bakan oldu mu?"},
            "baski": {"kisi": "mudur", "metin": "Başhekim üçüncü kez aradı. Beş dakika içinde ne yapacağımızı duymak istiyorum."}},
    "S2": {"destek": {"kisi": "vty", "metin": "SMS servisinin kimde olduğuna bakmadan bir şey yapmayalım. Konsolda sahiplik kaydı var."},
           "baski": {"kisi": "mudur", "metin": "Kaynağı bulduysanız neden hâlâ düzelmedi? Kuyruk her dakika büyüyor."}},
    "S2R": {"destek": {"kisi": "vty", "metin": "SMS'i açarsak ne olur, testte denedik mi? Konsolda test ortamının kaydına bir bak."},
            "baski": {"kisi": "mudur", "metin": "Çağrı merkezi kilitlendi. Bir karar verin."}},
    "S3": {"destek": {"kisi": "vty", "metin": "Logu kime göndereceğimize karar vermeden önce içinde tam olarak ne var, bir bakalım. Kanalların üye listesi de konsolda."},
           "baski": {"kisi": "mudur", "metin": "Entegrasyon bekliyor, herkes bekliyor. Logu verin gitsin."}},
    "S4": {"destek": {"kisi": "vty", "metin": "Grafik yeşil ama kuyruğa baktın mı? Konsolda bekleyen taleplerin sayısı var."},
           "baski": {"kisi": "mudur", "metin": "Toplantıya giriyorum, olay kapandı diye yazabilir miyim?"}},
}

HARITA = {  # §15.7: web, api, db, sms → normal | bozuk | coktu | duzeldi
    "S1": {"web": "bozuk", "api": "normal", "db": "normal", "sms": "bozuk"},
    "S1R": {"web": "coktu", "api": "coktu", "db": "normal", "sms": "bozuk"},
    "S2": {"web": "bozuk", "api": "normal", "db": "normal", "sms": "bozuk"},
    "S2R": {"web": "normal", "api": "normal", "db": "normal", "sms": "bozuk"},
    "S3": {"web": "duzeldi", "api": "normal", "db": "duzeldi", "sms": "duzeldi"},
    "S4": {"web": "duzeldi", "api": "normal", "db": "duzeldi", "sms": "duzeldi"},
}
HARITA_DOKUNUS = {  # kararın dokunduğu parça ("Ne oldu" panelinde vurgulanır)
    "S1_geri_don": "web", "S1_incele": "db", "S1_disk": None,
    "S1R_ileri_don": "web", "S1R_semayi_geri_al": "db",
    "S2_gorunum": "db", "S2_sms_kapat": "sms", "S2_kendin_duzelt": "sms",
    "S2R_gorunum": "db", "S2R_telefon": None,
    "S3_maskele": None, "S3_genel_kanal": None, "S3_sayilar": None,
    "S4_uzlastir": "sms", "S4_kapat": None,
    "S1_yeniden_baslat": "web", "S2_bekle": "sms", "S3_eposta": None, "S4_notsuz_kapat": "sms",
}

KISA = {  # Baskı altında karar: kısa anlatım (§6.1)
    "S1": "08:00. Gece v4.2 yayınlandı; onay adımı hata veriyor. Sıra uzuyor.",
    "S1R": "Geri dönüş bitti; artık bütün randevu ekranları hata veriyor.",
    "S2": "Kaynak belli: kolon adı değişti, SMS servisi bilmiyor. Servis başka ekibin.",
    "S2R": "Onaylar geçiyor ama hastalara SMS gitmiyor. Poliklinik karıştı.",
    "S3": "Onaylar düzeldi. Entegrasyon logları istiyor; logda hasta bilgisi var.",
    "S4": "Grafik yeşil, müdür kapatmak istiyor. Bekleyen talepler hâlâ sistemde.",
}

# Dekker: "Bu karar o an neden mantıklıydı?" (§7)
MANTIK = {
    "S1_geri_don": "Hata sürümden hemen sonra başlamıştı ve en yetkili kişi geri dönüş istiyordu. Çoğu olayda son değişikliği geri almak gerçekten ilk denenecek şeydir.",
    "S1_incele": "Neyin değiştiğini bilmeden yapılan her müdahale yeni bir bilinmeyen ekler; on beş dakika, yanlış bir geri dönüşten daha ucuz görünüyordu.",
    "S1_disk": "Disk uyarısı somut ve çözülebilir bir şeydi; belirsizlik içinde elle tutulur bir işe yönelmek doğal bir tepki.",
    "S1R_ileri_don": "Durum geri dönüşten sonra kötüleşmişti; bilinen son 'daha az kötü' hâle dönmek kaybı durduruyordu.",
    "S1R_semayi_geri_al": "Kod ile veritabanı uyumsuzdu; ikisini birlikte geri almak simetrik ve mantıklı görünüyordu.",
    "S2_gorunum": "Yetkin olan yerden, başka ekibin servisine dokunmadan sorunu durdurmanın yolunu aradın.",
    "S2_sms_kapat": "Hata SMS adımındaydı; o adımı devreden çıkarmak ekranı hemen düzeltiyordu.",
    "S2_kendin_duzelt": "Düzeltme tek satır gibi görünüyordu ve beklemenin bedeli her dakika artıyordu.",
    "S2R_gorunum": "Ekran düzelmişti ama gerçek amaç hastanın haberdar olmasıydı; sorunun yer değiştirdiğini gördün.",
    "S2R_telefon": "Hastaların saatini öğrenmesi acildi; insanları doğrudan aramak en hızlı görünen yoldu.",
    "S3_maskele": "Kişisel veriyi paylaşmadan önce korumanın bir yolu vardı ve onaylıydı.",
    "S3_genel_kanal": "Telefon numarasını silmek veriyi temizlemiş gibi görünüyordu ve müdür acele ediyordu.",
    "S3_sayilar": "Logun kendisi yerine sorunu anlatan sayılar yeterli olabilirdi; veriyi hiç dışarı çıkarmamak güvenliydi.",
    "S4_uzlastir": "Hata oranı sıfırdı ama bekleyen hastalar hâlâ bekliyordu; olay hastalar için bitmemişti.",
    "S4_kapat": "Grafik yeşildi ve sabahtan beri ilk kez her şey normal görünüyordu.",
}

ETIKET = {  # §15.3 profil işaretleri
    "S1_geri_don": {"mudur_onerisi": True},
    "S2_kendin_duzelt": {"yetki_disi": True},
    "S1R_semayi_geri_al": {"yetki_disi": True},
    "S3_genel_kanal": {"mudur_onerisi": True, "veri_korumayan": True},
    "S4_kapat": {"mudur_onerisi": True},
    "S3_eposta": {"veri_korumayan": True},
}

# --- v2: her ana sahneye gerçek olaylarda sık görülen bir hata seçeneği (ezberi kırmak için) ---
def _eylem(id, mb, ml, tur, dk, risk, kb, kl, bayrak, sonraki, ek, ne, neden, uzun, o_an, sonra, vars_, mantik, harita, **etiket):
    e = {"id": id, "metin_backend": mb, "metin_lider": ml, "tur": tur, "sure_dk": dk,
         "etkiler": {"risk": risk, "koordinasyon": {"backend": kb, "lider": kl}, "bayraklar": bayrak},
         "sonraki": sonraki}
    if ek:
        e["ek_mesaj"] = ek
    e.update({"ne_oldu": ne, "neden_oldu": neden, "neden_oldu_uzun": uzun,
              "degerlendirme": {"o_an": o_an, "sonradan": sonra, "varsayim": vars_, "o_an_mantigi": mantik},
              "harita_dokunus": harita})
    e.update(etiket)
    return e

YENI_EYLEMLER = {
    "S1": _eylem(
        "S1_yeniden_baslat", "Uygulama sunucularını yeniden başlat",
        "Altyapı ekibinden bütün uygulama sunucularını yeniden başlatmasını iste",
        "geciktiren", 10, 0, 0, -1, {}, "S1",
        {"kisi": "hemsire", "metin": "Sistem birkaç dakika tamamen kapandı, açıldı; onay yine hata veriyor."},
        "Sunucular on dakikada yeniden açıldı; onay adımı aynı hatayı vermeye devam ediyor.",
        "Hata bellekte ya da süreçte değil, servisin okuduğu veride; yeniden başlatmak veriyi değiştirmez.",
        "Yeniden başlatma, geçici durumdan kaynaklanan hataları (bellek sızıntısı, takılmış bağlantı) giderir. Burada hata, servisin veritabanında artık bulunmayan bir kolonu aramasından geliyor; servis yeniden açıldığında da aynı kolonu arar. Üstelik yeniden başlatma sırasında sistem birkaç dakika tamamen kapalı kaldı.",
        "Hata aniden başlamıştı; yeniden başlatmak en hızlı denenebilecek şeydi.",
        "Servis yeniden açılınca aynı kolonu aramaya devam etti.",
        "Hatanın geçici bir durumdan kaynaklandığını varsaydın.",
        "Birçok üretim hatası gerçekten yeniden başlatmayla geçer; denemesi ucuz ve hızlı görünüyordu.",
        "web"),
    "S2": _eylem(
        "S2_bekle", "Entegrasyon Ekibi'nden SMS servisini yeni kolona taşımalarını iste ve onları bekle",
        "Entegrasyon Ekibi'ne kalıcı düzeltme talebi aç; onlar düzeltene kadar bekleyin",
        "geciktiren", 20, 0, 0, 0, {}, "S2",
        {"kisi": "entegrasyon", "metin": "Talebi aldık. Test ve onaydan geçmesi en erken öğleden sonrayı bulur."},
        "Talep açıldı; Entegrasyon Ekibi düzeltmenin öğleden sonrayı bulacağını söyledi. Yirmi dakikadır onaylar hâlâ hata veriyor.",
        "Kalıcı düzeltmeyi doğru ekipten istedin, ama bu sırada etkiyi durduracak geçici bir önlem almadın.",
        "Olay müdahalesinde iki iş vardır: önce etkiyi durdurmak (geçici önlem), sonra kalıcı düzeltme. Kalıcı düzeltme başka bir ekibin sürecine bağlıysa saatler sürebilir; bu sürede kendi yetki alanında etkiyi durduracak bir yol aramak gerekir.",
        "Sorunun SMS servisinde olduğunu ve servisin başka bir ekibe ait olduğunu biliyordun.",
        "Kalıcı düzeltme öğleden sonrayı bulacaktı; etkiyi durduracak geçici bir yol senin elindeydi.",
        "Sorunu ancak servisin sahibinin çözebileceğini varsaydın.",
        "Başka ekibin servisine dokunmamak doğruydu; sahibine haber vermek de gerekliydi.",
        "sms"),
    "S3": _eylem(
        "S3_eposta", "Ham logu yalnızca Entegrasyon Ekibi'ne doğrudan e-postayla gönder",
        "Ham logun yalnızca Entegrasyon Ekibi'ne e-postayla gönderilmesini onayla",
        "tehlikeli", 20, 40, -1, -1, {}, "S4",
        {"kisi": "vty", "metin": "Ham log maskelenmeden kurum e-postasından çıktı. Güvenlik ekibine bildirmemiz gerekecek."},
        "Entegrasyon Ekibi logu aldı. Güvenlik ekibi maskelenmemiş hasta verisinin e-postayla dolaştığını fark etti; e-postanın kimlere ulaştığını çıkarmak ve kaydı tutmak yirmi dakika sürdü, ekip dağıldı.",
        "Logu yalnızca gereken ekibe gönderdin, ama kişisel veriyi maskelemeden gönderdin; e-posta kopyaları kontrolün dışına çıkar.",
        "Erişimi daraltmak doğru bir adım ama yeterli değil. KVKK'nın veri en aza indirme ilkesine göre iş için gerekmeyen kişisel veri paylaşılmaz; hatayı ayıklamak için hastanın adı ve telefonu gerekmez. E-posta ekleri yönlendirilebilir, yedeklenir ve silindiği takip edilemez.",
        "Logda hasta bilgileri vardı ama yalnızca Entegrasyon Ekibi'ne gidecekti.",
        "Maskelenmemiş veri e-posta sunucularında kopyalanmıştı.",
        "Alıcıyı sınırlamanın veriyi korumaya yeteceğini varsaydın.",
        "Genel kanal yerine yalnızca ilgili ekibe göndermek riski gerçekten azaltıyordu.",
        None, veri_korumayan=True),
    "S4": _eylem(
        "S4_notsuz_kapat", "Bekleyen talepleri onayla, SMS'leri yeniden gönder ve olayı kapat",
        "Uzlaştırmayı ata; bitince olayı kapat",
        "geciktiren", 15, 0, 0, 0, {"uzlastirildi": True}, "S4",
        {"kisi": "entegrasyon", "metin": "Olay kapanmış ama kalıcı düzeltme bize devredilmedi. Görünüm ne zaman kalkacak, kim takip edecek?"},
        "Bekleyen talepler onaylandı, hastalara SMS gitti. Olay kapanınca Entegrasyon Ekibi kalıcı düzeltmeyi kimin üstlendiğini sordu; olay yeniden açıldı.",
        "Hastalar üzerindeki etkiyi giderdin, ama geçici çözümle kalıcı düzeltme arasında sahipsiz bir boşluk bıraktın.",
        "Geri uyumlu görünüm geçici bir köprü. Kalıcı düzeltme bir ekibe yazılı olarak devredilmezse köprü aylarca kalır ve bir sonraki şema değişikliğinde aynı olay tekrar yaşanır. Olayı kapatmak; etkinin giderildiğinin, sayıların uzlaştırıldığının ve açık işin bir sahibe devredildiğinin kaydıdır.",
        "Bekleyen talepler duruyordu ve hastalara haber vermek acildi.",
        "Kalıcı düzeltmenin sahibi yoktu; görünüm geçiciydi.",
        "Hastalar üzerindeki etki bitince olayın da bittiğini varsaydın.",
        "Önce hastalara dönmek doğru öncelikti; geriye kalan iş idari görünüyordu.",
        "sms", etki_sifirla=True),
}

# --- Şeytanın avukatı (§15.10): doğru karardan sonra bir karakter itiraz eder (yalnızca "Mülakat pratiği") ---
ITIRAZ = {
    "S1_incele": {"kisi": "mudur", "metin": "On beş dakika inceleme mi? Başhekim şimdi çözüm istiyor. Geri dönmek daha hızlı olmaz mıydı?",
                  "kaygi": "Müdürün kaygısı gerçek: belirsizlik süresi. Savunurken incelemenin ne kadar süreceğini ve o sürede kime ne söyleyeceğini de söylemek işe yarar."},
    "S1R_ileri_don": {"kisi": "mudur", "metin": "Az önce geri döndük, şimdi ileri mi dönüyoruz? Ne yaptığımızı biliyor muyuz?",
                      "kaygi": "Art arda yön değiştirmek güveni sarsar. Savunurken neyin değiştiğini, yani yeni kanıtı açıkça söylemek gerekir."},
    "S2_gorunum": {"kisi": "entegrasyon", "metin": "Servisimizin eski kolonu okumaya devam etmesine bir görünümle izin veriyorsunuz. Bu geçici çözüm kalıcı hâle gelmez mi?",
                   "kaygi": "Geçici çözümler unutulur. Savunurken görünümün ne zaman ve kim tarafından kaldırılacağını söylemek gerekir."},
    "S2R_gorunum": {"kisi": "hemsire", "metin": "Hastaları tek tek telefonla arasak daha hızlı ulaşmaz mıydık?",
                    "kaygi": "Hemşirenin kaygısı hastanın kendisi. Savunurken önce sistemin düzelmesinin daha çok hastaya ulaştıracağını söylemek işe yarar."},
    "S3_maskele": {"kisi": "mudur", "metin": "Maskelemek on beş dakika sürdü, başhekim bekliyordu. Buna gerçekten değer miydi?",
                   "kaygi": "Hız ile veri koruma arasındaki gerilim gerçek. Savunurken maskelenmemiş verinin geri alınamayacağını ve 72 saatlik bildirim yükünü söylemek gerekir."},
    "S3_sayilar": {"kisi": "entegrasyon", "metin": "Sadece sayılarla kök nedeni nasıl bulacağız? Ham log olmadan işimiz zor.",
                   "kaygi": "Entegrasyon Ekibi'nin ihtiyacı gerçek. Savunurken maskelenmiş logun da bir seçenek olduğunu ve sayıların neyi gösterdiğini söylemek işe yarar."},
    "S4_uzlastir": {"kisi": "mudur", "metin": "Hata oranı sıfırdı. Yirmi dakikayı uzlaştırmaya harcamak gerekli miydi?",
                    "kaygi": "Grafik yeşilken olayı uzatmak gereksiz görünür. Savunurken bekleyen hasta sayısını ve kalıcı düzeltmenin sahibini söylemek gerekir."},
}

for s in d["sahneler"]:
    sid = s["id"]
    if sid in YENI_EYLEMLER:
        s['eylemler'] = [e for e in s['eylemler'] if e['id'] != YENI_EYLEMLER[sid]['id']] + [YENI_EYLEMLER[sid]]
    s["loglar"] = LOG[sid]
    s["konsol_onerileri"] = ONERI[sid]
    s["harita"] = HARITA[sid]
    s["kayitli_anlatim_kisa"] = KISA[sid]
    if sid in YONETMEN:
        s["yonetmen"] = YONETMEN[sid]
    for e in s["eylemler"]:
        e["degerlendirme"]["o_an_mantigi"] = MANTIK.get(e["id"], e["degerlendirme"].get("o_an_mantigi"))
        e["harita_dokunus"] = HARITA_DOKUNUS[e["id"]]
        for k in ("mudur_onerisi", "yetki_disi", "veri_korumayan"):
            e.pop(k, None)
        e.update(ETIKET.get(e["id"], {}))
        e.pop("seytanin_avukati", None)
        if e["id"] in ITIRAZ:
            e["seytanin_avukati"] = ITIRAZ[e["id"]]

# Güvenilmez kaynak (§3.4): S4'te müdürün iyimser mesajı, konsoldaki S4_l1 ile çelişir.
s4 = next(s for s in d["sahneler"] if s["id"] == "S4")
s4["mesajlar"] = [m for m in s4["mesajlar"] if not m.get("guvenilmez")]
s4["mesajlar"].append({"kisi": "mudur", "metin": "Bekleyen kalmadı diye duydum, sistem temiz.",
                       "guvenilmez": True, "celisen_log": "S4_l1"})

# --- Kontroller ---
for s in d["sahneler"]:
    yasak = [y.lower() for y in s["yasak_kelimeler"]]
    for mod, m in s.get("yonetmen", {}).items():
        assert not any(y in m["metin"].lower() for y in yasak), (s["id"], mod)
        assert m["kisi"] in d["kisiler"]
    ids = [l["id"] for l in s["loglar"]]
    assert len(ids) == len(set(ids))

# Konsolda aranabilir satır: ilk sahneden o sahneye kadar birikir (§12.2).
toplam = {}
gorulen = []
for sid in ["S1", "S1R", "S2", "S2R", "S3", "S4"]:
    gorulen += LOG[sid]
    toplam[sid] = len(gorulen)
assert min(toplam.values()) >= 12, toplam

YOL.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("tamam:", {k: v for k, v in toplam.items()})
