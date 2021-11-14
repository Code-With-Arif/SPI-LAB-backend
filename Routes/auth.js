const express = require("express");
const Router = express.Router();
const User = require('../db/models/userSchema');
const { generateOtp, generatePassword, getMail, sendMail, formatDate, uniqueArray } = require("../modules/modules");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');

/**
 * Authentecation Routes.
 * 
 * User State :
 * 1 - Registered
 * 2 - Verified & set default password.
 * 4 - user details set
 * 5 - logged in.
 * 6 - login verification.
 * 
 * Register Perpous
 * @register - /register
 * @setPassword = /set-password
 * 
 * @login - /login
 */

/**
 * User State : 1
 * 
 * Register Route.
 */
Router.post('/api/auth/register', (req, res) => {
      let email = req.body.email;
      // console.log(email)

      /** Check if this email already exists. */
      User.findOne({ email: email }).then(user => {

            /**
             * @condition user exists with this email.
             * return error 
             * @else continue.
             */
            if (!user) {

                  /**
                   * generate otp 
                   * get registered date
                   * format date
                   */
                  let otp = generateOtp(6);
                  let date = new Date();
                  let formatedDate = formatDate(date, "$hh:$mm:$ss $tt, $df $MMM, $y UTC", true);

                  /** Create New User */
                  const newUser = new User({
                        email,
                        verified: false,
                        otp,
                        registeredOn: date,
                        userState: 1
                  });
                  newUser.save().then(async e => {

                        /**
                         * Generate Authentication Token.
                         */
                        let token = await e.generateToken();
                        /**
                         *  Create a folder for the user's media.
                         */
                        fs.mkdir(path.resolve(process.env.SERVER_ROOT, './userMedia/' + e._id), e => { });
                        /**
                         * Send the otp to the email.
                         */
                        await sendMail({
                              to: email,
                              subject: `"${otp}" is the OTP for SPILAB registration`,
                              html: getMail(path.resolve(process.env.SERVER_ROOT, './mails/otp.html'), {
                                    email,
                                    otp,
                                    date: formatedDate
                              })
                        });
                        return res.status(200).cookie("jwt_auth", token).json({ message: "User Registerd." });
                  }).catch(err => {
                        return res.status(500).send("Internal Server Error");
                  })

            } else if (user && !user.verified) {

                  /**
                   * generate otp 
                   * get registered date
                   * format date
                   */
                  let otp = generateOtp(6);
                  let date = new Date();
                  let formatedDate = formatDate(date, "$hh:$mm:$ss $tt, $df $MMM, $y UTC", true);

                  /** Re-Create New User */
                  user.otp = otp;
                  user.registeredOn = date;

                  user.save().then(async e => {

                        /**
                         * Generate Authentication Token.
                         */
                        let token = await e.generateToken();
                        /**
                         *  Create a folder for the user's media.
                         */
                        fs.mkdir(path.resolve(process.env.SERVER_ROOT, './userMedia/' + e._id), e => { });
                        /**
                         * Send the otp to the email.
                         */
                        await sendMail({
                              to: email,
                              subject: `"${otp}" is the OTP for SPILAB registration`,
                              html: getMail(path.resolve(process.env.SERVER_ROOT, './mails/otp.html'), {
                                    email,
                                    otp,
                                    date: formatedDate
                              })
                        });
                        return res.status(200).cookie("jwt_auth", token).json({ message: "User Registerd." });
                  }).catch(err => {
                        return res.status(500).send("Internal Server Error");
                  })


            } else {
                  return res.status(409).send("Email Already Exists");
            }
      }).catch(err => {
            return res.status(500).send("Internal Server Error");
      })
});


/**
 * User State : 1
 * 
 * Verify Route.
 */
Router.post("/api/auth/verify", (req, res) => {
      let otp = req.body.otp;
      let token = req.cookies.jwt_auth;

      if (token) {

            /**
             * Get the _id. And find user by it.
             */
            let id = jwt.verify(token, process.env.PRIVATE_KEY);
            User.findOne({ _id: id }).then(user => {

                  /**
                   * @condition user exists with this email. and userState is 1
                   * continue
                   * @else return error.
                   */
                  if (user && user.userState === 1) {

                        /**
                         * @condition otp matched.
                         * user verified and user state is 2.
                         * @else resend a fresh otp.
                         */
                        if (user.otp === otp) {
                              user.verified = true;
                              user.userState = 2;
                              let password = generatePassword(15);
                              const salt = bcrypt.genSaltSync(10);
                              let bcrypt_password = bcrypt.hashSync(password, salt);
                              user.password = bcrypt_password;

                              user.save().then(async e => {
                                    await sendMail({
                                          to: user.email,
                                          subject: `Account activated and verified`,
                                          html: getMail(path.resolve(process.env.SERVER_ROOT, './mails/verified.html'), {
                                                email: user.email,
                                                password
                                          })
                                    });

                                    return res.status(200).cookie("jwt_auth", token).json({ message: "User Verified & password seted." });
                              }).catch(err => {
                                    console.log("ho");
                                    console.log(err);
                                    return res.status(500).send("Internal Server Error");
                              });

                        } else {
                              let otp = generateOtp(6);
                              user.otp = otp;

                              user.save().then(async e => {

                                    /**
                                     * Send New OTP through Email.
                                     */
                                    await sendMail({
                                          to: e.email,
                                          subject: `"${otp}" is the OTP for SPILAB registration`,
                                          html: getMail(path.resolve(process.env.SERVER_ROOT, './mails/otp.html'), {
                                                email: e.email,
                                                otp,
                                                date: e.date
                                          })
                                    });

                                    return res.status(404).send("OTP Resend");
                              }).catch(err => {
                                    console.log(err);
                                    return res.status(500).send("Internal Server Error");
                              })

                        }
                  } else {
                        return res.status(401).send("Invalid Credentials");
                  }
            }).catch(err => {
                  console.log(err);
                  return res.status(500).send("Internal Server Error");
            })
      } else {
            return res.status(401).send("Invalid Credentials");
      }
});


/**
 * User State : 3
 * 
 * Set Password Route.
 */
Router.post("/api/auth/reset-password", (req, res) => {
      let old_password = req.body.old_password;
      let new_password = req.body.new_password;
      let token = req.cookies.jwt_auth;

      /**
       * Create password hash.
       */
      const salt = bcrypt.genSaltSync(10);
      new_password = bcrypt.hashSync(new_password, salt);

      if (token) {

            /**
             * Get the _id. And find user by it.
             */
            let id = jwt.verify(token, process.env.PRIVATE_KEY);
            User.findOne({ _id: id }).then(user => {

                  /**
                   * @condition user exists with this email. and userState is 2
                   * continue
                   * @else return error.
                   */
                  if (user && user.userState === 2 && user.verified && bcrypt.compare(old_password, user.password)) {

                        /** Set user password */
                        user.password = new_password;
                        user.save().then(e => {
                              return res.status(200).cookie("jwt_auth", token).json({ message: "Password re-seted" });
                        }).catch(err => {
                              return res.status(500).send("Internal Server Error");
                        })
                  } else {
                        return res.status(401).send("Invalid Credentials");
                  }
            }).catch(err => {
                  return res.status(500).send("Internal Server Error");
            })
      } else {
            return res.status(401).send("Invalid Credentials");
      }
});


/**
 * User State : 4
 * 
 * Set User Details Route.
 */
Router.post("/api/auth/set-user-profile", (req, res) => {
      const { name, dp, bio, sw, pushSubscription } = req.body;
      let token = req.cookies.jwt_auth;

      if (token) {
            /**
             * Get the _id. And find user by it.
             */
            let id = jwt.verify(token, process.env.PRIVATE_KEY);
            User.findOne({ _id: id }).then(user => {

                  /**
                   * @condition user exists with this email. and userState is 3
                   * continue
                   * @else return error.
                   */
                  if (user && user.userState === 2 && user.verified) {

                        /**
                         * Save only if a item is not undefined.
                         */
                        user.name = name ? name : user.name;
                        user.dp = dp ? dp : user.dp;
                        user.bio = bio ? bio : user.bio;
                        if (sw) {
                              user.ServiceWorker = uniqueArray(user.ServiceWorker.concat(sw));
                        }
                        if (pushSubscription) {
                              user.PushSubscription = uniqueArray(user.PushSubscription.concat(pushSubscription));
                        }

                        user.save().then(e => {
                              return res.status(200).cookie("jwt_auth", token).json({ message: "User Profile Updated" });
                        }).catch(err => {
                              return res.status(500).send("Internal Server Error");
                        })

                  } else {
                        return res.status(401).send("Invalid Credentials");
                  }

            }).catch(err => {
                  return res.status(500).send("Internal Server Error");
            });

      } else {
            return res.status(401).send("Invalid Credentials");
      }
});


/**
 * Login Route
 */
Router.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;

      /**
       * Find User with this email and match password.
       */
      User.findOne({ email: email }).then(async user => {

            /**
             * If Password matched ? send login verification link : return error.
             */
            if (user && user.password && user.userState === 2 && bcrypt.compare(password, user.password)) {

                  let loginToken = jwt.sign({ email }, process.env.PRIVATE_KEY);;

                  user.loginToken = loginToken;

                  user.save().then(async e => {

                        /**
                         * Send New OTP through Email.
                         */
                        await sendMail({
                              to: email,
                              subject: `Login Verification Link`,
                              html: getMail(path.resolve(process.env.SERVER_ROOT, './mails/loginVerificationLink.html'), {
                                    email: e.email,
                                    endPoint: process.env.FRONTEND_HOST + "login/verify/" + loginToken,
                                    token: process.env.FRONTEND_HOST + loginToken,
                                    date: e.date
                              })
                        });

                        return res.status(200).json({ message: "Login Verification Link" });
                  }).catch(err => {
                        return res.status(500).send("Internal Server Error");
                  })
                  // let token = await user.generateToken();
                  // res.status(200).cookie('jwt_auth', token).json({ message: "user logged in" });

            } else {
                  return res.status(401).send("Invalid Credentials");
            }
      }).catch(err => {
            return res.status(500).send("Internal Server Error");
      });
});

Router.post('/api/auth/login/verify', (req, res) => {
      const loginToken = req.body.loginToken;
      let email = jwt.verify(loginToken, process.env.PRIVATE_KEY);

      User.findOne({ email: email.email }).then(async user => {
            if (user && user.userState === 2) {

                  let token = await user.generateToken();
                  res.status(200).cookie('jwt_auth', token).json({ message: "user logged in" });

            } else {
                  return res.status(401).send("Invalid Credentials");
            }
      }).catch(err => {
            return res.status(500).send("Internal Server Error");
      });
});


Router.post("/api/auth/checkEmail", (req, res) => {
      const email = req.body.email;

      User.findOne({ email: email }).then(user => {
            if (user && user.verified) {
                  return res.status(200).json({ status: 404, message: "Email Exists" });
            } else {
                  return res.status(200).json({ status: 200, message: "Email dosen't Exists" });
            }
      }).catch(err => {
            return res.status(500).send("Internal Server Error");
      });
})

Router.post("/api/auth/getUser", (req, res) => {
      const token = req.cookies.jwt_auth;

      if (token) {

            let id = jwt.verify(token, process.env.PRIVATE_KEY);
            User.findOne({ _id: id }).then(user => {

                  if (user) {
                        return res.status(200).json({
                              email: user.email,
                              userState: user.userState,
                              name: user.name,
                              username: user.username,
                              dp: user.dp,
                              bio: user.bio,
                              verified: user.verified,
                              registeredOn: user.registeredOn
                        });
                  } else {
                        return res.status(401).send("Invalid Credentials");
                  }
            }).catch(err => {
                  return res.status(500).send("Internal Server Error");
            });
      } else {
            return res.status(401).send("Invalid Credentials");
      }
})






module.exports = Router;