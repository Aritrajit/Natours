const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // gets access to the param from different route example tourId in tourRoutes.js
//POST /tour/234fad4/reviews
//GET /tour/234fad4/reviews
//POST  /reviews

router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.protect,
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview)

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('user' , 'admin'),
        reviewController.updateReview)
    .delete(
        authController.restrictTo('user' , 'admin'),
        reviewController.deleteReview)

module.exports = router;