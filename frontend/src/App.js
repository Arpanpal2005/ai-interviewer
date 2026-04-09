import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [results, setResults] = useState([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 Upload CV and prepare questions
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CV first!");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/upload-cv",
        formData
      );

      const q = res.data.questions;

      // ✅ SAFE PARSING
      const merged = [
        ...(q.easy || []),
        ...(q.medium || []),
        ...(q.hard || [])
      ].map((item) => {
        if (typeof item === "string") return item;
        if (item?.text) return item.text;
        if (item?.question) return item.question;
        return JSON.stringify(item);
      });

      console.log("Questions:", q);
      console.log("Merged:", merged);

      if (merged.length === 0) {
        alert("No questions generated. Check backend.");
        setLoading(false);
        return;
      }

      setAllQuestions(merged);
      setInterviewStarted(true);
      setCurrentIndex(0);
      setResults([]);
    } catch (err) {
      alert("Error uploading CV");
    }

    setLoading(false);
  };

  // 🔹 Submit answer and move next
  const handleNext = async () => {
    if (!currentAnswer.trim()) {
      alert("Please enter an answer!");
      return;
    }

    setLoading(true);

    const question = allQuestions[currentIndex];

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/evaluate",
        {
          question,
          answer: currentAnswer
        }
      );

      const evalData = res.data;

      // ✅ SAFE EVALUATION CLEANING
      const cleanEval = {
        score: evalData.score ?? 0,
        strengths:
          evalData.strengths && evalData.strengths.length > 0
            ? evalData.strengths
            : ["No strengths detected"],
        weaknesses:
          evalData.weaknesses && evalData.weaknesses.length > 0
            ? evalData.weaknesses
            : ["No weaknesses detected"]
      };

      setResults((prev) => [
        ...prev,
        {
          question,
          answer: currentAnswer,
          evaluation: cleanEval
        }
      ]);

      setCurrentAnswer("");
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      alert("Evaluation failed");
    }

    setLoading(false);
  };

  // 🔹 Final Report
  const renderReport = () => {
    let total = 0;
    let validCount = 0;

    results.forEach((r) => {
      if (r.evaluation.score !== undefined) {
        total += r.evaluation.score;
        validCount++;
      }
    });

    const avg = validCount ? (total / validCount).toFixed(2) : 0;

    return (
      <div>
        <h2 className="center">📊 Final Report</h2>
        <h3 className="center">Average Score: {avg}</h3>

        {results.map((r, i) => (
          <div key={i} className="report-card">
            <p><b>Q:</b> {r.question}</p>
            <p><b>Your Answer:</b> {r.answer}</p>

            <p className="score">
              Score: {r.evaluation.score}
            </p>

            <p>
              <b>Strengths:</b>{" "}
              {r.evaluation.strengths.join(", ")}
            </p>

            <p>
              <b>Weaknesses:</b>{" "}
              {r.evaluation.weaknesses.join(", ")}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container">
      <h1 className="title">🤖 AI Interviewer</h1>

      {/* Upload Screen */}
      {!interviewStarted && (
        <div className="card center">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <br />

          <button className="button" onClick={handleUpload}>
            {loading ? "Uploading..." : "Start Interview"}
          </button>
        </div>
      )}

      {/* Interview Screen */}
      {interviewStarted &&
        allQuestions.length > 0 &&
        currentIndex < allQuestions.length && (
          <div className="card">
            <h3>
              Question {currentIndex + 1} / {allQuestions.length}
            </h3>

            <p className="question">
              {allQuestions[currentIndex]}
            </p>

            <input
              className="input"
              type="text"
              placeholder="Type your answer..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
            />

            <button className="button" onClick={handleNext}>
              {loading ? "Evaluating..." : "Submit & Next →"}
            </button>
          </div>
        )}

      {/* Report Screen */}
      {interviewStarted &&
        allQuestions.length > 0 &&
        currentIndex >= allQuestions.length &&
        renderReport()}
    </div>
  );
}

export default App;