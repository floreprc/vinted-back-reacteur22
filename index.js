// Importer les packages
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cors = require("cors");
require("dotenv").config();

// Créer le serveur & utiliser les packages
const app = express();
app.use(formidable());
app.use(cors());
mongoose.connect(process.env.MONGODB_URI);
// mongoose.connect("mongodb://localhost/vinted");

//Importation des routes
const usersRoutes = require("./routes/users");
app.use(usersRoutes);
const offersRoutes = require("./routes/offers");
app.use(offersRoutes);
// const offersRoutes = require("./routes/payment");
// app.use(offersRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur ma première API 😄" });
});

// Lancer le serveur
app.listen(process.env.PORT, () => {
  console.log("It works ! 🪐");
});
// app.listen(3002, () => {
//   console.log("It works ! 🪐");
// });
