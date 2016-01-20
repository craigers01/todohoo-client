
var AddEvent = {
  venueLatLng : undefined,
  
  venueSelected : function() {
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
      }
      
  });
/*
  End FindVenueMapStep
 */

function EnterEventStep() { this.init("venue-event"); }
EnterEventStep.prototype = $.extend({},WizardStep.prototype, {
  
});

$(function () {
  Globals.hint();
  Globals.positionLogo();
  var stepAry = [new FindVenueMapStep(),
                 new EnterEventStep()];
  AddEvent.wizard = new Wizard(stepAry);
});

