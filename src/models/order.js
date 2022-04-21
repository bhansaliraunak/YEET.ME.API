const mongoose = require("mongoose");
const { Schema } = mongoose,
  Customer = require("../models/customer"),
  Vendor = require("../models/vendor"),
  Product = require("../models/product");

let OrderSchema = new Schema(
  {
    slug: {
      type: String,
    },
    customer: Customer.schema,
    vendor: Vendor.schema,
    product: Product.schema,
    cart: {
      type: Number,
      default: 1.0,
    },
    price: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    total: {
      type: Number,
    },
    status: [
      {
        name: {
          type: String,
        },
        color: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

var Orders = mongoose.model("Order", OrderSchema).syncIndexes();
module.exports = Orders;
