"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../../controllers/v1/user');



router.get('/getauth', userController.getAuth);


router.get('/setPseudonym', userController.setPseudonym);
router.post('/setPseudonym', userController.setPseudonym);


router.get('/updateuser', userController.updateUser);
router.post('/updateuser', userController.updateUser);



router.get('/emptypseudonym', userController.emptyPseudonym);


router.patch('/userUpdated', userController.userUpdated);

module.exports = router;
