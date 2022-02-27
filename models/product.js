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

// More precisely defined schema
let schema = new Schema(
    {
        productName: { type: String, required: true, maxlength: 150 },
        description: { type: String, required: true, maxlength: 150 },
        price: { type: String, required: true, maxlength: 200 },
        condition: { type: String, required: true, maxlength: 200 },
        picture: { type: String, required: false, maxlength: 400 },
        category: { type: String, required: true, maxlength: 200 },
        creationDate: { type: String, required: false },
        seller: { 
            sellerId: { type: String, required: false, maxlength: 200 },
            name: { type: String, required: false, maxlength: 200 },
            email: { type: String, required: false, maxlength: 200 },
            phone: { type: String, required: false, maxlength: 200 },
            city: { type: String, required: false, maxlength: 200 },
        },
        location:{ 
            city: { type: String, required: false, maxlength: 200 },
            address: { type: String, required: false, maxlength: 200 },
            zipCode: { type: String, required: false, maxlength: 200 },
        },
        deliveryType: {
            pickup: { type: Boolean, required: true, maxlength: 50 },
            shipping: { type: Boolean, required: true, maxlength: 50 },
        }
    }
);

// Export model
module.exports = mongoose.model( "Product", schema );