const mongoose = require("mongoose"),
  Product = require("../../models/product"),
  Vendor = require("../../models/vendor"),
  constants = require("../../constants/constants"),
  { v4: uuidv4 } = require("uuid"),
  AWS = require("aws-sdk");

require("dotenv").config();

exports.createProduct = async (req, res, next) => {
  const {
    body: { product },
  } = req;

  await Product.find({
    $and: [
      { name: product.name },
      { vendor: product.vendor },
      { slug: product.slug },
    ],
  }).then(async (data) => {
    if (data.length > 0) {
      return res.status(409).json({ error: constants.PRODUCT_EXIST });
    } else {
      const createProduct = new Product(product);
      return createProduct.save().then(() => {
        // Vendor.findByIdAndUpdate(product.vendor,
        //   {"$push": { "product": ObjectID(createProduct.id) }}, {"new": true, "upsert": true});
        return res.json({ product: createProduct });
      });
    }
  });
};

exports.getProductById = (req, res, next) => {
  return Product.findById(req.params.id, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ product: data });
  });
};

exports.getAllProduct = (req, res, next) => {
  return Product.find({
    vendor: req.query.vendor,
  }).then((data) => {
    return res.status(200).json({ products: data });
  });
};

exports.updateProduct = (req, res, next) => {
  const {
    body: { product },
  } = req;

  return Product.findByIdAndUpdate(
    req.params.id,
    product,
    { new: true },
    (err, data) => {
      if (err) {
        return next(err);
      }
      return res.json({ product: data });
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

exports.uploadS3 = (req, res, next) => {
  let s3bucket = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  s3bucket.createBucket(() => {
    var params = {
      Bucket: process.env.BUCKET_NAME,
      Key: "user/" + uuidv4() + ".jpg",
      Body: req.file.buffer,
    };
    s3bucket.upload(params, (err, data) => {
      if (err) {
        next(err);
      }
      res.status(200).json(data);
    });
  });
};

exports.fetchImagesS3 = (req, res, next) => {
  console.log("ENTEREDDDD IMAGES");
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  let s3bucket = new AWS.S3();
  var params = {
    Bucket: process.env.BUCKET_NAME + "",
    Delimiter: "/",
    Prefix: "user/",
  };
  s3bucket.listObjects(params, (err, data) => {
    if (err) {
      next(err);
    }
    console.log(data);
  });
};
