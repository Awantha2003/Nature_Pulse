const axios = require('axios');

async function testProductAPI() {
  try {
    console.log('Testing product API...');
    
    // Test the products endpoint
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
      console.log('Images:', JSON.stringify(product.images, null, 2));
      
      // Test image URL
      if (product.images[0] && product.images[0].url) {
        const imageUrl = `http://localhost:5000/${product.images[0].url}`;
        console.log('\nConstructed image URL:', imageUrl);
        
        // Test if image is accessible
        try {
          const imageResponse = await axios.head(imageUrl);
          console.log('Image accessible:', imageResponse.status);
        } catch (imageError) {
          console.log('Image not accessible:', imageError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testProductAPI();

