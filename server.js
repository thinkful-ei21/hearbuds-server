'use strict';

require('dotenv').config();
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const passport = require('passport');
const morgan = require('morgan');

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

type Query {
	getUser(id: ID!): User
}
`);



const getUser = (args)=>{
  console.log(args);
  return 'user';
};


// The root provides the top-level API endpoints
const resolvers = {
  getUser: (args) => getUser(args) 


};

var app = express();

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