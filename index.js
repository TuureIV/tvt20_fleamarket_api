// Import dependencies
const express = require( "express" );
const bodyParser = require( "body-parser" );
const secrets = require( "./secrets.json");
const app = express();

// Import routes
const routes = require( "./routes/routes" );

// Middleware defitions
// Parse requests of content-type - application/json
app.use( bodyParser.json() );

//MongoDB connection
const mongoose = require( "mongoose" );
const mongoURL = secrets.mongooseKey;
mongoose.connect( mongoURL, { useNewUrlParser: true, useUnifiedTopology: true } );
const db = mongoose.connection;
db.on( "error", console.error.bind( console, "MongoDB connection error" ));

// Use routes
app.use( "/", routes );

// Port the api is listening
const port = process.env.PORT || 80;          // Portti 80 kun laitetaan interwebziin

app.listen( port, () => {
    console.log( `Server is running on port ${port}..` );
});

module.exports = app;