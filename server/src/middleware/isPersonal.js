const ROLES_GESTION = ['biblioteca'];

module.exports = (req, res, next) => {
  if (!ROLES_GESTION.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso restringido' });
  }
  next();
};
