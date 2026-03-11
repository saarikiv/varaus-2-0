// Feature: varaus, Property 3: Registration validation completeness
// Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5

import { expect } from 'chai';
import validationHelper from '../../src/dev/helpers/validationHelper.js';

const {
  validateEmail,
  validatePassword,
  validateRequired,
  validateTerms,
  validateRegistration,
  EMAIL_PATTERN,
  MIN_PASSWORD_LENGTH
} = validationHelper;

describe('Property 3: Registration validation completeness', function () {

  describe('validateEmail', function () {
    // **Validates: Requirement 4.1**

    it('returns null for a valid email', function () {
      expect(validateEmail('user@example.com')).to.be.null;
    });

    it('returns null for email with subdomain', function () {
      expect(validateEmail('user@mail.example.com')).to.be.null;
    });

    it('returns error for email without @', function () {
      expect(validateEmail('userexample.com')).to.equal('Sähköpostiosoite on väärässä muodossa.');
    });

    it('returns error for email without domain', function () {
      expect(validateEmail('user@')).to.equal('Sähköpostiosoite on väärässä muodossa.');
    });

    it('returns error for empty string', function () {
      expect(validateEmail('')).to.equal('Sähköpostiosoite on väärässä muodossa.');
    });
  });

  describe('validatePassword', function () {
    // **Validates: Requirement 4.2**

    it('returns null for password with 6+ characters', function () {
      expect(validatePassword('abcdef')).to.be.null;
    });

    it('returns null for long password', function () {
      expect(validatePassword('securepassword123')).to.be.null;
    });

    it('returns required error for empty string', function () {
      expect(validatePassword('')).to.equal('Pakollinen kenttä.');
    });

    it('returns required error for undefined', function () {
      expect(validatePassword(undefined)).to.equal('Pakollinen kenttä.');
    });

    it('returns too-short error for password under 6 chars', function () {
      expect(validatePassword('abc')).to.equal('Salasanan on oltava vähintään 6 merkkiä pitkä.');
    });

    it('returns too-short error for password of exactly 5 chars', function () {
      expect(validatePassword('abcde')).to.equal('Salasanan on oltava vähintään 6 merkkiä pitkä.');
    });
  });

  describe('validateRequired', function () {
    // **Validates: Requirement 4.3**

    it('returns null for non-empty string', function () {
      expect(validateRequired('Matti')).to.be.null;
    });

    it('returns error for empty string', function () {
      expect(validateRequired('')).to.equal('Pakollinen kenttä.');
    });

    it('returns error for undefined', function () {
      expect(validateRequired(undefined)).to.equal('Pakollinen kenttä.');
    });

    it('returns error for null', function () {
      expect(validateRequired(null)).to.equal('Pakollinen kenttä.');
    });
  });

  describe('validateTerms', function () {
    // **Validates: Requirement 4.4**

    it('returns null when terms accepted (true)', function () {
      expect(validateTerms(true)).to.be.null;
    });

    it('returns error when terms not accepted (false)', function () {
      expect(validateTerms(false)).to.equal('Sinun tulee hyväksyä käyttöehdot.');
    });

    it('returns error when terms undefined', function () {
      expect(validateTerms(undefined)).to.equal('Sinun tulee hyväksyä käyttöehdot.');
    });
  });

  describe('validateRegistration', function () {
    // **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

    const validValues = {
      email: 'user@example.com',
      password: 'abcdef',
      firstName: 'Matti',
      lastName: 'Meikäläinen',
      terms: true
    };

    it('returns empty errors object when all fields are valid', function () {
      const errors = validateRegistration(validValues);
      expect(errors).to.deep.equal({});
    });

    it('returns errors for all fields when all are invalid', function () {
      const errors = validateRegistration({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        terms: false
      });
      expect(errors).to.have.property('email');
      expect(errors).to.have.property('password');
      expect(errors).to.have.property('firstName');
      expect(errors).to.have.property('lastName');
      expect(errors).to.have.property('terms');
    });

    it('returns error only for failing fields (partial validity)', function () {
      const errors = validateRegistration({
        email: 'user@example.com',
        password: 'abc',           // too short
        firstName: 'Matti',
        lastName: '',              // missing
        terms: true
      });
      expect(errors).to.not.have.property('email');
      expect(errors).to.have.property('password');
      expect(errors).to.not.have.property('firstName');
      expect(errors).to.have.property('lastName');
      expect(errors).to.not.have.property('terms');
    });
  });

  describe('exported constants', function () {
    it('EMAIL_PATTERN is a RegExp', function () {
      expect(EMAIL_PATTERN).to.be.instanceOf(RegExp);
    });

    it('MIN_PASSWORD_LENGTH is 6', function () {
      expect(MIN_PASSWORD_LENGTH).to.equal(6);
    });
  });
});
