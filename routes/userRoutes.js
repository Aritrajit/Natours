const express = require('express');
const userController = require("../controllers/userController");
const authController = require('../controllers/authController');


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Protect all routes after this middleware
router.use(authController.protect) // runs this middleware before all the below routes as middleware run in sequence

router.patch('/updateMyPassword',
    //authController.protect,//commented beacuse of the above app.use(authController.protect) middleware
    authController.updatePassword);

router.get('/me',
    //authController.protect,
    userController.getMe,
    userController.getUser)

router.patch('/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    //authController.protect,
    userController.updateMe);

router.delete('/deleteMe',
    //authController.protect,
    userController.deleteMe);

//Restrict all routes after this middleware    
router.use(authController.restrictTo('admin')); // runs this middleware before all the below routes as middleware run in sequence

router
    .route('/')
    .get(userController.getAllUsers) 
    .post(userController.createUser) 

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)




module.exports = router;