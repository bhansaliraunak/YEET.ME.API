const { ObjectId } = require("mongoose");
const mongoose = require("mongoose");
const { Schema } = mongoose,
  Customer = require("../models/customer"),
  Vendor = require("../models/vendor");

let CarWashScheduleSchema = new Schema(
  {
    slug: {
      type: String,
    },
    customer: Customer.schema,
    vendor: Vendor.schema,
    start: {
      type: String,
    },
    start_time: {
      type: String,
    },
    title: {
      type: String,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    color: {
      primary: {
        type: String,
        default: "#ff00a2",
      },
      secondary: {
        type: String,
        default: "#ff00a2",
      },
    },
    resizable: {
      beforeStart: {
        type: Boolean,
        default: true,
      },
      afterEnd: {
        type: Boolean,
        default: true,
      },
    },
    draggable: {
      type: Boolean,
      default: false,
    },
    meta: {
      location: {
        type: String,
      },
      notes: {
        type: String,
      },
    },
    status: {
      name: {
        type: String,
        default: "PENDING",
      },
      color: {
        type: String,
        default: "#ff00a2",
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
    vendor_status: {
      name: {
        type: String,
        default: "ACCEPT",
      },
      color: {
        type: String,
        default: "#ff00a2",
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
    shared_status: {
      type: String,
      default: "Awaiting Confirmation from Washer",
    },
  },
  {
    timestamps: true,
  }
);

var CarWashSchedule = mongoose.model("CarWashSchedule", CarWashScheduleSchema);
module.exports = CarWashSchedule;
