'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/headbuds';
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';