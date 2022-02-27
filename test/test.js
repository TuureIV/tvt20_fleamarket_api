const chai = require( 'chai' );
const expect = chai.expect;
const should = chai.should();
const assert = chai.assert;
const chaiHttp = require( 'chai-http' );

// index.js and routes.js
const routes = require( '../routes/routes' );   // Tätä ei oikeasti tarvi
const index = require( '../index' );

// MongooseSchemas
const Product = require( '../models/product' );
const User = require( '../models/user' );


chai.use( chaiHttp );


before( ( done )  => {
    Product.deleteMany( {}, function( err ) {} );
    User.deleteMany( {}, function( err ) {} );
    done();
});

after( ( done ) => {
    Product.deleteMany( {}, function( err ) {} );
    User.deleteMany( {}, function( err ) {} );
    done();
}); 


const testUser = {
    fName: "Teppo",
    lName: "Testaaja",
    username: "hyperteppo",
    email: "teppo@testaaja.com",
    phone: 1234567,
    password: "12345",
    profilePic: "Url here",
    address: { 
        street: "Teponkatu 12",
        zipCode: "99800",
        stateProvince: "Inari",
        country: "Windland",
        city: "Ivalo"
    }
}

const updateUser = {
    fName: "Teukka",
    lName: "Salama",
    username: "finnishFlash8",
    email: "teukka@testaaja.com",
    phone: 1234567,
    password: "12345",
    profilePic: "Url here",
}

const updateUserObject = [{
    fName: "Teukka",
    lName: "Salama",
    email: "teukka@testaaja.com",
    phone: 1234567,
    password: "12345",
    profilePic: "Url here",
}]

const updateUserMissingUsername = {
    fName: "Teukka",
    lName: "Salama",
    email: "teukka@testaaja.com",
    phone: 1234567,
    password: "12345",
    profilePic: "Url here",
}

const testProduct = {
    productName: "Kivekset",
    description: "Ihmisen kassukat",
    price: "200 €",
    condition: "Vitun minttu",
    picture: "Urlia urlia",
    category: "anatomia",
    deliveryType: {
        pickup: true,
        shipping: false,
    },
}

const updatedTestProduct = {
    productName: "Nyydid",
    description: "Ihmisen kassukat",
    price: "200 €",
    condition: "Vitun minttu",
    picture: "Urlia urlia",
    category: "anatomia",
}

const invalidTestProduct = {
    productName: "Kivekset",
    description: "Ihmisen kassukat",
    price: "200 €",
    condition: "Vitun minttu",
    picture: "Urlia urlia"
}

const invalidTestProductObject = [{
    productName: "Kivekset",
    description: "Ihmisen kassukat",
    price: "200 €",
    condition: "Vitun minttu",
    picture: "Urlia urlia"
}]

const loginUser = {
    username: "hyperteppo",
    password: "12345"
}

let city = ""
let category = testProduct.category;
let dateCreated = ""

let userId = "";
let productId = "";
let token = "";
const imagePath = "E:\\Kuvia\\kuvii työpöydält\\exp7.jpg";


describe( 'Create user, get user information, delete user. Basic auth and token is used.', () => {     

    it( 'Should fail to add a new user using wrong req.body', ( done ) => {
        chai.request( index )
            .post( '/users' )
            .send( loginUser )
            .end( ( err, res ) => {
                res.should.have.status( 400 );
                res.body.should.be.a( 'object' );
                done();
        });
    });

    it( 'Should add a new user', ( done ) => {
        chai.request( index )
            .post( '/users' )
            .send( testUser )
            .end( ( err, res ) => {
                res.should.have.status( 201 );
                res.body.should.be.a( 'object' );
                userId = res.body;
                done();
        });
    });
    
    it( 'Should GET user info using basic auth', ( done ) => {
        chai.request( index )
            .get( '/users' )
            .auth( loginUser.username, loginUser.password )
            .end( ( err, res ) => {
                res.should.have.status( 200 );
                res.body.should.be.a( 'object' );
                expect( res.body ).should.not.have.property( 'password' );
                done();
        });
    });

    it ( 'Should fail to get token using invalid login credentials', ( done ) => {
        chai.request( index )
            .post( "/login" )
            .auth( "Aku", "Ankka" )
            .end( ( err, res ) => {
                res.should.have.status( 401 );
                done();
        });
    });

    it ( 'Should succeed and get token from /login', ( done ) => {
        chai.request( index )
            .post( "/login" )
            .auth( loginUser.username, loginUser.password )
            .end( ( err, res ) => {
                expect( res ).to.have.status( 200 )
                expect( res.body ).to.have.property( 'token' );
                token = res.body.token;
                done();
        });
    });

    it( 'Should fail to GET user information', ( done ) => {
        chai.request( index )
            .get( '/users' )
            .auth( "paskaa", "paskaa" )
            .end( ( err, res ) => {               
                res.should.have.status( 401 );            
                done();
        });
    });

    it( 'Should DELETE user but fails magnificently', ( done ) => {
        chai.request( index )
            .delete( '/users/' + "userId.userID" )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {               
                res.should.have.status( 404 );            
                done();
        });
    });

    it( 'Should DELETE user', ( done ) => {
        chai.request( index )
            .delete( '/users/' + userId.userId )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {               
                res.should.have.status( 200 );            
                done();
        });
    });

    it( 'Should fail to GET user information', ( done ) => {
        chai.request( index )
            .get( '/users' )
            .auth( "aku", "ankka" )
            .end( ( err, res ) => {               
                res.should.have.status( 401 );            
                done();
        });
    });    
});


describe( 'Create user, get user information, update user info, delete user. Basic Auth and Token is used.', () => {     

    it( 'Should fail to add a new user using wrong req.body', ( done ) => {
        chai.request( index )
            .post( '/users' )
            .send( loginUser )
            .end( ( err, res ) => {
                res.should.have.status( 400 );
                res.body.should.be.a( 'object' );
                done();
        });
    });

    it( 'Should add a new user', ( done ) => {
        chai.request( index )
            .post( '/users' )
            .send( testUser )
            .end( ( err, res ) => {
                res.should.have.status( 201 );
                res.body.should.be.a( 'object' );
                userId = res.body;
                done();
        });
    });

    it( 'Should GET user info using basic auth', ( done ) => {
        chai.request( index )
            .get( '/users' )
            .auth( loginUser.username, loginUser.password )
            .end( ( err, res ) => {
                res.should.have.status( 200 );
                res.body.should.be.a( 'object' );
                done();
            });
    });

    it( 'Should fail to GET user information', ( done ) => {
        chai.request( index )
            .get( '/users' )
            .auth( "paskaa", "paskaa" )
            .end( ( err, res ) => {               
                res.should.have.status( 401 );            
                done();
            });
    }); 
    
    it( 'Should succeed and get token from /login', ( done ) => {
        chai.request( index )
            .post( "/login" )
            .auth( loginUser.username, loginUser.password )
            .end( ( err, res ) => {
                expect( res ).to.have.status( 200 )
                expect( res.body ).to.have.property( 'token' );
                token = res.body.token;
                done();
        });
    });

    it( 'Should update user info but fails due wrong userID', ( done ) => {
        chai.request( index )
            .put( '/users/' + "PASKAA" )
            .auth( token, { type: 'bearer' } )
            .send( updateUser )
            .end( ( err, res ) => {               
                res.should.have.status( 404 );            
                done();
            });
    });

    it( 'Should update user information', ( done ) => {
        chai.request( index )
            .put( '/users/' + userId.userId )
            .auth( token, { type: 'bearer' } )
            .send( updateUser )
            .end( ( err, res ) => {               
                res.should.have.status( 200 ); 
                expect( res.body ).to.have.property( 'username' );
                res.body.should.be.a( 'object' )           
                done();
            });
    });


    it( 'Should update user but the json is an object instead of an array', ( done ) => {
        chai.request( index )
            .put( '/users/' + userId.userId )
            .auth( token, { type: 'bearer' } )
            .send( updateUserObject )
            .end( ( err, res ) => {               
                res.should.have.status( 400 );        
                done();
            });
    });

    it( 'Should update user but is missing a username', ( done ) => {
        chai.request( index )
            .put( '/users/' + userId.userId )
            .auth( token, { type: 'bearer' } )
            .send( updateUserMissingUsername )
            .end( ( err, res ) => {               
                res.should.have.status( 400 );
                expect( res.body ).to.have.property( "message" );        
                done();
            });
    });

    it( 'Should DELETE user but fails magnificently', ( done ) => {
        chai.request( index )
            .delete( '/users/' + "userId.userID" )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {               
                res.should.have.status( 404 );            
                done();
            });
    });

    it( 'Should DELETE user', ( done ) => {
        chai.request( index )
            .delete( '/users/' + userId.userId )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {               
                res.should.have.status( 200 );            
                done();
            });
    });

    it( 'Should fail to GET user information', ( done ) => {
        chai.request( index )
            .get( '/users/' + "PASKAA" )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {               
                res.should.have.status( 404 );            
                done();
            });
    });    
});


describe( 'Create User, Create product, Update product, Delete Product. Basic Auth and Token is used.', () => {

    it( 'Should add a new user', ( done ) => {
        chai.request( index )
            .post( '/users' )
            .send( testUser )
            .end( ( err, res ) => {
                res.should.have.status( 201 );
                res.body.should.be.a( 'object' );
                userId = res.body;
                done();
        });
    });

    it( 'Should succeed and get token from /login', ( done ) => {
        chai.request( index )
            .post( "/login" )
            .auth( loginUser.username, loginUser.password )
            .end( ( err, res ) => {
                expect( res ).to.have.status( 200 )
                expect( res.body ).to.have.property( 'token' );
                token = res.body.token;
                done();
        });
    });

    it( "Should fail to create a product due invalid userID", (done) => {
        chai.request( index )
            .post( "/users/" + "userId.userID" + "/products" )
            .auth( token, { type: 'bearer' } )
            .send( testProduct )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                done();
            });
    });

    it( "Should fail to create a product due invalid json input", (done) => {
        chai.request( index )
            .post( "/users/" + userId.userId + "/products" )
            .auth( token, { type: 'bearer' } )
            .send( invalidTestProduct )
            .end( ( err, res ) => {
                res.should.have.status( 400 );
                expect( res.body ).to.have.property( "message" );
                done();
            });
    });

    it( "Should fail creating product due using json object instead of array", (done) => {
        chai.request( index )
            .post( "/users/" + userId.userId + "/products" )
            .auth( token, { type: 'bearer' } )
            .send( invalidTestProductObject )
            .end( ( err, res ) => {
                res.should.have.status( 400 );
                done();
            });
    });

    it( "Should create a valid product", (done) => {
        chai.request( index )
            .post( "/users/" + userId.userId + "/products" )
            .auth( token, { type: 'bearer' } )
            .send( testProduct )
            .end( ( err, res ) => {
                res.should.have.status( 201 );
                res.body.should.be.a( "object" );
                city = res.body.location.city;
                dateCreated = res.body.creationDate;
                category = res.body.category;
                productId = res.body._id;
                done();
        });
    });

    it( 'Should get products from DB using two query parameters', ( done ) => {
        chai.request( index )
            .get( '/products?city=' + city + '&category=' + category )
            .end( ( err, res ) => {
                res.should.have.status( 200 );
                res.body.should.be.a( 'array' );           
                done();
        });
    });

    it( 'Should get products from DB using three query parameters', ( done ) => {
        chai.request( index )
            .get( '/products?city=' + city + '&category=' + category + '&dateCreated=' + dateCreated )
            .end( ( err, res ) => {
                res.should.have.status( 200 );
                res.body.should.be.a( 'array' );           
                done();
        });
    });

    it( 'Should fail getting products due invalid query parameters', ( done ) => {
        chai.request( index )
            .get( '/products?shitty=' + city + '&urmum=' + category + '&dateCreated=' + dateCreated )
            .end( ( err, res ) => {
                res.should.have.status( 400 );           
                done();
        });
    });
    
    it( 'Should update product', ( done ) => {
        chai.request( index )
            .put( '/users/' + userId.userId + '/products/' + productId )
            .auth( token, { type: 'bearer' } )
            .send( updatedTestProduct )
            .end( ( err, res ) => {
                res.should.have.status( 200 );
                res.body.should.be.a( 'object' );
                done();
        });
    });

    it( 'Should fail updating product due invalid userId', ( done ) => {
        chai.request( index )
            .put( '/users/' + "userId.userId" + '/products/' + productId )
            .auth( token, { type: 'bearer' } )
            .send( updatedTestProduct )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                done();
        });
    });

    it( 'Should fail updating product due invalid productId', ( done ) => {
        chai.request( index )
            .put( '/users/' + userId.userId + '/products/' + "productId" )
            .auth( token, { type: 'bearer' } )
            .send( updatedTestProduct )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                done();
        });
    });

    it( 'Should get products owned by userID', ( done ) => {
        chai.request( index )
            .get( '/users/' + userId.userId + '/products' )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {
                res.should.have.status( 200 );
                res.body.should.be.a( 'array' );
                done();
        });
    });

    it( 'Should fail get products owned by userID due wron userID', ( done ) => {
        chai.request( index )
            .get( '/users/' + "userId.userId" + '/products' )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                done();
        });
    });

    it( 'Should fail to delete product due invalid userId', ( done ) => {
        chai.request( index )
            .delete( '/users/' + "userId.userId" + '/products/' + productId )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                done();
        });
    });

    it( 'Should fail to delete product due invalid productId', ( done ) => {
        chai.request( index )
            .delete( '/users/' + "userId.userId" + '/products/' + productId )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                done();
        });
    });

    it( 'Should delete product using userID and productID', ( done ) => {
        chai.request( index )
            .delete( '/users/' + userId.userId + '/products/' + productId )
            .auth( token, { type: 'bearer' } )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                done();
        });
    });
});


describe( 'Testing image upload to Cloudinary using multer and JWToken.', () => {

    it( 'Should fail to add a new user because user with same email and username already exists', ( done ) => {
        chai.request( index )
            .post( '/users' )
            .send( testUser )
            .end( ( err, res ) => {
                res.should.have.status( 409 );
                res.body.should.be.a( 'object' );
                //userId = res.body;
                done();
        });
    });

    it( 'Should succeed and get token from /login', ( done ) => {
        chai.request( index )
            .post( "/login" )
            .auth( loginUser.username, loginUser.password )
            .end( ( err, res ) => {
                expect( res ).to.have.status( 200 )
                expect( res.body ).to.have.property( 'token' );
                token = res.body.token;
                done();
        });
    });

    it( "Should create a valid product", (done) => {
        chai.request( index )
            .post( "/users/" + userId.userId + "/products" )
            .auth( token, { type: 'bearer' } )
            .send( testProduct )
            .end( ( err, res ) => {
                res.should.have.status( 201 );
                res.body.should.be.a( "object" );
                city = res.body.location.city;
                dateCreated = res.body.creationDate;
                category = res.body.category;
                productId = res.body._id;
                done();
        });
    });

    it( 'Should send image file to product update', ( done ) => { 
        chai.request( index )
            .post( '/products/' + productId + '/images' )
            .auth( token, { type: 'bearer' } )
            .attach( 'image', imagePath )
            .end( ( err, res ) => {
                res.should.have.status( 200 );
                res.body.should.have.property( 'picture' )
                done();
        });
    });

    it( 'Should send image but fails because image field is empty', ( done ) => { 
        chai.request( index )
            .post( '/products/' + productId + '/images' )
            .auth( token, { type: 'bearer' } )
            .attach( 'image', "" )
            .end( ( err, res ) => {
                res.should.have.status( 400 );
                done();
        });
    });

    it( 'Should send image but fails because productID is wrong', ( done ) => { 
        chai.request( index )
            .post( '/products/' + "productId" + '/images' )
            .auth( token, { type: 'bearer' } )
            .attach( 'image', imagePath )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                done();
        });
    });

    it( 'Should send image but fails because form id is not "image"', ( done ) => { 
        chai.request( index )
            .post( '/products/' + productId + '/images' )
            .auth( token, { type: 'bearer' } )
            .attach( 'picture', imagePath )
            .end( ( err, res ) => {
                res.should.have.status( 404 );
                console.log( err )
                done();
        });
    });

});

