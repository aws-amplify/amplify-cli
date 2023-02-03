describe('Assert page loads properly', () => {
  /* eslint-disable-next-line jest/expect-expect */
  it('Visits the page', () => {
    cy.visit('http://localhost:3000');
    cy.get('.amplify-input')
      .first()
      .type('fake@email.com')
      .should('have.value', 'fake@email.com');
  });
});
