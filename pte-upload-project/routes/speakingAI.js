const express = require("express");

const router = express.Router();

/*
REALISTIC PTE READ ALOUD SCORING
*/

router.post("/transcribe", async (req, res) => {

  try {

    /*
    TRANSCRIPT FROM FRONTEND
    */

    const transcript =
      (
        req.body.transcript || ""
      )
        .toLowerCase()
        .trim();

    /*
    QUESTION TEXT
    */

    const expectedText =
      (
        req.body.question || ""
      )
        .toLowerCase()
        .trim();

    /*
    REMOVE SYMBOLS
    */

    const cleanTranscript =
      transcript.replace(
        /[^\w\s]/g,
        ""
      );

    const cleanExpected =
      expectedText.replace(
        /[^\w\s]/g,
        ""
      );

    /*
    WORD ARRAYS
    */

    const spokenWords =
      cleanTranscript
        .split(/\s+/)
        .filter(Boolean);

    const expectedWords =
      cleanExpected
        .split(/\s+/)
        .filter(Boolean);

    /*
    WORD MATCHING
    */

    let matchedWords = 0;

    expectedWords.forEach((word) => {

      if (
        spokenWords.includes(word)
      ) {

        matchedWords++;

      }

    });

    /*
    ACCURACY %
    */

    const accuracy =
      expectedWords.length > 0
        ? matchedWords /
          expectedWords.length
        : 0;

    /*
    SPOKEN LENGTH %
    */

    const lengthRatio =
      expectedWords.length > 0
        ? spokenWords.length /
          expectedWords.length
        : 0;

    /*
    CONTENT SCORE (0-6)
    */

    let content = 0;

    if (
      accuracy >= 0.90 &&
      lengthRatio >= 0.90
    ) {

      content = 6;

    } else if (
      accuracy >= 0.75 &&
      lengthRatio >= 0.75
    ) {

      content = 5;

    } else if (
      accuracy >= 0.60 &&
      lengthRatio >= 0.60
    ) {

      content = 4;

    } else if (
      accuracy >= 0.40
    ) {

      content = 3;

    } else if (
      accuracy >= 0.20
    ) {

      content = 2;

    } else {

      content = 1;

    }

    /*
    FLUENCY SCORE (0-5)
    */

    let fluency = 1;

    if (
      spokenWords.length >=
      expectedWords.length * 0.9
    ) {

      fluency = 5;

    } else if (
      spokenWords.length >=
      expectedWords.length * 0.7
    ) {

      fluency = 4;

    } else if (
      spokenWords.length >=
      expectedWords.length * 0.5
    ) {

      fluency = 3;

    } else if (
      spokenWords.length >=
      expectedWords.length * 0.3
    ) {

      fluency = 2;

    }

    /*
    PRONUNCIATION SCORE (0-5)
    */

    let pronunciation = 1;

    if (accuracy >= 0.90) {

      pronunciation = 5;

    } else if (
      accuracy >= 0.75
    ) {

      pronunciation = 4;

    } else if (
      accuracy >= 0.55
    ) {

      pronunciation = 3;

    } else if (
      accuracy >= 0.35
    ) {

      pronunciation = 2;

    }

    /*
    OVERALL SCORE (0-90)
    */

    const overall =
      Math.round(

        (
          (
            (content / 6) * 90 +
            (fluency / 5) * 90 +
            (pronunciation / 5) * 90
          ) / 3
        )

      );

    /*
    FEEDBACK
    */

    let feedback =
      "Good performance.";

    if (
      spokenWords.length < 5
    ) {

      feedback =
        "You spoke very little. Read the complete paragraph.";

    } else if (
      accuracy < 0.5
    ) {

      feedback =
        "Try improving pronunciation and reading accuracy.";

    } else if (
      accuracy > 0.85
    ) {

      feedback =
        "Excellent reading accuracy and fluency.";

    }

    /*
    RESPONSE
    */

    return res.json({

      transcript,

      analysis: {

        overall_score:
          overall,

        content,

        fluency,

        pronunciation,

        accuracy:
          Math.round(
            accuracy * 100
          ),

        matched_words:
          matchedWords,

        total_words:
          expectedWords.length,

        feedback

      }

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      error:
        "AI analysis failed"

    });

  }

});

module.exports = router;