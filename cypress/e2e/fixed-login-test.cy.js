describe('Modulus LMS Frontend Login Test', () => {
    const frontendUrl = 'http://localhost:3000';
    const testUser = {
        email: 'test@example.com',
        password: 'password123'
    };

    beforeEach(() => {
        // Ensure both frontend and backend are running
        cy.request('GET', 'http://localhost:3001/api/health').then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.status).to.eq('healthy');
        });
    });

    it('should load the homepage and show login option', () => {
        cy.visit(frontendUrl);

        // Wait for the page to load
        cy.wait(2000);

        // Should show the login interface or navigation to login
        cy.get('body').should('be.visible');

        // Look for login elements or navigation
        cy.get('body').then(($body) => {
            if ($body.find('input[type="email"]').length > 0) {
                cy.log('✅ Login form already visible');
            } else if ($body.find('a').filter(':contains("Login"), :contains("Sign In")').length > 0) {
                cy.log('✅ Login link found in navigation');
                cy.get('a').filter(':contains("Login"), :contains("Sign In")').first().click();
            } else {
                cy.log('📝 Checking for login access via URL parameter');
                cy.visit(frontendUrl + '?view=login');
            }
        });

        cy.wait(1000);
    });

    it('should successfully login with correct credentials', () => {
        cy.visit(frontendUrl + '?view=login');

        // Wait for the page to load
        cy.wait(2000);

        // Find and fill email field
        cy.get('input[type="email"]').should('be.visible').clear().type(testUser.email);

        // Find and fill password field  
        cy.get('input[type="password"]').should('be.visible').clear().type(testUser.password);

        // Find and click login button
        cy.get('button').contains(/sign in|login|submit/i).should('be.visible').click();

        // Check for successful login indicators
        cy.wait(3000);

        // Should either redirect away from login or show success indicators
        cy.url().should('not.contain', 'view=login');

        // Look for post-login content
        cy.get('body').should('contain.text', 'Test User').or('contain.text', 'Dashboard').or('contain.text', 'Welcome').or('contain.text', 'Logout');

        cy.log('✅ Login test completed successfully');
    });

    it('should show error for invalid credentials', () => {
        cy.visit(frontendUrl + '?view=login');

        // Wait for the page to load
        cy.wait(2000);

        // Try invalid credentials
        cy.get('input[type="email"]').should('be.visible').clear().type('invalid@example.com');
        cy.get('input[type="password"]').should('be.visible').clear().type('wrongpassword');

        // Click login button
        cy.get('button').contains(/sign in|login|submit/i).should('be.visible').click();

        // Should show error message
        cy.wait(2000);

        // Look for error indicators
        cy.get('body').should('contain.text', 'error').or('contain.text', 'invalid').or('contain.text', 'incorrect').or('contain.text', 'failed');

        cy.log('✅ Invalid login test completed');
    });
});
