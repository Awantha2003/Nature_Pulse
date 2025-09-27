const axios = require('axios');

async function testCORS() {
  try {
    console.log('Testing CORS headers...');
    
    // Test with Origin header
    const response = await axios.get('http://localhost:5000/uploads/products/product-1757963652347-953804261.png', {
      headers: {
        'Origin': 'http://localhost:3000'
      },
      validateStatus: function (status) {
        return status < 500; // Accept any status less than 500
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:');
    console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    console.log('Access-Control-Allow-Headers:', response.headers['access-control-allow-headers']);
    console.log('Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);
    
    // Test OPTIONS request (preflight)
    try {
      const optionsResponse = await axios.options('http://localhost:5000/uploads/products/product-1757963652347-953804261.png', {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET'
        }
      });
      console.log('\nOPTIONS response status:', optionsResponse.status);
      console.log('OPTIONS response headers:');
      console.log('Access-Control-Allow-Origin:', optionsResponse.headers['access-control-allow-origin']);
    } catch (optionsError) {
      console.log('OPTIONS request failed:', optionsError.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testCORS();

