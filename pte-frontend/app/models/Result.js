const mongoose = require("mongoose");

const resultSchema =
  new mongoose.Schema({

    studentId: {

      type: String,

    },

    module: {

      type: String,

    },

    answers: {

      type: Object,

    },

    score: {

      type: Number,
      default: 0,

    },

  }, {

    timestamps: true,

  });

module.exports =
  mongoose.model(
    "Result",
    resultSchema
  );