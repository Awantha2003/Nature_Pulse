# Stripe Payment Setup

This application uses Stripe for payment processing. To enable payments, you need to configure your Stripe publishable key.

## Setup Instructions

### 1. Get Your Stripe Keys

1. Sign up for a [Stripe account](https://stripe.com) if you don't have one
2. Go to the [Stripe Dashboard](https://dashboard.stripe.com)
3. Navigate to **Developers** > **API keys**
4. Copy your **Publishable key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)

### 2. Configure Environment Variables

1. Create a `.env` file in the `Frontend` directory
2. Add your Stripe publishable key:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Restart the Development Server

After creating the `.env` file, restart your React development server:

```bash
cd Frontend
npm start
```

## Test Mode vs Live Mode

- **Test Mode**: Use keys starting with `pk_test_` for development and testing
- **Live Mode**: Use keys starting with `pk_live_` for production (requires Stripe account verification)

## Troubleshooting

### Error: "Failed to load Stripe.js"

This error occurs when:
1. The `REACT_APP_STRIPE_PUBLISHABLE_KEY` environment variable is not set
2. The key is invalid or malformed
3. There are network connectivity issues

**Solutions:**
1. Verify your `.env` file exists in the `Frontend` directory
2. Check that the key starts with `pk_test_` or `pk_live_`
3. Ensure there are no extra spaces or quotes around the key
4. Restart the development server after making changes

### Payment Form Not Showing

If the payment form shows a warning message instead of the Stripe form:
1. Check the browser console for any error messages
2. Verify your Stripe key is correctly set
3. Ensure your backend is running and accessible

## Security Notes

- Never commit your `.env` file to version control
- Use test keys for development
- Only use live keys in production after proper verification
- The publishable key is safe to use in frontend code
- Keep your secret key (starts with `sk_`) secure and only use it in backend code

## HTTPS Warning in Development

When running in development mode (HTTP), you may see this warning in the browser console:
```
You may test your Stripe.js integration over HTTP. However, live Stripe.js integrations must use HTTPS.
```

This is normal and expected for development. In production, ensure your application is served over HTTPS to avoid this warning and meet Stripe's security requirements.