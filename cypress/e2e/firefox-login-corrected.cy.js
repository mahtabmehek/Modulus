/// <reference types="cypress" />

/**
 * Firefox-Specific Login Tests for Modulus LMS (Corrected Version)
 * 
 * This test suite is specifically designed for Firefox browser and validates
 * the login functionality works correctly in Firefox environment.
 */

describe('Firefox Login Tests - Corrected', () => {
    beforeEach(() => {
        // Clear any existing sessions
        cy.clearCookies()
        cy.clearLocalStorage()
        cy.window().then((win) => {
            win.sessionStorage.clear()
        })

        // Verify we're running in Firefox
        cy.window().then((win) => {
            expect(win.navigator.userAgent).to.include('Firefox')
        })

        // Visit login page
        cy.visit('/?view=login')

        // Wait for page to load completely
        cy.get('body').should('be.visible')
    })

    context('Basic Form Validation', () => {
        it('should display login form elements correctly in Firefox', () => {
            // Check form structure
            cy.get('form').should('exist').and('be.visible')
            cy.get('input[type="email"]').should('exist').and('be.visible')
            cy.get('input[type="password"]').should('exist').and('be.visible')
            cy.get('button[type="submit"]').should('exist').and('be.visible')

            // Check Firefox-specific form attributes
            cy.get('input[type="email"]').should('have.attr', 'required')
            cy.get('input[type="password"]').should('have.attr', 'required')
        })

        it('should validate email format in Firefox', () => {
            cy.get('input[type="email"]').type('invalid-email')
            cy.get('input[type="password"]').type('password123')
            cy.get('button[type="submit"]').click()

            // Firefox has built-in email validation
            cy.get('input[type="email"]:invalid').should('exist')
        })

        it('should prevent submission with empty fields', () => {
            // Button should be disabled when fields are empty
            cy.get('button[type="submit"]').should('be.disabled')

            // Enter email only
            cy.get('input[type="email"]').type('test@example.com')
            cy.get('button[type="submit"]').should('be.disabled')

            // Clear email and enter password only
            cy.get('input[type="email"]').clear()
            cy.get('input[type="password"]').type('password123')
            cy.get('button[type="submit"]').should('be.disabled')

            // Enter both - button should be enabled
            cy.get('input[type="email"]').type('test@example.com')
            cy.get('button[type="submit"]').should('not.be.disabled')
        })
    })

    context('Successful Login Scenarios', () => {
        it('should login successfully as Student in Firefox', () => {
            cy.get('input[type="email"]').type('student@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            // Should redirect to dashboard
            cy.url().should('not.include', 'view=login')
            cy.url().should('include', 'view=dashboard')
        })

        it('should login successfully as Instructor in Firefox', () => {
            cy.get('input[type="email"]').type('instructor@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            // Should redirect to dashboard
            cy.url().should('include', 'view=dashboard')
        })

        it('should login successfully as Staff in Firefox', () => {
            cy.get('input[type="email"]').type('staff@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            // Should redirect to dashboard
            cy.url().should('include', 'view=dashboard')
        })

        it('should login successfully as Admin in Firefox', () => {
            cy.get('input[type="email"]').type('admin@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            // Should redirect to dashboard
            cy.url().should('include', 'view=dashboard')
        })
    })

    context('Failed Login Scenarios', () => {
        it('should handle invalid credentials gracefully in Firefox', () => {
            cy.get('input[type="email"]').type('invalid@test.com')
            cy.get('input[type="password"]').type('wrongpassword')
            cy.get('button[type="submit"]').click()

            // Should stay on login page
            cy.url().should('include', 'view=login')

            // Should show error message (looking for actual error display)
            cy.get('.text-red-700, .text-red-600, [class*="text-red"]')
                .should('be.visible')
                .should('contain.text', 'User not found')
        })

        it('should handle server errors gracefully in Firefox', () => {
            // Mock server error
            cy.intercept('POST', '/api/auth/login', {
                statusCode: 500,
                body: { error: 'Internal server error' }
            }).as('loginError')

            cy.get('input[type="email"]').type('test@example.com')
            cy.get('input[type="password"]').type('password123')
            cy.get('button[type="submit"]').click()

            cy.wait('@loginError')

            // Should show error message
            cy.get('.text-red-700, .text-red-600, [class*="text-red"]')
                .should('be.visible')
        })
    })

    context('Firefox-Specific Features', () => {
        it('should handle Firefox autofill correctly', () => {
            // Test autofill simulation
            cy.get('input[type="email"]').type('test@example.com', { delay: 10 })
            cy.get('input[type="password"]').type('password123', { delay: 10 })

            // Verify values are retained
            cy.get('input[type="email"]').should('have.value', 'test@example.com')
            cy.get('input[type="password"]').should('have.value', 'password123')
        })

        it('should work with Firefox password manager simulation', () => {
            // Simulate password manager filling fields
            cy.get('input[type="email"]').invoke('val', 'student@test.com').trigger('input')
            cy.get('input[type="password"]').invoke('val', 'Mahtabmehek@1337').trigger('input')

            // Button should be enabled
            cy.get('button[type="submit"]').should('not.be.disabled')
        })
    })

    context('Performance in Firefox', () => {
        it('should load login page quickly in Firefox', () => {
            const startTime = Date.now()

            cy.visit('/?view=login').then(() => {
                const loadTime = Date.now() - startTime
                expect(loadTime).to.be.lessThan(3000) // Should load in under 3 seconds
            })

            cy.get('form').should('be.visible')
        })

        it('should submit login form quickly in Firefox', () => {
            cy.get('input[type="email"]').type('student@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')

            const startTime = Date.now()
            cy.get('button[type="submit"]').click()

            cy.url().should('include', 'view=dashboard').then(() => {
                const submitTime = Date.now() - startTime
                expect(submitTime).to.be.lessThan(5000) // Should submit in under 5 seconds
            })
        })
    })

    context('Session Management', () => {
        it('should maintain session across page refreshes', () => {
            // Login first
            cy.get('input[type="email"]').type('student@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            cy.url().should('include', 'view=dashboard')

            // Refresh page
            cy.reload()

            // Should still be logged in
            cy.url().should('not.include', 'view=login')
        })
    })
})

// Custom Firefox-specific commands
Cypress.Commands.add('loginFirefoxUser', (email, password) => {
    cy.visit('/?view=login')

    // Use Firefox-optimized input methods
    cy.get('input[type="email"]').clear().type(email, { delay: 50 })
    cy.get('input[type="password"]').clear().type(password, { delay: 50 })

    // Firefox-specific click behavior
    cy.get('button[type="submit"]').should('not.be.disabled').click()

    // Wait for navigation
    cy.url().should('include', 'view=dashboard')
})
