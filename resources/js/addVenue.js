
var AddVenue = {
  venueLatLng : undefined
};


/*
  Object: VenueSummaryStep
  Extends: WizardStep located in wizard.js
  
  Defines the first wizard step for adding venue
 */
  function VenueSummaryStep() { this.init("venue-summary"); }

  VenueSummaryStep.prototype = $.extend({},WizardStep.prototype, {
      errorMsg : "",

      isValid : function() {
        // Clear hints
        this.step.find(".hint").each(function() {
          if (this.value === this.defaultValue) {
            this.value = "";
            $(this).removeClass('hint');
          }
        });
        // Trim fields
        this.step.find(":input").each(function() {
          this.value = $.trim(this.value);
        });
        // Require Venue Name; VARCHAR(60).
        if (!this.step.find("#venue-name").val().length > 0) {
          this.errorMsg = "Venue Name is required.";
          return false;
        }
        // Require Category
        if (/no-selection/.test(this.step.find("select#venue-type").val())) {
          this.errorMsg = "You must select a Venue Type.";
          return false;
        }
        
        var zipcode = this.step.find("input#venue-zipcode").val();
        if(zipcode.length === 0 &&
           (this.step.find("select#venue-state").val().length === 0 ||
            this.step.find("input#venue-city").val().length === 0)) {
          this.errorMsg = "Please provide the Zip Code; or City and State";
          return false;
        }
        else {
          if(zipcode.length > 0 && !/^\d{5}$/.test(zipcode)) {
            this.errorMsg = "The Zip Code must be 5 numbers";
            return false;
          }
        }
        
        // Validate venue url
        if ($("#venue-url").val().length > 0) {
          if (!Globals.urlExists($("#venue-url").val())) {
              this.errorMsg = "Your venue web address is not valid. Remove it, or provide a valid one.";
              return false;
          }
        }
        
        // Validate logo url
        if ($("#venue-logo").val().length > 0) {
          if (!Globals.urlExists($("#venue-logo").val())) {
              this.errorMsg = "Your venue logo address is not valid. Remove it, or provide a valid one.";
              return false;
          }
        }
        
        // Handle Valid Step
        return true;
        },

      showInvalidMessage : function() {
        new StatusDialog({
          content : this.errorMsg,
          title : "Error adding Venue",
          modal : true,
          type : StatusDialog.error
        });
        this.errorMsg = "";
      }

    }
  );
/*
  End VenueSummaryStep
 */


/*
  Object: VenueMapStep
  Extends: WizardStep located in wizard.js
  
  Defines the second wizard step for adding venue
 */ 
  function VenueMapStep() { this.init("map-location"); }

  VenueMapStep.prototype = $.extend({},WizardStep.prototype, {
      stepShown : function () {
        var poAddress = $( "#venue-address-1" ).val() + " " +
                    $( "#venue-address-2" ).val() + " " +
                    $( "#venue-city" ).val() + ", " +
                    $( "#venue-state" ).val() + " " +
                    $( "#venue-zipcode" ).val();
        // First time here, initialize map
        if (!this.map) {
            var mapOptions = {
            geoLocOrAddress : {address : poAddress},
            dragableMarkerCallback : this.handleMarkerDrag,
            mapType : "hybrid",
            queryCallback : this.handleMapIdle
          };
          this.map = new Map($("#map-loc-div")[0],mapOptions);
          this.prevAddress = poAddress;
        } else {
          // If coming from Summary page, move if poAddress changes
          if (poAddress !== this.prevAddress) {
            // Clear Venue Lat/Lng so it can be reset by map idle callback
            AddVenue.venueLatLng = undefined;
            this.map.moveToAddress(poAddress);
            this.prevAddress = poAddress;
          }
          google.maps.event.trigger(this.map, 'resize');
        }
      },
      
      handleMarkerDrag : function(retLoc) {
        AddVenue.venueLatLng = retLoc;
      },

      // Handle map idle, need to initialize Venue lat/lng
      handleMapIdle : function (bounds, center) {
        if (AddVenue.venueLatLng === undefined) {
          AddVenue.venueLatLng = center;
        }
      }
    }
  );
/*
  End VenueMapStep
 */


 function VenueAddPersistentActivity() { this.init("activity"); }
  VenueAddPersistentActivity.prototype = $.extend({},WizardStep.prototype, {
    init : function (id) {
      WizardStep.prototype.init.call(this, id);
      var thisObj = this;
      this.step.find(".add-activity").button().click(function() { thisObj.addActivity(this); }); 
      this.step.find(".remove-activity").button().click(function() { thisObj.removeActivity(this); });
    },

    addActivity : function () {
      var thisObj = this;
      var ul = this.step.find(".content ul.activities");
      if(ul.children().length < 10) {
        if(!this.isValid(true)) {
          new StatusDialog({
            content : thisObj.errorMsg,
            title : "Add Venue Error",
            modal : true,
            type : StatusDialog.error
          });
          return;
        }
        var existingButtons = ul.find(".remove-activity").button("destroy");
        ul.append(ul.children(":first").clone());
        ul.find(".remove-activity:last").button().click(function() { thisObj.removeActivity(this); });
        existingButtons.button();
      }
      else {
        new StatusDialog({
          content : "You can only add 10 persistent Activities.",
          title : "Too Many Activities",
          modal : true,
          type : StatusDialog.info
        });
      }
      
    },
     
    removeActivity : function(button) {
      var $button = $(button);
      if($button.parent().parent().children().length > 1) {
        $button.parent().find("*").unbind();
        $button.parent().remove();
      }
      else {
        new StatusDialog({
          content : "Ouch! Quit it!",
          title : "Cannot delete this option",
          modal : true,
          type : StatusDialog.info
        });
      }
    },
     
    isValid : function(testEmptyLast) {
      var isValid = true;
      var thisObj = this;
      var venueList = new Array();
      var theOption;
      var lastIdx = this.step.find(".content ul select").length - 1;
      this.step.find(".content ul select").each(function(idx) {
        theOption = $(this).find("option:selected");
        lastOption = theOption;
        if (venueList[theOption.text()] === undefined ) {
          venueList[theOption.text()] = 1;
        } else {
          thisObj.errorMsg = theOption.text() + " is already added.";;
          isValid = false;
          return false;
        }
        // If allowEmptyLast (i.e. User pressed NEXT), then allow
        // last Activity to be unselected
        if(!testEmptyLast && idx === lastIdx) { 
          return;
        }
        if(/no-selection/.test(theOption.val())) {
          isValid = false;
          thisObj.errorMsg = "All activities must have a value.";
          isValid = false;
          return false;
        }
      });
       
      return isValid;
    }
  });
 
 /*
  Object: VenueReviewStep
  Extends: WizardStep located in wizard.js
  
  Defines the third wizard step for adding venue
 */ 
  function VenueReviewStep() { this.init("review"); }

  VenueReviewStep.prototype = $.extend({},WizardStep.prototype, {

      // Handle This Step being Shown
      stepShown : function () {
        // First time here, initialize map
        if (!this.map) {
            var venueDivHtml = this.getVenueDivHtml();
            var mapOptions = {
            geoLocOrAddress : {latLng : AddVenue.venueLatLng},
            initZoom : 16,
            mapType : "hybrid",
            staticMarker : true,
            staticMarkerInfoWindowContent : venueDivHtml
          };
          this.map = new Map($("#map-review-div")[0],mapOptions);
          this.prevVenueLatLng = AddVenue.venueLatLng;
          this.prevVenueDivHtml = venueDivHtml;
        } else {
          // When returning here...
          // If Summary info changed, redraw infoWindow
          var venueDivHtml = this.getVenueDivHtml();
          if (venueDivHtml !== this.prevVenueDivHtml) {
            this.map.redrawStaticMarkerInfoWindow(venueDivHtml);
            this.prevVenueDivHtml = venueDivHtml;
          }
          // if Venue Lat/Lng changed, move
          if (AddVenue.venueLatLng !== this.prevVenueLatLng) {
            this.map.moveToLatLng(AddVenue.venueLatLng);
            this.prevVenueLatLng = AddVenue.venueLatLng;
          }
          google.maps.event.trigger(this.map, 'resize');
        }
      },
      
      // Handle Save button
      save : function () {
        var theOption;
        var perActList;
        perActList = "";
        // Build String of Persistent Activities
        $('#activity').find(".content ul select").each(function() {
          theOption = $(this).find("option:selected");
          if(! /no-selection/.test(theOption.val())) {
            console.log(theOption.text());
            console.log(theOption.val());
            if (perActList !== "") {perActList += ",";};
            perActList += theOption.val();
          }
        });
        console.log(perActList);
        // TODO: Replace admin with member name
        // TODO: Check Results (JSON); give feedback to the user.
        Globals.get("/resources/php/reDirect.php",
                { model        : "save-new-venue",
                  name         : Globals.encodeString($("#venue-name").val()),
                  address_1    : Globals.encodeString($("#venue-address-1").val()),
                  address_2    : Globals.encodeString($("#venue-address-2").val()),
                  city         : Globals.encodeString($("#venue-city").val()),
                  state        : Globals.encodeString($("#venue-state").val()),
                  zipcode      : Globals.encodeString($("#venue-zipcode").val()),
                  phone        : Globals.encodeString($("#venue-phone").val()),
                  website_url  : Globals.encodeString($("#venue-url").val()),
                  logo_url     : Globals.encodeString($("#venue-logo").val()),
                  description  : Globals.encodeString($("#venue-description").val()),
                  lat          : parseFloat((Math.round(AddVenue.venueLatLng.lat() * 1000) / 1000).toFixed(3)),
                  lng          : parseFloat((Math.round(AddVenue.venueLatLng.lng() * 1000) / 1000).toFixed(3)),
                  type         : $("#venue-type").val(),
                  per_act_list : Globals.encodeString(perActList),
                  member_owner : 'admin'
                },
                function(data) {
          if(/success/.test(data.results)) {
            new StatusDialog({
              content : 'Congratulations, your venue has been saved, what do you want to do now?',
              title : "Venue Saved",
              modal : true,
              width : 350,
              height : 200,
              type : { state:"ui-state-info", icon:"hoo-medium" },
              buttons : {
                "New Venue" : function() {
                  $(this).dialog("close");
                  window.location.href = window.location.protocol + '//' + window.location.hostname + "/addVenue.html";
                },
                "Add another Event" : function() { $(this).dialog("close"); },
                "Main Page" : function() {
                  $(this).dialog("close");
                  window.location.href = window.location.protocol + '//' + window.location.hostname;
                }
              }
            });
          }
          else {
            new StatusDialog({
              content : 'Oh no, we suck again',
              title : "Venue Not Saved",
              modal : true,
              type : { state:"ui-state-error", icon:"hoo-medium" },
              buttons : {
                "Close" : function() {
                  $(this).dialog("close");
                }
              }
            });
          }
        });

      },

      // Function to build HTML DIV to show in Review tab info Window
      getVenueDivHtml : function  () {
        var html = [];
        html.push("<div class='map-popup'>");
        html.push('<div class="ui-helper-clearfix">');
        if ($("#venue-logo").val() !== "") {
          html.push('<div style="float:left; margin-right:5px; ">');
          html.push('<img id="review-venue-logo" stlye="margin:4px;" src="'+Globals.encodeString($("#venue-logo").val())+'"/>');
          html.push('</div>');
        }
        
        //venue information
        html.push('<div style="float:left;">');
        html.push('<h3 style="text-align:center; font-weight:bold;">'+Globals.encodeString($("#venue-name").val())+'</h3>');
        html.push('<div>'+Globals.encodeString($("#venue-address-1").val())+'</div>');
        html.push('<div>'+Globals.encodeString($("#venue-address-2").val())+'</div>');
        html.push('<div>'+Globals.encodeString($("#venue-city").val()));
        if ($("#venue-state").val() !== "") {
          html.push(', '+Globals.encodeString($("#venue-state").val()));
        }
        html.push(' '+Globals.encodeString($("#venue-zipcode").val())+'</div>');
        html.push('<div>'+Globals.encodeString($("#venue-phone").val())+'</div>');
        html.push('</div>');
        
        html.push('</div>');  //closes div.ui-helper-clearfix

        html.push('<div style="border-top:1px solid black; padding-top:5px; margin-top:5px; white-space:pre-wrap;">');
        html.push(Globals.encodeString($("#venue-description").val()));
        html.push('</div>');
        
        html.push('</div>');
        return html.join("");
      }
      
    }
  );
/*
  End VenueReviewStep
 */
 
 

 
$(function () {
  var stepAry = [new VenueSummaryStep(), new VenueMapStep(), new VenueAddPersistentActivity(), new VenueReviewStep()];
  var addVenueWizard = new Wizard(stepAry);
  $("#venue-phone").mask("(999) 999-9999");
  Globals.hint();
  Globals.categoryTree($("#categories"));
  Globals.positionLogo();
  });