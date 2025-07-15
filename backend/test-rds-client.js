// Test RDS Data Client import
try {
    console.log('Testing RDS Data Client import...');
    console.log('About to require rds-data-client...');
    const RDSDataClient = require('./rds-data-client');
    console.log('Require completed successfully');
    console.log('RDSDataClient:', typeof RDSDataClient);

    if (typeof RDSDataClient === 'function') {
        console.log('✅ RDSDataClient is a constructor function!');
        const client = new RDSDataClient();
        console.log('Client instance created successfully:', !!client);
    } else {
        console.error('RDSDataClient is not a constructor function!');
    }
} catch (error) {
    console.error('Error testing RDS Data Client:', error);
    console.error('Stack trace:', error.stack);
}
