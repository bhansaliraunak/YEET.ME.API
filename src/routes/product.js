const router = require("express").Router(),
  product_controller = require("./controllers/product.controller"),
  auth = require("./auth"),
  multer = require("multer");

const storage = multer.memoryStorage({
  destination: function (req, file, cb) {
    cb(null, "");
  },
});
const upload = multer({ storage }).single("file");

router.post("/create", auth.required, product_controller.createProduct);

router.get("/", auth.required, product_controller.getAllProduct);

router.get("/:id", auth.required, product_controller.getProductById);

router.put("/update/:id", auth.required, product_controller.updateProduct);

router.post("/upload", auth.required, upload, product_controller.uploadS3);

router.get("/upload/images", product_controller.fetchImagesS3);

module.exports = router;
