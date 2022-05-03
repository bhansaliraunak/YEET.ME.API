global.__base = __dirname;

const express = require("express"),
  path = require("path"),
  bodyParser = require("body-parser"),
  session = require("express-session"),
  cors = require("cors"),
  errorHandler = require("errorhandler"),
  mongoose = require("mongoose"),
  responseTime = require("response-time"),
  passport = require("passport"),
  isProduction = process.env.NODE_ENV === "production",
  app = express(),
  server = require("http").Server(app),
  favicon = require("serve-favicon"),
  helmet = require("helmet"),
  expressHealthApi = require("express-health-api");

mongoose.promise = global.Promise;

var originWhitelist = [
  "http://localhost:4200",
  "https://accounts.google.com",
  "http://durropit.club",
  "http://vendor.durropit.club",
  "http://35.154.248.208",
];

var corsOptions = {
  origin: function (origin, callback) {
    var isWhiteListed = originWhitelist.indexOf(origin) !== -1;
    callback(null, isWhiteListed);
  },
  credentials: true,
};

app.use(favicon(path.join(__dirname, "favicon.ico")));
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(cors(corsOptions));

app.options("*", cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "secret",
    cookie: { maxAge: 60000, secure: true },
    resave: false,
    saveUninitialized: false,
  })
);
app.use(responseTime());

app.use(passport.initialize());
app.use(passport.session());

app.use(helmet());
app.use(expressHealthApi({ apiPath: "/health" }));

mongoose.Promise = Promise;
mongoose
  .connect(
    "mongodb+srv://sponge:sponge123@cluster0.xolhr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("connected to the server"))
  .catch((err) => {
    console.log(err.stack);
    process.exit(1);
  });
mongoose.set("debug", true);

require("./models/customer");
require("./models/vendor");
require("./models/product");
require("./models/order");
require("./models/schedule");
require("./models/society");
require("./config/passport");
app.use(require("./routes"));

if (!isProduction) {
  app.use(errorHandler());

  app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  });
}

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

server.listen(3000);
