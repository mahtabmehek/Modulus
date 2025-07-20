describe('Debug Current Page State', () => {
    it('should capture what is actually on the page', () => {
        cy.visit('http://localhost:3002');

        // Wait for page to load
        cy.wait(3000);

        // Log the page title
        cy.title().then((title) => {
            cy.log('Page title:', title);
        });

        // Log the URL
        cy.url().then((url) => {
            cy.log('Current URL:', url);
        });

        // Get the body content
        cy.get('body').then(($body) => {
            cy.log('Body HTML length:', $body.html().length);
            // Log first 500 chars of body content
            cy.log('Body content preview:', $body.text().substring(0, 500));
        });

        // Check if any common elements exist
        cy.get('body').then(($body) => {
            if ($body.find('input').length > 0) {
                cy.log('Found inputs on page');
                cy.get('input').each(($input) => {
                    cy.log('Input:', $input.attr('type'), $input.attr('id'), $input.attr('name'));
                });
            } else {
                cy.log('No inputs found on page');
            }

            if ($body.find('button').length > 0) {
                cy.log('Found buttons on page');
                cy.get('button').each(($button) => {
                    cy.log('Button:', $button.text());
                });
            } else {
                cy.log('No buttons found on page');
            }

            if ($body.find('[data-state]').length > 0) {
                cy.log('Found data-state elements');
                cy.get('[data-state]').each(($element) => {
                    cy.log('Data-state:', $element.attr('data-state'));
                });
            } else {
                cy.log('No data-state elements found');
            }
        });

        // Take a screenshot
        cy.screenshot('current-page-state');

        // Always pass this test - we just want to see what's there
        cy.wrap(true).should('eq', true);
    });
});
