describe('Current Frontend Element Discovery', () => {
  it('should login and discover available elements for student', () => {
    cy.visit('/auth/login')
    
    // Log in as student
    cy.get('input[type="email"]').type('student@test.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button[type="submit"]').click()
    
    // Wait for redirect to dashboard or main page
    cy.url().should('not.include', '/auth/login')
    
    // Discover and log all buttons, links, and navigation elements
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons`)
      $buttons.each((index, button) => {
        const text = Cypress.$(button).text().trim()
        const id = Cypress.$(button).attr('id')
        const className = Cypress.$(button).attr('class')
        cy.log(`Button ${index}: "${text}" id="${id}" class="${className}"`)
      })
    })
    
    cy.get('a').then($links => {
      cy.log(`Found ${$links.length} links`)
      $links.each((index, link) => {
        const text = Cypress.$(link).text().trim()
        const href = Cypress.$(link).attr('href')
        cy.log(`Link ${index}: "${text}" href="${href}"`)
      })
    })
    
    cy.get('nav').then($navs => {
      cy.log(`Found ${$navs.length} navigation elements`)
      $navs.each((index, nav) => {
        const innerHTML = Cypress.$(nav).html()
        cy.log(`Nav ${index}: ${innerHTML}`)
      })
    })
  })
  
  it('should login and discover available elements for admin', () => {
    cy.visit('/auth/login')
    
    // Log in as admin
    cy.get('input[type="email"]').type('admin@test.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button[type="submit"]').click()
    
    // Wait for redirect to dashboard or main page
    cy.url().should('not.include', '/auth/login')
    
    // Take screenshot for visual reference
    cy.screenshot('admin-dashboard')
    
    // Discover and log all buttons, links, and navigation elements
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons`)
      $buttons.each((index, button) => {
        const text = Cypress.$(button).text().trim()
        const id = Cypress.$(button).attr('id')
        const className = Cypress.$(button).attr('class')
        cy.log(`Button ${index}: "${text}" id="${id}" class="${className}"`)
      })
    })
    
    cy.get('a').then($links => {
      cy.log(`Found ${$links.length} links`)
      $links.each((index, link) => {
        const text = Cypress.$(link).text().trim()
        const href = Cypress.$(link).attr('href')
        cy.log(`Link ${index}: "${text}" href="${href}"`)
      })
    })
    
    // Check what pages are available by trying different routes
    const routes = ['/dashboard', '/courses', '/labs', '/users', '/admin', '/profile']
    routes.forEach(route => {
      cy.visit(route)
      cy.url().then(url => {
        cy.log(`Route ${route} -> ${url}`)
      })
      cy.get('h1, h2, h3').then($headings => {
        const headings = Array.from($headings).map(h => Cypress.$(h).text().trim())
        cy.log(`Headings on ${route}: ${headings.join(', ')}`)
      })
    })
  })
})
