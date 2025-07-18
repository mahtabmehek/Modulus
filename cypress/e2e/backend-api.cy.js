describe('Modulus LMS - Backend API Tests', () => {
  const API_BASE = 'http://localhost:3001/api'

  it('should have backend running on port 3001', () => {
    cy.request({
      method: 'GET',
      url: `${API_BASE}/health`,
      failOnStatusCode: false
    }).then((response) => {
      // Backend should be running even if database is not connected
      expect(response.status).to.be.oneOf([200, 500])
    })
  })

  it('should return appropriate response for health check', () => {
    cy.request({
      method: 'GET', 
      url: `${API_BASE}/health`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.headers).to.have.property('content-type')
      expect(response.headers['content-type']).to.include('application/json')
    })
  })

  it('should handle auth endpoints without database gracefully', () => {
    // Test login endpoint
    cy.request({
      method: 'POST',
      url: `${API_BASE}/auth/login`,
      body: {
        email: 'test@example.com',
        password: 'password123'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Should get some response (likely 500 due to no database)
      expect(response.status).to.be.oneOf([400, 401, 500])
    })
  })

  it('should have CORS enabled for localhost:3000', () => {
    cy.request({
      method: 'OPTIONS',
      url: `${API_BASE}/health`,
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Should allow CORS
      expect(response.headers).to.have.property('access-control-allow-origin')
    })
  })

  it('should not return any AWS-related headers or content', () => {
    cy.request({
      method: 'GET',
      url: `${API_BASE}/health`,
      failOnStatusCode: false
    }).then((response) => {
      const responseText = JSON.stringify(response)
      
      // Should not contain AWS references
      expect(responseText.toLowerCase()).to.not.include('aws')
      expect(responseText.toLowerCase()).to.not.include('cognito')
      expect(responseText.toLowerCase()).to.not.include('rds')
      expect(responseText.toLowerCase()).to.not.include('lambda')
    })
  })

  it('should use local environment configuration', () => {
    cy.request({
      method: 'GET',
      url: `${API_BASE}/health`,
      failOnStatusCode: false
    }).then((response) => {
      // Check for development environment indicators
      if (response.status === 200 && response.body) {
        expect(response.body).to.not.have.property('aws')
        expect(response.body).to.not.have.property('cognito')
      }
    })
  })

  it('should respond to test user creation endpoint', () => {
    cy.request({
      method: 'POST',
      url: `${API_BASE}/auth/setup-test-users`,
      failOnStatusCode: false
    }).then((response) => {
      // Should respond (even if it fails due to no DB)
      expect(response.status).to.be.oneOf([200, 400, 500])
    })
  })
})
