/**
 * Validation regular expressions and rules matching backend Auth API standards
 * (Reference: AUTH_API_DOCUMENTATION.md)
 */

// Password: >=8 chars, >=1 uppercase, >=1 lowercase, >=1 digit, >=1 special character
export const PASSWORD_REGEX = /^(?=(.*[0-9]))(?=.*[!@#$%^&*()[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,}$/

// Phone number: International or local format with optional leading +, digits, spaces, dashes
export const PHONE_NUMBER_REGEX = /^\+?[0-9\s\-]+$/

// Login identifier phone number pattern (7 to 15 digits/symbols)
export const IDENTIFIER_PHONE_REGEX = /^\+?[0-9\s\-]{7,15}$/

// 6-digit numeric OTP code
export const OTP_REGEX = /^\d{6}$/

// 64-character hexadecimal reset token
export const RESET_TOKEN_HEX_REGEX = /^[a-fA-F0-9]{64}$/
