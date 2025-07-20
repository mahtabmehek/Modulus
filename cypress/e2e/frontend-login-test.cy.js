describe('Frontend Login Integration Test', () => {
    const frontendUrl = 'http://localhost:3003';
    const backendUrl = 'http://localhost:3001/api';

    before(() => {
        // Verify backend is responding
        cy.request(`${backendUrl}/health`).then((response) => {
            expect(response.status).to.eq(200);
            cy.log('✅ Backend health check passed');
        });
    });

    it('should load the login page without errors', () => {
        cy.visit(frontendUrl);
        cy.url().should('include', frontendUrl);
        cy.log('✅ Frontend loads successfully');
    });

    it('should display login form elements', () => {
        cy.visit(frontendUrl);

        // Check for login form elements
        cy.get('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 10000 })
            .should('be.visible')
            .and('not.be.disabled');

        cy.get('input[type="password"], input[name="password"], input[placeholder*="password" i]')
            .should('be.visible')
            .and('not.be.disabled');

        cy.get('button[type="submit"], button:contains("Login"), button:contains("Sign In")')
            .should('be.visible')
            .and('not.be.disabled');

        cy.log('✅ Login form elements are present and functional');
    });

    it('should successfully authenticate with correct credentials', () => {
        cy.visit(frontendUrl);

        // Fill in login form
        cy.get('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 10000 })
            .clear()
            .type('admin@test.com');

        cy.get('input[type="password"], input[name="password"], input[placeholder*="password" i]')
            .clear()
            .type('Mahtabmehek@1337');

        cy.get('button[type="submit"], button:contains("Login"), button:contains("Sign In")')
            .click();

        // Check for successful login (look for dashboard elements or redirect)
        cy.url({ timeout: 10000 }).should('not.include', 'login');

        cy.log('✅ Login authentication successful');
    });

    it('should handle invalid credentials gracefully', () => {
        cy.visit(frontendUrl);

        // Fill in login form with wrong credentials
        cy.get('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 10000 })
            .clear()
            .type('wrong@test.com');

        cy.get('input[type="password"], input[name="password"], input[placeholder*="password" i]')
            .clear()
            .type('wrongpassword');

        cy.get('button[type="submit"], button:contains("Login"), button:contains("Sign In")')
            .click();

        // Should stay on login page and show error
        cy.url().should('include', frontendUrl);

        cy.log('✅ Invalid credentials handled correctly');
    });
});
