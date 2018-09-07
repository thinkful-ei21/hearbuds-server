'use strict';


const {parseTicketmasterResponse} = require('./utils')
const axios = require('axios');
const Event = require('../models/event');
const User = require('../models/user');
const Comment = require('../models/comment');
const jwtDecode = require('jwt-decode');
const moment = require('moment');

const { TICKETMASTER_BASE_URL, TICKETMASTER_API_KEY, MAPQUEST_BASE_URL, MAPQUEST_API_KEY} = require('../config');

const getUser = (args) => {
    // console.log(args);
    return 'user';
  };
  
const getById = async (args) => {

      // let event = await Event.findOneOrCreate({eventId: args.id}, {eventId: args.id});
    let tmEvent = await axios.get(`${TICKETMASTER_BASE_URL}events.json?size=1&id=${args.id}&apikey=${TICKETMASTER_API_KEY}`)
      .then(response =>parseTicketmasterResponse(response)[0] );
    let dbEvent = await Event.findOne({ eventId: args.id })
      .populate({path: 'comments', populate: { path: 'user'}})
      .populate({path: 'attending', populate: { path: 'user'}})
    

    tmEvent['attending'] = dbEvent? dbEvent.attending : []
    tmEvent['comments'] = dbEvent? dbEvent.comments : []

    console.log(tmEvent.comments)

    return tmEvent
  
};
  
const getEvents = (args) => {
    return axios.get(`${TICKETMASTER_BASE_URL}events.json?size=10&apikey=${TICKETMASTER_API_KEY}`)
      .then(response => parseTicketmasterResponse(response) );
};
  
  
const getByZip = async (args, request) => {
  
    let decodedToken = '', user = '';
    if (request.headers.authorization) {
      decodedToken = jwtDecode(request.headers.authorization.slice(7));
      user = await User.findOne({username:decodedToken.user.username});
    }
  
  //https://app.ticketmaster.com/discovery/v2/events.json?apikey=GK2zuqLGcMeChWPZii0o9pjB0eS6zVd2&startDateTime=2018-09-05T17:25:25+00:00Z&endDateTime=2018-09-12T17:25:25+00:00Z&latlong=34.063591,-118.437175&radius=250&segmentName=Music&page=1&countryCode=US&sort=distance,asc

    const zip = args.zip ? args.zip : user.zip;
    const page = args.page? args.page : 1;

    const after = args.after? args.after : `${moment().format('YYYY-MM-DDTHH:mm:ss')}`;
    const before = args.before? args.after : `${moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:ss')}`;
    const radius = args.radius ? args.radius : 250
    const searchTerm = args.searchTerm? args.searchTerm.replace(" ", "%20") : ''
     
    return axios.get(
          `${MAPQUEST_BASE_URL}address?key=${MAPQUEST_API_KEY}&inFormat=kvp&outFormat=json&location=${zip}&thumbMaps=false`
        )
    
      .then(res => {
        
        return res.data.results[0].locations[0].latLng;
        
      })
      .then(loc =>{
        console.log('sanity please')
        const locQuery = !args.zip && args.city ? `&city=${args.city}` : `&latlong=${loc.lat},${loc.lng}&radius=${radius}`

        return axios.get(`${TICKETMASTER_BASE_URL}events.json?apikey=${TICKETMASTER_API_KEY}`+
          `&startDateTime=${after}z&endDateTime=${before}z`+
          locQuery +
          `&segmentName=Music`+
          `&keyword=${searchTerm}` +
          `&page=${page}&countryCode=US&sort=distance,asc`
      )
          .then(response => {
            console.log("query is: ",`${TICKETMASTER_BASE_URL}events.json?apikey=${TICKETMASTER_API_KEY}`+
          `&startDateTime=${after}&endDateTime=${before}`+
          locQuery +
          `&segmentName=Music`+
          `&keyword=${searchTerm}` +
          `&page=${page}&countryCode=US&sort=distance,asc`)
            return parseTicketmasterResponse(response);
          });
      
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

    let event = await Event.findOne({ eventId: args.eventId })

    let comment = await Comment.create({user: user._id, body: args.body})
    
    if (event)  {
      return Event.findOneAndUpdate(
        { eventId: args.eventId }, 
        { $push: {comments: comment._id }}  )
        .populate({path: 'comments', populate: { path: 'user'}})
    }
    else {
      event = await getById({id: args.eventId}).then(e => {return parseTicketmasterResponse([e])[0]})
      console.log(event)
      return Event.create({
        eventId: event.id,
        comments: [comment._id],
        thumbnail: event.smallImage,
        name: event.name
      })

    }
}

const setRSVP = async (args, request) => {
  
    if(request.headers.authenticate === null){
      return new Error('unauthorized mutation')
    }
    
    const decodedToken = jwtDecode(request.headers.authorization.slice(7))
    let username = decodedToken.user.username;
  
    let event = await Event.findOne({eventId: args.eventID})
      .populate({path: 'attending', populate: { path: 'user', select: 'username'}})
    
   
    if(event){
      let attending = event.attending.map(u => u.username)
     
      if(attending.includes(username) && !args.attending){
        let user = await User.findOne({username: username})
        return Event.findOneAndUpdate(
          {eventId: args.eventID}, {$pull: {attending: user._id}, $inc: {popularity: -1}}, {new:true})
          .populate({path: 'attending', populate: { path: 'user', select: 'username'}})
      }
      else if(!attending.includes(username) && args.attending){
        let user = await User.findOne({username: username})
        return Event.findOneAndUpdate(
          {eventId: args.eventID}, {$push: {attending: user}, $inc: {popularity: 1}}, {new:true})
          .populate({path: 'attending', populate: { path: 'user', select: 'username'}})
      }
      else{
        return Event.findOne({eventId: args.eventID})
      }
    }
    else if(args.attending){
      let user = await User.findOne({username: username})

      
      let event = await getById({id: args.eventID}).then(e => {
    
        return parseTicketmasterResponse([e])[0]})
      // console.log('event:',event)
      return Event.create({
        eventId: event.id,
        attending: [user],
        popularity: 1,
        thumbnail: event.smallImage,
        name: event.name
      })

    }
    else{
      return Event.findOne({eventId: args.eventID})
    }
  
  }
  
  const getByPop = async (args, request) => {

    let events = await Event.find({}, null, {sort: {popularity: 'desc'}, limit: 20})
    return events
  };


  // The root provides the top-level API endpoints
  const resolvers = {
    getUser: (args) => getUser(args),
    getEvents: (args) => getEvents(args),
    getByZip: (args, request) => getByZip(args, request),
    getByPop: (args, request) => getByPop(args, request),
    getById: (args) => getById(args),
    setComment: (args, request) => setComment(args, request),
    setRSVP: (args, request) => setRSVP(args, request)
  };

module.exports = resolvers;
