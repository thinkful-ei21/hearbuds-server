'use strict';

const Event = require('../models/event');

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
        // console.log(event);
        let comments = event? event.comments : null;
        let attending = event? event.attending : null;
  
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
          comments: comments,
          attending: attending
        };
      });
  });
  
  return events;
    
};
  
module.exports = {parseTicketmasterResponse};
  