/* eslint-disable no-unused-expressions */
const crypto = require('crypto')
const { promisify } = require('util');
const jwt = require('jsonwebtoken')
const User = require("../models/userModel");
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");
const Email = require("../utils/email");
const { url } = require('inspector');

const signToken = id => jwt.sign({ id: id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN })  
    
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ), //converting time into milli seconds
        //secure: true, //will only be send in a encrypted secure connection like https
        httpOnly:true // prevents acess or modified of cookie in any way in the browser
    
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    //cookie creation
    res.cookie('jwt', token, cookieOptions);//name of cookie is jwt which overides if created again as it cant have same name

    //hide password from response object
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user //user: user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    //const newUser = await User.create(req.body);//User.save is same
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
        // role:req.body.role,
        // passwordChangedAt : req.body.passwordChangedAt
    });
    // eslint-disable-next-line no-shadow
    const url = `${req.protocol}://${req.get('host')}/me`;

    await new Email(newUser, url).sendWelcome();


    //const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN})
    //const token = signToken(newUser._id)

    createSendToken(newUser, 201, res)

    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // });
});

exports.login = catchAsync( async (req, res, next) => {
    const {email , password}  = req.body;//same as req.body.email , req.body.password
    
    //1)check if email and password exists
    if (!email || !password) {
       return next(new AppError('please provide email and password', 400));
    }

    //2)Check if user exists and password is correct
    const user =await User.findOne({ email: email }).select('+password');//to select the password particularly because its select property is set to false in DB
    //console.log(user);
    //const correct = 
    
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password' , 401))
    }

    //3) if everything is okay send the token back to the client
    createSendToken(user, 200, res)
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token:token
    // })
})

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly:true
    })
        res.status(200).json({status:'success'})    
}

exports.protect = catchAsync(async (req, res, next) => {
    //1)Getting the token and check if it exist
   
    let token;
    // didnt define it inside if block beacuse og es6 scope of token inside if will not be accesable outside the if block
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    //console.log(token);

    if (!token) {
        return next(new AppError("you are not logged in ! please log in to get access", 401));
    }
    

    //2)validate the token(verification) 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);//obtains the data(has all the payload or data) from the token and match it with token.
    //Returns the payload decoded if the signature is valid and optional expiration, audience, or issuer are valid. If not, it will throw the error.
    console.log(decoded);//decoded contains the payload including id,iat,exp in this case

    //3)check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to the token does no longer exist', 401))
    }
    
    //4)Check if user changed password after jwt was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password!,plz login again', 401))
    }

    //after checking all this ifok GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;//this can be passed to the restrictTo as it is within same middleware in delete tour
    res.locals.user = currentUser;//ths will have access in teh pug template known as res.locals.<variable_name>(this case user)
    next();
});

//onlt for rendered pages,no errors!
exports.isLoggedIn = async (req, res, next) => { //didnt use catchasync because while logging out it will find invalid token and give error to the global handling middleware so we used try catch if no user then just return next()
    
    // didnt define it inside if block beacuse of es6 scope of token inside if will not be accesable outside the if block
    if (req.cookies.jwt) {

        try {
          //1)validate the token(verification) 
        const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET); //obtains the data(has all the payload or data) from the token and match it with token.
            //Returns the payload decoded if the signature is valid and optional expiration, audience, or issuer are valid. If not, it will throw the error.
            //console.log(decoded);//decoded contains the payload including id,iat,exp in this case

        //2)check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next()
        }
    
        //4)Check if user changed password after jwt was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next()
        }

        //There is a Logged in User
        res.locals.user = currentUser;//ths will have access in teh pug template known as res.locals.<variable_name>(this case user)
        return next();  
        } catch (err) {
           return next() 
        }
        
    }  
    next();
};


exports.restrictTo = (...roles) => { //...roles is an rest operater
    return (req, res, next) => {
        // roles is an array ['admin' , 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have access to perform this action', 403));
        }

        next();
    }
};

exports.forgotPassword = catchAsync(async(req, res, next) => {
    //1)Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with this email address', 404));
    }

    //2)Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave : false});//saves the database password reset token method in the database.As not saved earlier and not giving validation for stop showing error
      
    // const message = `Forgot your password? Submit a PATCH request with your new password 
    // and passwordConfirm to: ${resetURL}.\n If didnt forget your password, please ignore this email!`;

    try {

        //3)send it to users's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;//url for email reset
        
        await new Email(user, resetURL).sendPasswordReset();


        res.status(200).json({
            status: 'success',
            message:"Token send to email!"
        })
    } catch (err) {
        user.createPasswordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        
        return next(new AppError('There was an Error sending the email . try again later'),500)
    }
    
})

exports.resetPassword =catchAsync( async (req, res, next) => {
    //steps to do this fuctionality
    //1)Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token) // got from the params/url the token(not the encrypted one present in the DB) or recentToken
        .digest('hex');
 
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }//converts date.now() in required format
    });//checks if user is there and also the token valid or expired at the same time

    //console.log(user);
    
    //2)If token has not expired,and there is user , set the new password
    if (!user) { 
        return next(new AppError('Token is invalid or has expired'  , 400))
    }

    //if user present
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();//we dont want to of the validatand or because we want it to validate the password and confirm password.
    //and also the middleware function and encryption.

    //3)Update changedPasswordAt property for the user
            //done in the userModel as a middleware as pre method on save 

    //4)Log the user in ,send JWT
    
    createSendToken(user, 200, res)
    // const token = signToken(user._id)


    // res.status(200).json({
    //     status: 'success',
    //     token
    //    });

})

exports.updatePassword =catchAsync( async(req, res, next) => {
    //1)Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    //2)Check if posted current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401))
    }

    //3)If password corect update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //we did'nt do User.findByIdAndUpdate as it will not work as intended in the model as well as the pre save middleware.

    //4) Log user in,send JWT
    createSendToken(user, 200, res)
})
