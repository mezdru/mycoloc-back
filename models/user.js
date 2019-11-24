let mongoose = require('mongoose');
let crypto = require('crypto');
let normalizeEmail = require('express-validator/node_modules/validator/lib/normalizeEmail.js');

let userSchema = mongoose.Schema({
  locale: {type: String, default: 'fr'},
  logo: {type: String},
  name: {type: String},
  roles: [
    {
      _id: false,
      organisation: {type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', default: null},
      admin: Boolean,
      monthly: { type: Boolean, default: true },
      welcomed: { type: Boolean, default: false }, // name issue : welcomed should be a date
      created: {type: Date, default: null},
      welcomed_date: {type: Date, default: null},
    }
  ],
  email: {
    value: {type: String, index: true, unique: true, sparse: true},
    normalized: {type: String, index: true, unique: true, sparse: true},
    hash: {type: String, index: true, unique: true, sparse: true},
    token: String,
    generated: Date,
    validated: Boolean
  },
  last_login: { type: Date },
  last_action: {type: Date},
  last_access: {type: Date},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  superadmin: Boolean,
  hashedPassword: {type: String, select: false},
  salt: {type: String, select: false},
  temporaryToken: {
    value: String, 
    generated: Date,
    userSession: {type: mongoose.Schema.Types.ObjectId, ref: 'UserSession', default: null}
  },
  googleUser: {type: mongoose.Schema.Types.ObjectId, ref: 'GoogleUser', default: null}
});

// PASSWORD MANAGE
userSchema.methods.encryptPassword = function(password){
  let dateA = new Date();
  let encodedPass = crypto.pbkdf2Sync(password, this.salt, 20000, 512, 'sha512').toString('hex');
  let dateB = new Date();
  console.log( '[ENCRYPT_PASSWORD] - time : ' + (dateB.getTime()-dateA.getTime())/1000 + ' seconds' );
  return encodedPass;
}

userSchema.virtual('password')
  .set(function(password){
    this._plainPassword = password;
    this.salt = crypto.randomBytes(128).toString('hex');
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {return this.hashedPassword;});

userSchema.methods.checkPassword = function(password){
  return this.encryptPassword(password) === this.hashedPassword;
};
// END PASSWORD MANAGE

userSchema.methods.belongsToOrganisation = function(organisationId) {
  return this.roles.some(orgAndRecord => organisationId.equals(getId(orgAndRecord.organisation)));
};

userSchema.methods.isAdminToOrganisation = function(organisationId) {
  return this.roles.some(orgAndRecord => organisationId.equals(getId(orgAndRecord.organisation)) && orgAndRecord.admin === true);
};

userSchema.methods.getRole = function(organisationId) {
  return this.roles.find(orgAndRecord => organisationId.equals(getId(orgAndRecord.organisation)));
};

userSchema.methods.attachRole = function(organisation, callback) {
  var role = this.getRole(organisation._id);
  if (!role) {
    this.roles.push({organisation: organisation, created: Date.now()});
  }
  if (callback) this.save(callback);
  else return this;
};

userSchema.methods.linkGoogleUser = function(googleUser) {
  this.googleUser = googleUser;
  return this.save();
}

userSchema.methods.login = function() {
  this.last_login = Date.now();
  return this.save();
}

userSchema.statics.accessApp = function(userId) {
  return User.findOne({_id: userId})
  .then(user => {
    user.last_access = Date.now();
    user.save();
  })
}

userSchema.statics.findByTemporaryToken= function(tToken) {
  return this.findOne({'temporaryToken.value': tToken})
  .exec();
};

userSchema.statics.findOneByEmail = function (email, callback) {
  email = this.normalizeEmail(email);
  this.findOne({$or: [{'google.normalized':email}, {'email.normalized':email}] }, callback);
};

userSchema.statics.findOneByEmailAsync = function(email) {
  email = this.normalizeEmail(email);
  return this.findOne({$or: [{'google.normalized':email}, {'email.normalized':email}, {'email.value': email}] });
}

userSchema.statics.findOneByEmailWithPassword  = function (email) {
  email = this.normalizeEmail(email);
  return this.findOne({$or: [{'google.normalized':email}, {'email.normalized':email}] }).select('hashedPassword salt google email');
};

userSchema.statics.createFromGoogle = function(googleUser) {
  return (new User({
    googleUser: googleUser,
    email: {
      value: googleUser.email,
      validated: true,
      normalized: User.normalizeEmail(googleUser.email)
    }
  })).save()
  .then(newUser => {
    return googleUser.linkUser(newUser)
    .then(() => {return newUser;});
  });
}

userSchema.statics.normalizeEmail = function(email) {
  return normalizeEmail(email,
    {
      gmail_remove_subaddress:false,
      outlookdotcom_remove_subaddress:false,
      yahoo_remove_subaddress:false,
      icloud_remove_subaddress:false
    }
  );
};

/*
* We have submodels within User (oransiation, record...)
* Sometime these are populated (fetched by mongoose), sometime not.
* We want to retrieve the ObjectId no matter.
* @todo move this somewhere tidy like /helpers
*/
function getId(subObject) {
  return subObject._id || subObject;
}

var LastUpdatedPlugin = require('./plugins/lastUpdated.plugin');
userSchema.plugin(LastUpdatedPlugin);

var User = mongoose.model('User', userSchema);

module.exports = User;
