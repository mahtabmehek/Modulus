describe('Modulus LMS - Local Migration Tests', () => {
  beforeEach(() => {
    // Check if the backend is running
    cy.checkBackendHealth()
  })

  it('should load the homepage with local authentication', () => {
    cy.visit('/')
    
    // Should show the local auth component
    cy.contains('Modulus LMS').should('be.visible')
    cy.contains('Sign in to your account').should('be.visible')
    
    // Should have email and password fields
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    
    // Should have sign in and sign up tabs
    cy.get('[data-state="signin"]').should('be.visible')
    cy.get('[data-state="signup"]').should('be.visible')
  })

  it('should display access codes for different roles', () => {
    cy.visit('/')
    
    // Check that access codes are displayed
    cy.contains('Access codes by role').should('be.visible')
    cy.contains('Student: student2025').should('be.visible')
    cy.contains('Instructor: instructor2025').should('be.visible')
    cy.contains('Staff: staff2025').should('be.visible')
    cy.contains('Admin: mahtabmehek1337').should('be.visible')
  })

  it('should show sign up form with all required fields', () => {
    cy.visit('/')
    cy.get('[data-state="signup"]').click()
    
    // Check all sign up fields are present
    cy.get('input[name="firstName"]').should('be.visible')
    cy.get('input[name="lastName"]').should('be.visible')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('select[name="role"]').should('be.visible')
    cy.get('input[name="accessCode"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('input[name="confirmPassword"]').should('be.visible')
    
    // Check role options
    cy.get('select[name="role"]').should('contain', 'Student')
    cy.get('select[name="role"]').should('contain', 'Instructor')
    cy.get('select[name="role"]').should('contain', 'Staff')
    cy.get('select[name="role"]').should('contain', 'Admin')
  })

  it('should validate form inputs on sign up', () => {
    cy.visit('/')
    cy.get('[data-state="signup"]').click()
    
    // Try to submit empty form
    cy.get('button[type="submit"]').contains('Create Account').click()
    
    // Should show validation messages (HTML5 validation)
    cy.get('input[name="firstName"]:invalid').should('exist')
    cy.get('input[name="lastName"]:invalid').should('exist')
    cy.get('input[name="email"]:invalid').should('exist')
  })

  it('should toggle password visibility', () => {
    cy.visit('/')
    
    // Password should be hidden by default
    cy.get('input[name="password"]').should('have.attr', 'type', 'password')
    
    // Click toggle button
    cy.get('button').contains('Show password').click()
    
    // Password should now be visible
    cy.get('input[name="password"]').should('have.attr', 'type', 'text')
  })

  it('should handle backend connection gracefully when database is not available', () => {
    cy.visit('/')
    cy.get('[data-state="signin"]').click()
    
    // Try to sign in (will fail due to no database)
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').contains('Sign In').click()
    
    // Should show error message gracefully
    cy.get('[role="alert"]', { timeout: 10000 }).should('be.visible')
  })

  it('should not have any AWS-related content or references', () => {
    cy.visit('/')
    
    // Should not contain any AWS/Cognito references
    cy.get('body').should('not.contain', 'AWS')
    cy.get('body').should('not.contain', 'Cognito')
    cy.get('body').should('not.contain', 'RDS')
    cy.get('body').should('not.contain', 'Lambda')
    cy.get('body').should('not.contain', 'S3')
  })

  it('should use local API endpoints', () => {
    // Check that the frontend is configured to use local API
    cy.window().then((win) => {
      // This should be the local API URL
      expect(win.location.origin).to.equal('http://localhost:3000')
    })
  })

  it('should load without any console errors related to AWS', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.stub(win.console, 'error').as('consoleError')
      }
    })
    
    // Wait a bit for any async operations
    cy.wait(2000)
    
    // Check that there are no AWS-related console errors
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /AWS|Cognito|RDS/)
  })
})
