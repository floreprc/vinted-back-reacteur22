const express = require("express");
const router = express.Router();
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
const isAuthentificated = require("../middlewares/isAuthentificated");

// Publier une annonce
router.post("/offer/publish", isAuthentificated, async (req, res) => {
  try {
    if (
      req.fields.title &&
      req.fields.price &&
      req.fields.condition &&
      req.fields.brand &&
      req.fields.size
    ) {
      if (req.fields.description.length > 500) {
        res.status(400).json({
          message: "Please, write a shorter description (max: 500 characters)",
        });
      } else if (req.fields.title.length > 50) {
        res.status(400).json({
          message: "Please, write a shorter title (max : 50 characters)",
        });
      } else if (req.fields.price > 100000) {
        res
          .status(400)
          .json({ message: "The price must be lower than 100 000" });
      } else {
        const pictureToUpload = req.files.picture.path;
        const UploadedPicture = await cloudinary.uploader.upload(
          pictureToUpload,
          {
            folder: "vinted/offers",
          }
        );
        const newOffer = new Offer({
          product_name: req.fields.title,
          product_description: req.fields.description,
          product_price: req.fields.price,
          product_details: [
            { MARQUE: req.fields.brand },
            { TAILLE: req.fields.size },
            { ETAT: req.fields.condition },
            { COULEUR: req.fields.color },
            { EMPLACEMENT: req.fields.city },
          ],
          product_image: UploadedPicture,
          owner: req.user,
        });
        await newOffer.save();
        res.json({
          _id: newOffer._id,
          product_name: newOffer.product_name,
          product_description: newOffer.product_description,
          product_price: newOffer.product_price,
          product_details: newOffer.product_details,
          owner: {
            account: newOffer.owner.account,
            _id: newOffer.owner._id,
          },
          product_image: newOffer.product_image,
        });
      }
    } else {
      res
        .status(400)
        .json({ message: "At least one mandatory element is missing" });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// Modifier une annonce
router.put("/offer/update", isAuthentificated, async (req, res) => {
  try {
    // Soutien : une première grande condition pour avoir au moins un champ à modifier+ rechercher une seule fois le user à modifier & check si cet user existe + pour chaque champ, pousser la nouvelle valeur (si ce champ est présent) + sauvegarder

    const updatedOffer = await Offer.findById(req.fields._id);

    // Modification du titre
    if (req.fields.title) {
      updatedOffer.product_name = req.fields.title;
    }
    // Modification de la description
    if (req.fields.description) {
      updatedOffer.product_description = req.fields.description;
    }
    // Modification de prix
    if (req.fields.price) {
      updatedOffer.product_price = req.fields.price;
    }
    // Modification de l'état
    if (req.fields.condition) {
      updatedOffer.product_details[2].ETAT = req.fields.condition;
    }
    // // Modification de la localisation
    if (req.fields.city) {
      updatedOffer.product_details[4].EMPLACEMENT = req.fields.city;
    }
    // // Modification de la marque
    if (req.fields.brand) {
      updatedOffer.product_details[0].MARQUE = req.fields.brand;
    }
    // // Modification de la taille
    if (req.fields.size) {
      updatedOffer.product_details[4].TAILLE = req.fields.size;
    }
    // // Modification de la couleur
    if (req.fields.color) {
      updatedOffer.product_details[4].EMPLACEMENT = req.fields.color;
    }
    // // Modification de prix
    if (req.fields.price) {
      updatedOffer.product_price = req.fields.price;
    }
    // Modifier une photo
    // if (req.files.picture) {
    //   const pictureToUpdate = req.files.picture.path;
    //   const UpdatedPicture = await cloudinary.uploader.upload(pictureToUpdate, {
    //     folder: "vinted/offers",
    //   });
    //   updatedOffer = await Offer.findByIdAndUpdate(
    //     req.fields._id,
    //     {
    //       product_image: UpdatedPicture,
    //     },
    //     { new: true }
    //   );
    // }
    await updatedOffer.save();
    res.json({
      _id: updatedOffer._id,
      product_name: updatedOffer.product_name,
      product_description: updatedOffer.product_description,
      product_price: updatedOffer.product_price,
      product_details: updatedOffer.product_details,
      owner: {
        account: updatedOffer.owner.account,
        _id: updatedOffer.owner._id,
      },
      product_image: updatedOffer.product_image,
    });
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// Supprimer une annonce

//Afficher les offres
router.get("/offers", async (req, res) => {
  try {
    let resultsForEachPage = 2;
    if (req.query.resultsForEachPage) {
      resultsForEachPage = req.query.resultsForEachPage;
    }
    if (req.query.page > 1) {
      const toSkip = (req.query.page - 1) * resultsForEachPage;
    } else {
      const toSkip = 0;
    }
    let filters = {};
    // Recherche dans le titre
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    // Recherche par prix min et/ou prix max
    if (req.query.priceMin && req.query.priceMax) {
      filters.product_price = {
        $gte: req.query.priceMin,
        $lte: req.query.priceMax,
      };
    } else {
      if (req.query.priceMin) {
        filters.product_price = { $gte: req.query.priceMin };
      } else if (req.query.priceMax) {
        filters.product_price = { $lte: req.query.priceMax };
      }
    }
    // Préparation au filtre par ordre croissant/décroissant
    let sortChoice = undefined;
    if (req.query.sort) {
      sortChoice = req.query.sort.replace("price-", "");
    }
    const searchedOffers = await Offer.find(filters)
      //   // Trier par ordre croissant ou décroissant >> ne fonctionne pas si pas de valeur
      .sort({ product_price: sortChoice })
      //   // Afficher seulement certaines infos
      .select("_id product_name  product_price")
      //   // afficher 2 résultats par page
      .limit(resultsForEachPage)
      //   // Enlever les résultats des pages précédentes >> fonctionne si pas de valeur
      .skip(toSkip);

    //Affichage du résultat
    const count = await Offer.countDocuments(filters);
    res.json({ count: count, offers: searchedOffers });
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const searchedOffer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account.username account.phone",
    });
    res.json(searchedOffer);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
