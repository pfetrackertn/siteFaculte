require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const connectToMongo = require("./Database/db");
const express = require("express");
const app = express();
const path = require("path");
connectToMongo();
const port = process.env.PORT || 4000;
const cors = require("cors");

app.use(
  cors({
    origin: process.env.FRONTEND_API_LINK || "http://localhost:3000",
  })
);

app.use(express.json()); //to convert request data to json
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello 👋 I am Working Fine 🚀");
});

app.use("/media", express.static(path.join(__dirname, "media")));

app.use("/api/admin", require("./routes/details/admin-details.route"));
app.use("/api/faculty", require("./routes/details/faculty-details.route"));
app.use("/api/student", require("./routes/details/student-details.route"));

app.use("/api/branch", require("./routes/branch.route"));
app.use("/api/class", require("./routes/class.route"));
app.use("/api/department", require("./routes/department.route"));
app.use("/api/academic-year", require("./routes/academic-year.route"));
app.use("/api/promotion", require("./routes/promotion.route"));
app.use("/api/academic-fee", require("./routes/academic-fee.route"));
app.use("/api/library", require("./routes/library.route"));
app.use("/api/archive", require("./routes/archive.route"));
app.use("/api/subject", require("./routes/subject.route"));
app.use("/api/notice", require("./routes/notice.route"));
app.use("/api/timetable", require("./routes/timetable.route"));
app.use("/api/material", require("./routes/material.route"));
app.use("/api/exam", require("./routes/exam.route"));
app.use("/api/marks", require("./routes/marks.route"));

app.listen(port, () => {
  console.log(`Server Listening On http://localhost:${port}`);
});
