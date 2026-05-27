"use client";

import useAuth from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function AnalyticsPage() {

  // 🔐 PROTECT PAGE
  useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
  FETCH RESULTS
  */

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) return;

    fetch("http://localhost:5000/results", {

      headers: {
        Authorization: token
      }

    })
      .then((res) => res.json())
      .then((data) => {

        setResults(data || []);
        setLoading(false);

      })
      .catch((err) => {

        console.log(err);
        setLoading(false);

      });

  }, []);

  /*
  LOADING STATE
  */

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Loading analytics... ⏳</h2>
      </div>
    );
  }

  /*
  CALCULATIONS
  */

  const totalTests = results.length;

  const averageScore =
    totalTests > 0
      ? Math.floor(
          results.reduce(
            (sum, r) => sum + r.score,
            0
          ) / totalTests
        )
      : 0;

  const highestScore =
    totalTests > 0
      ? Math.max(...results.map((r) => r.score))
      : 0;

  const lowestScore =
    totalTests > 0
      ? Math.min(...results.map((r) => r.score))
      : 0;

  /*
  CHART DATA
  */

  const chartData = results.map((r, index) => ({
    attempt: index + 1,
    score: r.score
  }));

  return (
    <div style={{ padding: "40px" }}>

      <h1>Performance Analytics 📊</h1>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          marginTop: "30px"
        }}
      >

        <StatBox title="Total Tests" value={totalTests} />
        <StatBox title="Average Score" value={averageScore} />
        <StatBox title="Highest Score" value={highestScore} />
        <StatBox title="Lowest Score" value={lowestScore} />

      </div>

      {/* CHART */}
      <div style={{ width: "100%", height: 400, marginTop: "40px" }}>

        <h2>Score Progress 📈</h2>

        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="attempt" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="score" />
          </LineChart>
        </ResponsiveContainer>

      </div>

      {/* RECENT ATTEMPTS */}
      <h2 style={{ marginTop: "40px" }}>
        Recent Attempts 🚀
      </h2>

      {results.map((r) => (
        <div
          key={r._id}
          style={{
            border: "1px solid gray",
            padding: "20px",
            marginBottom: "20px"
          }}
        >
          <p>Module: {r.module}</p>
          <p>Score: {r.score}</p>
          <p>
            Date:{" "}
            {new Date(r.createdAt).toLocaleString()}
          </p>
        </div>
      ))}

    </div>
  );
}

/*
REUSABLE COMPONENT
*/

function StatBox({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid gray",
        padding: "20px"
      }}
    >
      <h2>{title}</h2>
      <p>{value}</p>
    </div>
  );
}