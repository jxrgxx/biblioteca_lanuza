const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const isPersonal = require('../middleware/isPersonal');
const ctrl = require('../controllers/actividadesController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `actividad_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/enums', ctrl.getEnums);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', auth, isPersonal, ctrl.create);
router.put('/:id', auth, isPersonal, ctrl.update);
router.delete('/:id', auth, isPersonal, ctrl.remove);
router.post('/:id/fotos', auth, isPersonal, upload.single('foto'), ctrl.uploadFoto);
router.delete('/:id/fotos/:fotoId', auth, isPersonal, ctrl.deleteFoto);

module.exports = router;
