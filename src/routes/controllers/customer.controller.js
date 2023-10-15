const passport = require("passport"),
  mongoose = require("mongoose"),
  Customer = mongoose.model("Customer"),
  Vendor = mongoose.model("Vendor"),
  constants = require("../../constants/constants"),
  Amplify = require("aws-amplify"),
  Auth = require("@aws-amplify/auth"),
  path = require("path"),
  awsconfig = path.join(__dirname, "aws-exports.js");

require("dotenv").config();

exports.googleOAuthorization = (req, res, next) => {
  const {
    body: { customer },
  } = req;

  Vendor.findOne({ email: customer.email })
    .exec()
    .then((data) => {
      if (data) {
        return res.status(406).json({
          customer: "Hey! Washer, I think you knock'd the wrong door...",
        });
      } else {
        Customer.findOne({ email: customer.email })
          .exec()
          .then((data) => {
            if (data) {
              return res.status(200).json({ customer: data.toAuthJSON() });
            } else {
              const createCustomer = new Customer(customer);
              createCustomer
                .save()
                .then(() => {
                  return res
                    .status(201)
                    .json({ customer: createCustomer.toAuthJSON() });
                })
                .catch((err) => next(err));
            }
          })
          .catch((error) => next(error));
      }
    })
    .catch((error) => next(error));
};

exports.otpBasedAuthorization = async (req, res, next) => {
  try {
    const {
      body: { customer },
    } = req;

    // Check if the customer exists as a Vendor
    const vendor = await Vendor.findOne({
      mobile: parseInt(customer.mobile),
    }).exec();
    if (vendor) {
      return res.status(406).json({
        washer: "Hey! Washer, I think you knock'd the wrong door...",
      });
    }

    // Check if the customer exists as a Customer
    const existingCustomer = await Customer.findOne({
      mobile: parseInt(customer.mobile),
    }).exec();
    if (existingCustomer) {
      return res.status(200).json({ customer: existingCustomer.toAuthJSON() });
    }

    // Check if the customer has an email
    if (!customer.email || !customer.lastName || !customer.firstName) {
      return res.status(400).json({
        customer: "Hey!" + " " + "Welcome to Durropit...",
      });
    } else {
      // If the customer doesn't exist, create a new Customer
      const newCustomer = new Customer(customer);
      await newCustomer.save();
      return res.status(201).json({ customer: newCustomer.toAuthJSON() });
    }
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  const {
    body: { customer },
  } = req;

  if (!customer.email) {
    return res.status(422).json({
      errors: {
        email: constants.IS_REQUIRED,
      },
    });
  }

  if (!customer.password) {
    return res.status(422).json({
      errors: {
        password: constants.IS_REQUIRED,
      },
    });
  }

  await Customer.find({
    $or: [{ email: customer.email }, { mobile: customer.mobile }],
  }).then(async (data) => {
    if (data.length > 0) {
      return res.status(409).json({ error: constants.CUSTOMER_EXIST });
    } else {
      const createCustomer = new Customer(customer);
      await createCustomer.setPassword(customer.password, async (cb) => {
        if (cb.success === constants.SUCCESS) {
          createCustomer.set("password", cb.hash);
          // await Society.findById(customer.society, (err, data) => {
          //   if (data) {
          //     createCustomer.society = data;
          //   }
          // });
          return await createCustomer
            .save()
            .then(() =>
              res
                .status(201)
                .json({ statusMessage: constants.ON_REGISTER_SUCCESS })
            )
            .catch((err) => next(err));
        }
      });
    }
  });
};

exports.login = (req, res, next) => {
  const {
    body: { customer },
  } = req;

  if (!customer.email) {
    return res.status(422).json({
      errors: {
        email: "is required",
      },
    });
  }

  if (!customer.password) {
    return res.status(422).json({
      errors: {
        password: "is required",
      },
    });
  }

  return passport.authenticate(
    "customerLocal",
    { session: false },
    (err, passportCustomer, info) => {
      if (err) {
        console.log("Info", info);
        return next(err);
      }
      if (passportCustomer) {
        return res
          .status(200)
          .json({ customer: passportCustomer.toAuthJSON() });
      }
      return res.status(403).json({ error: "Unauthorized Access Denied!" });
    }
  )(req, res, next);
};

exports.token = (req, res, next) => {
  const {
    body: { token },
  } = req;
  let id = token.id,
    email = token.email,
    refreshToken = token.refreshToken;

  if (refreshToken == null) {
    return res.status(401).json({ error: "Unauthorized!" });
  }

  if (refreshToken) {
    const customerToken = new Customer({ customer: { _id: id, email: email } });
    const token = customerToken.generateAccessJWT();
    return res.status(201).json({ token: token });
  }
};

exports.getCustomerById = (req, res, next) => {
  return Customer.findById(req.params.id, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ customer: data });
  });
};

exports.getAllCustomers = (req, res, next) => {
  return Customer.find().then((data) => {
    if (!data) {
      return res.sendStatus(400);
    }
    return res.json({ customer: data });
  });
};

exports.updateCustomer = (req, res, next) => {
  const {
    body: { customer },
  } = req;

  if (!customer.email) {
    return res.status(422).json({
      errors: {
        email: "is required",
      },
    });
  }

  return Customer.findByIdAndUpdate(
    req.params.id,
    customer,
    { new: true },
    (err, data) => {
      if (err) {
        return next(err);
      }
      return res.json({ customer: data });
    }
  );
};

exports.searchVendorCustomer = (req, res, next) => {
  let term = req.params.vendor;
  if (term) {
    Customer.find({
      vendor: term,
    }).exec((err, data) => {
      if (err) {
        return next(err);
      }
      return res.json(data);
    });
  } else {
    Customer.find((err, data) => {
      if (err) {
        return next(err);
      }
      return res.json(data);
    });
  }
};
