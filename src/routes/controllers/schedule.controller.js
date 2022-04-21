const Vendor = require("../../models/vendor");
const Customer = require("../../models/customer");

var CarWashSchedule = require("../../models/schedule");

exports.createCarWashSchedule = async (req, res, next) => {
  const {
    body: { schedule },
  } = req;

  const createSchedule = new CarWashSchedule(schedule);
  await Vendor.findById(schedule.vendor, (err, data) => {
    createSchedule.vendor = data;
  });

  // await Customer.collection.dropIndex("email");
  // await Customer.collection.createIndex("email");

  await Customer.findById(schedule.customer, (err, data) => {
    createSchedule.customer = data;
  });

  console.log("Schedule: ", createSchedule);

  return await createSchedule.save().then(() => {
    return res.status(201).json({ schedule: createSchedule });
  });
};

exports.getSchedulesForVendor = (req, res, next) => {
  return CarWashSchedule.find(
    {
      "vendor._id": req.query.vendor,
    },
    (err, data) => {
      return res.status(200).json({ data: data });
    }
  );
};

exports.getSchedulesForCustomer = (req, res, next) => {
  return CarWashSchedule.find(
    {
      "customer._id": req.query.customer,
    },
    (err, data) => {
      return res.status(200).json({ data: data });
    }
  );
};

exports.getScheduleById = (req, res, next) => {
  CarWashSchedule.findById(req.params.id, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ data: data });
  });
};

exports.updateSchedule = (req, res, next) => {
  const {
    body: { schedule },
  } = req;

  return CarWashSchedule.findByIdAndUpdate(
    req.params.id,
    schedule,
    { new: true },
    (err, data) => {
      if (err) {
        return next(err);
      }
      return res.json({ data: data });
    }
  );
};
