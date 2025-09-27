# Admin Setup Guide

This guide explains how to set up an admin user for the Nature Pulse platform.

## Overview

The admin registration page has been removed for security reasons. Instead, admin users are created using a seeding script that creates a default admin account.

## Creating an Admin User

### Method 1: Using npm script (Recommended)

```bash
cd Backend
npm run seed-admin
```

### Method 2: Direct execution

```bash
cd Backend
node seedadmin.js
```

### Method 3: Using PowerShell (Windows)

```powershell
cd Backend
.\run-seedadmin.ps1
```

### Method 4: Using Node.js wrapper

```bash
cd Backend
node run-seedadmin.js
```

## Default Admin Credentials

After running the seed script, you can login with these credentials:

- **Email**: `admin@naturepulse.com`
- **Password**: `admin123`

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change the default password** immediately after first login
2. **Update the admin email** to a real email address
3. **Delete or secure the seedadmin.js file** in production
4. **Use environment variables** for admin credentials in production

## Customizing Admin Credentials

To create an admin with custom credentials, modify the `seedadmin.js` file:

```javascript
// Change these values in seedadmin.js
const adminEmail = 'your-admin@email.com';
const adminPassword = 'your-secure-password';
const adminFirstName = 'Your';
const adminLastName = 'Name';
```

## Troubleshooting

### Database Connection Issues
- Ensure MongoDB is running
- Check your `config.env` file has correct `MONGODB_URI`
- Verify network connectivity

### Permission Issues
- Ensure you have write permissions to the database
- Check if the user role is properly set to 'admin'

### Duplicate Admin
- The script checks for existing admins and won't create duplicates
- If you need to reset, delete the existing admin user from the database first

## Production Deployment

For production environments:

1. **Never use default credentials**
2. **Use strong, unique passwords**
3. **Consider using environment variables for admin setup**
4. **Implement proper admin user management**
5. **Remove or secure the seeding scripts**

## Admin Features

Once logged in as admin, you have access to:

- User management
- Doctor management
- Appointment oversight
- Product catalog management
- Order management
- Analytics and reporting
- System settings
- Content moderation

## Support

If you encounter issues with admin setup, check:

1. Database connection
2. Environment configuration
3. User permissions
4. Application logs

For additional support, contact the development team.
