// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
// const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const factory = require('./handlerFactory')

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));
// console.log(tours);


const multerStorage = multer.memoryStorage();//stores image in a buffer unlike diskStorage this biffer is available in req.file.buffer

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) { //checks if file is only image
        cb(null , true)
    } else {
        cb(new AppError('Not an image ! please upload only images.', 400) , false)
    }
}

//const upload = multer({dest: 'public/img/users'}) //dest stands for the destination where we want to save it or else it will save in memory and not saved anywhere in disk
const upload = multer({
    storage: multerStorage,
    fileFilter : multerFilter
})

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    {name: 'images' , maxCount: 3}
])

//for only a field having mutiple images like images in tour schema we could have used
//upload.array('images' , 5) //5 is max count (req.files)

//for only a field having single images like imagesCover in tour schema we could have used
//upload.single('imageCover') -(req.file)

exports.resizeTourImages =catchAsync(async (req, res, next) => {
    //console.log(req.files);//for multiple files instead of req.file
    
    if(!req.files.imageCover || !req.files.images) return next()

    //Cover image resize
    const imageCoverFileName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333) //(width ,height)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageCoverFileName}`)
    
    req.body.imageCover = imageCoverFileName; // to assign it to the variable of updateOne handler functions req.body query
    //images array resize

    req.body.images = [];

    await Promise.all(
        
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`
    
            await sharp(file.buffer)
                .resize(2000, 1333) //(width ,height)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`)
        
            req.body.images.push(filename)
        })
    );
    
    next();
})


//Alias feature
exports.aliasTopTour = (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = '-ratingsAverage, price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = factory.getAll(Tour)
// exports.getAllTours = catchAsync(async (req, res ,next) => {
//     //try {
        
//         //EXECUTE THE QUERY
//         const features = new APIFeatures(Tour.find(), req.query)
//             .filter()
//             .sort()
//             .limitFields()
//             .paginate();
//         const tours = await features.query;//waits for the return function of this.query from the APIfeatures class
        
//         res.status(200).json({
//             status: 'success',
//             results: tours.length, //to find the total no. of result not compulsory
//             data: {
//                 tours: tours //if key and value name is same we names. we can write x : tours also
//             }
//         });
//     // } catch (err) {
//     //     res.status(404).json({
//     //         status: "fail",
//     //         message: err
//     //     });
//     // }
// })

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// exports.getTour = catchAsync( async (req, res ,next) => { //make any parameter optional '/api/v1/tours/:id/:you?' put question mark to it.
//     //console.log(req.params);
//     //try {
//     const tour = await Tour.findById(req.params.id).populate('reviews');
//     //.populate({ this commented line is done in the middleware to prevent it from repetition when required
//     //     path: 'guides',//provided the data to polupate in the schema and fetch it from reference(ref:'User)
//     //     select:'-__v -passwordChangedAt'//to remove this fields from result
//     // });
//         //same as Tour.findOne({_id : req.params.id})
        
//     if (!tour) {
//         return next(new AppError('No tour tour with the ID', 404));
//         }
    
//         res.status(200).json({
//             status: 'success',
//             data: {
//             tour //if key and value name is same we names. we can write tour : tour also
//         }
//      })

//     // } catch (err) {
//     //     res.status(404).json({
//     //         status: "fail",
//     //         message: err
//     //     });
//     // }
   
// })


exports.createTour = factory.createOne(Tour)
// exports.createTour = catchAsync(async (req, res, next) => {
    
//     //  console.log(req.body);
//     // const newTour = new Tour({ })
//     // newTour.save() //working same as below 
//     const newTour = await Tour.create(req.body)

//         res.status(201).json({
//             status: 'success',
//             data: {
//                 tour: newTour
//             }
//        });  

//     // try {
//         //here was the above code.
//     // } catch(err) {
//     //     res.status(400).json({
//     //         status: "fail",
//     //         message: err.message
//     //     })
//     // }
// });

exports.updateTour = factory.updateOne(Tour)
// exports.updateTour = catchAsync(async (req, res ,next) => {
//     //try {

//         const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//             new: true,//returns the new updated doc to the client
//             runValidators : true //keeps the default validators by running again
//         })

//         if (!tour) {
//         return next(new AppError('No tour tour with the ID', 404));
//         }    
    
//         res.status(200).json({
//         status: "success",
//         data: {
//             tour  // same as tour : tour
//         }
//     })
//     // } catch (err) {
//     //    res.status(404).json({
//     //         status: "fail",
//     //         message: err
//     //     }); 
//     // }

    
// })

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res ,next) => {

//     //try {
        
//         const tour = await Tour.findByIdAndDelete(req.params.id)
        
//         if (! tour) {
//         return next(new AppError('No tour tour with the ID', 404));
//         }

//         res.status(204).json({
//             status: "success",
//             data: null
//         })
//     // } catch (err) {
//     //     res.status(404).json({
//     //         status: "fail",
//     //         message: err
//     //     })
//     // }
   
    
// });

exports.getTourStats = catchAsync(async (req, res ,next) => {

   // try {
        const stats = await Tour.aggregate([ //await is must
            {
                $match: { ratingsAverage: { $gte: 4.5 } }//syntax of aggregration $ sign has to be in the front of the field name 
                //above query is to select the operation on which it will be performed
            },
            {
                $group: {
                    _id: '$difficulty', // also can write ...
                    //_id: { $toUpper: '$difficulty' },//for getting upper case
                    // _id: '$ratingAverage', // and etc
                    //for any other field we specify the field name eg. _id: '$difficulty'
                    //_id: null,//to find all the documents and not any specific we write null.
                    numTours: { $sum: 1 },//adds 1 on finding each document
                    numRatings: { $sum: '$ratingsQuantity' }, // adds up the rating quantity
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort : { avgPrice : 1} // for assending 1 and -1 for decending
            },
            // {
            //     //can repeat stages
            //     $match: { _id: { $ne: 'EASY' } }
            // }
        ]);
        res.status(200).json({
            status: "success",
            data: {
                stats  // same as stats : stats
            }
        });

    // } catch(err) {
    //     res.status(404).json({
    //         status: "fail",
    //         message: err
    //     })
    // }
})

exports.getMonthlyPlan = catchAsync(async (req, res ,next) => {
   // try {
        //calculating no. of tours in a month of a given year 
        //real bussiness problem
        const year = req.params.year * 1;

        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates' //seperates each specified array element into a different result.
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`),//all the tours between 2021
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$startDates' },//this field is compulsory and it give results based on this only.
                    numTourStarts: { $sum: 1 },//sums the number of results
                    tours: {$push : '$name'},//push creates an array of the required document results
                }
            },
            {
                $addFields : { month: '$_id'}
            },
            {
                $project: {
                    _id : 0 //here we give an input of 0 and 1 (0 for not showing the field and 1 for showing)
                            //used mainly to hide/show a unnecessary field.
                }
            },
            {
                $sort: {
                    numTourStarts: -1
                }
            },
            {
                $limit: 12 // limits the no. of results to be displayed
            }
        ]);

         res.status(200).json({
            status: "success",
            data: {
                plan  // same as stats : stats
            }
        });
        
    // } catch (err) {
    //    res.status(404).json({
    //         status: "fail",
    //         message: err
    //     }) 
    // }
})

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1 ;

    if (!lat || !lng) {
        next(new AppError('Please provide latitute and longitute in the format lat,lng.', 400))
    }

    //console.log(distance, lat, lng, unit);
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng , lat] , radius] } }
    });

    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            data : tours
        }
    });

});

exports.getDistances = catchAsync(async (req, res, next) => {
    
    const {latlng, unit } = req.params;
    
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(new AppError('Please provide latitute and longitute in the format lat,lng.', 400))
    }

    //console.log(distance, lat, lng, unit);
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng *1 ,lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            },
        },
        {
                $project: {
                    distance: 1,
                    name: 1
                }
            }
 ]);

    res.status(200).json({
        status: "success",
        data: {
            data : distances
        }
    });


})

// const newId = tours[tours.length - 1].id + 1;
//     const newTour = Object.assign({ id: newId }, req.body); // takes object values from one and merges it with the target or other one
  
//     tours.push(newTour);

//     fs.writeFile(
//         `${__dirname}/dev-data/data/tours-simple.json`,
//         JSON.stringify(tours),
//         err => {
//             res.status(201).json({
//                 status: 'success',
//                 data: {
//                     tour: newTour
//                 }
//             });
    
//         }
//     );


//Middle ware used in intitial stages of the code to check

// check id when implemented with fs 

// exports.checkID = (req, res, next, val) => {//param middleware it is used to get the id if used in the parameter
//     // value of id is stored in the val variable
//     console.log(`Tour id is ${val}`);
//     if (req.params.id * 1 > tours.length) { //id passed from the middleware in tourRoutes
//         return res.status(404).json({
//             status: 'fail',
//             message: "invalid ID"
//         });
//     }
//     next();
// };

// check Body when used with fs
// exports.checkBody = (req, res, next) => {
//     if (!req.body.name || !req.body.price) { 
//         return res.status(400).json({
//             status: 'fail',
//             message: "name and price are required"
//         })
//     }
//     next();
// }