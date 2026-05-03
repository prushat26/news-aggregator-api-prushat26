const Joi = require('joi');

const schemas = {
    // Registration: Strict email and password requirements
    register: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address.',
            'any.required': 'Email is a required field.'
        }),
        password: Joi.string().min(8).max(30).required().messages({
            'string.min': 'Password must be at least 8 characters long.',
            'any.required': 'Password is required.'
        })
    }),

    // Preferences: Ensuring categories and languages are arrays of strings
    preferences: Joi.object({
        categories: Joi.array().items(Joi.string().uppercase().max(50)).unique().required(),
        languages: Joi.array().items(Joi.string().length(2).lowercase()).unique().required()
    })
};

const validate = (schemaName) => {
    return (req, res, next) => {
        const { error } = schemas[schemaName].validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({ status: 'Validation Error', errors });
        }
        next();
    };
};

module.exports = { validate };