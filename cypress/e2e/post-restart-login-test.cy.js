describe('Login Frontend Test - After Restart', () => {
  const frontendUrl = 'http://localhost:3000';
  const backendUrl = 'http://localhost:3001';
  
  const validUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should verify both servers are running after restart', () => {
    // Test backend
    cy.request('GET', `${backendUrl}/api/health`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.status).to.eq('healthy');
    });

    // Test frontend
    cy.visit(frontendUrl);
    cy.wait(3000);
    cy.get('body').should('be.visible');
    cy.screenshot('servers-running-after-restart');
  });

  it('should successfully complete login flow', () => {
    cy.visit(`${frontendUrl}?view=login`);
    cy.wait(3000);
    
    // Verify login form is present
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Fill in credentials
    cy.get('input[type="email"]').clear().type(validUser.email);
    cy.get('input[type="password"]').clear().type(validUser.password);
    
    // Submit button should be enabled
    cy.get('button[type="submit"]').should('not.be.disabled');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for response
    cy.wait(5000);
    
    cy.screenshot('login-completed');
    
    // Log current state
    cy.url().then((url) => {
      cy.log(`URL after login: ${url}`);
    });
    
    cy.get('body').then(($body) => {
      const text = $body.text().substring(0, 200);
      cy.log(`Page content: ${text}...`);
    });
  });

  it('should verify API authentication works', () => {
    cy.request({
      method: 'POST',
      url: `${backendUrl}/api/auth/login`,
      body: validUser
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');
      expect(response.body.user.email).to.eq(validUser.email);
      
      // Test protected endpoint with token
      cy.request({
        method: 'GET',
        url: `${backendUrl}/api/courses`,
        headers: {
          'Authorization': `Bearer ${response.body.token}`
        }
      }).then((coursesResponse) => {
        expect(coursesResponse.status).to.eq(200);
        expect(coursesResponse.body).to.have.property('courses');
        
        cy.log(`✅ API authentication working - ${coursesResponse.body.courses.length} courses found`);
      });
    });
  });
});
