describe('API Format Verification', () => {
    const baseApiUrl = 'http://localhost:3001/api';
    let authTokens = {};

    before(() => {
        // Authenticate admin user
        cy.request({
            method: 'POST',
            url: `${baseApiUrl}/auth/login`,
            body: {
                email: 'admin@test.com',
                password: 'Mahtabmehek@1337'
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            authTokens.admin = response.body.token;
            cy.log('✅ Admin authenticated successfully');
        });

        // Authenticate student user  
        cy.request({
            method: 'POST',
            url: `${baseApiUrl}/auth/login`,
            body: {
                email: 'student@test.com',
                password: 'Mahtabmehek@1337'
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            authTokens.student = response.body.token;
            cy.log('✅ Student authenticated successfully');
        });
    });

    describe('Verify API Response Formats', () => {
        it('should verify users API returns paginated format', () => {
            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/users`,
                headers: {
                    'Authorization': `Bearer ${authTokens.admin}`
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('users');
                expect(response.body.users).to.be.an('array');
                expect(response.body).to.have.property('pagination');
                expect(response.body.pagination).to.have.property('currentPage');
                expect(response.body.pagination).to.have.property('totalPages');
                cy.log(`✅ Users API format verified: ${response.body.users.length} users with pagination`);
            });
        });

        it('should verify courses API returns correct format', () => {
            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/courses`,
                headers: {
                    'Authorization': `Bearer ${authTokens.student}`
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('courses');
                expect(response.body.courses).to.be.an('array');
                cy.log(`✅ Courses API format verified: ${response.body.courses.length} courses`);
            });
        });

        it('should verify labs API returns correct format', () => {
            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/labs`,
                headers: {
                    'Authorization': `Bearer ${authTokens.admin}`
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('success', true);
                expect(response.body).to.have.property('data');
                expect(response.body.data).to.be.an('array');
                cy.log(`✅ Labs API format verified: ${response.body.data.length} labs`);
            });
        });

        it('should verify enrollment API structure', () => {
            cy.request({
                method: 'GET',
                url: `${baseApiUrl}/enrollments`,
                headers: {
                    'Authorization': `Bearer ${authTokens.admin}`
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
                cy.log(`✅ Enrollments API responding correctly`);
            });
        });
    });
});
