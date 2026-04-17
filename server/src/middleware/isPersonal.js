module.exports = (req, res, next) => {
  if (req.user?.rol !== 'personal') {
    return res.status(403).json({ error: 'Acceso restringido al personal' });
  }
  next();
};
