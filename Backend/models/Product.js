const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'herbal_supplements',
      'ayurvedic_medicines',
      'skincare',
      'haircare',
      'digestive_health',
      'immune_support',
      'stress_relief',
      'sleep_aid',
      'joint_health',
      'heart_health',
      'diabetes_care',
      'weight_management',
      'women_health',
      'men_health',
      'children_health',
      'elderly_care',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  price: {
    current: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Price cannot be negative']
    },
    original: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    currency: {
      type: String,
      default: 'LKR'
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  inventory: {
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative']
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackInventory: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  specifications: {
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['g', 'kg', 'oz', 'lb', 'ml', 'l']
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'mm']
      }
    },
    ingredients: [{
      name: String,
      percentage: Number,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    dosage: {
      form: {
        type: String,
        enum: ['tablet', 'capsule', 'powder', 'liquid', 'cream', 'oil', 'paste', 'other']
      },
      strength: String,
      instructions: String
    },
    shelfLife: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years']
      }
    },
    storageInstructions: String
  },
  healthBenefits: [{
    benefit: String,
    description: String,
    scientificEvidence: String
  }],
  usageInstructions: {
    howToUse: String,
    whenToUse: String,
    precautions: [String],
    contraindications: [String],
    sideEffects: [String]
  },
  certifications: [{
    type: {
      type: String,
      enum: ['fda_approved', 'gmp_certified', 'organic', 'ayurvedic_license', 'iso_certified', 'other']
    },
    certificateNumber: String,
    issuedBy: String,
    validUntil: Date
  }],
  reviews: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    ratingDistribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPrescriptionRequired: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalNotes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  ageRestriction: {
    minAge: {
      type: Number,
      min: 0
    },
    maxAge: {
      type: Number,
      max: 120
    }
  },
  pregnancyWarning: {
    type: String,
    enum: ['safe', 'consult_doctor', 'not_recommended', 'unknown']
  },
  breastfeedingWarning: {
    type: String,
    enum: ['safe', 'consult_doctor', 'not_recommended', 'unknown']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      lowercase: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.price.original && this.price.original > this.price.current) {
    return Math.round(((this.price.original - this.price.current) / this.price.original) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.inventory.stock === 0) return 'out_of_stock';
  if (this.inventory.stock <= this.inventory.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  if (!this.images || !Array.isArray(this.images) || this.images.length === 0) {
    return null;
  }
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg ? primaryImg.url : this.images[0].url;
});

// Index for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ 'price.current': 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ approvalStatus: 1 });
productSchema.index({ isActive: 1, approvalStatus: 1 });
productSchema.index({ 'reviews.averageRating': -1 });
productSchema.index({ 'inventory.stock': 1 });
productSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
productSchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.seo.slug) {
    try {
      // Generate base slug from name
      let baseSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Ensure slug uniqueness by appending a counter if needed
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existingProduct = await this.constructor.findOne({ 'seo.slug': slug });
        if (!existingProduct || existingProduct._id.toString() === this._id.toString()) {
          break; // Slug is unique or this is the same product being updated
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      this.seo.slug = slug;
      next();
    } catch (error) {
      console.log('Error generating unique slug:', error.message);
      // Fallback to basic slug generation
      this.seo.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();
      next();
    }
  } else {
    next();
  }
  
  // Ensure only one primary image
  if (this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    } else if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    }
  }
  
  next();
});

// Static method to search products
productSchema.statics.searchProducts = function(query, filters = {}, includePending = false) {
  const searchQuery = {
    isActive: true,
    ...filters
  };
  
  // Only show approved products unless specifically requested
  if (!includePending) {
    searchQuery.approvalStatus = 'approved';
  }
  
  if (query) {
    // Try text search first, fallback to regex search if text index is not available
    try {
      searchQuery.$text = { $search: query };
      return this.find(searchQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } catch (error) {
      // Fallback to regex search if text search fails
      console.log('Text search failed, falling back to regex search:', error.message);
      const regexQuery = new RegExp(query, 'i');
      searchQuery.$or = [
        { name: regexQuery },
        { description: regexQuery },
        { brand: regexQuery },
        { category: regexQuery }
      ];
      delete searchQuery.$text;
      return this.find(searchQuery);
    }
  }
  
  return this.find(searchQuery);
};

// Static method to generate unique slug
productSchema.statics.generateUniqueSlug = async function(name, excludeId = null) {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const query = { 'seo.slug': slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingProduct = await this.findOne(query);
    if (!existingProduct) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Static method to get featured products
productSchema.statics.getFeaturedProducts = function(limit = 10) {
  return this.find({
    isActive: true,
    isFeatured: true,
    approvalStatus: 'approved',
    'inventory.stock': { $gt: 0 }
  })
  .sort({ 'reviews.averageRating': -1, createdAt: -1 })
  .limit(limit);
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    if (this.inventory.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.inventory.stock -= quantity;
  } else if (operation === 'add') {
    this.inventory.stock += quantity;
  }
  
  return this.save();
};

// Instance method to check availability
productSchema.methods.isAvailable = function(quantity = 1) {
  if (!this.isActive) return false;
  if (this.inventory.trackInventory && this.inventory.stock < quantity) {
    return this.inventory.allowBackorder;
  }
  return true;
};

// Create text index for search functionality
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text', 
  category: 'text' 
});

module.exports = mongoose.model('Product', productSchema);
