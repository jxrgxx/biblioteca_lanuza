const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');
const resetCtrl = require('../controllers/passwordResetController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.put('/cambiar-password', auth, ctrl.cambiarPassword);
router.post('/forgot-password', resetCtrl.solicitarReset);
router.post('/reset-password', resetCtrl.resetearPassword);

module.exports = router;
