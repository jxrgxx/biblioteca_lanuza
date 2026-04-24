const router = require('express').Router();
const auth = require('../middleware/auth');
const isPersonal = require('../middleware/isPersonal');
const ctrl = require('../controllers/configController');

router.get('/codigo-registro', auth, isPersonal, ctrl.getCodigo);
router.post('/codigo-registro', auth, isPersonal, ctrl.generarCodigo);

module.exports = router;
