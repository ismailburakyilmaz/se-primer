// Kabul örnekleri 1 ve 2: seviye ve rol farkı; eylem türleri oyuncuya görünmez.
describe('Giriş ve roller', () => {
  it('üç soru ve başla düğmesi görünür', () => {
    cy.visit('/?mock=1');
    [
      'secim-seviye-yeni', 'secim-seviye-deneyimli',
      'secim-rol-backend', 'secim-rol-lider', 'secim-rol-farketmez',
      'secim-hedef-ogrenmek', 'secim-hedef-mulakat', 'secim-hedef-baski',
      'dugme-basla', 'surum-yazisi',
    ].forEach((id) => cy.tid(id).should('exist'));
  });

  it('yeni başlayan: ipucu var, sayaç yok; eylem türleri yazmaz', () => {
    cy.basla({ seviye: 'yeni', rol: 'backend' });
    cy.tid('sahne-saat').should('have.text', '08:00');
    cy.tid('dugme-ipucu').click();
    cy.tid('panel-ipucu').should('be.visible');
    cy.tid('sayac').should('not.exist');
    cy.get('body').invoke('text').should('not.match', /onerilen|kabul_edilebilir|geciktiren|tehlikeli|kirmizi_cizgi/);
  });

  it('deneyimli: sayaç var, ipucu yok; göstergeler aynı başlar', () => {
    cy.basla({ seviye: 'deneyimli', rol: 'backend', sayac: true });
    cy.tid('sayac').should('be.visible');
    cy.tid('dugme-ipucu').should('not.exist');
    cy.tid('gosterge-etki').should('contain', '180');
    cy.tid('gosterge-risk').should('contain', '10');
  });

  it('takım lideri: lider eylem ve kanıt metinleri, aynı başlangıç göstergeleri', () => {
    cy.senaryo().then((s) => {
      const s1 = s.sahneler.find((x) => x.id === 'S1');
      cy.basla({ rol: 'lider' });
      s1.eylemler.forEach((e) => cy.tid(`eylem-${e.id}`).should('contain.text', e.metin_lider.slice(0, 20)));
      s1.kanitlar.forEach((k) => cy.tid(`kanit-${k.id}`).should('contain.text', k.metin_lider.slice(0, 20)));
      cy.tid('gosterge-etki').should('contain', '180');
      cy.tid('gosterge-risk').should('contain', '10');
    });
  });
});
