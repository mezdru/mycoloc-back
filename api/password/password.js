/**
 * @api {post} /password/reset/:token/:hash Update the password of an User
 * @apiName UpdateUserPassword
 * @apiGroup User
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} token Token link to the email of the User
 * @apiParam {String} hash Hash which identify the User
 * @apiParam {String} password New password of the User
 * 
 * @apiSuccess {String} message Password updated with success
 * 
 * @apiError (500 Internal Server Error) InternalError Internal error
 * @apiError (400 Bad Request) BadRequest Missing parameters OR User exists already
 * @apiError (422 Invalid Parameters) InvalidParameters Invalid parameters OR Invalid password
 * @apiError (403 Unauthorized) Unauthorized Token not valid OR Token expired
 * @apiError (404 Not Found) NotFound User not found
 */

var express = require('express');
var router = express.Router();
const { body,validationResult } = require('express-validator/check');
let dumbPasswords = require('dumb-passwords');
let User = require('../../models/user');

/**
 * @description Checking the parameters
 */
router.post('/:token/:hash', function(req, res, next){
    if(!req.body.password || !req.params.token || !req.params.hash) return res.status(400).json({message: 'Missing parameters'});
    next();
});

router.post('/:token/:hash',
    body('password').isLength({ min: 6}).withMessage((value, {req}) => {
        return 'Your password should have 6 characters min.';
    })
);

/**
 * @description Check if password is not dumb.
 */
router.post('/:token/:hash', function(req, res, next){
    var errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({message: 'Invalid parameters', errors: errors.array()});

    if(dumbPasswords.check(req.body.password)){
        const rate = dumbPasswords.rateOfUsage(req.body.password);
        return res.status(422).json({message: 'Invalid password', errors: [{param: 'password', msg: rate.frequency, type: 'dumb'}]});
    }
    
    next();
});

/**
 * @description Update the password of an User
 */
router.post('/:token/:hash', function(req, res, next){
    User.findOne({'email.hash': req.params.hash})
    .then(user => {
        if(!user) return res.status(404).send({message: 'User not found.'});
        if(user.email.token !== req.params.token) return res.status(403).send({message: 'Token not valid'});
        if( !(user.email.generated > Date.now() - 24*30*3600*1000) ) return res.status(403).send({message: 'Token expired'});

        user.password = req.body.password;
        user.email.validated = true;

        User.updateOne({_id: user._id}, {$set: user}, {new: true})
        .then(result => {
            if(result) return res.status(200).send({message: 'Password updated with success', email: user.email.value});
            return next(true);
        }).catch((err)=>{return next(err);});
    }).catch((err)=>{return next(err);});
});

module.exports = router;