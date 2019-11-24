let mongoose = require('mongoose');
let crypto = require('crypto');

var GoogleUserSchema = mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  googleId: {type: String, required: true},
  name: {type: String},
  email: {type: String},
  emails: [
    {
      id: false,
      value: {type: String},
      type: {type: String}
    }
  ],
  pictures: [
    {
      id: false,
      value: {type: String},
      type: {type: String}
    }
  ],
  language: {type: String},
  domain: {type: String},
  accessToken: {type: String},
  refreshToken: {type: String},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  last_login: {type: Date, default: Date.now},
  temporaryToken: {
    value: String, 
    generated: {type: Date},
  },
});

GoogleUserSchema.methods.login = function() {
  this.last_login = Date.now();
  return this.save();
}

// GoogleUserSchema.methods.linkUser = function(user) {
//   this.user = user;
//   this.temporaryToken = {
//     value: null,
//     generated: Date.now()
//   };
//   return this.save();
// }

GoogleUserSchema.methods.linkUserFromToken = function(temporaryToken, user) {
  return GoogleUser.findOne({'temporaryToken.value': temporaryToken})
  .then(googleUser => {
    return googleUser.linkUser(user)
    .then(() => {
      return user.linkGoogleUser(googleUser);
    });
  });
}

GoogleUserSchema.statics.findByGoogleOrCreate = async (profileGoogle, accessToken, refreshToken) => {
  return GoogleUser.findOne({googleId: profileGoogle.id})
  .then(currentGoogleUser => {
    if (currentGoogleUser) {
      // Google User already exists, it's a Log in.
      return currentGoogleUser.login()
      .then(() => {
        return currentGoogleUser;
      }).catch();
    } else {
      // It's a Register
      return (new GoogleUser({
        googleId: profileGoogle.id,
        name: profileGoogle.displayName,
        email: profileGoogle.email || profileGoogle.emails[0].value,
        emails: profileGoogle.emails,
        pictures: profileGoogle.photos,
        accessToken: accessToken,
        refreshToken: refreshToken,
        language: profileGoogle.language,
        domain: profileGoogle._json.domain,
        temporaryToken: {
          value: crypto.randomBytes(32).toString('hex'),
          generated: Date.now(),
        }
      })).save();
    }
  });
}

var LinkUserPlugin = require('./plugins/linkUser.plugin');
var LastUpdatedPlugin = require('./plugins/lastUpdated.plugin');
GoogleUserSchema.plugin(LinkUserPlugin);
GoogleUserSchema.plugin(LastUpdatedPlugin);

var GoogleUser = mongoose.model('GoogleUser', GoogleUserSchema);

module.exports = GoogleUser;