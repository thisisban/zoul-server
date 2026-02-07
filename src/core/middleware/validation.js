const Joi = require('joi');
const { error } = require('../utils/responses');

module.exports = (schema) => {
  return (req, res, next) => {
    const { error: validationError } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (validationError) {
      const errors = validationError.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return error(res, 'Validation failed', 400, errors);
    }

    next();
  };
};