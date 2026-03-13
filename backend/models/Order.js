const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

buyer:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

items:[
{
product:{
type:mongoose.Schema.Types.ObjectId,
ref:"Product"
},

quantity:Number,

price:Number

}
],

total:{
type:Number,
default:0
},

status:{
type:String,
enum:["pending","processing","shipped","completed","cancelled"],
default:"pending"
}

},{
timestamps:true
});

module.exports = mongoose.model("Order",orderSchema);