const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('Uncaught exception shutting down....')
  console.log(err.name, err.message);
  process.exit(1);
})
  
dotenv.config({ path: './config.env' }); //once read here can be accessed anywhere as the variables are stored in the process.env
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, {
   useNewUrlParser: true,
   useCreateIndex: true,
   useUnifiedTopology: true,
   useFindAndModify: false,
}).then(con => console.log('DB connection Successful'));
// console.log(process.env);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection shutting down....');
  server.close(() => {
    process.exit(1);
  });
  
});


  

