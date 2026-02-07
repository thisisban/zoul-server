const express = require('express');
const router = express.Router();
const authController = require('../../../src/modules/auth/controller');
const validation = require('../../../src/modules/auth/validation');
const validate = require('../../../src/core/middleware/validation');
const authMiddleware = require('../../../src/core/middleware/auth');

router.post('/register', validate(validation.registerSchema), authController.register);
router.post('/login', validate(validation.loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', validate(validation.refreshSchema), authController.refresh);

module.exports = router;