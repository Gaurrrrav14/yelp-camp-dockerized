if (process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const express= require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError')
const flash = require('connect-flash');

const session = require('express-session');
const passport = require('passport'); 
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const userRoutes = require('./routes/users.js');
const campgroundRoutes = require('./routes/campgrounds.js');
const reviewRoutes = require('./routes/reviews.js');

const { MongoStore } = require('connect-mongo');

const sanitizeV5 = require('./utils/mongoSanitizeV5.js');
const dbUrl = process.env.DB_URL;
const sessionSecret = process.env.SESSION_SECRET;
//'mongodb://localhost:27017/yelp-camp-maptiler'

mongoose.connect(dbUrl);
const db=mongoose.connection;
db.on("error", console.error.bind(console,"connection error:"));
db.once("open", ()=>{
    console.log("Database Connected");
});


const app = express();

app.set('query parser', 'extended');

app.set('views engine', 'ejs');
app.set('views', path.join(__dirname,'views'))

app.engine('ejs', ejsMate)
//without this middleware it wont parse the req.body
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))

app.use(sanitizeV5({ replaceWith: '_' }));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: sessionSecret
    }
});

const sessionConfig ={
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());

//session is used before passport.session() and passport.initialize()

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.currentUser = req.user;
    res.locals.success= req.flash('success');
    res.locals.error = req.flash('error');
    next()
})


app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)

app.get('/', (req,res)=>{
    res.render('home.ejs')
})

app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError('Page Not Found' , 404))
})

app.use((err,req,res,next) =>{
    const {statusCode = 500 } = err;
    if(!err.message) err.message = 'Oo ee aa i ooo e ii aa i'
    res.status(statusCode).render('error.ejs' , {err})
})

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});

// Prevent multiple shutdown calls
let isShuttingDown = false;

const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received — shutting down gracefully`);

    server.close(() => {
        console.log('HTTP server closed');

        mongoose.connection.close(false).then(() => {
            console.log('MongoDB connection closed');
            process.exit(0);
        }).catch(err => {
            console.error('Error closing MongoDB:', err);
            process.exit(1);
        });
    });

    // Force exit if something hangs (safety net)
    setTimeout(() => {
        console.error('Forcefully shutting down');
        process.exit(1);
    }, 10000); // 10 seconds
};

// Handle both signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);