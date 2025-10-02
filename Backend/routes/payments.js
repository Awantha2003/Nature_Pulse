const express = require('express');
// Stripe is optional for demo mode
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { protect, checkActive } = require('../middleware/auth');
const { validateMongoId, handleValidationErrors } = require('../middleware/validation');
const NotificationService = require('../utils/notifications');

const router = express.Router();

// @route   GET /api/payments/test-stripe
// @desc    Test Stripe configuration
// @access  Private
router.get('/test-stripe', protect, checkActive, async (req, res) => {
  try {
    // Test Stripe connection by creating a test payment intent
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100, // LKR 100
      currency: 'lkr',
      metadata: {
        test: 'true',
        userId: req.user._id.toString()
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Stripe configuration is working',
      data: {
        paymentIntentId: testPaymentIntent.id,
        status: testPaymentIntent.status
      }
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Stripe configuration test failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent (Stripe or Demo mode)
// @access  Private
router.post('/create-payment-intent', protect, checkActive, async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid amount is required'
      });
    }

    // Validate currency
    const validCurrencies = ['lkr', 'usd', 'eur', 'gbp', 'cad', 'aud'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid currency. Supported currencies: ' + validCurrencies.join(', ')
      });
    }

    // Validate amount range (minimum LKR 100, maximum LKR 500,000)
    const amountInCents = Math.round(amount * 100);
    if (amountInCents < 10000) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimum amount is LKR 100'
      });
    }
    if (amountInCents > 50000000) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum amount is LKR 500,000'
      });
    }

    // Check if we're in demo mode (when Stripe is not properly configured or demo mode is enabled)
    const isDemoMode = process.env.DEMO_PAYMENT_MODE === 'true' ||
                      !process.env.STRIPE_SECRET_KEY || 
                      process.env.STRIPE_SECRET_KEY.includes('your_stripe_secret_key') ||
                      process.env.NODE_ENV === 'development';

    if (isDemoMode) {
      // Demo mode - create a mock payment intent
      const demoPaymentIntent = {
        id: `pi_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        client_secret: `pi_demo_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        amount: amountInCents,
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
        metadata: {
          userId: req.user._id.toString(),
          demo: 'true',
          ...metadata
        }
      };

      res.status(200).json({
        status: 'success',
        data: {
          clientSecret: demoPaymentIntent.client_secret,
          paymentIntentId: demoPaymentIntent.id,
          demo: true
        }
      });
    } else {
      // Production mode - use real Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          userId: req.user._id.toString(),
          ...metadata
        }
      });

      res.status(200).json({
        status: 'success',
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          demo: false
        }
      });
    }
  } catch (error) {
    console.error('Create payment intent error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment intent',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/payments/demo-payment
// @desc    Process demo payment (saves to MongoDB without Stripe)
// @access  Private
router.post('/demo-payment', protect, checkActive, async (req, res) => {
  try {
    const { appointmentId, amount, paymentMethod = 'demo_card' } = req.body;

    if (!appointmentId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Appointment ID and amount are required'
      });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'consultationFee')
      .populate('patient', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user owns this appointment
    if (appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if appointment is already paid
    if (appointment.payment.status === 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Appointment is already paid'
      });
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update appointment payment status
    appointment.payment.status = 'paid';
    appointment.payment.paymentMethod = paymentMethod;
    appointment.payment.transactionId = `demo_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    appointment.payment.paidAt = new Date();
    appointment.status = 'confirmed';

    await appointment.save();

    // Populate appointment for notifications
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
    ]);

    // Send payment success notification
    try {
      await NotificationService.sendPaymentSuccessNotification(appointment);
      await NotificationService.sendAppointmentConfirmationNotification(appointment);
    } catch (notificationError) {
      console.error('Demo payment notification failed:', notificationError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Demo payment successful',
      data: {
        appointment,
        payment: {
          transactionId: appointment.payment.transactionId,
          amount: appointment.payment.amount,
          status: appointment.payment.status,
          paidAt: appointment.payment.paidAt,
          demo: true
        }
      }
    });
  } catch (error) {
    console.error('Demo payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Demo payment failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/payments/cart-demo-payment
// @desc    Process demo payment for cart orders
// @access  Private
router.post('/cart-demo-payment', protect, checkActive, async (req, res) => {
  try {
    const { cartId, amount, paymentMethod = 'demo_card' } = req.body;

    if (!cartId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Cart ID and amount are required'
      });
    }

    // Find the cart
    const cart = await Cart.findById(cartId)
      .populate('user', 'firstName lastName email')
      .populate('items.product');

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    // Check if user owns this cart
    if (cart.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if cart is empty
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty'
      });
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => total + (item.product.price.current * item.quantity), 0);
    const shipping = 10.00;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    // Create order from cart
    const orderData = {
      user: req.user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price.current,
        name: item.product.name,
        image: item.product.primaryImage
      })),
      pricing: {
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        discount: 0,
        total: total
      },
      payment: {
        method: paymentMethod,
        status: 'completed', // Use 'completed' instead of 'paid'
        transactionId: `demo_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paidAt: new Date()
      },
      status: 'confirmed',
      shippingAddress: {
        firstName: req.body.shippingAddress?.firstName || 'John',
        lastName: req.body.shippingAddress?.lastName || 'Doe',
        street: req.body.shippingAddress?.street || '123 Main St',
        city: req.body.shippingAddress?.city || 'City',
        state: req.body.shippingAddress?.state || 'State',
        zipCode: req.body.shippingAddress?.zipCode || '12345',
        country: req.body.shippingAddress?.country || 'USA',
        phone: req.body.shippingAddress?.phone || '123-456-7890'
      },
      billingAddress: {
        firstName: req.body.billingAddress?.firstName || req.body.shippingAddress?.firstName || 'John',
        lastName: req.body.billingAddress?.lastName || req.body.shippingAddress?.lastName || 'Doe',
        street: req.body.billingAddress?.street || req.body.shippingAddress?.street || '123 Main St',
        city: req.body.billingAddress?.city || req.body.shippingAddress?.city || 'City',
        state: req.body.billingAddress?.state || req.body.shippingAddress?.state || 'State',
        zipCode: req.body.billingAddress?.zipCode || req.body.shippingAddress?.zipCode || '12345',
        country: req.body.billingAddress?.country || req.body.shippingAddress?.country || 'USA',
        phone: req.body.billingAddress?.phone || req.body.shippingAddress?.phone || '123-456-7890',
        isSameAsShipping: !req.body.billingAddress || JSON.stringify(req.body.billingAddress) === JSON.stringify(req.body.shippingAddress)
      },
      timeline: [{
        status: 'confirmed',
        note: 'Order created and payment completed',
        timestamp: new Date()
      }]
    };

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;
    
    // Create the order with orderNumber
    const order = new Order({
      ...orderData,
      orderNumber: orderNumber
    });
    
    console.log('Creating order with data:', {
      orderNumber: orderNumber,
      user: req.user._id,
      itemsCount: orderData.items.length,
      total: orderData.pricing.total,
      paymentStatus: orderData.payment.status
    });
    
    await order.save();
    
    console.log('Order saved successfully:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment.status
    });

    // Clear the cart
    console.log('Clearing cart for user:', req.user._id);
    if (cart && typeof cart.clearCart === 'function') {
      await cart.clearCart();
      console.log('Cart cleared using clearCart method');
    } else {
      // Fallback: manually clear cart items
      cart.items = [];
      cart.coupon = undefined;
      await cart.save();
      console.log('Cart cleared manually');
    }

    // Populate order for response
    await order.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'items.product', select: 'name price images' }
    ]);

    console.log('Sending success response for order:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.pricing.total,
      status: order.status,
      paymentStatus: order.payment.status
    });

    res.status(200).json({
      status: 'success',
      message: 'Demo payment successful',
      data: {
        order,
        payment: {
          transactionId: order.payment.transactionId,
          amount: order.pricing.total,
          status: order.payment.status,
          method: order.payment.method
        }
      }
    });
  } catch (error) {
    console.error('Cart demo payment error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      status: 'error',
      message: 'Demo payment failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/payments/appointment/:appointmentId
// @desc    Process appointment payment
// @access  Private
router.post('/appointment/:appointmentId', protect, checkActive, validateMongoId('appointmentId'), handleValidationErrors, async (req, res) => {
  try {
    const { paymentMethodId, paymentIntentId } = req.body;

    if (!paymentMethodId && !paymentIntentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment method ID or payment intent ID is required'
      });
    }

    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('doctor', 'consultationFee')
      .populate('patient', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user owns this appointment
    if (appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if appointment is already paid
    if (appointment.payment.status === 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Appointment is already paid'
      });
    }

    let paymentIntent;

    if (paymentIntentId) {
      // Confirm existing payment intent
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    } else {
      // Create and confirm new payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(appointment.payment.amount * 100),
        currency: 'lkr',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          type: 'appointment',
          appointmentId: appointment._id.toString(),
          userId: req.user._id.toString()
        }
      });
    }

    if (paymentIntent.status === 'succeeded') {
      // Update appointment payment status
      appointment.payment.status = 'paid';
      appointment.payment.paymentMethod = 'card';
      appointment.payment.transactionId = paymentIntent.id;
      appointment.payment.paidAt = new Date();
      appointment.status = 'confirmed';

      await appointment.save();

      // Populate appointment for notifications
      await appointment.populate([
        { path: 'patient', select: 'firstName lastName email phone' },
        { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
      ]);

      // Send payment success notification
      try {
        await NotificationService.sendPaymentSuccessNotification(appointment);
        await NotificationService.sendAppointmentConfirmationNotification(appointment);
      } catch (notificationError) {
        console.error('Payment notification failed:', notificationError);
      }

      res.status(200).json({
        status: 'success',
        message: 'Payment successful',
        data: {
          appointment,
          paymentIntent
        }
      });
    } else if (paymentIntent.status === 'requires_action') {
      res.status(200).json({
        status: 'requires_action',
        message: 'Payment requires additional authentication',
        data: {
          clientSecret: paymentIntent.client_secret
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Payment failed',
        data: { paymentIntent }
      });
    }
  } catch (error) {
    console.error('Process appointment payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Payment processing failed'
    });
  }
});

// @route   POST /api/payments/order
// @desc    Process order payment
// @access  Private
router.post('/order', protect, checkActive, async (req, res) => {
  try {
    const { paymentMethodId, shippingAddress, billingAddress } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment method ID is required'
      });
    }

    // Get user's cart
    const cart = await Cart.getCartWithProducts(req.user._id);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty'
      });
    }

    // Calculate total amount
    const subtotal = cart.subtotal;
    const tax = subtotal * 0.1; // 10% tax
    const shipping = 10; // Fixed shipping cost
    const total = subtotal + tax + shipping - cart.totalDiscount;

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;
    
    // Create order
    const order = await Order.create({
      orderNumber: orderNumber,
      user: req.user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price.current,
        name: item.product.name,
        image: item.product.primaryImage
      })),
      pricing: {
        subtotal,
        tax,
        shipping,
        discount: cart.totalDiscount,
        total
      },
      coupon: cart.coupon,
      shippingAddress: shippingAddress || cart.shippingAddress,
      billingAddress: billingAddress || cart.billingAddress,
      payment: {
        method: 'card',
        status: 'pending'
      },
      status: 'pending'
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        type: 'order',
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      }
    });

    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      order.payment.status = 'completed';
      order.payment.transactionId = paymentIntent.id;
      order.payment.paidAt = new Date();
      order.status = 'confirmed';

      await order.save();

      // Update product stock
      for (const item of cart.items) {
        await item.product.updateStock(item.quantity, 'subtract');
      }

      // Clear cart
      await cart.clearCart();

      res.status(200).json({
        status: 'success',
        message: 'Payment successful',
        data: {
          order,
          paymentIntent
        }
      });
    } else if (paymentIntent.status === 'requires_action') {
      res.status(200).json({
        status: 'requires_action',
        message: 'Payment requires additional authentication',
        data: {
          clientSecret: paymentIntent.client_secret,
          order
        }
      });
    } else {
      // Payment failed, delete order
      await Order.findByIdAndDelete(order._id);

      res.status(400).json({
        status: 'error',
        message: 'Payment failed',
        data: { paymentIntent }
      });
    }
  } catch (error) {
    console.error('Process order payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Payment processing failed'
    });
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Private
router.post('/refund', protect, checkActive, async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (!order.payment.transactionId) {
      return res.status(400).json({
        status: 'error',
        message: 'No payment transaction found'
      });
    }

    const refundAmount = amount || order.pricing.total;

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: order.payment.transactionId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        reason: reason || 'Customer requested refund'
      }
    });

    // Update order
    await order.processRefund(refundAmount, reason, req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Refund processed successfully',
      data: {
        refund,
        order
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Refund processing failed'
    });
  }
});

// @route   GET /api/payments/methods
// @desc    Get saved payment methods
// @access  Private
router.get('/methods', protect, checkActive, async (req, res) => {
  try {
    // Create customer if doesn't exist
    let customer;
    try {
      customer = await stripe.customers.retrieve(req.user._id.toString());
    } catch (error) {
      if (error.code === 'resource_missing') {
        customer = await stripe.customers.create({
          id: req.user._id.toString(),
          email: req.user.email,
          name: `${req.user.firstName} ${req.user.lastName}`
        });
      } else {
        throw error;
      }
    }

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card'
    });

    res.status(200).json({
      status: 'success',
      data: {
        paymentMethods: paymentMethods.data
      }
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment methods'
    });
  }
});

// @route   POST /api/payments/methods
// @desc    Save payment method
// @access  Private
router.post('/methods', protect, checkActive, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment method ID is required'
      });
    }

    // Create customer if doesn't exist
    let customer;
    try {
      customer = await stripe.customers.retrieve(req.user._id.toString());
    } catch (error) {
      if (error.code === 'resource_missing') {
        customer = await stripe.customers.create({
          id: req.user._id.toString(),
          email: req.user.email,
          name: `${req.user.firstName} ${req.user.lastName}`
        });
      } else {
        throw error;
      }
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment method saved successfully'
    });
  } catch (error) {
    console.error('Save payment method error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save payment method'
    });
  }
});

// @route   DELETE /api/payments/methods/:paymentMethodId
// @desc    Delete payment method
// @access  Private
router.delete('/methods/:paymentMethodId', protect, checkActive, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    res.status(200).json({
      status: 'success',
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete payment method'
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Update order or appointment based on metadata
      if (paymentIntent.metadata.type === 'order') {
        await Order.findByIdAndUpdate(paymentIntent.metadata.orderId, {
          'payment.status': 'completed',
          'payment.paidAt': new Date(),
          status: 'confirmed'
        });
      } else if (paymentIntent.metadata.type === 'appointment') {
        await Appointment.findByIdAndUpdate(paymentIntent.metadata.appointmentId, {
          'payment.status': 'paid',
          'payment.paidAt': new Date(),
          status: 'confirmed'
        });
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});


module.exports = router;
