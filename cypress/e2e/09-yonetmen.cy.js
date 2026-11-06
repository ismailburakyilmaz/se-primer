// Olay Yönetmeni (spec §13.5, kabul örnekleri 8–13).
// ?model=sabit:x gerçek modeli atlayıp olasılığı sabitler; böylece mod kararı deterministik test edilir.
// S1'de "geri dön" seçilince sonraki sahne S1R'dir.
const sonrakiSahne = (sabit, ekstra = {}) => {
  cy.basla({ url: `/?mock=1&model=${sabit}`, ...ekstra });
  cy.tid('yonetmen-mod').should('have.attr', 'data-mod', 'olagan'); // ilk sahnede henüz karar yok
  cy.sec('S1_geri_don');
};

const yonetmenMetni = (mod) =>
  cy.senaryo().then((s) => s.sahneler.find((x) => x.id === 'S1R').yonetmen[mod].metin);

describe('Olay Yönetmeni', () => {
  it('p ≥ 0,60 → Destek: sayaç yok, ekipten yönlendiren mesaj ilk sırada', () => {
    sonrakiSahne('sabit:0.9');
    cy.tid('yonetmen-mod').should('have.attr', 'data-mod', 'destek');
    cy.tid('sayac').should('not.exist');
    yonetmenMetni('destek').then((m) => cy.tid('mesaj-0').should('contain', m.slice(0, 30)));
  });

  it('p < 0,30 → Baskı: yeni başlayanda bile 45 sn sayaç, müdür mesajı', () => {
    sonrakiSahne('sabit:0.1');
    cy.tid('yonetmen-mod').should('have.attr', 'data-mod', 'baski');
    cy.tid('sayac').should('be.visible').invoke('text').then((t) => {
      const sn = parseInt(t, 10); // 45s'den geri sayıyor (olağan sayaç 60s)
      expect(sn).to.be.within(30, 45);
    });
    yonetmenMetni('baski').then((m) => cy.tid('mesaj-0').should('contain', m.slice(0, 30)));
  });

  it('arada → Olağan: Yönetmen mesajı yok', () => {
    sonrakiSahne('sabit:0.45');
    cy.tid('yonetmen-mod').should('have.attr', 'data-mod', 'olagan');
    cy.tid('sayac').should('not.exist');
  });

  it('?model=kapali → her zaman Olağan (geri alma 1. yol)', () => {
    sonrakiSahne('kapali');
    cy.tid('yonetmen-mod').should('have.attr', 'data-mod', 'olagan');
  });

  it('veri toplama modunda model gölgede çalışır, mod Olağan kalır', () => {
    cy.visit('/?mock=1&model=sabit:0.9');
    cy.tid('secim-seviye-yeni').click();
    cy.tid('secim-rol-backend').click();
    cy.tid('secim-hedef-ogrenmek').click();
    cy.tid('veri-katil').check();
    cy.tid('veri-onay').check();
    cy.tid('dugme-basla').click();
    cy.tid('sahne-baslik').should('be.visible');
    cy.sec('S1_geri_don');
    cy.tid('yonetmen-mod').should('have.attr', 'data-mod', 'olagan');
    cy.tid('sayac').should('not.exist');
  });
});
