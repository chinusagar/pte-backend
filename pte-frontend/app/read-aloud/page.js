// C:\Users\itsme\pte-backend\pte-frontend\app\practice\read-aloud\page.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ===== ALL 200 PTE READ ALOUD QUESTIONS =====
const PTE_QUESTIONS = [
  "The advancement of technology has significantly transformed the way people communicate with each other across the globe. Social media platforms and instant messaging applications have made it possible to connect with individuals from different countries within seconds, breaking down traditional barriers of distance and time that once limited human interaction and collaboration.",
  "Climate change represents one of the most pressing challenges facing humanity in the twenty first century. Rising global temperatures have led to melting polar ice caps, increasing sea levels, and more frequent extreme weather events. Scientists around the world are working tirelessly to develop sustainable solutions that can help mitigate the devastating effects of environmental degradation on our planet.",
  "The education system plays a crucial role in shaping the future of any nation by providing young minds with the knowledge and skills they need to succeed. Modern educational institutions are increasingly incorporating digital tools and interactive learning methods to enhance student engagement and improve academic outcomes across various disciplines and fields of study.",
  "International trade has become an essential component of the global economy, enabling countries to exchange goods and services across borders. Free trade agreements between nations have facilitated economic growth and created new opportunities for businesses to expand their operations into emerging markets, fostering greater cooperation and mutual prosperity among participating countries.",
  "Medical research has made remarkable progress in recent decades, leading to the development of innovative treatments and therapies for previously incurable diseases. The discovery of new vaccines and pharmaceutical compounds has significantly improved public health outcomes worldwide, extending life expectancy and enhancing the quality of life for millions of people across different continents.",
  "Artificial intelligence is rapidly transforming various industries by automating complex tasks and providing data driven insights that help organizations make better decisions. Machine learning algorithms can analyze vast amounts of information in real time, identifying patterns and trends that would be impossible for human analysts to detect without the assistance of advanced computational technology.",
  "The preservation of cultural heritage is essential for maintaining a society connection to its history and traditions. Museums, libraries, and archives serve as vital repositories of human knowledge and artistic expression, allowing future generations to learn from the achievements and experiences of those who came before them in the long journey of civilization.",
  "Renewable energy sources such as solar, wind, and hydroelectric power are becoming increasingly important as the world seeks to reduce its dependence on fossil fuels. Government policies and private sector investments in clean energy infrastructure have accelerated the transition toward a more sustainable energy system that can meet growing global demand while minimizing environmental impact.",
  "The global tourism industry has experienced significant growth over the past few decades, contributing substantially to economic development in many countries around the world. Travel and hospitality sectors provide employment opportunities for millions of people while promoting cross cultural understanding and appreciation among visitors from diverse backgrounds and nationalities.",
  "Urban planning and sustainable city development have become critical priorities for governments worldwide as populations continue to grow and concentrate in metropolitan areas. Smart city initiatives that leverage technology to improve transportation, energy efficiency, and public services are helping create more livable and environmentally responsible communities for current and future residents.",
  // ===== BAaki 190 Questions Yahan Add Karein =====
  // Maine upar 200 questions diye the, woh sab yahan paste karein
  // Ya maine jo HTML file mein diya tha, wahan se copy karein
];

// ===== SCORE CALCULATION =====
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
  const content = Math.min(6, Math.round((matched / expectedWords.length) * 6));
  const rawFluency = Math.min(5, Math.round(lengthRatio * 4.5));
  const fluency = spokenWords.length >= expectedWords.length * 0.6 ? rawFluency : Math.max(1, rawFluency - 1);
  const pronunciation = Math.min(5, Math.round((wordAccuracy / 100) * 5));
  const overall = Math.min(90, Math.round((content / 6) * 40 + (fluency / 5) * 30 + (pronunciation / 5) * 30));

  let feedback = "";
  if (overall >= 75) feedback = "Excellent! Your reading demonstrates strong fluency and accurate pronunciation. You are well-prepared for this section of the PTE exam.";
  else if (overall >= 60) feedback = "Good performance. Focus on maintaining a steady pace and pronouncing each word distinctly. Practice reading longer passages to build stamina.";
  else if (overall >= 40) feedback = "Fair attempt. Try reading more slowly and carefully. Pay attention to word endings and stressed syllables. Regular practice will improve your score.";
  else feedback = "This section needs more practice. Read the passage silently first, then read aloud slowly. Focus on one sentence at a time and gradually increase your speed.";

  return { overall, content, fluency, pronunciation, feedback, wordAccuracy, matched,
    spokenCount: spokenWords.length, expectedCount: expectedWords.length, wordDetails };
}

// ===== MAIN COMPONENT =====
export default function PTEReadAloud() {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [prepTime, setPrepTime] = useState(35);
  const [recordTime, setRecordTime] = useState(40);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [showReport, setShowReport] = useState(false);

  const recognitionRef = useRef(null);
  const prepTimerRef = useRef(null);
  const recTimerRef = useRef(null);
  const transcriptRef = useRef("");
  const audioCtxRef = useRef(null);

  // ===== BEEP SOUNDS =====
  const playBeep = useCallback((type) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (type === "start") {
        [0, 180, 360].forEach((delay, i) => {
          setTimeout(() => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = "sine";
            o.frequency.value = [523, 659, 784][i];
            g.gain.value = 0.3;
            o.start();
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
            o.stop(ctx.currentTime + 0.18);
          }, delay);
        });
      } else if (type === "stop") {
        [0, 250].forEach((delay, i) => {
          setTimeout(() => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = "sine";
            o.frequency.value = [784, 523][i];
            g.gain.value = 0.3;
            o.start();
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            o.stop(ctx.currentTime + 0.3);
          }, delay);
        });
      } else if (type === "tick") {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine";
        o.frequency.value = 1000;
        g.gain.value = 0.15;
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        o.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {}
  }, []);

  const cleanup = useCallback(() => {
    clearInterval(prepTimerRef.current);
    clearInterval(recTimerRef.current);
    try { if (recognitionRef.current) recognitionRef.current.stop(); } catch (e) {}
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setPhase("idle"); setPrepTime(35); setRecordTime(40);
    setTranscript(""); setAnalysis(null); setError(""); setShowReport(false);
    transcriptRef.current = "";
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("This feature requires Google Chrome browser."); setPhase("idle"); return; }

    transcriptRef.current = "";
    setTranscript(""); setAnalysis(null); setError("");
    setPhase("recording"); setRecordTime(40);
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
        setError("Microphone access is required. Please allow microphone access and reload this page.");
        setPhase("idle");
      }
    };

    recog.onend = () => {
      clearInterval(recTimerRef.current);
      playBeep("stop");
      const txt = transcriptRef.current.trim();
      if (txt) {
        const res = calculateScore(txt, PTE_QUESTIONS[current]);
        if (res) {
          setAnalysis(res);
          setTotalAttempts(p => p + 1);
          if (res.overall > bestScore) setBestScore(res.overall);
          setShowReport(true);
        } else setError("Analysis failed. Please try again.");
      } else {
        setError("No speech was detected. Please ensure your microphone is connected and working.");
      }
      setPhase("done");
    };

    try { recog.start(); } catch (e) { setError("Unable to access microphone. Please refresh and try again."); setPhase("idle"); return; }

    let t = 40;
    recTimerRef.current = setInterval(() => {
      t--;
      setRecordTime(t);
      if (t <= 0) { clearInterval(recTimerRef.current); try { recog.stop(); } catch (e) {} }
    }, 1000);
  }, [current, playBeep, bestScore]);

  const stopRecording = useCallback(() => {
    clearInterval(recTimerRef.current);
    try { if (recognitionRef.current) recognitionRef.current.stop(); } catch (e) {}
  }, []);

  const startPrep = useCallback(() => {
    cleanup();
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    setPhase("prep"); setPrepTime(35);
    setAnalysis(null); setError(""); setTranscript(""); setShowReport(false);
    transcriptRef.current = "";

    let t = 35;
    prepTimerRef.current = setInterval(() => {
      t--;
      setPrepTime(t);
      if (t <= 3 && t >= 1) playBeep("tick");
      if (t <= 0) { clearInterval(prepTimerRef.current); startRecording(); }
    }, 1000);
  }, [cleanup, startRecording, playBeep]);

  const skip = () => {
    cleanup();
    setCurrent(c => c < PTE_QUESTIONS.length - 1 ? c + 1 : 0);
    reset();
  };

  const goTo = (idx) => {
    cleanup();
    setCurrent(idx);
    reset();
  };

  const wc = PTE_QUESTIONS[current].split(" ").length;
  const pct = ((current + 1) / PTE_QUESTIONS.length) * 100;
  const prepPct = (prepTime / 35) * 100;
  const recPct = (recordTime / 40) * 100;

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-sans">
      {/* ===== HEADER ===== */}
      <header className="bg-[#003057] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#003057] via-[#00426e] to-[#003057]" />
        <div className="relative z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                <div className="w-8 h-8 bg-[#FFB81C] rounded-sm flex items-center justify-center">
                  <span className="text-[#003057] font-black text-base leading-none">E</span>
                </div>
                <div className="w-1 h-8 bg-[#FFB81C]/30 rounded-full mx-1" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm md:text-base tracking-wide">
                  EVEE PTE CLASSES
                </h1>
                <p className="text-[#FFB81C] text-[8px] md:text-[9px] font-semibold tracking-[0.35em] uppercase">
                  OVERSEAS ADMISSIONS HUB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="text-[9px] text-white/40 uppercase tracking-wider">Attempts</p>
                  <p className="text-white font-bold text-sm leading-none">{totalAttempts}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-right ml-2">
                  <p className="text-[9px] text-white/40 uppercase tracking-wider">Best Score</p>
                  <p className="text-[#FFB81C] font-bold text-sm leading-none">{bestScore}/90</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#00263e] border-t border-white/5">
            <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#FFB81C]/10 border border-[#FFB81C]/20 px-3 py-1 rounded">
                  <svg className="w-3.5 h-3.5 text-[#FFB81C]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                  <span className="text-[#FFB81C] text-[10px] font-bold uppercase tracking-wider">Speaking</span>
                </div>
                <span className="text-white/70 text-xs font-medium">Read Aloud</span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/40 text-xs">Item {current + 1} of {PTE_QUESTIONS.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/40 text-[10px] font-medium">AI Active</span>
              </div>
            </div>
          </div>
          <div className="h-0.5 bg-white/5">
            <div className="h-0.5 bg-[#FFB81C] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Instruction Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
          <div className="bg-[#003057] px-4 py-2">
            <p className="text-white text-xs font-semibold tracking-wide">
              {phase === "idle" && "Click 'Begin' to start practice."}
              {phase === "prep" && "Prepare to read. Starting in " + prepTime + " seconds."}
              {phase === "recording" && "Reading... " + recordTime + " seconds remaining."}
              {phase === "done" && "Response recorded. Check your score below."}
            </p>
          </div>
        </div>

        {/* Passage Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Reading Passage
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {wc} words
            </span>
          </div>
          <div className="p-5 md:p-8">
            <p className="text-[17px] md:text-[19px] leading-[2.1] text-gray-800">
              {PTE_QUESTIONS[current]}
            </p>
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-white rounded-lg shadow-sm border border-indigo-200 mb-4 overflow-hidden">
            <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                Live Transcript
              </span>
            </div>
            <div className="p-4">
              <p className="text-gray-700 text-sm leading-relaxed">{transcript}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-center flex-wrap mb-4">
          {(phase === "idle" || phase === "done") ? (
            <>
              <button onClick={startPrep}
                className="bg-[#003057] text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-[#00426e] transition-all shadow-md flex items-center gap-2">
                {phase === "done" ? "Try Again" : "Begin"}
              </button>
              <button onClick={skip}
                className="bg-[#FFB81C] text-[#003057] px-5 py-3 rounded-lg font-bold text-sm hover:bg-[#ffca4f] transition-all shadow-sm">
                Skip →
              </button>
            </>
          ) : (
            <>
              {phase === "recording" && (
                <button onClick={stopRecording}
                  className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-md">
                  Finish Recording
                </button>
              )}
              <button onClick={reset}
                className="bg-white text-gray-500 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all shadow-sm border border-gray-200">
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg mt-0.5">⚠</span>
              <div>
                <p className="text-red-800 font-semibold text-sm">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Score Report */}
        {analysis && showReport && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div className="bg-[#003057] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#FFB81C] text-[9px] font-bold uppercase tracking-[0.3em]">
                    Evee PTE Classes
                  </p>
                  <h2 className="text-white text-lg font-bold mt-1">
                    Read Aloud — Score Report
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[9px] uppercase tracking-wider">Question</p>
                  <p className="text-white font-bold">{current + 1}/{PTE_QUESTIONS.length}</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              {/* Overall Score */}
              <div className="flex flex-col items-center mb-8">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-3">Overall Score</p>
                <div className="text-center">
                  <p className={`text-5xl font-black ${
                    analysis.overall >= 65 ? "text-emerald-600" :
                    analysis.overall >= 40 ? "text-amber-600" : "text-red-600"
                  }`}>{analysis.overall}</p>
                  <p className="text-[11px] text-gray-400 font-semibold mt-1">out of 90</p>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Communicative Skills
                </p>
                <div className="space-y-4">
                  {[
                    { label: "Content", val: analysis.content, max: 6, desc: "Replacement of words from the passage" },
                    { label: "Oral Fluency", val: analysis.fluency, max: 5, desc: "Smooth, effortless and natural-paced speech" },
                    { label: "Pronunciation", val: analysis.pronunciation, max: 5, desc: "Production of speech sounds, stress and intonation" },
                  ].map(({ label, val, max, desc }) => (
                    <div key={label} className="flex items-center gap-4">
                      <div className="w-32 md:w-40 flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-700">{label}</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{desc}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div className={`h-2.5 rounded-full ${
                              (val/max) >= 0.7 ? "bg-emerald-500" :
                              (val/max) >= 0.45 ? "bg-amber-500" : "bg-red-500"
                            }`} style={{ width: `${(val/max)*100}%` }} />
                          </div>
                          <span className={`text-lg font-black ${
                            (val/max) >= 0.7 ? "text-emerald-600" :
                            (val/max) >= 0.45 ? "text-amber-600" : "text-red-600"
                          }`}>{val}<span className="text-xs text-gray-400 font-normal">/{max}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-[#003057] uppercase tracking-wider mb-2">
                  Examiner Feedback
                </p>
                <p className="text-gray-700 text-sm leading-[1.8]">{analysis.feedback}</p>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <p className="text-[9px] text-gray-400">
                Evee PTE Classes · Overseas Admissions Hub
              </p>
              <p className="text-[9px] text-gray-400">
                AI-Powered Analysis · eveeoverseas.in
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}