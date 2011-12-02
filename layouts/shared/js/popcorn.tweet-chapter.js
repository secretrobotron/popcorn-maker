// PLUGIN: tweetChapter
/*

todo: animate top, left and other styles (color, font size, etc.)

*/

(function (Popcorn) {

"use strict";

	var nop = {
		start: function() {},
		end: function() {}
	},
		styleSheet, script,
		tweetWindow,
		tweetWindowId;

	Popcorn.plugin( 'tweetChapter' , function(options) {
		var popcorn,
			video,
			target,
			container,
			textContainer,
			text, node, i,
			button,
			link, url;
		
		if (!options) {
			return nop;
		}

		if (!options.target || !options.text) {
			return nop;
		}

		popcorn = this;
		video = popcorn.media;

		target = options.target;

		if (typeof target === 'string') {

			target = document.getElementById(target);
			
			if (!target) {
				return nop;
			}
		}
		
		//default style our tweet buttons in a style sheet so they can be overridden
		if (!styleSheet) {
			styleSheet = document.createElement('style');
			styleSheet.setAttribute('type', 'text/css');
			styleSheet.appendChild(document.createTextNode('iframe.popcorn-tweet-chapter { width: 55px; height: 62px }\n'));
			document.head.appendChild(styleSheet);
		}
		
		container = document.createElement('div');
		if (options.style) {
			container.style.cssText = options.style;
		}

		i = options.top;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.top = i;
			container.style.position = 'absolute';
		}

		i = options.left;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.left = i;
			container.style.position = 'absolute';
		}
		
		i = options.right;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.right = i;
			container.style.position = 'absolute';
		}
		
		i = options.bottom;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.bottom = i;
			container.style.position = 'absolute';
		}
		
		container.style.display = 'none';
		if (options.classes) {
			if (options.classes.length && options.classes.join) {
				//an array works
				container.setAttribute('class', 'popcorn-tweet-chapter ' + options.classes.join(' '));
			} else {
				container.setAttribute('class', 'popcorn-tweet-chapter ' + options.classes.split(/,\s\n\r/).join(' '));
			}
		} else {
			container.setAttribute('class', 'popcorn-tweet-chapter');
		}
		
		url = options.link || window.location.protocol + '//' + window.location.host + window.location.pathname;
		if (!options.text) {
			options.text = '';
		}
		
		// how this works: https://dev.twitter.com/docs/tweet-button
		button = document.createElement('iframe');
		//button.setAttribute('src', 'http://twitter.com/share');
		//button.setAttribute('target', tweetWindowId);

		//formatting
		button.setAttribute('class', 'popcorn-tweet-chapter twitter-share-button');
		button.setAttribute('allowtransparency', 'true');
		button.setAttribute('frameborder', '0');
		button.setAttribute('scrolling', 'no');

		//data
		button.setAttribute('src', 'http://platform.twitter.com/widgets/tweet_button.html?url=' +
			encodeURIComponent(url + '#' + options.start) +
			'&text=' + encodeURIComponent(options.text) + 
			'&counturl=' + encodeURIComponent(url) + 
			'&count=vertical');
		button.addEventListener('click', function() {
			video.pause();
		}, false);

		options.button = button;
		container.appendChild(button);


		textContainer = document.createElement('p');
		textContainer.setAttribute('class', 'popcorn-tweet-chapter');

		link = document.createElement('a');
		link.setAttribute('href', 'http://twitter.com/share?url=' +
			encodeURIComponent(url + '#' + options.start) +
			'&text=' + encodeURIComponent(options.text) + 
			'&counturl=' + encodeURIComponent(url));
		link.setAttribute('target', tweetWindowId);
		link.addEventListener('click', function() {
			video.pause();
		}, false);

		text = options.text.split(/[\n\r]/);
		for (i = 0; i < text.length; i++) {
			if (i) {
				link.appendChild(document.createElement('br'));
			}
			link.appendChild(document.createTextNode(text[i]));
		}

		textContainer.appendChild(link);
		container.appendChild(textContainer);

		target.appendChild(container);
		options.container = container;

		//if event callbacks are strings, swap them out for functions
		(function() {
			var i, event, events = ['onLoad', 'onStart', 'onFrame', 'onEnd'];
			for (i = 0; i < events.length; i++) {
				event = events[i];
				if (options[event] && typeof options[event] === 'string') {
					if (window[ options[event] ] && typeof window[ options[event] ] === 'function') {
						options[event] = window[ options[event] ];
					}
				}
			}
		}());

		if (typeof options.onLoad === 'function') {
			options.onLoad(options);
		}

		return {
			start: function( event, options ) {
				if (options && options.container) {
					options.container.style.display = '';
				}

				if (typeof options.onStart === 'function') {
					try {
						options.onStart(options);
					} catch (e) {
					}
				}
			},
			frame: function(event, options, time){
				if (typeof options.onFrame === 'function') {
					try {
						options.onFrame(options, time);
					} catch (e) {
					}
				}
			},
			end: function( event, options ) {
				if (options && options.container) {
					options.container.style.display = 'none';
				}
				
				if (typeof options.onEnd === 'function') {
					try {
						options.onEnd(options);
					} catch (e) {
					}
				}
			},
			_teardown: function( options ) {
				if (options.container && options.container.parentNode) {
					options.container.parentNode.removeChild(options.container);
					container = null;
					delete options.container;
				}
			}
		};
	},
	{
		about: {
			name: 'Tweet Chapter',
			version: 0.1,
			author: 'Brian Chirls',
			website: 'http://chirls.com'
		},
		options: {
			start: {elem:'input', type:'text', label:'In'},
			end: {elem:'input', type:'text', label:'Out'},
			text: {
				elem:'input',
				type:'text',
				label:'Text'
			},
			link: {
				elem:'input',
				type:'text',
				label:'Link (URL)'
			},
			classes: {
				elem:'input',
				type:'text',
				label:'List of classes to apply to text container'
			},
			style: {
				elem:'input',
				type:'text',
				label:'CSS to apply to text'
			},
			top: {
				elem:'input',
				type:'number',
				label:'Top position'
			},
			left: {
				elem:'input',
				type:'number',
				label:'Left position'
			},
			bottom: {
				elem:'input',
				type:'number',
				label:'Bottom position'
			},
			right: {
				elem:'input',
				type:'number',
				label:'Right position'
			}/*,
			onSetup: {
				type: "function",
				label: "onSetup callback function"
			},
			onLoad: {
				type: "function",
				label: "onLoad callback function"
			},
			onStart: {
				type: "function",
				label: "onStart callback function"
			},
			onEnd: {
				type: "function",
				label: "onEnd callback function"
			},
			onFrame: {
				type: "function",
				label: "onFrame callback function"
			}*/
		}
	});
})( Popcorn );
