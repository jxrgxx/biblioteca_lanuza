const router = require('express').Router();
const auth = require('../middleware/auth');
const isPersonal = require('../middleware/isPersonal');
const ctrl = require('../controllers/estadisticasController');

router.get('/resumen',           auth, isPersonal, ctrl.resumen);
router.get('/libros-top',        auth, isPersonal, ctrl.librosTop);
router.get('/prestamos-por-mes', auth, isPersonal, ctrl.prestamosPorMes);
router.get('/alumnos-top',       auth, isPersonal, ctrl.alumnosTop);
router.get('/registro-por-mes',  auth, isPersonal, ctrl.registroPorMes);
router.get('/cursos-top',        auth, isPersonal, ctrl.cursosTop);

module.exports = router;
