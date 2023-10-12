const mongoose = require("mongoose"),
  passportLocalMongoose = require("passport-local-mongoose");
const { Schema } = mongoose,
  jwt = require("jsonwebtoken"),
  asyncRedis = require("async-redis"),
  client = asyncRedis.createClient(),
  fs = require("fs"),
  path = require("path");

client.on("error", function (err) {
  console.log("Error " + err);
});

require("dotenv").config();

const accessPrivateKEY = fs.readFileSync(
  path.resolve(process.env.ACCESS_PRIVATE_KEY_FILE_PATH),
  "utf8"
);
const refreshPrivateKEY = fs.readFileSync(
  path.resolve(process.env.REFRESH_PRIVATE_KEY_FILE_PATH),
  "utf8"
);

let VendorSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    email_is_verified: {
      type: Boolean,
      default: false,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    // businessName: {
    //   type: String,
    //   required: false,
    // },
    // businessAddress: {
    //   type: String,
    //   required: false,
    // },
    image: {
      url: String,
      type: String,
    },
    // product: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "Product",
    //   },
    // ],
    state: {
      type: Schema.Types.ObjectId,
      ref: "Location",
    },
    city: {
      type: Schema.Types.ObjectId,
      ref: "Location",
    },
    mobile: {
      type: Number,
      required: false,

      maxlength: 10,
    },
    // paymentNumber: {
    //   type: Number,
    //   required: false,
    //   maxlength: 10,
    // },
    // paymentType: {
    //   type: Array,
    //   required: false,
    // },
    whatsapp: {
      type: Number,
      required: false,

      maxlength: 10,
    },
    carName: {
      type: String,
      required: false,
    },
    carType: {
      type: String,
      required: false,
    },
    isProfileCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isRegistrationCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type: String,
      default: "vendor",
    },
    permissions: {
      type: Array,
      default: ["read", "modify"],
    },
    provider: {
      type: String,
      default: "SELF",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

VendorSchema.methods.generateAccessJWT = function () {
  var sOptions = {
    issuer: "Authorization/Resource/This server",
    subject: this.email + "",
    audience: "Client_Identity", // this should be provided by client
  };

  // Token signing options
  var signOptions = {
    issuer: sOptions.issuer,
    subject: sOptions.subject,
    audience: sOptions.audience,
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // 20 secs validity
    algorithm: "RS256", // RSASSA [ "RS256", "RS384", "RS512" ]
  };

  return jwt.sign(
    {
      email: this.email,
      id: this._id,
      role: this.role,
      permissions: this.permissions,
    },
    accessPrivateKEY,
    signOptions
  );
};

VendorSchema.methods.generateRefreshJWT = function () {
  var sOptions = {
    issuer: "Authorization/Resource/This server",
    subject: this.email + "",
    audience: "Client_Identity", // this should be provided by client
  };

  // Token signing options
  var signOptions = {
    issuer: sOptions.issuer,
    subject: sOptions.subject,
    audience: sOptions.audience,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // 40 secs validity
    algorithm: "RS256",
  };

  return jwt.sign(
    {
      email: this.email,
      id: this._id,
      role: this.role,
      permissions: this.permissions,
    },
    refreshPrivateKEY,
    signOptions
  );
};

VendorSchema.methods.toAuthJSON = function () {
  let accessToken = this.generateAccessJWT();
  let refreshToken = this.generateRefreshJWT();

  client.set(this.email + ":" + accessToken, refreshToken);

  return {
    _id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    image: this.image,
    city: this.city,
    state: this.state,
    isProfileCompleted: this.isProfileCompleted,
    isRegistrationCompleted: this.isRegistrationCompleted,
    role: this.role,
    permissions: this.permissions,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

VendorSchema.methods.toJSON = function () {
  return {
    _id: this._id,
    email: this.email,
    email_is_verified: this.email_is_verified,
    firstName: this.firstName,
    lastName: this.lastName,
    image: this.image,
    // businessName: this.businessName,
    // businessAddress: this.businessAddress,
    // product: this.product,
    state: this.state,
    city: this.city,
    mobile: this.mobile,
    // paymentNumber: this.paymentNumber,
    // paymentType: this.paymentType,
    whatsapp: this.whatsapp,
    carName: this.carName,
    carType: this.carType,
    isProfileCompleted: this.isProfileCompleted,
    isRegistrationCompleted: this.isRegistrationCompleted,
    role: this.role,
    permissions: this.permissions,
    provider: this.provider,
    active: this.active,
  };
};

const Vendor = mongoose.model("Vendor", VendorSchema);
module.exports = Vendor;
