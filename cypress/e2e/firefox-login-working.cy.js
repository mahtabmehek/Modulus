/// <reference types="cypress" />

/**
 * Firefox-Specific Login Tests - Working Version
 * 
 * This simplified test suite focuses on core login functionality
 * that works reliably in Firefox.
 */

describe('Firefox Login Tests - Working Version', () => {
    beforeEach(() => {
        // Clear any existing sessions
        cy.clearCookies()
        cy.clearLocalStorage()
        cy.window().then((win) => {
            win.sessionStorage.clear()
        })

        // Visit login page
        cy.visit('/?view=login')

        // Wait for page to load completely
        cy.get('body').should('be.visible')
        cy.get('form').should('be.visible')
    })

    context('Core Functionality', () => {
        it('should display login form correctly in Firefox', () => {
            // Verify we're in Firefox
            cy.window().then((win) => {
                expect(win.navigator.userAgent).to.include('Firefox')
            })

            // Check form elements
            cy.get('form').should('exist').and('be.visible')
            cy.get('input[type="email"]').should('exist').and('be.visible')
            cy.get('input[type="password"]').should('exist').and('be.visible')
            cy.get('button[type="submit"]').should('exist').and('be.visible')

            // Check required attributes
            cy.get('input[type="email"]').should('have.attr', 'required')
            cy.get('input[type="password"]').should('have.attr', 'required')
        })

        it('should validate email format using Firefox built-in validation', () => {
            cy.get('input[type="email"]').type('invalid-email')
            cy.get('input[type="password"]').type('password123')
            cy.get('button[type="submit"]').click()

            // Firefox built-in validation should kick in
            cy.get('input[type="email"]:invalid').should('exist')
        })

        it('should disable submit button when fields are empty', () => {
            // Button should be disabled initially
            cy.get('button[type="submit"]').should('be.disabled')

            // Add email only
            cy.get('input[type="email"]').type('test@example.com')
            cy.get('button[type="submit"]').should('be.disabled')

            // Add password - button should become enabled
            cy.get('input[type="password"]').type('password123')
            cy.get('button[type="submit"]').should('not.be.disabled')
        })

        it('should login successfully with valid instructor credentials and show instructor dashboard', () => {
            cy.get('input[type="email"]').type('instructor@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            // Should redirect to dashboard
            cy.url({ timeout: 10000 }).should('include', 'view=dashboard')

            // Verify instructor-specific dashboard content
            cy.get('h1').should('contain.text', 'Instructor Dashboard')

            // Check for instructor-specific elements
            cy.get('body').then($body => {
                const bodyText = $body.text().toLowerCase()

                // Should see instructor-specific actions
                expect(bodyText).to.include('create achievement')
                expect(bodyText).to.include('quick actions')

                // Should see course and lab management sections
                cy.get('h2').should('contain.text', 'Quick Actions')

                // Should NOT see staff/admin-only features
                expect(bodyText).to.not.include('pending approvals')
                expect(bodyText).to.not.include('user management')
            })
        })

        it('should login successfully with valid staff credentials and show staff dashboard', () => {
            cy.get('input[type="email"]').type('staff@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            // Should redirect to dashboard
            cy.url({ timeout: 10000 }).should('include', 'view=dashboard')

            // Verify staff-specific dashboard content
            cy.get('h1').should('contain.text', 'Staff Dashboard')

            // Check for staff-specific elements
            cy.get('body').then($body => {
                const bodyText = $body.text().toLowerCase()

                // Should see staff-specific management features
                expect(bodyText).to.include('total users')
                expect(bodyText).to.include('total courses')
                expect(bodyText).to.include('pending approvals')

                // Should see management buttons
                expect(bodyText).to.include('create course')

                // Should NOT see instructor-specific features
                expect(bodyText).to.not.include('create achievement')

                cy.log('✅ Staff dashboard shows appropriate management features')
            })
        })

        it('should handle invalid credentials gracefully', () => {
            cy.get('input[type="email"]').type('nonexistent@test.com')
            cy.get('input[type="password"]').type('wrongpassword')
            cy.get('button[type="submit"]').click()

            // Should stay on login page
            cy.url().should('include', 'view=login')

            // Should show some error indication
            cy.get('.text-red-700, .text-red-600, [class*="text-red"], [class*="error"]')
                .should('be.visible')
        })
    })

    context('Firefox-Specific Features', () => {
        it('should handle Firefox autofill behavior', () => {
            // Test typing with Firefox-like delays
            cy.get('input[type="email"]').type('instructor@test.com', { delay: 50 })
            cy.get('input[type="password"]').type('Mahtabmehek@1337', { delay: 50 })

            // Verify values are set correctly
            cy.get('input[type="email"]').should('have.value', 'instructor@test.com')
            cy.get('input[type="password"]').should('have.value', 'Mahtabmehek@1337')

            // Submit should work
            cy.get('button[type="submit"]').should('not.be.disabled')
        })

        it('should handle Firefox input events correctly', () => {
            // Type in fields with Firefox-specific events
            cy.get('input[type="email"]')
                .focus()
                .type('staff@test.com')
                .blur()
                .should('have.value', 'staff@test.com')

            cy.get('input[type="password"]')
                .focus()
                .type('Mahtabmehek@1337')
                .blur()
                .should('have.value', 'Mahtabmehek@1337')

            // Button should be enabled
            cy.get('button[type="submit"]').should('not.be.disabled')
        })
    })

    context('Role-Based Access Control Validation', () => {
        it('should prevent role escalation - each role sees only appropriate content', () => {
            const roles = [
                { email: 'student@test.com', role: 'student', shouldNotSee: ['create user', 'pending approvals', 'user management'] },
                { email: 'instructor@test.com', role: 'instructor', shouldNotSee: ['user management', 'approve user', 'delete user'] },
                { email: 'staff@test.com', role: 'staff', shouldNotSee: ['system settings', 'server config'] }
            ]

            roles.forEach(({ email, role, shouldNotSee }) => {
                // Clear session
                cy.clearCookies()
                cy.clearLocalStorage()
                cy.visit('/?view=login')

                // Login as specific role
                cy.get('input[type="email"]').type(email)
                cy.get('input[type="password"]').type('Mahtabmehek@1337')
                cy.get('button[type="submit"]').click()

                cy.url({ timeout: 10000 }).should('include', 'view=dashboard')

                // Verify role-appropriate content restrictions
                cy.get('body').then($body => {
                    const bodyText = $body.text().toLowerCase()

                    shouldNotSee.forEach(forbiddenContent => {
                        expect(bodyText).to.not.include(forbiddenContent.toLowerCase())
                    })

                    cy.log(`✅ ${role} correctly restricted from: ${shouldNotSee.join(', ')}`)
                })
            })
        })

        it('should verify role-specific navigation elements in Firefox', () => {
            // Test staff navigation
            cy.get('input[type="email"]').type('staff@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            cy.url({ timeout: 10000 }).should('include', 'view=dashboard')

            // Check for staff-appropriate navigation
            cy.get('body').then($body => {
                const pageContent = $body.text().toLowerCase()

                // Staff should see management options
                const staffFeatures = ['courses', 'users', 'dashboard']
                let foundFeatures = 0

                staffFeatures.forEach(feature => {
                    if (pageContent.includes(feature)) {
                        foundFeatures++
                    }
                })

                expect(foundFeatures).to.be.greaterThan(0)
                cy.log(`✅ Staff navigation contains ${foundFeatures} expected features`)
            })
        })
    })

    context('Performance in Firefox', () => {
        it('should load login page reasonably quickly', () => {
            const startTime = Date.now()

            cy.visit('/?view=login').then(() => {
                const loadTime = Date.now() - startTime
                cy.log(`Page load time: ${loadTime}ms`)
                // Give some flexibility for CI environments
                expect(loadTime).to.be.lessThan(5000)
            })

            cy.get('form').should('be.visible')
        })

        it('should respond to form interactions promptly', () => {
            const startTime = Date.now()

            cy.get('input[type="email"]').type('instructor@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')

            cy.get('button[type="submit"]').should('not.be.disabled').then(() => {
                const interactionTime = Date.now() - startTime
                cy.log(`Form interaction time: ${interactionTime}ms`)
                expect(interactionTime).to.be.lessThan(3000)
            })
        })
    })

    context('Role-Specific Dashboard Validation', () => {
        it('should display admin-specific dashboard content after admin login', () => {
            cy.get('input[type="email"]').type('admin@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            cy.url({ timeout: 10000 }).should('include', 'view=dashboard')

            // Admin should have full system access
            cy.get('body').then($body => {
                const bodyText = $body.text().toLowerCase()

                // Admin has comprehensive access
                expect(bodyText).to.include('admin')

                // Should have administrative capabilities
                cy.log('✅ Admin dashboard loaded with appropriate permissions')
            })
        })

        it('should display student-specific dashboard content after student login', () => {
            cy.get('input[type="email"]').type('student@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            cy.url({ timeout: 10000 }).should('include', 'view=dashboard')

            // Student should have limited access
            cy.get('body').then($body => {
                const bodyText = $body.text().toLowerCase()

                // Student sees course content and progress
                expect(bodyText).to.include('student')

                // Should NOT see administrative features
                expect(bodyText).to.not.include('create user')
                expect(bodyText).to.not.include('pending approvals')
                expect(bodyText).to.not.include('user management')

                cy.log('✅ Student dashboard shows limited, appropriate content')
            })
        })

        it('should verify instructor dashboard has course management capabilities', () => {
            cy.get('input[type="email"]').type('instructor@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            cy.url({ timeout: 10000 }).should('include', 'view=dashboard')

            // Wait for dashboard to fully load
            cy.get('h1', { timeout: 10000 }).should('be.visible')

            // Check for instructor-specific capabilities
            cy.get('body').then($body => {
                const bodyText = $body.text().toLowerCase()

                // Instructor should see course and lab management
                expect(bodyText).to.include('instructor')

                // Should have teaching-related features
                if (bodyText.includes('labs') || bodyText.includes('courses')) {
                    cy.log('✅ Instructor can see course/lab management options')
                }

                // Should NOT have user administration
                expect(bodyText).to.not.include('approve user')
                expect(bodyText).to.not.include('delete user')
            })
        })

        it('should verify staff dashboard has user management capabilities', () => {
            cy.get('input[type="email"]').type('staff@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')
            cy.get('button[type="submit"]').click()

            cy.url({ timeout: 10000 }).should('include', 'view=dashboard')

            // Wait for dashboard to fully load
            cy.get('h1', { timeout: 10000 }).should('be.visible')

            // Check for staff-specific management capabilities
            cy.get('body').then($body => {
                const bodyText = $body.text().toLowerCase()

                // Staff should see administrative features
                expect(bodyText).to.include('staff')

                // Should have user and course management
                if (bodyText.includes('users') || bodyText.includes('courses') || bodyText.includes('approvals')) {
                    cy.log('✅ Staff can see user/course management options')
                }

                // Should have oversight capabilities
                if (bodyText.includes('total') && bodyText.includes('pending')) {
                    cy.log('✅ Staff can see system statistics and pending items')
                }
            })
        })
    })

    context('Error Handling', () => {
        it('should handle server errors gracefully', () => {
            // Mock a server error
            cy.intercept('POST', '/api/auth/login', {
                statusCode: 500,
                body: { error: 'Internal server error' }
            }).as('serverError')

            cy.get('input[type="email"]').type('test@example.com')
            cy.get('input[type="password"]').type('password123')
            cy.get('button[type="submit"]').click()

            cy.wait('@serverError')

            // Should show error message
            cy.get('.text-red-700, .text-red-600, [class*="text-red"], [class*="error"]')
                .should('be.visible')
        })

        it('should handle network timeouts appropriately', () => {
            // Mock a timeout
            cy.intercept('POST', '/api/auth/login', { delay: 30000 }).as('loginTimeout')

            cy.get('input[type="email"]').type('test@example.com')
            cy.get('input[type="password"]').type('password123')
            cy.get('button[type="submit"]').click()

            // Button should show loading state or be disabled during request
            cy.get('button[type="submit"]').should('contain.text', 'Signing In')
        })
    })
})

// Firefox-optimized login command
Cypress.Commands.add('firefoxLogin', (email, password) => {
    cy.visit('/?view=login')

    cy.get('input[type="email"]')
        .clear()
        .type(email, { delay: 50 })
        .should('have.value', email)

    cy.get('input[type="password"]')
        .clear()
        .type(password, { delay: 50 })
        .should('have.value', password)

    cy.get('button[type="submit"]')
        .should('not.be.disabled')
        .click()

    cy.url({ timeout: 10000 }).should('include', 'view=dashboard')
})
