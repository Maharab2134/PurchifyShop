<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h1 style="color: #4f46e5; margin-top: 0;">Password Reset Request</h1>
        
        <p>Hello {{ $user->name }},</p>
        
        <p>You requested to reset your password. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetUrl }}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5; background-color: #f1f5f9; padding: 10px; border-radius: 4px;">{{ $resetUrl }}</p>
        
        <p style="color: #666; font-size: 14px;"><strong>This link will expire in 60 minutes.</strong></p>
        
        <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px; margin-bottom: 0;">
            Best regards,<br>
            {{ config('app.name', 'Ecommerce') }} Team
        </p>
    </div>
</body>
</html>
