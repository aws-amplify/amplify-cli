
describe('API test post', function() {
    beforeEach(function() {
      cy.visit('/')
    })
  
    it('successfully adds data to dynamodb', function() {
      // Check for user not signed up
      cy.get('input[name=itemNo]').type('1')
      cy.get('.amplify-submit-button').contains('Put').click()
    })
  })
  
  