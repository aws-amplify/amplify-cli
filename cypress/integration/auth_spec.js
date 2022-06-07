describe('withAuthenticator Sign In', { 
  retries: {
      runMode: 2,
      openMode: 1,
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

  it('throws error when user is not signed up1', function() {
    // Check for user not signed up
    cy.get('input[name=username]').type('testuser');
    cy.get('input[name=password]').type('testPassword');
    cy.get('button')
      .contains('Sign In')
      .click();
    cy.get('div').contains('User does not exist');
  });

  it('throws error when user is not signed up2', function() {
    // Check for user not signed up
    cy.get('input[name=username]').type('testuser');
    cy.get('input[name=password]').type('testPassword');
    cy.get('button')
      .contains('Sign In')
      .click();
    cy.get('div').contains('User does not exist');
  });

  it('throws error when user is not signed up3', function() {
    // Check for user not signed up
    cy.get('input[name=username]').type('testuser');
    cy.get('input[name=password]').type('testPassword');
    cy.get('button')
      .contains('Sign In')
      .click();
    cy.get('div').contains('User does not exist');
  });
});
