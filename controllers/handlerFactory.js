const { Model } = require("mongoose");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = Model => catchAsync(async (req, res, next) => {

        
    const doc = await Model.findByIdAndDelete(req.params.id)
        
    if (!doc) {
        return next(new AppError('No document found with the ID', 404));
    }
    res.status(204).json({
        status: "success",
        data: null
    })
   
})

exports.updateOne = Model => catchAsync(async (req, res ,next) => {
    //try {

        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,//returns the new updated doc to the client
            runValidators : true //keeps the default validators by running again
        })

        if (!doc) {
        return next(new AppError('No Document with the ID', 404));
        }    
    
        res.status(200).json({
        status: "success",
        data: {
           data: doc  
        }
    })
    // } catch (err) {
    //    res.status(404).json({
    //         status: "fail",
    //         message: err
    //     }); 
    // }

    
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
    
    //  console.log(req.body);
    // const newTour = new Tour({ })
    // newTour.save() //working same as below 
    const doc = await Model.create(req.body)

        res.status(201).json({
            status: 'success',
            data: {
                data: doc
            }
       });  

});


exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => { //make any parameter optional '/api/v1/tours/:id/:you?' put question mark to it.
    let query = Model.findById(req.params.id);
    if(popOptions) query = query.populate(popOptions)
    const doc = await query;//This handler is different from others as because it has a populate method here

            
    if (!doc) {
        return next(new AppError('No Document with the ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    })

})

exports.getAll = Model => catchAsync(async (req, res ,next) => {
        //To allow for nested GET reviews on tour(hack remember)
         let filter = {}
         if (req.params.tourId) filter = {tour : req.params.tourId}
    
        //EXECUTE THE QUERY
        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
        .paginate();
    
    //const doc = await features.query.explain();//returns the deyails of the query
    
    const doc = await features.query;//waits for the return function of this.query from the APIfeatures class
    
        res.status(200).json({
            status: 'success',
            results: doc.length, //to find the total no. of result not compulsory
            data: {
                data: doc //if key and value name is same we names. we can write x : tours also
            }
        });
    
})





//Below comment is Older code implemented in controllers


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
   
    
// })