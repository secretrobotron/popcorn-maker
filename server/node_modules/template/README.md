# node-template

A templating system for [node.js](http://nodejs.org) based on 
John Resig's [JavaScript Micro-Templating](http://ejohn.org/blog/javascript-micro-templating/).

Unlike that version (and [Chad Etzel's](http://github.com/jazzychad/template.node.js/)) this one preserves whitespace
allowing you to use blocks of (and inline) javascript and css in the page. It also has no problem with single quotes.

## Templates

Templates are just files with special <% %> tags (like PHP or Ruby tags) which will be replaced with passed-in data. 
Templates can also contain javascript code to be expanded.

### Example Template
    <html>
    <body>
     Hello, <%=name>.
    </body>
    </html>

### Example Template with javascript
    <html>
    <body>
    <% for (var i = 0; i < arr.length; i++) { %>
        The value of arr[<%=i%>] is <%=arr[i]%> <br/>
    <% } %>
    </body>
    </html>

## Usage

There are plenty of ways to use this:

### Simple Usage with a String
    sys.puts(template.create("Hello <%=word%>!", {word:"world"}));
    
### Save the Template for Later
    var t = template.create("Hello <%=word%>!");
    sys.puts(t({word:"planet"}));
    
### Callbacks
    template.create("Hello <%=word%>!", {word:kitty"}, function(t) {
        sys.puts(t);
    });

## Todo

* Callbacks with non-processed templates.
* Cache by filename (not string).
* Auto-cache, reloads the cached file if a change is detected in the file. (This can be turned off on production.) 
    
## Other Info

You do not need to restart the node app to see the changes take effect. The reason is because it caches strings and
not files. This has the downside of filling memory with useless templates until you restart the app. 
This should be fixed in a future version together with auto-cache.
