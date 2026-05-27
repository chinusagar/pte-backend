"use client";

import { useState } from "react";

export default function SpeakingTest() {

  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [score, setScore] = useState(null);

  /*
  START RECORDING
  */

  const startRecording = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    const recorder = new MediaRecorder(stream);

    const chunks = [];

    recorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    recorder.onstop = () => {

      const blob = new Blob(chunks, {
        type: "audio/webm"
      });

      const url = URL.createObjectURL(blob);

      setAudioURL(url);

      // 🔥 fake AI score (next step we will replace with real AI)
      setScore(Math.floor(Math.random() * 100));

    };

    recorder.start();

    setMediaRecorder(recorder);
  };

  /*
  STOP RECORDING
  */

  const stopRecording = () => {

    if (mediaRecorder) {
      mediaRecorder.stop();
    }

  };

  return (

    <div style={{ padding: "40px" }}>

      <h1>Speaking AI Test 🎤</h1>

      <button onClick={startRecording}>
        Start Recording
      </button>

      <button
        onClick={stopRecording}
        style={{ marginLeft: "10px" }}
      >
        Stop Recording
      </button>

      {audioURL && (
        <div style={{ marginTop: "20px" }}>
          <h3>Your Recording 🎧</h3>
          <audio controls src={audioURL} />
        </div>
      )}

      {score !== null && (
        <div style={{ marginTop: "20px" }}>
          <h2>AI Score 📊: {score}/100</h2>
          <p>Fluency analysis will be added in next step 🚀</p>
        </div>
      )}

    </div>

  );

}