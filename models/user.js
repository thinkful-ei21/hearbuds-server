'use strict';

const mongoose = require('mongoose');

// this gives our model access to using promises. by default mongoose doesn't have promises

const bcrypt = require('bcryptjs');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: false, unique: true },
  password: { type: String, required: true },
  zip: { type: String, required: true }
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

UserSchema.methods.serialize = function() {
  return {
	  username: this.username || '',
	  };
};


UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};
  
UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = {User};