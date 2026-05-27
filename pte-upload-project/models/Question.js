const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  type: String,
  module: String,
  question: String,
});

module.exports = mongoose.model(
  "Question",
  questionSchema
);