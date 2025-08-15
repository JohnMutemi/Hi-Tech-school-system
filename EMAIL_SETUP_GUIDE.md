# 📧 Email Notification Setup Guide

## Database Migration & Backend Setup

### 1. **Database Schema**
✅ **Already Included**: The email notification tables are already defined in your Prisma schema:
- `EmailNotificationConfig` - Stores email provider settings per school
- `PaymentNotificationLog` - Tracks all email notifications sent

### 2. **Run Migration (If Needed)**
If the tables don't exist in your database, run:

```bash
# Apply the migration
npx prisma migrate dev --name add_email_notifications

# Or for production
npx prisma migrate deploy
```

### 3. **Setup Email Configurations for Existing Schools**
Run the setup script to create default email configurations:

```bash
node scripts/setup-email-notifications.js
```

This will:
- Create email configurations for all schools (disabled by default)
- Set Gmail as the default provider
- Use school email/name as defaults

### 4. **Environment Variables**
Add to your `.env.local`:

```env
# Required for receipt download URLs
NEXT_PUBLIC_BASE_URL=https://your-domain.com
# For development:
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Gmail SMTP Configuration

### 1. **Google Account Setup**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled
4. Go to **Security** → **2-Step Verification** → **App passwords**
5. Generate an app password for "Mail"
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### 2. **School Portal Configuration**
1. Login to School Portal as admin
2. Go to **Settings** → **Email Notifications**
3. Select **Gmail SMTP** as provider
4. Enter:
   - **Gmail Address**: Your school's Gmail (e.g., `payments@yourschool.com`)
   - **App Password**: The 16-character password from step 1
   - **From Name**: Your school name (e.g., "Springfield High School")
5. Enable **Payment Confirmations** and **Receipt Attachments**
6. Click **Save Configuration**
7. Test with **Send Test Email**

## Testing & Verification

### 1. **Test Email Configuration**
```bash
# Run the test script
node scripts/test-email-setup.js
```

### 2. **Manual Testing**
1. Go to Bursar Dashboard
2. Record a test payment for a student with parent email
3. Check the parent's email inbox
4. Verify:
   - Email received within seconds
   - Professional formatting
   - Receipt download link works
   - PDF receipt generates correctly

### 3. **Monitor Email Logs**
Check the `PaymentNotificationLog` table in your database:
```sql
SELECT * FROM "PaymentNotificationLog" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

## Supported Email Providers

### 1. **Gmail SMTP (Recommended)**
- **Cost**: FREE
- **Limit**: 2,000 emails/day
- **Setup**: Simple with app passwords
- **Reliability**: 99.9% delivery rate

### 2. **SendGrid**
- **Cost**: Free tier (100 emails/day), paid plans available
- **Setup**: API key required
- **Features**: Advanced analytics

### 3. **Amazon SES**
- **Cost**: Pay-per-email (very low cost)
- **Setup**: AWS credentials required
- **Features**: High volume support

### 4. **Custom SMTP**
- **Cost**: Depends on provider
- **Setup**: Manual SMTP configuration
- **Use**: For existing email infrastructure

## Email Features

### ✅ **What's Included**
- Instant notifications on every payment
- Professional branded templates
- Complete payment details
- Balance information (before/after)
- Direct PDF receipt download links
- Mobile-responsive design
- Error handling and retry logic
- Comprehensive logging

### 📧 **Email Content**
- Payment amount (prominently displayed)
- Student name and details
- Receipt number and date
- Payment method and reference
- Academic year and term
- Remaining balance
- School branding and contact info

## Troubleshooting

### Common Issues

**1. Emails not sending**
- Check email configuration is enabled
- Verify Gmail app password is correct
- Check email provider credentials
- Review notification logs for errors

**2. Receipt download not working**
- Verify `NEXT_PUBLIC_BASE_URL` is set correctly
- Check receipt exists in database
- Ensure jsPDF is installed: `npm install jspdf`

**3. Gmail authentication errors**
- Ensure 2-Step Verification is enabled
- Generate new app password
- Use exact 16-character password (with spaces)
- Check Gmail security settings

### Debug Steps

**1. Check Email Configuration**
```javascript
// In browser console on school portal
fetch('/api/schools/YOUR_SCHOOL_CODE/email-config')
  .then(r => r.json())
  .then(console.log)
```

**2. Check Payment Logs**
```sql
SELECT p.*, s.parentEmail, u.name 
FROM "Payment" p
JOIN "Student" s ON p."studentId" = s.id
JOIN "User" u ON s."userId" = u.id
WHERE p."createdAt" > NOW() - INTERVAL '1 day'
ORDER BY p."createdAt" DESC;
```

**3. Test Email Service**
Use the test email feature in School Portal settings.

## Security Notes

- Gmail app passwords are secure and recommended
- Email configurations are stored encrypted
- Receipt URLs are school-validated
- No sensitive payment data in email logs
- Automatic retry for failed deliveries

## Production Checklist

- [ ] Database migration applied
- [ ] Email configurations created for all schools
- [ ] Gmail SMTP configured and tested
- [ ] `NEXT_PUBLIC_BASE_URL` set correctly
- [ ] Test payments send emails successfully
- [ ] Receipt downloads work properly
- [ ] Email logs show successful delivery
- [ ] Parent feedback confirms receipt

---

**🎉 Your email notification system is now ready for production use!**






