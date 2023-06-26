const express = require('express')
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
//const reviewController = require('../controllers/reviewController');
const reviewRouter = require("./reviewRoutes")

const router = express.Router();

//NESTED ROUTES
//POST /tour/234fad4/reviews
//GET  /tour/234fad4/reviews
//GET  /tour/234fad4/reviews/234hua5

// router
//     .route('/:tourId/reviews')
//     .post(authController.protect,
//           authController.restrictTo('user'),
//           reviewController.createReview)

router.use('/:tourId/reviews', reviewRouter);//NESTED ONE


//router.param('id', tourController.checkID )

//ALIAS FEATURE MIDDLEWARE
router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTour, tourController.getAllTours)

router
    .route('/tour-stats')
    .get(tourController.getTourStats);

router
    .route('/monthly-plan/:year')
    .get(authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan);
    
// /tours-within/233/center/-40,45/unit/mi
//another way /tours-distance?distance=233&center=-40,45&unit=mi        
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);    

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protect , authController.restrictTo('admin' , 'lead-guide') ,tourController.createTour);//chaining middleware and checking the body validation if it contains name and price of tour
   

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),        
        tourController.deleteTour)

       

module.exports = router; 