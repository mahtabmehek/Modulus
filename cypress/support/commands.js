// Custom Cypress commands for Modulus LMS

// Command to login with local authentication
Cypress.Commands.add('loginWithLocalAuth', (email, password) => {
  cy.visit('/')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').contains('Sign In').click()
})

// Command to check if backend is responding
Cypress.Commands.add('checkBackendHealth', () => {
  cy.request({
    method: 'GET',
    url: 'http://localhost:3001/api/health',
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('Backend is healthy')
    } else {
      cy.log('Backend is not responding properly')
    }
  })
})

// Command to register a new user
Cypress.Commands.add('registerUser', (userData) => {
  cy.visit('/')
  cy.get('[data-state="signup"]').click()
  cy.get('input[name="firstName"]').type(userData.firstName)
  cy.get('input[name="lastName"]').type(userData.lastName)
  cy.get('input[name="email"]').type(userData.email)
  cy.get('select[name="role"]').select(userData.role)
  cy.get('input[name="accessCode"]').type(userData.accessCode)
  cy.get('input[name="password"]').type(userData.password)
  cy.get('input[name="confirmPassword"]').type(userData.password)
  cy.get('button[type="submit"]').contains('Create Account').click()
})
