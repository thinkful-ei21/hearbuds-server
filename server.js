'use strict';

require('dotenv').config();
const express = require('express');
const graphqlHTTP = require('express-graphql');
const passport = require('passport');
const morgan = require('morgan');
const cors = require('cors');

const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const {router: userRouter} = require('./users/router');
const { dbConnect } = require('./db');

const resolvers = require('./graphQL/resolvers');
const schema = require('./graphQL/schema');

var app = express();
app.use(cors());
app.use(morgan('common'));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/users/', userRouter);
app.use('/auth/', authRouter);

app.use('/', function(req, res, next) {
  passport.authenticate('jwt', function(err, user, info) {
    // console.log('user', user, info, req.headers);
    if (err) { return next(err); }
    if (!user) { req.headers.authorization = null;
      return next(); }
    return next();
  })(req, res, next);
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
}));
dbConnect();
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');