describe('Staff User Interface Tests', () => {
    beforeEach(() => {
        // Login as staff before each test
        cy.loginAsStaff()
        // Wait for successful login and dashboard load
        cy.url().should('include', '/dashboard')
    })

    it('should display staff-specific navigation and buttons', () => {
        // Check main navigation elements
        cy.get('[data-testid="nav-dashboard"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-courses"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-labs"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-users"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-reports"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-profile"]').should('exist').and('be.visible')

        // Staff should see some administrative elements
        cy.get('[data-testid="nav-user-management"]').should('exist').and('be.visible')

        // Staff should NOT see full admin elements
        cy.get('[data-testid="nav-system-settings"]').should('not.exist')
        cy.get('[data-testid="nav-server-config"]').should('not.exist')
    })

    it('should have access to user management features', () => {
        cy.visit('/users')

        // Check for user management features
        cy.get('[data-testid="users-table"]').should('exist').and('be.visible')
        cy.get('[data-testid="approve-user-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="create-user-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="export-users-button"]').should('exist').and('be.visible')

        // Should not see system admin functions
        cy.get('[data-testid="delete-all-users"]').should('not.exist')
        cy.get('[data-testid="system-backup"]').should('not.exist')
    })

    it('should have access to course oversight', () => {
        cy.visit('/courses')

        // Check for course oversight features
        cy.get('[data-testid="course-card"]').should('exist')
        cy.get('[data-testid="view-course-analytics"]').should('exist').and('be.visible')
        cy.get('[data-testid="manage-enrollments"]').should('exist').and('be.visible')

        // Limited course editing capabilities
        cy.get('[data-testid="edit-course-button"]').should('exist')
        // But should not see delete options
        cy.get('[data-testid="delete-course-button"]').should('not.exist')
    })

    it('should display staff dashboard with oversight features', () => {
        cy.visit('/dashboard')

        // Check for staff-specific widgets
        cy.get('[data-testid="system-overview"]').should('exist').and('be.visible')
        cy.get('[data-testid="user-activity-summary"]').should('exist').and('be.visible')
        cy.get('[data-testid="pending-approvals"]').should('exist').and('be.visible')
        cy.get('[data-testid="platform-statistics"]').should('exist').and('be.visible')
    })

    it('should have access to reporting features', () => {
        cy.visit('/reports')

        // Check for reporting features
        cy.get('[data-testid="generate-report-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="user-progress-report"]').should('exist').and('be.visible')
        cy.get('[data-testid="course-completion-report"]').should('exist').and('be.visible')
        cy.get('[data-testid="lab-usage-report"]').should('exist').and('be.visible')
    })

    it('should allow announcement management', () => {
        cy.visit('/announcements')

        // Check for announcement features
        cy.get('[data-testid="create-announcement-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="announcements-list"]').should('exist').and('be.visible')
        cy.get('[data-testid="edit-announcement-button"]').should('exist').and('be.visible')

        // Should have publishing controls
        cy.get('[data-testid="publish-announcement"]').should('exist').and('be.visible')
        cy.get('[data-testid="schedule-announcement"]').should('exist').and('be.visible')
    })
})
