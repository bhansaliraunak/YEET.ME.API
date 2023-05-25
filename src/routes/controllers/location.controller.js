const Location = require("../../models/location");

exports.createLocation = (req, res, next) => {
  const {
    body: { location },
  } = req;
  const createLocation = new Location(location);
  createLocation.save().then((loc) => {
    res.status(201).json({ location: createLocation });
  });
};

exports.getLocationById = (req, res, next) => {
  return Location.findById(req.params.id, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ location: data });
  });
};

exports.getLocationByParentId = (req, res, next) => {
  Location.find({ parent: req.params.id }, (err, data) => {
    if (err) {
      return next(err);
    }
    return res.json({ locations: data });
  });
};
