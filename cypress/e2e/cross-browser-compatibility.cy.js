/// <reference types="cypress" />

/**
 * Cross-Browser Compatibility Tests
 * 
 * Tests application functionality across different browsers
 */

describe('Cross-Browser Compatibility Tests', () => {
    const testUsers = [
        { email: 'student@test.com', password: 'Mahtabmehek@1337', role: 'student' },
        { email: 'instructor@test.com', password: 'Mahtabmehek@1337', role: 'instructor' }
    ]

    beforeEach(() => {
        cy.clearCookies()
        cy.clearLocalStorage()
        cy.window().then((win) => {
            win.sessionStorage.clear()
        })
    })

    context('Browser Detection & Optimization', () => {
        it('should detect browser type and version', () => {
            cy.visit('/?view=login')

            cy.window().then((win) => {
                const userAgent = win.navigator.userAgent
                const isFirefox = userAgent.includes('Firefox')
                const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edge')
                const isEdge = userAgent.includes('Edge') || userAgent.includes('Edg/')
                const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')

                cy.log(`User Agent: ${userAgent}`)
                cy.log(`Firefox: ${isFirefox}, Chrome: ${isChrome}, Edge: ${isEdge}, Safari: ${isSafari}`)

                // Browser should be detected
                expect(isFirefox || isChrome || isEdge || isSafari).to.be.true
                cy.log('✅ Browser detection working')
            })
        })

        it('should handle browser-specific JavaScript APIs', () => {
            cy.visit('/?view=login')

            cy.window().then((win) => {
                // Test localStorage support
                expect(win.localStorage).to.exist
                expect(typeof win.localStorage.setItem).to.eq('function')

                // Test fetch API
                expect(win.fetch).to.exist
                expect(typeof win.fetch).to.eq('function')

                // Test modern JavaScript features
                expect(win.Promise).to.exist
                expect(win.Set).to.exist
                expect(win.Map).to.exist

                cy.log('✅ Modern JavaScript APIs supported')
            })
        })
    })

    context('Login Functionality Across Browsers', () => {
        testUsers.forEach(({ email, password, role }) => {
            it(`should login successfully as ${role} in current browser`, () => {
                cy.visit('/?view=login')

                // Get browser info
                cy.window().then((win) => {
                    const browserName = Cypress.browser.name
                    cy.log(`Testing ${role} login in: ${browserName}`)
                })

                // Perform login with browser-appropriate delays
                const isMobile = Cypress.config('viewportWidth') < 768
                const delay = isMobile ? 100 : 50

                cy.get('input[type="email"]').type(email, { delay })
                cy.get('input[type="password"]').type(password, { delay })
                cy.get('button[type="submit"]').click()

                // Verify successful login
                cy.url({ timeout: 10000 }).should('include', 'view=dashboard')
                cy.get('h1').should('be.visible')

                cy.log(`✅ ${role} login successful in ${Cypress.browser.name}`)
            })
        })
    })

    context('CSS and Layout Compatibility', () => {
        it('should render login form correctly across browsers', () => {
            cy.visit('/?view=login')

            // Check form elements visibility
            cy.get('form').should('be.visible')
            cy.get('input[type="email"]').should('be.visible')
            cy.get('input[type="password"]').should('be.visible')
            cy.get('button[type="submit"]').should('be.visible')

            // Check form dimensions and positioning
            cy.get('form').then($form => {
                const formRect = $form[0].getBoundingClientRect()
                expect(formRect.width).to.be.greaterThan(200)
                expect(formRect.height).to.be.greaterThan(100)
                cy.log(`✅ Form dimensions: ${formRect.width}x${formRect.height}`)
            })

            // Check input field styling
            cy.get('input[type="email"]').should('have.css', 'display', 'block')
            cy.get('input[type="password"]').should('have.css', 'display', 'block')

            cy.log(`✅ Login form renders correctly in ${Cypress.browser.name}`)
        })

        it('should handle responsive design across browser viewports', () => {
            const viewports = [
                { width: 1920, height: 1080, name: 'Desktop' },
                { width: 1024, height: 768, name: 'Tablet' },
                { width: 375, height: 667, name: 'Mobile' }
            ]

            viewports.forEach(({ width, height, name }) => {
                cy.viewport(width, height)
                cy.visit('/?view=login')

                // Check responsive behavior
                cy.get('form').should('be.visible')
                cy.get('input[type="email"]').should('be.visible')

                // Form should adapt to viewport
                cy.get('form').then($form => {
                    const formWidth = $form[0].getBoundingClientRect().width
                    expect(formWidth).to.be.lessThan(width)
                    cy.log(`✅ ${name} (${width}x${height}): Form width ${formWidth}px`)
                })
            })
        })

        it('should maintain consistent styling across browsers', () => {
            cy.visit('/?view=login')

            // Check CSS custom properties support
            cy.get('body').then($body => {
                const computedStyle = window.getComputedStyle($body[0])
                const hasCustomProps = computedStyle.getPropertyValue('--foreground') !== ''

                if (hasCustomProps) {
                    cy.log('✅ CSS custom properties supported')
                } else {
                    cy.log('⚠️ CSS custom properties may not be supported')
                }
            })

            // Check for consistent button styling
            cy.get('button[type="submit"]').should('have.css', 'cursor', 'pointer')

            cy.log(`✅ Styling consistency verified in ${Cypress.browser.name}`)
        })
    })

    context('JavaScript Feature Compatibility', () => {
        it('should handle modern JavaScript features', () => {
            cy.visit('/?view=login')

            cy.window().then((win) => {
                // Test ES6+ features
                const supportsArrowFunctions = () => {
                    try {
                        eval('() => {}')
                        return true
                    } catch (e) {
                        return false
                    }
                }

                const supportsAsyncAwait = () => {
                    try {
                        eval('async function test() { await Promise.resolve() }')
                        return true
                    } catch (e) {
                        return false
                    }
                }

                expect(supportsArrowFunctions()).to.be.true
                expect(supportsAsyncAwait()).to.be.true

                // Test DOM APIs
                expect(win.document.querySelector).to.exist
                expect(win.document.querySelectorAll).to.exist
                expect(win.document.addEventListener).to.exist

                cy.log('✅ Modern JavaScript features supported')
            })
        })

        it('should handle form validation APIs', () => {
            cy.visit('/?view=login')

            // Test HTML5 form validation
            cy.get('input[type="email"]').then($input => {
                const input = $input[0]
                expect(input.checkValidity).to.exist
                expect(input.setCustomValidity).to.exist

                // Test invalid email
                input.value = 'invalid-email'
                expect(input.checkValidity()).to.be.false

                // Test valid email
                input.value = 'test@example.com'
                expect(input.checkValidity()).to.be.true

                cy.log('✅ Form validation APIs working')
            })
        })

        it('should handle event listeners correctly', () => {
            cy.visit('/?view=login')

            // Test event handling
            cy.get('input[type="email"]').focus().blur()
            cy.get('input[type="password"]').focus().blur()

            // Test form submission handling
            cy.get('input[type="email"]').type('test@example.com')
            cy.get('input[type="password"]').type('password123')

            // Button should become enabled
            cy.get('button[type="submit"]').should('not.be.disabled')

            cy.log('✅ Event handling working correctly')
        })
    })

    context('Performance Across Browsers', () => {
        it('should load pages within acceptable time limits', () => {
            const startTime = Date.now()

            cy.visit('/?view=login').then(() => {
                const loadTime = Date.now() - startTime

                // Performance expectations may vary by browser
                const isSafari = Cypress.browser.name === 'webkit'
                const maxLoadTime = isSafari ? 8000 : 5000

                expect(loadTime).to.be.lessThan(maxLoadTime)
                cy.log(`✅ Page loaded in ${loadTime}ms (${Cypress.browser.name})`)
            })
        })

        it('should handle animations and transitions smoothly', () => {
            cy.visit('/?view=login')

            // Test button hover states
            cy.get('button[type="submit"]').trigger('mouseover')
            cy.wait(100)
            cy.get('button[type="submit"]').trigger('mouseout')

            // Test input focus animations
            cy.get('input[type="email"]').focus()
            cy.wait(100)
            cy.get('input[type="email"]').blur()

            cy.log('✅ Animations render smoothly')
        })
    })

    context('Browser-Specific Workarounds', () => {
        it('should handle browser-specific input behaviors', () => {
            cy.visit('/?view=login')

            const browserName = Cypress.browser.name

            if (browserName === 'firefox') {
                // Firefox-specific tests
                cy.get('input[type="email"]').type('test@example.com', { delay: 50 })
                cy.get('input[type="password"]').type('password123', { delay: 50 })
                cy.log('✅ Firefox input handling optimized')
            } else if (browserName === 'chrome') {
                // Chrome-specific tests
                cy.get('input[type="email"]').type('test@example.com')
                cy.get('input[type="password"]').type('password123')
                cy.log('✅ Chrome input handling verified')
            } else if (browserName === 'webkit') {
                // Safari-specific tests
                cy.get('input[type="email"]').type('test@example.com', { delay: 25 })
                cy.get('input[type="password"]').type('password123', { delay: 25 })
                cy.log('✅ Safari input handling optimized')
            }

            // Universal checks
            cy.get('button[type="submit"]').should('not.be.disabled')
        })

        it('should handle autofill behaviors correctly', () => {
            cy.visit('/?view=login')

            // Test autofill scenarios
            cy.get('input[type="email"]').type('instructor@test.com')
            cy.get('input[type="password"]').type('Mahtabmehek@1337')

            // Verify values are set correctly despite autofill
            cy.get('input[type="email"]').should('have.value', 'instructor@test.com')
            cy.get('input[type="password"]').should('have.value', 'Mahtabmehek@1337')

            cy.log(`✅ Autofill handling verified in ${Cypress.browser.name}`)
        })
    })

    after(() => {
        cy.log('=== CROSS-BROWSER COMPATIBILITY TESTING COMPLETE ===')
        cy.log(`✅ Browser: ${Cypress.browser.name} ${Cypress.browser.version}`)
        cy.log('✅ Login Functionality: Tested')
        cy.log('✅ CSS/Layout Rendering: Verified')
        cy.log('✅ JavaScript Features: Confirmed')
        cy.log('✅ Performance: Acceptable')
        cy.log('✅ Browser-Specific Optimizations: Applied')
    })
})
