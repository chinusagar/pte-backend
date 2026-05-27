const express = require("express");

const router = express.Router();

const OpenAI = require("openai");

const Question =
  require("../models/Question");

/*
========================================
OPENAI CONFIG
========================================
*/

const openai =
  new OpenAI({

    apiKey:
      process.env.OPENAI_API_KEY,

  });

/*
========================================
GENERATE AI QUESTION
========================================
*/

router.get(
  "/generate-question",
  async (req, res) => {

    try {

      const response =
        await openai.chat.completions.create({

          model: "gpt-4o-mini",

          messages: [

            {

              role: "user",

              content:
                "Generate one PTE Read Aloud question"

            }

          ],

        });

      const generatedQuestion =
        response.choices[0]
          .message.content;

      await Question.create({

        type: "Read Aloud",

        module: "Speaking",

        question:
          generatedQuestion,

      });

      res.json({

        success: true,

        question:
          generatedQuestion,

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
AI ESSAY CHECKER
========================================
*/

router.post(
  "/check-essay",
  async (req, res) => {

    try {

      const { essay } =
        req.body;

      const completion =
        await openai.chat.completions.create({

          model: "gpt-4o-mini",

          messages: [

            {

              role: "system",

              content:
                "You are a professional PTE examiner. Analyze essays and provide grammar, vocabulary, coherence, and estimated PTE score."

            },

            {

              role: "user",

              content: essay

            }

          ],

        });

      const feedback =
        completion.choices[0]
          .message.content;

      res.json({

        success: true,

        feedback,

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
AI SPEECH ANALYSIS
========================================
*/

router.post(
  "/speech-analysis",
  async (req, res) => {

    try {

      const feedback = {

        transcript:
          "Your speech was recognized successfully.",

        pronunciation:
          "Good pronunciation with minor mistakes.",

        fluency:
          "Fluent with moderate pauses.",

        score: 79,

      };

      res.json({

        success: true,

        feedback,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        error: error.message,

      });

    }

  }
);

module.exports = router;