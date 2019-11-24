/**
 * @api {post} /authorization/organisation/:orgTag/:invitationCode? Register a new User in Organisation
 * @apiName RegisterUserInOrg
 * @apiGroup Organisation
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User 'Bearer access_token'
 * @apiParam {String} orgTag Organisation tag
 * @apiParam {String} invitationCode Invitation code (optionnal)
 * 
 * @apiSuccess {String} message User registered in organisation. OR User already registered in Organisation.
 * @apiSuccess {User} user User object
 * @apiSuccess {Organisation} organisation Organisation object
 * 
 * @apiError (500 Internal Server Error) InternalError Internal error
 * @apiError (404 Not Found) OrganisationNotFound Organisation not found.
 * @apiError (403 Forbidden) InvitationExpired Invitation expired
 * @apiError (403 Forbidden) UserForbidden User can't access the Organisation.
 */

var express = require('express');
var router = express.Router();
var Organisation = require('../../models/organisation');
var InvitationCode = require('../../models/invitationCode');

/**
 * @description Try to find Organisation by tag provided.
 */
router.post('/:orgId/:invitationCode?', function (req, res, next) {
    Organisation.findOne({ '_id': req.params.orgId })
        .then(organisation => {
            if (!organisation) return res.status(404).json({ message: 'Organisation not found.' });
            res.locals.organisation = organisation;
            return next();
        }).catch((err) => { return next(err); });
});

/**
 * @description User can access organisation if one of the three check is passed.
 */
router.post('/:orgId/:invitationCode?', function (req, res, next) {
    // when user is invited, he is already registered in the organisation
    if (req.user.belongsToOrganisation(res.locals.organisation._id)) {
        return res.status(200).json({ message: 'User already registered in Organisation.', organisation: res.locals.organisation, user: req.user });
    }

    // User try to access with a code
    if (req.params.invitationCode) {

        InvitationCode.validateCode(req.params.invitationCode, res.locals.organisation._id, req.user)
            .then(isCodeValid => {
                if (isCodeValid) {
                    req.user.attachRole(res.locals.organisation);
                    next();
                } else {
                    return res.status(403).json({ message: 'Invitation expired' });
                }
            }).catch((e) => { next(e); })

    } else {
        return res.status(403).json({ message: 'User can\'t access the Organisation.' });
    }

});

/**
 * @description Save User with Organisation linked.
 */
router.post('/:orgTag/:invitationCode?', function (req, res, next) {
    req.user.save()
        .then(() => {
            return res.status(200).json({ message: 'User registered in organisation.', organisation: res.locals.organisation, user: req.user });
        }).catch((err) => { return next(err); });
});

module.exports = router;