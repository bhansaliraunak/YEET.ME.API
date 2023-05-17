const router = require("express").Router(),
  customer_controller = require("./controllers/customer.controller"),
  auth = require("./auth");

var guard = require("express-jwt-permissions")({
  requestProperty: "identity",
  permissionsProperty: "scope",
});

router.post(
  "/googleOAuth",
  auth.optional,
  customer_controller.googleOAuthorization
);

router.post(
  "/mobileAuth",
  auth.optional,
  customer_controller.otpBasedAuthorization
);

router.get("/", auth.required, customer_controller.getAllCustomers);

router.post("/login", auth.optional, customer_controller.login);

router.post("/register", auth.optional, customer_controller.register);

router.post("/token", auth.optional, customer_controller.token);

// router.get('/search/:vendor?', auth.optional, customer_controller.searchVendorCustomer);

router.get("/:id", auth.required, customer_controller.getCustomerById);

router.put("/update/:id", auth.optional, customer_controller.updateCustomer);

module.exports = router;
