const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync')


exports.getOverview =catchAsync( async (req, res , next) => {
    //1) Get tour data form our collections
    const tours = await Tour.find();

    //2)Build template 
    
    //3)Render the template from step 1
    
    res.status(200).render('overview', {
        title: 'All Tours',
        tours :tours
    });
})

exports.getTour =catchAsync(async(req, res , next) => {
    //1)Het the data , for the requested tour including (reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    })

    //error page rendering
    if (!tour) {
        return next(new AppError('There is no tour with that name',404))
    }

    //2) Build template
    //3)Rander template using data from 1)
    res.status(200).render('tour', {
        title:`${tour.name} Tour` ,
        tour: tour
    });
})

exports.getLoginForm = (req, res, next) => {
    
    res.status(200).render('login', {
        title: 'Login into your account'
    });
};

exports.getSignupForm = (req, res, next) => {
    
    res.status(200).render('signup', {
        title: 'Create a new account'
    });
    
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
}

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

exports.updateUserData =catchAsync( async(req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    }, {
        new: true,
        runValidators:true
    })

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    });
})