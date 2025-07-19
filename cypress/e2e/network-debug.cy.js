describe('Login Network Debug', () => {
    it('should intercept and log login API calls', () => {
        // Intercept all API calls to localhost:3001
        cy.intercept('POST', '**/api/auth/login', (req) => {
            console.log('Login API request intercepted:', req.body);
            req.reply((res) => {
                console.log('Login API response:', res.body);
                return res;
            });
        }).as('loginAPI');

        cy.visit('http://localhost:3002');
        cy.clearLocalStorage();

        // Take screenshot of initial page
        cy.screenshot('network-debug-initial');

        // Wait for login form
        cy.get('[data-state="signin"]', { timeout: 10000 }).should('be.visible');

        // Fill in login form
        cy.get('input[name="email"]').type('admin@modulus.com');
        cy.get('input[name="password"]').type('Mahtabmehek@1337');

        // Submit form
        cy.get('button[type="submit"]').click();

        // Wait for API call
        cy.wait('@loginAPI', { timeout: 10000 }).then((interception) => {
            console.log('Login API call details:', {
                request: interception.request,
                response: interception.response
            });

            // Check if the response was successful
            expect(interception.response.statusCode).to.be.oneOf([200, 201]);

            // Take screenshot after API response
            cy.screenshot('network-debug-after-api-response');
        });

        // Wait a bit more to see what happens
        cy.wait(3000);
        cy.screenshot('network-debug-final-state');
    });
});
