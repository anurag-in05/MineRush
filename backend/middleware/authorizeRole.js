function authorizeRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(403).json({ error: 'Role not found in token' });
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        return next();
    };
}

module.exports = authorizeRole;
