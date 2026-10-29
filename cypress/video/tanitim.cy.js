// SE Primer — 60 saniyelik tanıtım videosu.
// Çalıştırma: npx cypress run --spec cypress/video/tanitim.cy.js
// Video:      cypress/videos/tanitim.cy.js.mp4
//
// Kota harcamamak için anlatım kayıtlı metinden gelir (?mock=1). Tutor cevabı, 29 Ekim 2026'da
// v2 talimatıyla oyunda alınmış gerçek bir cevaptır (eval/eval.md, Z2) ve burada kayıttan gösterilir.
// Tıklama halkası ve alt yazılar yalnızca bu videoya eklenir; uygulamanın kodunda yoktur.

const BEKLE = 2700;
const KAYITLI_TUTOR_CEVABI =
  'Doğrudan bir yol söylemem mümkün değil ama SMS onay servisi logundaki sütun hatası ile veritabanı arasındaki bağı nasıl kuruyorsun?';

// Sayfaya video için tıklama halkası ve alt yazı şeridi ekler.
function videoKatmani(win) {
  const doc = win.document;
  const stil = doc.createElement('style');
  stil.textContent = `
    .vk-halka { position: fixed; width: 34px; height: 34px; margin: -17px 0 0 -17px;
      border: 3px solid #2B4C9B; border-radius: 50%; pointer-events: none; z-index: 2147483647;
      animation: vk-halka 650ms ease-out forwards; }
    @keyframes vk-halka { from { transform: scale(.35); opacity: 1; } to { transform: scale(1.7); opacity: 0; } }
    .vk-vurgu { outline: 3px solid #F2D04B !important; outline-offset: 2px; transition: outline-color .3s; }
    #vk-altyazi { position: fixed; left: 8px; right: 8px; top: 8px; z-index: 2147483646;
      background: #1F2430; color: #FBF8F1; font: 600 13px/1.4 'IBM Plex Mono', monospace;
      padding: 10px 12px; border-radius: 4px; pointer-events: none; opacity: 0; transition: opacity .3s; }
    #vk-altyazi.acik { opacity: .95; }`;
  doc.head.appendChild(stil);
  const altyazi = doc.createElement('div');
  altyazi.id = 'vk-altyazi';
  doc.body.appendChild(altyazi);

  doc.addEventListener('click', (e) => {
    const h = doc.createElement('div');
    h.className = 'vk-halka';
    h.style.left = `${e.clientX}px`;
    h.style.top = `${e.clientY}px`;
    doc.body.appendChild(h);
    setTimeout(() => h.remove(), 700);
  }, true);

  win.vkAltyazi = (metin) => {
    altyazi.textContent = metin;
    altyazi.classList.toggle('acik', Boolean(metin));
  };
}

const altyazi = (metin) => cy.window().then((w) => w.vkAltyazi(metin));
const vurgula = (secici) => cy.get(secici).first().then(($el) => $el.addClass('vk-vurgu'));
const vurguKaldir = () => cy.get('.vk-vurgu').then(($el) => $el.removeClass('vk-vurgu'));

describe('SE Primer — 60 sn tanıtım', () => {
  it('bir olayı baştan sona oynar', () => {
    cy.intercept('POST', '/api/tutor', { cevap: KAYITLI_TUTOR_CEVABI, model: 'kayit', fallback: false });
    cy.visit('/?mock=1');
    cy.window().then(videoKatmani);

    // 1. Giriş
    altyazi('1/6 · Girişte üç soru: seviye, rol, hedef');
    cy.wait(BEKLE);
    cy.tid('secim-seviye-yeni').click();
    cy.tid('secim-rol-backend').click();
    cy.tid('secim-hedef-ogrenmek').click();
    cy.wait(800);
    cy.tid('dugme-basla').click();

    // 2. Sahne ve kanıtlar
    altyazi('2/6 · Sahne: ekip mesajları ve etiketli kanıtlar');
    cy.wait(BEKLE);
    vurgula('[data-testid="kanit-S1_k2"]');
    cy.tid('kanit-S1_k2').scrollIntoView({ duration: 600, offset: { top: -200, left: 0 } });
    altyazi('2/6 · BELİRTİ: SMS servisi logu bir kolonu bulamıyor');
    cy.wait(BEKLE);
    cy.get('[data-testid="kanit-S1_k2"] [data-testid^="terim-"]').first().click();
    altyazi('2/6 · Altı noktalı terime dokun: sade açıklama');
    cy.wait(BEKLE);
    cy.get('[data-testid="balon-terim"] button').first().click({ force: true });
    vurguKaldir();

    // 3. Karar: geri dönüş
    cy.tid('eylem-S1_geri_don').scrollIntoView({ duration: 500, offset: { top: -250, left: 0 } });
    altyazi('3/6 · Karar: müdürün dediğini yap, v4.1\'e geri dön');
    cy.wait(1500);
    cy.eylem('S1_geri_don');
    altyazi('3/6 · Ne oldu / Neden oldu ve göstergelerdeki değişim');
    cy.wait(BEKLE * 1.4);

    // 4. Tutor
    cy.tid('teklif-tutor').click();
    altyazi('4/6 · Tutor cevabı söylemez, kanıta bağlı soru sorar');
    cy.tid('tutor-girdi').type('Neyi kaçırdım?', { delay: 70 });
    cy.tid('tutor-gonder').click();
    cy.tid('tutor-cevap').should('contain', 'bağı nasıl kuruyorsun');
    cy.wait(BEKLE * 1.6);
    cy.get('[data-testid="panel-tutor"] button').first().click();

    // 5. Toparlanma ve ideal yol
    altyazi('5/6 · Yanlış karar oyunu bitirmez: sorun geri döner');
    cy.wait(BEKLE);
    cy.eylem('S1R_ileri_don');
    cy.wait(1200);
    cy.tid('dugme-devam').click();

    const adimlar = [
      ['S2_gorunum', '5/6 · Başka ekibin servisine dokunmadan geçici çözüm'],
      ['S3_maskele', '5/6 · KVKK: logu maskele, yalnızca olay kanalına koy'],
      ['S4_uzlastir', '5/6 · Hata oranı 0 yetmez: bekleyenleri uzlaştır, devret'],
    ];
    adimlar.forEach(([eylem, metin]) => {
      altyazi(metin);
      cy.wait(1500);
      cy.tid(`eylem-${eylem}`).scrollIntoView({ duration: 500, offset: { top: -250, left: 0 } });
      cy.eylem(eylem);
      cy.wait(1300);
      cy.tid('dugme-devam').click();
    });

    // 6. Sonuç
    cy.tid('son-damga').should('contain', 'KONTROL ALTINA ALINDI');
    altyazi('6/6 · Olay raporu: sonuç, göstergeler, suçlamasız değerlendirme');
    cy.wait(BEKLE);
    cy.tid('degerlendirme-satir-0').scrollIntoView({ duration: 1200 });
    cy.wait(BEKLE);
    cy.tid('son-ilke').scrollIntoView({ duration: 1200 });
    altyazi('6/6 · Bu olaydan tek ilke');
    cy.wait(BEKLE);
    altyazi('');
    cy.wait(500);
  });
});
