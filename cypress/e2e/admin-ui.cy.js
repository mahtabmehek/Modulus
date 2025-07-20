describe('Admin User Interface Tests', () => {
    beforeEach(() => {
        // Login as admin before each test
        cy.loginAsAdmin()
        // Wait for successful login and dashboard load
        cy.url().should('include', '/dashboard')
    })

    it('should display admin-specific navigation and buttons', () => {
        // Check main navigation elements
        cy.get('[data-testid="nav-dashboard"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-courses"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-labs"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-users"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-admin"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-system"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-profile"]').should('exist').and('be.visible')

        // Admin should see all administrative elements
        cy.get('[data-testid="nav-system-settings"]').should('exist').and('be.visible')
        cy.get('[data-testid="nav-database"]').should('exist').and('be.visible')
    })

    it('should have full user management capabilities', () => {
        cy.visit('/admin/users')

        // Check for comprehensive user management
        cy.get('[data-testid="users-table"]').should('exist').and('be.visible')
        cy.get('[data-testid="create-user-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="bulk-actions"]').should('exist').and('be.visible')
        cy.get('[data-testid="delete-user-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="promote-user-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="export-all-users"]').should('exist').and('be.visible')

        // Admin-only dangerous actions
        cy.get('[data-testid="reset-all-passwords"]').should('exist').and('be.visible')
        cy.get('[data-testid="mass-delete-users"]').should('exist').and('be.visible')
    })

    it('should have full course and content management', () => {
        cy.visit('/admin/courses')

        // Check for complete course management
        cy.get('[data-testid="create-course-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="import-courses-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="export-courses-button"]').should('exist').and('be.visible')

        cy.get('[data-testid="course-card"]').first().within(() => {
            cy.get('[data-testid="edit-course-button"]').should('exist').and('be.visible')
            cy.get('[data-testid="delete-course-button"]').should('exist').and('be.visible')
            cy.get('[data-testid="clone-course-button"]').should('exist').and('be.visible')
            cy.get('[data-testid="archive-course-button"]').should('exist').and('be.visible')
        })
    })

    it('should display comprehensive admin dashboard', () => {
        cy.visit('/admin/dashboard')

        // Check for admin-specific widgets
        cy.get('[data-testid="system-health"]').should('exist').and('be.visible')
        cy.get('[data-testid="database-status"]').should('exist').and('be.visible')
        cy.get('[data-testid="user-statistics"]').should('exist').and('be.visible')
        cy.get('[data-testid="system-logs"]').should('exist').and('be.visible')
        cy.get('[data-testid="performance-metrics"]').should('exist').and('be.visible')
        cy.get('[data-testid="security-alerts"]').should('exist').and('be.visible')
    })

    it('should have system configuration access', () => {
        cy.visit('/admin/settings')

        // Check for system settings
        cy.get('[data-testid="system-settings-form"]').should('exist').and('be.visible')
        cy.get('[data-testid="email-configuration"]').should('exist').and('be.visible')
        cy.get('[data-testid="security-settings"]').should('exist').and('be.visible')
        cy.get('[data-testid="backup-settings"]').should('exist').and('be.visible')
        cy.get('[data-testid="maintenance-mode"]').should('exist').and('be.visible')
    })

    it('should have database management capabilities', () => {
        cy.visit('/admin/database')

        // Check for database management features
        cy.get('[data-testid="database-backup-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="database-restore-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="run-migrations-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="database-cleanup-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="view-database-logs"]').should('exist').and('be.visible')
    })

    it('should have access to advanced lab management', () => {
        cy.visit('/admin/labs')

        // Check for advanced lab management
        cy.get('[data-testid="create-lab-button"]').should('exist').and('be.visible')
        cy.get('[data-testid="bulk-lab-actions"]').should('exist').and('be.visible')
        cy.get('[data-testid="lab-templates"]').should('exist').and('be.visible')

        cy.get('[data-testid="lab-card"]').first().within(() => {
            cy.get('[data-testid="edit-lab-button"]').should('exist').and('be.visible')
            cy.get('[data-testid="delete-lab-button"]').should('exist').and('be.visible')
            cy.get('[data-testid="clone-lab-button"]').should('exist').and('be.visible')
            cy.get('[data-testid="export-lab-button"]').should('exist').and('be.visible')
        })
    })

    it('should have system monitoring and logs access', () => {
        cy.visit('/admin/monitoring')

        // Check for monitoring features
        cy.get('[data-testid="system-logs-viewer"]').should('exist').and('be.visible')
        cy.get('[data-testid="error-logs"]').should('exist').and('be.visible')
        cy.get('[data-testid="performance-charts"]').should('exist').and('be.visible')
        cy.get('[data-testid="user-activity-log"]').should('exist').and('be.visible')
        cy.get('[data-testid="security-audit-log"]').should('exist').and('be.visible')
    })
})
