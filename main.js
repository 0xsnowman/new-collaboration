const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./utils/db");
const categoryRoutes = require("./routes/categoryRoutes");
const quizRoutes = require("./routes/quizRoutes");
const cors = require("cors");

/**********************************************/
console.log("seems like your invitation link has expired. i invited to a new repo");
/**********************************************/

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/categories", categoryRoutes);
app.use("/api/quiz", quizRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const Question = require("../models/Question");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Question.deleteMany();

  const res = await axios.get("https://opentdb.com/api.php?amount=50&type=multiple");
  const formatted = res.data.results.map(q => ({
    category: q.category,
    difficulty: q.difficulty,
    question: q.question,
    correct_answer: q.correct_answer,
    incorrect_answers: q.incorrect_answers,
  }));

  await Question.insertMany(formatted);
  console.log("Seeding complete");
  process.exit();
};

console.log("process.env.MONGODB_URI: " + process.env.MONGODB_URI);
seed();

const Question = require("../models/Question");

exports.getQuiz = async (req, res) => {
  const { category, difficulty, amount } = req.query;
  const filter = { category, difficulty };
  const questions = await Question.aggregate([
    { $match: filter },
    { $sample: { size: parseInt(amount) || 5 } },
  ]);

  const clean = questions.map(q => {
    const allAnswers = [...q.incorrect_answers, q.correct_answer];
    return {
      _id: q._id,
      question: q.question,
      options: allAnswers.sort(() => Math.random() - 0.5),
    };
  });

  res.json(clean);
};

exports.submitQuiz = async (req, res) => {
  const userAnswers = req.body.answers;
  let score = 0;
  const result = [];

  for (const { questionId, answer } of userAnswers) {
    const q = await Question.findById(questionId);
    const isCorrect = q.correct_answer === answer;
    if (isCorrect) score++;
    result.push({
      question: q.question,
      correct_answer: q.correct_answer,
      selected: answer,
      isCorrect,
    });
  }

  res.json({ score, result });
};
