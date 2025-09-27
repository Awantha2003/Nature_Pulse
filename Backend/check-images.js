const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/Awantha')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find products with images
    const products = await Product.find({ images: { $exists: true, $ne: [] } }).limit(2);
    
    console.log(`Found ${products.length} products with images:`);
    
    products.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`Name: ${product.name}`);
      console.log(`Images:`, JSON.stringify(product.images, null, 2));
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

