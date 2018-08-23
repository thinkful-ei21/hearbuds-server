'use strict';

require('dotenv').config();
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const passport = require('passport');
const morgan = require('morgan');
const axios = require('axios');
const cors = require('cors');

const { TICKETMASTER_BASE_URL, TICKETMASTER_API_KEY, MAPQUEST_BASE_URL, MAPQUEST_API_KEY} = require('./config');

const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const {router: userRouter} = require('./users/router');

const { dbConnect } = require('./db');

//importing models

//typedefs

const schema = buildSchema(`
type User {
	id: ID!
	username: String!
	email: String!
}

type Event {
	name: String
	type: String
	id: String
	url: String
	images: [Image]
	classifications: [Classification]
	promoter: Promoter
	promoters: [Promoter]
	seatmap: Seatmap
	_embedded: Venue
	dates: Date
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

type Venue {
	name: String
	type: String
	id: String
	postalCode: String
	timezone: String
}

type Query {
  getUser(id: ID!): User
  getEvents: [Event]
  getByZip(zip: Int): [Event]
  getById(id: String): Event
}
`);



const getUser = (args) => {
  console.log(args);
  return 'user';
};

const getById = (args) => {
  return axios.get(`${TICKETMASTER_BASE_URL}events.json?size=1&id=${args.id}&apikey=${TICKETMASTER_API_KEY}`)
      .then(response => response.data._embedded.events[0])
}

const getEvents = (args) => {
  return axios.get(`${TICKETMASTER_BASE_URL}events.json?size=10&apikey=${TICKETMASTER_API_KEY}`)
    .then(response => response.data._embedded.events);
};

const getByZip = (args) => {
  return axios.get(
    `${MAPQUEST_BASE_URL}address?key=${MAPQUEST_API_KEY}&inFormat=kvp&outFormat=json&location=${args.zip}&thumbMaps=false`
  )
    .then(res => {
      // console.log(res.data.results[0].locations[0].latLng);
      return res.data.results[0].locations[0].latLng;
    })
    .then(loc =>{
      return axios.get(`${TICKETMASTER_BASE_URL}events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${loc.lat},${loc.lng}&radius=50&countryCode=US`)
        .then(response => response.data._embedded.events);
    
    })
    .catch(err=>{
      console.log(err);
      return new Error('location service error');
    });
 
};

// The root provides the top-level API endpoints
const resolvers = {
  getUser: (args) => getUser(args),
  getEvents: (args) => getEvents(args),
  getByZip: (args) => getByZip(args),
  getById: (args) => getById(args)
};

var app = express();
app.use(cors());
app.use(morgan('common'));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/users/', userRouter);
app.use('/auth/', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });


//a test protected endpoint
app.get('/protected', jwtAuth, (req, res) => {
  return res.json({
	  data: 'rosebud'
  });
});

//insert jwtAuth middleware once we're further along
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
}));
dbConnect();
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');

//creating our server
// const server = new ApolloServer({
// 	context: {},
// 	typeDefs,
// 	resolvers,
// 	debug: true
// });

// server.listen().then(({url}) => {
// 	//connect the database
// 	console.log(`current listening on ${url}`);
// });