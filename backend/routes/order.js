const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const { protect } = require("../middleware/auth");

/* GET ORDERS */

router.get("/", protect, async (req,res)=>{

const orders = await Order.find({buyer:req.user.id})
.populate("items.product");

res.json({
success:true,
data:orders
});

});

/* CREATE ORDER FROM CART */

router.post("/", protect, async (req,res)=>{

const cartItems = await Cart.find({buyer:req.user.id})
.populate("product");

if(!cartItems.length)
return res.json({success:false,message:"Cart empty"});

let total=0;

const items=[];

for(const item of cartItems){

const product = await Product.reserveStock(
item.product._id,
item.quantity
);

if(!product)
return res.status(400).json({
success:false,
message:"Not enough stock"
});

total += item.product.price * item.quantity;

items.push({
product:item.product._id,
quantity:item.quantity,
price:item.product.price
});

}

const order = await Order.create({
buyer:req.user.id,
items,
total
});

await Cart.deleteMany({buyer:req.user.id});

res.json({
success:true,
data:order
});

});

module.exports = router;