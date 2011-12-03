(function() {

  define( [ "utils" ], function( utils ) {
    var fallbackMedia = "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm";

    function Template ( root, layoutsDir ) {
      var manifest = utils.getJSON( layoutsDir + "/" + root + "/manifest.json" ),
          name = manifest.title || root,
          defaultMedia = manifest.defaultMedia || fallbackMedia,
          description = manifest.description || "No description available.",
          thumbnail = new Image();

      if ( manifest.thumbnail ) {
        thumbnail.src = layoutsDir + "/" + root + "/" + manifest.thumbnail;
      }
      var template = manifest.template || "index.html";
      Object.defineProperty( this, "title", { get: function() { return name; } });
      Object.defineProperty( this, "thumbnail", { get: function() { return thumbnail; } });
      Object.defineProperty( this, "template", { get: function() { return layoutsDir + "/" + root + "/" + template; } });
      Object.defineProperty( this, "root", { get: function() { return root; } } );
      Object.defineProperty( this, "defaultMedia", { get: function() { return defaultMedia; } } );
      Object.defineProperty( this, "description", { get: function() { return description; } } );
    } //Template

    function TemplateManager ( options ) {
      var templates = [],
          templateList = utils.getJSON( options.config ),
          mediaInputBox = document.getElementById( 'timeline-media-input-box' );

      for ( var i=0; i<templateList.length; ++i ) {
        templates.push( new Template( templateList[ i ], options.layoutsDir ) );
      } //for

      Object.defineProperty( this, "templates", { get: function() { return templates; } } );

      this.find = function( options ) {
        for ( var i=0; i<templates.length; ++i ) {
          if (  templates[ i ].title === options ||
                templates[ i ].title === options.title ||
                templates[ i ].template === options.template ||
                templates[ i ].root === options.root ) {
            return templates[ i ];
          } //if
        } //for
        return;
      }; //find

      var select = document.getElementById( options.container ),
          descriptionContainer = document.getElementById( options.description ),
          thumbnailContainer = $( "#template-thumbnail" );

      function showThumbnail( img ) {
        thumbnailContainer.html("");
        thumbnailContainer.append( $( img ) );
      } //showThumbnail

      showThumbnail( templates[ 0 ].thumbnail );

      function selectTemplate( template ) {
        showThumbnail( template.thumbnail );
        mediaInputBox.value = template.defaultMedia;
        if ( descriptionContainer ) {
          descriptionContainer.innerHTML = utils.getSafeString( template.description );
        } //if
      } //selectTemplate

      this.buildList = function() {
        function createOption( value, innerHTML ) {
          var option = document.createElement( 'option' );
          option.value = value;
          option.appendChild( document.createTextNode( utils.getSafeString( innerHTML ) ) );
          option.class = "ddprojects-option";
          return option;
        }

        for ( var i=0; i<templates.length; ++i ) {
          select.appendChild( createOption( templates[ i ].template, templates[ i ].title ) );
        }
        select.appendChild( createOption( "-1", "Other..." ) );
        
        $( "#template-other" ).hide();
        var otherOption = select.options[ select.options.length - 1 ],
            otherText = $( "#template-other" )[ 0 ];
        select.addEventListener( 'change', function( e ) {
          if ( select.selectedIndex === otherOption.index ) {
            $( "#template-other" ).show();
            if ( descriptionContainer ) {
              descriptionContainer.innerHTML = "";
            } //if
          }
          else {
            for ( var i=0; i<templates.length; ++i ) {
              if ( templates[ i ].template === select.options[ select.selectedIndex ].value ) {
                selectTemplate( templates[ i ] );
                break;
              }
            }
            $( "#template-other" ).hide();
          } //if
        }, false );
        otherText.addEventListener( 'change', function( e ) {
          otherOption.value = otherText.value;
        }, false );

        selectTemplate( templates[ 0 ] );
      }; //buildList

      this.init = function() {
      }; //init

    } //TemplateManager

    TemplateManager.Template = Template;

    return TemplateManager;

  }); //define

})();
