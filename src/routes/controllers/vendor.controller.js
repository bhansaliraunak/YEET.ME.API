const Vendor = require("../../models/vendor"),
  path = require("path"),
  nodemailer = require("nodemailer"),
  Email = require("email-templates");

exports.googleOAuthorization = (req, res, next) => {
  const {
    body: { vendor },
  } = req;

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
            return res.status(201).json({ vendor: createVendor.toAuthJSON() });
          })
          .catch((err) => next(err));
      }
    })
    .catch((error) => next(error));
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
exports.sendFeedback = (req, res, next) => {
  const {
    body: { vendor },
  } = req;

  // console.log("ENTEREEEDDD FEEDBACK!!!", vendor);

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "rishimehta365@gmail.com",
      pass: "puppisinghji",
    },
  });

  const mailOptions = {
    from: vendor.email, // sender address
    to: "rishimehta365@gmail.com", // list of receivers
    subject: "[DURROPIT]: Feedback/Concern/Complaint", // Subject line
    html:
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
  };

  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      return res.status(400).json({
        status: false,
      });
    }
    return res.status(200).json({
      status: true,
    });
  });
};
