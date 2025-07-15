const RDSDataClient = require('./rds-data-client');

async function checkUserApprovals() {
    const db = new RDSDataClient();
    try {
        console.log('Checking all users and their approval status...');
        
        const result = await db.query(`
            SELECT id, email, name, role, is_approved, created_at 
            FROM users 
            ORDER BY is_approved, role, id
        `);
        
        console.log('All users:');
        console.log('='.repeat(80));
        result.rows.forEach(user => {
            const status = user.is_approved ? '✅ Approved' : '❌ Pending';
            console.log(`ID: ${user.id.toString().padEnd(4)} | ${user.email.padEnd(25)} | ${user.role.padEnd(10)} | ${status}`);
        });
        console.log('='.repeat(80));
        
        const pending = result.rows.filter(u => !u.is_approved);
        const approved = result.rows.filter(u => u.is_approved);
        
        console.log(`Total users: ${result.rows.length}`);
        console.log(`Approved users: ${approved.length}`);
        console.log(`Pending approvals: ${pending.length}`);
        
        if (pending.length > 0) {
            console.log('\nUsers pending approval:');
            pending.forEach(user => {
                console.log(`- ${user.name} (${user.email}) - ${user.role}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkUserApprovals();
