"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const loginUser = async () => {

    const res = await fetch(
      "http://localhost:5000/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await res.json();

    if (data.success) {

      localStorage.setItem(
        "token",
        data.token
      );

      alert("Login Successful 🚀");

      router.push("/");
    } else {

      alert(data.message);
    }
  };

  return (

    <div style={{ padding: "40px" }}>

      <h1>Login Page 🔐</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />

      <br /><br />

      <button onClick={loginUser}>
        Login
      </button>

    </div>

  );
}