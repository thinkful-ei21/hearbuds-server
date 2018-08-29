const mongoose = require('mongoose');
// this gives our model access to using promises. by default mongoose doesn't have promises
mongoose.Promise = global.Promise;

// we have fields for attending and considering which we can add users to so we can get a count of who is going to what event
// we also have comments that will get attached so people can communicate about events
const EventSchema = mongoose.Schema({
	eventId: { type: String, required: true, unique: true },
	attending: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	considering: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]
}, {
	timestamps: true
});

// create a new field called 'id' which is basically a hex string of our '_id' field. graphql likes this better
EventSchema.virtual('id').get(function() {
	return this._id.toHexString();
});

// every time we query an event we are returning the object
EventSchema.set('toObject', {
	virtuals: true
});

//adding a static method which looks for an event. if one is found it returns it otherwise it will just create a new one
EventSchema.static('findOneOrCreate', async function findOneOrCreate(condition, doc) {
	const data = await this.findOne(condition).populate({path: 'comments', populate: { path: 'user'}});
	return data || this.create(doc);
});

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;