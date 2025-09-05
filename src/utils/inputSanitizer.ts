import DOMPurify from 'dompurify';

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Name validation (no special characters except spaces, hyphens, apostrophes)
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(name) && name.trim().length > 0;
};

// Amount validation (positive numbers with up to 2 decimal places)
export const isValidAmount = (amount: string): boolean => {
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
};

// Sanitize HTML content (removes scripts, dangerous attributes)
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: []
  });
};

// Sanitize plain text (removes HTML tags, scripts)
export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

// Sanitize and validate input based on type
export const validateAndSanitizeInput = (
  value: string, 
  type: 'email' | 'phone' | 'name' | 'amount' | 'text' | 'html'
): { isValid: boolean; sanitized: string; error?: string } => {
  let sanitized = value.trim();
  let isValid = true;
  let error: string | undefined;

  switch (type) {
    case 'email':
      sanitized = sanitizeText(sanitized).toLowerCase();
      if (!isValidEmail(sanitized)) {
        isValid = false;
        error = 'Please enter a valid email address';
      }
      break;
      
    case 'phone':
      sanitized = sanitizeText(sanitized);
      if (!isValidPhone(sanitized)) {
        isValid = false;
        error = 'Please enter a valid phone number';
      }
      break;
      
    case 'name':
      sanitized = sanitizeText(sanitized);
      if (!isValidName(sanitized)) {
        isValid = false;
        error = 'Name can only contain letters, spaces, hyphens, and apostrophes';
      }
      break;
      
    case 'amount':
      sanitized = sanitizeText(sanitized);
      if (!isValidAmount(sanitized)) {
        isValid = false;
        error = 'Please enter a valid amount (positive number with up to 2 decimal places)';
      }
      break;
      
    case 'html':
      sanitized = sanitizeHtml(sanitized);
      break;
      
    case 'text':
    default:
      sanitized = sanitizeText(sanitized);
      break;
  }

  return { isValid, sanitized, error };
};

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};