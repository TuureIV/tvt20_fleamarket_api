const mongoose = require( "mongoose" );

const Schema = mongoose.Schema;

// Basic definition
/*
var MovieSchema = new Schema(
    {
        title: type: String,
        director: type: String,
        year: type: Number,
    }
); */

// More precisely defined
let schema = new Schema(
    {
        fName: { type: String, required: true, maxlength: 150 },
        lName: { type: String, required: true, maxlength: 150 },
        username: { type: String, required: true, maxlength: 200 },
        email: { type: String, required: true, maxlength: 200 },
        phone: { type: Number, required: true },
        password: { type: String, required: true, maxlength: 200 },
        address: { 
            street: { type: String, required: true, maxlength: 200 },
            zipCode: { type: String, required: true, maxlength: 200 },
            stateProvince: { type: String, required: true, maxlength: 200 },
            country: { type: String, required: true, maxlength: 200 },
            city: { type: String, required: true, maxlength: 200 },
        }
    }
);

// Export model
module.exports = mongoose.model( "User", schema );