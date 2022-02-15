const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");
// const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51KTRERFT2kPusbx9BJhbptaaysaOknmFIWtb8cvWdaAl4gVADFp5Ja8eK5pb1ertEwHUFEVWHpTFAtYRzZhXVoFo00RunbYsdQ"
);

const app = express();
app.use(formidable());
// app.use(cors());

router.post("/payment", async (req, res) => {
  try {
    const response = await stripe.charges.create({
      source: req.fields.stripeToken,
      amount: req.fields.productPrice * 100, // en centimes
      currency: "eur",
      description: "La description du produit acheté...",
    });
    // console.log(response);
    if (response.status === "succeeded") {
      res.status(200).json({ message: "Paiement validé" });
    } else {
      res.status(400).json({ message: "An error occured" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
