if(jQuery)
( function($) {
  var methods = {
    init : function () {
      return this.each(function(idx, tree) {
                        var $tree = $(tree);
                        if($tree.is(".tree")) { return; }
                        $tree.addClass("tree").find("ul").addClass("hidden")
                             .bind("click.jqtree", methods.eventHandlers.ul_click)
                             .parent().addClass("condensed")
                             .bind("click.jqtree", methods.eventHandlers.li_click);
                        });
    },
    destroy : function () {
      this.find("li").andSelf().unbind(".jqtree");
      return this;
    },
    addSibling : function ($newSibling) {
      var $node = this;
      if($node.is("ul.tree") || $node.parent().is("ul.tree")) {
        // element is now guaranteed to point to the root ul of the tree
        if($node.parent().is("ul.tree")) { $node = $node.parent(); }
        // Add the new list root to the tree
        $node.append($newSibling);
        $newSibling = $node.children("li:last");
      }
      else {
        // Move to the parent <ul> and add the new <li>
        $node.parent().append($newSibling);
        $newSibling = $node.parent().children("li:last");
      }
      return $newSibling;
    },
    addChild : function ($newChild) {
      // the element already has 1 or more children so we need to add a new child
      this.attr("class", "expanded");
      if(this.children("ul").length > 0) {
        // Add the new leaf among the existing children
        this.children("ul").removeClass("hidden").append($newChild);
        $newChild = this.children("ul").children("li:last");
      }
      // the element is a leaf so we make it a parent
      else {
        // Makes the leaf node look like a parent node
        this.bind('click.jqtree', methods.eventHandlers.li_click);
        var newTree = $j("<ul/>").append($newChild).click(methods.eventHandlers.ul_click);
        // Add the new leaf among the existing children
        this.append(newTree);
        $newChild = this.children("ul").children("li:last");
      }
      return $newChild;
    },
    // requires that 1 or more <li> be the target of this call
    deleteNode : function () {
      this.each(function(idx, item) {
                  var $item = $(item);
                  var $parent = $item.parent(); // points to a <ul>
                  // this is a root node
                  if($parent.is("ul.tree")) { $item.remove(); }
                  // this is an only child, remove the sub-tree (<ul>) and remove event listeners and styling
                  else if($item.siblings().length === 0) {
                    $parent.parent().unbind(".jqtree");
                    $parent.parent().removeAttr("class");
                    $parent.remove();
                  }
                  // there are siblings so the sub-tree (<ul>) does not need to be removed
                  else { $item.remove(); }
      });
    },
    collapse : function () {
      return this.filter(".expanded").each(function(idx, item) {
        $(item).removeClass("expanded").addClass("condensed").children("ul").addClass("hidden");
      });
    },
    collapseAll : function () {
      return this.each(function(idx, item) {
        $(item).find("ul").addClass("hidden").parent().removeClass("expanded").addClass("condensed");
      });
    },
    expand : function() {
      return this.each(function(idx, item) {
        $(item).addClass("expanded").removeClass("condensed").children("ul").removeClass("hidden");
      });
    },
    expandAll : function () {
      return this.each(function(idx, item) {
        $(item).find("ul").removeClass("hidden").parent().addClass("expanded").removeClass("condensed");
      });
    },
    //Returns the parent <li> element unless the current level of the tree is root, in this case nothing is returned.
    //This function should be used in conjunction with isRoot to ensure proper behavior
    parent : function () {
      var parents = [];
      this.each(function(idx, item) {
        var $li = $(item).jqTree("node").parents("li:first");
        if($li.parents("ul.tree").is("ul.tree")) { parents.push($li.get(0)); }
      });
      return $(parents);
    },
    isLeaf : function () {
      return this.jqTree("node").children("ul").length === 0;
    },
    isRoot : function () {
      return this.jqTree("node").parent().is("ul.tree");
    },
    children : function () {
      return this.jqTree("node").children("ul").children("li");
    },
    //Ensures that 'this' is pointing to a li node
    node : function () {
      var nodes = [];
      this.each(function(idx, item) {
                  var $item = $(item);
                  if(! $item.is("li")) { $item = $item.parents("li:first"); }
                  nodes.push($item.get(0));
      });
      return $(nodes);
    },
    eventHandlers : {
      ul_click : function (e) {
        // when a click event bubbles up to a ul, this cancels the propagation up the tree but then finds the
        // tree root and clicks it so the event can continue to propagate up the rest of the dom
        e.stopPropagation();
        var $ul = $(this);
        while(!$ul.is(".tree")) { $ul = $ul.parent().parent(); }
        $ul.click();
      },
      li_click : function (e) {
        var $parent = $(this);
        $parent.toggleClass("expanded").toggleClass("condensed");
        $parent.children("ul").toggleClass("hidden");
      }
    }
  };
  $.fn.jqTree = function (method) {
    // Method calling logic
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    }
    else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    }
    else {
      $.error( 'Method ' + method + ' does not exist on jQuery.tooltip' );
    }
  }
})(jQuery); 