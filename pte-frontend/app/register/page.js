"use client";

import { useState } from "react";

export default function RegisterPage() {

  const [formData, setFormData] = useState({

    name: "",
    email: "",
    password: ""

  });

  const handleChange = (e) => {

    setFormData({

      ...formData,
      [e.target.name]: e.target.value

    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    const response = await fetch(

      "http://localhost:5000/auth/register",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"

        },

        body: JSON.stringify(formData)

      }

    );

    const data = await response.json();

    alert(data.message || "Registered");

  };

  return (

    <div style={{

      padding: "40px"

    }}>

      <h1>Student Register</h1>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <br /><br />

        <button type="submit">

          Register

        </button>

      </form>

    </div>

  );

}