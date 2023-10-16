const Vendor = require("../../models/vendor"),
  Customer = require("../../models/customer"),
  CarWashSchedule = require("../../models/schedule"),
  { SNSClient, SetSMSAttributesCommand } = require("@aws-sdk/client-sns");
const mongoose = require("mongoose");

require("dotenv").config();

exports.createCarWashSchedule = async (request, response) => {
  try {
    const { schedule } = request.body;

    // Check if the schedule start date is not in the past or too far in the future
    if (isDateGreaterThanSevenDays(schedule.start.split("T")[0])) {
      return response
        .status(404)
        .json({ data: "Cannot Schedule Past Seven Days" });
    } else if (isDateLessThanToday(schedule.start.split("T")[0])) {
      return response
        .status(404)
        .json({ data: "Cannot Schedule To Prior Days" });
    } else if (
      schedule.meta.notes === "undefined" ||
      schedule.meta.notes === ""
    ) {
      return response.status(400).json({ data: "Address is Empty" });
    }

    // Check if all vendor IDs exist
    const vendorPromises = schedule.vendors.map((vendorId) =>
      Vendor.findById(vendorId)
    );
    const vendorData = await Promise.all(vendorPromises);

    if (vendorData.some((vendor) => !vendor)) {
      return response
        .status(404)
        .json({ error: "One or more vendors not found" });
    }

    // Find the customer details and assign them to the new schedule.
    const customerData = await Customer.findById(schedule.customer);

    if (!customerData) {
      return response.status(404).json({ error: "Customer not found" });
    }

    // Create a new CarWashSchedule
    const createSchedule = new CarWashSchedule({
      ...schedule,
      vendor: schedule.vendors, // Assign the array of vendor IDs
      customer: customerData._id, // Assign customer's ID
      start_date: schedule.start.split("T")[0],
    });

    // Save the new schedule
    await createSchedule.save();

    // Return a success response with the created schedule
    return response.status(201).json({ schedule: createSchedule });
  } catch (error) {
    console.error("Error creating car wash schedule:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
};

function isDateGreaterThanSevenDays(dateString) {
  const currentDate = new Date();
  const targetDate = new Date(dateString);
  const sevenDaysFromNow = new Date();

  // Add seven days to the current date
  sevenDaysFromNow.setDate(currentDate.getDate() + 7);

  // Compare the target date with seven days from now
  return targetDate > sevenDaysFromNow;
}

function isDateLessThanToday(dateString) {
  const currentDate = new Date();
  const targetDate = new Date(dateString);
  const yesterday = new Date();

  // Add seven days to the current date
  yesterday.setDate(currentDate.getDate() - 1);

  // Compare the target date with seven days from now
  return targetDate < yesterday;
}

exports.getSchedulesForVendor = (req, res) => {
  const today = new Date();
  const sevenDaysFromToday = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  sevenDaysFromToday.setDate(today.getDate() + 7);

  const formattedSevenDaysFromToday = sevenDaysFromToday
    .toISOString()
    .split("T")[0]; // Get today's date in "YYYY-MM-dd" format
  const formattedYesterday = yesterday.toISOString().split("T")[0]; // Get yesterday's date in "YYYY-MM-dd" format

  CarWashSchedule.find({
    vendors: req.query.vendor,
    $and: [
      { status: { $exists: true } }, // Check if 'status.name' exists
      { "status.name": { $nin: ["DECLINED"] } }, // Exclude "CANCELLED"
    ],
    start_date: {
      $gte: formattedYesterday,
      $lte: formattedSevenDaysFromToday,
    },
  })
    .populate("vendors") // Populate the 'vendors' field
    .populate("customer") // Populate the 'customer' field
    .exec((err, data) => {
      if (err) {
        return res.status(200).json({ data: [] });
      } else {
        return res.status(200).json({ data });
      }
    });
};

exports.getSchedulesForCustomer = (req, res) => {
  const today = new Date();
  const sevenDaysFromToday = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  sevenDaysFromToday.setDate(today.getDate() + 7);

  const formattedSevenDaysFromToday = sevenDaysFromToday
    .toISOString()
    .split("T")[0]; // Get today's date in "YYYY-MM-dd" format
  const formattedYesterday = yesterday.toISOString().split("T")[0]; // Get yesterday's date in "YYYY-MM-dd" format

  CarWashSchedule.find({
    customer: req.query.customer,
    $and: [
      { status: { $exists: true } }, // Check if 'status.name' exists
      { "status.name": { $nin: ["CANCELLED"] } }, // Exclude "CANCELLED",
    ],
    start_date: {
      $gte: formattedYesterday,
      $lte: formattedSevenDaysFromToday,
    },
  })
    .populate("vendors") // Populate the 'vendors' field
    .populate("customer") // Populate the 'customer' field
    .exec((err, data) => {
      if (err) {
        return res.status(200).json({ data: [] });
      } else {
        return res.status(200).json({ data });
      }
    });
};

exports.getScheduleById = (req, res, next) => {
  CarWashSchedule.findById(req.params.id, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ data: data });
  });
};

exports.updateSchedule = async (req, res, next) => {
  const {
    body: { schedule },
  } = req;

  try {
    // Check if schedule.vendor is a string
    if (typeof schedule.vendor._id === "string") {
      // Try to convert the string to a valid ObjectId
      schedule.vendor._id = mongoose.Types.ObjectId(schedule.vendor._id);
    }

    // Ensure the converted value is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(schedule.vendor._id)) {
      const updatedSchedule = await CarWashSchedule.findByIdAndUpdate(
        req.params.id,
        {
          $set: schedule,
          $pull: { vendors: { $ne: schedule.vendor._id } },
          // Remove all other vendors except the specified one
        },

        { new: true }
      );

      if (!updatedSchedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Now, let's populate the 'schedule.vendor' field within the 'updatedSchedule'
      await updatedSchedule.populate("schedule.vendors").execPopulate();

      return res.json({ data: updatedSchedule });
    } else {
      // Handle cases where schedule.vendor is not a valid ObjectId
      return res.status(400).json({ message: "Invalid ObjectId format" });
    }
  } catch (err) {
    return next(err);
  }
};
