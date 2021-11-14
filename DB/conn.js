const chalk = require('chalk');
const mongoose = require('mongoose');

// MongoDB uri.
const DB = process.env.DB_URI;

// Connect to the mongodb
mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true
});
// create the connection 
const db = mongoose.connection;

// db.users.createIndex(
//       { created_at: 1 },
//       { expireAfterSeconds: 1, partialFilterExpression: { verified: false } }
// );
// db.collection("users").createIndex(
//       { created_at: 1 },
//       { expireAfterSeconds: 1, partialFilterExpression: { verified: false } }
// );

db.on('error', err => { console.error(chalk.red.bold('\n>>===> Database Connection error : \n>>===> ' + err)) });
db.once('open', function () {
      console.log(chalk.cyanBright.bold(">>===> Successfully Connected to the Database\n"));
});