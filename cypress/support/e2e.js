// SE Primer — ortak komutlar.
// Bütün testler ?mock=1 ile çalışır: Gemini çağrılmaz, anlatım kayıtlı metinden gelir.

const SECIM = {
  seviye: { yeni: 'secim-seviye-yeni', deneyimli: 'secim-seviye-deneyimli' },
  rol: { backend: 'secim-rol-backend', lider: 'secim-rol-lider', farketmez: 'secim-rol-farketmez' },
  hedef: { ogrenmek: 'secim-hedef-ogrenmek', mulakat: 'secim-hedef-mulakat', baski: 'secim-hedef-baski' },
};

Cypress.Commands.add('tid', (id) => cy.get(`[data-testid="${id}"]`));

// Girişteki 3 soruyu cevaplayıp oyunu başlatır.
Cypress.Commands.add('basla', ({ seviye = 'yeni', rol = 'backend', hedef = 'ogrenmek', sayac = false, url = '/?mock=1' } = {}) => {
  cy.visit(url);
  cy.tid(SECIM.seviye[seviye]).click();
  cy.tid(SECIM.rol[rol]).click();
  cy.tid(SECIM.hedef[hedef]).click();
  if (seviye === 'deneyimli') {
    if (sayac) cy.tid('anahtar-sayac').check({ force: true });
    else cy.tid('anahtar-sayac').uncheck({ force: true });
  }
  cy.tid('dugme-basla').click();
  cy.tid('sahne-baslik').should('be.visible');
});

// Eylem kartına sol kenarından (kutucuk tarafından) tıklar; metindeki terimlere değmez.
Cypress.Commands.add('eylem', (eylemId) => cy.tid(`eylem-${eylemId}`).click('left'));

// Bir eylemi seçer, "Ne oldu / Neden oldu" panelini doğrular ve devam eder.
Cypress.Commands.add('sec', (eylemId) => {
  cy.eylem(eylemId);
  cy.tid('panel-ne-oldu').should('be.visible');
  cy.tid('ne-oldu').should('not.be.empty');
  cy.tid('neden-oldu').should('not.be.empty');
  cy.tid('dugme-devam').click();
  cy.tid('panel-ne-oldu').should('not.exist');
});

Cypress.Commands.add('senaryo', () => cy.readFile('scenarios/sabah-randevu.json'));
