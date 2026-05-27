"use client";

import { useState } from "react";

export default function UploadPage() {

  const [pdf, setPdf] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
  UPLOAD PDF
  */

  const uploadPDF = async () => {

    if (!pdf) {

      alert("Please select PDF");

      return;

    }

    try {

      setLoading(true);

      const formData =
        new FormData();

      formData.append("pdf", pdf);

      const response =
        await fetch(

          "http://localhost:5000/upload-pdf",

          {

            method: "POST",

            body: formData

          }

        );

      const data =
        await response.json();

      console.log(data);

      if (data.success) {

        setMessage(

          `PDF Uploaded Successfully 🚀 Total Saved: ${data.totalSaved}`

        );

      } else {

        setMessage(

          "Upload Failed ❌"

        );

      }

      setLoading(false);

    } catch (error) {

      console.log(error);

      setMessage(

        "Server Error ❌"

      );

      setLoading(false);

    }

  };

  return (

    <div style={{ padding: "40px" }}>

      <h1>

        Upload PTE PDF 🚀

      </h1>

      <input

        type="file"

        accept=".pdf"

        onChange={(e) =>

          setPdf(
            e.target.files[0]
          )

        }

      />

      <br /><br />

      <button
        onClick={uploadPDF}
      >

        {

          loading

            ? "Uploading..."

            : "Upload PDF"

        }

      </button>

      <br /><br />

      <h3>

        {message}

      </h3>

    </div>

  );

}