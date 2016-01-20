////////////////////////////////////////////////////////////////////////////
// searchMarkers is a static class that handles submitting a query to the 
// server and building an array of Venue markers from the result.
////////////////////////////////////////////////////////////////////////////

var VenueMarkers = {
  
  venueSelected : function(venueName, venueId) {
    console.log("venue name: " +venueName);
    console.log("venue id: " +venueId);
    AddEvent.venueSelected();
  },

  // Public function to retrieve markers for given search criteria
  searchMarkers : function(map, pageNum, searchString, markersCallback) {
    var markerCallback = function(data) {
        data = eval(data);
        if(data.length === 0) {
          if (pageNum > 0) {
            new StatusDialog({
              content : "You are at the last page.",
              title : "Last Page",
              modal : true,
              type : StatusDialog.info
            });
            pageNum = pageNum - 1;
          }
        }
        
        var markersArray = [];
        for(var i = 0; i < data.length; i++) {
          var marker = data[i];
          var googleMarker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(parseFloat(marker.lat),
                                             parseFloat(marker.lng)),
            icon: (VenueMarkers.venueIcons[marker.type] || {}).icon,
            shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
          });
          googleMarker.venueName = marker.venueName;
          googleMarker.venueId = marker.venueId;
          googleMarker.content = PopupBuilder.addEvent_Venue(marker.venueName, marker.description, marker.venueId);
        markersArray.push(googleMarker);
        }
        // Return Markers
        markersCallback(markersArray);        
      };

    Globals.get("/resources/php/reDirect.php",
                { model : "searchVenues",
                  startLat : map.getBounds().getSouthWest().lat(),
                  endLat : map.getBounds().getNorthEast().lat(),
                  startLng : map.getBounds().getSouthWest().lng(),
                  endLng : map.getBounds().getNorthEast().lng(),
                  page : pageNum,
                  searchString : searchString
                },
                markerCallback,
                "html");
  },

  // Associative array of Venue-type Icons
  venueIcons : {
    bar: {
      icon: '/resources/images/bar_pin.png'
    },
    Restaurant: {
      icon: '/resources/images/restaraunt_pin.png'
    }
  },

  // Associative array of Event-type Icons
  eventsIcons : {
    music: {
      icon: '/resources/images/music_pin.png'
    },
    other: {
      icon: 'http://labs.google.com/ridefinder/images/mm_20_red.png'
    }
  }
};