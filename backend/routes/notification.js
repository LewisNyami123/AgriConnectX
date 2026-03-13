const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

/* GET USER NOTIFICATIONS */

router.get("/", protect, async(req,res)=>{

const notes = await Notification.find({
user:req.user.id
}).sort({createdAt:-1});

res.json({
success:true,
data:notes
});

});

/* CREATE */

router.post("/", async(req,res)=>{

const note = await Notification.create({
user:req.body.userId,
message:req.body.message
});

res.json({
success:true,
data:note
});

});

/* MARK READ */

router.put("/:id", protect, async(req,res)=>{

await Notification.findByIdAndUpdate(req.params.id,{
read:true
});

res.json({success:true});

});

module.exports = router;