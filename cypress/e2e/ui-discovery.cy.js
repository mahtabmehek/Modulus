describe('UI Discovery - What buttons and elements exist', () => {
  it('should discover all elements on login page', () => {
    cy.visit('/')
    
    // Log all buttons on the page
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons on login page`)
      $buttons.each((index, button) => {
        cy.log(`Button ${index}: ${button.textContent} (id: ${button.id}, class: ${button.className})`)
      })
    })
    
    // Log all input fields
    cy.get('input').then($inputs => {
      cy.log(`Found ${$inputs.length} input fields`)
      $inputs.each((index, input) => {
        cy.log(`Input ${index}: type=${input.type}, placeholder="${input.placeholder}", name="${input.name}"`)
      })
    })
    
    // Log all links
    cy.get('a').then($links => {
      cy.log(`Found ${$links.length} links`)
      $links.each((index, link) => {
        cy.log(`Link ${index}: "${link.textContent}" -> ${link.href}`)
      })
    })
    
    // Take a screenshot
    cy.screenshot('login-page-discovery')
  })

  it('should login as admin and discover admin dashboard elements', () => {
    cy.visit('/')
    
    // Login as admin
    cy.get('input[type="email"]').type('admin@modulus.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button').contains('Sign In').click()
    
    // Wait for navigation
    cy.url().should('not.contain', '/login')
    cy.wait(2000)
    
    // Log the current URL
    cy.url().then(url => {
      cy.log(`Logged in admin redirected to: ${url}`)
    })
    
    // Discover all buttons available to admin
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons on admin dashboard`)
      $buttons.each((index, button) => {
        cy.log(`Admin Button ${index}: "${button.textContent}" (id: ${button.id}, class: ${button.className})`)
      })
    })
    
    // Discover navigation elements
    cy.get('nav').then($navs => {
      if ($navs.length > 0) {
        cy.log(`Found ${$navs.length} navigation elements`)
        cy.get('nav a, nav button').then($navItems => {
          $navItems.each((index, item) => {
            cy.log(`Nav Item ${index}: "${item.textContent}"`)
          })
        })
      }
    })
    
    // Look for any CRUD operation buttons (Create, Edit, Delete, etc.)
    const crudKeywords = ['create', 'add', 'new', 'edit', 'update', 'delete', 'remove', 'manage']
    crudKeywords.forEach(keyword => {
      cy.get('body').then($body => {
        const elementsWithKeyword = $body.find(`*:contains("${keyword}"):not(:has(*:contains("${keyword}")))`).filter((i, el) => {
          return el.textContent.toLowerCase().includes(keyword.toLowerCase())
        })
        if (elementsWithKeyword.length > 0) {
          cy.log(`Found ${elementsWithKeyword.length} elements containing "${keyword}":`)
          elementsWithKeyword.each((index, el) => {
            cy.log(`  ${el.tagName}: "${el.textContent}"`)
          })
        }
      })
    })
    
    // Take screenshot of admin dashboard
    cy.screenshot('admin-dashboard-discovery')
  })

  it('should login as student and discover student interface', () => {
    cy.visit('/')
    
    // Login as student
    cy.get('input[type="email"]').type('student@test.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button').contains('Sign In').click()
    
    // Wait for navigation
    cy.url().should('not.contain', '/login')
    cy.wait(2000)
    
    // Log the current URL
    cy.url().then(url => {
      cy.log(`Logged in student redirected to: ${url}`)
    })
    
    // Discover all buttons available to student
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons on student dashboard`)
      $buttons.each((index, button) => {
        cy.log(`Student Button ${index}: "${button.textContent}" (id: ${button.id}, class: ${button.className})`)
      })
    })
    
    // Look for course-related elements
    cy.get('body').then($body => {
      const courseElements = $body.find('*:contains("course"), *:contains("Course"), *:contains("lab"), *:contains("Lab")').filter((i, el) => {
        const text = el.textContent.toLowerCase()
        return (text.includes('course') || text.includes('lab')) && el.children.length === 0
      })
      if (courseElements.length > 0) {
        cy.log(`Found ${courseElements.length} course/lab related elements:`)
        courseElements.each((index, el) => {
          cy.log(`  ${el.tagName}: "${el.textContent}"`)
        })
      }
    })
    
    // Take screenshot of student dashboard
    cy.screenshot('student-dashboard-discovery')
  })

  it('should login as instructor and discover instructor interface', () => {
    cy.visit('/')
    
    // Login as instructor
    cy.get('input[type="email"]').type('instructor@test.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button').contains('Sign In').click()
    
    // Wait for navigation
    cy.url().should('not.contain', '/login')
    cy.wait(2000)
    
    // Log the current URL
    cy.url().then(url => {
      cy.log(`Logged in instructor redirected to: ${url}`)
    })
    
    // Discover all buttons available to instructor
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons on instructor dashboard`)
      $buttons.each((index, button) => {
        cy.log(`Instructor Button ${index}: "${button.textContent}" (id: ${button.id}, class: ${button.className})`)
      })
    })
    
    // Take screenshot of instructor dashboard
    cy.screenshot('instructor-dashboard-discovery')
  })
})
