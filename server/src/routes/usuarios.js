const router = require('express').Router();
const auth = require('../middleware/auth');
const isPersonal = require('../middleware/isPersonal');
const ctrl = require('../controllers/usuariosController');

router.get('/', auth, isPersonal, ctrl.getAll);
router.get('/:id', auth, isPersonal, ctrl.getOne);
router.post('/subida-de-curso', auth, isPersonal, ctrl.subidaDeCurso);
router.patch('/:id/activo', auth, isPersonal, ctrl.toggleActivo);
router.get('/:id/prestamos-count', auth, isPersonal, ctrl.prestamosCount);
router.post('/', auth, isPersonal, ctrl.create);
router.put('/:id', auth, isPersonal, ctrl.update);
router.delete('/:id', auth, isPersonal, ctrl.remove);

module.exports = router;
