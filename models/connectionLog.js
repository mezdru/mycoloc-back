let mongoose = require('mongoose');
let ua = require('ua-parser');
const iplocation = require("iplocation").default;
let User = require('../models/user');

var ConnectionLogSchema = mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  location: {type: mongoose.Schema.Types.Mixed},
  os: String,
  browser: String,
  IPAddress: String,
  type: {type: String, enum: ['locale', 'google', 'linkedin', 'refresh token']},
  requestUrl: {type: String},
  created: { type: Date, default: Date.now },
});

ConnectionLogSchema.statics.createFromRequest = async function(req, userId, ownerId, connectionType) {

  User.accessApp(userId);

  var ip = (req.headers['x-forwarded-for'] || '').split(',').pop() || 
            req.connection.remoteAddress || 
            req.socket.remoteAddress || 
            req.connection.socket.remoteAddress;
  
  var parsedUA = ua.parse(req.headers['user-agent']);

  return (new ConnectionLog({
    user: userId,
    owner: ownerId,
    IPAddress: ip,
    browser: parsedUA.ua.toString(),
    os: parsedUA.os.toString(),
    location: await getLocationByIp(ip),
    type: connectionType,
    requestUrl: req.headers['Referer']
  })).save();
}

var ConnectionLog = mongoose.model('ConnectionLog', ConnectionLogSchema);

module.exports = ConnectionLog;

async function getLocationByIp(ip) {
  return new Promise((resolve, reject) => {
    iplocation(ip, [], (error, res) => {
      if(error) {
        console.log(error);
        return resolve(null);
      }
      return resolve(res);
    });
  });
}