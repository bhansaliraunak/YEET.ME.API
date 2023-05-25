var Society = require("../../models/society"),
  ObjectID = require("mongoose").Types.ObjectId;

exports.createSociety = (req, res, next) => {
  const {
    body: { society },
  } = req;
  const createSociety = new Society(society);
  return createSociety.save().then(() => res.json({ society: createSociety }));
};

exports.getSocietyById = (req, res, next) => {
  Society.findById(req.params.id, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ society: data });
  });
};

exports.getAllSocieties = (req, res, next) => {
  if (req.query.city === "undefined" || req.query.state === "undefined") {
    return res
      .status(404)
      .json({ message: "Location not found. Please update your profile!" });
  }

  return Society.find({
    $and: [
      { city: ObjectID(req.query.city) },
      { state: ObjectID(req.query.state) },
      { vendor: req.query.vendor },
    ],
  }).then((data) => {
    return res.status(200).json({ societies: data });
  });
};

exports.updateSociety = (req, res, next) => {
  const {
    body: { society },
  } = req;

  return Society.findByIdAndUpdate(
    req.params.id,
    society,
    { new: true },
    (err, data) => {
      if (err) {
        return next(err);
      }
      return res.json({ society: data });
    }
  );
};
