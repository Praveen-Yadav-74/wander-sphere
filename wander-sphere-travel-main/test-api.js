// Node.js compatible test script to check backend API connectivity

const testApiCall = async () => {
  try {
    console.log('Testing API connectivity from Node.js...');
    
    // Test 1: Direct fetch to backend using node-fetch equivalent
    console.log('Test 1: Direct request to backend');
    
    // Use Node.js built-in fetch (available in Node 18+)
    const response1 = await fetch('http://localhost:5000/api/trips', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Response status:', response1.status);
    console.log('Response statusText:', response1.statusText);
    console.log('Response headers:', Object.fromEntries(response1.headers.entries()));
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Response data:', JSON.stringify(data1, null, 2));
    } else {
      console.error('Response not ok:', response1.statusText);
      const errorText = await response1.text();
      console.error('Error response body:', errorText);
    }
    
    // Test 2: Test health endpoint
    console.log('\nTest 2: Testing health endpoint');
    const healthResponse = await fetch('http://localhost:5000/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Health endpoint status:', healthResponse.status);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', JSON.stringify(healthData, null, 2));
    }
    
  } catch (error) {
    console.error('API Test Error:', error.message);
    console.error('Error name:', error.name);
    console.error('Error cause:', error.cause);
    
    // Check if it's a network error
    if (error.message.includes('ECONNREFUSED')) {
      console.error('Connection refused - backend server may not be running');
    } else if (error.message.includes('fetch')) {
      console.error('Fetch error - possible network or CORS issue');
    }
  }
};

// Run the test
testApiCall();