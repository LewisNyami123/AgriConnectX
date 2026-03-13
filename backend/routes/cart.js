const express = require("express");
const router = express.Router();

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

/* GET USER CART */
router.get("/", protect, async (req, res) => {

const cart = await Cart.find({ buyer: req.user.id })
.populate("product");

res.json({
success: true,
data: cart
});

});

/* ADD TO CART */
router.post("/", protect, async (req, res) => {

const { productId, quantity } = req.body;

const product = await Product.findById(productId);

if (!product)
return res.status(404).json({ success:false,message:"Product not found" });

const item = await Cart.create({
buyer: req.user.id,
product: productId,
quantity: quantity || 1
});

res.json({
success:true,
data:item
});

});

/* REMOVE ITEM */

router.delete("/:id", protect, async (req,res)=>{

await Cart.findByIdAndDelete(req.params.id);

res.json({
success:true
});

});

module.exports = router;