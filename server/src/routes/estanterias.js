const router = require('express').Router();
const auth = require('../middleware/auth');
const isPersonal = require('../middleware/isPersonal');
const ctrl = require('../controllers/estanteriasController');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, isPersonal, ctrl.create);
router.put('/:id', auth, isPersonal, ctrl.update);
router.delete('/:id', auth, isPersonal, ctrl.remove);

module.exports = router;
