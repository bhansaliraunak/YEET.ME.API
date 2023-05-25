const jwtoken = require("jsonwebtoken"),
  asyncRedis = require("async-redis"),
  client = asyncRedis.createClient(),
  fs = require("fs"),
  path = require("path");

client.on("error", function (err) {
  console.log("Error " + err);
});

require("dotenv").config();

const validateToken = async (req, res, next) => {
  const {
    headers: { authorization, username },
  } = req;

  const accessPrivateKEY = fs.readFileSync(
    path.resolve(process.env.ACCESS_PRIVATE_KEY_FILE_PATH),
    "utf8"
  );
  const accessPublicKEY = fs.readFileSync(
    path.resolve(process.env.ACCESS_PUBLIC_KEY_FILE_PATH),
    "utf8"
  );
  const refreshPublicKEY = fs.readFileSync(
    path.resolve(process.env.REFRESH_PUBLIC_KEY_FILE_PATH),
    "utf8"
  );

  var vOption = {
    issuer: "Authorization/Resource/This server",
    subject: username,
    audience: "Client_Identity", // this should be provided by client
  };

  // Token signing options
  var verifyAccessOptions = {
    issuer: vOption.issuer,
    subject: vOption.subject,
    audience: vOption.audience,
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    algorithm: ["RS256"],
  };

  var verifyRefreshOptions = {
    issuer: vOption.issuer,
    subject: vOption.subject,
    audience: vOption.audience,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    algorithm: ["RS256"],
  };

  if (authorization && authorization.split(" ")[0] === "Token") {
    // req.identity = {
    //   permissions : ["customer"]
    // };
    let accessToken = authorization.split(" ")[1];
    try {
      let accessTokenDecoded = jwtoken.verify(
        accessToken,
        accessPublicKEY,
        verifyAccessOptions
      );
      if (accessTokenDecoded && accessTokenDecoded.email === username) {
        next();
      } else {
        const err = new Error(`Accessing through incorrect email id!`);
        err.status = "error";
        err.statusCode = 403;
        next(err);
      }
    } catch (err) {
      if (err) {
        if (err.name === "TokenExpiredError" && err.message === "jwt expired") {
          let redis_token = await client.get(username + ":" + accessToken);
          if (!redis_token) {
            next(err);
          }
          try {
            let refreshTokenDecoded = jwtoken.verify(
              redis_token,
              refreshPublicKEY,
              verifyRefreshOptions
            );
            if (refreshTokenDecoded) {
              var sOptions = {
                issuer: "Authorization/Resource/This server",
                subject: username,
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

              let token = jwtoken.sign(
                {
                  email: refreshTokenDecoded.email,
                  id: refreshTokenDecoded.id,
                  roles: refreshTokenDecoded.roles,
                  permissions: refreshTokenDecoded.permissions,
                },
                accessPrivateKEY,
                signOptions
              );
              req.header = {
                authorization: "Token" + " " + token,
                username: username,
              };
              next();
            }
          } catch (err) {
            if (err) {
              if (
                err.name === "TokenExpiredError" &&
                err.message === "jwt expired"
              ) {
                next(err);
              }
            }
          }
        }
      }
    }
  }
};

const token = async (req, res, next) => {
  next();
};

const auth = {
  required: validateToken,
  optional: token,
};

module.exports = auth;
