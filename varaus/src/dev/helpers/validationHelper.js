/**
 * Pure validation functions for registration form.
 * Extracted from Register component for testability.
 */

const EMAIL_PATTERN = /(.+)@(.+){2,}\.(.+){2,}/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Validate email matches a valid email pattern.
 * @param {string} email
 * @returns {string|null} Error message or null if valid
 */
function validateEmail(email) {
  if (!EMAIL_PATTERN.test(email)) {
    return 'Sähköpostiosoite on väärässä muodossa.';
  }
  return null;
}

/**
 * Validate password is present and at least 6 characters long.
 * @param {string} password
 * @returns {string|null} Error message or null if valid
 */
function validatePassword(password) {
  if (!password) {
    return 'Pakollinen kenttä.';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'Salasanan on oltava vähintään 6 merkkiä pitkä.';
  }
  return null;
}

/**
 * Validate that a required field is present.
 * @param {string} value
 * @param {string} _fieldName - unused, kept for API consistency
 * @returns {string|null} Error message or null if valid
 */
function validateRequired(value, _fieldName) {
  if (!value) {
    return 'Pakollinen kenttä.';
  }
  return null;
}

/**
 * Validate that the terms checkbox is checked.
 * @param {boolean} accepted
 * @returns {string|null} Error message or null if valid
 */
function validateTerms(accepted) {
  if (!accepted) {
    return 'Sinun tulee hyväksyä käyttöehdot.';
  }
  return null;
}

/**
 * Validate all registration form fields.
 * Returns an errors object compatible with redux-form.
 * @param {Object} values - Form values { email, password, firstName, lastName, terms }
 * @returns {Object} Errors object keyed by field name
 */
function validateRegistration(values) {
  const errors = {};

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;

  const firstNameError = validateRequired(values.firstName, 'firstName');
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateRequired(values.lastName, 'lastName');
  if (lastNameError) errors.lastName = lastNameError;

  const termsError = validateTerms(values.terms);
  if (termsError) errors.terms = termsError;

  return errors;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRequired,
  validateTerms,
  validateRegistration,
  EMAIL_PATTERN,
  MIN_PASSWORD_LENGTH
};
