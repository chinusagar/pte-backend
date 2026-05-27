"use client";

import {
  useEffect,
  useState
} from "react";

export default function LeaderboardPage() {

  const [leaders, setLeaders] =
    useState([]);

  useEffect(() => {

    fetch(
      "http://localhost:5000/leaderboard"
    )
      .then((res) => res.json())
      .then((data) => {

        setLeaders(data);

      });

  }, []);

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        Leaderboard 🏆

      </h1>

      {

        leaders.map((user, index) => (

          <div

            key={user._id}

            style={{

              border: "1px solid gray",

              padding: "20px",

              marginBottom: "20px"

            }}

          >

            <h2>

              Rank #{index + 1}

            </h2>

            <p>

              Student:
              {user.studentId}

            </p>

            <p>

              Score:
              {user.score}

            </p>

            <p>

              Module:
              {user.module}

            </p>

          </div>

        ))

      }

    </div>

  );

}