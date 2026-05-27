"use client";

import { useState } from "react";

export default function AIEssayPage() {

  const [essay, setEssay] =
    useState("");

  const [result, setResult] =
    useState("");

  const checkEssay = async () => {

    const response = await fetch(

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

    setResult(data.feedback);

  };

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        AI Essay Checker 🚀

      </h1>

      <textarea

        rows="12"

        cols="80"

        placeholder="Paste Essay Here"

        value={essay}

        onChange={(e) =>
          setEssay(e.target.value)
        }

      />

      <br /><br />

      <button onClick={checkEssay}>

        Check Essay

      </button>

      <br /><br />

      <div style={{

        border: "1px solid gray",
        padding: "20px"

      }}>

        <h2>

          AI Feedback

        </h2>

        <p>

          {result}

        </p>

      </div>

    </div>

  );

}