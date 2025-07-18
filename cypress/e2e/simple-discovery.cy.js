describe('Simple Login Flow Discovery', () => {
  it('should check what happens after each login and capture full page info', () => {
    const users = [
      { email: 'admin@modulus.com', password: 'Mahtabmehek@1337', role: 'admin' },
      { email: 'student@test.com', password: 'Mahtabmehek@1337', role: 'student' },
      { email: 'instructor@test.com', password: 'Mahtabmehek@1337', role: 'instructor' },
      { email: 'staff@test.com', password: 'Mahtabmehek@1337', role: 'staff' }
    ]
    
    users.forEach(user => {
      cy.visit('/')
      cy.wait(2000)
      
      // Login
      cy.get('input[type="email"]').clear().type(user.email)
      cy.get('input[type="password"]').clear().type(user.password)
      cy.get('button').contains('Sign In').click()
      
      // Wait and capture everything
      cy.wait(5000)
      
      // Log current URL
      cy.url().then(url => {
        cy.log(`${user.role.toUpperCase()} logged in, URL: ${url}`)
      })
      
      // Log page title
      cy.title().then(title => {
        cy.log(`${user.role.toUpperCase()} page title: ${title}`)
      })
      
      // Log entire body content (text only)
      cy.get('body').then($body => {
        const text = $body.text().trim()
        cy.log(`${user.role.toUpperCase()} page text (first 500 chars): ${text.substring(0, 500)}`)
      })
      
      // Count ALL elements on page
      cy.document().then(doc => {
        const allElements = doc.querySelectorAll('*')
        const buttons = doc.querySelectorAll('button')
        const inputs = doc.querySelectorAll('input')
        const links = doc.querySelectorAll('a')
        const forms = doc.querySelectorAll('form')
        const divs = doc.querySelectorAll('div')
        
        cy.log(`${user.role.toUpperCase()} page elements:`)
        cy.log(`  Total elements: ${allElements.length}`)
        cy.log(`  Buttons: ${buttons.length}`)
        cy.log(`  Inputs: ${inputs.length}`)
        cy.log(`  Links: ${links.length}`)
        cy.log(`  Forms: ${forms.length}`)
        cy.log(`  Divs: ${divs.length}`)
        
        // Log visible text of all buttons if any exist
        if (buttons.length > 0) {
          cy.log(`${user.role.toUpperCase()} buttons found:`)
          buttons.forEach((btn, index) => {
            cy.log(`  Button ${index}: "${btn.textContent.trim()}" (visible: ${getComputedStyle(btn).display !== 'none'})`)
          })
        }
        
        // Log all headings
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
        if (headings.length > 0) {
          cy.log(`${user.role.toUpperCase()} headings:`)
          headings.forEach((h, index) => {
            cy.log(`  ${h.tagName}: "${h.textContent.trim()}"`)
          })
        }
      })
      
      // Take screenshot
      cy.screenshot(`${user.role}-post-login-full-page`)
      
      // Try to interact with any visible elements
      cy.document().then(doc => {
        const clickableElements = doc.querySelectorAll('button:not([disabled]), a[href], [onclick]')
        cy.log(`${user.role.toUpperCase()} clickable elements: ${clickableElements.length}`)
        
        if (clickableElements.length > 0) {
          cy.log(`${user.role.toUpperCase()} clickable elements:`)
          clickableElements.forEach((el, index) => {
            const tag = el.tagName
            const text = el.textContent.trim()
            const href = el.href || 'no href'
            cy.log(`  ${tag} ${index}: "${text}" -> ${href}`)
          })
        }
      })
      
      // Wait before next user
      cy.wait(1000)
    })
  })
  
  it('should test direct API access to see available data', () => {
    // Test API endpoints to see what data exists
    const endpoints = [
      '/api/courses',
      '/api/labs', 
      '/api/auth/me',
      '/api/users',
      '/api/health'
    ]
    
    endpoints.forEach(endpoint => {
      cy.request({
        method: 'GET',
        url: `http://localhost:3001${endpoint}`,
        failOnStatusCode: false
      }).then(response => {
        cy.log(`API ${endpoint}:`)
        cy.log(`  Status: ${response.status}`)
        if (response.body) {
          cy.log(`  Response: ${JSON.stringify(response.body).substring(0, 200)}...`)
          if (response.body.data && Array.isArray(response.body.data)) {
            cy.log(`  Data count: ${response.body.data.length}`)
          }
        }
      })
    })
  })
})
