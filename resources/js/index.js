////////////////////////////////////////////////////////////////////////////
// Index is the main page's static class. 
////////////////////////////////////////////////////////////////////////////

var Index = {
  mapInitialized  : false,
  pageNum : 0,
    
  // This function is called when the map fires it's Idle event. This
  // is done my passing a refernce to this function as an argument to
  // the Map's constructor.
  mapMoveHandler: function (mapBounds) {

    // First time the map becomes Idle, we have no date set, etc. so,
    // setDefaultQuery.
    if(!Index.mapInitialized) {
      Index.mapInitialized = true;
      if (Index.setDefaultQuery()) {
        return;
      }
    }
    this.pageNum = 0;
    Index.performSearch(mapBounds);
  },
  
  // Use this function to start a new search. E.g. The date/category/etc
  // has changed or the Search button was pressed. 
  // Do not use this for Prev/Next as the page is reset to Zero.
  newSearch : function() {
    // This function will reset the page counter; and udpated the queryBounds
    // (queryBounds is set automatically by the map before firing it's Idle
    // event).
    Index.pageNum = 0;
    Index.map.setQueryBounds();
    Index.performSearch(Index.map.getBounds());
  },

  // This function is called to perform the actual search. This
  // function presumes that all query criteria such as page number,
  // dates, etc. have been set.
  performSearch : function(mapBounds) {
    
    // Validate Date Range
    var fromDate = new Date($("#from_date").val());
    var toDate   = new Date($("#to_date").val());
    if (fromDate > toDate) {
      new StatusDialog({
        content : "You have entered a bad date range! \nFROM date must be BEFORE the TO date. \nFix your dates and try again.",
        title : "Bad Date Range",
        modal : true,
        type : StatusDialog.error
      });
      return;
    }
    if (fromDate === "Invalid Date" || toDate === "Invalid Date") {
      new StatusDialog({
        content : "You must select valid dates.\nClick Today, Weekend or Other.",
        title : "Bad Date Range",
        modal : true,
        type : StatusDialog.error
      });
      return;
    }

    var checkedIds = [];

    $("#categories").find("input:checked").each(function() { checkedIds.push(this.value); });
    // Minimize the Categories. If a more General Category exists then a given Category, then
    // the more-specific category should be removed. Example: If selection contains both 
    // "Entertainment>Music>Amateur" and "Entertainment>Music", then delete the 
    // "Entertainment>Music>Amateur". It is noteworthy to mention that the tree
    // itself manages some control over changing states. Some things are left checked
    // to help make it clear to the user what the query will be. Here we minimize so that
    // the server processing is minimal.
    for (var i=checkedIds.length-1; i>=0; i--) {
      // Figure out parent name (remove last ".x"); this finds the more-general category name
      var lastDot = checkedIds[i].lastIndexOf(".");
      var parentName = checkedIds[i].substring(0,lastDot);
      // See if the more-General category exists
      var locOfParent = $.inArray(parentName, checkedIds);
      if (locOfParent !== -1) {
        // Remove the more-specific category
        checkedIds.splice(i,1);
      }
    }
    var markersArray = eventMarkers.searchMarkers(Index.map.map, checkedIds.join(","),
      $("#from_date").val(),$("#to_date").val(),
      mapBounds.query.minLat, mapBounds.query.maxLat,
      mapBounds.query.minLng, mapBounds.query.maxLng,
      Index.pageNum,
      Index.markerReturnHandler);
    // Return data recevied asynchronusly to callback function markerReturnHandler
  },

  // This function receives the marker array sychronusly from performSearch Call
  markerReturnHandler: function (markersArray) {
    Index.map.setMarkers(markersArray);
  },

  // Set Date selection to "this upcoming weekend". If during weekend, show
  // remainder of weekend.
  setWeekend : function() {
    var d = new Date();
    var startDate = new Date();
    var endDate = new Date();
    var startOffset, endOffset;
    switch (d.getDay()) {
      case 0: // Sunday (Just Today)
        startOffset = 0;
        endOffset = 0;
        break;
      case 1: case 2: case 3: case 4: case 5: // (Next Friday thru Sunday)
        startOffset = 5 - d.getDay();
        endOffset = 7 - d.getDay();
        break;
      case 6: // Saturday (Saturday/Today and Sunday)
        startOffset = 0;
        endOffset = 1;
        break;
    }
    startDate.setDate(d.getDate() + startOffset);
    endDate.setDate(d.getDate() + endOffset);
    $("#tab-2").html($.datepicker.formatDate('yy-mm-dd', new Date(startDate)) + " - " + $.datepicker.formatDate('yy-mm-dd', new Date(endDate)));
    document.getElementById('from_date').value = $.datepicker.formatDate('yy-mm-dd', new Date(startDate));
    document.getElementById('to_date').value   = $.datepicker.formatDate('yy-mm-dd', new Date(endDate));
    Index.newSearch();
  },

  // Sets Date selection to "Today"
  setToday : function() {
    $("#tab-1").html($.datepicker.formatDate('yy-mm-dd', new Date()));
    document.getElementById('from_date').value = $.datepicker.formatDate('yy-mm-dd', new Date());
    document.getElementById('to_date').value = $.datepicker.formatDate('yy-mm-dd', new Date());
    Index.newSearch();
  },

  // Handles user selection of Date Range
  setCustom : function() {
    document.getElementById('from_date').value = "";
    document.getElementById('to_date').value = "";
    // Open DatePicker for From date
    $( "#from_date" ).datepicker( "show" );
    //Index.newSearch();
  },

  // Set the Initial/Default Query to be run when the page first loads
  setDefaultQuery: function() {
    // This should do great stuff, like look up categories based
    // on the member's preferences/cookies, special seasons, etc.
    // For now, the Default Query will be "Today's events".
    // Return True if this results in the Query running, else
    // return false (so that calling function can decide whether
    // or not to performSearch after query is set)
    this.setToday();
    return true;
  },

  // Function to set the map's default/initial center location
  getDefaultMapCenter: function() {
    // Improve to use some location lookup; Cookies, Membership info, etc.
    // For now, use Palm Bay
    return new google.maps.LatLng(28.1, -80.6);
  },

  // Page backward through events that match the search criteria
  prevPage : function() {
    if (Index.pageNum === 0) {
      new StatusDialog({
        content : "You are at the first page.",
        title : "First Page",
        modal : true,
        type : StatusDialog.info
      });
      return;
    }
    Index.pageNum -= 1;
    Index.performSearch(Index.map.getBounds());
  },

  // Page forward through events that match the search criteria
  nextPage : function() {
    Index.pageNum += 1;
    Index.performSearch(Index.map.getBounds());
  }

};
  
  // "OnReady" constructor that initializes the Page/jQuery stuff, etc.
  $(function() {
    var mapOptions = {
      queryCallback : Index.mapMoveHandler,
      geoLocOrAddress : {latLng : Index.getDefaultMapCenter()}
    };
    Index.map = new Map($("#map")[0], mapOptions);
    
    $("input[name=Search]").click(Index.newSearch);
    $("input[name=Previous]").click(Index.prevPage);
    $("input[name=Next]").click(Index.nextPage);

    $("#today-tab").click(Index.setToday); 
    $("#weekend-tab").click(Index.setWeekend);
    $("#custom-tab").click(Index.setCustom);
    
    $("#date-tabs").tabs()
      .children("ul")
      .removeClass("ui-corner-all")
      .addClass("ui-corner-tr")
      .addClass("ui-corner-tl");

    $("#date-tabs")
      .children("div")
      .addClass("date-tab");

    $("#tab-3").addClass("date-fieldset");

    // initialize the jqTree
    var $jqTree = Globals.categoryTree($("#categories"));

    // Initialize date pickers
    $( "#from_date" ).datepicker({
      changeMonth: true,
      numberOfMonths: 1,
      dateFormat: "yy-mm-dd",
      minDate: new Date(),
      onClose: function( selectedDate ) {
        //$( "#from_date" ).datepicker();
        // If user made a selection
        if ($("#from_date").val() !== "" && $("#from_date").val() !== "Invalid Date") {
          // Force user to select both dates
          if ($("#to_date").val() === "" || $("#to_date").val() === "Invalid Date") {
            $( "#to_date" ).datepicker( "show" );
          }
          else { // Else, if both dates are selected, run query
            Index.newSearch();
          }
        }
      }
    });
    $( "#to_date" ).datepicker({
      defaultDate: "+1w",
      changeMonth: true,
      numberOfMonths: 1,
      dateFormat: "yy-mm-dd",
      minDate: new Date(),
      onClose: function( selectedDate ) {
        //$( "#to_date" ).datepicker();
        // If user made a selection
        if ($("#to_date").val() !== "" && $("#to_date").val() !== "Invalid Date") {
          // Force user to select both dates
          if ($("#from_date").val() === "" || $("#from_date").val() === "Invalid Date") {
            $( "#from_date" ).datepicker( "show" );
          }
          else { // Else, if both dates are selected, run query
            Index.newSearch();
          }
        }
      }
    });

    // Add GO button
    $("#Go").click(function() {
      Index.map.moveToAddress($('#location').val());
    });

    // Add ENTER handle for location
    $( "#location" ).bind('keypress',function (event){
      if (event.keyCode === 13){
        $( "#Go" ).trigger('click');
      }
    });

    $("#contact-us").click(function() {
      new StatusDialog({
        content : 'Here is our email. Wed love to hear from you. <a href="mailto:'+ Globals.obfsu() + '"?Subject=Hello%20again">' + Globals.obfsu() + '</a>',
        title : "Concact Us",
        modal : true,
        type : StatusDialog.info
      });
    });

    $("#about-us").click(function() {
      new StatusDialog({
        content : 'We are awesome. Stay tuned for even more information about us! Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis erat justo, porttitor nec ultrices vel, accumsan in orci. Sed ut placerat lorem. Curabitur sed sapien mi. Praesent ac sapien nibh. Integer sed turpis ligula. Praesent quis nunc dolor. Curabitur aliquet luctus lorem. Donec tempus lorem sed lectus vehicula imperdiet convallis nulla bibendum. Maecenas porta ultrices mi, sit amet blandit dui rhoncus vel.',
        title : "About Us",
        modal : true,
        type : StatusDialog.info
      });
    });


    // Add hint-class handler
    Globals.hint();
    Globals.positionLogo();
});
