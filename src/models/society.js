const mongoose = require("mongoose");
const { Schema } = mongoose;

let SocietySchema = new Schema({
  name: {
    type: String,
    unique: true,
    index: true,
    sparse: true,
  },
  description: {
    type: String,
  },
  slug: {
    type: String,
  },
  vendor: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
  },
  images: [
    {
      url: String,
      type: String,
    },
  ],
  state: {
    type: Schema.Types.ObjectId,
    ref: "Location",
  },
  city: {
    type: Schema.Types.ObjectId,
    ref: "Location",
  },
  area: {
    type: Schema.Types.ObjectId,
    ref: "Location",
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
});

var Society = mongoose.model("Society", SocietySchema);
module.exports = Society;
