
/* SOURCE FILE: AnchorPosition.js */

/* 
AnchorPosition.js

DESCRIPTION: These functions find the position of an <A> tag in a document,
so other elements can be positioned relative to it.

COMPATABILITY: Netscape 4.x,6.x,Mozilla, IE 5.x,6.x on Windows. Some small
positioning errors - usually with Window positioning - occur on the 
Macintosh platform.

FUNCTIONS:
getAnchorPosition(anchorname)
Returns an Object() having .x and .y properties of the pixel coordinates
of the upper-left corner of the anchor. Position is relative to the PAGE.

getAnchorWindowPosition(anchorname)
Returns an Object() having .x and .y properties of the pixel coordinates
of the upper-left corner of the anchor, relative to the WHOLE SCREEN.

NOTES:

1) For popping up separate browser windows, use getAnchorWindowPosition. 
Otherwise, use getAnchorPosition

2) Your anchor tag MUST contain both NAME and ID attributes which are the 
same. For example:
<A NAME="test" ID="test"> </A>

3) There must be at least a space between <A> </A> for IE5.5 to see the 
anchor tag correctly. Do not do <A></A> with no space.
*/

// getAnchorPosition(anchorname)
//   This function returns an object having .x and .y properties which are the coordinates
//   of the named anchor, relative to the page.
function getAnchorPosition(anchorname) {
    // This function will return an Object with x and y properties
    var useWindow = false;
    var coordinates = new Object();
    var x = 0, y = 0;
    // Browser capability sniffing
    var use_gebi = false, use_css = false, use_layers = false;
    if (document.getElementById) { use_gebi = true; }
    else if (document.all) { use_css = true; }
    else if (document.layers) { use_layers = true; }
    // Logic to find position
    if (use_gebi && document.all) {
        x = AnchorPosition_getPageOffsetLeft(document.all[anchorname]);
        y = AnchorPosition_getPageOffsetTop(document.all[anchorname]);
    }
    else if (use_gebi) {
        var o = document.getElementById(anchorname);
        if (o === null) { o = document.getElementsByName(anchorname)[0]; }

        x = AnchorPosition_getPageOffsetLeft(o);
        y = AnchorPosition_getPageOffsetTop(o);
    }
    else if (use_css) {
        x = AnchorPosition_getPageOffsetLeft(document.all[anchorname]);
        y = AnchorPosition_getPageOffsetTop(document.all[anchorname]);
    }
    else if (use_layers) {
        var found = 0;
        for (var i = 0; i < document.anchors.length; i++) {
            if (document.anchors[i].name === anchorname) { found = 1; break; }
        }
        if (found === 0) {
            coordinates.x = 0; coordinates.y = 0; return coordinates;
        }
        x = document.anchors[i].x;
        y = document.anchors[i].y;
    }
    else {
        coordinates.x = 0; coordinates.y = 0; return coordinates;
    }
    coordinates.x = x;
    coordinates.y = y;
    return coordinates;
}

// getAnchorWindowPosition(anchorname)
//   This function returns an object having .x and .y properties which are the coordinates
//   of the named anchor, relative to the window
function getAnchorWindowPosition(anchorname) {
    var coordinates = getAnchorPosition(anchorname);
    var x = 0;
    var y = 0;
    if (document.getElementById) {
        if (isNaN(window.screenX)) {
            x = coordinates.x - document.body.scrollLeft + window.screenLeft;
            y = coordinates.y - document.body.scrollTop + window.screenTop;
        }
        else {
            x = coordinates.x + window.screenX + (window.outerWidth - window.innerWidth) - window.pageXOffset;
            y = coordinates.y + window.screenY + (window.outerHeight - 24 - window.innerHeight) - window.pageYOffset;
        }
    }
    else if (document.all) {
        x = coordinates.x - document.body.scrollLeft + window.screenLeft;
        y = coordinates.y - document.body.scrollTop + window.screenTop;
    }
    else if (document.layers) {
        x = coordinates.x + window.screenX + (window.outerWidth - window.innerWidth) - window.pageXOffset;
        y = coordinates.y + window.screenY + (window.outerHeight - 24 - window.innerHeight) - window.pageYOffset;
    }
    coordinates.x = x;
    coordinates.y = y;
    return coordinates;
}

// Functions for IE to get position of an object
function AnchorPosition_getPageOffsetLeft(el) {
    if (!el || !el.offsetLeft)
        return 0;
    var ol = el.offsetLeft;
    while (el = el.offsetParent) { ol += el.offsetLeft; }
    return ol;
}
function AnchorPosition_getWindowOffsetLeft(el) {
    return AnchorPosition_getPageOffsetLeft(el) - document.body.scrollLeft;
}
function AnchorPosition_getPageOffsetTop(el) {
    if (!el || !el.offsetLeft )
        return 0;
    var ot = el.offsetTop;
    while (el = el.offsetParent) { ot += el.offsetTop; }
    return ot;
}
function AnchorPosition_getWindowOffsetTop(el) {
    return AnchorPosition_getPageOffsetTop(el) - document.body.scrollTop;
}


/* SOURCE FILE: PopupWindow.js */

/* 
PopupWindow.js

DESCRIPTION: This object allows you to easily and quickly popup a window
in a certain place. The window can either be a DIV or a separate browser
window.

COMPATABILITY: Works with Netscape 4.x, 6.x, IE 5.x on Windows. Some small
positioning errors - usually with Window positioning - occur on the 
Macintosh platform. Due to bugs in Netscape 4.x, populating the popup 
window with <STYLE> tags may cause errors.

USAGE:
// Create an object for a WINDOW popup
var win = new PopupWindow(); 

// Create an object for a DIV window using the DIV named 'mydiv'
var win = new PopupWindow('mydiv'); 

// Set the window to automatically hide itself when the user clicks 
// anywhere else on the page except the popup
win.autoHide(); 

// Show the window relative to the anchor name passed in
win.showPopup(anchorname);

// Hide the popup
win.hidePopup();

// Set the size of the popup window (only applies to WINDOW popups
win.setSize(width,height);

// Populate the contents of the popup window that will be shown. If you 
// change the contents while it is displayed, you will need to refresh()
win.populate(string);

// set the URL of the window, rather than populating its contents
// manually
win.setUrl("http://www.site.com/");

// Refresh the contents of the popup
win.refresh();

// Specify how many pixels to the right of the anchor the popup will appear
win.offsetX = 50;

// Specify how many pixels below the anchor the popup will appear
win.offsetY = 100;

NOTES:
1) Requires the functions in AnchorPosition.js

2) Your anchor tag MUST contain both NAME and ID attributes which are the 
same. For example:
<A NAME="test" ID="test"> </A>

3) There must be at least a space between <A> </A> for IE5.5 to see the 
anchor tag correctly. Do not do <A></A> with no space.

4) When a PopupWindow object is created, a handler for 'onmouseup' is
attached to any event handler you may have already defined. Do NOT define
an event handler for 'onmouseup' after you define a PopupWindow object or
the autoHide() will not work correctly.
*/

var GlobalDivName;
var GlobalWidth;
var GlobalHeight;

function PopupWindow_MoveToScreenCenter() {
    var iebody = (document.compatMode && document.compatMode !== "BackCompat") ? document.documentElement : document.body;
    var dsocleft = document.all ? iebody.scrollLeft : pageXOffset;
    var dsoctop = document.all ? iebody.scrollTop : pageYOffset;
    var _x = 0;
    var _y = 0;

    if (window.innerWidth) { //if browser supports window.innerWidth	    
        _x = ((window.innerWidth - GlobalWidth) / 2) + dsocleft;
        _y = (((window.innerHeight - GlobalHeight) / 2) + dsoctop);
    }
    else if (document.all) { //else if browser supports document.all (IE 4+)
        _x = ((document.documentElement.clientWidth - GlobalWidth) / 2) + dsocleft;
        _y = (((document.documentElement.clientHeight - GlobalHeight) / 2) + dsoctop);
    }

    if (this.divName !== null) {
        document.getElementById(this.divName).style.left = _x + "px";
        document.getElementById(this.divName).style.top = _y + "px";
        this.x = _x;
        this.y = _y;
    }
    else {
        document.getElementById(GlobalDivName).style.left = _x + "px";
        document.getElementById(GlobalDivName).style.top = _y + "px";
    }
}

// Set the position of the popup window based on the anchor
function PopupWindow_getXYPosition(anchorname) {
    var coordinates;

    if (anchorname === "") {
        window.onresize = this.MovetoScreenCenter;
        this.MovetoScreenCenter();
    }
    else if (this.type === "WINDOW") {
        coordinates = getAnchorWindowPosition(anchorname);
    }
    else {
        coordinates = getAnchorPosition(anchorname);
    }

    if (coordinates !== null) {
        this.x = coordinates.x;
        this.y = coordinates.y;
    }
}
// Set width/height of DIV/popup window
function PopupWindow_setSize(width, height) {
    this.width = width;
    this.height = height;
    GlobalWidth = width;
    GlobalHeight = height;
}
// Fill the window with contents
function PopupWindow_populate(contents) {
    this.contents = contents;
    this.populated = false;
}
// Set the URL to go to
function PopupWindow_setUrl(url) {
    this.url = url;
}
// Set the window popup properties
function PopupWindow_setWindowProperties(props) {
    this.windowProperties = props;
}
// Refresh the displayed contents of the popup
function PopupWindow_refresh() {
    if (this.divName !== null) {
        // refresh the DIV object
        if (this.use_gebi) {
            document.getElementById(this.divName).innerHTML = this.contents;
        }
        else if (this.use_css) {
            document.all[this.divName].innerHTML = this.contents;
        }
        else if (this.use_layers) {
            var d = document.layers[this.divName];
            d.document.open();
            d.document.writeln(this.contents);
            d.document.close();
        }
    }
    else {
        if (this.popupWindow && !this.popupWindow.closed) {
            if (this.url) {
                this.popupWindow.location.href = this.url;
            }
            else {
                this.popupWindow.document.open();
                this.popupWindow.document.writeln(this.contents);
                this.popupWindow.document.close();
            }
            this.popupWindow.focus();
        }
    }
}
// Position and show the popup, relative to an anchor object
function PopupWindow_showPopup(anchorname) {
    this.anchorname = anchorname;
    this.getXYPosition(anchorname);
    this.x += this.offsetX;
    this.y += this.offsetY;
    //alert("showPopup: anchorname=" + anchorname);
    if (!this.populated && (this.contents !== "")) {
        this.populated = true;
        //alert("refresh1");
        this.refresh();
    }
    if (this.divName !== null) {
        // Show the DIV object
        //alert("divname=" + this.divName);        
        if (this.use_gebi) {
            //document.getElementById(this.divName).style.left = this.x + "px";
            //document.getElementById(this.divName).style.top = this.y + "px";

            $("#" + this.divName).css({ "display": "none", "visibility": "visible" }).attr("xVis","Y");
            $("#" + this.divName).fadeIn(200);
            //document.getElementById(this.divName).style.visibility = "visible";

            if (this.height === 0 && this.width === 0) {
                this.height = document.getElementById(this.divName).style.height;
                this.width = document.getElementById(this.divName).style.width;
            }
        }
        else if (this.use_css) {
            //document.all[this.divName].style.left = this.x;
            //document.all[this.divName].style.top = this.y;
            document.all[this.divName].style.visibility = "visible";

            if (this.height === 0 && this.width === 0) {
                this.height = document.all[this.divName].style.height;
                this.width = document.all[this.divName].style.width;
            }
        }
        else if (this.use_layers) {
            //document.layers[this.divName].left = this.x;
            //document.layers[this.divName].top = this.y;
            document.layers[this.divName].visibility = "visible";

            if (this.height === 0 && this.width === 0) {
                this.height = document.layers[this.divName].height;
                this.width = document.layers[this.divName].width;
            }
        }
    }
    else {
        if (this.popupWindow === null || this.popupWindow.closed) {
            // If the popup window will go off-screen, move it so it doesn't
            //if (this.x < 0) { this.x = 0; }
            //if (this.y < 0) { this.y = 0; }
            //if (screen && screen.availHeight) {
            //    if ((this.y + this.height) > screen.availHeight) {
            //        this.y = screen.availHeight - this.height;
            //    }
            //}
            //if (screen && screen.availWidth) {
            //    if ((this.x + this.width) > screen.availWidth) {
            //        this.x = screen.availWidth - this.width;
            //    }
            //}
            var avoidAboutBlank = window.opera || (document.layers && !navigator.mimeTypes['*']) || navigator.vendor === 'KDE' || (document.childNodes && !document.all && !navigator.taintEnabled);
            this.popupWindow = window.open(avoidAboutBlank ? "" : "about:blank", "window_" + anchorname, this.windowProperties + ",width=" + this.width + ",height=" + this.height + ",screenX=" + this.x + ",left=" + this.x + ",screenY=" + this.y + ",top=" + this.y + "");
        }
        this.refresh();
    }
}
// Hide the popup
function PopupWindow_hidePopup() {
    if (this.divName !== null) {        
        if (this.divName === "GridColPopup") {
            $('td').removeClass("Grid_HL").css({ "background-color": "" });
            PauseGridColour = false;
        }
        $("#" + this.divName).fadeOut();
        $("#" + this.divName).css({ "display": "none", "visibility": "visible" }).removeAttr("xVis");
        setTimeout(function () { $("#" + this.divName).css("display","none"); }, 1000);
    }
    else {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.close();
            this.popupWindow = null;
        }
    }
}
// Pass an event and return whether or not it was the popup DIV that was clicked
function PopupWindow_isClicked(e) {

    var localEvent;
    try {
        localEvent = event;
        if (localEvent === undefined) localEvent = e;
    } catch (err) {
        localEvent = e;
    } 
    
    if (this.divName !== null){
        if ($.Is_FireFox()) { // added Is_FireFox just to stop the window auto closing. but the auto click outside is still not working (need to look at) the event is not right here and i have no idea why.!            
            var t2;
            if (window.event) {
                t2 = window.event.srcElement;
            } else {
                t2 = e.target;
            }

            while (t2 !== null && t2.parentElement !== null) {
                if (t2.id === this.divName) {
                    return true;
                }
                t2 = t2.parentElement;
            }
            return false;
        }
        else
            if (this.use_layers || $.Is_FireFox()) { // added Is_FireFox just to stop the window auto closing. but the auto click outside is still not working (need to look at) the event is not right here and i have no idea why.!            
            var clickX = localEvent.pageX;
            var clickY = localEvent.pageY;
            var t = document.layers[this.divName];
            if ((clickX > t.left) && (clickX < t.left + t.clip.width) && (clickY > t.top) && (clickY < t.top + t.clip.height)) {
                return true;
            }
            else { return false; }
        }
        else if (document.all) { // Need to hard-code this to trap IE for error-handling            
            var t3 = window.event.srcElement;
            while (t3 !== null && t3.parentElement !== null) {
                if (t3.id === this.divName) {
                    return true;
                }
                t3 = t3.parentElement;
            }
            return false;
        }
        else if (this.use_gebi && localEvent) {
            try {
                var t1 = localEvent.relatedTarget || localEvent.toElement || localEvent.target;
                while (t1 !== null && t1.parentNode !== null) { if (t1.id === this.divName) return true; t1 = t1.parentNode; }                
            } catch (err) { }

            return false;
        }
        return false;
    }
    return false;
}

// Check an onMouseDown event to see if we should hide
function PopupWindow_hideIfNotClicked(e) {
    if (this.autoHideEnabled && !this.isClicked(e)) {
        this.hidePopup();
    }
}
// Call this to make the DIV disable automatically when mouse is clicked outside it
function PopupWindow_autoHide() {
    this.autoHideEnabled = true;
}
// This global function checks all PopupWindow objects onmouseup to see if they should be hidden
function PopupWindow_hidePopupWindows(e) {
    var localEvent;
    try {
        localEvent = event;
        if (localEvent === undefined) localEvent = e;
    } catch (err) {
        localEvent = e;
    }

    for (var i = 0; i < popupWindowObjects.length; i++) try{
        if (popupWindowObjects[i] !== null) {
            var p = popupWindowObjects[i];
            if (localEvent !== undefined)
                p.hideIfNotClicked(localEvent);            
        }
    } catch (e) {  }
}

function PopupWindow_keyupevent(e) {
    
    //27/06/2012 PS - "event" doesn't exist in Firefox but works in IE9. e doesn't work in IE9 but does in IE8
    var localEvent;
    try {
        localEvent = event;
        if (localEvent === undefined) localEvent = e;
    } catch (err) {
        localEvent = e;
    }

    //if (event.keyCode == 27) {  
    if (localEvent.keyCode == 27) {
        for (var i = 0; i < popupWindowObjects.length; i++) try{
            if (popupWindowObjects[i] !== null) {
                var p = popupWindowObjects[i];
                p.hideIfNotClicked(localEvent);
            }
        } catch (e) {  }
    }
}

// Run this immediately to attach the event listener
function PopupWindow_attachListener() {
    if (document.layers) document.captureEvents(Event.MOUSEUP);
    
    window.popupWindowOldEventListener = document.onmouseup;
    if (window.popupWindowOldEventListener !== null) {
        document.onmouseup = new Function("window.popupWindowOldEventListener(); PopupWindow_hidePopupWindows();");
    }
    else {
        document.onmouseup = PopupWindow_hidePopupWindows;
    }

    document.onkeyup = PopupWindow_keyupevent;
}
// CONSTRUCTOR for the PopupWindow object
// Pass it a DIV name to use a DHTML popup, otherwise will default to window popup
function PopupWindow() {
    if (!window.popupWindowIndex) { window.popupWindowIndex = 0; }
    if (!window.popupWindowObjects) try { window.popupWindowObjects = new Array(); } catch (e) { }
    if (!window.listenerAttached) {
        window.listenerAttached = true;
        PopupWindow_attachListener();
    }
    
    this.index = popupWindowIndex++;
    popupWindowObjects[this.index] = this;
    this.divName = null;
    this.anchorname = null;
    this.popupWindow = null;
    this.width = 0;
    this.height = 0;
    this.populated = false;
    this.visible = false;
    this.autoHideEnabled = false;

    this.contents = "";
    this.url = "";
    this.windowProperties = "toolbar=no,location=no,status=no,menubar=no,scrollbars=auto,resizable,alwaysRaised,dependent,titlebar=no";
    if (arguments.length > 0) {
        this.type = "DIV";
        this.divName = arguments[0];
        GlobalDivName = arguments[0];
    }
    else {
        this.type = "WINDOW";
    }
    this.use_gebi = false;
    this.use_css = false;
    this.use_layers = false;
    if (document.getElementById) { this.use_gebi = true; }
    else if (document.all) { this.use_css = true; }
    else if (document.layers) { this.use_layers = true; }
    else { this.type = "WINDOW"; }
    this.offsetX = 0;
    this.offsetY = 0;
    // Method mappings
    this.getXYPosition = PopupWindow_getXYPosition;
    this.MovetoScreenCenter = PopupWindow_MoveToScreenCenter;
    this.populate = PopupWindow_populate;
    this.setUrl = PopupWindow_setUrl;
    this.setWindowProperties = PopupWindow_setWindowProperties;
    this.refresh = PopupWindow_refresh;
    this.showPopup = PopupWindow_showPopup;
    this.hidePopup = PopupWindow_hidePopup;
    this.setSize = PopupWindow_setSize;
    this.isClicked = PopupWindow_isClicked;
    this.autoHide = PopupWindow_autoHide;
    this.hideIfNotClicked = PopupWindow_hideIfNotClicked;
}