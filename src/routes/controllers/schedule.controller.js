const Vendor = require("../../models/vendor"),
  Customer = require("../../models/customer"),
  CarWashSchedule = require("../../models/schedule"),
  AWS = require("aws-sdk"),
  { SNSClient, SetSMSAttributesCommand } = require("@aws-sdk/client-sns");

require("dotenv").config();

exports.createCarWashSchedule = async (request, response, next) => {
  const {
    body: { schedule },
  } = request;

  const today = new Date();
  const sevenDaysFromToday = new Date();
  sevenDaysFromToday.setDate(today.getDate() + 7);

  const formattedToday = today.toISOString().split("T")[0]; // Get today's date in "YYYY-MM-dd" format
  const formattedSevenDaysFromToday = sevenDaysFromToday
    .toISOString()
    .split("T")[0]; // Get seventh day from today's date in "YYYY-MM-dd" format

  CarWashSchedule.find(
    {
      customer: schedule.customer,
      $and: [
        { start_time: schedule.start_time },
        { start_date: schedule.start.split("T")[0] },
        { status: { $exists: true } }, // Check if 'status.name' exists
        { "status.name": { $nin: ["CANCELLED"] } }, // Exclude "CANCELLED"
      ],
      start_date: {
        $gte: formattedToday,
        $lte: formattedSevenDaysFromToday,
      },
    },
    async (err, matchingCarWashSchedules) => {
      if (err) {
        console.error("Error finding matching car wash schedules:");
        console.log("ERROR :: ", JSON.stringify(err));
        response.status(500).json({ data: "Internal Server Error" });
      } else {
        if (matchingCarWashSchedules.length > 0) {
          if (isDateGreaterThanSevenDays(schedule.start.split("T")[0])) {
            response
              .status(404)
              .json({ data: "Cannot Schedule Past Seven Days" });
          } else {
            response
              .status(409)
              .json({ data: "Schedule Already in Progress!" });
          }
        } else {
          if (isDateGreaterThanSevenDays(schedule.start.split("T")[0])) {
            response
              .status(404)
              .json({ data: "Cannot Schedule Past Seven Days" });
          } else if (isDateLessThanToday(schedule.start.split("T")[0])) {
            response
              .status(404)
              .json({ data: "Cannot Schedule To Prior Days" });
          } else {
            // AWS.config.credentials = new AWS.Credentials(
            //   process.env.AWS_ACCESS_KEY_ID,
            //   process.env.AWS_SECRET_ACCESS_KEY,
            //   (sessionToken = null)
            // );

            // const snsClient = new SNSClient({
            //   profile: "default",
            //   region: process.env.AWS_REGION,
            //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            // });

            AWS.config.update({
              profile: "default",
              region: process.env.AWS_REGION,
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            });

            let param = {
              // Protocol: "SMS",
              // TopicArn: "arn:aws:sns:ap-south-1:065524786363:Durropit",
              // Endpoint: "+917447477330",
              Message: "Durropit now operates in Jodhpur!",
              PhoneNumber: "+917447477330",
            };

            // const run = async () => {
            //   try {
            //     const data = await snsClient.send(new SetSMSAttributesCommand(param));
            //     console.log("Success.", data);
            //     return data; // For unit tests.
            //   } catch (err) {
            //     console.log("Error", err.stack);
            //   }
            // };
            // run();

            // const sns = new AWS.SNS({ apiVersion: "2010–03–31" })
            //   .publish(param)
            //   .promise();

            // sns
            //   .then(() => {
            //     console.log("Message sent successfully!");
            //   })
            //   .catch((err) => {
            //     console.log(err);
            //   });

            try {
              // Find the vendor and customer details and assign them to the new schedule.
              const vendorData = await Vendor.findById(schedule.vendor._id);
              const customerData = await Customer.findById(schedule.customer);

              if (!vendorData || !customerData) {
                return response
                  .status(404)
                  .json({ error: "Vendor or customer not found" });
              }

              const createSchedule = new CarWashSchedule({
                ...schedule,
                vendor: vendorData._doc,
                customer: customerData._doc,
                start_date: schedule.start.split("T")[0],
              });

              // Save the new schedule.
              await createSchedule.save();

              // Return a success response with the created schedule.
              return response.status(201).json({ schedule: createSchedule });
            } catch (error) {
              console.error("Error creating car wash schedule:", error);
              return response
                .status(500)
                .json({ error: "Internal server error" });
            }
          }
        }
      }
    }
  );
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

  // Compare the target date with seven days from now
  return targetDate < currentDate;
}

exports.getSchedulesForVendor = (req, res, next) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const formattedToday = today.toISOString().split("T")[0]; // Get today's date in "YYYY-MM-dd" format
  const formattedYesterday = yesterday.toISOString().split("T")[0]; // Get yesterday's date in "YYYY-MM-dd" format

  return CarWashSchedule.find(
    {
      "vendor._id": req.query.vendor,
      $and: [
        { status: { $exists: true } }, // Check if 'status.name' exists
        { "status.name": { $nin: ["DECLINED"] } }, // Exclude "CANCELLED"
      ],
      $or: [
        {
          start_date: formattedToday, // Find documents with today's date in "YYYY-MM-dd" format
        },
        {
          start_date: formattedYesterday, // Find documents with yesterday's date in "YYYY-MM-dd" format
        },
      ],
    },
    (err, data) => {
      if (err) {
        console.log("ERROR :: ", err);
      } else {
        CarWashSchedule.populate(
          data,
          { path: "customer" },
          (err, populatedCarWashSchedules) => {
            if (err) {
              console.log("ERROR :: ", err);
            } else {
              return res.status(200).json({ data: populatedCarWashSchedules });
            }
          }
        );
      }
    }
  );
};

exports.getSchedulesForCustomer = (req, res, next) => {
  const today = new Date();
  const sevenDaysFromToday = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  sevenDaysFromToday.setDate(today.getDate() + 7);

  const formattedSevenDaysFromToday = sevenDaysFromToday
    .toISOString()
    .split("T")[0]; // Get today's date in "YYYY-MM-dd" format
  const formattedYesterday = yesterday.toISOString().split("T")[0]; // Get yesterday's date in "YYYY-MM-dd" format

  return CarWashSchedule.find(
    {
      customer: req.query.customer,
      $and: [
        { status: { $exists: true } }, // Check if 'status.name' exists
        { "status.name": { $nin: ["CANCELLED"] } }, // Exclude "CANCELLED",
      ],

      start_date: {
        $gte: formattedYesterday,
        $lte: formattedSevenDaysFromToday,
      },
    },
    (err, data) => {
      if (err) {
        return res.status(200).json({ data: [] });
      } else {
        CarWashSchedule.populate(
          data,
          { path: "customer" },
          (err, populatedCarWashSchedules) => {
            if (err) {
              console.log("ERROR :: ", err);
            } else {
              return res.status(200).json({ data: populatedCarWashSchedules });
            }
          }
        );
      }
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

exports.updateSchedule = async (req, res, next) => {
  const {
    body: { schedule },
  } = req;

  return await CarWashSchedule.findByIdAndUpdate(
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
