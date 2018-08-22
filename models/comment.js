const mongoose = require('mongoose');
// this gives our model access to using promises. by default mongoose doesn't have promises
mongoose.Promise = global.Promise;

//we have a replies field because sometimes people will reply to a specific comment. if we want to implement nesting, this will make it easier to render all of the comments in an organized way
const CommentSchema = mongoose.Schema({
	body: { type: String, required: true },
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, {
	timestamps: true
});

// create a new 'id' field that will create a hex string from '_id' to make it easier for graphql
CommentSchema.virtual('id').get(function() {
	return this._id.toHexString();
});

// ensure that every time we get a comment we are including the hexed, created id
CommentSchema.set('toObject', {
	virtuals: true
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;