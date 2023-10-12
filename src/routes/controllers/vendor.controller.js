const nodemailer = require("nodemailer"),
  mongoose = require("mongoose"),
  Vendor = mongoose.model("Vendor"),
  Customer = mongoose.model("Customer"),
  AWS = require("aws-sdk");

exports.googleOAuthorization = (req, res, next) => {
  const {
    body: { vendor },
  } = req;

  Customer.findOne({ email: vendor.email })
    .exec()
    .then((data) => {
      if (data) {
        return res.status(406).json({
          vendor: "Hey! Customer, I think you knock'd the wrong door...",
        });
      } else {
        Vendor.findOne({ email: vendor.email })
          .exec()
          .then((data) => {
            if (data) {
              return res.status(200).json({ vendor: data.toAuthJSON() });
            } else {
              const createVendor = new Vendor(vendor);
              createVendor
                .save()
                .then(() => {
                  return res
                    .status(201)
                    .json({ vendor: createVendor.toAuthJSON() });
                })
                .catch((err) => next(err));
            }
          })
          .catch((error) => next(error));
      }
    });
};

exports.getAllVendors = (req, res, next) => {
  return Vendor.find().then((data) => {
    if (!data) {
      return res.sendStatus(400);
    }
    return res.json({ vendors: data });
  });
};

exports.getVendorById = (req, res, next) => {
  return Vendor.findById(req.params.id, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ vendor: data });
  });
};

exports.updateVendor = (req, res, next) => {
  const {
    body: { vendor },
  } = req;

  console.log("VENDOR::", vendor);

  if (!vendor.email) {
    return res.status(422).json({
      errors: {
        email: "is required",
      },
    });
  }

  return Vendor.findByIdAndUpdate(
    req.params.id,
    vendor,
    { new: true },
    (err, data) => {
      if (err) {
        return next(err);
      }
      return res.json({ vendor: data });
    }
  );
};

/*
 * Feedback:
 * sends the feedback to the vendor
 * for drawing their attention.
 *
 * author: Raunak Bhansali
 */
exports.sendFeedback = async (req, res, next) => {
  const SES_CONFIG = {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  };

  const AWS_SES = new AWS.SES(SES_CONFIG);

  const {
    body: { vendor },
  } = req;

  let params = {
    Source: process.env.AWS_SES_SENDER,
    Destination: {
      ToAddresses: [process.env.AWS_SES_SENDER],
    },
    ReplyToAddresses: [],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data:
            `<tr><td class="td-padding" align="left" style="font-family: 'Roboto Mono', monospace; color: #212121!important; font-size: 24px; line-height: 30px; padding-top: 18px; padding-left: 18px!important; padding-right: 18px!important; padding-bottom: 0px!important; mso-line-height-rule: exactly; mso-padding-alt: 18px 18px 0px 13px;">Hi ` +
            `Raunak` +
            `,</td></tr><tr><td class="td-padding" align="left" style="font-family: 'Roboto Mono', monospace; color: #212121!important; font-size: 16px; line-height: 24px; padding-top: 18px; padding-left: 18px!important; padding-right: 18px!important; padding-bottom: 0px!important; mso-line-height-rule: exactly; mso-padding-alt: 18px 18px 0px 18px;">` +
            vendor.subject +
            `<br><br>` +
            `Thanks` +
            `<br><br>` +
            vendor.name +
            `<br>` +
            vendor.email +
            `<br>` +
            vendor.mobile +
            `<br><br>`, // plain text body
        },
        Text: {
          Charset: "UTF-8",
          Data: "This is the body of my email",
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "[DURROPIT]: Feedback/Concern/Complaint",
      },
    },
  };

  try {
    await AWS_SES.sendEmail(params, function (err, info) {
      if (err) {
        return res.status(400).json({
          status: false,
        });
      }
      return res.status(200).json({
        status: true,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
    });
  }

  // console.log("ENTEREEEDDD FEEDBACK!!!", vendor);

  // let transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     user: "rishimehta365@gmail.com",
  //     pass: "puppisinghji",
  //   },
  // });

  // const mailOptions = {
  //   from: vendor.email, // sender address
  //   to: "rishimehta365@gmail.com", // list of receivers
  //   subject: "[DURROPIT]: Feedback/Concern/Complaint", // Subject line
  //   html:
  //     `<tr><td class="td-padding" align="left" style="font-family: 'Roboto Mono', monospace; color: #212121!important; font-size: 24px; line-height: 30px; padding-top: 18px; padding-left: 18px!important; padding-right: 18px!important; padding-bottom: 0px!important; mso-line-height-rule: exactly; mso-padding-alt: 18px 18px 0px 13px;">Hi ` +
  //     `Raunak` +
  //     `,</td></tr><tr><td class="td-padding" align="left" style="font-family: 'Roboto Mono', monospace; color: #212121!important; font-size: 16px; line-height: 24px; padding-top: 18px; padding-left: 18px!important; padding-right: 18px!important; padding-bottom: 0px!important; mso-line-height-rule: exactly; mso-padding-alt: 18px 18px 0px 18px;">` +
  //     vendor.subject +
  //     `<br><br>` +
  //     `Thanks` +
  //     `<br><br>` +
  //     vendor.name +
  //     `<br>` +
  //     vendor.email +
  //     `<br>` +
  //     vendor.mobile +
  //     `<br><br>`, // plain text body
  // };

  // transporter.sendMail(mailOptions, function (err, info) {
  //   if (err) {
  //     return res.status(400).json({
  //       status: false,
  //     });
  //   }
  //   return res.status(200).json({
  //     status: true,
  //   });
  // });
};
