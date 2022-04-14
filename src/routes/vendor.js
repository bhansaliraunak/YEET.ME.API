const router = require("express").Router(),
  vendor_controller = require("./controllers/vendor.controller"),
  auth = require("./auth");

router.post(
  "/googleOAuth",
  auth.optional,
  vendor_controller.googleOAuthorization
);

router.get("/", auth.required, vendor_controller.getAllVendors);

router.get("/:id", auth.required, vendor_controller.getVendorById);

router.put("/update/:id", auth.required, vendor_controller.updateVendor);

router.post("/feedback", auth.optional, vendor_controller.sendFeedback);

module.exports = router;
