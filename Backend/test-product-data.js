const axios = require('axios');

async function testProductData() {
  try {
    console.log('Testing product data structure...');
    
    const response = await axios.get('http://localhost:5000/api/products?page=1&limit=5');
    
    console.log('API Response Status:', response.status);
    console.log('Number of products:', response.data.data.products.length);
    
    // Look for products with images
    const productsWithImages = response.data.data.products.filter(p => p.images && p.images.length > 0);
    
    console.log(`\nProducts with images: ${productsWithImages.length}`);
    
    if (productsWithImages.length > 0) {
      const product = productsWithImages[0];
      console.log('\nFirst product with images:');
      console.log('Name:', product.name);
      console.log('Images array:', JSON.stringify(product.images, null, 2));
      
      if (product.images[0]) {
        console.log('\nFirst image object:');
        console.log('Image URL field:', product.images[0].url);
        console.log('Full image object:', JSON.stringify(product.images[0], null, 2));
        
        // Test the constructed URL
        const constructedUrl = `http://localhost:5000/${product.images[0].url}`;
        console.log('\nConstructed URL:', constructedUrl);
        
        // Test if image is accessible
        try {
          const imageResponse = await axios.head(constructedUrl);
          console.log('Image accessible:', imageResponse.status);
        } catch (imageError) {
          console.log('Image not accessible:', imageError.message);
        }
      }
    } else {
      console.log('\nNo products with images found');
      console.log('Sample product structure:', JSON.stringify(response.data.data.products[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testProductData();

