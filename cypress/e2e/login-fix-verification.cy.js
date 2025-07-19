describe('Login Fix Verification', () => {
    const testUsers = [
        { email: 'admin@modulus.com', password: 'Mahtabmehek@1337', role: 'admin' },
        { email: 'student@test.com', password: 'Mahtabmehek@1337', role: 'student' },
        { email: 'instructor@test.com', password: 'Mahtabmehek@1337', role: 'instructor' },
        { email: 'staff@test.com', password: 'Mahtabmehek@1337', role: 'staff' }
    ];

    beforeEach(() => {
        cy.visit('http://localhost:3002');
        cy.clearLocalStorage();
    });

    testUsers.forEach((user) => {
        it(`should allow ${user.role} to login and access dashboard`, () => {
            // Wait for login form to be visible
            cy.get('[data-state="signin"]', { timeout: 10000 }).should('be.visible');

            // Fill in login form
            cy.get('input[name="email"]').type(user.email);
            cy.get('input[name="password"]').type(user.password);

            // Submit form
            cy.get('button[type="submit"]').click();

            // Wait for successful login and dashboard to appear
            cy.url({ timeout: 10000 }).should('not.include', 'login');

            // Verify dashboard elements based on role
            switch (user.role) {
                case 'admin':
                    cy.contains('Admin Dashboard', { timeout: 10000 }).should('be.visible');
                    cy.contains('User Management').should('be.visible');
                    cy.contains('Total Users').should('be.visible');
                    break;
                case 'student':
                    cy.contains('Student Dashboard', { timeout: 10000 }).should('be.visible');
                    cy.contains('My Courses').should('be.visible');
                    cy.contains('Browse Courses').should('be.visible');
                    break;
                case 'instructor':
                    cy.contains('Instructor Dashboard', { timeout: 10000 }).should('be.visible');
                    cy.contains('My Courses').should('be.visible');
                    cy.contains('My Labs').should('be.visible');
                    break;
                case 'staff':
                    cy.contains('Staff Dashboard', { timeout: 10000 }).should('be.visible');
                    cy.contains('User Management').should('be.visible');
                    break;
            }

            // Verify user can logout
            cy.get('button').contains('Sign Out').click();
            cy.contains('Sign in to your account', { timeout: 5000 }).should('be.visible');

            // Take screenshot for verification
            cy.screenshot(`login-success-${user.role}`);
        });
    });

    it('should show error for invalid credentials', () => {
        cy.get('[data-state="signin"]', { timeout: 10000 }).should('be.visible');

        cy.get('input[name="email"]').type('invalid@test.com');
        cy.get('input[name="password"]').type('wrongpassword');

        cy.get('button[type="submit"]').click();

        // Should show error message and stay on login page
        cy.contains('Sign in failed', { timeout: 5000 }).should('be.visible');
        cy.contains('Sign in to your account').should('be.visible');

        cy.screenshot('login-error-invalid-credentials');
    });

    it('should verify token persistence after refresh', () => {
        // Login as admin
        cy.get('[data-state="signin"]', { timeout: 10000 }).should('be.visible');
        cy.get('input[name="email"]').type('admin@modulus.com');
        cy.get('input[name="password"]').type('Mahtabmehek@1337');
        cy.get('button[type="submit"]').click();

        // Verify dashboard appears
        cy.contains('Admin Dashboard', { timeout: 10000 }).should('be.visible');

        // Refresh page
        cy.reload();

        // Should still be logged in
        cy.contains('Admin Dashboard', { timeout: 10000 }).should('be.visible');

        cy.screenshot('login-persistence-after-refresh');
    });
});
