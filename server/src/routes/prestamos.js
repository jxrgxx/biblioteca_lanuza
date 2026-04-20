const router = require("express").Router();
const auth = require("../middleware/auth");
const isPersonal = require("../middleware/isPersonal");
const ctrl = require("../controllers/prestamosController");

router.get("/", auth, isPersonal, ctrl.getAll);
router.get("/mis", auth, ctrl.getMisPrestamos);
router.get("/:id", auth, isPersonal, ctrl.getOne);
router.post("/", auth, isPersonal, ctrl.create);
router.put("/:id/devolver", auth, isPersonal, ctrl.devolver);
router.put("/:id", auth, isPersonal, ctrl.update);
router.delete("/:id", auth, isPersonal, ctrl.remove);

module.exports = router;
