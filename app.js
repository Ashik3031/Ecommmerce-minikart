const express = require('express')
const session = require('express-session')
const path = require('path')
const nocache = require('nocache')
const bodyParser = require('body-parser');
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
const profileRouter = require('./routes/profileRouter')
const paymentRouter = require('./routes/paymentRouter')
const cartRouter = require('./routes/cartRouter')
const coupenRouter = require('./routes/coupenRouter')
const offerRouter = require('./routes/offerRouter')
const bannerRouter = require('./routes/bannerRouter')
const mongoose = require('mongoose')
require("dotenv").config();
const app = express()

const mongostr = process.env.MONGO


mongoose.connect(mongostr, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("mongo connected");
    }).catch((error) => {
        console.log(error);
    })
 
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
//app.set("views", ["./views/user", "./views/admin"]);
app.use(express.urlencoded({ extended: true })); // Use this middleware to parse form data
app.use(nocache())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')

app.use(session({
    secret: 'secret key',
    resave: false,
    saveUninitialized: true
  }))



const port = process.env.PORT||3000

app.use('/',userRouter)
app.use('/',profileRouter)
app.use('/',paymentRouter)
app.use('/',cartRouter)
app.use('/',coupenRouter)
app.use('/',offerRouter)
app.use('/admin',adminRouter)
app.use('/admin',bannerRouter)

// app.use((req, res, next) => {
//     const error = new Error('Not Found');
//     error.status = 404;
//     next(error);
// });

// app.use((err, req, res, next) => {
//     if (err.status === 404) {
//         res.status(404).render('error404'); // Assuming you have an error404.ejs file in your 'views' folder
//     } else {
//         console.error(err.stack);
//         res.status(500).render('error500'); // Assuming you have an error500.ejs file in your 'views' folder
//     }
// });

app.listen(port,()=>{
    console.log('http://localhost:3000')
})