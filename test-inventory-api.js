const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test inventory management API endpoints
async function testInventoryAPI() {
  console.log('🧪 Testing Inventory Management API...\n');

  try {
    // Test 1: Get inventory data
    console.log('1. Testing GET /admin/products/inventory');
    const inventoryResponse = await axios.get(`${API_BASE}/admin/products/inventory?page=1&limit=5`);
    console.log('✅ Inventory data retrieved successfully');
    console.log('   Products count:', inventoryResponse.data.data.products.length);
    console.log('   Summary:', inventoryResponse.data.data.summary);
    console.log('');

    // Test 2: Get low stock products
    console.log('2. Testing GET /admin/products/low-stock');
    const lowStockResponse = await axios.get(`${API_BASE}/admin/products/low-stock?limit=5`);
    console.log('✅ Low stock products retrieved successfully');
    console.log('   Low stock count:', lowStockResponse.data.data.lowStockProducts.length);
    console.log('   Out of stock count:', lowStockResponse.data.data.outOfStockProducts.length);
    console.log('');

    // Test 3: Get product categories
    console.log('3. Testing GET /admin/products/categories');
    const categoriesResponse = await axios.get(`${API_BASE}/admin/products/categories`);
    console.log('✅ Product categories retrieved successfully');
    console.log('   Categories count:', categoriesResponse.data.data.length);
    console.log('');

    // Test 4: Get inventory report
    console.log('4. Testing GET /admin/analytics/inventory-report');
    const reportResponse = await axios.get(`${API_BASE}/admin/analytics/inventory-report`);
    console.log('✅ Inventory report generated successfully');
    console.log('   Report overview:', reportResponse.data.data.overview);
    console.log('');

    console.log('🎉 All inventory management API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Note: This test requires authentication. Make sure you are logged in as an admin.');
    }
  }
}

// Run the test
testInventoryAPI();

