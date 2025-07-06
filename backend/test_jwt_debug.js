const jwt = require('jsonwebtoken');

// Test JWT token creation and verification
const testJWT = () => {
  const secret = 'your-secret-key';
  
  // Create a test user
  const testUser = {
    id: 85,
    username: 'test_user',
    email: 'test@example.com'
  };
  
  // Create token
  const token = jwt.sign(testUser, secret, { expiresIn: '7d' });
  console.log('Created token:', token);
  
  try {
    // Verify token
    const decoded = jwt.verify(token, secret);
    console.log('Decoded token:', decoded);
    console.log('User ID from token:', decoded.id);
  } catch (error) {
    console.error('JWT verification error:', error);
  }
};

testJWT(); 