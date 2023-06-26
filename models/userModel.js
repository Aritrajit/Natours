const crypto = require('crypto');//build in node module
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plz tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Plz tell us your email!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Plz enter a valid email!']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default:'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select : false //will not show the password in db
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //This only works only on CREATE or SAVE!!!
            validator: function (el) {
                return el === this.password;
            },
            message:'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type: Boolean,
        default: true,
        select: false
    }
});

//ENCRYPTION
userSchema.pre('save', async function (next) {
    //only run if password was modified
    if (!this.isModified('password')) return next();

    //hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);//hash is a async function by default

    //delete passwordConfirm field
    this.passwordConfirm = undefined;//only needed for validation thn deleted
    next();
})

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; //because some times a small delay occurs in saving to the DB and the passwordChangedAt can become greater than JWTtimedstamp/iat ..
    //which can give a error so we reduce the current time stamp by 1 sec 
    next();
})

userSchema.pre(/^find/, function (next) {
    //this points only to the current query
    this.find({ active: {$ne: false} });//same as ({ active: true })
    next();
})

userSchema.methods.correctPassword = async function (candidatePasssword, userPassword) { // here we cannot use this keyword here which has acceess to the object as the select property of password is selected to false
    //hence we use a async method of bcrypt called compare (userentered password , database password)
    return await bcrypt.compare(candidatePasssword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);//changing it to required format the time stamp to match with JWTTimestamp
        return changedTimestamp > JWTTimestamp;//returns true or false
        //console.log( changedTimestamp, JWTTimestamp);
    }
    
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({resetToken}, this.passwordResetToken);
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;//convert in required format

    return resetToken;

} 

const User = mongoose.model('User', userSchema);

module.exports = User;