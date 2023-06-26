const mongoose = require('mongoose');
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        require: [true, 'Review can not be empty!']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true,'Review must belong to a tour.']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required:[true,'Review must belong to a user']
    }, 
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true}
});

reviewSchema.index({tour : 1 , user : 1} , { unique : true})

reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select : 'name photo'
    // })

    this.populate({
        path: 'user',
        select: 'name photo'
    })

    next();
})

reviewSchema.statics.calcAverageRatings =async function (tourId) { //Static method is used when we do operation in the Model directly which is different Instance method which is used in the documents
    //this points to the model as it is a static method 
    const stats = await this.aggregate([ //This here points to the current Model as we call aggregate always on model
        {
            $match:{tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 }, //returns total no. of reviews
                avgRating: {$avg : '$rating' } //returns average of the total revies
            }
        }
       ])
    //console.log(stats);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating, //returns a array of a object where we access in stats which we can fetch and update
        ratingsAverage: stats[0].avgRating //returns a array of a object where we access in stats which we can fetch and update
      });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0, 
        ratingsAverage: 4.5 
      });
    }
    
}

reviewSchema.post('save', function () { //in post middleware we dont have access to only next instead it has (doc , next)
    //this points tocurrent review
    this.constructor.calcAverageRatings(this.tour); //this.constructor is the Review model this line is same as Review.calcAverageRatings(this.tour) but the review model is still not reacted
    
})

//for changing the ratingsAverage and ratingsQuantity on update or delete review
//findByIdAndUpdate (operation name to perform on)
//findByIdAndDelete (operation name to perform on)
reviewSchema.pre(/^findOneAnd/, async function (next) {
    //this.r = await this.find();//we need findOne here as query middleware only has access to the query and not the document which is saved in a field (on the query object) called this.r (or r)
    this.r = await this.findOne();//above one returns a array of object and below one returns only a single object
    console.log(this.r);
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    // this.r = await this.findOne() : does NOT work here because query at this point is already executed
    await this.r.constructor.calcAverageRatings(this.r.tour)//passed from the pre query middleware to post query middleware as executed one after the other in sequence so this.r field created in the object has access to the document
    //this.r is the current document and .constructer acts as a model as calcAverageRatings is a static method and can only be called by a model
});

const Review = mongoose.model('Review', reviewSchema);//cant declare the review.post after this line then the static method will not be accesable 

module.exports = Review;

//IMPORTANT
// schema.pre('save', function(next) {
//   const err = new Error('something went wrong');
//   // If you call `next()` with an argument, that argument is assumed to be
//   // an error.
//   next(err);
// });