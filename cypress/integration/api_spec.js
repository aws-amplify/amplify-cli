
describe('API test post and get', function() {
    beforeEach(function() {
      cy.visit('/')
    })
  
    it('successfully adds data to dynamodb', function() {
      // Check for user not signed up
      cy.get('input[name=itemNo]').type('1')
      cy.get('.amplify-submit-put-button').contains('Put').click()
      cy.get('.amplify-put-result').contains('post call succeed!')
    })

    it('successfully get data from dynamodb', function() {
        // Check for user not signed up
        cy.get('.amplify-submit-get-button').contains('Get').click()
        cy.get('.amplify-get-result').contains('"itemNo":1')
      })
})