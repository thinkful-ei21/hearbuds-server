const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const CommentSchema = mongoose.Schema({
	body: { type: String, required: true },
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

CommentSchema.virtual('id').get(function() {
	return this._id.toHexString();
});

CommentSchema.set('toObject', {
	virtuals: true
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;