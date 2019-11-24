require('dotenv').config();
var express = require('express');
var app = express();
let passport = require('passport');
var mongoose = require('mongoose');
let User = require('./models/user');
let UserSession = require('./models/userSession');
let ClientModel = require('./models/tokenModels').ClientModel;

app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  //intercepts OPTIONS method
  if ('OPTIONS' === req.method) {
    //respond with 200
    res.sendStatus(200);
  } else {
  //move on
    next();
  }
});


// Database
mongoose.plugin(schema => { schema.options.usePushEach = true; });
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);
var db = mongoose.connection;

db.on('error', console.error.bind(console));
db.once('open', function() {
  console.log('Connected to DB!');
});

if (app.get('env') === 'production') {
  // Redirect non https only in production
  app.use(function(req, res, next) {
      if(req.protocol !== 'https') return res.redirect(301, "https://" + req.headers.host + req.url);
      else return next();
  });
}

// Generic logging
var morgan = require('morgan');
morgan.token('fullurl', function getFullUrl(req) {
  return req.hostname + req.originalUrl;
});
app.use(morgan(':method :fullurl :status - :res[content-length] b in :response-time ms (referrer = :referrer)'));


// Init passport
app.use(passport.initialize());

app.get('/redirect', (req, res, next) => {
  let state = (req.query.state ? JSON.parse(req.query.state) : null);
  return res.redirect((process.env.NODE_ENV === 'development' ? 'http://' : 'https://')+ 
                      process.env.HOST_FRONTFLIP + 
                      ( (state && state.orgTag) ? '/' + state.orgTag : '') + 
                      '/signin/google/callback?token='+req.query.token+
                      ((req.query.state && req.query.state !== '{}') ? '&state='+req.query.state : ''));
});


// OAuth2 server
let oauth2 = require('./api/auth/oauth2');
require('./api/auth/auth');


// Exchange temporary token to access and refresh tokens
//@todo use passport strategy to handle that
app.post('/locale/exchange', (req, res, next) => {

  ClientModel.findOne({ clientId: req.body.client_id }, function(err, client) {
    if (err) return res.status(500).json({message: 'Internal error', error: err});
    if (!client) return res.status(403).json({message: 'Unauthorized'});
    if (client.clientSecret != req.body.client_secret) return res.status(403).json({message: 'Unauthorized'});
    
    User.findByTemporaryToken(req.body.token)
    .then(user => {
      if(!user) return res.status(404).json({message: 'Token not valid'});
      UserSession.findPopulatedObject(user.temporaryToken.userSession)
      .then(uSession => {
        return res.status(200).json({access_token: uSession.accessToken.token, refresh_token: uSession.refreshToken.token});
      }).catch(err => res.status(500).json({message: 'Internal error', error: err}));
    }).catch(err => res.status(500).json({message: 'Internal error', error: err}));
  });

});


// Locale OAuth (for Users & Clients)
app.use('/locale', oauth2.token);


var buildStringState = (user, queryState, integrationName) => {
  let state = (queryState && queryState !== '{}' ? JSON.parse(queryState) : {});
  state.success = (user && user.userId ? 'true' : 'false');
  state.integration = integrationName;
  if(user && user.integrationState) state.integrationState = user.integrationState
  return JSON.stringify(state);
}


// Google OAuth
app.get('/google', (req, res, next) => {
  return passport.authenticate('google', { prompt: 'select_account', scope: ['profile','email', 'https://www.googleapis.com/auth/admin.directory.user.readonly'], state: req.query.state})(req, res);
});


app.get('/google/callback', passport.authenticate('google'), function(req, res, next){
  let state = buildStringState(req.user, req.query.state, 'google');

  User.findById(req.user.userId)
  .then((user) => {
      return res.redirect('/redirect?token='+user.temporaryToken.value+( (state && state !== '{}') ? '&state='+state : ''));
  });
});


// Register
let register = require('./api/register/register');
app.use('/register',register);


// Example of secure API route
app.get('/isAuth', passport.authenticate('bearer', {session: false}), function(req, res, next){
  res.status(200).json(req.user);
});


let registerToOrg = require('./api/registerToOrg/registerToOrg');
app.use('/register/organisation', passport.authenticate('bearer', {session: false}), registerToOrg);


let passwordReset = require('./api/password/password');
app.use('/password/reset', passwordReset);


// API GOOGLE
let apiGoogle = require('./api/google.api');
app.use('/api/googleUsers', apiGoogle);


// API INVITATION CODE
let apiInvitationCode = require('./api/invitationCode.api');
app.use('/api/invitationCodes', apiInvitationCode);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log(req.originalUrl + ' not found.');
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// generic error setter
app.use(function(err, req, res, next) {

  res.locals.error = err || {};
  res.locals.status = ( (err ? err.status : null) || 500);
  res.locals.error.date = new Date().toISOString();

  // During early Beta log verbose 500 errors to Heroku console
  if (res.locals.status >= 500) console.error(err);

  return res.status(err.status || 500).json({message: err.message || err, date: res.locals.error.date});
});

module.exports = app;