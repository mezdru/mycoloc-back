var express = require('express');
var router = express.Router();
var ConnectionLogController = require('../controllers/connectionLog.controller');
var Authorization = require('./authorization');
var passport = require('passport');

const RESOURCE_MODEL = 'connectionLog';

router.use((req, res, next) => {
  req.backflipAuth = req.backflipAuth || {};
  req.backflipAuth.resource = {
    model: RESOURCE_MODEL
  }

  next();
});

router.get(
  '/me/latest',
  passport.authenticate('bearer', {session: false}),
  ConnectionLogController.getLatestConnection,
  Authorization.resWithData
)

router.get(
  '/', 
  passport.authenticate('bearer', {session: false}),
  Authorization.superadminOrClient, 
  ConnectionLogController.getConnectionLogs,
  Authorization.resWithData
)

module.exports = router;