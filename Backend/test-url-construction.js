// Test URL construction logic
function getImageUrl(imagePath) {
  if (!imagePath) return '/api/placeholder/300/200';
  if (imagePath.startsWith('http')) return imagePath;
  
  // Handle different path formats
  let filename;
  if (imagePath.includes('/')) {
    // Full path: "uploads/products/filename.png" -> "filename.png"
    filename = imagePath.split('/').pop();
  } else {
    // Just filename: "filename.png" -> "filename.png"
    filename = imagePath;
  }
  const fullUrl = `http://localhost:5000/api/images/${filename}`;
  console.log('Constructing image URL:', { imagePath, filename, fullUrl });
  return fullUrl;
}

// Test cases
console.log('Testing URL construction:');
console.log('1. Full path:', getImageUrl('uploads/products/product-1757963480155-409700154.png'));
console.log('2. Just filename:', getImageUrl('product-1757963480155-409700154.png'));
console.log('3. Empty path:', getImageUrl(''));
console.log('4. HTTP URL:', getImageUrl('http://example.com/image.png'));

