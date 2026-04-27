const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.put('/cambiar-password', auth, ctrl.cambiarPassword);

module.exports = router;
