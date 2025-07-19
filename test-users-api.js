// Use Node.js built-in fetch (Node 18+)
async function testUsersAPI() {
    try {
        console.log('Testing users API endpoint...');

        const response = await fetch('http://localhost:3001/api/admin/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }

        const data = await response.json();
        console.log('API Response Status:', response.status);
        console.log('Total users returned:', data.length || 'N/A');
        console.log('Users data:');
        console.table(data);

    } catch (error) {
        console.error('Error testing API:', error.message);
    }
}

testUsersAPI();
