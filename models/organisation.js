var mongoose = require('mongoose');

var organisationSchema = mongoose.Schema({
	name: String,
	logo: {type: String},
	cover: {type: String},
	creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now },
	premium: { type: Boolean, default: false },
	canInvite: { type: Boolean, default: true },
});

var Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;
