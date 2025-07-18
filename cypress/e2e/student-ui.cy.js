describe('Student User Interface Tests', () => {
  beforeEach(() => {
    // Login as student before each test
    cy.loginAsStudent()
    // Wait for successful login and dashboard load
    cy.url().should('include', '/dashboard')
  })

  it('should display student-specific navigation and buttons', () => {
    // Check main navigation elements
    cy.get('[data-testid="nav-dashboard"]').should('exist').and('be.visible')
    cy.get('[data-testid="nav-courses"]').should('exist').and('be.visible')
    cy.get('[data-testid="nav-labs"]').should('exist').and('be.visible')
    cy.get('[data-testid="nav-profile"]').should('exist').and('be.visible')
    
    // Student should NOT see admin/instructor only elements
    cy.get('[data-testid="nav-admin"]').should('not.exist')
    cy.get('[data-testid="nav-users"]').should('not.exist')
    cy.get('[data-testid="nav-create-course"]').should('not.exist')
  })

  it('should have access to course enrollment features', () => {
    cy.visit('/courses')
    
    // Check for course listing
    cy.get('[data-testid="course-card"]').should('exist')
    
    // Check for enroll buttons on courses
    cy.get('[data-testid="enroll-button"]').should('exist').and('be.visible')
    
    // Should not see course management buttons
    cy.get('[data-testid="edit-course-button"]').should('not.exist')
    cy.get('[data-testid="delete-course-button"]').should('not.exist')
  })

  it('should have access to lab participation features', () => {
    cy.visit('/labs')
    
    // Check for lab listing
    cy.get('[data-testid="lab-card"]').should('exist')
    
    // Check for start lab buttons
    cy.get('[data-testid="start-lab-button"]').should('exist').and('be.visible')
    
    // Should not see lab management buttons
    cy.get('[data-testid="edit-lab-button"]').should('not.exist')
    cy.get('[data-testid="delete-lab-button"]').should('not.exist')
  })

  it('should display student progress and achievements', () => {
    cy.visit('/dashboard')
    
    // Check for progress indicators
    cy.get('[data-testid="progress-overview"]').should('exist').and('be.visible')
    cy.get('[data-testid="achievements-section"]').should('exist').and('be.visible')
    cy.get('[data-testid="enrolled-courses"]').should('exist').and('be.visible')
    
    // Check for student-specific widgets
    cy.get('[data-testid="upcoming-labs"]').should('exist')
    cy.get('[data-testid="recent-activities"]').should('exist')
  })

  it('should allow profile management', () => {
    cy.visit('/profile')
    
    // Check for profile edit form
    cy.get('[data-testid="profile-form"]').should('exist').and('be.visible')
    cy.get('[data-testid="update-profile-button"]').should('exist').and('be.visible')
    
    // Should not see user management features
    cy.get('[data-testid="manage-users-button"]').should('not.exist')
    cy.get('[data-testid="approve-users-button"]').should('not.exist')
  })
})
