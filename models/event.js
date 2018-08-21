const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const EventSchema = mongoose.Schema({
	eventId: { type: String, required: true, unique: true },
	attending: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	considering: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Commnet'}]
});

EventSchema.virtual('id').get(function() {
	return this._id.toHexString();
});

EventSchema.set('toObject', {
	virtuals: true
});

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;