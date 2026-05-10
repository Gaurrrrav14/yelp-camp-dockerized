const mongoose = require('mongoose');
const Campground = require ('../models/campground');
const cities = require('./cities');
const {places,descriptors} = require('./seedHelpers');
require('dotenv').config();

mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp-maptiler');

const db=mongoose.connection;
db.on("error", console.error.bind(console,"connection error:"));
db.once("open", ()=>{
    console.log("Database Connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async() => {
    await Campground.deleteMany({});
    for ( let i =0; i < 50; i++)
    {
        const random1000 = Math.floor(Math.random() * 1000);
        const price= Math.floor(Math.random() * 20) +10;
        const camp = new Campground({
            // author : '69cbc11e97ee3400c9554c18',
            author: '69ff706e4ab1d121b86bc6ca',
            location : `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Fugit aliquid odit reprehenderit! Mollitia, accusamus facere provident quia possimus aliquam enim sequi ad, quae exercitationem ratione repellendus delectus quod assumenda suscipit?',
            price: price,
            images: [
                {
                    url: 'https://res.cloudinary.com/dttfv0d6d/image/upload/v1778319120/YelpCamp/acgzh7kpgu7cp3qeit8o.jpg',
                    filename: 'YelpCamp/acgzh7kpgu7cp3qeit8o',
                },
                {
                    url: 'https://res.cloudinary.com/dttfv0d6d/image/upload/v1778319124/YelpCamp/ukaf5jcqantmmyw327ty.jpg',
                    filename: 'YelpCamp/ukaf5jcqantmmyw327ty',
                }
            ]
        })
        await camp.save();
    }
}

seedDB().then(()=>{
    mongoose.connection.close();
})