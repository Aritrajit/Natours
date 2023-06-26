//const fs = require('fs');
const path = require('path');
const express = require('express');
// const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean'); 
const hpp = require('hpp');//http parameter protection
const cookieParser = require('cookie-parser');//parsers all the cookie from the browser like body-parser


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes')
const viewRouter = require('./routes/viewRoutes');

//for setting express
const app = express();

app.set('view engine', 'pug');//setting up pug for express
app.set('views', path.join(__dirname, 'views'));//giving the location of view folder to express

//GLOBAL MIDDLEWARES
//serving static files middle ware 
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));


//Set security HTTP headers


app.use( helmet() );
// Define your CSP directive
const cspDirective = "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js https://api.mapbox.com https://js.stripe.com; worker-src 'self' blob:";
;
//https://js.stripe.com
//https://js.stripe.com

// Middleware to set CSP header
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', cspDirective);
  next();
});

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       // Add 'https://js.stripe.com' to the script-src directive
//       'script-src': ["'self'", 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js', 'https://api.mapbox.com', 'https://js.stripe.com'],
//     },
//   })
// );

//Developement logging
if (process.env.NODE_ENV === 'developement') {
    app.use(morgan('dev'));// returns the request status (GET /api/v1/tours 200 382.091 ms - 10022)
};

//Rate limiting the request in API
const limiter = rateLimit({
    max: 200,//maximun requests
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many request from  IP, please try again later after a hour! '
});

app.use('/api', limiter);//limits the routes starting with /api/.. to limit field options passed

//Body Parser,reading data from body by req.body
app.use(express.json({ limit: '10kb' }));//limit the size of each data
app.use(express.urlencoded({extended : true , limit : '10kb'}))
app.use(cookieParser())//this parses the cookie from browser

//Data Sanitanization/cleaning against NoSqL query injection
app.use(mongoSanitize());

//Data sanitization against XSS(Cross site scripting protection)
app.use(xss());

//Prevent parameter pollution (does clear the query string)
app.use(hpp({
    whitelist: [
        'duration',
        'ratingQuantity',
        'ratingAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

//Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    //console.log(req.headers);
    //console.log(req.requestTime);
    //console.log(req.cookies);
    next();
})

//ROUTES
//For PUG
app.use('/', viewRouter)
//for API
app.use('/api/v1/tours', tourRouter);//called mounting the router
app.use('/api/v1/users', userRouter);//called mounting the router
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//ROUTE HANDLER(wrong URLs)
//all stands for all the methos (get,post,put,patch,delete etc)
//* stands for all the urls
//this should be written here because here if the route does'nt match the above lines it will come to this line as executed line by line and give error to any route
app.all('*', (req, res, next) => {
    // const err = new Error(`Can't find ${req.originalUrl} on this server`);
    // err.status = 'fail';
    // err.statusCode = 404;
    //next(err);//whenever we pass a parameter in next it assumes it as a error

    next(new AppError(`Cant find ${req.originalUrl} on this server` , 404));
})

//ERROR HANDLER TO ALL 
app.use(globalErrorHandler);

//Server START

module.exports = app;

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id',getTour);
// app.post('/api/v1/tours', createTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);


//HANDLING UNWANTED ROUTES IN A DIFFERENT MANNER
// app.all('*', (req, res, next) => {
//     // res.status(404).json({
//     //     status: 'fail',
//     //     message: `Cannot find ${req.originalUrl} on this server!`
//     // });

//     // const err = new Error(`Can't find ${req.originalUrl} on this server`);
//     // err.status = 'fail';
//     // err.statusCode = 404;

//     // next(err);//whenever we pass a parameter in next it assumes it as a error
// })


//HTTP HEADER URL CALLING ERROR SOLUTION CODE
// const scriptSrcUrls = [
//   'https://api.tiles.mapbox.com/',
//   'https://api.mapbox.com/',
// ];
// const styleSrcUrls = [
//   'https://api.mapbox.com/',
//   'https://api.tiles.mapbox.com/',
//   'https://fonts.googleapis.com/',
// ];
// const connectSrcUrls = [
//   'https://api.mapbox.com/',
//   'https://a.tiles.mapbox.com/',
//   'https://b.tiles.mapbox.com/',
//   'https://events.mapbox.com/',
// ];
// const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [],
//       connectSrc: ["'self'", ...connectSrcUrls],
//       scriptSrc: ["'self'", ...scriptSrcUrls],
//       styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//       workerSrc: ["'self'", 'blob:'],
//       objectSrc: [],
//       imgSrc: ["'self'", 'blob:', 'data:'],
//       fontSrc: ["'self'", ...fontSrcUrls],
//     },
//   })
// );

