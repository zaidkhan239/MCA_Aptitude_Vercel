import React, { useEffect, useState, useMemo } from "react";

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quiz state
  const [quizLength, setQuizLength] = useState(30);
  const [mixCode, setMixCode] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [picked, setPicked] = useState({});
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showExplain, setShowExplain] = useState(false);

  // Load questions.json from public
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/questions.json");
        if (!res.ok) throw new Error("Failed to fetch questions.json — place the file into /public");
        const data = await res.json();
        // data expected: { questions: [...] } or [ ... ]
        const raw = data.questions || data;
        setQuestions(raw);
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    }
    load();
  }, []);

  // Prepare pool of questions for quiz
  const pool = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const filtered = questions.filter((q) => {
      return q.type === "aptitude" || (mixCode && q.type === "code");
    });
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return filtered.slice(0, Math.min(quizLength, filtered.length));
  }, [questions, quizLength, mixCode]);

  // Timer
  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft === null) setTimeLeft(timeLimitMinutes * 60);
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(t);
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, finished, timeLeft, timeLimitMinutes]);

  function formatTime(sec) {
    if (sec === null) return "--:--";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")}`;
  }

  function startQuiz() {
    setPicked({});
    setCurrentIndex(0);
    setFinished(false);
    setShowExplain(false);
    setStarted(true);
    setTimeLeft(timeLimitMinutes * 60);
  }

  function selectAnswer(qid, value) {
    setPicked((p) => ({ ...p, [qid]: value }));
  }

  function submitQuiz() {
    setFinished(true);
    setShowExplain(true);
  }

  function scoreResult() {
    const out = { total: 0, correct: 0, wrong: 0, skipped: 0 };
    pool.forEach((q) => {
      out.total += 1;
      const ans = picked[q.id];
      const correct = (q.answer || q.expected_output) !== undefined ? String(q.answer || q.expected_output).trim() : null;
      if (!ans) out.skipped += 1;
      else if (String(ans).trim() === String(correct).trim()) out.correct += 1;
      else out.wrong += 1;
    });
    return out;
  }

  // simple UI helpers
  if (loading) return <div className="p-6">Loading questions...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-2">MCA Aptitude & Code-Output Practice</h1>
          <p className="text-sm text-slate-600 mb-4">Ready-to-host React app for Vercel. Uses <code>/questions.json</code> in public folder.</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm">Number of questions</label>
              <input type="number" value={quizLength} min={5} max={200} onChange={(e) => setQuizLength(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
            </div>
            <div>
              <label className="block text-sm">Time limit (minutes)</label>
              <input type="number" value={timeLimitMinutes} min={5} max={240} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={mixCode} onChange={(e) => setMixCode(e.target.checked)} /> Include code-output questions</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={true} readOnly /> MCA-focused question bank</label>
          </div>

          <div className="flex gap-3">
            <button onClick={startQuiz} className="px-4 py-2 bg-blue-600 text-white rounded">Start Quiz</button>
            <a href="#howto" className="px-4 py-2 border rounded">How to host on Vercel</a>
          </div>

          <hr className="my-4" />

          <div>
            <h2 className="font-medium">Preview statistics</h2>
            <p className="text-sm text-slate-600">Total questions in bank: <strong>{questions.length}</strong></p>
            <p className="text-sm text-slate-600">Selected pool size for quiz: <strong>{pool.length}</strong></p>
          </div>

          <div id="howto" className="mt-6 text-sm text-slate-700">
            <h3 className="font-semibold">Deploy to Vercel (summary)</h3>
            <ol className="list-decimal ml-6 mt-2">
              <li>Initialize a React app (Vite or CRA) and add this component as <code>src/App.jsx</code>.</li>
              <li>Place your generated <code>questions.json</code> into the <code>public/</code> directory.</li>
              <li>Ensure Tailwind is configured (optional). If not, the app still works with basic layout.</li>
              <li>Push to GitHub and import the repo into Vercel. Vercel will detect & deploy automatically.</li>
            </ol>
            <p className="mt-2">If you want, I can generate a full GitHub-ready repo (with package.json, Vite config, Tailwind, and questions.json included) so you can deploy in one click.</p>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const res = scoreResult();
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Quiz Result</h2>
          <p>Total: {res.total} &nbsp; Correct: {res.correct} &nbsp; Wrong: {res.wrong} &nbsp; Skipped: {res.skipped}</p>
          <div className="mt-4">
            <button onClick={() => { setStarted(false); setFinished(false); }} className="px-3 py-2 border rounded">Back</button>
            <button onClick={() => { setPicked({}); setFinished(false); setStarted(true); setTimeLeft(timeLimitMinutes*60); }} className="ml-2 px-3 py-2 bg-green-600 text-white rounded">Retake</button>
            <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(JSON.stringify({score:res, answers: picked},null,2)); }} className="ml-2 px-3 py-2 border rounded">Copy Report</button>
          </div>

          <hr className="my-4" />

          <h3 className="font-semibold mb-2">Review</h3>
          <div>
            {pool.map((q, idx) => {
              const ans = picked[q.id];
              const correct = q.answer || q.expected_output || "";
              const isCorrect = ans && String(ans).trim() === String(correct).trim();
              return (
                <div key={q.id} className="p-3 border rounded mb-2">
                  <div className="text-sm text-slate-600">{idx+1}. {q.topic} — <strong>{q.id}</strong></div>
                  {q.type === "code" ? (
                    <pre className="bg-slate-100 p-3 rounded overflow-x-auto mt-2 text-sm"><code>{q.code}</code></pre>
                  ) : (
                    <div className="mt-2">{q.question}</div>
                  )}
                  <div className="mt-2">Your answer: <strong>{ans ?? "-"}</strong> — Correct: <strong>{String(correct)}</strong> — <span className={isCorrect?"text-green-600":"text-red-600"}>{isCorrect?"Correct":"Wrong"}</span></div>
                  <div className="mt-2 text-sm text-slate-700">Explanation: {q.explanation || "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Quiz playing UI
  const q = pool[currentIndex];
  const userAns = picked[q.id] || "";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">MCA Aptitude Quiz</h2>
            <div className="text-sm text-slate-600">Question {currentIndex+1} of {pool.length} — Topic: {q.topic}</div>
          </div>
          <div className="text-sm">
            Time left: <strong>{formatTime(timeLeft)}</strong>
          </div>
        </div>

        <div className="border rounded p-4 bg-slate-50">
          {q.type === "code" ? (
            <>
              <div className="text-sm mb-2 font-medium">Code (predict output)</div>
              <pre className="bg-black text-white p-3 rounded overflow-x-auto"><code>{q.code}</code></pre>
            </>
          ) : (
            <div className="text-md">{q.question}</div>
          )}

          {q.options && q.options.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => selectAnswer(q.id, String(opt))} className={`p-2 border rounded text-left ${userAns===String(opt)?'bg-blue-600 text-white':'bg-white'}`}>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <input placeholder="Type your answer here" value={userAns} onChange={(e)=>selectAnswer(q.id,e.target.value)} className="w-full p-2 border rounded" />
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => { if (currentIndex>0) setCurrentIndex(currentIndex-1); }} className="px-3 py-2 border rounded">Prev</button>
            {currentIndex+1 < pool.length ? (
              <button onClick={() => { setCurrentIndex(currentIndex+1); }} className="px-3 py-2 bg-blue-600 text-white rounded">Next</button>
            ) : (
              <button onClick={submitQuiz} className="px-3 py-2 bg-green-600 text-white rounded">Submit Quiz</button>
            )}
            <button onClick={() => { setShowExplain(s=>!s); }} className="px-3 py-2 border rounded">Toggle Explanation</button>

            <div className="ml-auto text-sm">Answered: {Object.keys(picked).length}</div>
          </div>

          {showExplain && (
            <div className="mt-4 bg-white p-3 border rounded text-sm">
              <strong>Explanation:</strong>
              <div className="mt-2">{q.explanation || '—'}</div>
              {q.type === 'code' && q.expected_output && (
                <div className="mt-2"><strong>Expected Output:</strong>
                  <pre className="bg-slate-100 p-2 rounded mt-1"><code>{q.expected_output}</code></pre>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">Tip: For code-output questions, think through variable scopes, mutability, and common gotchas.</div>
          <div className="flex gap-2">
            <button onClick={() => { setStarted(false); setPicked({}); setCurrentIndex(0); }} className="px-3 py-2 border rounded">Exit</button>
            <button onClick={() => { setPicked({}); setCurrentIndex(0); }} className="px-3 py-2 border rounded">Clear Answers</button>
          </div>
        </div>
      </div>
    </div>
  );
}
