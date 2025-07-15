// AWS RDS Data API client for Aurora Serverless
console.log('🚀 Loading RDS Data Client module...');

try {
    const AWS = require('aws-sdk');
    console.log('✅ AWS SDK loaded successfully');

    class RDSDataClient {
        constructor() {
            // Configure AWS SDK
            AWS.config.update({
                region: 'eu-west-2'
            });

            this.rdsData = new AWS.RDSDataService();

            this.resourceArn = 'arn:aws:rds:eu-west-2:376129881409:cluster:modulus-aurora-cluster';
            this.secretArn = 'arn:aws:secretsmanager:eu-west-2:376129881409:secret:modulus-aurora-credentials-bvPpka';
            this.database = 'modulus';

            console.log('🌟 RDS Data API client initialized for Aurora');
        }

        async query(sql, params = []) {
            try {
                console.log('🔍 RDS Data API Query:', sql);
                console.log('📝 Parameters:', params);
                console.log('📝 Parameter types:', params.map(p => `${p} (${typeof p})`));

                const sqlParams = params.map((param, index) => {
                    console.log(`🔧 Processing param ${index + 1}:`, param, `(type: ${typeof param})`);
                    
                    if (typeof param === 'string') {
                        // Check if string represents a number for ID fields (more comprehensive check)
                        if (/^\d+$/.test(param) && (
                            sql.includes('WHERE id =') || 
                            sql.includes('id = $') || 
                            sql.includes('id <> $') || 
                            sql.includes('id != $') ||
                            sql.includes('duration = $') ||
                            sql.includes('total_credits = $')
                        )) {
                            console.log(`🔧 Converting string "${param}" to longValue`);
                            return { name: `param${index + 1}`, value: { longValue: parseInt(param) } };
                        }
                        console.log(`🔧 Using string value for "${param}"`);
                        return { name: `param${index + 1}`, value: { stringValue: param } };
                    } else if (typeof param === 'number') {
                        if (Number.isInteger(param)) {
                            console.log(`🔧 Using longValue for integer ${param}`);
                            return { name: `param${index + 1}`, value: { longValue: param } };
                        } else {
                            console.log(`🔧 Using doubleValue for float ${param}`);
                            return { name: `param${index + 1}`, value: { doubleValue: param } };
                        }
                    } else if (typeof param === 'boolean') {
                        console.log(`🔧 Using booleanValue for ${param}`);
                        return { name: `param${index + 1}`, value: { booleanValue: param } };
                    } else {
                        console.log(`🔧 Converting to string for ${param}`);
                        return { name: `param${index + 1}`, value: { stringValue: String(param) } };
                    }
                });

                // Replace $1, $2, etc. with :param1, :param2, etc.
                let formattedSql = sql;
                for (let i = 0; i < params.length; i++) {
                    formattedSql = formattedSql.replace(new RegExp(`\\$${i + 1}`, 'g'), `:param${i + 1}`);
                }

                const result = await this.rdsData.executeStatement({
                    resourceArn: this.resourceArn,
                    secretArn: this.secretArn,
                    database: this.database,
                    sql: formattedSql,
                    parameters: sqlParams,
                    includeResultMetadata: true
                }).promise();

                // Convert RDS Data API response to pg-like format
                const rows = this.convertRDSResponseToRows(result);
                console.log('✅ RDS Data API Query successful, rows:', rows.length);

                return { rows };
            } catch (error) {
                console.error('❌ RDS Data API Query failed:', error);
                throw error;
            }
        }

        convertRDSResponseToRows(result) {
            if (!result.records || result.records.length === 0) {
                return [];
            }

            const columnMetadata = result.columnMetadata || [];
            const rows = [];

            for (const record of result.records) {
                const row = {};
                record.forEach((field, index) => {
                    const columnName = columnMetadata[index]?.name || `column_${index}`;

                    // Extract value based on type
                    if (field.stringValue !== undefined) {
                        row[columnName] = field.stringValue;
                    } else if (field.longValue !== undefined) {
                        row[columnName] = field.longValue;
                    } else if (field.doubleValue !== undefined) {
                        row[columnName] = field.doubleValue;
                    } else if (field.booleanValue !== undefined) {
                        row[columnName] = field.booleanValue;
                    } else if (field.isNull) {
                        row[columnName] = null;
                    } else {
                        row[columnName] = null;
                    }
                });
                rows.push(row);
            }

            return rows;
        }

        // Method to test connection
        async testConnection() {
            try {
                const result = await this.query('SELECT 1 as test');
                console.log('✅ RDS Data API connection test successful');
                return true;
            } catch (error) {
                console.error('❌ RDS Data API connection test failed:', error);
                return false;
            }
        }
    }

    console.log('✅ RDS Data Client class defined successfully');
    module.exports = RDSDataClient;
    console.log('✅ RDS Data Client exported successfully');

} catch (error) {
    console.error('❌ Error loading RDS Data Client:', error);
    module.exports = {};
}
