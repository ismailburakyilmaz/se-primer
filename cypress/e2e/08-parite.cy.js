// Diferansiyel (parite) test: tarayıcıdaki onnxruntime-web, Python kahiniyle (tests/parite.py)
// aynı 5 girdiye aynı olasılığı vermeli. Eşik: tests/parite.json -> tolerans (1e-4).
describe('Model paritesi (tarayıcı ↔ Python kahini)', () => {
  it('5 referans girdide |Δ| < 1e-4; model sabit commit adresinden yükleniyor', () => {
    cy.readFile('tests/parite.json').then((ref) => {
      expect(ref.girdiler).to.have.length(5);
      cy.visit('/?parite=1');
      cy.get('[data-cy=parite-hazir]', { timeout: 30000 }).should('exist');

      // Model main dalından değil, sabitlenen commit'ten gelmeli
      cy.get('[data-cy=model-url]').invoke('text')
        .should('include', ref.model.commit)
        .and('not.include', '/resolve/main/');

      ref.girdiler.forEach((r, i) => {
        cy.get(`[data-cy=p-${i}]`).invoke('text').then((t) => {
          const tarayici = parseFloat(t.replace(',', '.'));
          expect(Math.abs(tarayici - r.p), `${r.id}: tarayıcı ${tarayici} / kahin ${r.p}`)
            .to.be.lessThan(ref.tolerans);
        });
      });
    });
  });
});
