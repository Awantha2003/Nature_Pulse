const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { protect, restrictTo, checkActive } = require('../middleware/auth');
const { validateProduct, validateCartItem, validatePagination, validateMongoId, validateSearch, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Configure multer for product image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Admin/Doctor only)
router.post('/', protect, checkActive, restrictTo('admin', 'doctor'), validateProduct, handleValidationErrors, async (req, res) => {
  try {
    const productData = {
      createdBy: req.user._id,
      ...req.body
    };

    // Set approval status based on user role
    if (req.user.role === 'admin') {
      productData.approvalStatus = 'approved';
      productData.approvedBy = req.user._id;
      productData.approvedAt = new Date();
    } else {
      productData.approvalStatus = 'pending';
    }

    // Generate unique slug if not provided
    if (!productData.seo || !productData.seo.slug) {
      if (!productData.seo) {
        productData.seo = {};
      }
      productData.seo.slug = await Product.generateUniqueSlug(productData.name);
    }

    const product = await Product.create(productData);

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `Product with this ${field.replace('seo.', '')} already exists`,
        error: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', protect, checkActive, validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const { category, subcategory, brand, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', featured } = req.query;

    // Build filter
    const filter = { isActive: true };
    
    // Only show approved products to regular users
    if (!['admin', 'doctor'].includes(req.user.role)) {
      filter.approvalStatus = 'approved';
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (subcategory) {
      filter.subcategory = new RegExp(subcategory, 'i');
    }
    
    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }
    
    if (minPrice || maxPrice) {
      filter['price.current'] = {};
      if (minPrice) filter['price.current'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.current'].$lte = parseFloat(maxPrice);
    }
    
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let products;
    let total;

    // Handle search
    if (req.query.q) {
      const includePending = ['admin', 'doctor'].includes(req.user.role);
      products = await Product.searchProducts(req.query.q, filter, includePending);
      total = products.length;
      products = products.slice(skip, skip + limit);
    } else {
      products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      total = await Product.countDocuments(filter);
    }

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// @route   GET /api/products/pending
// @desc    Get products pending approval (Admin only)
// @access  Private (Admin only)
router.get('/pending', protect, checkActive, restrictTo('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({ approvalStatus: 'pending' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ approvalStatus: 'pending' });

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get pending products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending products'
    });
  }
});

// @route   PUT /api/products/:id/approve
// @desc    Approve a product (Admin only)
// @access  Private (Admin only)
router.put('/:id/approve', protect, checkActive, restrictTo('admin'), validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    if (product.approvalStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Product is not pending approval'
      });
    }

    product.approvalStatus = 'approved';
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();
    if (approvalNotes) {
      product.approvalNotes = approvalNotes;
    }

    await product.save();

    res.status(200).json({
      status: 'success',
      message: 'Product approved successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve product'
    });
  }
});

// @route   PUT /api/products/:id/reject
// @desc    Reject a product (Admin only)
// @access  Private (Admin only)
router.put('/:id/reject', protect, checkActive, restrictTo('admin'), validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    
    if (!approvalNotes || approvalNotes.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Approval notes are required when rejecting a product'
      });
    }
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    if (product.approvalStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Product is not pending approval'
      });
    }

    product.approvalStatus = 'rejected';
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();
    product.approvalNotes = approvalNotes;

    await product.save();

    res.status(200).json({
      status: 'success',
      message: 'Product rejected successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject product'
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Private
router.get('/featured', protect, checkActive, async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const featuredProducts = await Product.getFeaturedProducts(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: { products: featuredProducts }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch featured products'
    });
  }
});

// @route   GET /api/products/categories
// @desc    Get product categories
// @access  Private
router.get('/categories', protect, checkActive, async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const subcategories = await Product.distinct('subcategory');
    const brands = await Product.distinct('brand');

    res.status(200).json({
      status: 'success',
      data: {
        categories: categories.filter(cat => cat), // Remove null/undefined
        subcategories: subcategories.filter(sub => sub),
        brands: brands.filter(brand => brand)
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
});

// @route   GET /api/products/cart
// @desc    Get user's cart
// @access  Private
router.get('/cart', protect, checkActive, async (req, res) => {
  try {
    const cart = await Cart.getCartWithProducts(req.user._id);

    if (!cart) {
      // Create empty cart if it doesn't exist
      const newCart = await Cart.create({ user: req.user._id, items: [] });
      return res.status(200).json({
        status: 'success',
        data: { cart: newCart }
      });
    }

    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cart'
    });
  }
});

// @route   POST /api/products/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/cart/items', protect, checkActive, validateCartItem, handleValidationErrors, async (req, res) => {
  try {
    const { product, quantity, notes } = req.body;

    // Check if product exists and is available
    const productDoc = await Product.findById(product);
    if (!productDoc || !productDoc.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found or not available'
      });
    }

    if (!productDoc.isAvailable(quantity)) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient stock available'
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Add item to cart
    await cart.addItem(product, quantity, notes);

    // Get updated cart with populated products
    const updatedCart = await Cart.getCartWithProducts(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Item added to cart successfully',
      data: { cart: updatedCart }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add item to cart'
    });
  }
});

// @route   PUT /api/products/cart/items/:productId
// @desc    Update cart item quantity
// @access  Private
router.put('/cart/items/:productId', protect, checkActive, validateMongoId('productId'), handleValidationErrors, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid quantity is required'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    // Check product availability
    if (quantity > 0) {
      const product = await Product.findById(req.params.productId);
      if (!product || !product.isAvailable(quantity)) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient stock available'
        });
      }
    }

    await cart.updateItemQuantity(req.params.productId, quantity);

    // Get updated cart with populated products
    const updatedCart = await Cart.getCartWithProducts(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Cart updated successfully',
      data: { cart: updatedCart }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update cart'
    });
  }
});

// @route   DELETE /api/products/cart/items/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/cart/items/:productId', protect, checkActive, validateMongoId('productId'), handleValidationErrors, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    await cart.removeItem(req.params.productId);

    // Get updated cart with populated products
    const updatedCart = await Cart.getCartWithProducts(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart successfully',
      data: { cart: updatedCart }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove item from cart'
    });
  }
});

// @route   DELETE /api/products/cart
// @desc    Clear cart
// @access  Private
router.delete('/cart', protect, checkActive, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    await cart.clearCart();

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cart'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check if product is active (unless admin/doctor)
    if (!product.isActive && !['admin', 'doctor'].includes(req.user.role)) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin/Doctor only)
router.put('/:id', protect, checkActive, restrictTo('admin', 'doctor'), validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check if user can update this product
    if (req.user.role === 'doctor' && product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own products.'
      });
    }

    const allowedUpdates = [
      'name', 'description', 'shortDescription', 'category', 'subcategory', 'brand',
      'price', 'inventory', 'specifications', 'healthBenefits', 'usageInstructions',
      'certifications', 'tags', 'isActive', 'isFeatured', 'isPrescriptionRequired',
      'ageRestriction', 'pregnancyWarning', 'breastfeedingWarning', 'seo'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // If doctor is updating their product, reset approval status to pending
    if (req.user.role === 'doctor' && product.createdBy.toString() === req.user._id.toString()) {
      updates.approvalStatus = 'pending';
      updates.approvedBy = undefined;
      updates.approvedAt = undefined;
      updates.approvalNotes = undefined;
    }

    updates.lastModifiedBy = req.user._id;

    // Generate unique slug if name is being updated
    if (updates.name && updates.name !== product.name) {
      if (!updates.seo) {
        updates.seo = {};
      }
      updates.seo.slug = await Product.generateUniqueSlug(updates.name, req.params.id);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `Product with this ${field.replace('seo.', '')} already exists`,
        error: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// @route   POST /api/products/:id/images
// @desc    Upload product images
// @access  Private (Admin/Doctor only)
router.post('/:id/images', protect, checkActive, restrictTo('admin', 'doctor'), validateMongoId('id'), upload.array('images', 5), handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check if user can update this product
    if (req.user.role === 'doctor' && product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own products.'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images provided'
      });
    }

    // Add new images
    const newImages = req.files.map((file, index) => ({
      url: file.path,
      alt: req.body.alt || `Product image ${index + 1}`,
      isPrimary: index === 0 && product.images.length === 0
    }));

    product.images.push(...newImages);
    await product.save();

    res.status(200).json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: { images: product.images }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload images'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', protect, checkActive, restrictTo('admin'), validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product'
    });
  }
});

// @route   GET /api/products/images/:filename
// @desc    Serve product images with CORS headers
// @access  Public
router.get('/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', 'products', filename);
    
    console.log('Image request:', { filename, filePath });
    
    // CORS headers are handled by the main server middleware
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get file extension and set appropriate content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/png'; // default
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      default:
        contentType = 'image/png';
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Image serving error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// @route   GET /api/products/placeholder/:width/:height
// @desc    Generate placeholder image
// @access  Public
router.get('/placeholder/:width/:height', (req, res) => {
  try {
    const width = parseInt(req.params.width) || 300;
    const height = parseInt(req.params.height) || 200;
    
    // CORS headers are handled by the main server middleware
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#999" text-anchor="middle" dy=".3em">
          No Image
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
    res.send(svg);
  } catch (error) {
    console.error('Placeholder generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
