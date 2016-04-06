
var AddEvent = {
  venueLatLng : undefined,
  venueName : undefined,
  venueId : undefined,
  eventDate : undefined,
  startTime : undefined,
  endTime : undefined,
  category : undefined,
  description : undefined,
  eventUrl : undefined,
  performerID : undefined,
  performerName : undefined,
  
  venueSelected : function(theVenueName, theVenueId, theLat, theLng) {
    AddEvent.venueName = theVenueName;
    AddEvent.venueId = theVenueId;
    AddEvent.venueLatLng = {lat: theLat, lng: theLng};
    console.log("addEvent venue name: " + AddEvent.venueName);
    AddEvent.wizard.next();
  }
};

/*
  Object: FindVenueMapStep
  Extends: WizardStep located in wizard.js
  
  Defines the second wizard step for adding venue
 */ 

  function FindVenueMapStep() {
    this.init("map-location");
    var thisStep = this;
    this.step.find("#Search").click(function() { thisStep.searchVenues(); });
    this.step.find("#venue-name,#location").keypress(function(e) {
      if(e.which === 13) { thisStep.searchVenues(); }
    });
  }

  FindVenueMapStep.prototype = $.extend({},WizardStep.prototype, {
      stepShown : function () {
        var thisStep = this;
        var poAddress = 32935;
        // First time here, initialize map
        if (!this.map) {
            var mapOptions = {
            //geoLocOrAddress : {address : poAddress},
            mapType : "hybrid",
            queryCallback : function() { thisStep.handleMapIdle() }
          };
          this.map = new Map(this.step.find("#find-venue-map")[0], mapOptions);
          this.prevAddress = poAddress;
        } else {
          // If coming from Summary page, move if poAddress changes
          if (poAddress !== this.prevAddress) {
            // Clear Venue Lat/Lng so it can be reset by map idle callback
            AddEvent.venueLatLng = undefined;
            this.map.moveToAddress(poAddress);
            this.prevAddress = poAddress;
          }
          google.maps.event.trigger(this.map, 'resize');
        }
      },

      // Handle map idle, need to initialize Venue lat/lng
      handleMapIdle : function (bounds, center) {
        if (AddEvent.venueLatLng === undefined) {
          AddEvent.venueLatLng = center;
        }
        this.performNameLookup();
      },
              
      searchVenues : function() {
        var $venueName = this.step.find("#venue-name");
        var $location = this.step.find("#location");
        
        if(($venueName.val().length === 0 || $venueName.is(".hint")) &&
           ($location.val().length === 0 || $location.is(".hint"))) { return; }
        
        if($location.val().length > 0 && !$location.is(".hint")) { this.map.moveToAddress($location.val()); }
        
        this.performNameLookup();
      },
              
      performNameLookup : function() {
        var venueName = this.step.find("#venue-name").val();
        if(venueName.length > 0) {
          var thisStep = this;
          VenueMarkers.searchMarkers(this.map.map, 0, venueName, function (markersArray) {
            thisStep.map.setMarkers(markersArray);
          });
        }
      },
      
      isValid : function() {
          /* Check for venue selection! */
          if (AddEvent.venueName === undefined) {
             AddEvent.errorMsg = "Select a venue first!";
             AddEvent.errorTitle = "Venue Error";
             return false;
          } else {
             return true;
          }
      },
  
      getInvalidMessageContent: function() { return AddEvent.errorMsg; },
      getInvalidMessageTitle: function() { return AddEvent.errorTitle; }
  });
/*
  End FindVenueMapStep
 */

function SetDateTimeStep() {
    this.init("event-date-time");
}

SetDateTimeStep.prototype = $.extend({},WizardStep.prototype, {
      stepShown : function () {
         $("#venueName").html(AddEvent.venueName);
      },
      isValid : function() {
          /* Check for venue selection! */
          if ( AddEvent.eventDate  === undefined ) {
             AddEvent.errorMsg = "Select an Event DATE first! (Click on a date in the calendar)";
             AddEvent.errorTitle = "Event Date Error";
             return false;
          }
          if ( AddEvent.startTime  === undefined ) {
             AddEvent.errorMsg = "Select an Event START TIME first! (Click on the Start Date Text box)";
             AddEvent.errorTitle = "Event Start Time Error";
             return false;              
          }
          // END TIME is not REQUIRED (and MAY be BEFORE start time [eg. 9pm to 2am])
          return true;
      },

      getInvalidMessageContent: function() { return AddEvent.errorMsg; },
      getInvalidMessageTitle: function() { return AddEvent.errorTitle; }
});

function DefineEventStep() {
    this.init("event-cat-desc");
}

DefineEventStep.prototype = $.extend({},WizardStep.prototype, {
      stepShown : function () {
      },
      isValid : function() {
          /* Check for venue selection! */
          if ( AddEvent.category === undefined ) {
             AddEvent.errorMsg = "Select an Event CATEGORY first! (Click on a category using the Category Selection Tree)";
             AddEvent.errorTitle = "Event Category Error";
             return false;
          }
          if ( AddEvent.description === undefined ) {
             AddEvent.errorMsg = "Type an Event DECRIPTION first!";
             AddEvent.errorTitle = "Event Description Error";
             return false;
          }
          AddEvent.description = AddEvent.description.trim();
          if ( AddEvent.description.length > 80 ) {
             AddEvent.errorMsg = "Event DECRIPTION cannot be more than 80 characters!";
             AddEvent.errorTitle = "Event Description Error";
             return false;
          }
          return true;
      },

    // Handle Save button
      save_NA : function () {
        
        // TODO: Replace admin with member name
        Globals.get("/resources/php/reDirect.php",
                { model        : "save-new-event",
                  name         : Globals.encodeString(AddEvent.description),
                  venue_id     : AddEvent.venueId,
                  performer_id : AddEvent.performerID,
                  date         : AddEvent.eventDate,
                  time         : AddEvent.startTime + " - " + AddEvent.endTime,
                  persistent   : false,
                  cat_id       : AddEvent.category,
                  member_owner : 'admin'
                },
                function(data) {
          if(/success/.test(data.results)) {
            new StatusDialog({
              content : 'Congratulations, your event has been saved, what do you want to do now?',
              title : "Event Saved",
              modal : true,
              width : 350,
              height : 200,
              type : { state:"ui-state-info", icon:"hoo-medium" },
              buttons : {
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
              title : "Event Not Saved",
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
      
      getInvalidMessageContent: function() { return AddEvent.errorMsg; },
      getInvalidMessageTitle: function() { return AddEvent.errorTitle; }
});

function ReviewEventStep() {
    this.init("review-event");
}

ReviewEventStep.prototype = $.extend({},WizardStep.prototype, {
      stepShown : function () {
        var thisStep = this;
        var poAddress = 32935;
        // First time here, initialize map
        if (this.map) {
            delete this.map;
        }
        if (!this.map) {
          var theHTML = EventMarkers.formatOneMarker(AddEvent.venueName , AddEvent.description, AddEvent.performerName , AddEvent.eventDate , AddEvent.startTime , AddEvent.endTime);
          var mapOptions = {
            //geoLocOrAddress : {address : poAddress},
            mapType : "hybrid",
            geoLocOrAddress: {latLng: new google.maps.LatLng(AddEvent.venueLatLng.lat, AddEvent.venueLatLng.lng)},
            staticMarker : true,
            staticMarkerInfoWindowContent : theHTML,
            miscGoogleMapOptions : {draggable: false, zoomControl: false, scrollwheel: false, disableDoubleClickZoom: true, mapTypeControl: false, streetViewControl: false}
          };
          this.map = new Map(this.step.find("#venue-review-map")[0], mapOptions);
          this.prevAddress = poAddress;
        } else {
          // If coming from Summary page, move if poAddress changes
          if (poAddress !== this.prevAddress) {
            // Clear Venue Lat/Lng so it can be reset by map idle callback
//            AddEvent.venueLatLng = undefined;
            this.map.moveToAddress(poAddress);
            this.prevAddress = poAddress;
          }
          google.maps.event.trigger(this.map, 'resize');
        }
      },
 
    isValid : function() {
          return true;
      },
      
      // Handle Save button
      save : function () {
        // Add Time
        var theTime = AddEvent.startTime;
        if (AddEvent.endTime !== "" && AddEvent.endTime !== undefined) {
          theTime += " - " + AddEvent.endTime;          
        }
        
        // TODO: Replace admin with member name
        Globals.get("/resources/php/reDirect.php",
                { model        : "save-new-event",
                  name         : Globals.encodeString(AddEvent.description),
                  venue_id     : AddEvent.venueId,
                  performer_id : AddEvent.performerID,
                  date         : AddEvent.eventDate,
                  time         : theTime,
                  persistent   : false,
                  cat_id       : AddEvent.category,
                  event_url    : AddEvent.eventUrl,
                  member_owner : 'admin'
                },
                function(data) {
          if(/success/.test(data.results)) {
            new StatusDialog({
              content : 'Congratulations, your event has been saved, what do you want to do now?',
              title : "Event Saved",
              modal : true,
              width : 350,
              height : 200,
              type : { state:"ui-state-info", icon:"hoo-medium" },
              buttons : {
                "Add another Event" : function() { $(this).dialog("close"); window.location.reload(true);},
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
              title : "Event Not Saved",
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
      
      getInvalidMessageContent: function() { return AddEvent.errorMsg; },
      getInvalidMessageTitle: function() { return AddEvent.errorTitle; }
});

$(function () {
  Globals.hint();
  Globals.positionLogo();
  var stepAry = [new FindVenueMapStep(),
                 new SetDateTimeStep(),
                 new DefineEventStep(),
                 new ReviewEventStep()
                 ];
  AddEvent.wizard = new Wizard(stepAry);
  // Initialize date picker
  $( "#event-date" ).datepicker({
      changeMonth: true,
      numberOfMonths: 1, 
      dateFormat: "yy-mm-dd",
      minDate: new Date(),
      onSelect: function( selectedDate ) {
        // If user made a selection
        if ($("#event-date").val() !== "" && $("event-date").val() !== "Invalid Date") {
            $("#selected-date").html("The event will be held on: " + $("#event-date").val());
            AddEvent.eventDate = $("#event-date").val();
        }
      }
  });
  // Initialize time pickers
  $( "#event-start-time" ).timepicker({
      scrollDefault: 'now'
  });
  $('#event-start-time').on('changeTime', function() {
          // If user made a selection
        if ($("#event-start-time").val() !== "" && $("#event-start-time").val() !== "Invalid Time") {
            $("#selected-start-time").html("The event will start at " + $("#event-start-time").val());
            AddEvent.startTime = $("#event-start-time").val();
        }
  });

  $( "#event-end-time" ).timepicker({
      scrollDefault: 'now'
  });
  $('#event-end-time').on('changeTime', function() {
          // If user made a selection
        if ($("#event-end-time").val() !== "") {
            $("#selected-end-time").html("The event will end at " + $("#event-end-time").val());
            AddEvent.endTime = $("#event-end-time").val();
        }
  });
  // initialize the jqTree
  var $jqTree = Globals.categoryTree($("#categories"));
  $jqTree.data('forceOneChoice', true);
  $jqTree.on('selectionMade',function(event, catID) {
      console.log("selectionMade " + catID);
      AddEvent.category = catID;
  });
  $( "#event-desc" ).change(function() {
    AddEvent.description = $( "#event-desc" ).val();
  $( "#event-url" ).change(function() {
    AddEvent.eventUrl = $( "#event-url" ).val();
  });  });
});

