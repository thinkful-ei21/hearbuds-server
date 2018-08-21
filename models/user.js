const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
	username: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true }
});

UserSchema.virtual('id').get(function() {
	return this._id.toHexString();
});

UserSchema.set('toObject', {
	virtuals: true
});

const User = mongoose.model('User', UserSchema);

module.exports = User;