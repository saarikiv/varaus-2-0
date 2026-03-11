/**
 * Validates that required fields are present in the request body.
 * Returns an array of missing/invalid field descriptions.
 * If the array is empty, validation passed.
 *
 * @param {object} body - The request body to validate
 * @param {Array<{field: string, type: string}>} rules - Validation rules
 *   field: dot-notation path (e.g. "slotInfo.key")
 *   type: expected typeof value ("string", "number", "object")
 * @returns {string[]} Array of error messages for invalid fields
 */
function validateBody(body, rules) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Request body is missing or not an object'];
  }
  for (const rule of rules) {
    const parts = rule.field.split('.');
    let value = body;
    let valid = true;
    for (const part of parts) {
      if (value == null || typeof value !== 'object') {
        valid = false;
        break;
      }
      value = value[part];
    }
    if (!valid || value === undefined || value === null) {
      errors.push(`Missing required field: ${rule.field}`);
    } else if (rule.type && typeof value !== rule.type) {
      errors.push(`Field '${rule.field}' must be of type ${rule.type}, got ${typeof value}`);
    }
  }
  return errors;
}

module.exports = { validateBody };
