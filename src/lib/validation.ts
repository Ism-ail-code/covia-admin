/**
 * Covia Admin Validation — form validation schemas and helpers.
 */

export type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

export type FieldValidation = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: ValidationRule<any>;
};

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

/** Validate a single field value. */
export function validateField(
  value: unknown,
  rules: FieldValidation,
  fieldName: string,
): string | null {
  if (rules.required && (!value || (typeof value === "string" && !value.trim()))) {
    return `${fieldName} is required.`;
  }
  if (typeof value === "string") {
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters.`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be at most ${rules.maxLength} characters.`;
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} format is invalid.`;
    }
  }
  if (rules.custom && !rules.custom.validate(value)) {
    return rules.custom.message;
  }
  return null;
}

/** Validate multiple fields. */
export function validateFields(
  data: Record<string, unknown>,
  schema: Record<string, FieldValidation & { label?: string }>,
): ValidationResult {
  const errors: Record<string, string> = {};
  for (const [field, rules] of Object.entries(schema)) {
    const label = rules.label ?? field.charAt(0).toUpperCase() + field.slice(1);
    const error = validateField(data[field], rules, label);
    if (error) errors[field] = error;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Common validation patterns. */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[()\d\s.-]{7,20}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  name: /^[a-zA-Z\s'-]+$/,
} as const;
