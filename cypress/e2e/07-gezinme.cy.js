// Gezinme ve geri bildirim: nasıl oynanır, gösterge özeti, en üste kayma, Esc, yenileme, geri tuşu, çıkış.
describe('Gezinme ve geri bildirim', () => {
  it('"Nasıl oynanır?" varsayılan kapalı, tıklayınca açılır', () => {
    cy.visit('/?mock=1');
    cy.tid('nasil-oynanir').should('not.exist');
    cy.contains(/Nasıl oynanır/i).click();
    cy.tid('nasil-oynanir').should('contain', 'Kanıtları oku');
  });

  it('"Ne oldu" paneli gösterge değişimini yazar; yeni sahne en üstten açılır', () => {
    cy.basla({ rol: 'backend' });
    cy.scrollTo('bottom');
    cy.eylem('S1_geri_don');
    cy.tid('panel-ne-oldu').should('contain', 'Süre +10 dk').and('contain', 'Etki +30').and('contain', 'Veri riski +10');
    cy.tid('dugme-devam').click();
    cy.tid('sahne-baslik').should('have.text', 'Geri dönüş her şeyi kapattı');
    cy.window().its('scrollY').should('eq', 0);
    cy.contains(/karar 2/i).should('exist');
  });

  it('Esc açık paneli kapatır', () => {
    cy.basla({ rol: 'backend' });
    cy.tid('dugme-tutor').click();
    cy.tid('panel-tutor').should('be.visible');
    cy.get('body').type('{esc}');
    cy.tid('panel-tutor').should('not.exist');
  });

  it('sayfa yenilenince oyun kaldığı sahneden sürer', () => {
    cy.basla({ rol: 'backend' });
    cy.sec('S1_incele');
    cy.reload();
    cy.tid('sahne-baslik').should('have.text', 'Kaynak bulundu');
    cy.tid('sahne-saat').should('have.text', '08:15');
  });

  it('geri tuşu çıkış onayını açar; onaylanınca giriş ekranı gelir ve kayıt silinir', () => {
    cy.basla({ rol: 'backend' });
    cy.sec('S1_incele');
    cy.go('back');
    cy.tid('dugme-cikis-onay').should('be.visible').click();
    cy.tid('dugme-basla').should('be.visible');
    cy.reload();
    cy.tid('dugme-basla').should('be.visible');
  });

  it('"Olaydan çık" → "Vazgeç" oyunu sürdürür', () => {
    cy.basla({ rol: 'backend' });
    cy.tid('dugme-cikis').click();
    cy.contains('button', 'Vazgeç').click();
    cy.tid('sahne-baslik').should('have.text', 'Onay ekranı hata veriyor');
  });
});
