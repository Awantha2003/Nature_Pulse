// Test image URL construction
const imagePath = 'uploads/products/product-1757962304833-301949824.png';
const constructedUrl = `http://localhost:5000/${imagePath}`;

console.log('Image path from database:', imagePath);
console.log('Constructed URL:', constructedUrl);
console.log('Expected URL:', 'http://localhost:5000/uploads/products/product-1757962304833-301949824.png');

// Test if they match
const expectedUrl = 'http://localhost:5000/uploads/products/product-1757962304833-301949824.png';
console.log('URLs match:', constructedUrl === expectedUrl);

