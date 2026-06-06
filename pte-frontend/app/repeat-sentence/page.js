"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RS_QUESTIONS } from "./questions.js";

function calculateScore(spoken, expected) {
  const clean = (t) => t.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/).filter(Boolean);
  const spokenWords = clean(spoken);
  const expectedWords = clean(expected);
  if (!spokenWords.length) return null;

  let matched = 0;
  const usedIndices = new Set();
  const wordDetails = expectedWords.map((word) => {
    const idx = spokenWords.findIndex((sw, i) => sw === word && !usedIndices.has(i));
    if (idx !== -1) { matched++; usedIndices.add(idx); return { word, correct: true }; }
    return { word, correct: false };
  });

  const wordAccuracy = Math.round((matched / expectedWords.length) * 100);
  const lengthRatio = Math.min(spokenWords.length / expectedWords.length, 1.2);
  const content = Math.min(3, Math.round((matched / expectedWords.length) * 3));
  const fluency = Math.min(3, Math.round(lengthRatio * 3));
  const pronunciation = Math.min(3, Math.round((wordAccuracy / 100) * 3));

  let orderScore = 0;
  let lastIdx = -1;
  spokenWords.forEach(sw => {
    const eIdx = expectedWords.indexOf(sw);
    if (eIdx > lastIdx) { orderScore++; lastIdx = eIdx; }
  });
  const listening = Math.min(3, Math.round((orderScore / expectedWords.length) * 3));
  const overall = Math.min(90, Math.round(
    (content / 3) * 20 + (fluency / 3) * 20 + (pronunciation / 3) * 25 + (listening / 3) * 25
  ));

  let feedback = "";
  if (overall >= 75) feedback = "Excellent! You repeated the sentence accurately with natural fluency and correct pronunciation.";
  else if (overall >= 55) feedback = "Good attempt. Focus on catching every word and maintaining the same word order as the original.";
  else if (overall >= 35) feedback = "Fair attempt. Listen more carefully and try to repeat as many words as possible in correct sequence.";
  else feedback = "Keep practicing. Listen carefully and try to remember key phrases before speaking.";

  const missed = expectedWords.filter(w => !spokenWords.includes(w)).slice(0, 5);
  if (missed.length > 0) feedback += " Missed: " + missed.join(", ");

  return {
    overall, content, fluency, pronunciation, listening,
    feedback, wordAccuracy, matched,
    spokenCount: spokenWords.length,
    expectedCount: expectedWords.length,
    wordDetails
  };
}

export default function PTERepeatSentence() {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [recordTime, setRecordTime] = useState(15);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showSentence, setShowSentence] = useState(false);

  const recognitionRef = useRef(null);
  const recTimerRef = useRef(null);
  const transcriptRef = useRef("");
  const audioCtxRef = useRef(null);

  const playBeep = useCallback((type) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const makeBeep = (freq, delay, dur) => {
        setTimeout(() => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine"; o.frequency.value = freq;
          g.gain.value = 0.3; o.start();
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
          o.stop(ctx.currentTime + dur + 0.02);
        }, delay);
      };
      if (type === "listen") makeBeep(880, 0, 0.3);
      if (type === "start") { makeBeep(523, 0, 0.15); makeBeep(659, 180, 0.15); makeBeep(784, 360, 0.15); }
      if (type === "stop") { makeBeep(784, 0, 0.25); makeBeep(523, 250, 0.35); }
    } catch (e) {}
  }, []);

  const cleanup = useCallback(() => {
    clearInterval(recTimerRef.current);
    try { if (recognitionRef.current) recognitionRef.current.stop(); } catch (e) {}
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setPhase("idle"); setRecordTime(15);
    setTranscript(""); setAnalysis(null);
    setError(""); setShowReport(false); setShowSentence(false);
    transcriptRef.current = "";
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Please use Google Chrome browser."); setPhase("idle"); return; }

    transcriptRef.current = "";
    setTranscript(""); setError("");
    setPhase("recording"); setRecordTime(15);
    playBeep("start");

    const recog = new SR();
    recognitionRef.current = recog;
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onresult = (e) => {
      let f = "", interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) f += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      transcriptRef.current = f;
      setTranscript(f + interim);
    };

    recog.onerror = (e) => {
      if (e.error === "not-allowed") {
        setError("Microphone access required. Please allow and reload.");
        setPhase("idle");
      }
    };

    recog.onend = () => {
      clearInterval(recTimerRef.current);
      playBeep("stop");
      const txt = transcriptRef.current.trim();
      if (txt) {
        const res = calculateScore(txt, RS_QUESTIONS[current]);
        if (res) {
          setAnalysis(res);
          setTotalAttempts(p => p + 1);
          if (res.overall > bestScore) setBestScore(res.overall);
          setShowReport(true);
          setShowSentence(true);
        } else setError("Analysis failed. Try again.");
      } else {
        setError("No speech detected. Speak clearly into your microphone.");
      }
      setPhase("done");
    };

    try { recog.start(); } catch (e) {
      setError("Cannot start microphone. Refresh page.");
      setPhase("idle"); return;
    }

    let t = 15;
    recTimerRef.current = setInterval(() => {
      t--;
      setRecordTime(t);
      if (t <= 0) {
        clearInterval(recTimerRef.current);
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    }, 1000);
  }, [current, playBeep, bestScore]);

  const stopRecording = useCallback(() => {
    clearInterval(recTimerRef.current);
    try { if (recognitionRef.current) recognitionRef.current.stop(); } catch (e) {}
  }, []);

  const playSentence = useCallback(() => {
    cleanup();
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    setPhase("listening");
    setAnalysis(null); setError("");
    setTranscript(""); setShowReport(false); setShowSentence(false);
    transcriptRef.current = "";
    playBeep("listen");

    setTimeout(() => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(RS_QUESTIONS[current]);
      utter.lang = "en-US"; utter.rate = 0.88; utter.pitch = 1;
      const voices = synth.getVoices();
      const v = voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("google")) ||
                voices.find(v => v.lang === "en-US") ||
                voices.find(v => v.lang.startsWith("en"));
      if (v) utter.voice = v;
      utter.onend = () => {
        setPhase("ready");
        setTimeout(() => startRecording(), 800);
      };
      utter.onerror = () => {
        setError("Audio playback failed. Try again.");
        setPhase("idle");
      };
      synth.speak(utter);
    }, 600);
  }, [current, cleanup, playBeep, startRecording]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const replayAudio = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(RS_QUESTIONS[current]);
    utter.lang = "en-US"; utter.rate = 0.88;
    const voices = synth.getVoices();
    const v = voices.find(v => v.lang === "en-US");
    if (v) utter.voice = v;
    synth.speak(utter);
  };

  const skip = () => {
    cleanup();
    setCurrent(c => c < RS_QUESTIONS.length - 1 ? c + 1 : 0);
    reset();
  };

  const goTo = (idx) => { cleanup(); setCurrent(idx); reset(); };

  const pct = ((current + 1) / RS_QUESTIONS.length) * 100;
  const recPct = (recordTime / 15) * 100;

  const scoreClr = (v, m) => {
    const p = (v / m) * 100;
    return p >= 70 ? "text-emerald-600" : p >= 45 ? "text-amber-500" : "text-red-500";
  };
  const barClr = (v, m) => {
    const p = (v / m) * 100;
    return p >= 70 ? "bg-emerald-500" : p >= 45 ? "bg-amber-500" : "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8ecf2] to-[#d5dbe5]">

      {/* Header */}
      <header className="relative">
        <div className="bg-[#002145]">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFB81C] to-[#e6a200] rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-[#002145] font-black text-xl">E</span>
              </div>
              <div className="border-l border-white/10 pl-3">
                <h1 className="text-white font-bold text-sm md:text-lg tracking-wider">EVEE PTE CLASSES</h1>
                <p className="text-[#FFB81C] text-[8px] md:text-[10px] font-semibold tracking-[0.3em]">OVERSEAS ADMISSIONS HUB</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/5 rounded-lg px-3 py-1.5 text-center border border-white/10">
                <p className="text-[#FFB81C] font-bold text-base">{totalAttempts}</p>
                <p className="text-white/40 text-[8px] tracking-wider">ATTEMPTS</p>
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-1.5 text-center border border-white/10">
                <p className="text-emerald-400 font-bold text-base">{bestScore}</p>
                <p className="text-white/40 text-[8px] tracking-wider">BEST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Bar */}
        <div className="bg-[#001a36] border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-[#FFB81C]/10 border border-[#FFB81C]/20 px-2.5 py-1 rounded">
                <svg className="w-3 h-3 text-[#FFB81C]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                </svg>
                <span className="text-[#FFB81C] text-[9px] font-bold tracking-wider">LISTENING + SPEAKING</span>
              </div>
              <span className="text-white/50 text-[11px]">Repeat Sentence</span>
              <span className="text-white/20">|</span>
              <span className="text-white/30 text-[11px] font-mono">{current + 1} / {RS_QUESTIONS.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/30 text-[9px]">AI Scoring</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-[3px] bg-[#001a36]">
          <div className="h-[3px] bg-gradient-to-r from-[#FFB81C] to-[#ffca4f] transition-all duration-700 rounded-r"
            style={{ width: `${pct}%` }} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 md:px-6 py-5">

        {/* Instruction Box */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200/80 mb-4 overflow-hidden">
          <div className="bg-[#002145] px-5 py-3">
            <p className="text-white text-[13px] font-medium leading-relaxed">
              {phase === "idle" && "You will hear a sentence. After the audio finishes, repeat the sentence as accurately as possible. Click \"Play & Listen\" to begin."}
              {phase === "listening" && "🔊 Listen carefully. Remember the sentence and repeat it exactly after the audio stops."}
              {phase === "ready" && "⏳ Get ready to speak. Recording will start automatically in a moment..."}
              {phase === "recording" && "🔴 Now repeat the sentence you just heard. Speak clearly and naturally. You have " + recordTime + " seconds."}
              {phase === "done" && "Recording complete. Your response has been analyzed. See your detailed score below."}
            </p>
          </div>

          {/* Status Bar */}
          <div className="px-5 py-3 bg-[#f7f8fb] border-b border-gray-100 flex items-center justify-between">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider ${
              phase === "recording" ? "bg-red-50 text-red-600 border border-red-200" :
              phase === "listening" ? "bg-violet-50 text-violet-600 border border-violet-200" :
              phase === "ready" ? "bg-amber-50 text-amber-600 border border-amber-200" :
              phase === "done" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
              "bg-gray-50 text-gray-500 border border-gray-200"
            }`}>
              {phase === "recording" && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              {phase === "listening" && <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />}
              {phase === "ready" && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
              {phase === "done" && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
              {phase === "idle" && <span className="w-2 h-2 bg-gray-400 rounded-full" />}
              {phase === "idle" && "READY"}
              {phase === "listening" && "PLAYING AUDIO"}
              {phase === "ready" && "GET READY..."}
              {phase === "recording" && "RECORDING"}
              {phase === "done" && "COMPLETED"}
            </div>

            {phase === "recording" && (
              <div className="flex items-center gap-3">
                <p className="text-3xl font-black tabular-nums text-red-500">
                  {recordTime}<span className="text-sm text-gray-300 font-normal">s</span>
                </p>
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#ef4444"
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${recPct / 100 * 100.5} 100.5`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Waveform */}
          {(phase === "listening" || phase === "recording") && (
            <div className={`px-5 py-2.5 border-b flex items-center gap-3 ${
              phase === "listening" ? "bg-violet-50 border-violet-100" : "bg-red-50 border-red-100"
            }`}>
              <div className="flex items-center gap-[3px]">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`w-[3px] rounded-full animate-pulse ${
                    phase === "listening" ? "bg-violet-400" : "bg-red-400"
                  }`} style={{
                    height: `${6 + Math.random() * 18}px`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.2 + Math.random() * 0.4}s`
                  }} />
                ))}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest animate-pulse ${
                phase === "listening" ? "text-violet-500" : "text-red-500"
              }`}>
                {phase === "listening" ? "🔊 Playing Sentence..." : "🎙️ Microphone Active"}
              </span>
            </div>
          )}
        </div>

        {/* Listening Hint Box */}
        {phase === "idle" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200/80 mb-4 overflow-hidden">
            <div className="px-5 py-2.5 bg-[#f7f8fb] border-b border-gray-100 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#002145] rounded-full" />
              <span className="text-[10px] font-bold text-[#002145] uppercase tracking-widest">How It Works</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { step: "1", icon: "🔊", label: "Listen", desc: "Sentence plays automatically" },
                  { step: "2", icon: "🧠", label: "Remember", desc: "Keep the sentence in mind" },
                  { step: "3", icon: "🎙️", label: "Repeat", desc: "Say it clearly into mic" }
                ].map(({ step, icon, label, desc }) => (
                  <div key={step} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 bg-[#002145] text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">{step}</div>
                    <p className="text-xl mb-1">{icon}</p>
                    <p className="text-xs font-bold text-gray-700">{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Original Sentence (after done) */}
        {showSentence && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200/80 mb-4 overflow-hidden">
            <div className="px-5 py-2.5 bg-[#f7f8fb] border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-[#002145] rounded-full" />
                <span className="text-[10px] font-bold text-[#002145] uppercase tracking-widest">Original Sentence</span>
              </div>
              <button onClick={replayAudio}
                className="text-[10px] text-violet-600 font-bold hover:text-violet-800 flex items-center gap-1 bg-violet-50 px-2 py-1 rounded-lg border border-violet-100">
                🔊 Replay
              </button>
            </div>
            <div className="p-5">
              <p className="text-[16px] leading-[1.9] text-gray-800 font-[420]">{RS_QUESTIONS[current]}</p>
            </div>
          </div>
        )}

        {/* Your Response */}
        {transcript && (
          <div className="bg-white rounded-xl shadow-md border border-sky-200 mb-4 overflow-hidden">
            <div className="px-5 py-2 bg-sky-50 border-b border-sky-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Your Response</span>
            </div>
            <div className="p-4">
              <p className="text-gray-700 text-[14px] leading-[1.9]">{transcript}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2.5 justify-center flex-wrap mb-5">
          {(phase === "idle" || phase === "done") ? (
            <>
              <button onClick={playSentence}
                className="bg-[#002145] text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-[#003060] transition-all shadow-lg flex items-center gap-2 active:scale-[0.97]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {phase === "done" ? "Try Again" : "Play & Listen"}
              </button>
              {current > 0 && (
                <button onClick={() => goTo(current - 1)}
                  className="bg-white text-gray-600 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 shadow-sm border border-gray-200">
                  Previous
                </button>
              )}
              <button onClick={skip}
                className="bg-[#FFB81C] text-[#002145] px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#ffca4f] shadow-sm">
                Skip
              </button>
              {current < RS_QUESTIONS.length - 1 && (
                <button onClick={() => goTo(current + 1)}
                  className="bg-white text-gray-600 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 shadow-sm border border-gray-200">
                  Next
                </button>
              )}
            </>
          ) : (
            <>
              {phase === "recording" && (
                <button onClick={stopRecording}
                  className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Stop Recording
                </button>
              )}
              <button onClick={skip}
                className="bg-[#FFB81C] text-[#002145] px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#ffca4f] shadow-sm">
                Skip
              </button>
              <button onClick={reset}
                className="bg-white text-gray-500 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 shadow-sm border border-gray-200">
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-4 mb-5">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Score Report */}
        {analysis && showReport && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-[#002145] to-[#003366] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FFB81C] rounded flex items-center justify-center">
                    <span className="text-[#002145] font-black text-sm">E</span>
                  </div>
                  <div>
                    <p className="text-[#FFB81C] text-[8px] font-bold tracking-[0.3em]">EVEE PTE CLASSES</p>
                    <h2 className="text-white text-base font-bold">Repeat Sentence — Score Report</h2>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
                  <p className="text-white/50 text-[8px] tracking-wider">ITEM</p>
                  <p className="text-white font-bold text-sm">{current + 1}/{RS_QUESTIONS.length}</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              {/* Overall Score */}
              <div className="flex flex-col items-center mb-8">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.25em] mb-3">Overall Score</p>
                <div className="relative">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f0f0f0" strokeWidth="7" />
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke={analysis.overall >= 65 ? "#059669" : analysis.overall >= 40 ? "#d97706" : "#dc2626"}
                      strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${(analysis.overall / 90) * 314} 314`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className={`text-5xl font-black leading-none ${scoreClr(analysis.overall, 90)}`}>{analysis.overall}</p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">out of 90</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-gray-100">
                  Communicative Skills
                </p>
                <div className="space-y-4">
                  {[
                    { lbl: "Content", val: analysis.content, max: 3, desc: "Words from sentence included in response" },
                    { lbl: "Oral Fluency", val: analysis.fluency, max: 3, desc: "Natural pace and smooth delivery" },
                    { lbl: "Pronunciation", val: analysis.pronunciation, max: 3, desc: "Correct sounds and intonation" },
                    { lbl: "Listening", val: analysis.listening, max: 3, desc: "Correct word order and comprehension" }
                  ].map(({ lbl, val, max, desc }) => (
                    <div key={lbl} className="flex items-center gap-4">
                      <div className="w-28 md:w-36 flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-700">{lbl}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-2.5 rounded-full transition-all duration-1000 ${barClr(val, max)}`}
                            style={{ width: `${(val / max) * 100}%` }} />
                        </div>
                        <span className={`text-lg font-black w-10 text-right ${scoreClr(val, max)}`}>
                          {val}<span className="text-[10px] text-gray-400 font-normal">/{max}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Word Analysis */}
              <div className="mb-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 pb-2 border-b border-gray-100">
                  Word-Level Analysis
                </p>
                <div className="flex flex-wrap gap-[5px]">
                  {analysis.wordDetails.map((wd, i) => (
                    <span key={i} className={`px-[6px] py-[2px] rounded text-[12px] font-medium ${
                      wd.correct
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-500 border border-red-200 line-through"
                    }`}>{wd.word}</span>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-[9px] text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2 bg-emerald-50 border border-emerald-200 rounded-sm" />Correct
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2 bg-red-50 border border-red-200 rounded-sm" />Missed
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                <p className="text-[10px] font-bold text-[#002145] uppercase tracking-wider mb-2">Examiner Feedback</p>
                <p className="text-gray-700 text-[13px] leading-[1.9]">{analysis.feedback}</p>
              </div>
            </div>

            <div className="bg-[#f7f8fb] border-t border-gray-100 px-5 py-2.5 flex justify-between">
              <p className="text-[8px] text-gray-400">Evee PTE Classes | Overseas Admissions Hub</p>
              <p className="text-[8px] text-gray-400">eveeoverseas.in | +91 94160 96391</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-5">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-5 h-5 bg-[#FFB81C] rounded flex items-center justify-center">
              <span className="text-[#002145] font-black text-[9px]">E</span>
            </div>
            <span className="text-[10px] text-gray-500 font-bold tracking-wider">EVEE PTE CLASSES</span>
          </div>
          <p className="text-[8px] text-gray-400">Overseas Admissions Hub | eveeoverseas.in | Chrome Required</p>
        </div>
      </main>
    </div>
  );
}