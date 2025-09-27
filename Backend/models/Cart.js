const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [100, 'Quantity cannot exceed 100']
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  coupon: {
    code: String,
    discount: {
      type: Number,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    appliedAt: Date
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.product.price?.current || 0) * item.quantity;
  }, 0);
});

// Virtual for total discount
cartSchema.virtual('totalDiscount').get(function() {
  if (!this.coupon) return 0;
  
  if (this.coupon.discountType === 'percentage') {
    return (this.subtotal * this.coupon.discount) / 100;
  } else {
    return this.coupon.discount;
  }
});

// Virtual for total amount
cartSchema.virtual('totalAmount').get(function() {
  return this.subtotal - this.totalDiscount;
});

// Index for better query performance
cartSchema.index({ user: 1 });
cartSchema.index({ lastUpdated: -1 });

// Pre-save middleware to update lastUpdated
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Instance method to add item to cart
cartSchema.methods.addItem = function(productId, quantity = 1, notes = '') {
  const existingItem = this.items.find(item => item.product.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
    if (notes) existingItem.notes = notes;
  } else {
    this.items.push({
      product: productId,
      quantity: quantity,
      notes: notes
    });
  }
  
  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(item => item.product.toString() === productId.toString());
  
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    } else {
      item.quantity = quantity;
    }
  }
  
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.coupon = undefined;
  return this.save();
};

// Instance method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discount, discountType) {
  this.coupon = {
    code: couponCode,
    discount: discount,
    discountType: discountType,
    appliedAt: new Date()
  };
  return this.save();
};

// Instance method to remove coupon
cartSchema.methods.removeCoupon = function() {
  this.coupon = undefined;
  return this.save();
};

// Static method to get cart with populated products
cartSchema.statics.getCartWithProducts = function(userId) {
  return this.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name price images inventory isActive'
    });
};

module.exports = mongoose.model('Cart', cartSchema);
