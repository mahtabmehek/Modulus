describe('Simple Login Debug', () => {
    it('should check what happens after login attempt', () => {
        cy.visit('http://localhost:3002');
        cy.clearLocalStorage();

        // Take screenshot of initial page
        cy.screenshot('debug-initial-page');

        // Wait for and verify login form
        cy.get('[data-state="signin"]', { timeout: 10000 }).should('be.visible');

        // Fill in login form
        cy.get('input[name="email"]').type('admin@modulus.com');
        cy.get('input[name="password"]').type('Mahtabmehek@1337');

        // Take screenshot before clicking submit
        cy.screenshot('debug-before-submit');

        // Submit form
        cy.get('button[type="submit"]').click();

        // Wait a bit for the response
        cy.wait(5000);

        // Take screenshot of what happens after submit
        cy.screenshot('debug-after-submit');

        // Check what's currently on the page by looking for different possible elements
        cy.get('body').should('exist');

        // Check if we're still on login page
        cy.get('body').then(($body) => {
            if ($body.find('input[name="email"]').length > 0) {
                cy.log('Still on login page');
                cy.screenshot('debug-still-on-login-page');
            } else {
                cy.log('Left login page successfully');
                cy.screenshot('debug-left-login-page');
            }
        });
    });
});
