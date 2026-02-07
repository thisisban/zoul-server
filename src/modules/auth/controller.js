const authService = require('./service');
const { success, error } = require('../../core/utils/responses');

class AuthController {
  async register(req, res, next) {
    try {
      const userData = req.body;
      const result = await authService.register(userData);
      success(res, result, 'User registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      
      const result = await authService.login(username, password, ipAddress, userAgent);
      success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const sessionId = req.sessionId;
      await authService.logout(sessionId);
      success(res, null, 'Logout successful');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      success(res, result, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();