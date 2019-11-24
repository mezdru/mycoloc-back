/**
 * @api {post} /register Register a new User
 * @apiName RegisterUser
 * @apiGroup User
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} email Email of the User
 * @apiParam {String} password Password of the User
 * 
 * @apiSuccess {String} message User created with success.
 * @apiSuccess {User} user User object
 * 
 * @apiError (500 Internal Server Error) InternalError Internal error
 * @apiError (400 Bad Request) BadRequest Missing parameters OR User exists already
 * @apiError (422 Invalid Parameters) InvalidParameters Invalid parameters OR Invalid password
 */

var express = require('express');
var router = express.Router();
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
let dumbPasswords = require('dumb-passwords');
let User = require('../../models/user');
var md5 = require('md5');

/**
 * @description Checking the parameters
 */
router.post('/', function(req, res, next){
    if(!req.body.email ||!req.body.password) return res.status(400).json({message: 'Missing parameters'});
    next();
});

router.post('/',
sanitizeBody('email').trim().normalizeEmail({
        gmail_remove_subaddress:false,
        gmail_remove_dots: false,
        outlookdotcom_remove_subaddress:false,
        yahoo_remove_subaddress:false,
        icloud_remove_subaddress:false
    })
);

router.post('/',
    body('email').isEmail().withMessage((value, {req}) => {
        return 'Please provide a valid Email Address';
    }),
    body('password').isLength({ min: 6}).withMessage((value, {req}) => {
        return 'Your password should have 6 characters min.';
    })
);

/**
 * @description Check if password is not dumb.
 */
router.post('/', function(req, res, next){
    var errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({message: 'Invalid parameters', errors: errors.array()});

    if(dumbPasswords.check(req.body.password)){
        const rate = dumbPasswords.rateOfUsage(req.body.password);
        return res.status(422).json({message: 'Invalid password', errors: [{param: 'password', msg: rate.frequency, type: 'dumb'}]});
    }
    
    next();
});

/**
 * @description Register new user if not already existing
 */
router.post('/', function(req, res, next){
    User.findOneByEmail(req.body.email, function(err, user) {
        if(err) return next(err);
        if(user) return res.status(400).json({message: 'User already exists.'});

        let newUser = new User({
            email: {
                value: req.body.email,
                normalized: User.normalizeEmail(req.body.email),
                generated: Date.now(),
            },
            password: req.body.password
        });
        
        newUser.email.hash = md5(newUser.email.normalized);

        newUser.save()
        .then((userSaved) => {
            // do not send password data
            userSaved.hashedPassword = undefined;
            userSaved.salt = undefined;

            console.log('AUTH - REGISTER - Locale - ' + userSaved.email.value);
            return res.status(200).json({message: 'User created with success.', user: userSaved});
        }).catch((err)=>{return next(err);});
    });
});

module.exports = router;