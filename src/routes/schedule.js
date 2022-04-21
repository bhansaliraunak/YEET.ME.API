const router = require("express").Router(),
  schedule_controller = require("./controllers/schedule.controller"),
  auth = require("./auth");

router.post(
  "/create",
  auth.required,
  schedule_controller.createCarWashSchedule
);

router.get("/vendor", auth.required, schedule_controller.getSchedulesForVendor);

router.get("/", auth.required, schedule_controller.getSchedulesForCustomer);

router.get("/:id", auth.required, schedule_controller.getScheduleById);

router.put("/update/:id", auth.required, schedule_controller.updateSchedule);

module.exports = router;
