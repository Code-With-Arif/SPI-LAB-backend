/**
 * SPI LAB
 * spilabgroups.com
 * 
 * Server File.
 */

/**
 * configure the environment variables.
 */
require("dotenv").config();
const path = require("path");
process.env.SERVER_ROOT = path.resolve(__dirname);

/**
 * Import files and configure express server.
 */
const express = require("express");
const app = express();
const http = require("https");
const server = http.createServer(app);

/**
 * Import all basic requirements.
 */
const chalk = require("chalk");
const { isJson, formatDate, getMails } = require("./modules/modules");
const authVerify = require("./DB/authMiddleWare");

/**
 * Create Database connection.
 */
require("./DB/conn");

/**
 * Use All middlewares
 */
app.use(require("cors")());
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(require("cookie-parser")());
app.use("/public", express.static(path.join(__dirname, "admin_files/public")));

app.use("/private", authVerify);
app.use("/private", express.static(path.join(__dirname, "admin_files/private")));
app.use(express.static(path.join(__dirname, "build")));

/**
 * use all the Routes.
 */
app.use(require(path.resolve(__dirname, "./Routes/auth")));
app.use(require(path.resolve(__dirname, "./Routes/file_manager")));

/**
 * Route To Host the main HTML file.
 */
app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, "build", "index.html"));
});

/**
 * Start the service.
 * Listen to the port.
 * Default Port = 5000
 * 
 * log if error occures.
 */
server.listen(process.env.PORT || 5000, (err) => {
      let date = formatDate((new Date), "$hh:$mm:$ss $tt, $df $MMM, $y UTC", true);
      console.clear();
      if (err) console.error("\n>>===> Unable To Start Service : ", err);
      else console.log(chalk.greenBright.bold(`
>>===> SPI LAB Backend Service Started at port : ${process.env.PORT || 5000}
>>===> Service started at : ${date}
`));
});