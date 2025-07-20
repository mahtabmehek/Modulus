describe('Modulus LMS Login Test - Fixed', () => {
    const frontendUrl = 'http://localhost:3000';
    const backendUrl = 'http://localhost:3001';

    const validUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
    };

    beforeEach(() => {
        // Clear authentication state
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.window().then((win) => {
            win.sessionStorage.clear();
        });
    });

    it('should verify backend is healthy', () => {
        cy.request('GET', `${backendUrl}/api/health`).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.status).to.eq('healthy');
        });
    });

    it('should load the frontend homepage', () => {
        cy.visit(frontendUrl);
        cy.wait(3000);

        // Page should load
        cy.get('body').should('be.visible');

        // Should contain some content
        cy.get('html').should('contain.text', 'Modulus');

        cy.screenshot('homepage-loaded');
    });

    it('should navigate to login form', () => {
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(3000);

        // Login form should be visible
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');

        cy.screenshot('login-form-displayed');
    });

    it('should show form validation for empty fields', () => {
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(2000);

        // Check if submit button is disabled when form is empty
        cy.get('button[type="submit"]').should('be.disabled');

        cy.screenshot('empty-form-validation');
    });

    it('should enable submit button when form is filled', () => {
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(2000);

        // Fill in the form
        cy.get('input[type="email"]').type(validUser.email);
        cy.get('input[type="password"]').type(validUser.password);

        // Submit button should now be enabled
        cy.get('button[type="submit"]').should('not.be.disabled');

        cy.screenshot('form-filled-ready');
    });

    it('should attempt login with valid credentials', () => {
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(2000);

        // Fill in credentials
        cy.get('input[type="email"]').clear().type(validUser.email);
        cy.get('input[type="password"]').clear().type(validUser.password);

        // Submit the form
        cy.get('button[type="submit"]').click();

        // Wait for potential redirect/response
        cy.wait(5000);

        // Take screenshot to see what happened
        cy.screenshot('after-login-attempt');

        // Check if we're still on login page or redirected
        cy.url().then((url) => {
            cy.log(`Current URL after login: ${url}`);
        });

        // Check page content for login result
        cy.get('body').then(($body) => {
            const text = $body.text();
            cy.log(`Page content includes: ${text.substring(0, 300)}...`);
        });
    });

    it('should test API login directly', () => {
        // Test the backend login endpoint directly
        cy.request({
            method: 'POST',
            url: `${backendUrl}/api/auth/login`,
            body: {
                email: validUser.email,
                password: validUser.password
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('token');
            expect(response.body).to.have.property('user');
            expect(response.body.user.email).to.eq(validUser.email);
            expect(response.body.user.name).to.eq(validUser.name);

            cy.log(`✅ API Login successful: ${response.body.user.name}`);
        });
    });

    it('should test invalid credentials show error', () => {
        cy.visit(`${frontendUrl}?view=login`);
        cy.wait(2000);

        // Try invalid credentials
        cy.get('input[type="email"]').clear().type('invalid@example.com');
        cy.get('input[type="password"]').clear().type('wrongpassword');

        // Submit
        cy.get('button[type="submit"]').click();

        // Wait for error
        cy.wait(3000);

        // Should show some kind of error indication
        cy.get('body').should('contain.text', 'error').or('contain.text', 'Invalid').or('contain.text', 'incorrect');

        cy.screenshot('invalid-credentials-error');
    });
});
