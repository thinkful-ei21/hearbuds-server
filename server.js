'use strict';

require('dotenv').config();
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const passport = require('passport');
const morgan = require('morgan');
const axios = require('axios');
const cors = require('cors');

const Event = require('./models/event');
const User = require('./models/user');
const Comment = require('./models/comment');
const jwtDecode = require('jwt-decode');


const { TICKETMASTER_BASE_URL, TICKETMASTER_API_KEY, MAPQUEST_BASE_URL, MAPQUEST_API_KEY} = require('./config');

const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const {router: userRouter} = require('./users/router');

const { dbConnect } = require('./db');


//importing models

//typedefs



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
}

type Query {
  getUser(id: ID!): User
  getEvents: [Event]
  getByZip(zip: Int): [Event]
  getById(id: String): Event
}
`);


const parseTicketmasterResponse = (response) =>{
  let arr = response.data._embedded.events;
  let events =  arr.map(e =>{
    let link;
    try {
      link = e._embedded.attractions[0].externalLinks.homepage[0].url;
    } catch (error) {
      console.log('homepage not found');
      link = null;
    }

    return Event.findOne({eventId:e.id}).populate({path: 'comments', populate: { path: 'user'}})
      .then(event => {
        console.log(event)
        let comments = event? event.comments : null

        return {
          name: e.name,
          id: e.id,
          dates:e.dates,
          venue:e._embedded.venues[0],
          largeImage: e.images[7].url,
          smallImage: e.images[1].url,
          ticketLink: e.url,
          bandLink:link,
          distance: e.distance,
          comments: comments
        }
      })
  })

  return events;
  
};

const getUser = (args) => {
  console.log(args);
  return 'user';
};

const getById = async (args) => {
	let event = await Event.findOneOrCreate({eventId: args.id}, {eventId: args.id});

  return axios.get(`${TICKETMASTER_BASE_URL}events.json?size=1&id=${args.id}&apikey=${TICKETMASTER_API_KEY}`)
    .then(response =>parseTicketmasterResponse(response)[0] );

};

const getEvents = (args) => {
  return axios.get(`${TICKETMASTER_BASE_URL}events.json?size=10&apikey=${TICKETMASTER_API_KEY}`)
    .then(response => parseTicketmasterResponse(response) );
};

const getByZip = (args, request) => {
  // console.log('passed: ', args, request.headers)
  
  const decodedToken = jwtDecode(request.headers.authorization.slice(7))
  
  return User.findOne({username:decodedToken.user.username})
    .then( user => {
      console.log('user zip is:', user.zip)
      return axios.get(
        `${MAPQUEST_BASE_URL}address?key=${MAPQUEST_API_KEY}&inFormat=kvp&outFormat=json&location=${user.zip}&thumbMaps=false`
      )
    })

  // return axios.get(
  //   `${MAPQUEST_BASE_URL}address?key=${MAPQUEST_API_KEY}&inFormat=kvp&outFormat=json&location=${args.zip}&thumbMaps=false`
  // )
    .then(res => {
      // console.log(res.data.results[0].locations[0].latLng);
      return res.data.results[0].locations[0].latLng;
    })
    .then(loc =>{
      return axios.get(`${TICKETMASTER_BASE_URL}events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${loc.lat},${loc.lng}&radius=50&countryCode=US`)
        .then(response => {
          return parseTicketmasterResponse(response);
        });
      //response includes next/prev links for pagination
      //parsing of ticketmaster response obj will happen here
      // console.log(response.data._embedded.events[0].images[7]);
      // return response.data._embedded.events;});
    
    })
    .catch(err=>{
      console.log(err);
      return new Error('API response error');
    });
 
};

const setComment = async (args, request) => {
  const decodedToken = jwtDecode(request.headers.authorization.slice(7))
  let username = decodedToken.user.username;

  let user = await User.findOne({username: username});
  console.log(user);
	return Comment.create({user: user._id, body: args.body})
					.then(comment => {
						return Event.findOneAndUpdate(
							{ eventId: args.eventId }, 
							{ $push: {comments: comment._id }}
						).populate({path: 'comments', populate: { path: 'user'}})
					})
					.then(event => event)
}

// The root provides the top-level API endpoints
const resolvers = {
  getUser: (args) => getUser(args),
  getEvents: (args) => getEvents(args),
  getByZip: (args, request) => getByZip(args, request),
  getById: (args) => getById(args),
  setComment: (args, request) => setComment(args, request)

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
app.use('/graphql', jwtAuth, graphqlHTTP({
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


