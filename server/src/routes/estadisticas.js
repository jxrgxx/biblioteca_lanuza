const router = require('express').Router();
const auth = require('../middleware/auth');
const isPersonal = require('../middleware/isPersonal');
const ctrl = require('../controllers/estadisticasController');

router.get('/resumen',               auth, isPersonal, ctrl.resumen);
router.get('/libros-top',            auth, isPersonal, ctrl.librosTop);
router.get('/prestamos-por-mes',     auth, isPersonal, ctrl.prestamosPorMes);
router.get('/prestamos-por-curso',   auth, isPersonal, ctrl.prestamosPorCurso);
router.get('/alumnos-top',           auth, isPersonal, ctrl.alumnosTop);
router.get('/libros-nunca-prestados',auth, isPersonal, ctrl.librosNuncaPrestados);
router.get('/tasa-devolucion',       auth, isPersonal, ctrl.tasaDevolucion);
router.get('/tiempo-medio',          auth, isPersonal, ctrl.tiempoMedio);
router.get('/alumnos-morosos',       auth, isPersonal, ctrl.alumnosMorosos);
router.get('/registro-por-mes',      auth, isPersonal, ctrl.registroPorMes);
router.get('/cursos-top',            auth, isPersonal, ctrl.cursosTop);
router.get('/dia-semana',            auth, isPersonal, ctrl.diaSemana);

module.exports = router;
