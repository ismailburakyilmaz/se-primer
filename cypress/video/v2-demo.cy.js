// SE Primer v2 — Olay Yönetmeni demo videosu (60–90 sn).
// Çalıştırma: npx cypress run --spec cypress/video/v2-demo.cy.js
// Video:      cypress/videos/v2-demo.cy.js.mp4
//
// İki oyuncu farklı kararlarla AYNI sahneye (S3 "Log isteği (KVKK)") gelir. Model GERÇEK:
// sabit olasılık yok (?model=sabit kullanılmaz); model Hugging Face'teki sabit commit'ten indirilir.
// Oyuncu A kötü kararlar verir → p yüksek → Destek. Oyuncu B iyi kararlar verir → p düşük → Baskı.
// Anlatım kayıtlı metinden gelir (?mock=1), Gemini kotası harcanmaz.
// Tıklama halkası ve alt yazılar yalnızca bu videoya eklenir; uygulamanın kodunda yoktur.

const BEKLE = 2600;

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


const oyunuAc = () => {
  cy.visit('/?mock=1');
  cy.window().then(videoKatmani);
  cy.get('[data-testid="model-durum"]', { timeout: 30000 }).should('contain', 'hazır');
};

const giris = () => {
  cy.tid('secim-seviye-yeni').click();
  cy.tid('secim-rol-backend').click();
  cy.tid('secim-hedef-ogrenmek').click();
  cy.wait(500);
  cy.tid('dugme-basla').click();
  cy.tid('sahne-baslik').should('be.visible');
};

const karar = (eylemId, metin) => {
  altyazi(metin);
  cy.tid(`eylem-${eylemId}`).scrollIntoView({ duration: 400, offset: { top: -250, left: 0 } });
  cy.wait(1200);
  cy.eylem(eylemId);
  cy.tid('panel-ne-oldu').should('be.visible');
  cy.wait(1300);
  cy.tid('dugme-devam').click();
  cy.tid('panel-ne-oldu').should('not.exist');
};

describe('SE Primer v2 — aynı sahne, iki oyuncu', () => {
  it('Oyuncu A: zorlanan oyuncu → Yönetmen DESTEK', () => {
    oyunuAc();
    altyazi('SE Primer v2 · Her karardan sonra küçük bir model kötü sona gidiş riskini (p) tahmin eder');
    cy.wait(BEKLE * 1.3);
    altyazi('Oyuncu A');
    giris();
    karar('S1_geri_don', 'A · S1: müdürün dediğini yapıyor, geri dönüyor (sorunlu)');
    karar('S1R_ileri_don', 'A · S1R: ileri dönüyor');
    karar('S2_sms_kapat', 'A · S2: SMS onayını kapatıyor (sorunlu)');
    karar('S2R_gorunum', 'A · S2R: geçici görünüm');

    cy.tid('sahne-baslik').should('have.text', 'Log isteği (KVKK)');
    cy.tid('yonetmen-mod').should('have.attr', 'data-mod', 'destek');
    cy.scrollTo('top', { duration: 300 });
    altyazi('A · S3\'e geldi · p ≥ 0,60 → DESTEK damgası, telefon titrer');
    cy.wait(BEKLE);
    vurgula('[data-testid="mesaj-0"]');
    altyazi('A · Sayaç kalkar; ekipten biri doğru kanıta yönlendirir');
    cy.wait(BEKLE);
    vurguKaldir();
    cy.tid('dugme-konsol').click();
    cy.tid('konsol-oneri-0').should('be.visible');
    altyazi('A · Log konsolunda yalnızca Destek modunda "Ekipten öneri" çıkar');
    cy.wait(BEKLE);
    cy.get('body').type('{esc}');
    cy.wait(600);
  });

  it('Oyuncu B: iyi giden oyuncu → Yönetmen BASKI', () => {
    oyunuAc();
    altyazi('Oyuncu B · aynı olay, farklı kararlar');
    cy.wait(1500);
    giris();
    karar('S1_incele', 'B · S1: önce logu inceliyor');
    karar('S2_gorunum', 'B · S2: başka ekibin servisine dokunmadan geçici çözüm');

    cy.tid('sahne-baslik').should('have.text', 'Log isteği (KVKK)');
    cy.tid('yonetmen-mod').should('have.attr', 'data-mod', 'baski');
    cy.scrollTo('top', { duration: 300 });
    altyazi('B · AYNI sahne S3 · p < 0,30 → BASKI damgası');
    cy.wait(BEKLE);
    vurgula('[data-testid="sayac"]');
    altyazi('B · Yeni başlayan seçse de 45 sn sayaç gelir; müdür sıkıştırır');
    cy.wait(BEKLE);
    vurguKaldir();
    karar('S3_maskele', 'B · S3: logu maskeleyip yalnız olay kanalına koyuyor');
    karar('S4_uzlastir', 'B · S4: bekleyenleri uzlaştırıp devrediyor');

    cy.tid('son-damga').should('contain', 'KONTROL ALTINA ALINDI');
    cy.tid('yonetmen-izi').scrollIntoView({ duration: 900, offset: { top: -200, left: 0 } });
    vurgula('[data-testid="yonetmen-izi"]');
    altyazi('Rapor: Yönetmen hangi sahnede hangi modu seçti, açıkça yazar');
    cy.wait(BEKLE * 1.2);
    altyazi('Aynı sahne, iki oyuncu: zorlanan desteklenir, iyi giden zorlanır. Kurallar ve son değişmez.');
    cy.wait(BEKLE * 1.4);
    altyazi('');
    cy.wait(400);
  });
});
