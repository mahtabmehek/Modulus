const fs = require('fs');
const path = require('path');

// Create a test icon file
const testIconContent = fs.readFileSync(path.join(__dirname, 'backend', 'uploads', 'labs', 'unnamed-lab', '1752905630543_modulus_icon.png'));
const testIconPath = path.join(__dirname, 'test-icon-upload.png');
fs.writeFileSync(testIconPath, testIconContent);

console.log('✅ Created test icon file at:', testIconPath);
console.log('📏 File size:', fs.statSync(testIconPath).size, 'bytes');

// Now test the upload with a simple HTML form simulation
const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test File Upload</title>
</head>
<body>
    <h1>Test Lab Icon Upload</h1>
    <form action="http://localhost:3001/api/files/upload-lab-files" method="post" enctype="multipart/form-data">
        <label for="icon">Icon:</label>
        <input type="file" name="icon" id="icon" accept="image/*"><br><br>
        
        <label for="labName">Lab Name:</label>
        <input type="text" name="labName" value="test_upload_lab"><br><br>
        
        <input type="submit" value="Upload Icon">
    </form>
    
    <div id="result"></div>
    
    <script>
        // Test with JavaScript upload
        async function testUpload() {
            const fileInput = document.getElementById('icon');
            if (fileInput.files.length === 0) {
                document.getElementById('result').innerHTML = '<p>Please select a file first</p>';
                return;
            }
            
            const formData = new FormData();
            formData.append('icon', fileInput.files[0]);
            formData.append('labName', 'test_upload_lab');
            
            try {
                const response = await fetch('http://localhost:3001/api/files/upload-lab-files', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    document.getElementById('result').innerHTML = 
                        '<pre>Upload successful: ' + JSON.stringify(result, null, 2) + '</pre>';
                } else {
                    const error = await response.text();
                    document.getElementById('result').innerHTML = 
                        '<p>Upload failed: ' + error + '</p>';
                }
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    '<p>Error: ' + error.message + '</p>';
            }
        }
        
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            testUpload();
        });
    </script>
</body>
</html>
`;

const testHtmlPath = path.join(__dirname, 'test-upload.html');
fs.writeFileSync(testHtmlPath, testHtml);

console.log('✅ Created test upload page at:', testHtmlPath);
console.log('🌐 Open this in a browser to test file upload manually');
console.log('🔗 file:///' + testHtmlPath.replace(/\\/g, '/'));
