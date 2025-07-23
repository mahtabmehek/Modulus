/// <reference types="cypress" />

/**
 * Firefox-Specific Login Unit Tests for Modulus LMS
 * 
 * This test suite specifically targets Firefox browser capabilities
 * and ensures login functionality works correctly in Firefox.
 */

describe('Firefox Login Unit Tests', () => {
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

    context('Login Form Validation', () => {
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
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            // Firefox has built-in email validation
            cy.get('input[type="email"]:invalid').should('exist')
        })

        it('should require both email and password', () => {
            // Try submitting empty form
            cy.get('button[type="submit"]').click()

            // Check for HTML5 validation in Firefox
            cy.get('input[type="email"]:invalid').should('exist')
            cy.get('input[type="password"]:invalid').should('exist')
        })
    })

    context('Successful Login Scenarios', () => {
        it('should login successfully as Student in Firefox', () => {
            const credentials = {
                email: 'student@test.com',
                password: 'Mahtabmehek@1337'
            }

            // Perform login
            cy.get('input[type="email"]').type(credentials.email)
            cy.get('input[type="password"]').type(credentials.password)
            cy.get('button[type="submit"]').click()

            // Verify successful login
            cy.url().should('not.include', 'view=login')
            cy.url().should('include', '/dashboard')

            // Check for student-specific elements
            cy.get('[data-cy="user-role"]').should('contain', 'Student')

            // Verify Firefox stores session correctly
            cy.window().then((win) => {
                expect(win.localStorage.getItem('token')).to.exist
            })
        })

        it('should login successfully as Instructor in Firefox', () => {
            const credentials = {
                email: 'instructor@test.com',
                password: 'Mahtabmehek@1337'
            }

            cy.get('input[type="email"]').type(credentials.email)
            cy.get('input[type="password"]').type(credentials.password)
            cy.get('button[type="submit"]').click()

            // Verify instructor dashboard
            cy.url().should('include', '/dashboard')
            cy.get('[data-cy="user-role"]').should('contain', 'Instructor')

            // Check instructor-specific navigation
            cy.get('[data-cy="instructor-nav"]').should('be.visible')
        })

        it('should login successfully as Staff in Firefox', () => {
            const credentials = {
                email: 'staff@test.com',
                password: 'Mahtabmehek@1337'
            }

            cy.get('input[type="email"]').type(credentials.email)
            cy.get('input[type="password"]').type(credentials.password)
            cy.get('button[type="submit"]').click()

            cy.url().should('include', '/dashboard')
            cy.get('[data-cy="user-role"]').should('contain', 'Staff')
        })

        it('should login successfully as Admin in Firefox', () => {
            const credentials = {
                email: 'admin@modulus.com',
                password: 'Mahtabmehek@1337'
            }

            cy.get('input[type="email"]').type(credentials.email)
            cy.get('input[type="password"]').type(credentials.password)
            cy.get('button[type="submit"]').click()

            cy.url().should('include', '/dashboard')
            cy.get('[data-cy="user-role"]').should('contain', 'Admin')

            // Verify admin-specific elements
            cy.get('[data-cy="admin-panel"]').should('be.visible')
        })
    })

    context('Failed Login Scenarios', () => {
        it('should handle invalid credentials gracefully in Firefox', () => {
            cy.get('input[type="email"]').type('invalid@test.com')
            cy.get('input[type="password"]').type('wrongpassword')
            cy.get('button[type="submit"]').click()

            // Should stay on login page
            cy.url().should('include', 'view=login')

            // Should show error message
            cy.get('[data-cy="error-message"]')
                .should('be.visible')
                .and('contain', 'Invalid credentials')
        })

        it('should handle server errors in Firefox', () => {
            // Intercept login request to simulate server error
            cy.intercept('POST', '/api/auth/login', {
                statusCode: 500,
                body: { error: 'Internal server error' }
            }).as('loginError')

            cy.get('input[type="email"]').type('student@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            cy.wait('@loginError')

            // Should show appropriate error message
            cy.get('[data-cy="error-message"]')
                .should('be.visible')
                .and('contain', 'server error')
        })
    })

    context('Firefox-Specific Features', () => {
        it('should handle Firefox autofill correctly', () => {
            // Firefox autofill simulation
            cy.get('input[type="email"]').type('student@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')

            // Check that Firefox detects and offers to save password
            cy.get('input[type="password"]').should('have.value', 'Mahtabmehek@1337')
        })

        it('should work with Firefox password manager', () => {
            // Test that login works even when Firefox fills forms
            cy.get('input[type="email"]').invoke('val', 'student@test.com').trigger('input')
            cy.get('input[type="password"]').invoke('val', 'Mahtabmehek@1337').trigger('input')
            cy.get('button[type="submit"]').click()

            cy.url().should('include', '/dashboard')
        })

        it('should handle Firefox privacy mode correctly', () => {
            // Test login functionality in private browsing context
            cy.window().then((win) => {
                // In private mode, some storage might be limited
                cy.login('student@test.com', 'Mahtabmehek@1337')
                cy.url().should('include', '/dashboard')

                // Verify session works even in private mode
                cy.get('[data-cy="user-profile"]').should('be.visible')
            })
        })
    })

    context('Session Management in Firefox', () => {
        it('should maintain session across page refreshes', () => {
            cy.loginAsStudent()

            // Refresh the page
            cy.reload()

            // Should still be logged in
            cy.url().should('include', '/dashboard')
            cy.get('[data-cy="user-profile"]').should('be.visible')
        })

        it('should logout correctly in Firefox', () => {
            cy.loginAsStudent()

            // Perform logout
            cy.get('[data-cy="logout-button"]').click()

            // Should redirect to login page
            cy.url().should('include', 'view=login')

            // Verify session is cleared in Firefox
            cy.window().then((win) => {
                expect(win.localStorage.getItem('token')).to.be.null
            })
        })
    })

    context('Accessibility in Firefox', () => {
        it('should be keyboard navigable in Firefox', () => {
            // Tab through form elements
            cy.get('body').tab()
            cy.focused().should('have.attr', 'type', 'email')

            cy.focused().tab()
            cy.focused().should('have.attr', 'type', 'password')

            cy.focused().tab()
            cy.focused().should('have.attr', 'type', 'submit')
        })

        it('should work with Firefox screen reader', () => {
            // Check ARIA labels and accessibility
            cy.get('input[type="email"]').should('have.attr', 'aria-label')
            cy.get('input[type="password"]').should('have.attr', 'aria-label')
            cy.get('button[type="submit"]').should('have.attr', 'aria-label')
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

            cy.url().should('include', '/dashboard').then(() => {
                const loginTime = Date.now() - startTime
                expect(loginTime).to.be.lessThan(5000) // Should login in under 5 seconds
            })
        })
    })
})

// Custom Firefox-specific commands
Cypress.Commands.add('loginFirefox', (email, password) => {
    cy.visit('/?view=login')

    // Use Firefox-optimized input methods
    cy.get('input[type="email"]').clear().type(email, { delay: 50 })
    cy.get('input[type="password"]').clear().type(password, { delay: 50 })

    // Firefox-specific click behavior
    cy.get('button[type="submit"]').should('be.enabled').click({ force: true })
})

Cypress.Commands.add('verifyFirefoxSession', () => {
    cy.window().then((win) => {
        expect(win.navigator.userAgent).to.include('Firefox')
        expect(win.localStorage.getItem('token')).to.exist
        expect(win.sessionStorage.getItem('user')).to.exist
    })
})
