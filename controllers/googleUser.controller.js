var GoogleUser = require('../models/googleUser');

exports.getGoogleUsers = async (req, res, next) => {
  GoogleUser.find(req.query)
  .then(googleUsers => {

    if(googleUsers.length === 0) {
      req.backflipAuth = {message: 'Google Users not found', status: 404};
    } else {
      req.backflipAuth = {message: 'Google Users found', status: 200, data: googleUsers};
    }

    return next();

  }).catch(err => {return next(err)});
}

exports.getSingleGoogleUser = async (req, res, next) => {
  GoogleUser.findOne({_id: req.params.id, ... req.query})
  .then(googleUser => {

    if(!googleUser) {
      req.backflipAuth = {message: 'Google User not found', status: 404};
    } else {
      req.backflipAuth = {message: 'Google User found', status: 200, data: googleUser, owner: googleUser.user};
    }

    return next();

  }).catch(err => {return next(err)});
}