const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require("../../models/tourModel");
const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");


dotenv.config({ path: './config.env' }); //once read here can be accessed anywhere as the variables are stored in the process.env

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, {
   useNewUrlParser: true,
   useCreateIndex: true,
    useFindAndModify: false,
    
}).then(con => console.log('DB connection Successful'));

//READ JSON FIle
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

//import data to database
const importData = async () => {
    try {
        await Tour.create(tours , { validateBeforeSave : false});
        await User.create(users , { validateBeforeSave : false});
        await Review.create(reviews);
        console.log('Data imported to DB');
        process.exit();//closes the running script
    } catch (err) {
        console.log(err);
    }
}

//delete all data from db
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data deleted from DB');
        process.exit();//closes the running script
    } catch (err) {
        console.log(err);
    }
}

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

console.log(process.argv);//can call a function based on the argument in the command line
//eg node dev-data/data/import-dev-data.js --import / --delete
// [
//   'C:\\Program Files\\nodejs\\node.exe',
//   'C:\\Users\\ARITRAJIT DAS\\Desktop\\starter\\dev-data\\data\\import-dev-data.js',
//   '--import/--delete'
// ]
//based on the above array we can enter or delete data in dastabase
