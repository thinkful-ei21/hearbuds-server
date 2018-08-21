'use strict';

var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');

// const { dbConnect } = require('')

//models

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

// app.use('/auth')

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
}));
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