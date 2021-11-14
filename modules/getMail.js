const fs = require("fs");



const getMails = (fileUrl, variables) => {

      try {
            const data = fs.readFileSync(fileUrl, "utf8");
            const html = data.replace(/{{([\s])*([\w]+)*([\s])*}}/g, (match, p1, p2, p3, offset, string) => {
                  return variables[p2];
            });
            return html;
      } catch (err) {
            console.log(err);
      }

}


module.exports = getMails;