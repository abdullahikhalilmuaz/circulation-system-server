const express = require("express");
const fs = require("fs").promises; // Using promises for cleaner async code
const loanRoute = express.Router();
const path = require("path");

// Helper function to read loan data
const readLoanData = async () => {
  const data = await fs.readFile(
    path.join(__dirname, "../admin/loanRequest.json"),
    "utf8"
  );
  return JSON.parse(data);
};

// Helper function to write loan data
const writeLoanData = async (data) => {
  await fs.writeFile(
    path.join(__dirname, "../admin/loanRequest.json"),
    JSON.stringify(data, null, 2)
  );
};

// POST loan data
loanRoute.post("/loan", async (req, res) => {
  try {
    const {
      id,
      firstname,
      lastname,
      username,
      registration_number,
      book_name,
      returning_date,
    } = req.body;

    // Validate required fields
    if (
      !id ||
      !firstname ||
      !lastname ||
      !username ||
      !registration_number ||
      !book_name
    ) {
      return res
        .status(400)
        .json({ message: "All fields except dates are required!" });
    }

    const loans = await readLoanData();

    const newLoan = {
      id,
      firstname,
      lastname,
      username,
      registration_number,
      book_name,
      collected: false,
      collection_date: new Date().toString(),
      returning_date: returning_date || null,
      returned: false,
    };

    loans.push(newLoan);
    await writeLoanData(loans);

    res.status(201).json({
      message: "Loan record created successfully",
      data: newLoan,
    });
  } catch (err) {
    console.error("Error creating loan:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET all loans
loanRoute.get("/get/loan", async (req, res) => {
  try {
    const loans = await readLoanData();
    res
      .status(200)
      .json({ message: "Loans retrieved successfully", data: loans });
  } catch (err) {
    console.error("Error fetching loans:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Add this route to loanRoutes.js
loanRoute.post("/update/loan", async (req, res) => {
  try {
    const { loanId, field, value } = req.body;
    
    if (!loanId || field === undefined || value === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const loans = await readLoanData();
    const loanIndex = loans.findIndex(loan => loan.id === loanId);
    
    if (loanIndex === -1) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Update the specific field
    loans[loanIndex][field] = value;
    
    // Update collection/return dates if needed
    if (field === "collected" && value === true) {
      loans[loanIndex].collection_date = new Date().toString();
    }
    if (field === "returned" && value === true) {
      loans[loanIndex].returning_date = new Date().toString();
    }

    await writeLoanData(loans);
    
    res.status(200).json({ 
      message: "Loan updated successfully",
      data: loans[loanIndex]
    });
  } catch (err) {
    console.error("Error updating loan:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = loanRoute;
