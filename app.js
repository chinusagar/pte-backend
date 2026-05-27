const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/questions/Speaking/Read Aloud", (req, res) => {

  res.json([
    {
      question:
        "Climate change is affecting the world economy."
    },
    {
      question:
        "Technology has improved communication."
    }
  ]);

});

app.listen(5000, () => {

  console.log("Server running on port 5000");

});