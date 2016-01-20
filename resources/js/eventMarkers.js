////////////////////////////////////////////////////////////////////////////
// eventMarkers is a static class that handles submitting a query to the 
// server and building an array of markers from the result.
////////////////////////////////////////////////////////////////////////////

var eventMarkers = {

  // Public function to retrieve markers for given search criteria
  searchMarkers : function(map, catList, fromDate, toDate, startLat, endLat, startLng, endLng, pageNum, markersCallback) {
    var me = this;
    var markersArray = []; // Local Copy
    var venueAry = [];
    
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
            return;
          } else {
            return;
          }
        }
            
        for(var i = 0; i < data.length; i++) {
          var marker = data[i];
          var html = "<hr/>";

          // Add Event Name
          if (marker.event_name.length > 0) {
            html += "<b>" + marker.event_name + "</b><br/>";
          }

          // Add Performner
          if (marker.performer_name !== "" && marker.event_format_id === 2) {
            html += "<b>Band:</b> " + marker.performer_name + "<br/>";
          }

          // For persistent eventsm reference Venue hours
          if (marker.persistent === 1) {
            html += "<b>Date/Time:</b> See Venue hours" + marker.date + "<br/>";
          }
          else {
            // Add Date
            if (marker.date.length > 0) {
              html += "<b>Date:</b> " + marker.date + "<br/>";
            }
            // Add Time
            if (marker.time.length > 0) {
              html += "<b>Time:</b> " + marker.time + "<br/>";
            }
          }

          // Add Venue to associative Array
          if (!(marker.venue_name in venueAry)) {
            venueAry[marker.venue_name] = {
              name : marker.venue_name,
              type : marker.type,
              position : new google.maps.LatLng(
                parseFloat(marker.lat),
                parseFloat(marker.lon)),
                html : "<div class='iWindow'><center><b>Venue:</b> " +  marker.venue_name + "</center>" + html
            };
          } else {
            // Append new Event
            venueAry[marker.venue_name].html += html;
          }
        }
          
        // Place Grouped Markers
        for (venue_name in venueAry) {
          theVenue=venueAry[venue_name];
          var icon = me.venueIcons[theVenue.type] || {};
          var marker = new google.maps.Marker({
            map: map,
            position: theVenue.position,
            icon: icon.icon,
            shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
          });
          marker.content = theVenue.html + "</div>"; // Saving so we can show all windows later?
          markersArray.push(marker);
          //Index.map.bindInfoWindow(marker, theVenue.html + "</div>");
        }
        
        // Return Markers
        markersCallback(markersArray);        
      };
    
    Globals.get("/resources/php/reDirect.php",
                { model : "search-model",
                  catList : catList,
                  fromDate : fromDate,
                  toDate : toDate,
                  startLat : startLat,
                  endLat : endLat,
                  startLng : startLng,
                  endLng : endLng,
                  page : pageNum
                },
                markerCallback,
                "html");
  },

  // Associative array of Venue-type Icons
  venueIcons : {
    bar: {
      icon: '/resources/images/bar_pin.png'
    },
    restaurant: {
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