'use strict';

const { buildSchema } = require('graphql');

const schema = buildSchema(`
type User {
	id: ID!
	username: String
	email: String
  zip: String
}

type Event {
	name: String
	type: String
  id: String
  venue: Venue
  largeImage: String
  smallImage: String
  ticketLink: String
  bandLink: String
  distance: Float
	classifications: [Classification]
	promoter: Promoter
	promoters: [Promoter]
	seatmap: Seatmap
	_embedded: Venues
  dates: Date
  comments: [Comment]
  attending: [User]
}

type Comment{
  body: String
  user: User
}

type Image {
	ratio: String
	url: String
	width: String
	height: String
	fallback: Boolean
}

type Seatmap {
	staticUrl: String
}

type Date {
	start: StartTime
	spanMultipleDays: Boolean
}

type StartTime {
	localDate: String
	localTime: String
	dateTime: String
	dateTBD: Boolean
	dateTBA: Boolean
	timeTBA: Boolean
}

type Classification {
	primary: Boolean
	family: Boolean
	genre: Genre
}

type Genre {
	id: String
	name: String
}

type Promoter {
	id: String
	name: String
	description: String
}
type Venues {
  venue: Venue
}
type Venue {
	name: String
	type: String
	id: String
}

type Mutation {
  setComment(body: String, userId: String, eventId: String): String
  setRSVP(attending: Boolean, eventID: String): Event
}



type Query {
  getUser(id: ID!): User
  getEvents: [Event]
  getByZip(zip: Int, page: Int): [Event]
  getById(id: String): Event
}
`);

module.exports = schema;