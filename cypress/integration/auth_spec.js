describe('withAuthenticator Sign In', { 
  // Configure retry attempts for `cypress run` (will run a total pf 3 times)
  // retries added as the test is getting response greater than default responseTimeout = 30s on first try 
  retries: {
      runMode: 2,
    },
  }, function() {
  beforeEach(function() {
    cy.visit('/');
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
