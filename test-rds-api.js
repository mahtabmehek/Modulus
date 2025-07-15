const AWS = require('aws-sdk');

async function testRDSDataAPI() {
    try {
        AWS.config.update({ region: 'eu-west-2' });
        const rdsData = new AWS.RDSDataService();

        const params = {
            resourceArn: 'arn:aws:rds:eu-west-2:376129881409:cluster:modulus-aurora-cluster',
            secretArn: 'arn:aws:secretsmanager:eu-west-2:376129881409:secret:modulus-aurora-credentials-bvPpka',
            database: 'modulus',
            sql: 'SELECT id, email, name, role FROM users WHERE email = $1',
            parameters: [
                { name: 'param1', value: { stringValue: 'staffuser@test.com' } }
            ]
        };

        console.log('Testing RDS Data API...');
        const result = await rdsData.executeStatement(params).promise();
        console.log('✅ Success:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testRDSDataAPI();
