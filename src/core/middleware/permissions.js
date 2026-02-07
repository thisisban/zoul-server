const { checkPermission } = require('../utils/permissions');
const { error } = require('../utils/responses');

module.exports = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId || null;
      const hasPermission = await checkPermission(userId, requiredPermission);
      
      if (!hasPermission) {
        return error(res, 'Forbidden', 403);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};