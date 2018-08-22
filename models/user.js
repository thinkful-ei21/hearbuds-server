const mongoose = require('mongoose');
// this gives our model access to using promises. by default mongoose doesn't have promises
mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
	username: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true }
});

// create an 'id' field from our standard '_id'
// we convert it to hex string to make it easier for graphql to work. i was getting errors without this
UserSchema.virtual('id').get(function() {
	return this._id.toHexString();
});

// makes sure any time we return the user that we include our virtual 'id' field we created
UserSchema.set('toObject', {
	virtuals: true
});

const User = mongoose.model('User', UserSchema);

module.exports = User;