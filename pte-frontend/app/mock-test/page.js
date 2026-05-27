"use client";

import {
  useState,
  useEffect
} from "react";

export default function MockTestPage() {

  /*
  STATES
  */

  const [questions, setQuestions] =
    useState([]);

  const [current, setCurrent] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [timeLeft, setTimeLeft] =
    useState(1800);

  /*
  FETCH QUESTIONS
  */

  useEffect(() => {

    fetch(
      "http://localhost:5000/random/Speaking"
    )
      .then((res) => res.json())
      .then((data) => {

        setQuestions(data);

      });

  }, []);

  /*
  TIMER
  */

  useEffect(() => {

    if (timeLeft <= 0) {

      alert(
        "Time Up! Test Submitted 🚀"
      );

      submitTest();

      return;

    }

    const timer =
      setInterval(() => {

        setTimeLeft(

          (prev) => prev - 1

        );

      }, 1000);

    return () =>
      clearInterval(timer);

  }, [timeLeft]);

  /*
  HANDLE ANSWER
  */

  const handleAnswer = (value) => {

    setAnswers({

      ...answers,

      [questions[current]?._id]:
        value,

    });

  };

  /*
  NEXT QUESTION
  */

  const nextQuestion = () => {

    if (
      current <
      questions.length - 1
    ) {

      setCurrent(current + 1);

    }

  };

  /*
  PREVIOUS QUESTION
  */

  const prevQuestion = () => {

    if (current > 0) {

      setCurrent(current - 1);

    }

  };

  /*
  SUBMIT TEST
  */

  const submitTest = async () => {

    try {

      const response =
        await fetch(

          "http://localhost:5000/submit-result",

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body: JSON.stringify({

              studentId:
                "student123",

              module:
                "Mock Test",

              answers,

              score:
                Math.floor(
                  Math.random() * 90
                )

            })

          }

        );

      const data =
        await response.json();

      alert(
        "Mock Test Submitted 🚀"
      );

      console.log(data);

    } catch (error) {

      console.log(error);

    }

  };

  /*
  FORMAT TIME
  */

  const formatTime = (seconds) => {

    const mins =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    return `${mins}:${secs
      .toString()
      .padStart(2, "0")}`;

  };

  /*
  LOADING
  */

  if (
    questions.length === 0
  ) {

    return (

      <h1>

        Loading Questions...

      </h1>

    );

  }

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>

        Full Mock Test 🚀

      </h1>

      {/* TIMER */}

      <h2>

        Time Left:
        {" "}
        {formatTime(timeLeft)}

      </h2>

      {/* QUESTION BOX */}

      <div style={{

        border: "1px solid gray",

        padding: "20px",

        marginTop: "20px"

      }}>

        <h3>

          Question {current + 1}

        </h3>

        <p>

          {
            questions[current]
              ?.question
          }

        </p>

        <textarea

          rows="6"

          cols="70"

          value={

            answers[
              questions[current]
                ?._id
            ] || ""

          }

          onChange={(e) =>

            handleAnswer(
              e.target.value
            )

          }

        />

      </div>

      {/* BUTTONS */}

      <br />

      <button
        onClick={prevQuestion}
      >

        Previous

      </button>

      <button

        onClick={nextQuestion}

        style={{
          marginLeft: "10px"
        }}

      >

        Next

      </button>

      <button

        onClick={submitTest}

        style={{
          marginLeft: "10px"
        }}

      >

        Submit Test

      </button>

    </div>

  );

}