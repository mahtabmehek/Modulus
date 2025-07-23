const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
    try {
        // Create a test file
        const testContent = 'This is a test icon file';
        fs.writeFileSync('test-icon.txt', testContent);

        // Create form data
        const form = new FormData();
        form.append('icon', fs.createReadStream('test-icon.txt'));
        form.append('labName', 'test_lab_upload');

        console.log('Testing file upload to http://localhost:3001/api/files/upload-lab-files');

        // Make the request
        const response = await fetch('http://localhost:3001/api/files/upload-lab-files', {
            method: 'POST',
            body: form
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Upload successful!');
            console.log('Result:', JSON.stringify(result, null, 2));

            // Check if the file was actually created
            const iconPath = result.data.icon;
            if (iconPath) {
                const fullPath = `./backend${iconPath}`;
                try {
                    fs.accessSync(fullPath);
                    console.log('✅ File exists on filesystem at:', fullPath);
                    const stats = fs.statSync(fullPath);
                    console.log('File size:', stats.size, 'bytes');
                } catch (err) {
                    console.log('❌ File NOT found on filesystem at:', fullPath);
                }
            }
        } else {
            const errorText = await response.text();
            console.log('Upload failed!');
            console.log('Error:', errorText);
        }

        // Clean up test file
        fs.unlinkSync('test-icon.txt');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testUpload();
