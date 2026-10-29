// Sayaç: süre dolunca en kötü seçenek uygulanmaz; +15 dk, müdür mesajı, ziyaret başına bir kez.
describe('Karar sayacı', () => {
  it('60 sn dolunca +15 dk ve mesaj; aynı ziyarette ikinci zaman aşımı olmaz', () => {
    cy.clock();
    cy.basla({ seviye: 'deneyimli', rol: 'backend', sayac: true });
    cy.tid('sayac').should('contain', '60');
    cy.tick(61000);
    cy.tid('sahne-saat').should('have.text', '08:15');
    cy.tid('sahne-baslik').should('have.text', 'Onay ekranı hata veriyor');
    cy.get('[data-testid^="mesaj-"]').first().should('contain', 'Karar bekleniyor');
    cy.tid('gosterge-risk').should('contain', '10'); // tehlikeli seçenek uygulanmadı
    cy.tick(120000);
    cy.tid('sahne-saat').should('have.text', '08:15');
  });

  it('panel açıkken sayaç durur', () => {
    cy.clock();
    cy.basla({ seviye: 'deneyimli', rol: 'backend', sayac: true });
    cy.tid('dugme-tutor').click();
    cy.tid('panel-tutor').should('be.visible');
    cy.tick(90000);
    cy.tid('sahne-saat').should('have.text', '08:00');
  });
});
