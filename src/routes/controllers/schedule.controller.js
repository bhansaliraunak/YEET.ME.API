const Vendor = require("../../models/vendor"),
  Customer = require("../../models/customer"),
  CarWashSchedule = require("../../models/schedule"),
  AWS = require("aws-sdk"),
  { SNSClient, SetSMSAttributesCommand } = require("@aws-sdk/client-sns");
const mongoose = require("mongoose");

require("dotenv").config();

exports.createCarWashSchedule = async (req, res, next) => {
  const {
    body: { schedule },
  } = req;

  const createSchedule = new CarWashSchedule(schedule);

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

  await Vendor.findById(schedule.vendor._id, (err, data) => {
    createSchedule.vendor = data._doc;
  });
  await Customer.findById(schedule.customer, (err, data) => {
    createSchedule.customer = data._doc;
  });

  // await Customer.collection.dropIndex("email");
  // await Customer.collection.createIndex("email");

  return await createSchedule.save().then(() => {
    return res.status(201).json({ schedule: createSchedule });
  });

  return res.status(201);
};

exports.getSchedulesForVendor = (req, res, next) => {
  console.log("Vendor Request" + req.query.vendor);
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

exports.updateSchedule = async (req, res, next) => {
  const {
    body: { schedule },
  } = req;

  return await CarWashSchedule.findByIdAndUpdate(
    req.params.id,
    schedule,
    { upsert: true },
    (err, data) => {
      if (err) {
        return next(err);
      }
      return res.json({ data: data });
    }
  );
};
