const mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  GoogleStrategy = require("passport-google-oauth2");

var Customer = require("../models/customer"),
  Vendor = require("../models/vendor");

passport.use(
  "customerLocal",
  new LocalStrategy(
    {
      usernameField: "customer[email]",
      passwordField: "customer[password]",
    },
    (email, password, done) => {
      Customer.findOne({ email: email })
        .then((customer) => {
          const authCustomer = new Customer(customer);
          if (customer) {
            authCustomer.validatePassword(
              password,
              authCustomer.password,
              (cb) => {
                if (cb.flag) {
                  return done(null, customer);
                } else {
                  return done(null, false, {
                    error: { "email or password": "is invalid" },
                  });
                }
              }
            );
          } else {
            return done(null, false, { error: { customer: "not found" } });
          }
        })
        .catch(done);
    }
  )
);

passport.use(
  "vendorLocal",
  new LocalStrategy(
    {
      usernameField: "vendor[email]",
      passwordField: "vendor[password]",
    },
    (email, password, done) => {
      email, password;
      Vendor.findOne({ email: email })
        .then((vendor) => {
          const authVendor = new Vendor(vendor);
          if (vendor) {
            authVendor.validatePassword(password, authVendor.password, (cb) => {
              if (cb.flag) {
                return done(null, vendor);
              } else {
                return done(null, false, {
                  error: { "email or password": "is invalid" },
                });
              }
            });
          } else {
            return done(null, false, { error: { vendor: "not found" } });
          }
        })
        .catch(done);
    }
  )
);

passport.serializeUser((customer, done) => {
  done(null, customer.id);
});

passport.deserializeUser((id, done) => {
  customer.findById(id, (err, customer) => {
    done(err, customer);
  });
});
