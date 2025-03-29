const fs = require("fs");
const getAllUser = (req, res) => {
  fs.readFile("./database/userDB.json", "utf8", (err, data) => {
    if (err) {
      res.status(500).json({ message: "Fail to load data files!" });
      console.log(err);
    } else {
      const userData = JSON.parse(data);
      res.status(200).json({ message: userData });
    }
  });
};

module.exports = getAllUser;
