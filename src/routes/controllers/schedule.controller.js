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

  CarWashSchedule.find(
    {
      customer: schedule.customer,
      start_time: schedule.start_time,
      start_date: schedule.start.split("T")[0],
      "status.name": { $ne: "CANCELLED" },
    },
    async (err, matchingCarWashSchedules) => {
      if (err) {
        console.error("Error finding matching car wash schedules:");
      } else {
        if (matchingCarWashSchedules.length > 0) {
          response.status(409).json({ data: "Request already exists" });
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
  );
};

exports.getSchedulesForVendor = (req, res, next) => {
  return CarWashSchedule.find(
    {
      "vendor._id": req.query.vendor,
      $and: [
        { status: { $exists: true } }, // Check if 'status.name' exists
        { "status.name": { $nin: ["DECLINED"] } }, // Exclude "CANCELLED"
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
  return CarWashSchedule.find(
    {
      customer: req.query.customer,
      $and: [
        { status: { $exists: true } }, // Check if 'status.name' exists
        { "status.name": { $nin: ["CANCELLED"] } }, // Exclude "CANCELLED"
      ],
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
