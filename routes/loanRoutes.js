const express = require("express");
const fs = require("fs");
const loanRoute = express.Router();
//POST BOOK ISSUES AND USER DETAILS
loanRoute.post("/loan", (req, res) => {
  const {
    id,
    firstname,
    lastname,
    username,
    registration_number,
    book_name,
    collected,
    collection_date,
    returning_date,
    returned,
  } = req.body;
  fs.readFile("./admin/loanRequest.json", "utf8", (err, data) => {
    if (err) {
      res.status(400).json({ message: "Fail to load data files!" });
    } else {
      if (
        (!id || !firstname,
        !lastname,
        !username,
        !registration_number,
        !book_name,
        !collected,
        !returned,
        !collection_date,
        !returning_date)
      ) {
        res.status(400).json({ message: "All fields are required!" });
      }
      const adminRequestBody = JSON.parse(data);
      const userDetailsByAdmin = {
        id: id,
        firstname: firstname,
        lastname: lastname,
        username: username,
        registration_number: registration_number,
        book_name: book_name,
        collected: collected,
        collection_date: Date(),
        returning_date: returning_date,
        returned: false,
      };

      adminRequestBody.push(userDetailsByAdmin);
      fs.writeFile(
        "./admin/loanRequest.json",
        JSON.stringify(adminRequestBody, 2, null),
        (err) => {
          if (err) {
            res.status(400).json({ message: "Fail to save data!" });
          }
        }
      );
      res.status(400).json({ message: adminRequestBody });
    }
  });
});

loanRoute.get("/get/loan", (req, res) => {
  fs.readFile("./admin/loanRequest.json", "utf8", (err, data) => {
    if (err) {
      res.status(400).json({ message: "Fail to load data files!" });
    } else {
      const userAdminLoanRequest = JSON.parse(data);
      res.status(200).json({ message: userAdminLoanRequest });
    }
  });
});


module.exports = loanRoute;
