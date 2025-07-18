describe('Actual CRUD Operations Available', () => {
  const users = [
    { email: 'student@test.com', password: 'Mahtabmehek@1337', role: 'student' },
    { email: 'instructor@test.com', password: 'Mahtabmehek@1337', role: 'instructor' },
    { email: 'staff@test.com', password: 'Mahtabmehek@1337', role: 'staff' },
    { email: 'admin@test.com', password: 'Mahtabmehek@1337', role: 'admin' }
  ]

  users.forEach(user => {
    describe(`${user.role.toUpperCase()} User Capabilities`, () => {
      beforeEach(() => {
        cy.visit('/auth/login')
        cy.get('input[type="email"]').type(user.email)
        cy.get('input[type="password"]').type(user.password)
        cy.get('button[type="submit"]').click()
        cy.url().should('not.include', '/auth/login')
      })

      it(`should identify available buttons and actions for ${user.role}`, () => {
        // Take a screenshot for visual reference
        cy.screenshot(`${user.role}-main-page`)
        
        // Log all visible buttons with their text
        cy.get('button:visible').then($buttons => {
          const buttonTexts = Array.from($buttons).map(btn => Cypress.$(btn).text().trim()).filter(text => text.length > 0)
          cy.log(`${user.role} can see buttons: ${buttonTexts.join(', ')}`)
        })

        // Log all navigation links
        cy.get('nav a:visible, header a:visible').then($links => {
          const linkTexts = Array.from($links).map(link => Cypress.$(link).text().trim()).filter(text => text.length > 0)
          cy.log(`${user.role} can navigate to: ${linkTexts.join(', ')}`)
        })

        // Check for CRUD indicators
        const crudWords = ['create', 'add', 'new', 'edit', 'update', 'delete', 'remove', 'manage']
        cy.get('body').then($body => {
          const bodyText = $body.text().toLowerCase()
          const foundCrudActions = crudWords.filter(word => bodyText.includes(word))
          cy.log(`${user.role} page contains CRUD words: ${foundCrudActions.join(', ')}`)
        })
      })

      it(`should test navigation capabilities for ${user.role}`, () => {
        const commonRoutes = ['/dashboard', '/courses', '/labs', '/profile']
        const adminRoutes = ['/admin', '/users', '/system']
        const routes = user.role === 'admin' ? [...commonRoutes, ...adminRoutes] : commonRoutes

        routes.forEach(route => {
          cy.visit(route, { failOnStatusCode: false })
          cy.url().then(currentUrl => {
            if (currentUrl.includes(route)) {
              cy.log(`${user.role} CAN access ${route}`)
              
              // Count actionable elements on this page
              cy.get('button:visible, input[type="submit"]:visible, a[href]:visible').then($elements => {
                cy.log(`${route} has ${$elements.length} actionable elements for ${user.role}`)
              })
            } else {
              cy.log(`${user.role} CANNOT access ${route} (redirected to ${currentUrl})`)
            }
          })
        })
      })

      it(`should identify form capabilities for ${user.role}`, () => {
        // Check what forms are available
        cy.get('form').then($forms => {
          cy.log(`${user.role} has access to ${$forms.length} forms`)
          
          $forms.each((index, form) => {
            const $form = Cypress.$(form)
            const action = $form.attr('action') || 'no action'
            const method = $form.attr('method') || 'GET'
            const inputs = $form.find('input, select, textarea').length
            cy.log(`Form ${index}: method=${method}, action=${action}, inputs=${inputs}`)
          })
        })

        // Check for data tables (often indicate CRUD operations)
        cy.get('table, .table, [class*="table"]').then($tables => {
          if ($tables.length > 0) {
            cy.log(`${user.role} can see ${$tables.length} data tables`)
            
            $tables.each((index, table) => {
              const $table = Cypress.$(table)
              const rows = $table.find('tr').length
              const actionButtons = $table.find('button, a[href]').length
              cy.log(`Table ${index}: ${rows} rows, ${actionButtons} action buttons`)
            })
          } else {
            cy.log(`${user.role} has no data tables visible`)
          }
        })
      })
    })
  })
})
