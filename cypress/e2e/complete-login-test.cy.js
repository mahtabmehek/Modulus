describe('Modulus LMS Login Flow - Complete Test', () => {
    const frontendUrl = 'http://localhost:3000';
    const backendUrl = 'http://localhost:3001';

    // Test user credentials that we know exist
    const validUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
    };

    beforeEach(() => {
        // Verify backend is running
        cy.request('GET', `${backendUrl}/api/health`).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.status).to.eq('healthy');
        });

        // Clear any existing authentication
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.window().then((win) => {
            win.sessionStorage.clear();
        });
    });

    it('should verify backend API is working', () => {
        // Test backend health endpoint
        cy.request('GET', `${backendUrl}/api/health`).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('status', 'healthy');
            expect(response.body).to.have.property('version');
        });

        // Test backend status endpoint
        cy.request('GET', `${backendUrl}/api/status`).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('message');
        });
    });

    it('should load the frontend application', () => {
        cy.visit(frontendUrl);

        // Wait for React to load
        cy.wait(3000);

        // Verify page loaded
        cy.get('body').should('be.visible');
        cy.get('html').should('contain.text', 'Modulus').or('contain.text', 'LMS').or('contain.text', 'Login');

        // Take a screenshot for debugging
        cy.screenshot('homepage-loaded');
    });

    it('should navigate to login page and display form', () => {
        cy.visit(frontendUrl);
        cy.wait(2000);

        // Try different ways to access login
        cy.get('body').then(($body) => {
            const bodyText = $body.text();

            if ($body.find('input[type="email"]').length > 0) {
                cy.log('✅ Login form already visible on homepage');
            } else if ($body.find('a, button').filter(':contains("Login"), :contains("Sign In"), :contains("Sign in")').length > 0) {
                cy.log('✅ Login button/link found, clicking it');
                cy.get('a, button').filter(':contains("Login"), :contains("Sign In"), :contains("Sign in")').first().click();
                cy.wait(1000);
            } else {
                cy.log('📝 Trying login via URL parameter');
                cy.visit(`${frontendUrl}?view=login`);
                cy.wait(2000);
            }
        });

        // Verify login form elements are present
        cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button').contains(/sign in|login|submit/i).should('be.visible');

        cy.screenshot('login-form-visible');
    });

    it('should successfully authenticate with valid credentials', () => {
        // Navigate to login
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(2000);

        // Fill in credentials
        cy.get('input[type="email"]').should('be.visible').clear().type(validUser.email);
        cy.get('input[type="password"]').should('be.visible').clear().type(validUser.password);

        // Submit form
        cy.get('button').contains(/sign in|login|submit/i).click();

        // Wait for authentication to complete
        cy.wait(5000);

        // Check for successful authentication indicators
        cy.get('body').should(($body) => {
            const text = $body.text();
            expect(text).to.satisfy((bodyText) =>
                bodyText.includes(validUser.name) ||
                bodyText.includes('Dashboard') ||
                bodyText.includes('Welcome') ||
                bodyText.includes('Logout') ||
                bodyText.includes('Profile') ||
                !bodyText.includes('Sign In')
            );
        });

        // Verify URL changed away from login
        cy.url().should('not.contain', 'view=login');

        cy.screenshot('successful-login');
    });

    it('should reject invalid credentials', () => {
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(2000);

        // Try invalid credentials
        cy.get('input[type="email"]').should('be.visible').clear().type('invalid@example.com');
        cy.get('input[type="password"]').should('be.visible').clear().type('wrongpassword');

        // Submit form
        cy.get('button').contains(/sign in|login|submit/i).click();

        // Wait for error response
        cy.wait(3000);

        // Should show error message or stay on login page
        cy.get('body').should(($body) => {
            const text = $body.text().toLowerCase();
            expect(text).to.satisfy((bodyText) =>
                bodyText.includes('error') ||
                bodyText.includes('invalid') ||
                bodyText.includes('incorrect') ||
                bodyText.includes('failed') ||
                bodyText.includes('sign in') // Still showing login form
            );
        });

        cy.screenshot('invalid-login-attempt');
    });

    it('should validate empty form submission', () => {
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(2000);

        // Try to submit empty form
        cy.get('button').contains(/sign in|login|submit/i).click();

        // Should show validation errors or prevent submission
        cy.wait(1000);

        // Form should still be visible (not submitted)
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');

        cy.screenshot('empty-form-validation');
    });

    it('should test complete user flow from login to authenticated state', () => {
        // Start at homepage
        cy.visit(frontendUrl);
        cy.wait(2000);

        // Navigate to login (try multiple methods)
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(2000);

        // Authenticate
        cy.get('input[type="email"]').should('be.visible').type(validUser.email);
        cy.get('input[type="password"]').should('be.visible').type(validUser.password);
        cy.get('button').contains(/sign in|login|submit/i).click();

        // Wait for authentication and navigation
        cy.wait(5000);

        // Verify we're in authenticated state
        cy.url().should('not.contain', 'view=login');

        // Check for authenticated user interface elements
        cy.get('body').should('be.visible');

        // Look for common authenticated interface elements
        cy.get('body').then(($body) => {
            const text = $body.text();
            cy.log(`Page content includes: ${text.substring(0, 200)}...`);

            // Should have some indication of authenticated state
            expect(text).to.satisfy((bodyText) =>
                bodyText.includes(validUser.name) ||
                bodyText.includes('Dashboard') ||
                bodyText.includes('Logout') ||
                bodyText.includes('Profile') ||
                bodyText.includes('Welcome') ||
                bodyText.includes('Menu')
            );
        });

        cy.screenshot('authenticated-dashboard');

        // Test that we can access protected content
        cy.request({
            method: 'GET',
            url: `${backendUrl}/api/auth/login`,
            body: {
                email: validUser.email,
                password: validUser.password
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('token');
            expect(response.body.user.email).to.eq(validUser.email);
        });
    });
});
