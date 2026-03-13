const express = require("express");
const router = express.Router();

const Wishlist = require("../models/Wishlist");
const { protect } = require("../middleware/auth");

/* GET WISHLIST */

router.get("/", protect, async(req,res)=>{

const list = await Wishlist.find({buyer:req.user.id})
.populate("product");

res.json({
success:true,
data:list
});

});

/* ADD ITEM */

router.post("/", protect, async(req,res)=>{

const item = await Wishlist.create({
buyer:req.user.id,
product:req.body.productId
});

res.json({
success:true,
data:item
});

});

/* REMOVE */

router.delete("/:id", protect, async(req,res)=>{

await Wishlist.findByIdAndDelete(req.params.id);

res.json({
success:true
});

});

module.exports = router;