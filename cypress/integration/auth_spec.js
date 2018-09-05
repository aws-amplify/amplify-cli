
describe('withAuthenticator Sign In', function() {
  beforeEach(function() {
    cy.visit('/')
  })

  it('throws error when user is not signed up', function() {
    // Check for user not signed up
    cy.get('input[name=username]').type('testuser')
    cy.get('input[name=password]').type('testPassword')
    cy.get('.amplify-button').contains('Sign In').click()
    cy.get('.amplify-error-section').contains('User does not exist')
  })
})

