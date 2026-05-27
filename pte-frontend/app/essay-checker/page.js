"use client";

import {
  useState
} from "react";

export default function EssayCheckerPage() {

  const [essay, setEssay] =
    useState("");

  const [feedback, setFeedback] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /*
  CHECK ESSAY
  */

  const checkEssay = async () => {

    try {

      setLoading(true);

      const response =
        await fetch(

          "http://localhost:5000/ai/check-essay",

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body: JSON.stringify({

              essay

            })

          }

        );

      const data =
        await response.json();

      setFeedback(
        data.feedback
      );

      setLoading(false);

    } catch (error) {

      console.log(error);

      setLoading(false);

    }

  };

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        AI Essay Checker 🧠

      </h1>

      <textarea

        rows="12"

        cols="80"

        placeholder=
          "Paste your PTE essay here..."

        value={essay}

        onChange={(e) =>
          setEssay(
            e.target.value
          )
        }

      />

      <br /><br />

      <button
        onClick={checkEssay}
      >

        Check Essay

      </button>

      <br /><br />

      {

        loading && (

          <p>

            Checking Essay...

          </p>

        )

      }

      {

        feedback && (

          <div style={{

            border:
              "1px solid gray",

            padding: "20px"

          }}>

            <h2>

              AI Feedback 🚀

            </h2>

            <p>

              {feedback}

            </p>

          </div>

        )

      }

    </div>

  );

}