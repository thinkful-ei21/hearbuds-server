'use strict';

const Event = require('../models/event');

const parseTicketmasterResponse = (response) =>{
  let arr;

  // console.log(response.data)

  if(response.data){
    if(response.data.page.totalElements === 0){
      return []
    }
   arr = response.data._embedded.events;
  //  console.log("response.data", arr)
  }
  else{
    arr = response
    // console.log("no response.data", arr)
  }
  

  let events =  arr.map( async (e) =>{
    let link;
    try {
      link = e._embedded.attractions[0].externalLinks.homepage[0].url;
    } catch (error) {
      console.log('homepage not found');
      link = null;
    }
  
    return Event.findOne({eventId:e.id}).populate({path: 'comments', populate: { path: 'user'}})
      .then(event => {

        let comments = event? event.comments : null;
        let attending = event? event.attending : null;
  
        return {
          name: e.name,
          id: e.id,
          dates:e.dates,
          venue: e._embedded ? e._embedded.venues[0] : e.venue,
          smallImage: e.images? e.images[1].url : e.smallImage,
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
  