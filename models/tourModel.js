const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
//const User = require('./userModel')

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A Tour must have a name"],
    unique: true,
    trim: true,
    maxlength: [40, "A tour name must have less or equal 40 characters"],
    minlength: [10, "A tour name must have more or equal 10 characters"]
    //validate: [validator.isAlpha , 'String should only contain Alphabets']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, "A Tour must have a duration"]
    }, 
    maxGroupSize: {
      type: Number,
      required: [true, "A Tour must have a max group size"]
    },
    difficulty: {
        type: String,
        required: [true, "A Tour must have a difficulty"],
        enum: {
            //enum can only be used for strings
            values :['easy', 'medium', 'difficult'],
            message : "Difficulty must be one of the following: easy, medium, difficult"
        }
    },
    ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: (val) => Math.round(val * 10) / 10 //set is used when ever there is a change in the value in the field
    //It accepts a call back where val has access to the value of field and then we round it up //4.66666,46.66666 , 47 , 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true , "A Tour must have a price"]
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                //in validator this only points to current document on NEW document creation and not update
                return val < this.price;//this is used because we r comparing it with other fields
            },
            message:'Discount must ({VALUE}) be less than price' // value has access to the val variable 
        } 
    },
    summary: {
        type: String,
        trim:true, //remove all white spaces in the beggining and end
        required:[true,"Tour must have a description"]
    },
    description: {
        type: String,
        trim:true
    },
    imageCover: {
        type: String,
        required:[true,"A tour must have an image"]
    },
    images: [String], //stores a array of strings
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false //hides this field from user while api fetching
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default:false
    },
    startLocation: {
      //GeoJSON data format for geospatial data  
        type: {
            type: String,
            default: 'Point', //one of the type of geostapitial type others are line and polygon
            enum: ['Point']
        },
        coordinates: [Number], //means this accept an array of numbers
        address: String,
        description:String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum:['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day:Number

        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref:'User'
        }
    ] //guides:Array for embedding and implemented one is for reference which is the best approch
    }, {
    toJSON: { virtuals: true }, //this to fields are specified so that the datamodel shows a field which..(next line continuation)
    toObject: { virtuals: true} //is not present in the data model but is needed such as durationWeeks which calculate the no. of week from the duration field
    }
);

//INDEXING
//single field indexing used to query for a single field.
// tourSchema.index({price : 1}) //1 for asecding order and -1 is for decending order
//compund field indexing used to query for a multiple field
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation : '2dsphere'})

//VIRTUAL PIPELINE
tourSchema.virtual('durationWeeks').get(function () {
    //virtual calculates and gives a data from in a new field(not present in Schema) after doing required calculations
    return this.duration / 7; 
    //this can't be used in the query or any other thing to fecth as it does'nt ..
    //exist in real data
});

//Virtual Populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField : '_id'
})

//DOCUMENT MIDDLEWARE
//documet middleware runs before the .save() and .create() command //but not on any other command like insert,find,update
tourSchema.pre('save', function(next) { //pre is used for to run before and event
   // console.log(this); //this has the access or stores the entire object(currently processed document)
    this.slug = slugify(this.name, { lower: true });
    next();
})

//EMBEDDING PART OF GUIDES
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));//this async function as we await for finding the users returns a array of promises and hence it has to be handled in next line
//    // console.log(guidesPromises);
//     this.guides = await Promise.all(guidesPromises);//reassign all the user data toh the guides after finding it

//     next()
// })

// //'save is called hook/middleware ' => We can have multiple middle ware for the same hook (pre or post any)
// tourSchema.post('save', (doc, next) => { //doc has access to the document just saved in the database
//     //post is executed after pre middleware functions are completed
//     console.log(doc);//this is not required as doc has access to document.
//     next();
// })


//QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function(next) { //regular expression for to apply to every query starting with find e.g(find,findOne,findMany etc)
    //runs before(pre)/after(post) any query is executed
    //console.log(this);
    this.find({ secretTour: { $ne: true } });///excluding/not finding secret Tour from data base
    this.start = Date.now();//creating a new start variable
    next();
})

tourSchema.pre(/^find/, function (next) {

    this.populate({//populate only show the ref result in query and not in database
        path: 'guides',//provided the data to polupate in the schema and fetch it from reference(ref:'User) as a result it internally generates a new query which somewhat affect the database
        select:'-__v -passwordChangedAt'//to remove this fields from result
    });

    next()
    
})

tourSchema.post(/^find/, function (doc, next) { //doc has access to query already executed
    console.log(`Query took ${Date.now() - this.start} milliseconds`);
    //console.log(doc);
    next();
})

// tourSchema.pre('findOne', function(next) { //for a single tour as it is performing ffindOne not find
//     //runs before(pre)/after(post) any query is executed
//     this.find({ secretTour: { $ne: true } });///excluding/not finding secret Tour from data base
//     next();
// })

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });//unshift is a method to add a element in front of an array 
//     //and shift for joining at the last of an array we use it as pipeline is an array of object called stages
//     //console.log(this.pipeline());
//     next();
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;