require('dotenv').config();
const express=require('express'),mongoose=require('mongoose'),cors=require('cors'),bcrypt=require('bcryptjs');
const app=express();app.use(cors());app.use(express.json());
mongoose.connect(process.env.MONGO_URI||'mongodb://127.0.0.1:27017/restaurant_management').then(()=>console.log('MongoDB connected')).catch(console.error);
const model=(name,fields)=>mongoose.model(name,new mongoose.Schema(fields,{timestamps:true}));
const User=model('User',{name:String,email:{type:String,unique:true},password:String});
const Menu=model('Menu',{name:{type:String,required:true},category:String,price:Number,description:String,image:String,available:{type:Boolean,default:true}});
const Customer=model('Customer',{name:String,email:String,phone:String});
const Order=model('Order',{customer:String,items:[{name:String,quantity:Number,price:Number}],total:Number,status:{type:String,default:'Pending'},type:{type:String,default:'Dine-in'}});
const Reservation=model('Reservation',{name:String,phone:String,date:String,time:String,guests:Number,tableNumber:Number,status:{type:String,default:'Booked'}});
const Inventory=model('Inventory',{name:String,quantity:Number,unit:String,threshold:Number});
const Staff=model('Staff',{name:String,role:String,phone:String,shift:String});
const Payment=model('Payment',{orderId:String,amount:Number,method:String,status:{type:String,default:'Paid'}});
app.post('/api/register',async(req,res)=>{try{const {name,email,password}=req.body;if(!name||!email||!password)return res.status(400).json({error:'All fields required'});const user=await User.create({name,email,password:await bcrypt.hash(password,10)});res.status(201).json({id:user.id,name:user.name,email:user.email});}catch(e){res.status(400).json({error:e.code===11000?'Email already registered':e.message})}});
app.post('/api/login',async(req,res)=>{const user=await User.findOne({email:req.body.email});if(!user||!await bcrypt.compare(req.body.password||'',user.password))return res.status(401).json({error:'Invalid credentials'});res.json({id:user.id,name:user.name,email:user.email})});
// Demo CRUD routes. No authorization: deploy only after adding authentication and access controls.
for(const [path,Model] of Object.entries({menu:Menu,customers:Customer,orders:Order,reservations:Reservation,inventory:Inventory,staff:Staff,payments:Payment})){
app.get('/api/'+path,async(req,res)=>{try{res.json(await Model.find().sort({createdAt:-1}))}catch(e){res.status(500).json({error:e.message})}});
app.post('/api/'+path,async(req,res)=>{try{
const body={...req.body};
if(path==='reservations'){
 const {date,time,tableNumber,guests}=body;
 if(!date||!time||!Number.isInteger(Number(tableNumber))||Number(tableNumber)<1||Number(guests)<1)return res.status(400).json({error:'Valid date, time, table and guest count required'});
 const existing=await Reservation.findOne({date,time,tableNumber:Number(tableNumber),status:{$ne:'Cancelled'}});
 if(existing)return res.status(409).json({error:'This table is already booked at that date and time'});
}
if(path==='orders'&&Array.isArray(body.items)&&body.items.length){
 let total=0;const items=[];
 for(const item of body.items){const menu=await Menu.findById(item.menuId);const quantity=Number(item.quantity);
 if(!menu||!menu.available||!Number.isInteger(quantity)||quantity<1)return res.status(400).json({error:'Invalid or unavailable menu item/quantity'});
 items.push({name:menu.name,price:menu.price,quantity});total+=menu.price*quantity;}
 body.items=items;body.total=total;
}
res.status(201).json(await Model.create(body))}catch(e){res.status(400).json({error:e.message})}});
app.put('/api/'+path+'/:id',async(req,res)=>{try{
if(path==='reservations'){
 const current=await Reservation.findById(req.params.id);if(!current)return res.status(404).json({error:'Not found'});
 const date=req.body.date??current.date,time=req.body.time??current.time,tableNumber=Number(req.body.tableNumber??current.tableNumber),status=req.body.status??current.status;
 if(status!=='Cancelled'&&await Reservation.exists({_id:{$ne:current._id},date,time,tableNumber,status:{$ne:'Cancelled'}}))return res.status(409).json({error:'This table is already booked at that date and time'});
}
if(path==='orders'&&req.body.items?.length)return res.status(400).json({error:'Edit order items through a dedicated checkout flow; totals must be recalculated'});
const doc=await Model.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!doc)return res.status(404).json({error:'Not found'});res.json(doc)}catch(e){res.status(400).json({error:e.message})}});
app.delete('/api/'+path+'/:id',async(req,res)=>{try{const doc=await Model.findByIdAndDelete(req.params.id);if(!doc)return res.status(404).json({error:'Not found'});res.json({success:true})}catch(e){res.status(400).json({error:e.message})}})
}
app.get('/api/dashboard',async(req,res)=>{try{const [orders,customers,reservations,menu]=await Promise.all([Order.find(),Customer.countDocuments(),Reservation.countDocuments(),Menu.countDocuments()]);res.json({orders:orders.length,customers,reservations,menu,revenue:orders.filter(o=>o.status!=='Cancelled').reduce((s,o)=>s+(o.total||0),0)})}catch(e){res.status(500).json({error:e.message})}});
app.listen(process.env.PORT||5000,()=>console.log('Server running on port '+(process.env.PORT||5000)));
