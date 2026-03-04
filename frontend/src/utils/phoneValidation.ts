/**
 * Validates Bangladeshi phone number (exactly 11 digits, numbers only)
 * @param value - Phone number string
 * @returns true if valid, false otherwise
 */
export function isValidBangladeshiPhone(value: string): boolean {
  if (!value) return false
  // Remove any non-digit characters
  const digitsOnly = value.replace(/\D/g, '')
  // Must be exactly 11 digits and start with 01
  return /^01\d{9}$/.test(digitsOnly)
}

/**
 * Formats phone number input to only allow digits and limit to 11 digits
 * @param value - Input value
 * @returns Formatted value (digits only, max 11)
 */
export function formatPhoneInput(value: string): string {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '')
  // Limit to 11 digits
  return digitsOnly.slice(0, 11)
}

/**
 * Validation rule for react-hook-form
 */
export const phoneValidationRule = {
  required: 'Phone number is required',
  validate: (value: string) => {
    if (!value) return 'Phone number is required'
    const formatted = formatPhoneInput(value)
    if (formatted.length !== 11) {
      return 'Phone number must be exactly 11 digits'
    }
    if (!/^01\d{9}$/.test(formatted)) {
      return 'Phone number must start with 01'
    }
    return true
  },
}

/**
 * Validation rule for sender number (same as phone)
 */
export const senderNumberValidationRule = {
  required: 'Sending number is required',
  validate: (value: string) => {
    if (!value) return 'Sending number is required'
    const formatted = formatPhoneInput(value)
    if (formatted.length !== 11) {
      return 'Sending number must be exactly 11 digits'
    }
    if (!/^01\d{9}$/.test(formatted)) {
      return 'Sending number must start with 01'
    }
    return true
  },
}
