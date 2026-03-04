Hello {{ $user->name }},

You requested to reset your password. Click the link below to reset it:

{{ $resetUrl }}

This link will expire in 60 minutes.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
{{ config('app.name', 'Ecommerce') }} Team
