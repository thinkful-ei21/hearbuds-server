'use strict';

const functions = require('firebase-functions');
let secret, ticketmaster, mapquest, database;
try {
	secret = functions.config().jwt.secret;
	ticketmaster = functions.config().ticketmaster.key;
	mapquest = functions.config().mapquest.key;
	database = functions.config().database.url;
} catch (e) {
}




exports.JWT_SECRET = secret || process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
exports.TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/';
exports.TICKETMASTER_API_KEY = ticketmaster || process.env.TICKETMASTER_API_KEY;
exports.MAPQUEST_BASE_URL = 'https://www.mapquestapi.com/geocoding/v1/';
exports.MAPQUEST_API_KEY = mapquest || process.env.MAPQUEST_API_KEY;
exports.DATABASE_URL = database || process.env.DATABASE_URL || 'mongodb://localhost/hearbuds';