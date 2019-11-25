var User = require('../models/user');
var mongoose = require('mongoose');

exports.getSingleUser = async (req, res, next) => {
  User.findOne({ _id: req.params.id || req.user._id })
    .then(linkedinUser => {

      if (!linkedinUser) {
        req.back = { message: 'User not found', status: 404 };
      } else {
        req.back = { message: 'User found', status: 200, data: linkedinUser, owner: linkedinUser.user };
      }

      return next();

    }).catch(err => { return next(err) });
}

exports.getMe = async (req, res, next) => {

  let me = await User.findOne({ _id: req.user._id })
    .populate('roles.organisation')

  req.back = { message: 'User fetch with success', status: 200, data: me, owner: req.user._id };
  return next();
}

exports.updateSingleUser = async (req, res, next) => {
  if (!req.body.user) {
    req.back = { message: 'Missing body parameter: user', status: 422 };
    return next();
  }

  if (!req.body.user.locale) {
    req.back = { message: 'Missing parameter property: locale. You can only update this property for now.', status: 422 };
    return next();
  }

  User.findOneAndUpdate({ _id: req.params.id }, { $set: { locale: req.body.user.locale } }, { new: true })
    .then(userUpdated => {
      if (!userUpdated) {
        req.back = { message: 'User not found', status: 404 };
      } else {
        req.back = { message: 'User (locale property) updated with success', status: 200, data: userUpdated };
      }
      return next();
    }).catch(err => next(err));
}

exports.banUser = async (req, res, next) => {
  if (!req.params.id || !req.params.organisationId) {
    req.back = { status: 422, message: 'Missing mendatory parameters.' };
    return next();
  }

  let user = await User.findOne({ _id: req.params.id, 'orgsAndRecords.organisation': req.params.organisationId }).catch(e => null);

  if (!user) {
    req.back = { status: 422, message: "Can find user for these parameters" };
    return next();
  }

  let orgId = mongoose.Types.ObjectId(req.params.organisationId); // detachOrg needs ObjectID param
  user.detachOrg(orgId, function (err, user) {
    if (err) return next(err);

    req.back = { status: 200, message: "User banned from the organisation." };
    return next();
  });
}