'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/hearbuds';
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
exports.TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/';
exports.TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
exports.MAPQUEST_BASE_URL = 'https://www.mapquestapi.com/geocoding/v1/';
exports.MAPQUEST_API_KEY = process.env.MAPQUEST_API_KEY;