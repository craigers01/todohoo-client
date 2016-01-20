function Wizard(stepArray) {
  this.steps = stepArray;
  this.currentIndex = 0;
  this.current = this.steps[this.currentIndex];
  this.addButtons();  
  this.current.step.show();
  this.current.stepShown();
}

Wizard.prototype = {
  addButtons : function() {
    if(!this.current.step.find("div.buttons").is(".buttons")) {
      var buttons = [];
      buttons.push("<div class='buttons'>");
      if(this.currentIndex > 0)                 { buttons.push("<input type='button' value='Previous'/>"); }
      if(this.currentIndex < (this.steps.length -1)) { buttons.push("<input type='button' value='Next'/>"); }
      if(this.currentIndex === (this.steps.length -1)) { buttons.push("<input type='button' value='Save'/>"); }
      buttons.push("<input type='button' value='Cancel'/></div>");
      this.current.step.append(buttons.join(""));
      
      var thisObj = this;
      this.current.step.find("input[value=Previous]").button().click(function() { thisObj.previous(); });
      this.current.step.find("input[value=Next]").button().click(function() { thisObj.next(); });
      this.current.step.find("input[value=Save]").button().click(function() { thisObj.save(); });
      this.current.step.find("input[value=Cancel]").button().click(function() { thisObj.cancel(); });
    }
  },
  
  next : function() {
    var thisObj = this;
    if(this.current.isValid()) {
      this.current.step.hide("slide", { easing : "easeInCirc" }, 750,
        function() {
          //call the hidden callback
          thisObj.current.stepHidden();

          //bookkeeping to move onto the previous step
          thisObj.currentIndex += 1;
          thisObj.current = thisObj.steps[thisObj.currentIndex];
          
          //add the navigation buttons
          //only required on next because we have been to the previous page already
          thisObj.addButtons();

          thisObj.current.step.show("slide", { direction : "right", easing : "easeOutCirc" }, 750,
                                    function() { thisObj.current.stepShown(); });
        });
    }
    else {
      this.current.showInvalidMessage();
    }
  },
  
  previous : function() {
    var thisObj = this;
    this.current.step.hide("slide", { direction:"right", easing : "easeInCirc" }, 750,
      function() {
        //call the hidden callback
        thisObj.current.stepHidden();
        
        //bookkeeping to move onto the previous step
        thisObj.currentIndex -= 1;
        thisObj.current = thisObj.steps[thisObj.currentIndex];
        
        //show the previous step and call its stepShown fxn
        thisObj.current.step.show("slide", { easing : "easeOutCirc" }, 750,
                                  function() { thisObj.current.stepShown(); });
      });
  },
  
  cancel : function() {
    new StatusDialog({
      content : "Are you sure you want to cancel?",
      title : "Cancel?",
      modal : true,
      type : StatusDialog.info,
      buttons: {
        Yes: function () {
          $(this).dialog("close");
          window.location = "http://" + window.location.host;
        },
        No: function () {
          $(this).dialog("close");
        }
      }
    });
  },
  
  save : function () {
    if (this.current.save !== undefined) {
      this.current.save();
    }
   }
};

function WizardStep() {}

WizardStep.prototype = {
  init : function (id) {
    this.step = $("#"+id);
    this.id = id;
  },
  
  isValid : function() { return true; },
  showInvalidMessage : function() {
    new StatusDialog({
      content : this.errorMsg,
      title : "Invalid Location",
      modal : true,
      type : StatusDialog.error
    });
  },
  
  stepShown : function() {  },
  stepHidden : function() {  }
};


