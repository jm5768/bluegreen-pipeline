const express = require("express");
const app = express();
const port = 3000;
const color = process.env.COLOR || "unknown";

app.get("/", (req, res) => {
  res.send(`<h1>Hello from ${color} environment!</h1>`);
});

app.listen(port, () => {
  console.log(`App running on ${port}, color=${color}`);
});
