var calPopup;
var gridPopup;
var AlertPopup;
var HintPopup;

var calPopup_ctrl = null;
var DisplayDateFormat = "dd MMM yyyy";

function CloseCalender() { calPopup.hideCalendar(); }

//*********************** Any Dates functions **************************

// to change the date format, 3 things need to change, the 2 formats below, and in the (PopupDateSelect_ReturnFunction) function, the way it stamps the date selected too.
function Date_TextBox_Blur(self, NotAllowedMessage, ErrorFunction) {
    if (NotAllowedMessage == "" || NotAllowedMessage == undefined)
        calPopup.clearDisabledDates();

    if ($(self).val() == "" || $(self).attr("readonly") == "readonly") // dont validate readonly fields (causes the system to lock)
        return true;

    var CheckDate = parseDate($(self).val());

    if (CheckDate == null) {
        //needs setTimout for bug in firefox
        //$.FocusControl(self, true, 10);
        $.system_alert("Not a valid date format.", self, ErrorFunction);
        return false;
    }
    else {
        if (calPopup.IsDisalowedDate(formatDate(CheckDate, "yyyyMMdd"))) {
            $(self).val(formatDate(CheckDate, DisplayDateFormat));
            //needs setTimout for bug in firefox
            $.system_alert(NotAllowedMessage, self, ErrorFunction);
            //$.FocusControl(self, true, 10);
            return false;
        }
        else if (CheckDate.getYear().toString().length < 4) { //(not 4 date format Ie 2001 = 101 in years from 1900)
            if (CheckDate.getYear() < 1) { //(2 date format)
                //$.FocusControl(self, true, 10);
                $.system_alert("Dates prior to 1901 are not allowed.", self, ErrorFunction);
                return false;
            }
            else if (CheckDate.getYear() >= 200) { //(2 date format)
                //$.FocusControl(self, true, 10);
                $.system_alert("Dates past 2099 are not allowed.", self, ErrorFunction);
                return false;
            }
            else
                $(self).val(formatDate(CheckDate, DisplayDateFormat));
        }
        else { //(4 date format - IE 2001)
            if (CheckDate.getYear() < 1901) { //(4 date format)
                //$.FocusControl(self, true, 10);
                $.system_alert("Dates prior to 1901 are not allowed.", self, ErrorFunction);
                return false;
            }
            else if (CheckDate.getYear() >= 2100) { //(4 date format)
                //$.FocusControl(self, true, 10);
                $.system_alert("Dates past 2099 are not allowed.", self, ErrorFunction);
                return false;
            }
            else
                $(self).val(formatDate(CheckDate, DisplayDateFormat));
        }
    }
    return true;
}

function PopupDateSelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

//*********************** Prior Dates only functions **************************

function PopupPriorDateOnlySelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddPriorDateOnlyFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function AddPriorDateOnlyFilter() {
    calPopup.clearDisabledDates();

    var dd = new Date();
    dd.setDate(dd.getDate() + 1);
    calPopup.addDisabledDates(formatDate(dd, DisplayDateFormat), null);

    calPopup.setYearStartEnd(null, dd.getFullYear());
}

function PopupFutureDateOnlySelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddFutureDateOnlyFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function AddFutureDateOnlyFilter() {
    calPopup.clearDisabledDates();

    var dd = new Date();
    dd.setDate(dd.getDate());
    calPopup.addDisabledDates(null, formatDate(dd, DisplayDateFormat));

    calPopup.setYearStartEnd(dd.getFullYear(),null);
}

//*********************** No blank dates blur event **************************

function NoBlank_Date_TextBox_Blur(self, NotAllowedMessage, PastOnly, ErrorFunction) {
    if ($(self).attr("readonly") == "readonly")
        return false;

    if (PastOnly) {
        calPopup_ctrl = self;
        calPopup.clearDisabledDates();
        AddPriorDateOnlyFilter();
    }

    if ($(self).val() == "") {
        $.system_alert("A Date Must Be Provided.", self, ErrorFunction);
        $(self).resetDB();
        return false;
    }

    var result = Date_TextBox_Blur(self, NotAllowedMessage, ErrorFunction);
    if (result)
        $(self).data("db", $(self).val());
    return result;
}

//***************************************************************************

function PopupDateSelect_ReturnFunction(fyear, fmonth, fday) {
    // use SHORT_MONTH_NAMES if we want jan/feb etc instead of MONTH_NAMES
    document.getElementById(calPopup_ctrl).value = LZ(fday) + " " + MONTH_NAMES[fmonth - 1] + " " + fyear;
    $("#"+calPopup_ctrl).trigger('change');
    return false;
}

//#region Notes
// HISTORY
// ------------------------------------------------------------------
// May 17, 2003: Fixed bug in parseDate() for dates <1970
// March 11, 2003: Added parseDate() function
// March 11, 2003: Added "NNN" formatting option. Doesn't match up
//                 perfectly with SimpleDateFormat formats, but
//                 backwards-compatability was required.

// ------------------------------------------------------------------
// These functions use the same 'format' strings as the
// java.text.SimpleDateFormat class, with minor exceptions.
// The format string consists of the following abbreviations:
//
// Field        | Full Form          | Short Form
// -------------+--------------------+-----------------------
// Year         | yyyy (4 digits)    | yy (2 digits), y (2 or 4 digits)
// Month        | MMM (name or abbr.)| MM (2 digits), M (1 or 2 digits)
//              | NNN (abbr.)        |
// Day of Month | dd (2 digits)      | d (1 or 2 digits)
// Day of Week  | EE (name)          | E (abbr)
// Hour (1-12)  | hh (2 digits)      | h (1 or 2 digits)
// Hour (0-23)  | HH (2 digits)      | H (1 or 2 digits)
// Hour (0-11)  | KK (2 digits)      | K (1 or 2 digits)
// Hour (1-24)  | kk (2 digits)      | k (1 or 2 digits)
// Minute       | mm (2 digits)      | m (1 or 2 digits)
// Second       | ss (2 digits)      | s (1 or 2 digits)
// AM/PM        | a                  |
//
// NOTE THE DIFFERENCE BETWEEN MM and mm! Month=MM, not mm!
// Examples:
//  "MMM d, y" matches: January 01, 2000
//                      Dec 1, 1900
//                      Nov 20, 00
//  "M/d/yy"   matches: 01/20/00
//                      9/2/00
//  "MMM dd, yyyy hh:mm:ssa" matches: "January 01, 2000 12:30:45AM"
// ------------------------------------------------------------------
//#endregion

try{
    //var SHORT_MONTH_NAMES = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    var MONTH_NAMES = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
    var DAY_NAMES = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
}
catch (e) { }

function LZ(x) { return (x < 0 || x > 9 ? "" : "0") + x; }

// ------------------------------------------------------------------
// isDate ( date_string, format_string )
// Returns true if date string matches format of format string and
// is a valid date. Else returns false.
// It is recommended that you trim whitespace around the value before
// passing it to this function, as whitespace is NOT ignored!
// ------------------------------------------------------------------
function isDate(val, format) {
    var date = getDateFromFormat(val, format);
    if (date == 0) { return false; }
    return true;
}

// -------------------------------------------------------------------
// compareDates(date1,date1format,date2,date2format)
//   Compare two date strings to see which is greater.
//   Returns:
//   1 if date1 is greater than date2
//   0 if date2 is greater than date1 of if they are the same
//  -1 if either of the dates is in an invalid format
// -------------------------------------------------------------------
function compareDates(date1, dateformat1, date2, dateformat2) {
    var d1 = getDateFromFormat(date1, dateformat1);
    var d2 = getDateFromFormat(date2, dateformat2);
    if (d1 == 0 || d2 == 0) {
        return -1;
    }
    else if (d1 > d2) {
        return 1;
    }
    return 0;
}

// ------------------------------------------------------------------
// formatDate (date_object, format)
// Returns a date in the output format specified.
// The format string uses the same abbreviations as in getDateFromFormat()
// ------------------------------------------------------------------
function formatDate(date, format) {
    format = format + "";
    var result = "";
    var i_format = 0;
    var c = "";
    var token = "";
    var y = date.getYear() + "";
    var now = new Date();
    if (date.getYear() < 0) y = now.getYear() + "";
    var M = date.getMonth() + 1;
    var d = date.getDate();
    var E = date.getDay();
    var H = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    var yyyy, yy, MMM, MM, dd, hh, h, mm, ss, ampm, HH, KK, K, kk, k;
    // Convert real date parts into formatted versions
    var value = new Object();
    if (y.length < 4) { y = "" + (y - 0 + 1900); }
    value["y"] = "" + y;
    value["yyyy"] = y;
    value["yy"] = y.substring(2, 4);
    value["M"] = M;
    value["MM"] = LZ(M);
    value["MMM"] = MONTH_NAMES[M - 1];
    value["NNN"] = MONTH_NAMES[M + 11];
    value["d"] = d;
    value["dd"] = LZ(d);
    value["E"] = DAY_NAMES[E + 7];
    value["EE"] = DAY_NAMES[E];
    value["H"] = H;
    value["HH"] = LZ(H);
    if (H == 0) { value["h"] = 12; }
    else if (H > 12) { value["h"] = H - 12; }
    else { value["h"] = H; }
    value["hh"] = LZ(value["h"]);
    if (H > 11) { value["K"] = H - 12; } else { value["K"] = H; }
    value["k"] = H + 1;
    value["KK"] = LZ(value["K"]);
    value["kk"] = LZ(value["k"]);
    if (H > 11) { value["a"] = "PM"; }
    else { value["a"] = "AM"; }
    value["m"] = m;
    value["mm"] = LZ(m);
    value["s"] = s;
    value["ss"] = LZ(s);
    while (i_format < format.length) {
        c = format.charAt(i_format);
        token = "";
        while ((format.charAt(i_format) == c) && (i_format < format.length)) {
            token += format.charAt(i_format++);
        }
        if (value[token] != null) { result = result + value[token]; }
        else { result = result + token; }
    }
    return result;
}

// ------------------------------------------------------------------
// Utility functions for parsing in getDateFromFormat()
// ------------------------------------------------------------------
function _isInteger(val) {
    var digits = "1234567890";
    for (var i = 0; i < val.length; i++) {
        if (digits.indexOf(val.charAt(i)) == -1) { return false; }
    }
    return true;
}
function _getInt(str, i, minlength, maxlength) {
    for (var x = maxlength; x >= minlength; x--) {
        var token = str.substring(i, i + x);
        if (token.length < minlength) { return null; }
        if (_isInteger(token)) { return token; }
    }
    return null;
}

// ------------------------------------------------------------------
// getDateFromFormat( date_string , format_string )
//
// This function takes a date string and a format string. It matches
// If the date string matches the format string, it returns the
// getTime() of the date. If it does not match, it returns 0.
// ------------------------------------------------------------------
function getDateFromFormat(val, format) {
    val = val + "";
    format = format + "";
    var i_val = 0;
    var i_format = 0;
    var c = "";
    var token = "";
    var token2 = "";
    var x, y;
    var now = new Date();
    var year = now.getYear();
    var month = now.getMonth() + 1;
    var date = 1;
    var hh = now.getHours();
    var mm = now.getMinutes();
    var ss = now.getSeconds();
    var ampm = "";

    while (i_format < format.length) {
        // Get next token from format string
        c = format.charAt(i_format);
        token = "";
        while ((format.charAt(i_format) == c) && (i_format < format.length)) {
            token += format.charAt(i_format++);
        }
        // Extract contents of value based on format token
        if (token == "yyyy" || token == "yy" || token == "y") {
            if (token == "yyyy") { x = 4; y = 4; }
            if (token == "yy") { x = 2; y = 2; }
            if (token == "y") { x = 2; y = 4; }
            year = _getInt(val, i_val, x, y);
            if (year == null) { return 0; }
            i_val += year.length;
            if (year.length == 2) {
                if (year > 70) { year = 1900 + (year - 0); }
                else { year = 2000 + (year - 0); }
            }
        }
        else if (token == "MMM" || token == "NNN") {
            month = 0;
            for (var i = 0; i < MONTH_NAMES.length; i++) {
                var month_name = MONTH_NAMES[i];
                if (val.substring(i_val, i_val + month_name.length).toLowerCase() == month_name.toLowerCase()) {
                    if (token == "MMM" || (token == "NNN" && i > 11)) {
                        month = i + 1;
                        if (month > 12) { month -= 12; }
                        i_val += month_name.length;
                        break;
                    }
                }
            }
            if ((month < 1) || (month > 12)) { return 0; }
        }
        else if (token == "EE" || token == "E") {
            for (var ii = 0; ii < DAY_NAMES.length; ii++) {
                var day_name = DAY_NAMES[ii];
                if (val.substring(i_val, i_val + day_name.length).toLowerCase() == day_name.toLowerCase()) {
                    i_val += day_name.length;
                    break;
                }
            }
        }
        else if (token == "MM" || token == "M") {
            month = _getInt(val, i_val, token.length, 2);
            if (month == null || (month < 1) || (month > 12)) { return 0; }
            i_val += month.length;
        }
        else if (token == "dd" || token == "d") {
            date = _getInt(val, i_val, token.length, 2);
            if (date == null || (date < 1) || (date > 31)) { return 0; }
            i_val += date.length;
        }
        else if (token == "hh" || token == "h") {
            hh = _getInt(val, i_val, token.length, 2);
            if (hh == null || (hh < 1) || (hh > 12)) { return 0; }
            i_val += hh.length;
        }
        else if (token == "HH" || token == "H") {
            hh = _getInt(val, i_val, token.length, 2);
            if (hh == null || (hh < 0) || (hh > 23)) { return 0; }
            i_val += hh.length;
        }
        else if (token == "KK" || token == "K") {
            hh = _getInt(val, i_val, token.length, 2);
            if (hh == null || (hh < 0) || (hh > 11)) { return 0; }
            i_val += hh.length;
        }
        else if (token == "kk" || token == "k") {
            hh = _getInt(val, i_val, token.length, 2);
            if (hh == null || (hh < 1) || (hh > 24)) { return 0; }
            i_val += hh.length; hh--;
        }
        else if (token == "mm" || token == "m") {
            mm = _getInt(val, i_val, token.length, 2);
            if (mm == null || (mm < 0) || (mm > 59)) { return 0; }
            i_val += mm.length;
        }
        else if (token == "ss" || token == "s") {
            ss = _getInt(val, i_val, token.length, 2);
            if (ss == null || (ss < 0) || (ss > 59)) { return 0; }
            i_val += ss.length;
        }
        else if (token == "a") {
            if (val.substring(i_val, i_val + 2).toLowerCase() == "am") { ampm = "AM"; }
            else if (val.substring(i_val, i_val + 2).toLowerCase() == "pm") { ampm = "PM"; }
            else { return 0; }
            i_val += 2;
        }
        else {
            if (val.substring(i_val, i_val + token.length) != token) { return 0; }
            else { i_val += token.length; }
        }
    }
    // If there are any trailing characters left in the value, it doesn't match
    if (i_val != val.length) { return 0; }
    // Is date valid for month?
    if (month == 2) {
        // Check for leap year
        if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) { // leap year
            if (date > 29) { return 0; }
        }
        else { if (date > 28) { return 0; } }
    }
    if ((month == 4) || (month == 6) || (month == 9) || (month == 11)) {
        if (date > 30) { return 0; }
    }
    // Correct hours value
    if (hh < 12 && ampm == "PM") { hh = hh - 0 + 12; }
    else if (hh > 11 && ampm == "AM") { hh -= 12; }
    var newdate = new Date(year, month - 1, date, hh, mm, ss);
    return newdate.getTime();
}

// ------------------------------------------------------------------
// parseDate( date_string [, prefer_euro_format] )
//
// This function takes a date string and tries to match it to a
// number of possible date formats to get the value. It will try to
// match against the following international formats, in this order:
// y-M-d   MMM d, y   MMM d,y   y-MMM-d   d-MMM-y  MMM d
// M/d/y   M-d-y      M.d.y     MMM-d     M/d      M-d
// d/M/y   d-M-y      d.M.y     d-MMM     d/M      d-M
// A second argument may be passed to instruct the method to search
// for formats like d/M/y (european format) before M/d/y (American).
// Returns a Date object or null if no patterns match.
// ------------------------------------------------------------------
function parseDate(val) {
    var preferEuro = (arguments.length == 2) ? arguments[1] : false;
    generalFormats = new Array('y-M-d', 'MMM d, y', 'MMM d,y', 'y-MMM-d', 'd-MMM-y', 'MMM d', 'd MMM yyyy', 'dd MMM yyyy');
    monthFirst = new Array('M/d/y', 'M-d-y', 'M.d.y', 'MMM-d', 'M/d', 'M-d');
    dateFirst = new Array('d/M/y', 'd-M-y', 'd.M.y', 'd-MMM', 'd/M', 'd-M', 'd MM yy', 'd MMM yy', 'dd MM yy', 'd MM yyyy', 'dd M yy', 'dd M yyyy', 'dd MM yyyy');

    var checkList = new Array('generalFormats', !preferEuro ? 'dateFirst' : 'monthFirst', !preferEuro ? 'monthFirst' : 'dateFirst');
    var d = null;
    for (var i = 0; i < checkList.length; i++) {
        var l = window[checkList[i]];
        for (var j = 0; j < l.length; j++) {
            d = getDateFromFormat(val, l[j]);
            if (d != 0) { return new Date(d); }
        }
    }
    return null;
}

//#region Notes
/*
DESCRIPTION: This object implements a popup calendar to allow the user to
select a date, month, quarter, or year.

COMPATABILITY: Works with Netscape 4.x, 6.x, IE 5.x on Windows. Some small
positioning errors - usually with Window positioning - occur on the
Macintosh platform.
The calendar can be modified to work for any location in the world by
changing which weekday is displayed as the first column, changing the month
names, and changing the column headers for each day.

USAGE:
// Create a new CalendarPopup object of type WINDOW
var cal = new CalendarPopup();

// Create a new CalendarPopup object of type DIV using the DIV named 'mydiv'
var cal = new CalendarPopup('mydiv');

// Easy method to link the popup calendar with an input box.
cal.select(inputObject, anchorname, dateFormat);
// Same method, but passing a default date other than the field's current value
cal.select(inputObject, anchorname, dateFormat, '01/02/2000');
// This is an example call to the popup calendar from a link to populate an
// input box. Note that to use this, date.js must also be included!!
<A HREF="#" onClick="cal.select(document.forms[0].date,'anchorname','MM/dd/yyyy'); return false;">Select</A>

// Set the type of date select to be used. By default it is 'date'.
cal.setDisplayType(type);

// When a date, month, quarter, or year is clicked, a function is called and
// passed the details. You must write this function, and tell the calendar
// popup what the function name is.
// Function to be called for 'date' select receives y, m, d
cal.setReturnFunction(functionname);
// Function to be called for 'month' select receives y, m
cal.setReturnMonthFunction(functionname);
// Function to be called for 'quarter' select receives y, q
cal.setReturnQuarterFunction(functionname);
// Function to be called for 'year' select receives y
cal.setReturnYearFunction(functionname);

// Show the calendar relative to a given anchor
cal.showCalendar(anchorname);

// Hide the calendar. The calendar is set to autoHide automatically
cal.hideCalendar();

// Set the month names to be used. Default are English month names
cal.setMonthNames("January","February","March",...);

// Set the month abbreviations to be used. Default are English month abbreviations
cal.setMonthAbbreviations("Jan","Feb","Mar",...);

// Show navigation for changing by the year, not just one month at a time
cal.showYearNavigation();

// Show month and year dropdowns, for quicker selection of month of dates
cal.showNavigationDropdowns();

// Set the text to be used above each day column. The days start with
// sunday regardless of the value of WeekStartDay
cal.setDayHeaders("S","M","T",...);

// Set the day for the first column in the calendar grid. By default this
// is Sunday (0) but it may be changed to fit the conventions of other
// countries.
cal.setWeekStartDay(1); // week is Monday - Sunday

// Set the weekdays which should be disabled in the 'date' select popup. You can
// then allow someone to only select week end dates, or Tuedays, for example
cal.setDisabledWeekDays(0,1); // To disable selecting the 1st or 2nd days of the week

// Selectively disable individual days or date ranges. Disabled days will not
// be clickable, and show as strike-through text on current browsers.
// Date format is any format recognized by parseDate() in date.js
// Pass a single date to disable:
cal.addDisabledDates("2003-01-01");
// Pass null as the first parameter to mean "anything up to and including" the
// passed date:
cal.addDisabledDates(null, "01/02/03");
// Pass null as the second parameter to mean "including the passed date and
// anything after it:
cal.addDisabledDates("Jan 01, 2003", null);
// Pass two dates to disable all dates inbetween and including the two
cal.addDisabledDates("January 01, 2003", "Dec 31, 2003");

// When the 'year' select is displayed, set the number of years back from the
// current year to start listing years. Default is 2.
// This is also used for year drop-down, to decide how many years +/- to display
cal.setYearSelectStartOffset(2);

// Text for the word "Today" appearing on the calendar
cal.setTodayText("Today");

// The calendar uses CSS classes for formatting. If you want your calendar to
// have unique styles, you can set the prefix that will be added to all the
// classes in the output.
// For example, normal output may have this:
//     <SPAN CLASS="cpTodayTextDisabled">Today<SPAN>
// But if you set the prefix like this:
cal.setCssPrefix("Test");
// The output will then look like:
//     <SPAN CLASS="TestcpTodayTextDisabled">Today<SPAN>
// And you can define that style somewhere in your page.

// When using Year navigation, you can make the year be an input box, so
// the user can manually change it and jump to any year
cal.showYearNavigationInput();

// Set the calendar offset to be different than the default. By default it
// will appear just below and to the right of the anchorname. So if you have
// a text box where the date will go and and anchor immediately after the
// text box, the calendar will display immediately under the text box.
cal.offsetX = 20;
cal.offsetY = 20;

NOTES:
1) Requires the functions in AnchorPosition.js and PopupWindow.js

2) Your anchor tag MUST contain both NAME and ID attributes which are the
same. For example:
<A NAME="test" ID="test"> </A>

3) There must be at least a space between <A> </A> for IE5.5 to see the
anchor tag correctly. Do not do <A></A> with no space.

4) When a CalendarPopup object is created, a handler for 'onmouseup' is
attached to any event handler you may have already defined. Do NOT define
an event handler for 'onmouseup' after you define a CalendarPopup object
or the autoHide() will not work correctly.

5) The calendar popup display uses style sheets to make it look nice.

*/
//#endregion

// Quick fix for FF3
function CP_stop(e) { if (e && e.stopPropagation) { e.stopPropagation(); } }

// the number of years tha tthe date popup will show in the cbo by default
function CP_YearOfset() {
    //if ($.Is_IPad() || $.Is_IPhone())
    //    return 50;
    //else return 21;
    return 210; // added cap < 01/01/1910 and 31/12/2099
}

// CONSTRUCTOR for the CalendarPopup Object
function CalendarPopup() {
    var c;
    if (arguments.length > 0) {
        c = new PopupWindow(arguments[0]);
    }
    else {
        c = new PopupWindow();
        c.setSize(150, 175);
    }
    c.offsetX = -152;
    c.offsetY = 25;
    c.autoHide();
    // Calendar-specific properties
    c.monthNames = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
    c.monthAbbreviations = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    c.dayHeaders = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
    c.returnFunction = "CP_tmpReturnFunction";
    c.returnMonthFunction = "CP_tmpReturnMonthFunction";
    c.returnQuarterFunction = "CP_tmpReturnQuarterFunction";
    c.returnYearFunction = "CP_tmpReturnYearFunction";
    c.weekStartDay = 0;
    c.isShowYearNavigation = false;
    c.displayType = "date";
    c.disabledWeekDays = new Object();
    c.disabledDatesExpression = "";
    c.yearSelectStartOffset = CP_YearOfset();
    c.yearSelectStart = "";
    c.yearmax = "";
    c.yearmin = "";
    c.currentDate = null;
    c.todayText = "Today";
    c.cssPrefix = "";
    c.isShowNavigationDropdowns = false;
    c.isShowYearNavigationInput = false;
    window.CP_calendarObject = null;
    window.CP_targetInput = null;
    window.CP_dateFormat = "MM/dd/yyyy";
    // Method mappings
    c.copyMonthNamesToWindow = CP_copyMonthNamesToWindow;
    c.setReturnFunction = CP_setReturnFunction;
    c.setReturnMonthFunction = CP_setReturnMonthFunction;
    c.setReturnQuarterFunction = CP_setReturnQuarterFunction;
    c.setReturnYearFunction = CP_setReturnYearFunction;
    c.setMonthNames = CP_setMonthNames;
    c.setMonthAbbreviations = CP_setMonthAbbreviations;
    c.setDayHeaders = CP_setDayHeaders;
    c.setWeekStartDay = CP_setWeekStartDay;
    c.setDisplayType = CP_setDisplayType;
    c.setDisabledWeekDays = CP_setDisabledWeekDays;
    c.addDisabledDates = CP_addDisabledDates;
    c.clearDisabledDates = CP_clearDisabledDates;
    c.IsDisalowedDate = CP_IsDisalowedDate;
    c.setYearSelectStartOffset = CP_setYearSelectStartOffset;
    c.setYearSelectStart = CP_yearSelectStart;
    c.setYearStartEnd = CP_setYearStartEnd;
    c.setTodayText = CP_setTodayText;
    c.showYearNavigation = CP_showYearNavigation;
    c.showCalendar = CP_showCalendar;
    c.hideCalendar = CP_hideCalendar;
    c.refreshCalendar = CP_refreshCalendar;
    c.getCalendar = CP_getCalendar;
    c.select = CP_select;
    c.setCssPrefix = CP_setCssPrefix;
    c.showNavigationDropdowns = CP_showNavigationDropdowns;
    c.showYearNavigationInput = CP_showYearNavigationInput;
    c.copyMonthNamesToWindow();
    // Return the object
    c.showNavigationDropdowns();
    c.setReturnFunction("PopupDateSelect_ReturnFunction");
    return c;
}
function CP_copyMonthNamesToWindow() {
    // Copy these values over to the date.js
    if (typeof (window.MONTH_NAMES) != "undefined" && window.MONTH_NAMES != null) {
        window.MONTH_NAMES = new Array();
        for (var i = 0; i < this.monthNames.length; i++) {
            window.MONTH_NAMES[window.MONTH_NAMES.length] = this.monthNames[i];
        }
        for (var i = 0; i < this.monthAbbreviations.length; i++) {
            window.MONTH_NAMES[window.MONTH_NAMES.length] = this.monthAbbreviations[i];
        }
    }
}
// Temporary default functions to be called when items clicked, so no error is thrown
function CP_tmpReturnFunction(y, m, d) {
    if (window.CP_targetInput != null) {
        var dt = new Date(y, m - 1, d, 0, 0, 0);
        if (window.CP_calendarObject != null) { window.CP_calendarObject.copyMonthNamesToWindow(); }
        window.CP_targetInput.value = formatDate(dt, window.CP_dateFormat);
    }
    else {
        alert('Use setReturnFunction() to define which function will get the clicked results!');
    }
}
function CP_tmpReturnMonthFunction(y, m) {
    alert('Use setReturnMonthFunction() to define which function will get the clicked results!\nYou clicked: year=' + y + ' , month=' + m);
}
function CP_tmpReturnQuarterFunction(y, q) {
    alert('Use setReturnQuarterFunction() to define which function will get the clicked results!\nYou clicked: year=' + y + ' , quarter=' + q);
}
function CP_tmpReturnYearFunction(y) {
    alert('Use setReturnYearFunction() to define which function will get the clicked results!\nYou clicked: year=' + y);
}

// Set the name of the functions to call to get the clicked item
function CP_setReturnFunction(name) { this.returnFunction = name; }
function CP_setReturnMonthFunction(name) { this.returnMonthFunction = name; }
function CP_setReturnQuarterFunction(name) { this.returnQuarterFunction = name; }
function CP_setReturnYearFunction(name) { this.returnYearFunction = name; }

// Over-ride the built-in month names
function CP_setMonthNames() {
    for (var i = 0; i < arguments.length; i++) { this.monthNames[i] = arguments[i]; }
    this.copyMonthNamesToWindow();
}

// Over-ride the built-in month abbreviations
function CP_setMonthAbbreviations() {
    for (var i = 0; i < arguments.length; i++) { this.monthAbbreviations[i] = arguments[i]; }
    this.copyMonthNamesToWindow();
}

// Over-ride the built-in column headers for each day
function CP_setDayHeaders() {
    for (var i = 0; i < arguments.length; i++) { this.dayHeaders[i] = arguments[i]; }
}

// Set the day of the week (0-7) that the calendar display starts on
// This is for countries other than the US whose calendar displays start on Monday(1), for example
function CP_setWeekStartDay(day) { this.weekStartDay = day; }

// Show next/last year navigation links
function CP_showYearNavigation() { this.isShowYearNavigation = (arguments.length > 0) ? arguments[0] : true; }

// Which type of calendar to display
function CP_setDisplayType(type) {
    if (type != "date" && type != "week-end" && type != "month" && type != "quarter" && type != "year") { alert("Invalid display type! Must be one of: date,week-end,month,quarter,year"); return false; }
    this.displayType = type;
}

// How many years back to start by default for year display
function CP_setYearSelectStartOffset(num) { this.yearSelectStartOffset = num; }

function CP_yearSelectStart(num) { this.yearSelectStart = num; }

function CP_setYearStartEnd(mindate, maxdate) { this.yearmax = maxdate; this.yearmin = mindate; }

// Set which weekdays should not be clickable
function CP_setDisabledWeekDays() {
    this.disabledWeekDays = new Object();
    for (var i = 0; i < arguments.length; i++) { this.disabledWeekDays[arguments[i]] = true; }
}

// simple validate to see if date is in the disallowed list
function CP_IsDisalowedDate(pDate) {
    if (!this.disabledDatesExpression) return false;
    return eval("var ds='" + pDate + "';" + this.disabledDatesExpression);
}

// clear disabled dates (for when there is > 1 date popup on a page and 1 if filtered and 1 isn't.)
function CP_clearDisabledDates() {
    this.disabledDatesExpression = "";
    this.yearmax = "";
    this.yearmin = "";
    this.yearSelectStart = "";
    this.yearSelectStartOffset = CP_YearOfset();
}
// Disable individual dates or ranges
// Builds an internal logical test which is run via eval() for efficiency
function CP_addDisabledDates(start, end) {
    if (arguments.length == 1) { end = start; }
    if (!start && !end) { return; }
    if (this.disabledDatesExpression) { this.disabledDatesExpression += "||"; }
    if (start) {
        start = parseDate(start);
        if (start) start = ("" + start.getFullYear() + LZ(start.getMonth() + 1) + LZ(start.getDate()));
    }
    if (end) {
        end = parseDate(end);
        if (end) end = ("" + end.getFullYear() + LZ(end.getMonth() + 1) + LZ(end.getDate()));
    }
    if (!start) { this.disabledDatesExpression += "(ds<=" + end + ")"; }
    else if (!end) { this.disabledDatesExpression += "(ds>=" + start + ")"; }
    else if (start && end){ this.disabledDatesExpression += "(ds>=" + start + "&&ds<=" + end + ")"; }
}

// Set the text to use for the "Today" link
function CP_setTodayText(text) {
    this.todayText = text;
}

// Set the prefix to be added to all CSS classes when writing output
function CP_setCssPrefix(val) {
    this.cssPrefix = val;
}

// Show the navigation as an dropdowns that can be manually changed
function CP_showNavigationDropdowns() { this.isShowNavigationDropdowns = (arguments.length > 0) ? arguments[0] : true; }

// Show the year navigation as an input box that can be manually changed
function CP_showYearNavigationInput() { this.isShowYearNavigationInput = (arguments.length > 0) ? arguments[0] : true; }

// Hide a calendar object
function CP_hideCalendar() {
    if (arguments.length > 0) { window.popupWindowObjects[arguments[0]].hidePopup(); }
    else { this.hidePopup(); }
}

// Refresh the contents of the calendar display
function CP_refreshCalendar(index) {
    var calObject = window.popupWindowObjects[index];
    if (arguments.length > 1) {
        calObject.populate(calObject.getCalendar(arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]));
    }
    else {
        calObject.populate(calObject.getCalendar());
    }
    calObject.refresh();
}

// Populate the calendar and display it
function CP_showCalendar(anchorname) {
    if (arguments.length > 1) {
        if (arguments[1] == null || arguments[1] == "") {
            this.currentDate = new Date();
        }
        else {
            this.currentDate = new Date(parseDate(arguments[1]));
        }
    }
    this.populate(this.getCalendar());
    this.showPopup(anchorname);
}

// Simple method to interface popup calendar with a text-entry box
function CP_select(inputobj, linkname, format) {
    // add filters so we NEVER go outside 01/01/1901 and 31/12/2099
    if (this.disabledDatesExpression.indexOf("19010101") <= 0) this.disabledDatesExpression += (this.disabledDatesExpression == "" ? "" : "||") + "ds<19010101"; // add default popup filter so cant choose < 1910
    if (this.disabledDatesExpression.indexOf("20991231") <= 0) this.disabledDatesExpression += (this.disabledDatesExpression == "" ? "" : "||") + "ds>20991231"; // add default popup filter so cant choose > 2099

    var selectedDate = (arguments.length > 3) ? arguments[3] : null;
    if (!window.getDateFromFormat) {
        alert("calendar.select: To use this method you must also include 'date.js' for date formatting");
        return;
    }
    if (this.displayType != "date" && this.displayType != "week-end") {
        alert("calendar.select: This function can only be used with displayType 'date' or 'week-end'");
        return;
    }
    if (!inputobj || (inputobj.type != "text" && inputobj.type != "hidden" && inputobj.type != "textarea")) {
        alert("calendar.select: Input object passed is not a valid form input object");
        window.CP_targetInput = null;
        return;
    }
    if (inputobj.disabled) { return; } // Can't use calendar input on disabled form input!
    window.CP_targetInput = inputobj;
    window.CP_calendarObject = this;
    this.currentDate = null;
    var time = 0;
    if (selectedDate != null) {
        time = getDateFromFormat(selectedDate, format)
    }
    else if (inputobj.value != "") {
        time = getDateFromFormat(inputobj.value, format);
    }
    if (selectedDate != null || inputobj.value != "") {
        if (time == 0) { this.currentDate = null; }
        else { this.currentDate = new Date(time); }
    }
    window.CP_dateFormat = format;
    this.showCalendar(linkname);
    setTimeout(function () { $("#Datepopup").center(undefined, true); }, 10);
}

function CP_Move(Type, Direction)
{
    var vMidx = $("#cpMonth").prop("selectedIndex"); var vYidx = $("#cpYear").prop("selectedIndex");
    if (Type == 1) {
        if (Direction == 1) {
            if (vMidx == 0 && vYidx == 0) return;

            if (vMidx == 0) { vMidx = 11; vYidx = vYidx - 1;
            } else vMidx = vMidx - 1;
        } else {
            if (vMidx == 11 && vYidx == $("#cpYear option").size() - 1) return;

            if (vMidx == 11) { vMidx = 0; vYidx = vYidx + 1;
            } else vMidx = vMidx + 1;
        }
    } else {
        if (vYidx === $("#cpYear option").size() - 1 && Direction === 2) return;
        if (vYidx == 0 && Direction === 1) return;
        (Direction == 1) ? vYidx = vYidx - 1 : vYidx = vYidx + 1;
    }

    $("#cpMonth").prop("selectedIndex", vMidx);
    $("#cpYear").prop("selectedIndex", vYidx);
    CP_refreshCalendar(0, vMidx + 1, parseInt($('#cpYear').val(), 0));
    return false;
}

// Return a string containing all the calendar code to be displayed
function CP_getCalendar() {
    var FormWidth = 410; // the size (width) of the date popup (also dynamically changes close icon left too)

    var now = new Date();
    // Reference to window
    if (this.type == "WINDOW") { var windowref = "window.opener."; }
    else { var windowref = ""; }
    var result = "<a href='#' class='popupclose' onclick='CloseCalender();' style='position: absolute; left: " + (FormWidth - 27).toString() + "px; top:6px; padding-right:0px;background-color:transparent;'> </a>";
    result += '<TABLE CLASS="' + this.cssPrefix + 'cpBorder" WIDTH=344 BORDER=0 BORDERWIDTH=1 CELLSPACING=0 CELLPADDING=1><TR><TD ALIGN=CENTER><CENTER>';
    // Code for DATE display (default)
    // -------------------------------
    if (this.displayType == "date" || this.displayType == "week-end") {
        if (this.currentDate == null) { this.currentDate = now; }
        if (arguments.length > 0) { var month = arguments[0]; }
        else { var month = this.currentDate.getMonth() + 1; }
        if (arguments.length > 1 && arguments[1] > 0 && arguments[1] - 0 == arguments[1]) { var year = arguments[1]; }
        else {
            var year = this.currentDate.getFullYear();
            if (this.yearSelectStart != "" && year == now.getFullYear()) year = this.yearSelectStart;
        }
        var daysinmonth = new Array(0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
        if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) {
            daysinmonth[2] = 29;
        }
        var current_month = new Date(year, month - 1, 1);
        var display_year = year;
        var display_month = month;
        var display_date = 1;
        var weekday = current_month.getDay();
        var offset = 0;

        offset = (weekday >= this.weekStartDay) ? weekday - this.weekStartDay : 7 - this.weekStartDay + weekday;
        if (offset > 0) {
            display_month--;
            if (display_month < 1) { display_month = 12; display_year--; }
            display_date = daysinmonth[display_month] - offset + 1;
        }
        var next_month = month + 1;
        var next_month_year = year;
        if (next_month > 12) { next_month = 1; next_month_year++; }
        var last_month = month - 1;
        var last_month_year = year;
        if (last_month < 1) { last_month = 12; last_month_year--; }
        var date_class;
        if (this.type != "WINDOW") {
            result += "<TABLE WIDTH=90% BORDER=0 BORDERWIDTH=0 CELLSPACING=0 CELLPADDING=0>";
        }

        result += '<TR><td colspan="7" style="text-align:center;"><h2 id="dp_h2_cap">Date Selector</h2></td></tr>';
        result += '<TR>';
        var refresh = windowref + 'CP_refreshCalendar';
        var refreshLink = 'javascript:' + refresh;
        if (this.isShowNavigationDropdowns) {
            result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="180" COLSPAN="3" style="white-space: nowrap;">';
            result += '<input type="button" class="cpPrevMonth" title="Previous Month" onclick="return CP_Move(1, 1);"/>';
            result += '<select CLASS="' + this.cssPrefix + 'cpMonthNavigation" name="cpMonth" id="cpMonth" onmouseup="CP_stop(event)" onChange="' + refresh + '(' + this.index + ',this.options[this.selectedIndex].value-0,' + (year - 0) + ');">';
            for (var monthCounter = 1; monthCounter <= 12; monthCounter++) {
                var selected = (monthCounter == month) ? 'SELECTED' : '';
                result += '<option value="' + monthCounter + '" ' + selected + '>' + this.monthNames[monthCounter - 1] + '</option>';}
            result += '</select>';
            result += '&nbsp;&nbsp;<input type="button" class="cpNextMonth" title="Next Month" onclick="return CP_Move(1, 2);"/>';
            result += '</TD>';
            result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="30">&nbsp;</TD>';
            result += '<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="140" COLSPAN="3" style="white-space: nowrap;">';
            result += '<input type="button" class="cpPrevMonth" title="Previous Year" onclick="return CP_Move(2, 1);"/>';
            result += '<select CLASS="' + this.cssPrefix + 'cpYearNavigation" name="cpYear" id="cpYear"  onmouseup="CP_stop(event)" onChange="' + refresh + '(' + this.index + ',' + month + ',this.options[this.selectedIndex].value-0);">';

            var UseStart = year - this.yearSelectStartOffset;
            var UseEnd = year + this.yearSelectStartOffset;
            //var ChangedByMax = 0;
            //var ChangedByMin = 0;
            //if (this.yearmax != "" && parseInt(this.yearmax) < UseEnd) { ChangedByMax = UseEnd - parseInt(this.yearmax); UseEnd = parseInt(this.yearmax); /*alert(ChangedByMax);*/};
            //if (this.yearmin != "" && parseInt(this.yearmin) < UseStart) { ChangedByMin = parseInt(this.yearmax) - UseStart; UseStart = parseInt(this.yearmin); /*alert(ChangedByMin);*/ };

            if (this.yearmax != "" && parseInt(this.yearmax) < UseEnd) UseEnd = this.yearmax;
            if (this.yearmin != "" && parseInt(this.yearmin) > UseStart) UseStart = this.yearmin;
            if (UseStart < 1901) UseStart = 1901;
            if (UseEnd > 2099) UseEnd = 2099;

            for (var yearCounter = UseStart; yearCounter <= UseEnd; yearCounter++) {
                var selected = (yearCounter == year) ? 'SELECTED' : '';
                result += '<option value="' + yearCounter + '" ' + selected + '>' + yearCounter + '</option>';
            }

            result += '</select>';
            result += '&nbsp;&nbsp;<input type="button" class="cpNextMonth" title="Next Year" onclick="return CP_Move(2, 2);"/>';
            result += '</TD>';
        }
        else {
            if (this.isShowYearNavigation) {
                result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="10"><A CLASS="' + this.cssPrefix + 'cpMonthNavigation" HREF="' + refreshLink + '(' + this.index + ',' + last_month + ',' + last_month_year + ');">&lt;</A></TD>';
                result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="58"><SPAN CLASS="' + this.cssPrefix + 'cpMonthNavigation">' + this.monthNames[month - 1] + '</SPAN></TD>';
                result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="10"><A CLASS="' + this.cssPrefix + 'cpMonthNavigation" HREF="' + refreshLink + '(' + this.index + ',' + next_month + ',' + next_month_year + ');">&gt;</A></TD>';
                result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="10">&nbsp;</TD>';

                result += '<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="10"><A CLASS="' + this.cssPrefix + 'cpYearNavigation" HREF="' + refreshLink + '(' + this.index + ',' + month + ',' + (year - 1) + ');">&lt;</A></TD>';
                if (this.isShowYearNavigationInput) {
                    result += '<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="36"><INPUT NAME="cpYear" CLASS="' + this.cssPrefix + 'cpYearNavigation" SIZE="4" MAXLENGTH="4" VALUE="' + year + '" onBlur="' + refresh + '(' + this.index + ',' + month + ',this.value-0);"></TD>';
                }
                else {
                    result += '<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="36"><SPAN CLASS="' + this.cssPrefix + 'cpYearNavigation">' + year + '</SPAN></TD>';
                }
                result += '<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="10"><A CLASS="' + this.cssPrefix + 'cpYearNavigation" HREF="' + refreshLink + '(' + this.index + ',' + month + ',' + (year + 1) + ');">&gt;</A></TD>';
            }
            else {
                result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="22"><A CLASS="' + this.cssPrefix + 'cpMonthNavigation" HREF="' + refreshLink + '(' + this.index + ',' + last_month + ',' + last_month_year + ');">&lt;&lt;</A></TD>\n';
                result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="100"><SPAN CLASS="' + this.cssPrefix + 'cpMonthNavigation">' + this.monthNames[month - 1] + ' ' + year + '</SPAN></TD>\n';
                result += '<TD CLASS="' + this.cssPrefix + 'cpMonthNavigation" WIDTH="22"><A CLASS="' + this.cssPrefix + 'cpMonthNavigation" HREF="' + refreshLink + '(' + this.index + ',' + next_month + ',' + next_month_year + ');">&gt;&gt;</A></TD>\n';
            }
        }
        result += '</TR></TABLE><TABLE WIDTH=' + FormWidth.toString() + ' BORDER=0 CELLSPACING=6 CELLPADDING=1 ALIGN=CENTER><TR>';
        for (var j = 0; j < 7; j++) {
            result += '<TD CLASS="' + this.cssPrefix + 'cpDayColumnHeader" WIDTH="14%"><SPAN CLASS="' + this.cssPrefix + 'cpDayColumnHeader">' + this.dayHeaders[(this.weekStartDay + j) % 7] + '</TD>\n';
        }
        result += '</TR>\n';
        for (var row = 1; row <= 6; row++) {
            result += '<TR>\n';
            for (var col = 1; col <= 7; col++) {
                var disabled = false;
                if (this.disabledDatesExpression != "") {
                    eval("var ds='" + display_year + LZ(display_month) + LZ(display_date) + "';disabled=(" + this.disabledDatesExpression + ")");
                }
                var dateClass = "";
                if ((display_month == this.currentDate.getMonth() + 1) && (display_date == this.currentDate.getDate()) && (display_year == this.currentDate.getFullYear())) {
                    dateClass = "cpCurrentDate";
                }
                else if ((display_month == now.getMonth() + 1) && (display_date == now.getDate()) && (display_year == now.getFullYear())) {
                    dateClass = "cpTodaysDate";
                }
                else if (display_month == month) {
                    dateClass = "cpCurrentMonthDate";
                }
                else {
                    dateClass = "cpOtherMonthDate";
                }
                if (disabled || this.disabledWeekDays[col - 1]) {
                    result += '	<TD CLASS="' + this.cssPrefix + dateClass + '"><SPAN CLASS="' + this.cssPrefix + dateClass + 'Disabled">' + display_date + '</SPAN></TD>\n';
                }
                else {
                    var selected_date = display_date;
                    var selected_month = display_month;
                    var selected_year = display_year;
                    if (this.displayType == "week-end") {
                        var d = new Date(selected_year, selected_month - 1, selected_date, 0, 0, 0, 0);
                        d.setDate(d.getDate() + (7 - col));
                        selected_year = d.getYear();
                        if (selected_year < 1000) { selected_year += 1900; }
                        selected_month = d.getMonth() + 1;
                        selected_date = d.getDate();
                    }
                    result += '	<TD CLASS="' + this.cssPrefix + dateClass + '"><A HREF="javascript:' + windowref + this.returnFunction + '(' + selected_year + ',' + selected_month + ',' + selected_date + ');' + windowref + 'CP_hideCalendar(\'' + this.index + '\');" CLASS="' + this.cssPrefix + dateClass + '">' + display_date + '</A></TD>\n';
                }
                display_date++;
                if (display_date > daysinmonth[display_month]) {
                    display_date = 1;
                    display_month++;
                }
                if (display_month > 12) {
                    display_month = 1;
                    display_year++;
                }
            }
            result += '</TR>';
        }
        var current_weekday = now.getDay() - this.weekStartDay;
        if (current_weekday < 0) {
            current_weekday += 7;
        }
        result += '<TR>\n';
        result += '	<TD COLSPAN=7 ALIGN=CENTER CLASS="' + this.cssPrefix + 'cpTodayText">\n';
        if (this.disabledDatesExpression != "") {
            eval("var ds='" + now.getFullYear() + LZ(now.getMonth() + 1) + LZ(now.getDate()) + "';disabled=(" + this.disabledDatesExpression + ")");
        }
        if (disabled || this.disabledWeekDays[current_weekday + 1]) {
            result += '		<SPAN CLASS="' + this.cssPrefix + 'cpTodayTextDisabled">' + this.todayText + '</SPAN>\n';
        }
        else {
            result += '		<A CLASS="' + this.cssPrefix + 'cpTodayText" HREF="javascript:' + windowref + this.returnFunction + '(\'' + now.getFullYear() + '\',\'' + (now.getMonth() + 1) + '\',\'' + now.getDate() + '\');' + windowref + 'CP_hideCalendar(\'' + this.index + '\');">' + this.todayText + '</A>\n';
        }
        result += '		<BR>\n';
        result += '	</TD></TR></TABLE></CENTER></TD></TR></TABLE>\n';
    }

    // Code common for MONTH, QUARTER, YEAR
    // ------------------------------------
    if (this.displayType == "month" || this.displayType == "quarter" || this.displayType == "year") {
        if (arguments.length > 0) { var year = arguments[0]; }
        else {
            if (this.displayType == "year") { var year = now.getFullYear() - this.yearSelectStartOffset; }
            else { var year = now.getFullYear(); }
        }
        if (this.displayType != "year" && this.isShowYearNavigation) {
            result += "<TABLE WIDTH=144 BORDER=0 BORDERWIDTH=0 CELLSPACING=0 CELLPADDING=0>";
            result += '<TR>\n';
            result += '	<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="22"><A CLASS="' + this.cssPrefix + 'cpYearNavigation" HREF="javascript:' + windowref + 'CP_refreshCalendar(' + this.index + ',' + (year - 1) + ');">&lt;&lt;</A></TD>\n';
            result += '	<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="100">' + year + '</TD>\n';
            result += '	<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="22"><A CLASS="' + this.cssPrefix + 'cpYearNavigation" HREF="javascript:' + windowref + 'CP_refreshCalendar(' + this.index + ',' + (year + 1) + ');">&gt;&gt;</A></TD>\n';
            result += '</TR></TABLE>\n';
        }
    }

    // Code for MONTH display
    // ----------------------
    if (this.displayType == "month") {
        // If POPUP, write entire HTML document
        result += '<TABLE WIDTH=120 BORDER=0 CELLSPACING=1 CELLPADDING=0 ALIGN=CENTER>\n';
        for (var i = 0; i < 4; i++) {
            result += '<TR>';
            for (var j = 0; j < 3; j++) {
                var monthindex = ((i * 3) + j);
                result += '<TD WIDTH=33% ALIGN=CENTER><A CLASS="' + this.cssPrefix + 'cpText" HREF="javascript:' + windowref + this.returnMonthFunction + '(' + year + ',' + (monthindex + 1) + ');' + windowref + 'CP_hideCalendar(\'' + this.index + '\');" CLASS="' + date_class + '">' + this.monthAbbreviations[monthindex] + '</A></TD>';
            }
            result += '</TR>';
        }
        result += '</TABLE></CENTER></TD></TR></TABLE>\n';
    }

    // Code for QUARTER display
    // ------------------------
    if (this.displayType == "quarter") {
        result += '<BR><TABLE WIDTH=120 BORDER=1 CELLSPACING=0 CELLPADDING=0 ALIGN=CENTER>\n';
        for (var i = 0; i < 2; i++) {
            result += '<TR>';
            for (var j = 0; j < 2; j++) {
                var quarter = ((i * 2) + j + 1);
                result += '<TD WIDTH=50% ALIGN=CENTER><BR><A CLASS="' + this.cssPrefix + 'cpText" HREF="javascript:' + windowref + this.returnQuarterFunction + '(' + year + ',' + quarter + ');' + windowref + 'CP_hideCalendar(\'' + this.index + '\');" CLASS="' + date_class + '">Q' + quarter + '</A><BR><BR></TD>';
            }
            result += '</TR>';
        }
        result += '</TABLE></CENTER></TD></TR></TABLE>\n';
    }

    // Code for YEAR display
    // ---------------------
    if (this.displayType == "year") {
        var yearColumnSize = 4;
        result += "<TABLE WIDTH=144 BORDER=0 BORDERWIDTH=0 CELLSPACING=0 CELLPADDING=0>";
        result += '<TR>\n';
        result += '	<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="50%"><A CLASS="' + this.cssPrefix + 'cpYearNavigation" HREF="javascript:' + windowref + 'CP_refreshCalendar(' + this.index + ',' + (year - (yearColumnSize * 2)) + ');">&lt;&lt;</A></TD>\n';
        result += '	<TD CLASS="' + this.cssPrefix + 'cpYearNavigation" WIDTH="50%"><A CLASS="' + this.cssPrefix + 'cpYearNavigation" HREF="javascript:' + windowref + 'CP_refreshCalendar(' + this.index + ',' + (year + (yearColumnSize * 2)) + ');">&gt;&gt;</A></TD>\n';
        result += '</TR></TABLE>\n';
        result += '<TABLE WIDTH=120 BORDER=0 CELLSPACING=1 CELLPADDING=0 ALIGN=CENTER>\n';
        for (var i = 0; i < yearColumnSize; i++) {
            for (var j = 0; j < 2; j++) {
                var currentyear = year + (j * yearColumnSize) + i;
                result += '<TD WIDTH=50% ALIGN=CENTER><A CLASS="' + this.cssPrefix + 'cpText" HREF="javascript:' + windowref + this.returnYearFunction + '(' + currentyear + ');' + windowref + 'CP_hideCalendar(\'' + this.index + '\');" CLASS="' + date_class + '">' + currentyear + '</A></TD>';
            }
            result += '</TR>';
        }
        result += '</TABLE></CENTER></TD></TR></TABLE>\n';
    }
    // Common
    if (this.type == "WINDOW") {
        result += "</BODY></HTML>\n";
    }
    return result;
}
