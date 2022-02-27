
const mongoose = require('mongoose');
const secrets = require( "../secrets.json" )
  
// tells mongoose to use ES6 implementation of promises
mongoose.Promise = global.Promise;
const MONGODB_URI = secrets.mongooseKey;
mongoose.connect( MONGODB_URI );
  
// mongoose.connection
//     .once( 'open', () => console.log( 'Connected!' ))
//     .on( 'error', ( error ) => {
//         console.warn( 'Error : ', error );
//     });
      
//     runs before each test
//     beforeEach((done) => {
//         mongoose.connection.collections.users.drop( () => {
//         done();
//        });
// });