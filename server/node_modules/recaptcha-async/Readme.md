
# reCaptcha
      
  Calling the reCaptcha server from within Node.JS and the handle the response.
  
     var recaptcha = new reCaptcha();

     recaptcha.on('data', function (res) {
       if(res.is_valid)
         html = "valid answer";
       else
         html = recaptcha.getCaptchaHtml(mypublickey, res.error);
     });

     recaptcha.checkAnswer(myprivatekey, 
                           req.connection.remoteAddress, 
                           req.body.recaptcha_challenge_field, 
                           req.body.recaptcha_response_field);

## Installation

    $ npm install recaptcha-async

or to access the recaptcha module install globally:

    $ npm install -g recaptcha-async


## Features

  * Querys the reCaptcha server from within Node.JS
  * Server response comes in asyncronously
  * Generates the reCaptcha-HTML to embed in a website

## Gettings your keys

  Go to http://www.google.com/recaptcha to get your recaptcha private-/publickeys.

## Authors

The following are the major authors of the reCaptcha Node.JS module.

  * Felix Gertz (https://github.com/aldipower)

## Node Compatibility

Module should be compatible with node 0.4.x

## License 

(The MIT License)

Copyright(c) 2011 Felix Gertz &lt;nihil.baxter.dev@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.