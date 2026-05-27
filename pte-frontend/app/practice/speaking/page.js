"use client";

import { useEffect, useState } from "react";

export default function SpeakingPractice() {

  const [questions, setQuestions] =
    useState([]);

  useEffect(() => {

    fetch(
      "http://localhost:5000/random/Speaking"
    )
      .then((res) => res.json())
      .then((data) => {

        setQuestions(data);

      });

  }, []);

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        Speaking Practice

      </h1>

      {

        questions.map((q, index) => (

          <div
            key={q._id}
            style={{

              border: "1px solid gray",
              padding: "20px",
              marginBottom: "20px"

            }}
          >

            <h3>

              Question {index + 1}

            </h3>

            <p>

              {q.question}

            </p>

            <button>

              Start Recording

            </button>

          </div>

        ))

      }

    </div>

  );

}