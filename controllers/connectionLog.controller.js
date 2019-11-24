var ConnectionLog = require('../models/connectionLog');

exports.getConnectionLogs = async (req, res, next) => {
  ConnectionLog.find(req.query)
  .then(connectionLogs => {

    if(connectionLogs.length === 0) {
      req.backflipAuth = {message: 'connectionLogs not found', status: 404};
    } else {
      req.backflipAuth = {message: 'connectionLogs found', status: 200, data: connectionLogs};
    }

    return next();

  }).catch(err => {return next(err)});
}

// @description Get latest connection logs (older than 10 minutes)
exports.getLatestConnection = async (req, res, next) => {
  var TenMinutesAgo = new Date( Date.now() - 1000 * 60 * 10 );
  let connectionLog = await ConnectionLog.findOne({user: req.user._id, created: {$lt: TenMinutesAgo}}).sort({created: -1}).catch(e => null);

  req.backflipAuth = {status: 200, message: 'Latest connection log found.', data: connectionLog};
  return next();
}