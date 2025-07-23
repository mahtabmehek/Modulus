// Firefox-specific commands and configurations for Cypress

// Firefox browser detection and optimization
Cypress.Commands.add('ensureFirefox', () => {
    cy.window().then((win) => {
        if (!win.navigator.userAgent.includes('Firefox')) {
            throw new Error('This test requires Firefox browser')
        }
    })
})

// Firefox-optimized typing with proper delays
Cypress.Commands.add('typeFirefox', { prevSubject: 'element' }, (subject, text, options = {}) => {
    const defaultOptions = {
        delay: 50, // Firefox sometimes needs slight delays
        force: false,
        ...options
    }

    cy.wrap(subject).clear().type(text, defaultOptions)
})

// Firefox-specific click that handles focus properly
Cypress.Commands.add('clickFirefox', { prevSubject: 'element' }, (subject, options = {}) => {
    const defaultOptions = {
        force: false,
        multiple: false,
        ...options
    }

    // Ensure element is in viewport for Firefox
    cy.wrap(subject).scrollIntoView().should('be.visible').click(defaultOptions)
})

// Firefox session verification
Cypress.Commands.add('verifyFirefoxStorage', () => {
    cy.window().then((win) => {
        // Check localStorage works in Firefox
        expect(win.localStorage).to.exist
        expect(win.sessionStorage).to.exist

        // Verify Firefox storage quotas
        if (win.navigator.storage && win.navigator.storage.estimate) {
            return win.navigator.storage.estimate().then((estimate) => {
                expect(estimate.quota).to.be.greaterThan(0)
            })
        }
    })
})

// Firefox-specific login with enhanced error handling
Cypress.Commands.add('loginFirefoxEnhanced', (email, password, options = {}) => {
    const defaults = {
        timeout: 10000,
        retries: 1,
        validateSession: true
    }
    const config = { ...defaults, ...options }

    cy.ensureFirefox()
    cy.visit('/?view=login')

    // Wait for form to be fully loaded
    cy.get('form').should('be.visible')
    cy.get('input[type="email"]').should('be.visible').and('be.enabled')
    cy.get('input[type="password"]').should('be.visible').and('be.enabled')
    cy.get('button[type="submit"]').should('be.visible').and('be.enabled')

    // Enhanced input handling for Firefox
    cy.get('input[type="email"]').typeFirefox(email)
    cy.get('input[type="password"]').typeFirefox(password)

    // Firefox-optimized form submission
    cy.get('button[type="submit"]').clickFirefox()

    if (config.validateSession) {
        // Verify successful login
        cy.url({ timeout: config.timeout }).should('not.include', 'view=login')
        cy.verifyFirefoxStorage()
    }
})

// Firefox developer tools integration
Cypress.Commands.add('checkFirefoxConsole', () => {
    cy.window().then((win) => {
        // Check for console errors that might be Firefox-specific
        const consoleLogs = []
        const originalLog = win.console.log
        const originalError = win.console.error
        const originalWarn = win.console.warn

        win.console.log = (...args) => {
            consoleLogs.push({ type: 'log', args })
            originalLog.apply(win.console, args)
        }

        win.console.error = (...args) => {
            consoleLogs.push({ type: 'error', args })
            originalError.apply(win.console, args)
        }

        win.console.warn = (...args) => {
            consoleLogs.push({ type: 'warn', args })
            originalWarn.apply(win.console, args)
        }

        // Store logs for later inspection
        win.cypressConsoleLogs = consoleLogs
    })
})

// Firefox-specific network monitoring
Cypress.Commands.add('monitorFirefoxNetwork', () => {
    cy.window().then((win) => {
        // Monitor fetch requests in Firefox
        const originalFetch = win.fetch
        const fetchCalls = []

        win.fetch = function (...args) {
            fetchCalls.push({
                url: args[0],
                options: args[1],
                timestamp: Date.now()
            })
            return originalFetch.apply(this, args)
        }

        win.cypressFetchCalls = fetchCalls
    })
})

// Firefox performance monitoring
Cypress.Commands.add('measureFirefoxPerformance', (actionName) => {
    cy.window().then((win) => {
        if (win.performance && win.performance.mark) {
            win.performance.mark(`${actionName}-start`)
        }
    })
})

Cypress.Commands.add('endFirefoxPerformanceMeasure', (actionName, maxDuration = 5000) => {
    cy.window().then((win) => {
        if (win.performance && win.performance.mark && win.performance.measure) {
            win.performance.mark(`${actionName}-end`)
            win.performance.measure(actionName, `${actionName}-start`, `${actionName}-end`)

            const measure = win.performance.getEntriesByName(actionName)[0]
            if (measure) {
                expect(measure.duration).to.be.lessThan(maxDuration)
                cy.log(`Firefox ${actionName} took ${measure.duration.toFixed(2)}ms`)
            }
        }
    })
})

// Firefox-specific accessibility checks
Cypress.Commands.add('checkFirefoxA11y', () => {
    cy.window().then((win) => {
        // Check for Firefox-specific accessibility features
        const focusableElements = win.document.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        )

        focusableElements.forEach((element, index) => {
            // Verify each focusable element can be reached via keyboard
            if (element.offsetParent !== null) { // Element is visible
                expect(element.tabIndex).to.not.equal(-1)
            }
        })
    })
})

// Firefox viewport and responsive testing
Cypress.Commands.add('testFirefoxViewports', () => {
    const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1366, height: 768, name: 'Laptop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
    ]

    viewports.forEach(viewport => {
        cy.viewport(viewport.width, viewport.height)
        cy.log(`Testing Firefox in ${viewport.name} (${viewport.width}x${viewport.height})`)

        // Verify login form is still accessible
        cy.get('form').should('be.visible')
        cy.get('input[type="email"]').should('be.visible')
        cy.get('input[type="password"]').should('be.visible')
        cy.get('button[type="submit"]').should('be.visible')
    })
})

// Export Firefox-specific configuration
export const firefoxConfig = {
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,

    // Firefox-specific settings
    browser: 'firefox',
    firefoxGcInterval: null,
    firefoxMemoryLimit: null,

    // Enhanced debugging for Firefox
    video: true,
    videoUploadOnPasses: false,
    screenshot: true,
    screenshotOnRunFailure: true,

    // Firefox-optimized retry settings
    retries: {
        runMode: 2,
        openMode: 1
    }
}
