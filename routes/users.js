const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

// Configuration cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
// Importer les modèles
const User = require("../models/User");
const Offer = require("../models/Offer");

// Sign up
router.post("/user/signup", async (req, res) => {
  try {
    if (req.fields.username) {
      const checkEmail = await User.findOne({ email: req.fields.email });
      if (checkEmail) {
        res.status(400).json({ message: "This email already exists" });
      } else {
        // Sécurisation du mot de passe
        const userPassword = req.fields.password;
        const userSalt = uid2(16);
        const userHash = SHA256(userPassword + userSalt).toString(encBase64);
        const userToken = uid2(16);
        // Stockage de la photo
        // const avatarToUpload = req.files.avatar.path;
        // const UploadedAvatar = await cloudinary.uploader.upload(
        //   avatarToUpload,
        //   {
        //     folder: "vinted/users",
        //   }
        // );
        // Création en base de donnée
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
            // avatar: UploadedAvatar,
          },
          token: userToken,
          hash: userHash,
          salt: userSalt,
        });
        await newUser.save();
        res.json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        });
      }
    } else {
      res.status(400).json({ message: "Please, enter an username" });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// Log In
router.post("/user/login", async (req, res) => {
  try {
    if (req.fields.email && req.fields.password) {
      const submittedPassword = req.fields.password;
      const requestedUser = await User.findOne({ email: req.fields.email });
      const requestedSalt = requestedUser.salt;
      const requestedHash = requestedUser.hash;
      const submittedHash = await SHA256(
        submittedPassword + requestedSalt
      ).toString(encBase64);
      if (requestedHash === submittedHash) {
        res.json({
          _id: requestedUser._id,
          token: requestedUser.token,
          account: requestedUser.account,
        });
      } else {
        res.status(401).json({ message: "Unauthorized ! 2" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized ! 1" });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
