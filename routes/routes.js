const express = require( "express" );
const dotenv = require( 'dotenv' );
dotenv.config();
const router = express.Router();
const User = require( "../models/user" );
const Product = require( "../models/product" );
const path = require( 'path');
const bcrypt = require( "bcryptjs" );
const passport = require( "passport" );
const BasicStrategy = require( "passport-http" ).BasicStrategy
const jwt = require( "jsonwebtoken" );
const { append } = require("express/lib/response");
const user = require("../models/user");
const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
let jwtValidationOptions = {}
jwtValidationOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtValidationOptions.secretOrKey = process.env.JWT_SIGN_KEY;

const upload = require( "../multer" );
const cloudinary = require( "../cloudinary" );
const fs = require( "fs" );
const multer = require("multer");
const { MulterError } = require("multer");


// Tietoturvallisuus middleware hommia
const jwtCheck = new JwtStrategy( jwtValidationOptions, async ( jwt_payload, done ) => {    
    try {
        const users = await User.findById( { _id: jwt_payload.userId } );

        done( null, users );      
    } catch ( err ) {
        console.log( { message: err.message } );
    } 
}); 

// Basic Auth function
const credentialsCheck = new BasicStrategy( async ( username, password, done ) => {
    try {
        const users = await User.find();
        let user = users.find( u => ( u.username === username ) && ( bcrypt.compareSync( password, u.password )));

        if ( user != undefined ) {
            done( null, user );
        } else {
            done( null, false )
        }
      
    } catch ( err ) {
        console.log( { message: err.message } );
    }
});

passport.use( credentialsCheck );
passport.use( jwtCheck );


// Login Stuff
//router.post( "/login",  async ( req, res ) => {
router.post( "/login", passport.authenticate( "basic", { session: false } ), async ( req, res ) => {
  
    const payloadData = {
        foo:"bar",
        hops:"pops",
        userId: req.user._id
    }
    const options = {
        expiresIn: "30min"
    }
    const token = jwt.sign( payloadData, process.env.JWT_SIGN_KEY, options )
    res.status( 200 ).json( { token: token } )
});

// User related things
// Get user information using basic auth
router.get( "/users", passport.authenticate( "basic", { session: false } ), async ( req, res ) => {
//router.get( "/users",  ( req, res ) => {

    try {
        const user = await User.findOne( { username: req.user.username } );
        delete user._doc.password;
        res.send( user );
    } catch ( err ) {
        return res.status( 500 ).json( { message: err.message } );
    }
});

// CREATE a new user
router.post( "/users", async ( req, res ) => {

    if ( req.body.password === undefined ) {
        res.status( 400 ).json( { message: "Possible error in input array" } );
    } else {
        const salt = bcrypt.genSaltSync( 6 );
        const hashedPassword = bcrypt.hashSync( req.body.password, salt );

        const user = new User( { ...req.body } );
        user.password = hashedPassword;

        try {
            // Tallennetaan muuttujiin mahdolliset jo käytössä olevat käyttäjänimi ja email
            const existingUserEmail = await User.findOne( { email: user.email } );
            const existingUserUsername = await User.findOne( { username: user.username } );
            if ( existingUserEmail ) { 
                res.status( 409 ).send( "Email already in use." );
            } else if ( existingUserUsername ) {
                res.status( 409 ).send( "Username already in use." );    
            } else {
                // Tietokantaan tallennus
                try {
                    const newUser = await user.save();
                    // Palautetaan käyttäjälle tieto käyttäjän id:stä
                    res.status( 201 ).json ( { userId: newUser._id } );
                } catch ( err ) {
                    // Jos post-jsonista puuttuu kenttiä
                    return res.status( 400 ).json( { message: err.message } );
                }
            }
        } catch ( err ) {
            return res.status( 500 ).json( { message: err.message } );
        }
    }
    
});

// DELETE user using ID
//router.delete( "/users/:id", async ( req, res ) => {
router.delete( "/users/:id", passport.authenticate( "jwt", { session: false } ), async ( req, res ) => {
    const id = req.params.id;

    // Delete all products related to userID before deleting the user itself
    await Product.deleteOne( { _doc: { seller: { sellerId: id } } }, ( err, result ) => {
        if ( err ) {
            return res.status( 500 ).json( { message: err.message } );
        }
    }).clone();


    await User.findByIdAndDelete( { _id: id }, ( err, result ) => {
        if ( err ) {
            return res.status( 404 ).json( { message: "ID not found" } );
        } else {        
            res.status( 200 ).json( { message: "User deleted"} );         
        }
    }).clone();
});

// UPDATE user information
//router.put( "/users/:userId", async ( req, res ) => {
router.put( "/users/:userId", passport.authenticate( "jwt", { session: false } ), async ( req, res ) => {
    const id = req.params.userId;    
    if ( req.body.fName === undefined ) {                                                           // Köykänen testaus virheellisen json-taulukon varalta
        res.status( 400 ).json( { message: "Possible object ( [] ) symbols in input field"})        // palaute
    } else {
        if ( req.body.username === undefined || req.body.username === "" ) {                        // Jos username jää tyhjäksi
            res.status( 400 ).json( { message: "Username can't be empty!" } );                      // Palaute
        } 
        else if ( req.body._id || req.body.id ) {                                                   // Tai jos syötteestä löytyy id
            res.status( 403 ).json( { message: "userID update is out of limits!" } );
        } else {                                                                                    // niin sitten tapahtuu seuraavaa...
            if ( req.body.password ) {                                                              // Jos päivitetään salasana       
                const salt = bcrypt.genSaltSync( 6 );                                               // Suolataan
                const hashedPassword = bcrypt.hashSync( req.body.password, salt );                  // Salataan           
                req.body.password = hashedPassword;                                                 // Tallennetaan 
            }  
            if ( req.body.address ) {                                                                           // Jos päivitetään osoitekenttä,
                if ( req.body.address.zipCode === undefined || req.body.address.street === undefined ||         // niin tarkastellaan, että kaikki
                    req.body.address.stateProvince === undefined || req.body.address.country === undefined ||   // osoitekentän kentät ovat olemassa
                    req.body.address.city === undefined ) {
                        res.status( 400 ).json( { message: "Missing data fields!" } );                          // Palaute
                } else {                                                                                        // Muussa tapauksessa....
                    await User.findByIdAndUpdate( { _id: id }, req.body, { new: true }, ( err, result ) => {    // Etsitään tietokannasta id:llä käyttäjä ja päivitetään
                        if ( err ) {                                                                            // Jos virhe, niin tulostetaan virheviesti
                            return res.status( 500 ).json( { message: err.message } );
                        } else {
                            res.status( 200 ).json( result )                                                    // Muutoin tulostetaan status 200 ja tulos
                        }
                    }).clone();                                                                                 // Tää on joku pakollinen juttu
                }
            } else {                                                                                            // Jos ei koskettu osoitekenttään, niin..
                await User.findByIdAndUpdate( { _id: id }, req.body, { new: true }, ( err, result ) => {        // etsitään tietokannasta samoin kuin edellisessä
                    if ( err ) {       
                        return res.status( 404 ).json( { message: "UserID not found!" } );
                    } else {
                        res.status( 200 ).json( result )
                    }
                }).clone(); 
            } 
        }        
    }     
});


// All product related thingys
// GET all products using query
router.get( "/products",  async ( req, res ) => {

    const query = req.query     // query parametrit tänne

    // for (var name in json_parsed) {
    //     console.log(name + "=" + json_parsed[name]);
    // }

    if ( query.city != undefined && query.category != undefined  && query.dateCreated != undefined ) {
        try{
            const products = await Product.find();
            const filter1 = products.filter( filterCity => filterCity.location.city === query.city );
            const filter2 = filter1.filter( filterCategory => filterCategory.category === query.category );
            const filter3 = filter2.filter( filterDate => filterDate.creationDate == query.dateCreated )

            for ( index in filter3 ) {          // Poistetaan kaikki id:t ennen tulostusta
                delete filter3[index]._doc._id
                delete filter3[index]._doc.seller.sellerId 
                delete filter3[index]._doc.__v 
            }       

            if ( filter3.length == 0 ) {
                res.status( 404 ).json( { message: "No products were found!" } );
            } else {
                res.send( filter3 );
            }
            

        } catch ( err ) {        
            return res.status( 500 ).json( { message: err.message } );
        }
    } 
    else if ( query.city != undefined && query.category != undefined ) { 
        try{
            const products = await Product.find();
            const filter1 = products.filter( filterCity => filterCity.location.city === query.city );
            const filter2 = filter1.filter( filterCategory => filterCategory.category === query.category );  
            
            for ( index in filter2) {          // Poistetaan kaikki id:t ennen tulostusta
                delete filter2[index]._doc._id
                delete filter2[index]._doc.seller.sellerId
                delete filter2[index]._doc.__v
            }  

            if ( filter2.length == 0 ) {
                res.status( 404 ).json( { message: "No products were found!" } );
            } else {
                res.send( filter2 );
            }

        } catch ( err ) {        
            return res.status( 500 ).json( { message: err.message } );
        }
    } else {
        res.status( 400 ).send( "Not all query parameters used." );
    }
});

// CREATE new products for users
//router.post( "/users/:userId/products", async ( req, res ) => {
router.post( "/users/:userId/products", passport.authenticate( "jwt", { session: false } ), async ( req, res ) => {
    const userId = req.params.userId;

    // Aikaleiman määritys
    let timeStamp = new Date();
    let timeString = String( timeStamp.getDate()+ "."+ timeStamp.getMonth()+"."+ timeStamp.getFullYear() ); //+ " "+ timeStamp.getHours()+":"+ timeStamp.getMinutes()+ ":"+ timeStamp.getSeconds()
    
    try {
        const user = await User.findById( { _id: userId } );                            // Haetaan apia käyttävä käyttäjän tiedot mongosta
        mongoUserIdToString =  (user._doc._id).toString();
        // Tietokantaan tallennnus
        try {        
            const product = new Product( { creationDate: timeString, ...req.body } );   // Määritellään uusi tuote
            // Laitetaan tuotteen tietoihin käyttäjän tietoja
            product.seller.sellerId = userId;
            product.seller.name = user.fName + " " + user.lName;
            product.seller.email = user.email;
            product.seller.phone = user.phone;
            product.location.city = user.address.city;
            product.location.zipCode = user.address.zipCode;
    
            const newProduct = await product.save();                                    // Tuotteen tallennus mongoon
    
            res.status( 201 ).json ( newProduct );                                      // Onnistu saatana

        } catch ( err ) {
            // Jos post-jsonista puuttuu kenttiä
            return res.status( 400 ).json( { message: "Fill the missing fields!" } );
        }         
    } catch ( err ) {
        return res.status( 404 ).json( { message: "UserID not found!" } );
    }    
});

// DELETE product using productID
//router.delete( "/users/:userId/products/:productId", async ( req, res ) => {
router.delete( "/users/:userId/products/:productId", passport.authenticate( "jwt", { session: false } ), async ( req, res ) => {
    const userId = req.params.userId;
    const productId = req.params.productId;

    await Product.deleteOne( { _id: productId, seller: { sellerId: userId } }, ( err, result ) => {
        if ( err ) {
            return res.status( 404 ).json( { message: "productID not found!" } );
        } else {
            if ( result.deletedCount == 0 ) {
                res.status( 404 ).send( "UserID not found!" );
            } else {
                res.status( 200 ).json( result )
            }            
        }
    }).clone();
});

// GET products owned by user
//router.get( "/users/:userId/products", async ( req, res ) => {
router.get( "/users/:userId/products", passport.authenticate( "jwt", { session: false } ), async ( req, res ) => {
    const userId = req.params.userId;
    
    try {
        const products = await Product.find();
        const userProducts = products.filter( p => p.seller.sellerId == userId );

        if ( userProducts.length == 0 ) {
            res.status( 404 ).json( { message: "UserID not found!" } );
        } else {
            res.send( userProducts );    
        }                     
               
    } catch ( err ) {
        res.status( 500 ).json( { message: err.message } );
    }

});

// UPDATE products using productID
//router.put( "/users/:userId/products/:productId", async ( req, res ) => {
router.put( "/users/:userId/products/:productId", passport.authenticate( "jwt", { session: false } ), async ( req, res ) => {
    const productId = req.params.productId;
    
    try {
        const user = await User.findById( { _id: req.params.userId } );          
    
        if ( req.body.seller || req.body.location || req.body._id || req.body.id ) { 
            res.status( 400 ).json( { message: "Älä koske käyttäjä- tai paikkatietoihin" } );
        } else {              
            const product = await Product.findById( productId )
            if ( product._id == productId ) {
                
                const seller = {
                    sellerId: user._id,
                    name: user.fName + " " + user.lName,
                    email: user.email,
                    phone: user.phone,
                };
                const location = {
                    city: user.address.city,
                    address: user.address.street,
                    zipCode: user.address.zipCode
                    
                };
                const newProduct = {  
                    ...req.body,
                    seller,
                    location 
                };                
        
                await Product.findByIdAndUpdate( { _id: productId }, newProduct, { new: true }, ( err, result ) => {
                    if ( err ) {
                        return res.status( 404 ).json( { message: "ProductID not found!" } );
                    } else {
                        res.status( 200 ).json( result )
                    }
                }).clone(); 

            } else {
                res.status( 404 ).json( { message: "ProductID not found!" } );
            }        
        }          
    } catch ( err ) {
        res.status( 404 ).json( { message: "UserID or ProductID not found!" } );
    }
});

// TOKEN TESTAUS-URI
router.get( "/testi", passport.authenticate( "jwt", { session: false } ), ( req, res ) => {
    "console.log"( jwtCheck )
    res.json( {message: "Toimii toimii" } );
});

router.post( '/products/:productId/images', passport.authenticate( "jwt", { session: false } ), upload.array( 'image' ), async ( req, res ) => {        
    const id = req.params.productId;

    try {
        const product = await Product.findById( { _id: id } )
        
        if ( product._id == id ) {
            if ( req.files == undefined ) {
                return res.status( 400 ).json( { message: "empty" } );
            } else {
                // Cloudinary-lähetys
                const uploader = async ( path ) => await cloudinary.uploads( path, 'images' ); 

                let urls = [];                                  // Taulukko Cloudinary dadalle
                const files = req.files;                        // req.files dada

                for ( const file of files ) {                   // Laitetaan kaikki Cloudinarysta
                    const { path } = file;                      // saatu olennainen dada taulukkoon.
                    const newPath = await uploader( path );
                    urls.push( newPath );            
                    fs.unlinkSync( path );
                }
                
                let url = "";
                for ( index in urls ) {                         // Looppi jossa urlit survotaan
                    url = urls[index].url + " " + url;          // yhdeksi merkkijonoksi
                }

                product.picture = product.picture + " " + url;  // Tallennetaan merkkijono tuotteen sisuksiin

                // Päivitetään tuote
                await Product.findByIdAndUpdate( { _id: id }, product, { new: true }, ( err, result ) => {
                    if ( err ) {
                        return res.status( 500 ).json( { message: err.message } ); //"ProductID not found!" } );
                    } else {
                        res.status( 200 ).json( result )
                    }
                }).clone(); 
            }
        }
    } catch ( err ) {
        return res.status( 404 ).json( { message: "ProductID not found!" } );
    }

});

router.get( "/", ( req, res ) => {
    res.sendFile( path.join( __dirname, '../ApiDocumentation.html' ) );
});



module.exports = router;
