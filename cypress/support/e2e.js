// Cypress E2E support file
import './commands'

// Custom commands for user login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/auth/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
})

Cypress.Commands.add('loginAsStudent', () => {
  cy.login('student@test.com', 'Mahtabmehek@1337')
})

Cypress.Commands.add('loginAsInstructor', () => {
  cy.login('instructor@test.com', 'Mahtabmehek@1337')
})

Cypress.Commands.add('loginAsStaff', () => {
  cy.login('staff@test.com', 'Mahtabmehek@1337')
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@modulus.com', 'Mahtabmehek@1337')
})

// Command to check if element exists and is visible
Cypress.Commands.add('shouldExistAndBeVisible', (selector) => {
  cy.get(selector).should('exist').and('be.visible')
})

// Command to check if button/link is clickable
Cypress.Commands.add('shouldBeClickable', (selector) => {
  cy.get(selector).should('exist').and('be.visible').and('not.be.disabled')
})
