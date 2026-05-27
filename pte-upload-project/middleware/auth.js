const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {

  const token =
    req.header("Authorization");

  if (!token) {

    return res.status(401).json({

      success: false,
      message: "No token, access denied"

    });

  }

  try {

    const verified =
      jwt.verify(token, "secretkey");

    req.user = verified;

    next();

  } catch (error) {

    res.status(401).json({

      success: false,
      message: "Invalid token"

    });

  }

};