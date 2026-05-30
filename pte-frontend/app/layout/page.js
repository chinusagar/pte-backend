"use client";

import "../globals.css";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
  useEffect,
  useState
} from "react";

export default function RootLayout({ children }) {

  const [darkMode, setDarkMode] =
    useState(false);

  /*
  LOAD THEME
  */

  useEffect(() => {

    const savedTheme =
      localStorage.getItem("theme");

    if (savedTheme === "dark") {

      setDarkMode(true);

    }

  }, []);

  /*
  APPLY THEME
  */

  useEffect(() => {

    if (darkMode) {

      document.body.style.background =
        "#111";

      document.body.style.color =
        "white";

      localStorage.setItem(
        "theme",
        "dark"
      );

    } else {

      document.body.style.background =
        "white";

      document.body.style.color =
        "black";

      localStorage.setItem(
        "theme",
        "light"
      );

    }

  }, [darkMode]);

  return (

    <html lang="en">

      <body>

        {/* TOP BAR */}

        <div style={{

          padding: "20px",

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center"

        }}>

          {/* DARK MODE BUTTON */}

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >

            {

              darkMode

                ? "☀️ Light Mode"

                : "🌙 Dark Mode"

            }

          </button>

        </div>

        {/* MAIN LAYOUT */}

        <div style={{

          display: "flex"

        }}>

          {/* SIDEBAR */}

          <Sidebar />

          {/* PAGE CONTENT */}

          <div style={{

            marginLeft: "260px",

            width: "100%",

            padding: "20px"

          }}>

            {/* NAVBAR (optional inside content) */}

            <Navbar />

            {children}

          </div>

        </div>

      </body>

    </html>

  );

}