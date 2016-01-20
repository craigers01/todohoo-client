////////////////////////////////////////////////////////////////////////////
// Map Class. 
// Contains a Google.map. Abstracts our unique Map handling.
// 
// Input:
//   mapDiv: The HTML Div to attach the Google Map to
//   options: An array of options, as follows
//   options.queryCallback: Callback function that is called when the a map
//     movement/zoom/etc. occurs that extends beyond the previous query
//     extents. The callback function is where a re-query should occur.
//   options.geoLocOrAddress: Initial map center. Either a google.maps.LatLng
//     or string Postal address (any portion of an address).
//   options.dragableMarkerCallback: Callback function. If defined, it indicates
//     that a dragable marker should be placed on the center of the map
//     (e.g. Editing a Venue location on the map). The callback function
//     will be sent a google.maps.LatLng whenever the marker is moved.
//   options.markerClickedCallback: Callback function. If defined, it notifies
//     when a marker is clicked. Useful in selecting Venues from the map.
//   options.staticMarker: If provided a static (not draggable) marker
//     will be added to the map center. For any moveTo* calls the marker
//     will be recentered to the new center.
//   options.staticMarkerInfoWindowContent: If provided an infoWindow will
//     be added/shown for the static Marker.
//   options.initZoom: Inital Zoom level for the map
//   options.mapType: Map type to be shown (valid google.maps.MapTypeId)
//     "hybrid", "roadmap", "terrain", "satellite"
////////////////////////////////////////////////////////////////////////////

// Constructor
function Map(mapDiv, options) {
  var thisObj = this;
  this.mapDiv = mapDiv;
  this.markersArray = [];
  this.infoWindow = new google.maps.InfoWindow; 
  this.queryCallback = options.queryCallback;  
  this.dragableMarkerCallback = options.dragableMarkerCallback;
  this.markerClickedCallback = options.markerClickedCallback;
  this.makeStaticMarker = options.staticMarker;
  this.staticMarkerInfoWindowContent = options.staticMarkerInfoWindowContent;

  // Set initial Map zoom to options.zoom or defualt
  if (options.initZoom !== undefined) {
    this.initZoom = options.initZoom;
  } else {
    this.initZoom = 11;
  }

  // Set initial mapType to options.mapType or defualt
  if (options.mapType !== undefined) {
    this.mapType = options.mapType;
  } else {
    this.mapType = 'roadmap';
  }

  this.geocoder = new google.maps.Geocoder();  

  if(options.geoLocOrAddress === undefined) {
    thisObj.createGoogleMap(this.getDefaultCenter());
  }
  else {
    // Handle Geo-Loc address
    if  (options.geoLocOrAddress.latLng !== undefined) {
      // If geoLoc passed, instanceate map here, otherwise it will be instanceated when we get the
      // geocoder AJAX results
      this.createGoogleMap(options.geoLocOrAddress.latLng);
    }
    // Handle Postal address
    else if (options.geoLocOrAddress.address !== undefined) {
      // Get Geo loc, then init map via callback
      this.getGeoLoc(options.geoLocOrAddress.address, function(status, retLoc) {
        // TODO: Check status
        thisObj.createGoogleMap(retLoc);
      });
    }
    else {
      thisObj.createGoogleMap(this.getDefaultCenter());
    }
  }
  
}

Map.prototype = {

  // Private function to instanceate the Google Map
  createGoogleMap : function (initLatLng) {
      var thisObj = this;
      this.map = new google.maps.Map(this.mapDiv, {
        center: initLatLng,
        zoom: this.initZoom,
        mapTypeId: this.mapType
      });    
      google.maps.event.addListener(this.map, 'idle', function() {
        thisObj.idleHandler();
      });
      // Add draggable marker, if dragableMarkerCallback is passed
      if (this.dragableMarkerCallback) {
        this.addDragableMarker();
      }
      // If staticMarker is set, then add a staticMarker marker to the map center
      if (this.makeStaticMarker) {
        this.addStaticMarker();
      }
    },

  // Private function to handle Google.map's idle event. Handles firing of queryCallback
  idleHandler : function() {
    if(this.bounds === undefined) {
      this.bounds = { zoomLevel : this.map.getZoom() };
      this.setMapBounds();
      this.setQueryBounds();
      if(this.queryCallback !== undefined) { this.queryCallback(this.getBounds(), this.map.getCenter()); }
    }
    else {
      this.setMapBounds();
      if (this.mapMovedBeyondQueryExtents() && this.queryCallback !== undefined) {
        this.setQueryBounds();
        this.queryCallback(this.getBounds(), this.map.getCenter());
      }
    }
  },

  // Public function to get the map/query bounds
  getBounds : function() { return this.bounds; },

  // Private function to set this objects map bounds and map zoom info
  setMapBounds : function() {
    // get map bounds to two deciamal precision
    var mapBounds = this.map.getBounds();
    this.bounds.zoomChange = this.map.getZoom() - this.bounds.zoomLevel;
    this.bounds.zoomLevel = this.map.getZoom();
    this.bounds.map = {
        minLat : parseFloat((Math.round(mapBounds.getSouthWest().lat() * 1000) / 1000).toFixed(3)),
        minLng : parseFloat((Math.round(mapBounds.getSouthWest().lng() * 1000) / 1000).toFixed(3)),
        maxLat : parseFloat((Math.round(mapBounds.getNorthEast().lat() * 1000) / 1000).toFixed(3)),
        maxLng : parseFloat((Math.round(mapBounds.getNorthEast().lng() * 1000) / 1000).toFixed(3)) };
  },
  
  // Public/Private function to set the map's query bounds.
  // Automatically called prior to firing queryCallback. Should be called externally
    // when a search is performed (other than via the queryCallback).
  setQueryBounds : function() {
    // Expand search range to allow panning without requery (Marker popups cause pan)
    // Expand UP the most as popup extends up more than left/right.
    //var latRngExt = parseFloat(((this.bounds.map.maxLat - this.bounds.map.minLat) * 5).toFixed(3) * .09);
    //var lngRngExt = parseFloat(((this.bounds.map.maxLng - this.bounds.map.minLng) * 5).toFixed(3) * .075);
    var latRngExtMax = parseFloat(((this.bounds.map.maxLat - this.bounds.map.minLat) * .40).toFixed(3));
    var latRngExtMin = parseFloat(((this.bounds.map.maxLat - this.bounds.map.minLat) * .10).toFixed(3));
    var lngRngExt    = parseFloat(((this.bounds.map.maxLng - this.bounds.map.minLng) * .30).toFixed(3));

    this.bounds.query = {
        minLat : parseFloat((this.bounds.map.minLat - latRngExtMin).toFixed(3)),
        maxLat : parseFloat((this.bounds.map.maxLat + latRngExtMax).toFixed(3)),
        minLng : parseFloat((this.bounds.map.minLng - lngRngExt).toFixed(3)),
        maxLng : parseFloat((this.bounds.map.maxLng + lngRngExt).toFixed(3))
      };
  },  
  
  // Private function to determine if the map movement warrants a requery
  // based on the current map/query bounds and zoom
  mapMovedBeyondQueryExtents : function() {
    var bounds = this.getBounds();
    // If we ZOOMed-in Always requery
    // TODO: Disabled zoom check due for testing, due to zoomChange Bug above
    if (bounds.zoomChange > 0) { return true; }
    
    // If map moved beyond query extents, do not requery
    if (bounds.map.minLat < bounds.query.minLat ||
        bounds.map.maxLat > bounds.query.maxLat || 
        bounds.map.minLng < bounds.query.minLng || 
        bounds.map.maxLng > bounds.query.maxLng) {
      return true;
    }
    return false;
  },

  // Private function to calculate a Viewport for Geocode bias
  getBiasViewPort : function () {
    // When map is not initialize yet, provide a default PROD-TODO; Better default algorithm
    if (this.bounds === undefined) {
      var ne = new google.maps.LatLng(28.458, -80.294);
      var sw = new google.maps.LatLng(27.861, -80.906);
    } else {
      var ne = new google.maps.LatLng(this.bounds.query.maxLat, this.bounds.query.maxLng);
      var sw = new google.maps.LatLng(this.bounds.query.minLat, this.bounds.query.minLng);
    }
    return new google.maps.LatLngBounds(sw, ne);
  },
          
  getDefaultCenter : function() {
    return new google.maps.LatLng(28.1, -80.6);
  },
  
  // Public function used for debugging ; draws the map/query bounds
  showBounds : function () {
    var ne = new google.maps.LatLng(this.bounds.query.maxLat, this.bounds.query.maxLng);
    var sw = new google.maps.LatLng(this.bounds.query.minLat, this.bounds.query.minLng);
    var boundingBoxPoints = [
      ne, new google.maps.LatLng(ne.lat(), sw.lng()),
      sw, new google.maps.LatLng(sw.lat(), ne.lng()), ne
   ];
   new google.maps.Polyline({
      path: boundingBoxPoints,
      strokeColor: '#00FF00',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      map: this.map
   });
    var ne = new google.maps.LatLng(this.bounds.map.maxLat, this.bounds.map.maxLng);
    var sw = new google.maps.LatLng(this.bounds.map.minLat, this.bounds.map.minLng);
    var boundingBoxPoints = [
      ne, new google.maps.LatLng(ne.lat(), sw.lng()),
      sw, new google.maps.LatLng(sw.lat(), ne.lng()), ne
   ];
   new google.maps.Polyline({
      path: boundingBoxPoints,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      map: this.map
   });
  },

  // Public function to move map to the passed geo-location
  moveToAddress : function (address) {
    var thisObj = this;
    // We add USA to the address here. This should be removed if we ever go global :)
    this.geocoder.geocode( {'address': address + " ,USA", 'region' :  'us', 'bounds' : this.getBiasViewPort() }, 
      function(data, status) {
        if (status === "ZERO_RESULTS") {
          new StatusDialog({
            content : "Invalid Location '" + $( "#location" ).val() + "'. Try again.",
            title : "Invalid Location",
            modal : true,
            type : StatusDialog.error
          });
          $( "#location" ).val("");
          return false;
        }
        thisObj.moveToLatLng(data[0].geometry.location);
        return true;
     });
  },

  // Public function to move map to the passed LatLng
  moveToLatLng : function (latLng) {
    this.map.setCenter(latLng);
    if (this.dragableMarker !== undefined) {
      this.dragableMarker.setPosition(latLng);
    }
    if (this.staticMarker !== undefined) {
      this.staticMarker.setPosition(latLng);
    }
  },
  
  // Public function to redraw static marker's info Window (presumes map was initiated with a Static Marker)
  redrawStaticMarkerInfoWindow : function (divHTML) {
    if (this.staticMarker === undefined) {
      new StatusDialog({
        content : "redrawStaticMarkerInfoWindow called with undefined staticMarker!",
        title : "Serious Error",
        modal : true,
        type : StatusDialog.error
      });
    } else {
      this.staticMarkerInfoWindowContent = divHTML;
      this.infoWindow.close();
      this.infoWindow.setContent(this.staticMarkerInfoWindowContent);
      this.infoWindow.open(this.map, this.staticMarker);
    }
  },
  
  // Public function to use this map's geocoder to return a position given a location
  getGeoLoc : function (loc, callBack) {
    var thisObj = this;
    // We add USA to the address here. This should be removed if we ever go global :)
    this.geocoder.geocode( {'address': loc + " ,USA", 'region' :  'us', 'bounds' : this.getBiasViewPort() }, 
      function(data, status) {
        if (status === "ZERO_RESULTS") {
          $( "#location" ).val("");
          callBack("error", "Invalid Location '" + $( "#location" ).val() + "'. Try again.");
          return;
        }
        retData = eval (data); 
        retLoc = data[0].geometry.location;
        callBack("okay", retLoc);
     });
  },  
  
  // Public function to set the Map's markers. Replaces any existing markers with those passed.
  setMarkers : function (markerAry) {
    var thisObj = this;
    var setListener = function(marker) {
      google.maps.event.addListener(marker, 'click', function() {
        thisObj.infoWindow.setContent(marker.content);
        thisObj.infoWindow.open(thisObj.map, marker);
        if ($.isFunction(thisObj.markerClickedCallback)) {
          thisObj.markerClickedCallback(marker.content, marker.venueName, marker.venueId);
        }
      });
    };
    
    this.clearMarkers();    
    for (var i=0; i<markerAry.length; i++) {
      var marker = markerAry[i];
      this.markersArray.push(marker);
      setListener(marker);
    }
  },

  // Private function to free RAM by clearing Markers
  clearMarkers : function () {
    var i;
    if (this.markersArray) {
      for (i in this.markersArray) {
        this.markersArray[i].setMap(null);
      }
    }
    this.markersArray = [];
  },

  // Private function to add Dragable Marker
  addDragableMarker : function () {
    var thisObj = this;
    this.dragableMarker = new google.maps.Marker({
      map: this.map,
      position: this.map.getCenter(),
      draggable: true
    });      
    google.maps.event.addListener(this.dragableMarker, 'dragend', function() {
      thisObj.dragableMarkerCallback(thisObj.dragableMarker.getPosition());
    });
  },

  // Private function to add Static Marker
  addStaticMarker : function () {
    this.staticMarker = new google.maps.Marker({
      map: this.map,
      position: this.map.getCenter()
    });
    if (this.staticMarkerInfoWindowContent !== undefined) {
      console.log("Adding staticMarkerInfoWindowContent="+this.staticMarkerInfoWindowContent);
      this.infoWindow.setContent(this.staticMarkerInfoWindowContent);
      this.infoWindow.setOptions({maxWidth : 350});
      this.infoWindow.open(this.map, this.staticMarker);
    }
  }
};

var PopupBuilder = {
  addEvent_Venue : function(name, description, venueId){
    var html =
        "<div class='map-popup'>" +
        "<h4 style='margin-bottom:10px; border-bottom:1px solid grey;'>%name</h4>"+
        "<div>%description</div>" +
        "<input type='button' value='Select this Venue' onclick='VenueMarkers.venueSelected(\"%name\", %id);'/>" +
        "</div>";
    return html.replace(/%name/g, name).
                replace(/%description/g, description).
                replace(/%id/g, venueId);
  }
};