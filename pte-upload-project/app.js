require("dotenv").config();

const express = require("express");
const app = express();

const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pdfParse =
  require("pdf-parse");

require("./db");

/*
========================================
MODELS
========================================
*/

const Question =
  require("./models/Question");

const Result =
  require("./models/Result");

/*
========================================
ROUTES
========================================
*/

const authRoutes =
  require("./routes/authRoutes");

const speakingAI =
  require("./routes/speakingAI");

const auth =
  require("./middleware/auth");

/*
========================================
MIDDLEWARE
========================================
*/

app.use(cors());

app.use(express.json());

app.use("/auth", authRoutes);

app.use("/ai", speakingAI);

/*
========================================
UPLOAD FOLDER
========================================
*/

const uploadPath =
  path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {

  fs.mkdirSync(uploadPath);

}

/*
========================================
MULTER STORAGE
========================================
*/

const storage =
  multer.diskStorage({

    destination: function (
      req,
      file,
      cb
    ) {

      cb(null, uploadPath);

    },

    filename: function (
      req,
      file,
      cb
    ) {

      cb(
        null,
        Date.now() +
        "-" +
        file.originalname
      );

    },

  });

const upload =
  multer({ storage });

/*
========================================
HOME ROUTE
========================================
*/

app.get("/", (req, res) => {

  res.send(
    "PTE Backend Running Successfully 🚀"
  );

});

/*
========================================
GET ALL QUESTIONS
========================================
*/

app.get(
  "/all-questions",
  async (req, res) => {

    try {

      const questions =
        await Question.find();

      res.json(questions);

    } catch (error) {

      res.status(500).json({

        success: false,
        message: error.message,

      });

    }

  }
);

/*
========================================
RANDOM QUESTIONS
========================================
*/

app.get(
  "/questions/:module/:type",
  async (req, res) => {

    try {

      const questions =
        await Question.find({

          module:
            req.params.module,

          type:
            req.params.type

        });

      res.json(questions);

    } catch (error) {

      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);

/*
========================================
UPLOAD PDF
========================================
*/

app.post(
  "/upload-pdf",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          success: false,
          message: "No PDF uploaded"

        });

      }

      /*
      READ PDF
      */

      const dataBuffer =
        fs.readFileSync(req.file.path);

      const pdfData =
        await pdfParse(dataBuffer);

      /*
      SPLIT LINES
      */

      const lines =
        pdfData.text.split("\n");

      let savedQuestions = [];

      /*
      LOOP
      */

      for (const line of lines) {

        const text =
          line.trim();

        if (text.length < 20)
          continue;

        let type = "";
        let module = "";

        const lower =
          text.toLowerCase();

        /*
        SPEAKING
        */

        if (
          lower.includes("read aloud")
        ) {

          type = "Read Aloud";
          module = "Speaking";

        }

        else if (
          lower.includes("repeat sentence")
        ) {

          type = "Repeat Sentence";
          module = "Speaking";

        }

        else if (
          lower.includes("describe image")
        ) {

          type = "Describe Image";
          module = "Speaking";

        }

        else if (
          lower.includes("retell lecture")
        ) {

          type = "Retell Lecture";
          module = "Speaking";

        }

        else if (
          lower.includes("answer short question")
        ) {

          type = "Answer Short Question";
          module = "Speaking";

        }

        /*
        WRITING
        */

        else if (
          lower.includes("essay")
        ) {

          type = "Essay";
          module = "Writing";

        }

        else if (
          lower.includes("summarize written text")
        ) {

          type = "Summarize Written Text";
          module = "Writing";

        }

        /*
        READING
        */

        else if (
          lower.includes("re-order paragraphs")
        ) {

          type = "Re-order Paragraphs";
          module = "Reading";

        }

        else if (
          lower.includes("fill in the blanks")
        ) {

          type = "Reading Fill In The Blanks";
          module = "Reading";

        }

        /*
        LISTENING
        */

        else if (
          lower.includes("write from dictation")
        ) {

          type = "Write From Dictation";
          module = "Listening";

        }

        else if (
          lower.includes("summarize spoken text")
        ) {

          type = "Summarize Spoken Text";
          module = "Listening";

        }

        /*
        SAVE QUESTION
        */

        if (type !== "") {

          const alreadyExists =
            await Question.findOne({

              question: text

            });

          if (!alreadyExists) {

            const newQuestion =
              await Question.create({

                type,
                module,
                question: text

              });

            savedQuestions.push(
              newQuestion
            );

          }

        }

      }

      /*
      RESPONSE
      */

      res.json({

        success: true,

        totalSaved:
          savedQuestions.length,

        questions:
          savedQuestions

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,
        error: error.message

      });

    }

  }
);

/*
========================================
QUESTIONS BY TYPE
========================================
*/

app.get(
  "/questions/:module/:type",
  async (req, res) => {

    try {

      const questions =
        await Question.find({

          module:
            req.params.module,

          type:
            req.params.type

        });

      res.json(questions);

    } catch (error) {

      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);

/*
========================================
SAVE RESULT
========================================
*/

app.post(
  "/submit-result",
  async (req, res) => {

    try {

      const result =
        await Result.create(
          req.body
        );

      res.json({

        success: true,
        result,

      });

    } catch (error) {

      res.status(500).json({

        success: false,
        error: error.message,

      });

    }

  }
);

/*
========================================
GET RESULTS
========================================
*/

app.get(
  "/results",
  auth,
  async (req, res) => {

    try {

      const results =
        await Result.find({

          studentId:
            req.user.id,

        }).sort({

          createdAt: -1,

        });

      res.json(results);

    } catch (error) {

      res.status(500).json({

        success: false,
        error: error.message,

      });

    }

  }
);

/*
========================================
UPLOAD AUDIO
========================================
*/

app.post(
  "/upload-audio",
  upload.single("audio"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          success: false,
          message:
            "No audio uploaded",

        });

      }

      res.json({

        success: true,

        file:
          req.file.filename,

      });

    } catch (error) {

      res.status(500).json({

        success: false,
        error: error.message,

      });

    }

  }
);

/*
========================================
START SERVER
========================================
*/

const PORT = 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on http://localhost:${PORT}`
  );

});