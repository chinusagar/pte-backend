"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PTE_QUESTIONS } from "./questions.js";

export default function PTEReadAloud() {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const [prepTime, setPrepTime] = useState(35);
  const [recordingTime, setRecordingTime] = useState(40);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preparationComplete, setPreparationComplete] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const prepTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);

  // Play beep sound function (JavaScript version - no type annotations)
  const playBeep = useCallback(async (type) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioCtx = audioContextRef.current;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      let frequency = 800;
      let duration = 0.3;
      
      if (type === 'start') {
        frequency = 880; // A5 note
        duration = 0.4;
      } else if (type === 'stop') {
        frequency = 440; // A4 note
        duration = 0.5;
      } else if (type === 'prep') {
        frequency = 660; // E5 note
        duration = 0.2;
      }
      
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
      oscillator.stop(audioCtx.currentTime + duration);
      
    } catch (err) {
      console.log("Beep error:", err);
    }
  }, []);

  // Preparation timer
  useEffect(() => {
    if (!started || recording || prepTime <= 0 || preparationComplete) return;

    prepTimerRef.current = setTimeout(() => {
      setPrepTime((prev) => prev - 1);
    }, 1000);

    return () => {
      if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    };
  }, [prepTime, started, recording, preparationComplete]);

  // Start recording when preparation time reaches 0
  useEffect(() => {
    if (started && prepTime === 0 && !recording && !preparationComplete) {
      setPreparationComplete(true);
      playBeep('prep');
      // Small delay before starting recording
      setTimeout(() => {
        startRecording();
      }, 100);
    }
  }, [prepTime, started, recording, preparationComplete, playBeep]);

  // Recording timer
  useEffect(() => {
    if (!recording || recordingTime <= 0) return;

    recordingTimerRef.current = setTimeout(() => {
      setRecordingTime((prev) => prev - 1);
    }, 1000);

    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    };
  }, [recordingTime, recording]);

  // Auto-stop recording when timer reaches 0
  useEffect(() => {
    if (recording && recordingTime === 0) {
      stopRecording();
    }
  }, [recordingTime, recording]);

  const startPractice = async () => {
    // Initialize audio context on user interaction
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    setStarted(true);
    setPrepTime(35);
    setRecordingTime(40);
    setPreparationComplete(false);
    setAnalysis(null);
    setError("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        // Play stop beep
        await playBeep('stop');

        // Send to backend for analysis
        setLoading(true);
        setError("");

        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          formData.append("question", PTE_QUESTIONS[current]);

          const response = await fetch("http://localhost:8000/api/analyze", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (response.ok) {
            setAnalysis(result.analysis);
          } else {
            setError(result.analysis?.feedback || "Failed to analyze recording");
          }
        } catch (err) {
          console.error("Error:", err);
          setError("Could not connect to AI server. Make sure backend is running.");
        } finally {
          setLoading(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      
      // Play start beep
      await playBeep('start');
      
    } catch (err) {
      console.error("Microphone error:", err);
      setError("Please allow microphone access to record your response.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const resetQuestion = () => {
    // Clear all timers
    if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    
    setPrepTime(35);
    setRecordingTime(40);
    setRecording(false);
    setAudioURL("");
    setAnalysis(null);
    setError("");
    setPreparationComplete(false);
    
    // Reset media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const nextQuestion = () => {
    if (current < PTE_QUESTIONS.length - 1) {
      setCurrent(current + 1);
      resetQuestion();
    }
  };

  const previousQuestion = () => {
    if (current > 0) {
      setCurrent(current - 1);
      resetQuestion();
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return "bg-green-50 border-green-200";
    if (score >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Evee PTE Class & Overseas Admissions Hub branding */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
            Evee PTE Class & Overseas Admissions Hub
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Read Aloud Practice with AI Scoring</p>
          <p className="text-sm text-gray-400 mt-1">Powered by Advanced Speech Recognition</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          
          {/* Question Counter */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-4 flex justify-between items-center">
            <div className="text-white">
              <span className="text-sm opacity-80">Question</span>
              <span className="text-2xl font-bold ml-2">{current + 1}</span>
              <span className="text-sm opacity-80 ml-1">/{PTE_QUESTIONS.length}</span>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-full">
              <span className="text-white font-semibold">
                {recording ? "🔴 RECORDING" : preparationComplete ? "✅ READY" : "📝 PREPARATION"}
              </span>
            </div>
          </div>

          {/* Timer Display */}
          <div className={`p-6 text-center transition-all duration-300 ${
            recording ? "bg-red-50" : preparationComplete ? "bg-green-50" : "bg-blue-50"
          }`}>
            {!recording && !preparationComplete && prepTime > 0 && (
              <div>
                <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold">Preparation Time</p>
                <p className="text-6xl font-bold text-blue-700 mt-2">{prepTime}s</p>
              </div>
            )}
            {recording && (
              <div>
                <p className="text-sm uppercase tracking-wider text-red-600 font-semibold animate-pulse">Recording Time</p>
                <p className="text-6xl font-bold text-red-700 mt-2">{recordingTime}s</p>
              </div>
            )}
            {preparationComplete && !recording && prepTime === 0 && recordingTime === 40 && (
              <div>
                <p className="text-sm uppercase tracking-wider text-green-600 font-semibold">Ready to Record</p>
                <p className="text-2xl text-green-600 mt-2">Click Start Recording when ready</p>
              </div>
            )}
          </div>

          {/* Question Text */}
          <div className="p-8 bg-gray-50 border-y border-gray-100">
            <p className="text-2xl leading-relaxed text-gray-800 font-medium text-center">
              {PTE_QUESTIONS[current]}
            </p>
            <div className="mt-4 text-center text-sm text-gray-400">
              {PTE_QUESTIONS[current].split(" ").length} words
            </div>
          </div>

          {/* Control Buttons */}
          <div className="p-6 flex gap-3 justify-center flex-wrap">
            {!started ? (
              <button
                onClick={startPractice}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                🎯 Start Practice
              </button>
            ) : (
              <>
                <button
                  onClick={startRecording}
                  disabled={recording || prepTime > 0}
                  className={`bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md flex items-center gap-2 ${
                    recording || prepTime > 0 ? "opacity-50 cursor-not-allowed" : "hover:from-green-700 hover:to-green-800 hover:shadow-lg"
                  }`}
                >
                  🎙️ Start Recording
                </button>

                <button
                  onClick={stopRecording}
                  disabled={!recording}
                  className={`bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md flex items-center gap-2 ${
                    !recording ? "opacity-50 cursor-not-allowed" : "hover:from-red-700 hover:to-red-800 hover:shadow-lg"
                  }`}
                >
                  ⏹️ Stop Recording
                </button>

                <button
                  onClick={previousQuestion}
                  disabled={current === 0}
                  className="bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md disabled:opacity-50"
                >
                  ◀ Previous
                </button>

                <button
                  onClick={nextQuestion}
                  disabled={current === PTE_QUESTIONS.length - 1}
                  className="bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md disabled:opacity-50"
                >
                  Next ▶
                </button>

                <button
                  onClick={resetQuestion}
                  className="bg-yellow-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-yellow-700 transition-all shadow-md"
                >
                  🔄 Reset
                </button>
              </>
            )}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 text-center bg-blue-50">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
              <p className="mt-3 text-blue-700 font-medium">AI Analyzing Your Response...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-center">{error}</p>
            </div>
          )}

          {/* Audio Playback */}
          {audioURL && (
            <div className="px-6 pb-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">Your Recording:</p>
              <audio controls src={audioURL} className="w-full rounded-lg" />
            </div>
          )}

          {/* Score Report */}
          {analysis && (
            <div className="m-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-lg">
              <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">
                📊 AI Score Report
              </h2>

              {/* Main Score Circle */}
              <div className="flex justify-center mb-8">
                <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-xl ${getScoreBgColor(analysis.overall)} border-4 ${
                  analysis.overall >= 70 ? "border-green-500" : analysis.overall >= 50 ? "border-yellow-500" : "border-red-500"
                }`}>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{analysis.overall}</p>
                    <p className="text-sm font-semibold">/90</p>
                    <p className="text-xs mt-1">Overall</p>
                  </div>
                </div>
              </div>

              {/* Score Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600 font-semibold">Content</p>
                  <p className="text-3xl font-bold text-blue-700">{analysis.content}</p>
                  <p className="text-xs text-gray-500">/6</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-gray-600 font-semibold">Fluency</p>
                  <p className="text-3xl font-bold text-orange-600">{analysis.fluency}</p>
                  <p className="text-xs text-gray-500">/5</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-gray-600 font-semibold">Pronunciation</p>
                  <p className="text-3xl font-bold text-purple-600">{analysis.pronunciation}</p>
                  <p className="text-xs text-gray-500">/5</p>
                </div>
              </div>

              {/* Word Accuracy Bar */}
              {analysis.wordAccuracy !== undefined && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700 font-medium">Word Accuracy</span>
                    <span className="font-bold text-blue-700">{analysis.wordAccuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${analysis.wordAccuracy}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Matched: {analysis.matchedWords}</span>
                    <span>Spoken: {analysis.spokenWords}</span>
                    <span>Expected: {analysis.expectedWords}</span>
                  </div>
                </div>
              )}

              {/* Pronunciation Accuracy */}
              {analysis.pronunciationAccuracy !== undefined && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700 font-medium">Pronunciation Quality</span>
                    <span className="font-bold text-purple-700">{analysis.pronunciationAccuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-700 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${analysis.pronunciationAccuracy}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  💡 AI Feedback
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {analysis.feedback}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>© 2024 Genebyte PTE Academic - Read Aloud Practice Tool</p>
          <p className="text-xs mt-1">Click anywhere to enable audio for beep sounds</p>
        </div>
      </div>
    </div>
  );
}