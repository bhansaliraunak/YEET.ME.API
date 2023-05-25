const Vendor = require("../../models/vendor");
const Customer = require("../../models/customer");
const Product = require("../../models/product");
const Order = require("../../models/order");

exports.createOrder = async (req, res, next) => {
  const {
    body: { order },
  } = req;

  const createOrder = new Order(order);
  await Vendor.findById(order.vendor, (err, data) => {
    createOrder.vendor = data;
  });
  await Customer.findById(order.customer, (err, data) => {
    createOrder.customer = data;
  });
  await Product.findById(order.product, (err, data) => {
    createOrder.product = data;
  });

  console.log("Order: ", createOrder);

  return await createOrder.save().then(() => {
    return res.status(201).json({ order: createOrder });
  });
};

exports.getOrders = (req, res, next) => {
  return Order.find(
    {
      "vendor._id": req.query.vendor,
    },
    (err, data) => {
      return res.status(200).json({ orders: data });
    }
  );
};

exports.getOrderById = (req, res, next) => {
  Order.findById(req.params.id, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ order: data });
  });
};
