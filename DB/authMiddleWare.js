const User = require('../db/models/userSchema');
const jwt = require("jsonwebtoken");

function authVerify(req, res, next) {
      const token = req.cookies.jwt_auth;

      if (token) {

            let id = jwt.verify(token, process.env.PRIVATE_KEY);
            User.findOne({ _id: id }).then(user => {

                  if (user) {
                        if(JSON.parse(process.env.ADMINS).includes(user.email)) {
                              next();
                        } else {
                              return res.status(401).send("You are not allowed to view this.");
                        }
                  } else {
                        return res.status(401).send("Invalid Credentials");
                  }
            }).catch(err => {
                  return res.status(500).send("Internal Server Error");
            });
      } else {
            return res.status(401).send("Invalid Credentials");
      }
}

module.exports = authVerify;