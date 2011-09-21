  Insanely simple zipfile creator for node.js.

# Usage

    zipper = require('zipper').Zipper;

    zipper.addFile('myfile.txt', '/path/to/myfile.txt', function (err) {
        if (err) throw err;
        // Do stuff
    });

## Installation

  You can install the latest tag via npm:
  
    $ npm install zipper
  
  Or install from github master:
  
    $ git clone git://github.com/rubenv/zipper.git
    $ cd zipper
    $ ./configure
    $ make
    $ make install

## TODO

  Integrate back into node-zipfile. This was not done in the first place as we
  needed a fix fast.

## Credits

  Inspired by node-zipfile (written by Dane Springmeyer).
