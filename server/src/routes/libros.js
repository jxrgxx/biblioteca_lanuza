const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");
const isPersonal = require("../middleware/isPersonal");
const ctrl = require("../controllers/librosController");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/", auth, ctrl.getAll);
router.get("/:id", auth, ctrl.getOne);
router.post("/", auth, isPersonal, ctrl.create);
router.put("/:id", auth, isPersonal, ctrl.update);
router.delete("/:id", auth, isPersonal, ctrl.remove);
router.post(
  "/:id/foto",
  auth,
  isPersonal,
  upload.single("foto"),
  ctrl.uploadFoto,
);

module.exports = router;
