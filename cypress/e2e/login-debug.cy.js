describe('Login Debug Test', () => {
  it('should debug what happens after login', () => {
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
    
    // Wait a bit and take screenshot of what happens
    cy.wait(3000);
    cy.screenshot('debug-after-submit');
    
    // Check what's actually on the page
    cy.get('body').then(($body) => {
      cy.log('Page body HTML:', $body.html());
    });
    
    // Try to find any dashboard-related text
    cy.contains('Dashboard', { timeout: 2000 }).should('exist').then(() => {
      cy.log('Found Dashboard text');
    }).catch(() => {
      cy.log('No Dashboard text found');
    });
    
    // Check if we're still on login page
    cy.get('input[name="email"]').should('not.exist').then(() => {
      cy.log('Successfully left login page');
    }).catch(() => {
      cy.log('Still on login page - login may have failed');
      cy.screenshot('debug-still-on-login');
    });
  });
});
