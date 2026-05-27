"use client";

import Link from "next/link";

import {
  useEffect,
  useState
} from "react";

export default function AdminPage() {

  const [questions, setQuestions] =
    useState([]);

  const [results, setResults] =
    useState([]);

  /*
  FETCH QUESTIONS
  */

  useEffect(() => {

    fetch(
      "http://localhost:5000/all-questions"
    )
      .then((res) => res.json())
      .then((data) => {

        setQuestions(data);

      });

  }, []);

  /*
  FETCH RESULTS
  */

  useEffect(() => {

    fetch(
      "http://localhost:5000/results/student123"
    )
      .then((res) => res.json())
      .then((data) => {

        setResults(data);

      });

  }, []);

  /*
  CALCULATIONS
  */

  const totalQuestions =
    questions.length;

  const totalTests =
    results.length;

  const averageScore =
    totalTests > 0

      ? Math.floor(

          results.reduce(

            (sum, r) =>
              sum + r.score,

            0

          ) / totalTests

        )

      : 0;

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        Admin Dashboard 👑

      </h1>

      {/* STATS */}

      <div style={{

        display: "grid",

        gridTemplateColumns:
          "repeat(3, 1fr)",

        gap: "20px",

        marginTop: "30px"

      }}>

        <div style={{

          border: "1px solid gray",

          padding: "20px"

        }}>

          <h2>

            Total Questions

          </h2>

          <p>

            {totalQuestions}

          </p>

        </div>

        <div style={{

          border: "1px solid gray",

          padding: "20px"

        }}>

          <h2>

            Total Mock Tests

          </h2>

          <p>

            {totalTests}

          </p>

        </div>

        <div style={{

          border: "1px solid gray",

          padding: "20px"

        }}>

          <h2>

            Average Score

          </h2>

          <p>

            {averageScore}

          </p>

        </div>

      </div>

      {/* ADMIN LINKS */}

      <div style={{

        display: "flex",

        flexDirection: "column",

        gap: "20px",

        marginTop: "40px"

      }}>

        <Link href="/admin/questions">

          Manage Questions

        </Link>

        <Link href="/admin/upload">

          Upload PDF Questions

        </Link>

        <Link href="/results">

          Student Results

        </Link>

        <Link href="/mock-test">

          Mock Test

        </Link>

        <Link href="/analytics">

          Analytics Dashboard

        </Link>

      </div>

      {/* RECENT RESULTS */}

      <br /><br />

      <h2>

        Recent Results 🚀

      </h2>

      {

        results.map((r) => (

          <div

            key={r._id}

            style={{

              border: "1px solid gray",

              padding: "20px",

              marginBottom: "20px"

            }}

          >

            <p>

              Module:
              {r.module}

            </p>

            <p>

              Score:
              {r.score}

            </p>

          </div>

        ))

      }

    </div>

  );

}