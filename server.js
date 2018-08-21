const { ApolloServer, gql } = require('apollo-server');
// const { dbConnect } = require('')

//models

//typedefs
const typeDefs = gql`
	type User {
		id: ID!
		username: String!
		email: String!
	}

	type Query {
		getUser(id: ID!): User
	}
`;

//resolvers
const resolvers = {
	Query: {
		getUser: (root, args) => console.log('user')
	}
};
//creating our server
const server = new ApolloServer({
	context: {},
	typeDefs,
	resolvers,
	debug: true
});

server.listen().then(({url}) => {
	//connect the database
	console.log(`current listening on ${url}`);
});