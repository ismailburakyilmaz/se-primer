// İdeal yol: 4 karar, 75 dk, "Kontrol altına alındı" ve suçlamasız değerlendirme.
describe('İdeal yol', () => {
  it('backend rolünde olay 09:15te kontrol altına alınır', () => {
    cy.basla({ rol: 'backend' });

    cy.sec('S1_incele');
    cy.tid('sahne-saat').should('have.text', '08:15');
    cy.tid('gosterge-etki').should('contain', '225');

    cy.sec('S2_gorunum');
    cy.tid('sahne-saat').should('have.text', '08:40');
    cy.tid('gosterge-etki').should('contain', '300');

    cy.sec('S3_maskele');
    cy.tid('sahne-saat').should('have.text', '08:55');

    cy.sec('S4_uzlastir');
    cy.tid('son-damga').should('contain', 'KONTROL ALTINA ALINDI');
    cy.contains('09:15').should('exist');
    cy.get('[data-testid^="degerlendirme-satir-"]').should('have.length', 4);
    cy.tid('son-ilke').should('contain', 'veritabanının da geri dönüp dönmediğini');
    cy.tid('dugme-baska-rol').should('be.visible');
    cy.tid('dugme-tekrar').should('be.visible');
  });

  it('"Başka rolle oyna" aynı olayı takım lideri olarak 08:00dan başlatır', () => {
    cy.basla({ rol: 'backend' });
    ['S1_incele', 'S2_gorunum', 'S3_maskele', 'S4_uzlastir'].forEach((e) => cy.sec(e));
    cy.tid('dugme-baska-rol').click();
    cy.tid('sahne-saat').should('have.text', '08:00');
    cy.senaryo().then((s) => {
      const e = s.sahneler[0].eylemler[1];
      cy.tid(`eylem-${e.id}`).should('contain.text', e.metin_lider.slice(0, 20));
    });
  });
});
