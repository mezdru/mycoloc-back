let mongoose = require('mongoose');

// Client
var Client = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    clientId: {
        type: String,
        unique: true,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    },
    scope: [
        String
    ]
});

var ClientModel = mongoose.model('Client', Client);

// AccessToken
var AccessToken = mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    scope: [
        String
    ]
});

var AccessTokenModel = mongoose.model('AccessToken', AccessToken);

// RefreshToken
var RefreshToken = mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var RefreshTokenModel = mongoose.model('RefreshToken', RefreshToken);


module.exports.ClientModel = ClientModel;
module.exports.AccessTokenModel = AccessTokenModel;
module.exports.RefreshTokenModel = RefreshTokenModel;