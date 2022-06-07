describe('withAuthenticator Sign In', { 
  retries: {
      runMode: 2,
    },
  }, function() {
  beforeEach(function() {
    cy.visit('/' , { responseTimeout: 20000 });
  });

  it('throws error when user is not signed up', function() {
    // Check for user not signed up
    cy.get('input[name=username]').type('testuser');
    cy.get('input[name=password]').type('testPassword');
    cy.get('button')
      .contains('Sign In')
      .click();
    cy.get('div').contains('User does not exist');
  });
});
