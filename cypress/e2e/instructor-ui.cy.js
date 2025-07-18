describe('Instructor User Interface Tests', () => {
  beforeEach(() => {
    // Login as instructor before each test
    cy.loginAsInstructor()
    // Wait for successful login and dashboard load
    cy.url().should('include', '/dashboard')
  })

  it('should display instructor-specific navigation and buttons', () => {
    // Check main navigation elements
    cy.get('[data-testid="nav-dashboard"]').should('exist').and('be.visible')
    cy.get('[data-testid="nav-courses"]').should('exist').and('be.visible')
    cy.get('[data-testid="nav-labs"]').should('exist').and('be.visible')
    cy.get('[data-testid="nav-students"]').should('exist').and('be.visible')
    cy.get('[data-testid="nav-profile"]').should('exist').and('be.visible')
    
    // Instructor should see course creation elements
    cy.get('[data-testid="nav-create-course"]').should('exist').and('be.visible')
    
    // Instructor should NOT see admin-only elements
    cy.get('[data-testid="nav-admin"]').should('not.exist')
    cy.get('[data-testid="nav-system-settings"]').should('not.exist')
  })

  it('should have access to course management features', () => {
    cy.visit('/courses')
    
    // Check for course creation button
    cy.get('[data-testid="create-course-button"]').should('exist').and('be.visible')
    
    // Check for course management buttons on existing courses
    cy.get('[data-testid="course-card"]').first().within(() => {
      cy.get('[data-testid="edit-course-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="manage-students-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="view-analytics-button"]').should('exist').and('be.visible')
    })
  })

  it('should have access to lab creation and management', () => {
    cy.visit('/labs')
    
    // Check for lab creation button
    cy.get('[data-testid="create-lab-button"]').should('exist').and('be.visible')
    
    // Check for lab management buttons
    cy.get('[data-testid="lab-card"]').first().within(() => {
      cy.get('[data-testid="edit-lab-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="view-submissions-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="lab-analytics-button"]').should('exist').and('be.visible')
    })
  })

  it('should display instructor dashboard with student management', () => {
    cy.visit('/dashboard')
    
    // Check for instructor-specific widgets
    cy.get('[data-testid="my-courses-overview"]').should('exist').and('be.visible')
    cy.get('[data-testid="student-progress-summary"]').should('exist').and('be.visible')
    cy.get('[data-testid="recent-submissions"]').should('exist').and('be.visible')
    cy.get('[data-testid="course-analytics"]').should('exist').and('be.visible')
  })

  it('should allow student enrollment management', () => {
    cy.visit('/students')
    
    // Check for student management features
    cy.get('[data-testid="students-table"]').should('exist').and('be.visible')
    cy.get('[data-testid="enroll-student-button"]').should('exist').and('be.visible')
    cy.get('[data-testid="export-grades-button"]').should('exist').and('be.visible')
    
    // Should not see system-wide user management
    cy.get('[data-testid="create-admin-button"]').should('not.exist')
    cy.get('[data-testid="system-settings"]').should('not.exist')
  })

  it('should have grading and assessment capabilities', () => {
    cy.visit('/assessments')
    
    // Check for grading features
    cy.get('[data-testid="pending-grades"]').should('exist').and('be.visible')
    cy.get('[data-testid="grade-lab-button"]').should('exist').and('be.visible')
    cy.get('[data-testid="rubric-management"]').should('exist').and('be.visible')
  })
})
