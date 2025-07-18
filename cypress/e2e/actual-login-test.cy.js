describe('Actual Login Test with LocalAuth', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3002';
  
  const testUsers = [
    { email: 'admin@localhost.dev', password: 'password123', role: 'admin', name: 'Admin User' },
    { email: 'student@localhost.dev', password: 'password123', role: 'student', name: 'Student User' },
    { email: 'instructor@localhost.dev', password: 'password123', role: 'instructor', name: 'Instructor User' },
    { email: 'staff@localhost.dev', password: 'password123', role: 'staff', name: 'Staff User' }
  ];

  beforeEach(() => {
    cy.visit(baseUrl);
    cy.clearLocalStorage();
  });

  it('should show the correct login form elements', () => {
    // Check that we're on the sign in tab
    cy.get('[data-state="signin"]').should('exist').and('be.visible');
    
    // Check for email input
    cy.get('#signin-email').should('exist').and('be.visible');
    
    // Check for password input
    cy.get('#signin-password').should('exist').and('be.visible');
    
    // Check for sign in button
    cy.get('button[type="submit"]').should('exist').and('be.visible');
  });

  testUsers.forEach((user) => {
    it(`should allow ${user.role} to login successfully`, () => {
      console.log(`Testing login for ${user.role}: ${user.email}`);
      
      // Make sure we're on sign in tab
      cy.get('[data-state="signin"]').click();
      
      // Fill in login form
      cy.get('#signin-email').clear().type(user.email);
      cy.get('#signin-password').clear().type(user.password);
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Wait for navigation and check for role-specific dashboard content
      cy.url().should('include', baseUrl);
      
      // Check for dashboard-specific content based on role
      switch (user.role) {
        case 'admin':
          cy.contains('Admin Dashboard', { timeout: 10000 }).should('be.visible');
          cy.contains('User Management').should('be.visible');
          break;
        case 'instructor':
          cy.contains('Instructor Dashboard', { timeout: 10000 }).should('be.visible');
          cy.contains('Course Management').should('be.visible');
          break;
        case 'student':
          cy.contains('Student Dashboard', { timeout: 10000 }).should('be.visible');
          cy.contains('My Courses').should('be.visible');
          break;
        case 'staff':
          cy.contains('Staff Dashboard', { timeout: 10000 }).should('be.visible');
          cy.contains('User Approval').should('be.visible');
          break;
      }
      
      // Verify user info is displayed
      cy.contains(user.name, { timeout: 5000 }).should('be.visible');
    });
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-state="signin"]').click();
    
    cy.get('#signin-email').type('invalid@email.com');
    cy.get('#signin-password').type('wrongpassword');
    
    cy.get('button[type="submit"]').click();
    
    // Should show error message
    cy.contains('Invalid credentials', { timeout: 5000 }).should('be.visible');
  });

  it('should switch between sign in and sign up tabs', () => {
    // Start on sign in
    cy.get('[data-state="signin"]').should('exist');
    
    // Switch to sign up
    cy.get('[data-state="signup"]').click();
    cy.get('#signup-email').should('be.visible');
    cy.get('#signup-first-name').should('be.visible');
    
    // Switch back to sign in
    cy.get('[data-state="signin"]').click();
    cy.get('#signin-email').should('be.visible');
  });

  it('should maintain authentication after page refresh', () => {
    // Login as admin
    cy.get('[data-state="signin"]').click();
    cy.get('#signin-email').type('admin@localhost.dev');
    cy.get('#signin-password').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Verify login
    cy.contains('Admin Dashboard', { timeout: 10000 }).should('be.visible');
    
    // Refresh page
    cy.reload();
    
    // Should still be logged in
    cy.contains('Admin Dashboard', { timeout: 10000 }).should('be.visible');
  });
});
