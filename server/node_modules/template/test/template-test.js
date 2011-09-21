(function() {
    require.paths.unshift(__dirname + "/../lib");

    var sys = require('sys'),
        assert = require('assert'),
        template = require('template');

    var total_tests = 10;
    var tmpl, fn, pending_callbacks = 0;

    function expect_callback() {
        pending_callbacks += 1;
    }

    function receive_callback() {
        pending_callbacks -= 1;
    }


    sys.puts("Running tests...");

    ////
    // Test 1: Simple synchronous string without code.
    sys.puts("Test 1 of " + total_tests + ": Simple string without code.");
    tmpl = template.create("Hai! I'm using templates!", {});
    assert.equal(tmpl, "Hai! I'm using templates!");

    ////
    // Test 2: Simple synchronous string with code, no objects.
    sys.puts("Test 2 of " + total_tests + ": Simple string with code, no objects.");
    tmpl = template.create("Hai! I'm using <%= 'templates' %>!", {});
    assert.equal(tmpl, "Hai! I'm using templates!");

    ////
    // Test 3: Variation of Test 2 with double quotes.
    sys.puts("Test 3 of " + total_tests + ": Variation of Test 2 with double quotes.");
    tmpl = template.create("Hai! I'm using <%=\"templates\" %>!", {});
    assert.equal(tmpl, "Hai! I'm using templates!");

    ////
    // Test 4: Simple synchronous string with code and with an object.
    sys.puts("Test 4 of " + total_tests + ": Simple synchronous string with code and with an object.");
    tmpl = template.create("Hai! I'm using <%=word%>!", {word:"templates"});
    assert.equal(tmpl, "Hai! I'm using templates!");

    ////
    // Test 5: Somewhat simple synchronous string with looping.
    sys.puts("Test 5 of " + total_tests + ": Somewhat simple synchronous string with looping.");
    tmpl = template.create("<% for (i=0;i<5;i++) { %><%=i%>, <% } %>", {});
    assert.equal(tmpl, "0, 1, 2, 3, 4, ");

    ////
    // Test 6: Variation of Test 5 with external variable.
    sys.puts("Test 6 of " + total_tests + ": Variation of Test 5 with external variable.");
    tmpl = template.create("<% for (i=0;i<count;i++) { %><%=i%>, <% } %>", {count: 3});
    assert.equal(tmpl, "0, 1, 2, ");

    ////
    // Test 7: Asynchronous variation of Test 6.
    expect_callback();
    sys.puts("Test 7 of " + total_tests + ": Asynchronous variation of Test 6.");
    template.create("<% for (i=0;i<count;i++) { %><%=i%>, <% } %>", {count: 3}, function(t) {
        receive_callback();
        assert.equal(t, "0, 1, 2, ");
    });

    ////
    // Test 8: Reading html template file synchronously.
    sys.puts("Test 8 of " + total_tests + ": Reading html template file synchronously.");
    tmpl = template.create("simple_html.tmpl", {title: "Awesome Title", body: "Awesome Body"});
    assert.equal(tmpl, "<html><head><title>Awesome Title</title></head><body>Awesome Body</body></html>");

    ////
    // Test 9: Reading html template file asynchronously.
    expect_callback();
    sys.puts("Test 9 of " + total_tests + ": Reading html template file asynchronously.");
    template.create("simple_html.tmpl", {title: "Asynchronous", body: "I love callbacks."}, function(t) {
        receive_callback();
        assert.equal(t, "<html><head><title>Asynchronous</title></head><body>I love callbacks.</body></html>");
    });

    ////
    // Test 10: Reading complex html file.
    expect_callback();
    sys.puts("Test 10 of " + total_tests + ": Reading complex html file.");
    template.create("complex_html.tmpl", {title: "Complex Test", body: "For loop:", count: 2, msg: false}, function(t) {
        receive_callback();
        assert.equal(t, "<html>\n    <head>\n        <title>Complex Test</title>\n        <script type=\"text/javascript\">\n        //<![CDATA[\n            var message = 'hello world!';\n        //]]>\n        </script>\n    </head>\n    <body>\n        For loop:\n        <br/>\n        <span>0,</span><span>1,</span>\n    </body>\n</html>\n");
    });

    // assert that all callbacks were called within the alloted time and exit
    setTimeout(function () {
        assert.equal(0, pending_callbacks, "Some callbacks didn't call.");
        sys.puts("Every test passed.");
        process.exit();
    }, 100);
}());
