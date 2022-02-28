const cloudinary = require( "cloudinary" );
// .env määrittykset
const dotenv = require( 'dotenv' );
dotenv.config();

// cloudinary määritykset
cloudinary.config( {
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploads = ( file, folder ) => {
    return new Promise( resolve => {
        cloudinary.uploader.upload( file, ( result ) => {
            resolve( {
                url: result.url,
                id: result.public_id
            });
        }, {
            resource_type: "auto",
            folder: folder
        });
    });
}