import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Test user data
const testUser = {
  id: 'ea36e0db-240d-4b09-aa79-942e1e274216',
  email: 'budgettest@example.com',
  first_name: 'Budget',
  last_name: 'Test',
  username: 'budgettest'
};

// Generate JWT token
const token = jwt.sign(
  {
    userId: testUser.id,
    email: testUser.email,
    firstName: testUser.first_name,
    lastName: testUser.last_name
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

console.log('Test User:', testUser);
console.log('JWT Token:', token);
console.log('\nYou can use this token to test authenticated endpoints:');
console.log(`Authorization: Bearer ${token}`);