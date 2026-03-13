const express = require("express");
const router = express.Router();

const Review = require("../models/Review");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

/* GET PRODUCT REVIEWS */

router.get("/:productId", async(req,res)=>{

const reviews = await Review.find({
product:req.params.productId
}).populate("buyer","name");

res.json({
success:true,
data:reviews
});

});

/* CREATE REVIEW */

router.post("/", protect, async(req,res)=>{

const {productId,rating,comment} = req.body;

const review = await Review.create({
product:productId,
buyer:req.user.id,
rating,
comment
});

/* UPDATE PRODUCT RATING */

const stats = await Review.aggregate([
{$match:{product:review.product}},
{
$group:{
_id:"$product",
avg:{$avg:"$rating"},
count:{$sum:1}
}
}
]);

await Product.findByIdAndUpdate(productId,{
rating:{
average:stats[0].avg,
count:stats[0].count
}
});

res.json({
success:true,
data:review
});

});

module.exports = router;