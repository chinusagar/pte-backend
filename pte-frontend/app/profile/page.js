"use client";

import { useState } from "react";

export default function ProfilePage() {

  const [name, setName] =
    useState("");

  const [targetScore, setTargetScore] =
    useState("");

  const [examDate, setExamDate] =
    useState("");

  const [photo, setPhoto] =
    useState(null);

  /*
  SAVE PROFILE
  */

  const saveProfile = () => {

    alert(
      "Profile Saved Successfully 🚀"
    );

  };

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        Student Profile 👤

      </h1>

      <div style={{

        display: "flex",

        flexDirection: "column",

        gap: "20px",

        maxWidth: "400px",

        marginTop: "30px"

      }}>

        <input

          type="text"

          placeholder="Student Name"

          value={name}

          onChange={(e) =>
            setName(e.target.value)
          }

        />

        <input

          type="number"

          placeholder="Target Score"

          value={targetScore}

          onChange={(e) =>
            setTargetScore(e.target.value)
          }

        />

        <input

          type="date"

          value={examDate}

          onChange={(e) =>
            setExamDate(e.target.value)
          }

        />

        <input

          type="file"

          onChange={(e) =>
            setPhoto(
              e.target.files[0]
            )
          }

        />

        <button
          onClick={saveProfile}
        >

          Save Profile

        </button>

      </div>

      <br />

      {

        photo && (

          <div>

            <h3>

              Preview 🚀

            </h3>

            <img

              src={URL.createObjectURL(photo)}

              alt="profile"

              width="200"

            />

          </div>

        )

      }

    </div>

  );

}