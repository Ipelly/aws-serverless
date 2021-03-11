const _ = require("lodash");
const geolib = require("geolib");
const fs = require("fs");

module.exports.handler = async event => {
    if (event.httpMethod === 'GET') {
      let response = await getZipCodes(event);
      return done(response);
    } else if (event.httpMethod === 'POST') {
        
    }  
};


const done = response => {
  return {
      statusCode: '200',
      body: JSON.stringify(response),
      headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Methods': '*',
          'Access-Control-Allow-Origin': '*'
      }
  }
}


const getZipCodes = async event =>{

  const data = [];
  try {
    const jsonString = fs.readFileSync("./data.json");
    data = JSON.parse(jsonString);

    if (event && event.query) {
      let filteredData = [];
      _.forEach(event.query, function(value, key) {
        if (key == "zip") { //resource?zip=1010
          filteredData = _.filter(
            filteredData.length ? filteredData : data,
            function(o) {
              return o.zip.indexOf(value) > -1;
            }
          );
        } else if (key == "city") { //resource?city=nyc
          filteredData = _.filter(
            filteredData.length ? filteredData : data,
            function(o) {
              return (
                o.primary_city.toLowerCase().indexOf(value.toLowerCase()) > -1
              );
            }
          );
        } else if (key == "geo") { //resource?geo=40.7,-70.3
          let geo = value.split(",");
          filteredData = _.reduce(
            filteredData.length ? filteredData : data,
            function(result, curr) {
              if (_.isEmpty(result)) result = curr;

              if (
                geolib.getDistance(
                  { latitude: geo[0], longitude: geo[1] },
                  {
                    latitude: Number(curr.latitude),
                    longitude: Number(curr.longitude)
                  }
                ) <
                geolib.getDistance(
                  { latitude: geo[0], longitude: geo[1] },
                  {
                    latitude: Number(result.latitude),
                    longitude: Number(result.longitude)
                  }
                )
              ) {
                return curr;
              }
              return result;
            },
            {}
          );
        } else { //resource?state=MA&country=US
          filteredData = _.filter(
            filteredData.length ? filteredData : data,
            function(o) {
              return o[key] ? o[key].toLowerCase() === value.toLowerCase() : null;
            }
          );
        }
      });
      return filteredData; // It will be returned if its filtered
    }
    return data; // It will be returned if there is nothing to be filtered
  } catch (err) {
    return ;
  }
}