const multer = require('multer');
const sharp = require('sharp')
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         //user-77229374034(id)-1341313131(time_stamp).jpeg(extention)
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// })

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

exports.uploadUserPhoto = upload.single('photo');//single is used because we upload only a single file upload is the middle ware using multer

exports.resizeUserPhoto =catchAsync(async(req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;//this step is important because it is require in the updateUser middleware where( filteredBody.photo = req.file.filename ) as memoryStorage does not store file name

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`)

    next();
})

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {//way to loop a object in javaascript
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el]
        }
    })

    return newObj;
}


// exports.getAllUsers = catchAsync(async(req, res) => {
//     const users = await User.find();
        
//         res.status(200).json({
//             status: 'success',
//             results: users.length, //to find the total no. of result not compulsory
//             data: {
//                 tours: users //if key and value name is same we names. we can write x : tours also
//             }
//         });
// })

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);

    //1)Create error if user POSTs or changes password
    if (req.body.password || req.body.passwordConfirm ) {
        return next(new AppError('This Route is not for password updates. Please use /updateMyPassword',400));
    }

    //2)Filtered out the unwanted fieldnames not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');//filters all the rest object as we cant allow the user to update the role ad for password it is already set
    if (req.file) {
        filteredBody.photo = req.file.filename;
    }
    
    //3)Update user document
   
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { //req.user.id comes from the req.user = current user in the protects middleware
        //here we used findByIdAndUpdate because here se dont need to deal with passwords and 
        //hence the document middleware that runs before object is saved does not require to work as it does work onlyin save and create
        new: true,
        runValidators: true
    })


    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false })
    
    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.getUser = factory.getOne(User)

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not defined!,Plz use /signup instead"
    });
}

exports.getAllUsers = factory.getAll(User);
//Do Not update password with this!
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User);