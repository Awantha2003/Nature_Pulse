const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    name: String, // Store product name at time of order
    image: String // Store product image at time of order
  }],
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  coupon: {
    code: String,
    discount: Number,
    discountType: String
  },
  shippingAddress: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    isSameAsShipping: {
      type: Boolean,
      default: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'cod'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentIntentId: String, // For Stripe
    paidAt: Date,
    refundedAt: Date,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundReason: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard'
    },
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  notes: {
    customer: String,
    internal: String
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order status color
orderSchema.virtual('statusColor').get(function() {
  const statusColors = {
    'pending': 'yellow',
    'confirmed': 'blue',
    'processing': 'orange',
    'shipped': 'purple',
    'delivered': 'green',
    'cancelled': 'red',
    'returned': 'gray'
  };
  return statusColors[this.status] || 'gray';
});

// Virtual for payment status color
orderSchema.virtual('paymentStatusColor').get(function() {
  const statusColors = {
    'pending': 'yellow',
    'processing': 'blue',
    'completed': 'green',
    'failed': 'red',
    'refunded': 'gray',
    'partially_refunded': 'orange'
  };
  return statusColors[this.payment.status] || 'gray';
});

// Index for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      const count = await mongoose.model('Order').countDocuments();
      this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
    }
    
    // Add to timeline when status changes
    if (this.isModified('status') && !this.isNew) {
      this.timeline.push({
        status: this.status,
        note: `Order status changed to ${this.status}`
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get orders by user
orderSchema.statics.getUserOrders = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.product', 'name images');
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        statusCounts: {
          $push: '$status'
        }
      }
    },
    {
      $project: {
        totalOrders: 1,
        totalRevenue: 1,
        averageOrderValue: 1,
        statusBreakdown: {
          $reduce: {
            input: '$statusCounts',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{
                      k: '$$this',
                      v: {
                        $add: [
                          { $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] },
                          1
                        ]
                      }
                    }]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    note: note,
    updatedBy: updatedBy
  });
  
  // Set specific timestamps based on status
  if (newStatus === 'shipped') {
    this.shipping.shippedAt = new Date();
  } else if (newStatus === 'delivered') {
    this.shipping.deliveredAt = new Date();
  }
  
  return this.save();
};

// Instance method to process refund
orderSchema.methods.processRefund = function(amount, reason, updatedBy = null) {
  if (amount > this.pricing.total) {
    throw new Error('Refund amount cannot exceed order total');
  }
  
  this.payment.refundAmount = amount;
  this.payment.refundReason = reason;
  this.payment.refundedAt = new Date();
  
  if (amount === this.pricing.total) {
    this.payment.status = 'refunded';
  } else {
    this.payment.status = 'partially_refunded';
  }
  
  this.timeline.push({
    status: 'refund_processed',
    note: `Refund of $${amount} processed. Reason: ${reason}`,
    updatedBy: updatedBy
  });
  
  return this.save();
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = function(reason, updatedBy = null) {
  if (['shipped', 'delivered'].includes(this.status)) {
    throw new Error('Cannot cancel order that has been shipped or delivered');
  }
  
  this.status = 'cancelled';
  this.timeline.push({
    status: 'cancelled',
    note: `Order cancelled. Reason: ${reason}`,
    updatedBy: updatedBy
  });
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
