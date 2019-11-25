var express = require('express');
var router = express.Router();

var organisationsApi = require('./routes/organisation.api');
router.use('/organisations', organisationsApi);

var usersApi = require('./routes/user.api');
router.use('/users', usersApi);

var emailsApi = require('./routes/email.api');
router.use('/emails', emailsApi);

let apiGoogle = require('./routes/google.api');
router.use('/googleUsers', apiGoogle);

let apiInvitationCode = require('./routes/invitationCode.api');
router.use('/invitationCodes', apiInvitationCode);

module.exports = router;