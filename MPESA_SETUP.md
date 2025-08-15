# M-PESA Integration Setup for SaaS Platform

## Overview
This is a **Software as a Service (SaaS)** platform where each school configures their own M-PESA credentials. The platform provides the payment infrastructure while schools maintain their own merchant accounts.

## Environment Variables Required (Platform Level)

Add these to your `.env` file for the platform:

```env
# Your Daraja API credentials (for platform access)
DARAJA_CONSUMER_KEY=GCVRNFZmYKGhptfaSxrJy1o4aBErLfQmvJla4gKdziKcWxZK
DARAJA_CONSUMER_SECRET=rQGB4YyOXo6cXFhaUrEPx8dG5UVfprLk0AwkyghAfGXpazS8tT4ZT7g3QvMOscXo

# Environment (sandbox or production)
DARAJA_ENVIRONMENT=sandbox
```

## School Setup Process

### For School Administrators

#### 1. M-PESA STK Push (Recommended)
**Best for:** Schools wanting automatic payment verification and instant receipts

**Setup Steps:**
1. Get a paybill number from Safaricom
2. Register for **Lipa Na M-PESA Online** service
3. Get your Business Short Code and Passkey from Safaricom
4. In the school dashboard:
   - Go to "M-PESA Payment Setup"
   - Click "Add M-PESA Method"
   - Select "M-PESA STK Push (Recommended)"
   - Enter your Business Short Code and Passkey
   - Add an optional Account Reference Prefix (e.g., "SCHOOL_FEES")
   - Save

**Benefits:**
- ✅ Automatic payment verification
- ✅ Instant receipts for parents
- ✅ No manual intervention required
- ✅ Professional payment experience

#### 2. M-PESA Paybill (Manual)
**Best for:** Schools with existing paybill numbers who prefer manual verification

**Setup Steps:**
1. Get a paybill number from Safaricom
2. In the school dashboard:
   - Select "M-PESA Paybill (Manual)"
   - Enter your Business Short Code
   - Optionally set an Account Number
   - Save

**Note:** Parents will need to send M-PESA confirmation messages to the school for verification.

#### 3. M-PESA Till Number (Manual)
**Best for:** Schools with till numbers for Buy Goods and Services

**Setup Steps:**
1. Get a till number from Safaricom
2. In the school dashboard:
   - Select "M-PESA Till Number (Manual)"
   - Enter your Till Number and Business Name
   - Save

**Note:** Parents will need to send M-PESA confirmation messages to the school for verification.

## How It Works

### For STK Push Payments:
1. **Parent initiates payment** on the platform
2. **STK Push notification** sent to parent's phone
3. **Parent enters M-PESA PIN** to complete payment
4. **Automatic verification** via M-PESA callbacks
5. **Instant receipt** generated and sent to parent
6. **Payment recorded** in school's system

### For Manual Payments:
1. **Parent gets instructions** on how to pay
2. **Parent makes payment** using M-PESA
3. **Parent sends confirmation** to school
4. **School verifies payment** manually
5. **Payment recorded** in school's system

## School Benefits

- 🏫 **Own Merchant Account**: Each school maintains their own M-PESA account
- 🔐 **Secure**: API credentials encrypted and stored securely
- 📱 **Professional**: Enterprise-grade payment processing
- 📊 **Reporting**: Comprehensive payment reports and analytics
- 🎯 **Flexible**: Choose between automatic and manual verification
- 💰 **Cost Effective**: No additional platform fees beyond M-PESA charges

## Platform Benefits

- 🌐 **Multi-Tenant**: Supports unlimited number of schools
- 🛡️ **Secure**: Centralized security and compliance
- 📈 **Scalable**: Easy to add new schools and features
- 🔧 **Maintainable**: Single codebase for all schools
- 📊 **Analytics**: Platform-wide insights and reporting

## Getting M-PESA Credentials

### For STK Push (Recommended):
1. Visit any Safaricom shop or contact Safaricom Business
2. Apply for a paybill number
3. Register for **Lipa Na M-PESA Online** service
4. Get your Business Short Code and Passkey
5. Test with small amounts first

### For Manual Methods:
1. Visit any Safaricom shop
2. Apply for paybill number or till number
3. Get your Business Short Code or Till Number
4. Start accepting payments

## Testing

1. Set `DARAJA_ENVIRONMENT=sandbox` for testing
2. Use Safaricom's test phone numbers and amounts
3. Test all payment flows before going live
4. Switch to `production` when ready

## Support

For platform issues:
- Check environment variables are correctly set
- Verify Daraja API credentials are active
- Review server logs for error details

For school setup issues:
- Ensure school has valid M-PESA credentials
- Verify Business Short Code and Passkey are correct
- Check that Lipa Na M-PESA Online is activated

## Security Notes

- All M-PESA credentials are encrypted in the database
- Passwords are never displayed in plain text
- Each school's payments are isolated
- Platform has no access to school's M-PESA funds
- All API calls are logged for security auditing
