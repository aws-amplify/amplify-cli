
describe('withAuthenticator Sign In', function() {
  beforeEach(function() {
    cy.visit('/')
  })

  it('throws error when user is not signed up', function() {
    // Check for empty username error
    cy.get('.amplify-button').contains('Sign In').click()
    cy.get('.amplify-error-section').contains('Username cannot be empty')

    // Check for empty password error
    cy.get('input[name=username]').type('invalidUsername')
    cy.get('.amplify-button').contains('Sign In').click()
    cy.get('.amplify-error-section').contains('User does not exist')

    // Check invalid username error
    cy.get('input[name=password]').type('invalidPassword')
    cy.get('.amplify-button').contains('Sign In').click()
    cy.get('.amplify-error-section').contains('User does not exist')
  })
})