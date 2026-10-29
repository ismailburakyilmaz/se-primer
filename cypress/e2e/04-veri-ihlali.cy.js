// Kabul örneği 5: kırmızı çizgi oyunu "Veri ihlali" ile bitirir.
describe('Veri ihlali', () => {
  it('S3te logu genel kanala atmak KVKK ihlaliyle biter', () => {
    cy.basla({ rol: 'backend' });
    cy.sec('S1_incele');
    cy.sec('S2_gorunum');
    cy.eylem('S3_genel_kanal');
    cy.tid('panel-ne-oldu').should('be.visible');
    cy.tid('teklif-tutor').should('not.exist'); // oyunu bitiren seçimde teklif yok
    cy.tid('dugme-devam').click();
    cy.tid('son-damga').should('contain', 'VERİ İHLALİ');
    cy.get('body').should('contain', '72 saat');
    cy.get('body').should('contain', 'KVKK');
  });
});
