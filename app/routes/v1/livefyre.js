"use strict";

const express = require('express');
const router = express.Router();
const livefyreControllerV1 = require('../../controllers/v1/livefyre.js');


router.get('/metadata', livefyreControllerV1.metadata);


router.get('/getcollectiondetails', livefyreControllerV1.getCollectionDetails);


router.get('/init', livefyreControllerV1.init);

router.get('/get_lf_bootstrap', livefyreControllerV1.getLfBootstrap);

router.get('/profile', livefyreControllerV1.profile);


module.exports = router;












