/**
 * Role-Based Access Control (RBAC) Middleware Factory
 * Restricts access to routes based on user role.
 * @param  {...string} allowedRoles - Roles permitted to access the route (e.g. 'Admin')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated and attached by protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required before role check.'
      });
    }

    // Check if user's role exists within allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
