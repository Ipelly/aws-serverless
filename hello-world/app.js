// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';

const _ = require("lodash");
const geolib = require("geolib");
const fs = require("fs");


let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {

    if (event.httpMethod === 'GET') {
        let response = await getZipCodes(event);
        return done(response);
    } else if (event.httpMethod === 'POST') {
          
    }  
};


const getZipCodes = async event =>{

    try {
        let jsonString = fs.readFileSync("./data.json");
        let data = JSON.parse(jsonString);
        let filteredData = [];

        if (event && event["queryStringParameters"]) {
            
            Object.keys(event["queryStringParameters"]).forEach(function(key,index) {
                // key: the name of the object key
                // index: the ordinal position of the key within the object 
                const value = event["queryStringParameters"][key]; 
                if(key=='zip'){
                    const zipVal = event["queryStringParameters"][key];  
                    filteredData = _.filter( filteredData.length ? filteredData : data, (obj)=> {
                        return obj.zip.indexOf(value) > -1;
                    });
                } else if(key=='city'){
                    filteredData = _.filter( filteredData.length ? filteredData : data, (obj)=> {
                        return obj.primary_city.toLowerCase().indexOf(value.toLowerCase()) > -1
                    });
                }else if(key=='geo'){
                    let geo = value.split(",");
                    filteredData = _.reduce(filteredData.length ? filteredData : data, (result, curr) => {
                        if (_.isEmpty(result)) result = curr;
                
                        if (  geolib.getDistance (
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
                            ) return curr;
                              
                        return result},{});
                } else { //resource?state=MA&country=US
                    filteredData = _.filter(
                        filteredData.length ? filteredData : data, (o)=> {
                            return o[key] ? o[key].toLowerCase() === value.toLowerCase() : null;
                        }
                    );
                }
            });

            return filteredData;
        }
        return data; // It will be returned if there is nothing to be filtered

        //   } else { //resource?state=MA&country=US
        //     filteredData = _.filter(
        //       filteredData.length ? filteredData : data,
        //       function(o) {
        //         return o[key] ? o[key].toLowerCase() === value.toLowerCase() : null;
        //       }
        //     );
        //   }
        // });
        
    } catch (err) {
        console.log(err);
        return err ;
    }
}

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
