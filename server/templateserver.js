var PORT = 8888,
    RECAPTCHA_PUBLIC_KEY= "6Ld0hcUSAAAAAKMAdCZhi7Juv4nU6JsFIehmO83t",
    RECAPTCHA_PRIVATE_KEY = "6Ld0hcUSAAAAANT9Xhsrt608CgujtENLLAyLJT-N",
    RECAPTCHA_HTML = __dirname + "/templateserver-recaptcha.html",
    DOWNLOAD_HTML = __dirname + "/templateserver-download.html",
    LAYOUTS_DIR = __dirname + "/../layouts",
    TMP_DIR = __dirname + "/tmp",
    ZIP_TIMEOUT = 100000;

var express = require( 'express' ),
    recaptcha = require( 'recaptcha-async' ),
    fs = require( 'fs' ),
    path = require( 'path' ),
    zipper = require( 'zipper' ),
    template = require( 'template' );

// Delete all the old temp files
var tempFiles = fs.readdirSync( TMP_DIR )
for ( var i=0; i<tempFiles.length; ++i ) {
  fs.unlink( TMP_DIR + "/" + tempFiles[ i ] );
}

var preparedZips = [];

function addToZip( zipFile, dir, file, callback ) {
  zipFile.addFile( dir + "/" + file, file, callback );
} //zipFile

function checkZips( e ) {
  for ( var i=0; i<preparedZips.length; ++i ) {
    if ( Date.now() - preparedZips[ i ].time > ZIP_TIMEOUT ) {
      fs.unlink( TMP_DIR + "/" + preparedZips[ i ].fileName );
      preparedZips.splice( i, 1 );
    }
    else {
    }
  } //for
} //checkZips

function generateZip( zipFile, templateDir, files, callback ) {
  var numFiles = 0, i = -1;

  function add( err ) {
    if ( err ) {
      callback( err );
      return;
    }
    else {
      ++i;
      if ( i === files.length ) {
        callback();
      }
      else {
        addToZip( zipFile, templateDir, files[ i ], add );
      }
    }
  } //add
  add();
} //generateZip

fs.readFile( RECAPTCHA_HTML, "binary", function( err, file ) {  

  if(err) {  
    console.log( "ERROR: Couldn't open " + RECAPTCHA_HTML + "." );
    return;
  } 

  var app = express.createServer();

  app.all( '/captcha', function( request, response ) {

    var captcha = new recaptcha.reCaptcha();
    var hiddenInput = '<input name="butter_template" type="hidden" value="' + request.query.butter_template + '" />';

    if (  request.query && 
          request.query.recaptcha_challenge_field && 
          request.query.recaptcha_response_field && 
          request.query.butter_template ) {

      captcha.on( 'data', function( captchaResponse ) {
        if ( captchaResponse.is_valid ) {
          var templateDir = LAYOUTS_DIR + "/" + request.query.butter_template;

          path.exists( templateDir + "/manifest.json", function( exists ) {
            if ( exists ) {
              fs.readFile( templateDir + "/manifest.json", function( err, file ) {
                if ( !err ) {
                  var json = JSON.parse( "" + file ),
                      files = json.files,
                      fileName = preparedZips.length + ".zip";
                  var zipFile = new zipper.Zipper( TMP_DIR + "/" + fileName );
                  generateZip( zipFile, templateDir, files, function( err ) {
                    if ( err ) {
                      fs.unlink( TMP_DIR + "/" + fileName );
                      response.send( "ERROR: Could not create zip file." );
                    }
                    else {
                      preparedZips.push({time: Date.now(), fileName: fileName});
                      fs.readFile( TMP_DIR + "/" + fileName, function( err, file ) {
                        if ( err ) {
                          console.log( err );
                          response.send( "ERROR: Could not send file." );
                        }
                        else {
                          response.contentType( "application/zip" );
                          response.send( file );
                        }
                      });
                    } //if
                  });
                }
                else {
                  response.send( "ERROR: Could not read template manifest." );
                }
              });
            }
            else {
              response.send( "ERROR: Template " + templateDir + " does not exist" );
            }
          });
        }
        else {
          response.send( file.replace( "<captcha />", hiddenInput + captcha.getCaptchaHtml( RECAPTCHA_PUBLIC_KEY, captchaResponse.error ) ) );
        } //if
      });
      captcha.checkAnswer( RECAPTCHA_PRIVATE_KEY, request.connection.remoteAddress, request.query.recaptcha_challenge_field, request.query.recaptcha_response_field );
    }
    else {
      response.send( file.replace( "<captcha />", hiddenInput + captcha.getCaptchaHtml( RECAPTCHA_PUBLIC_KEY ) ) )
    }
  });

  app.get( '/', function( request, response, next ) {
    response.send( "Popcorn Maker Packaging Server v0.1" );
  });

  app.listen( 8888 );

  setInterval( checkZips, 1000 );
  
});


