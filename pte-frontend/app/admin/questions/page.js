"use client";

import { useEffect, useState } from "react";

export default function QuestionsPage() {

  const [questions, setQuestions] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [editQuestion, setEditQuestion] =
    useState("");

  /*
  FETCH QUESTIONS
  */

  const fetchQuestions = async () => {

    const response = await fetch(

      "http://localhost:5000/all-questions"

    );

    const data =
      await response.json();

    setQuestions(data);

  };

  useEffect(() => {

    fetchQuestions();

  }, []);

  /*
  DELETE
  */

  const deleteQuestion =
    async (id) => {

      await fetch(

        `http://localhost:5000/delete-question/${id}`,

        {

          method: "DELETE",

        }

      );

      fetchQuestions();

    };

  /*
  START EDIT
  */

  const startEdit = (q) => {

    setEditingId(q._id);

    setEditQuestion(q.question);

  };

  /*
  SAVE EDIT
  */

  const saveEdit = async (id) => {

    await fetch(

      `http://localhost:5000/update-question/${id}`,

      {

        method: "PUT",

        headers: {

          "Content-Type":
            "application/json"

        },

        body: JSON.stringify({

          question: editQuestion

        })

      }

    );

    setEditingId(null);

    fetchQuestions();

  };

  /*
  FILTER
  */

  const filteredQuestions =
    questions.filter((q) =>

      q.question
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )

    );

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        Manage Questions 🚀

      </h1>

      <input

        type="text"

        placeholder="Search Questions"

        value={search}

        onChange={(e) =>
          setSearch(e.target.value)
        }

        style={{

          width: "400px",
          padding: "10px"

        }}

      />

      <br /><br />

      {

        filteredQuestions.map((q) => (

          <div
            key={q._id}
            style={{

              border: "1px solid gray",
              padding: "20px",
              marginBottom: "20px"

            }}
          >

            <h3>

              {q.type}

            </h3>

            {

              editingId === q._id ? (

                <textarea

                  rows="5"

                  cols="60"

                  value={editQuestion}

                  onChange={(e) =>
                    setEditQuestion(
                      e.target.value
                    )
                  }

                />

              ) : (

                <p>

                  {q.question}

                </p>

              )

            }

            <p>

              Module:
              {q.module}

            </p>

            {

              editingId === q._id ? (

                <button
                  onClick={() =>
                    saveEdit(q._id)
                  }
                >

                  Save

                </button>

              ) : (

                <button
                  onClick={() =>
                    startEdit(q)
                  }
                >

                  Edit

                </button>

              )

            }

            <button
              onClick={() =>
                deleteQuestion(q._id)
              }
              style={{
                marginLeft: "10px"
              }}
            >

              Delete

            </button>

          </div>

        ))

      }

    </div>

  );

}