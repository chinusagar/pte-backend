require("dotenv").config();

require("../db");

const Question =
  require("../models/Question");

const questions = [

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Technology has changed the way students learn in classrooms. Online education platforms now provide access to quality learning materials from anywhere in the world. Students can attend lectures, complete assignments, and communicate with teachers through digital tools. This advancement has improved flexibility and educational opportunities for millions of learners globally."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Climate change is one of the greatest challenges facing humanity today. Rising temperatures, melting glaciers, and extreme weather events are affecting countries around the world. Governments and organizations are working together to reduce carbon emissions and promote renewable energy sources for a cleaner and healthier environment."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Reading books regularly improves vocabulary, concentration, and communication skills. Many successful individuals develop the habit of reading because it increases knowledge and creativity. Libraries and digital reading platforms allow people to access thousands of educational resources and improve their understanding of different subjects and cultures."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Exercise plays an important role in maintaining physical and mental health. Regular physical activity strengthens muscles, improves heart function, and reduces stress levels. Doctors recommend at least thirty minutes of exercise each day to maintain a healthy lifestyle and prevent long term medical problems."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Many universities encourage students to participate in research activities during their studies. Research projects help students develop analytical thinking, problem solving abilities, and teamwork skills. These experiences also prepare graduates for professional careers and future academic opportunities in various industries."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Tourism contributes significantly to the economy of many countries. It creates employment opportunities in transportation, hospitality, and entertainment industries. However, governments must also focus on sustainable tourism practices to protect natural resources and preserve cultural heritage for future generations."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Healthy eating habits are essential for maintaining energy and overall wellbeing. Nutrition experts advise people to consume fresh fruits, vegetables, whole grains, and sufficient water daily. Avoiding excessive sugar and processed foods can reduce the risk of obesity, diabetes, and heart disease."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Artificial intelligence is transforming industries such as healthcare, finance, and education. Advanced computer systems can analyze large amounts of data quickly and accurately. Although artificial intelligence offers many benefits, experts also discuss the importance of ethical guidelines and responsible technology development."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Public transportation systems help reduce traffic congestion and environmental pollution in large cities. Buses, trains, and metro services provide affordable travel options for millions of commuters every day. Governments continue investing in modern transportation infrastructure to improve urban mobility and economic growth."
  },

  {
    module: "Speaking",
    type: "Read Aloud",
    question:
      "Teamwork is considered an important skill in both academic and professional environments. Working in teams allows individuals to share ideas, solve problems efficiently, and complete projects successfully. Employers often value candidates who demonstrate leadership, communication, and collaboration abilities in workplace situations."
  }

];

/*
AUTO GENERATE 100 QUESTIONS
*/

const finalQuestions = [];

for (let i = 0; i < 10; i++) {

  questions.forEach((q, index) => {

    finalQuestions.push({

      module: q.module,

      type: q.type,

      question:
        q.question +
        ` Question Set ${i + 1}-${index + 1}`

    });

  });

}

/*
SAVE TO DATABASE
*/

async function saveQuestions() {

  try {

    await Question.insertMany(
      finalQuestions
    );

    console.log(
      "100 Read Aloud Questions Added Successfully 🚀"
    );

    process.exit();

  } catch (error) {

    console.log(error);

    process.exit();

  }

}

saveQuestions();