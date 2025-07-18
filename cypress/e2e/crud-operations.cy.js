describe('Cross-Role CRUD Operations Tests', () => {
  
  describe('Course CRUD Operations', () => {
    it('Student should only have READ access to courses', () => {
      cy.loginAsStudent()
      cy.visit('/courses')
      
      // Can view courses
      cy.get('[data-testid="course-card"]').should('exist').and('be.visible')
      cy.get('[data-testid="course-details-button"]').should('exist').and('be.visible')
      
      // Cannot create, edit, or delete
      cy.get('[data-testid="create-course-button"]').should('not.exist')
      cy.get('[data-testid="edit-course-button"]').should('not.exist')
      cy.get('[data-testid="delete-course-button"]').should('not.exist')
    })

    it('Instructor should have CREATE and UPDATE access to courses', () => {
      cy.loginAsInstructor()
      cy.visit('/courses')
      
      // Can view and create courses
      cy.get('[data-testid="course-card"]').should('exist').and('be.visible')
      cy.get('[data-testid="create-course-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="edit-course-button"]').should('exist').and('be.visible')
      
      // Cannot delete (typically restricted)
      cy.get('[data-testid="delete-course-button"]').should('not.exist')
    })

    it('Admin should have full CRUD access to courses', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/courses')
      
      // Can perform all operations
      cy.get('[data-testid="course-card"]').should('exist').and('be.visible')
      cy.get('[data-testid="create-course-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="edit-course-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="delete-course-button"]').should('exist').and('be.visible')
    })
  })

  describe('User CRUD Operations', () => {
    it('Student should not have access to user management', () => {
      cy.loginAsStudent()
      
      // Should not be able to access user management
      cy.visit('/users', { failOnStatusCode: false })
      cy.contains('Access Denied').should('exist')
      
      // Navigation should not show user management
      cy.get('[data-testid="nav-users"]').should('not.exist')
    })

    it('Staff should have limited user management access', () => {
      cy.loginAsStaff()
      cy.visit('/users')
      
      // Can view and approve users
      cy.get('[data-testid="users-table"]').should('exist').and('be.visible')
      cy.get('[data-testid="approve-user-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="create-user-button"]').should('exist').and('be.visible')
      
      // Cannot delete users
      cy.get('[data-testid="delete-user-button"]').should('not.exist')
    })

    it('Admin should have full user CRUD access', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/users')
      
      // Can perform all user operations
      cy.get('[data-testid="users-table"]').should('exist').and('be.visible')
      cy.get('[data-testid="create-user-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="edit-user-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="delete-user-button"]').should('exist').and('be.visible')
    })
  })

  describe('Lab CRUD Operations', () => {
    it('Student should only be able to participate in labs', () => {
      cy.loginAsStudent()
      cy.visit('/labs')
      
      // Can view and start labs
      cy.get('[data-testid="lab-card"]').should('exist').and('be.visible')
      cy.get('[data-testid="start-lab-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="view-lab-button"]').should('exist').and('be.visible')
      
      // Cannot manage labs
      cy.get('[data-testid="create-lab-button"]').should('not.exist')
      cy.get('[data-testid="edit-lab-button"]').should('not.exist')
      cy.get('[data-testid="delete-lab-button"]').should('not.exist')
    })

    it('Instructor should be able to create and manage labs', () => {
      cy.loginAsInstructor()
      cy.visit('/labs')
      
      // Can create and edit labs
      cy.get('[data-testid="lab-card"]').should('exist').and('be.visible')
      cy.get('[data-testid="create-lab-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="edit-lab-button"]').should('exist').and('be.visible')
      
      // View submissions and grade
      cy.get('[data-testid="view-submissions-button"]').should('exist').and('be.visible')
    })

    it('Admin should have complete lab management capabilities', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/labs')
      
      // Full CRUD operations
      cy.get('[data-testid="lab-card"]').should('exist').and('be.visible')
      cy.get('[data-testid="create-lab-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="edit-lab-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="delete-lab-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="clone-lab-button"]').should('exist').and('be.visible')
    })
  })

  describe('Enrollment Management', () => {
    it('Student should be able to self-enroll in courses', () => {
      cy.loginAsStudent()
      cy.visit('/courses')
      
      // Can enroll in courses
      cy.get('[data-testid="enroll-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="unenroll-button"]').should('exist').and('be.visible')
      
      // Cannot manage other students
      cy.get('[data-testid="manage-enrollments"]').should('not.exist')
    })

    it('Instructor should manage enrollments for their courses', () => {
      cy.loginAsInstructor()
      cy.visit('/students')
      
      // Can manage student enrollments
      cy.get('[data-testid="enroll-student-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="remove-student-button"]').should('exist').and('be.visible')
      cy.get('[data-testid="bulk-enroll-button"]').should('exist').and('be.visible')
    })

    it('Admin should have system-wide enrollment management', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/enrollments')
      
      // Complete enrollment control
      cy.get('[data-testid="global-enrollment-table"]').should('exist').and('be.visible')
      cy.get('[data-testid="bulk-enrollment-actions"]').should('exist').and('be.visible')
      cy.get('[data-testid="transfer-enrollments"]').should('exist').and('be.visible')
    })
  })
})
