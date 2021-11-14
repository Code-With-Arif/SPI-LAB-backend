/**
 * Basic Modules.
 */

const formatDate = require("./date");
const getMail = require("./getMail");
const sendMail = require("./sendMail");
const { generateOtp, generatePassword } = require("./random");


function randomNumber(l) {
      let num = '';
      for (i = 0; i < l; i++) {
            num = num + String(Math.floor((Math.random() * 8) + 1))
      }
      return num;
}


function uniqueArray(array) {
      var a = array.concat();
      for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
                  if (a[i] === a[j])
                        a.splice(j--, 1);
            }
      }

      return a;
}


/**
 * Test if item string is json structured.
 * 
 * @param {any} item - item to check.
 * @returns boolean
 */
function isJson(item) {
      item = typeof item !== "string" ? JSON.stringify(item) : item;
      try {
            item = JSON.parse(item);
      } catch (e) {
            return false;
      }
      if (typeof item === "object" && item !== null) return true;
      return false;
}



module.exports = {
      isJson,
      formatDate,
      getMail,
      sendMail,
      randomNumber,
      generateOtp,
      generatePassword,
      uniqueArray
}