"use client";

import { useEffect, useState } from "react";

export default function ResultsPage() {

  const [results, setResults] =
    useState([]);

  useEffect(() => {

    fetch(
      "http://localhost:5000/results/student123"
    )
      .then((res) => res.json())
      .then((data) => {

        setResults(data);

      });

  }, []);

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        Student Results 🚀

      </h1>

      {

        results.map((r, index) => (

          <div
            key={r._id}
            style={{

              border: "1px solid gray",
              padding: "20px",
              marginBottom: "20px"

            }}
          >

            <h3>

              Attempt {index + 1}

            </h3>

            <p>

              Module:
              {r.module}

            </p>

            <p>

              Score:
              {r.score}

            </p>

            <p>

              Date:
              {
                new Date(
                  r.createdAt
                ).toLocaleString()
              }

            </p>

          </div>

        ))

      }

    </div>

  );

}