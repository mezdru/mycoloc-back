var express = require('express');
var router = express.Router();
var GoogleUserController = require('../controllers/googleUser.controller');
var Authorization = require('./authorization');
var passport = require('passport');

const RESOURCE_MODEL = 'googleUser';


router.use((req, res, next) => {
  req.backflipAuth = req.backflipAuth || {};
  req.backflipAuth.resource = {
    model: RESOURCE_MODEL
  }
  next();
});

router.get(
  '/:id', 
  passport.authenticate('bearer', {session: false}),
  GoogleUserController.getSingleGoogleUser,
  Authorization.resUserOwnOnly
)

router.get(
  '', 
  passport.authenticate('bearer', {session: false}),
  Authorization.superadminOnly, 
  GoogleUserController.getGoogleUsers,
  Authorization.resWithData
)

module.exports = router;