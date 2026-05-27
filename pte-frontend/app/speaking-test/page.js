"use client";

import { useState, useRef } from "react";

export default function SpeakingTestPage() {

  const [recording, setRecording] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const [audioURL, setAudioURL] = useState("");

  const mediaRecorderRef = useRef(null);

  const chunksRef = useRef([]);

  /*
  START RECORDING
  */

  const startRecording = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({

          audio: true

        });

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {

        chunksRef.current.push(e.data);

      };

      mediaRecorder.onstop = async () => {

        const blob = new Blob(

          chunksRef.current,

          {
            type: "audio/webm"
          }

        );

        const url =
          URL.createObjectURL(blob);

        setAudioURL(url);

        /*
        SEND TO BACKEND
        */

        await analyzeSpeech(blob);

      };

      mediaRecorder.start();

      setRecording(true);

      /*
      AUTO STOP AFTER 5 SEC
      */

      setTimeout(() => {

        stopRecording();

      }, 5000);

    } catch (error) {

      console.log(error);

    }

  };

  /*
  STOP RECORDING
  */

  const stopRecording = () => {

    if (mediaRecorderRef.current) {

      mediaRecorderRef.current.stop();

      setRecording(false);

    }

  };

  /*
  AI ANALYSIS
  */

  const analyzeSpeech = async (audioBlob) => {

    try {

      const formData =
        new FormData();

      formData.append(
        "audio",
        audioBlob
      );

      const response =
        await fetch(

          "http://localhost:5000/ai/transcribe",

          {

            method: "POST",

            body: formData

          }

        );

      const data =
        await response.json();

      /*
      SAVE AI RESPONSE
      */

      setFeedback(data.analysis);

    } catch (error) {

      console.log(error);

    }

  };

  return (

    <div style={{ padding: "40px" }}>

      <h1>

        AI Speaking Test 🎤

      </h1>

      <button onClick={startRecording}>

        {

          recording

            ? "Recording..."

            : "Start Recording"

        }

      </button>

      <button

        onClick={stopRecording}

        style={{
          marginLeft: "10px"
        }}

      >

        Stop

      </button>

      <br /><br />

      {/* AUDIO PLAYER */}

      {

        audioURL && (

          <div>

            <h3>

              Your Recording 🎧

            </h3>

            <audio
              controls
              src={audioURL}
            />

          </div>

        )

      }

      {/* AI REPORT */}

      {

        feedback && (

          <div style={{ marginTop: "30px" }}>

            <h2>

              AI Speaking Report 🚀

            </h2>

            <div

              style={{

                display: "grid",

                gridTemplateColumns:
                  "repeat(2, 1fr)",

                gap: "20px",

                marginTop: "20px"

              }}

            >

              <ScoreCard

                title="Overall Score"

                value={
                  feedback.overall_score
                }

              />

              <ScoreCard

                title="Fluency"

                value={
                  feedback.fluency
                }

              />

              <ScoreCard

                title="Pronunciation"

                value={
                  feedback.pronunciation
                }

              />

              <ScoreCard

                title="Grammar"

                value={
                  feedback.grammar
                }

              />

              <ScoreCard

                title="Vocabulary"

                value={
                  feedback.vocabulary
                }

              />

            </div>

            {/* FEEDBACK */}

            <div

              style={{

                marginTop: "30px",

                border: "1px solid gray",

                padding: "20px",

                borderRadius: "10px"

              }}

            >

              <h3>

                AI Feedback 💡

              </h3>

              <p>

                {feedback.feedback}

              </p>

            </div>

          </div>

        )

      }

    </div>

  );

}

/*
SCORE CARD COMPONENT
*/

function ScoreCard({

  title,
  value

}) {

  return (

    <div

      style={{

        border: "1px solid gray",

        padding: "20px",

        borderRadius: "10px"

      }}

    >

      <h3>

        {title}

      </h3>

      <h1>

        {value}

      </h1>

    </div>

  );

}