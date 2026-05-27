"use client";

import Link from "next/link";

export default function Sidebar() {

  return (

    <div style={{

      width: "250px",

      height: "100vh",

      borderRight: "1px solid #ccc",

      padding: "20px",

      position: "fixed",

      left: 0,

      top: 0,

      background: "#f9f9f9"

    }}>

      <h2>

        AI PTE 🚀

      </h2>

      <div style={{

        display: "flex",

        flexDirection: "column",

        gap: "15px",

        marginTop: "30px"

      }}>

        <Link href="/">

          Dashboard

        </Link>

        <Link href="/mock-test">

          Mock Test

        </Link>

        <Link href="/essay-checker">

          Essay Checker

        </Link>

        <Link href="/speaking-test">

          Speaking Test

        </Link>

        <Link href="/analytics">

          Analytics

        </Link>

        <Link href="/leaderboard">

          Leaderboard

        </Link>

        <Link href="/profile">

          Profile

        </Link>

        <Link href="/admin">

          Admin Panel

        </Link>

      </div>

    </div>

  );

}