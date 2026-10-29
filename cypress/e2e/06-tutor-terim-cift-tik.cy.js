// Tutor paneli (mock), terim balonu ve çift tıklama koruması.
describe('Tutor, terimler ve çift tıklama', () => {
  it('mock modunda tutor sabit test cevabını verir', () => {
    cy.basla({ rol: 'backend' });
    cy.tid('dugme-tutor').click();
    cy.tid('tutor-girdi').type('Hangisini seçeyim?');
    cy.tid('tutor-gonder').click();
    cy.tid('tutor-cevap').should('contain', 'TEST: tutor cevabı');
  });

  it('kötü seçimden sonra tutor teklifi tutor panelini açar', () => {
    cy.basla({ rol: 'backend' });
    cy.eylem('S1_geri_don');
    cy.tid('teklif-tutor').click();
    cy.tid('panel-tutor').should('be.visible');
  });

  it('terime dokunmak seçim sayılmaz ve açıklama balonu açar', () => {
    cy.basla({ rol: 'backend' });
    cy.get('[data-testid="kanit-S1_k2"] [data-testid^="terim-"]').first().click();
    cy.tid('balon-terim').should('be.visible');
    cy.tid('panel-ne-oldu').should('not.exist');
    cy.tid('sahne-saat').should('have.text', '08:00');
  });

  it('eyleme iki kez basmak süreyi bir kez ilerletir', () => {
    cy.basla({ rol: 'backend' });
    cy.tid('eylem-S1_incele').dblclick('left');
    cy.tid('dugme-devam').click();
    cy.tid('sahne-saat').should('have.text', '08:15');
  });
});
