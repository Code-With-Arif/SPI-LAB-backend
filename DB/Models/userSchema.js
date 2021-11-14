const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const AuthSchema = new mongoose.Schema({
      name: {
            type: String,
            required: false
      },
      username: {
            type: String,
            required: false
      },
      userState: {
            type: Number,
            required: true
      },
      email: {
            type: String,
            required: true
      },
      dp: {
            type: String,
            required: false
      },
      bio: {
            type: String,
            required: false
      },
      password: {
            type: String,
            requried: false
      },
      verified: {
            type: Boolean,
            requried: true
      },
      otp: {
            type: String,
            required: true
      },
      registeredOn: {
            type: Number,
            required: true,
      },
      token: {
            type: String,
      },
      loginToken: {
            type: String,
      },
      ServiceWorker: [
            {
                  type: String
            }
      ],
      PushSubscription: [
            {
                  type: String
            }
      ]
});

AuthSchema.methods.generateToken = async function () {
      try {
            let token = jwt.sign({ _id: this._id }, process.env.PRIVATE_KEY);
            this.token = token;
            await this.save();
            return token;
      } catch (err) {
            console.log(err);
      }
}

const User = mongoose.model('User', AuthSchema);

module.exports = User;