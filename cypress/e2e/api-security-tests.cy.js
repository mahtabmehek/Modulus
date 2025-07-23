/// <reference types="cypress" />

/**
 * API Security & Role-Based Access Control Tests
 * 
 * Tests JWT validation, role permissions, and endpoint security
 */

describe('API Security & Role-Based Access Tests', () => {
    const baseApiUrl = 'http://localhost:3001/api'
    let authTokens = {}

    before(() => {
        // Get authentication tokens for all roles
        const roles = [
            { email: 'admin@test.com', password: 'Mahtabmehek@1337', role: 'admin' },
            { email: 'staff@test.com', password: 'Mahtabmehek@1337', role: 'staff' },
            { email: 'instructor@test.com', password: 'Mahtabmehek@1337', role: 'instructor' },
            { email: 'student@test.com', password: 'Mahtabmehek@1337', role: 'student' }
        ]

        roles.forEach(({ email, password, role }) => {
            cy.request({
                method: 'POST',
                url: `${baseApiUrl}/auth/login`,
                body: { email, password }
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('token')
                authTokens[role] = response.body.token
                cy.log(`✅ Obtained ${role} token: ${response.body.token.substring(0, 20)}...`)
            })
        })
    })

    context('JWT Token Validation', () => {
        it('should reject requests with invalid JWT tokens', () => {
            const invalidTokens = [
                'invalid.token.here',
                'Bearer invalid.token.here',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
                ''
            ]

            invalidTokens.forEach(invalidToken => {
                cy.request({
                    method: 'GET',
                    url: `${baseApiUrl}/users/profile`,
                    headers: { Authorization: `Bearer ${invalidToken}` },
                    failOnStatusCode: false
                }).then((response) => {
                    expect([401, 403]).to.include(response.status)
                    cy.log(`✅ Invalid token rejected: ${response.status}`)
                })
            })
        })

        it('should reject requests with expired JWT tokens', () => {
            // Mock an expired token (this would need to be generated with past expiry)
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.expired'

            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/users/profile`,
                headers: { Authorization: `Bearer ${expiredToken}` },
                failOnStatusCode: false
            }).then((response) => {
                expect([401, 403]).to.include(response.status)
                cy.log(`✅ Expired token rejected: ${response.status}`)
            })
        })

        it('should accept valid JWT tokens', () => {
            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/users/profile`,
                headers: { Authorization: `Bearer ${authTokens.admin}` }
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('id')
                cy.log(`✅ Valid token accepted: ${response.status}`)
            })
        })
    })

    context('Role-Based API Access Control', () => {
        const endpoints = [
            // Admin-only endpoints
            { path: '/users', method: 'GET', allowedRoles: ['admin'], description: 'Get all users' },
            { path: '/users', method: 'POST', allowedRoles: ['admin', 'staff'], description: 'Create user' },
            { path: '/admin/stats', method: 'GET', allowedRoles: ['admin'], description: 'System stats' },

            // Staff/Admin endpoints
            { path: '/users/pending', method: 'GET', allowedRoles: ['admin', 'staff'], description: 'Pending approvals' },
            { path: '/courses', method: 'POST', allowedRoles: ['admin', 'staff'], description: 'Create course' },

            // Instructor endpoints
            { path: '/labs', method: 'GET', allowedRoles: ['admin', 'staff', 'instructor', 'student'], description: 'View labs' },
            { path: '/labs', method: 'POST', allowedRoles: ['admin', 'staff', 'instructor'], description: 'Create lab' },

            // Public/authenticated endpoints
            { path: '/courses', method: 'GET', allowedRoles: ['admin', 'staff', 'instructor', 'student'], description: 'View courses' },
            { path: '/users/profile', method: 'GET', allowedRoles: ['admin', 'staff', 'instructor', 'student'], description: 'Get profile' }
        ]

        endpoints.forEach(({ path, method, allowedRoles, description }) => {
            it(`should enforce access control for ${method} ${path} (${description})`, () => {
                const allRoles = ['admin', 'staff', 'instructor', 'student']

                allRoles.forEach(role => {
                    const shouldHaveAccess = allowedRoles.includes(role)

                    cy.request({
                        method,
                        url: `${baseApiUrl}${path}`,
                        headers: { Authorization: `Bearer ${authTokens[role]}` },
                        failOnStatusCode: false,
                        body: method === 'POST' ? { title: 'Test', description: 'Test' } : undefined
                    }).then((response) => {
                        if (shouldHaveAccess) {
                            expect([200, 201]).to.include(response.status,
                                `${role} should have access to ${method} ${path}`)
                            cy.log(`✅ ${role} correctly granted access to ${path}`)
                        } else {
                            expect([401, 403]).to.include(response.status,
                                `${role} should NOT have access to ${method} ${path}`)
                            cy.log(`✅ ${role} correctly denied access to ${path}`)
                        }
                    })
                })
            })
        })

        it('should prevent privilege escalation attempts', () => {
            // Try to access admin endpoints with lower privilege tokens
            const privilegeTests = [
                { role: 'student', endpoint: '/users', expectedStatus: [401, 403] },
                { role: 'instructor', endpoint: '/admin/stats', expectedStatus: [401, 403] },
                { role: 'staff', endpoint: '/admin/system', expectedStatus: [401, 403] }
            ]

            privilegeTests.forEach(({ role, endpoint, expectedStatus }) => {
                cy.request({
                    method: 'GET',
                    url: `${baseApiUrl}${endpoint}`,
                    headers: { Authorization: `Bearer ${authTokens[role]}` },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(expectedStatus).to.include(response.status)
                    cy.log(`✅ ${role} correctly blocked from ${endpoint}`)
                })
            })
        })
    })

    context('Database Connectivity Tests', () => {
        it('should verify database connection through API', () => {
            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/health`,
                headers: { Authorization: `Bearer ${authTokens.admin}` }
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('status', 'healthy')
                cy.log('✅ Database connectivity verified')
            })
        })

        it('should handle database query errors gracefully', () => {
            // Test with malformed requests that might cause DB errors
            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/users/999999999`,
                headers: { Authorization: `Bearer ${authTokens.admin}` },
                failOnStatusCode: false
            }).then((response) => {
                expect([404, 400]).to.include(response.status)
                expect(response.body).to.have.property('error')
                cy.log('✅ Database errors handled gracefully')
            })
        })

        it('should maintain data integrity in concurrent requests', () => {
            // Make multiple simultaneous requests
            const requests = Array.from({ length: 5 }, (_, i) =>
                cy.request({
                    method: 'GET',
                    url: `${baseApiUrl}/courses`,
                    headers: { Authorization: `Bearer ${authTokens.instructor}` }
                })
            )

            Cypress.Promise.all(requests).then((responses) => {
                responses.forEach((response, index) => {
                    expect(response.status).to.eq(200)
                    expect(response.body).to.have.property('courses')
                    cy.log(`✅ Concurrent request ${index + 1} successful`)
                })
            })
        })
    })

    context('REST API Endpoint Testing', () => {
        it('should return proper HTTP status codes', () => {
            const statusTests = [
                { method: 'GET', path: '/courses', expectedStatus: 200, description: 'Successful GET' },
                { method: 'POST', path: '/courses', body: { title: 'Test Course', code: 'TEST001' }, expectedStatus: [201, 200], description: 'Successful POST' },
                { method: 'GET', path: '/nonexistent', expectedStatus: 404, description: 'Not Found' },
                { method: 'POST', path: '/courses', body: {}, expectedStatus: [400, 422], description: 'Bad Request' }
            ]

            statusTests.forEach(({ method, path, body, expectedStatus, description }) => {
                cy.request({
                    method,
                    url: `${baseApiUrl}${path}`,
                    headers: { Authorization: `Bearer ${authTokens.admin}` },
                    body,
                    failOnStatusCode: false
                }).then((response) => {
                    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]
                    expect(expected).to.include(response.status)
                    cy.log(`✅ ${description}: ${response.status}`)
                })
            })
        })

        it('should return proper Content-Type headers', () => {
            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/courses`,
                headers: { Authorization: `Bearer ${authTokens.admin}` }
            }).then((response) => {
                expect(response.headers).to.have.property('content-type')
                expect(response.headers['content-type']).to.include('application/json')
                cy.log('✅ Proper Content-Type header returned')
            })
        })

        it('should validate request body schemas', () => {
            // Test invalid request bodies
            const invalidBodies = [
                { title: 123 }, // Invalid type
                { title: '' }, // Empty required field
                { invalid_field: 'test' } // Unknown field
            ]

            invalidBodies.forEach((invalidBody, index) => {
                cy.request({
                    method: 'POST',
                    url: `${baseApiUrl}/courses`,
                    headers: { Authorization: `Bearer ${authTokens.admin}` },
                    body: invalidBody,
                    failOnStatusCode: false
                }).then((response) => {
                    expect([400, 422]).to.include(response.status)
                    cy.log(`✅ Invalid body ${index + 1} properly rejected`)
                })
            })
        })
    })

    after(() => {
        cy.log('=== API SECURITY TESTING COMPLETE ===')
        cy.log('✅ JWT Token Validation: Tested')
        cy.log('✅ Role-Based Access Control: Verified')
        cy.log('✅ Database Connectivity: Confirmed')
        cy.log('✅ REST API Standards: Validated')
        cy.log('✅ Security Measures: Enforced')
    })
})
