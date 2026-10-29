// Kabul örnekleri 3 ve 4: yanlış karar oyunu bitirmez, sorun geri döner.
describe('Toparlanma yolları', () => {
  it('S1 geri dönüş → S1R (+10 dk, risk +10) → ileri dönüş → S2', () => {
    cy.basla({ rol: 'backend' });
    cy.eylem('S1_geri_don');
    cy.tid('teklif-tutor').should('be.visible');
    cy.tid('dugme-devam').click();
    cy.tid('sahne-baslik').should('have.text', 'Geri dönüş her şeyi kapattı');
    cy.tid('sahne-saat').should('have.text', '08:10');
    cy.tid('gosterge-risk').should('contain', '20');

    cy.sec('S1R_ileri_don');
    cy.tid('sahne-baslik').should('have.text', 'Kaynak bulundu');
  });

  it('S2 SMS adımını kapat → S2R ve etki +90', () => {
    cy.basla({ rol: 'backend' });
    cy.sec('S1_incele');
    cy.sec('S2_sms_kapat');
    cy.tid('sahne-baslik').should('have.text', "SMS'siz onay geri tepti");
    // 180 + 15 dk×3 + 5 dk×3 + 90 = 330
    cy.tid('gosterge-etki').should('contain', '330');
    cy.sec('S2R_gorunum');
    cy.tid('sahne-baslik').should('have.text', 'Log isteği (KVKK)');
  });

  it('süre bütçeyi aşınca "Kontrol altına alınamadı"; bütçeye eşit süre kayıp değildir', () => {
    cy.basla({ rol: 'backend' });
    for (let i = 0; i < 5; i += 1) cy.sec('S1_disk'); // 5 × 20 dk = 100 dk
    cy.tid('sahne-saat').should('have.text', '09:40');
    cy.tid('sahne-baslik').should('be.visible');
    cy.sec('S1_disk'); // 120 dk > 100
    cy.tid('son-damga').should('contain', 'KONTROL ALTINA ALINAMADI');
  });
});
