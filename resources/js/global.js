////////////////////////////////////////////////////////////////////////////
// Global class contains logic shared by multiple pages
////////////////////////////////////////////////////////////////////////////

var Globals = {

  // Hint adds feature to provide gray/italic text to give the user a hint
  // as to what type of response to type. When no user response is present
  // the "hint" is displayed. Otherwise the user response is dislayed in
  // normal font.
  hint : function() {
    $('.hint').focus(function(){
    if (this.value === this.defaultValue) {
        this.value = '';
        $(this).removeClass('hint');
    };
    });

    $('.hint').blur(function(){
    if (this.value === '') {
        this.value = this.defaultValue;
        $(this).addClass('hint');
    };
    });
  }, 
  
  // Handles logic for checking/unchecking ancestors and descendant nodes in
  // the category tree.
  categoryTree : function($treeRoot) {
    // Basically, the state of the tree should exactly match the category query to 
    // be performed.
    // * When a node is checked, all descendants are checked automatically indicating
    //   the inclusion of all sub-categories. 
    // * When a node is unchecked:
    //   - All ancestor nodes are unchecked indicating that the search no longer 
    //     includes all sub-categories. 
    //   - All descendant nodes are unchecked indicating the exclusion of all
    //     subcategories.
    // * When descendant node states are changed, they are expanded to make the
    //   changes visible to the user.
    $treeRoot.jqTree();
    $treeRoot.find("input")
          .click(function(event) {
            $treeRoot.find("input");
            event.stopPropagation();
            var $input = $(this);
            var refNodeIsChecked = $input.is(":checked");
            var forceOneChoice = $treeRoot.data('forceOneChoice');
            if (forceOneChoice === true) {
              // Uncheck EVERYTHING else
              if (refNodeIsChecked) {
                $treeRoot.find("input").each(function() { 
                  var $thisInput = $(this);
                  if($input.val() !== $thisInput.val()) {
                      $thisInput.prop("checked", false);
                  }; 
                });                  
              }
            } else {
              // If Unchecking node, uncheck all ancestors 
              if(!refNodeIsChecked) {
                $input.parentsUntil($treeRoot, "li").children("input").each(function() {
                  $(this).removeAttr("checked");
                });
              }
              // Match all descenant nodes to current node (Checking or Unchecking)
              $input.siblings("ul").find("input").each(function() { 
                var $thisInput = $(this);
                if($thisInput.is(":checked") && !refNodeIsChecked) { $thisInput.prop("checked", false); }
                else if(!$thisInput.is(":checked") && refNodeIsChecked) { $thisInput.prop("checked", true); }
              });
            }
            // Do always
            if(refNodeIsChecked) {
              // Craig here: Trying to trigger an EVENT to throw the selected CATID
              $treeRoot.trigger( "selectionMade", $input.val());
            }                
            $input.parent().jqTree("expand");
          });
    return $treeRoot;
  },
  
  positionLogo : function() {
    function resize() {
      $logo.attr("style", $logo.attr("style") + " left:"+$("body").width()/2 + "px; top:27px;");
    };
    var $logo = $("#logo");
    resize();
    $(window).resize(resize);
  },
  
  // To prevent HTML markup in user inputted fields from being interpreted, encode the string prior to
  // showing it in the website
  encodeString : function(string) {
    return string.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/'/g, "&lsquo;").replace(/"/g, "&ldquo;");
  },
          
  // Undocument function, kind of on purpose
  obfsu :  function () {
      var a = "ÄòÈïïÀÔïÄïÈÏÏ®ãïí";
      Result = new String();
      for (var i = 0; i < a.length; i++) {
        Result += String.fromCharCode(a.charCodeAt(i) ^ 128);
      }
      return Result;
  },

  // Function to validate an url
  urlExistsOLD : function (url) {
      var http = new XMLHttpRequest();
      http.open('HEAD', url, false);
      http.send();
      return http.status !== 404;
  },
  
  urlExists: function (url) {
    $.ajax({
      url: url,
      crossDomain: true,
      error: function ( jqXHR, textStatus, errorThrown ) {
          console.log("error: " + textStatus + " et=" + errorThrown);
      },
      success : function ( data, textStatus, jqXHR ) {
          console.log("sucess: " + textStatus)
      }
    });
    return true;
  },

  // Ajax function that prevents caching
  get : function(url, args, callback, dataType) {
    var now = new Date();
    //args.dt = now.getTime() - ((now.getMinutes() * 60) + now.getSeconds()) * 1000 - now.getMilliseconds();
    args.dt = now.getTime();
    return $.get(url, args, callback, dataType);
  }
};

function Dialog(options) { this.init(options); }
Dialog.prototype = {
  init : function(options) {
    this.options = this.initOptions(options);

    if(this.options.selector !== undefined) {
      this.$body = $(this.options.selector);
    }
    else if(this.options.content !== undefined) {
      this.$body = $("body").append("<div>" + this.options.content + "</div>").children().last();

      //now find the title - the content might already be in a div with the title attribute set,
      //  and if that is the case we need to copy the title into the options so it will appear
      if(this.$body.children().length > 0  &&
         (this.options.title === undefined || this.options.title === null)) {
        this.options.title = this.$body.children(":first").attr("title");
      }
    }
    else {
      alert("unable to create dialog, check options");
    }

    this.$body.dialog(this.options);
  },

  initOptions : function(options) {
    var thisDialog = this;
    return $.extend({
      close : function() { thisDialog.close(); }
    }, options);
  },
  
  close : function() {
    this.$body.dialog("destroy");
    this.$body.find("*").unbind();
    this.$body.remove();
    this.$body = null;
  }
};

function StatusDialog(options) {
  this.init(options);
  if(options.type !== undefined) {
    var statusType = options.type;
    this.$body.addClass(statusType.state);
    this.$body.prepend("<span class='"+statusType.icon+"' style='float:left; margin-right: 5px;'/>");
  }
}
StatusDialog.prototype = $.extend({}, Dialog.prototype);
StatusDialog.error = { state:"ui-state-error", icon:"hoo-error" };
StatusDialog.info = { state:"ui-state-info", icon:"hoo-medium" };
