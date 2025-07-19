// Debug script to check JWT token expiration
const jwt = require('jsonwebtoken');

// Get token from localStorage (you'll need to copy this from browser console)
const token = process.argv[2];

if (!token) {
    console.log('Usage: node debug-token.js <token>');
    console.log('Copy the token from localStorage.getItem("modulus_token") in browser console');
    process.exit(1);
}

try {
    // Decode without verification to see the payload
    const decoded = jwt.decode(token);
    console.log('Token payload:', decoded);

    if (decoded.exp) {
        const expDate = new Date(decoded.exp * 1000);
        const now = new Date();
        console.log('Token expires at:', expDate);
        console.log('Current time:', now);
        console.log('Time until expiration:', (expDate - now) / 1000 / 60, 'minutes');
        console.log('Is expired:', now > expDate);
    }

    // Try to verify with the secret
    const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';
    const verified = jwt.verify(token, JWT_SECRET);
    console.log('Token is valid!');

} catch (error) {
    console.error('Token verification failed:', error.message);
}
