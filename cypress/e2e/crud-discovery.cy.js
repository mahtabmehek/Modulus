describe('CRUD Operations Discovery - What actions are available per user role', () => {
  
  const logAllElements = (context) => {
    // Log all interactive elements without failing if they don't exist
    cy.get('body').within(() => {
      
      // Check for buttons
      cy.get('button').then($buttons => {
        if ($buttons.length > 0) {
          cy.log(`=== ${context} - Found ${$buttons.length} BUTTONS ===`)
          $buttons.each((index, button) => {
            const text = button.textContent.trim()
            const classes = button.className
            const id = button.id
            cy.log(`  Button ${index}: "${text}" (id: ${id}, classes: ${classes})`)
          })
        } else {
          cy.log(`=== ${context} - No buttons found ===`)
        }
      })
      
      // Check for links
      cy.document().then(doc => {
        const links = doc.querySelectorAll('a')
        if (links.length > 0) {
          cy.log(`=== ${context} - Found ${links.length} LINKS ===`)
          links.forEach((link, index) => {
            cy.log(`  Link ${index}: "${link.textContent.trim()}" -> ${link.href}`)
          })
        } else {
          cy.log(`=== ${context} - No links found ===`)
        }
      })
      
      // Check for forms
      cy.document().then(doc => {
        const forms = doc.querySelectorAll('form')
        if (forms.length > 0) {
          cy.log(`=== ${context} - Found ${forms.length} FORMS ===`)
          forms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input, select, textarea')
            cy.log(`  Form ${index}: ${inputs.length} inputs`)
            inputs.forEach((input, inputIndex) => {
              cy.log(`    Input ${inputIndex}: type=${input.type}, name=${input.name}, placeholder="${input.placeholder}"`)
            })
          })
        } else {
          cy.log(`=== ${context} - No forms found ===`)
        }
      })
      
      // Look for any elements containing CRUD keywords
      const crudKeywords = ['create', 'add', 'new', 'edit', 'update', 'delete', 'remove', 'manage', 'view', 'list']
      cy.document().then(doc => {
        cy.log(`=== ${context} - CRUD OPERATIONS DISCOVERY ===`)
        crudKeywords.forEach(keyword => {
          const elements = doc.querySelectorAll('*')
          const matches = []
          elements.forEach(el => {
            const text = el.textContent
            if (text && text.toLowerCase().includes(keyword.toLowerCase()) && el.children.length === 0) {
              matches.push(`${el.tagName}: "${text.trim()}"`)
            }
          })
          if (matches.length > 0) {
            cy.log(`  "${keyword.toUpperCase()}" operations found:`)
            matches.slice(0, 5).forEach(match => cy.log(`    ${match}`)) // Limit to 5 to avoid spam
          }
        })
      })
      
      // Check for navigation or menu structures
      cy.document().then(doc => {
        const navElements = doc.querySelectorAll('nav, .nav, .menu, .navigation, [role="navigation"]')
        if (navElements.length > 0) {
          cy.log(`=== ${context} - Found ${navElements.length} NAVIGATION elements ===`)
          navElements.forEach((nav, index) => {
            const navItems = nav.querySelectorAll('a, button, li')
            cy.log(`  Nav ${index}: ${navItems.length} items`)
            navItems.forEach((item, itemIndex) => {
              cy.log(`    Nav Item ${itemIndex}: "${item.textContent.trim()}"`)
            })
          })
        } else {
          cy.log(`=== ${context} - No navigation elements found ===`)
        }
      })
    })
  }

  it('should discover login page elements and capabilities', () => {
    cy.visit('/')
    cy.wait(1000)
    
    logAllElements('LOGIN PAGE')
    cy.screenshot('login-page-elements')
  })

  it('should discover admin dashboard CRUD capabilities', () => {
    cy.visit('/')
    
    // Login as admin
    cy.get('input[type="email"]').type('admin@modulus.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button').contains('Sign In').click()
    
    // Wait for page to load
    cy.wait(3000)
    cy.url().then(url => cy.log(`Admin redirected to: ${url}`))
    
    logAllElements('ADMIN DASHBOARD')
    cy.screenshot('admin-dashboard-elements')
    
    // Try to navigate to common admin pages
    const adminPaths = ['/admin', '/dashboard', '/courses', '/users', '/labs', '/settings']
    adminPaths.forEach(path => {
      cy.visit(path, { failOnStatusCode: false })
      cy.wait(1000)
      cy.url().then(url => {
        if (url.includes(path)) {
          cy.log(`Successfully accessed ${path}`)
          logAllElements(`ADMIN - ${path.toUpperCase()}`)
          cy.screenshot(`admin-${path.replace('/', '')}-page`)
        } else {
          cy.log(`Could not access ${path} - redirected to ${url}`)
        }
      })
    })
  })

  it('should discover student dashboard CRUD capabilities', () => {
    cy.visit('/')
    
    // Login as student
    cy.get('input[type="email"]').type('student@test.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button').contains('Sign In').click()
    
    // Wait for page to load
    cy.wait(3000)
    cy.url().then(url => cy.log(`Student redirected to: ${url}`))
    
    logAllElements('STUDENT DASHBOARD')
    cy.screenshot('student-dashboard-elements')
    
    // Try to navigate to common student pages
    const studentPaths = ['/courses', '/labs', '/progress', '/profile']
    studentPaths.forEach(path => {
      cy.visit(path, { failOnStatusCode: false })
      cy.wait(1000)
      cy.url().then(url => {
        if (url.includes(path)) {
          cy.log(`Successfully accessed ${path}`)
          logAllElements(`STUDENT - ${path.toUpperCase()}`)
          cy.screenshot(`student-${path.replace('/', '')}-page`)
        } else {
          cy.log(`Could not access ${path} - redirected to ${url}`)
        }
      })
    })
  })

  it('should discover instructor dashboard CRUD capabilities', () => {
    cy.visit('/')
    
    // Login as instructor
    cy.get('input[type="email"]').type('instructor@test.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button').contains('Sign In').click()
    
    // Wait for page to load
    cy.wait(3000)
    cy.url().then(url => cy.log(`Instructor redirected to: ${url}`))
    
    logAllElements('INSTRUCTOR DASHBOARD')
    cy.screenshot('instructor-dashboard-elements')
    
    // Try to navigate to common instructor pages
    const instructorPaths = ['/courses', '/labs', '/students', '/grades', '/create']
    instructorPaths.forEach(path => {
      cy.visit(path, { failOnStatusCode: false })
      cy.wait(1000)
      cy.url().then(url => {
        if (url.includes(path)) {
          cy.log(`Successfully accessed ${path}`)
          logAllElements(`INSTRUCTOR - ${path.toUpperCase()}`)
          cy.screenshot(`instructor-${path.replace('/', '')}-page`)
        } else {
          cy.log(`Could not access ${path} - redirected to ${url}`)
        }
      })
    })
  })

  it('should test actual CRUD operations for each role', () => {
    // Test admin CRUD operations
    cy.visit('/')
    cy.get('input[type="email"]').type('admin@modulus.com')
    cy.get('input[type="password"]').type('Mahtabmehek@1337')
    cy.get('button').contains('Sign In').click()
    cy.wait(3000)
    
    cy.log('=== TESTING ADMIN CRUD OPERATIONS ===')
    
    // Look for Create operations
    cy.document().then(doc => {
      const createButtons = doc.querySelectorAll('button, a')
      const createOps = []
      createButtons.forEach(btn => {
        const text = btn.textContent.toLowerCase()
        if (text.includes('create') || text.includes('add') || text.includes('new')) {
          createOps.push(`${btn.tagName}: "${btn.textContent.trim()}"`)
        }
      })
      if (createOps.length > 0) {
        cy.log('ADMIN CREATE operations available:')
        createOps.forEach(op => cy.log(`  ${op}`))
      } else {
        cy.log('No CREATE operations found for admin')
      }
    })
    
    // Test if we can access API endpoints directly
    cy.request({
      method: 'GET',
      url: '/api/courses',
      failOnStatusCode: false
    }).then(response => {
      cy.log(`GET /api/courses status: ${response.status}`)
      if (response.status === 200) {
        cy.log(`Found ${response.body.data ? response.body.data.length : 'unknown'} courses`)
      }
    })
    
    cy.request({
      method: 'GET',
      url: '/api/labs',
      failOnStatusCode: false
    }).then(response => {
      cy.log(`GET /api/labs status: ${response.status}`)
      if (response.status === 200) {
        cy.log(`Found ${response.body.data ? response.body.data.length : 'unknown'} labs`)
      }
    })
  })
})
