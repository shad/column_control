/*
Effect that takes care of scrolling a scrolling element all the way to the right from wherever it is.
*/
if( typeof(Scriptaculous) != 'undefined' ){
	Effect.ScrollHorizontal = Class.create();
	Object.extend(Object.extend(Effect.ScrollHorizontal.prototype, Effect.Base.prototype), {
	  initialize:function(element) {
	    this.element = $(element);
	    if(!this.element) throw(Effect._elementDoesNotExistError);
	    var options = Object.extend({
				duration: .25
	    }, arguments[1] || {});
		
			this.start(options);
	  },
	  setup:function() {
			this.startX = this.element.scrollLeft;
			this.endX = this.element.scrollWidth - this.element.clientWidth;
			if( this.options.distance ){
				this.distance = this.options.distance;
			}else{
				this.distance = this.endX - this.startX;
			}
			
	  },
	  update:function(position) {
	    this.element.scrollLeft = this.startX + (this.distance * position);
	  }
	});
}

/*
 * # Column Control #
 * 
 * Creates a column control within the element id passed.  Pass in the root of the tree that should be used.  Each
 * action called should return a UL with multiple LI's defined.  Currently, it will look in the attribute 'pathname' on
 * the LI to know which url to hit next.
 *
 * ## SIMPLE EXAMPLE ##
 *
 *   <div id="foo"/>
 *   <script> var columns = new Ajax.ColumnControl( 'foo', '/root/path/for/items');
 *
 *
 * ## CSS ##
 *
 * CSS should be used to style the columns.  Each column can include any css info it needs to.  Additionally, the following
 * classes will be applied at the appropriate times:
 *  - UL level classes
 *    - column_0, column_1, column_2, ...
 *    - current_column
 *
 *  - LI level classes
 *    - current
 *    - selected
 *    - hover
 *
 *
 * ## OPTIONS ##
 *
 *  - pathName - The name of the attribute that will be used to build the path url on each click (pathname by default)
 *  - keyBindings - Turn on/off key bindings which enable keyboard navigation (true/false, on by default)
 *  - ajaxOptions - Any options that should be passed with each ajax call
 */
Ajax.ColumnControl = Class.create();

Ajax.ColumnControl.prototype = {
	initialize:function(element, url, options){
		// Set all of our internal variable and extend the options with the defaults
		this.element = $(element);
    this.url = url;

		this.columnsToLoad = [];

    this.options = Object.extend({
			pathName: 'pathname',
			keyBindings: true,
			ajaxOptions: {},
			root: '/'
    }, options || {} );
		
		// initialize the div with needed attributes
		this.element.makePositioned();
		
		this.element.setStyle({
			padding: "0px",
			overflowX: "scroll",
			overflowY: "hidden"
		});
		
		// Load up the root column
		if ( matches = document.location.href.match(/#(.+)/)){
			path = matches[1];
		}else{
			path = '';
		}

		this.loadColumn( path, {loadAll:true} );

		if( this.options.keyBindings ){			
			Event.observe(document, 'keydown', this.keyPressed.bindAsEventListener(this));
		}
	},
	
	// Perform AJAX call to load up the specified path (puts it at the end)
	loadColumn:function(path, params){
		this.currentPath = path;
		
		clearTimeout(this.columnLoadTimeout);
		this.columnLoadTimeout = setTimeout( function(){

			var ajaxOptions = Object.extend({
				onSuccess: this.columnsLoaded.bind(this),
				parameters: params
			}, this.options.ajaxOptions );


			new Ajax.Request( this.url + this.options.root + path, ajaxOptions );			
		}.bind(this), 300);
	},
	
	// callback once column is loaded
	columnsLoaded:function(transport){

		var startlength = this.element.childElements().length;

		if(this.currentColumn){
			this.currentColumn.nextSiblings().each( Element.remove ); // now remove them
		}
		
		// figure out what the next index will be.
		var nextIndex = this.element.childElements().length;

		// Insert the new columns into the DOM
		new Insertion.Bottom( this.element, transport.responseText );

		// Now get all the columns, and the new columns
		var allColumns = this.element.childElements();
		var newColumns = this.currentColumn ? this.currentColumn.nextSiblings() : this.element.childElements();
		
		// Hide the new columns
		newColumns.each( Element.hide );
		
		// Initialize the new columns
		newColumns.each( function(column){			
			this.initializeColumn(column, nextIndex);
			nextIndex += 1;			
		}.bind(this));
		
		if( this.options.afterColumnLoaded ){
			this.options.afterColumnLoaded(this);
		}
		
		
		//first column, so select first row
		if( allColumns.length == 1 && this.options.selectFirst ){
		 	this.selectRow(allColumns[0].down('li'));
		}
		
		// Highlight all of the rows of the items returned.
		toHighlight = this.currentPath.split('/');
		newColumns.each(function(column){
			nextPath = toHighlight.shift();
			if(nextPath && newColumns.last() != column){
				column.childElements().each( function(row){
					// console.log( nextPath + '==' + row.getAttribute(this.options.pathName)  );
					if( nextPath == row.getAttribute(this.options.pathName) ){
						this.highlightRow( row );
					}
				}.bind(this));
			}
		}.bind(this));
		
		newColumns.each( Element.show );
		
		this.updatePageUri();

		// Scroll to end of this element, or scroll backwards to show everything 
		// (wait a moment to make sure the left edges have time to be calculated properly)
		setTimeout(function(){			
			if(allColumns.length - startlength > 0){
				if( typeof(Scriptaculous)!='undefined' ){
					new Effect.ScrollHorizontal( this.element );
				}else{
					
				}
			}else{
				this.element.scrollLeft = this.element.scrollWidth - this.element.clientWidth;
			}
			
		}.bind(this), 10);
		
		
	},
	
	// Make sure the column has all the needed bits of style and such
	initializeColumn:function(element, index){
		element.addClassName( "column_" + index ); //give it a classname so we can attach things to it if we want to
		
		if( ! element.id ){
			element.id = 'column_' + index;
		}
		
		element.setStyle({		
			listStylePosition: "inside",
		  height: (this.element.getHeight() - 16).toString() + "px", 
		  position: "absolute",
		  paddingLeft: "0px",
		  paddingTop: "0px",
		  marginTop: "0px",
		  marginLeft: "0px",
		  overflowY: "scroll",
		  overflowX: "hidden"
		});
		
		// Initialize the rows of the column
		var i = 0;
		element.childElements().each(function(row){ 
			this.initializeRow(row, i);
			i += 1;
		}.bind(this));

		// Calculate the leftside
		// Setting timeout so that we can "show" everything before we calculate the left sides.
		setTimeout(function(){
			leftside = 0;
			element.previousSiblings().each(function(element){ leftside += element.getWidth(); });
			element.style.left = leftside + 'px';
		}.bind(this), 1);
		
	},
	
	
	// initialize rows in a column (attach events to them)
	initializeRow:function(element, index){
		if(element.nodeName == "LI"){
			element.setStyle({cursor: "default"});
			
			// Create a nice id if there isn't one already specified.
			if( !element.id ){
				element.id = element.up().id + '_row_' + index;
			}
					
			Event.observe(element, 'mouseover', this.rowMouseOver.bindAsEventListener(this));
			Event.observe(element, 'mouseout', this.rowMouseOut.bindAsEventListener(this));
			Event.observe(element, 'click', this.rowSelected.bindAsEventListener(this) );
		}
	},
	
	rowMouseOver:function(event){
		event.findElement('li').addClassName("hover");
	},
	rowMouseOut:function(event){
		event.findElement('li').removeClassName("hover");
	},	
	// Called when the li is selected
	rowSelected:function(event){
		this.selectRow( event.findElement('li') );
	},
	
	// Select the row specified
	selectRow:function(element){
		if( element.nodeName != 'LI' ){
			element = element.up('li');
		}
		
		this.highlightRow(element);

		// Callback
		if( this.options.afterRowSelected ){
			this.options.afterRowSelected(this);
		}

		// finally, load the column
		this.loadColumn( this.pathForRow(element) );		
	},
	
	// Highlight the specified row (this only highlights, does not change anything else, or load anything)
	highlightRow:function(element){
		var oldColumn = this.element.down('.current_column');
		if( oldColumn) oldColumn.removeClassName("current_column");
		
		// find the parent element and remove all the siblings that come after it.
		this.currentColumn = element.up('ul');
		this.currentColumn.addClassName("current_column");

		// remove the current class
		this.currentRow().removeClassName("current");
		
		element.siblings().each( function(element){
			element.removeClassName('selected'); 
		});

		element.addClassName('selected').addClassName('current');		
	},
	
	// return the row with the current class
	currentRow:function(){
		var current = this.element.down("li.current");
		if( current ) return current;
		else return this.element.down("li");
	},
	
	getCurrentColumn:function(){
		var current = this.element.down('ul.current_column');
		if( current ) return current;
		else return null;
	},
	
	// Key Commands
	selectNextRow:function(){
		var row = this.currentRow().next();
		this.selectRow(row);
		row.up("ul").scrollTop = row.offsetTop - 60;
	},
	selectPreviousRow:function(){
		var row = this.currentRow().previous();
		this.selectRow(row);
		row.up("ul").scrollTop = row.offsetTop - 60;
	},
	selectNextColumn:function(){
		var column = this.currentRow().up("ul").next();
		var row = column.down("li");
		this.selectRow(row);
	},
	selectPreviousColumn:function(){
		var column = this.currentRow().up('ul').previous();
		var row = column.down('li.selected');
		this.selectRow(row);
	},
	
	// Just move back and don't select anything (Added for sort of start of iPhone support)
	// This function needs some real work to DRY it up.
	goBack:function(){
		var currentColumn = this.getCurrentColumn();
		
		if(currentColumn == null) return;
		
		var row = currentColumn.down('li.selected');
		
		currentColumn.nextSiblings().each( Element.remove ); // now remove them
		currentColumn.removeClassName('current_column');
		prevcol = currentColumn.previous();

		if( row ){
			row.removeClassName('selected');
			row.removeClassName('current');
		}

		if( prevcol ){
			prevcol.addClassName('current_column');
			prevcol.down('li.selected').addClassName('current');
			this.currentPath = this.pathForRow(this.currentRow());
		}else{
			this.currentPath = '';
		}
		this.updatePageUri();
	},
	
	// Helper function that takes a row element and returns the path to that row
	pathForRow:function(element){
		// build the path
		var path = element.getAttribute(this.options.pathName);
		
		element.up('ul').previousSiblings().each( function(column){
			var row = column.down(".selected");
			if( row ){
				path = row.getAttribute(this.options.pathName) + "/" + path;
			}
		}.bind(this));
		
		return path;
	},
	
	updatePageUri: function(){
    var my_href = location.href.toString(), matches = null;
    if (matches = my_href.match(/#(.*)/)){
      my_href = my_href.replace(matches[0], '');
			my_href += '#' + this.currentPath;
      setTimeout(function(){location.href = my_href;}.bind(this), 10);

    } else {
      location.href += '#' + this.currentPath;
    }
  },
  
	keyPressed:function(event){
		var code;
		if (!event) var event = window.event;
		if (event.keyCode) code = event.keyCode;
		else if (event.which) code = event.which;
		
		if( code == Event.KEY_UP ) {
			this.selectPreviousRow();
			event.stop();
		}else if( code == Event.KEY_DOWN ) {
			this.selectNextRow();
			event.stop();
		}else if( code == Event.KEY_RIGHT){
			this.selectNextColumn();
			event.stop();
		}else if( code == Event.KEY_LEFT ){
			this.selectPreviousColumn();
			event.stop();
		}
	}
};