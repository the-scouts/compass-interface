jQuery.extend({
    forceInline: function () {
        var vForce = $.Is_Android() || $.Is_IPhone();
        return vForce;
    }, // the list of items that are forced to inline mode

    FocusControl: function (ctrl, Selectall, delay) { window.setTimeout(function () { $(ctrl).focus(); if (Selectall) try { $(ctrl).select(); } catch (e) { } }, (delay ? delay : 100)); return $(ctrl); },

    Browser: function () {
        // the order this is done is important, as mozilla shows in Safari etc..!
        if ($.Is_MSIE(11)) { return "MSIE11+"; } // just checking for MS and not 7,8,9,10 so will be 11+12+13 etc (hopefully)
        else if ($.Is_MSIE(10)) { return "MSIE10"; }
        else if ($.Is_MSIE(9)) { return "MSIE9"; }
        else if ($.Is_MSIE(8)) { return "MSIE8"; }
        else if ($.Is_MSIE(7)) { return "MSIE7"; }
        else if ($.Is_MSIE()) { return "MSIE"; }
        else if (navigator.userAgent.indexOf("Chrome") !== -1) { return "CHROME"; }
        else if (navigator.userAgent.match(/iPad/i)) { return "IPAD"; }
        else if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) { return "IPHONE"; }
        else if (navigator.userAgent.indexOf("Android") !== -1) { return "ANDROID"; }
        else if (navigator.userAgent.indexOf("Safari") !== -1 && navigator.userAgent.indexOf("Mac OS X") !== -1) { return "SAFARI_MAC"; }
        else if (navigator.userAgent.indexOf("Safari") !== -1) { return "SAFARI"; }
        else if (navigator.userAgent.indexOf("Opera") !== -1) { return "OPERA"; }
        else if (navigator.userAgent.indexOf("Firefox") !== -1) { return "FIREFOX"; }
        else { return "UNKNOWN"; }
    },
    Is_CompatibilityMode: function () {
        try {
            return (($.Is_MSIE() && !$.Is_MSIE(11)) && (Sys.Browser.documentMode !== Sys.Browser.version || Sys.Browser.documentMode < 8 || (Sys.Browser.documentMode > 8 && $("body").css("background-image") === "none")));
        } catch (e) { return false; }
    },
    Is_Chrome: function () { return $.Browser() === "CHROME"; },
    Is_FireFox: function () { return $.Browser() === "FIREFOX"; },
    Is_IPad: function () { return $.Browser() === "IPAD"; },
    Is_IPhone: function () { return $.Browser() === "IPHONE"; },
    Is_Android: function () { return $.Browser() === "ANDROID"; },
    Is_MacSafari: function () {$.Browser() === "SAFARI_MAC"; },
    Is_Safari: function (ExclMac) {
        if (ExclMac)
            return $.Browser() === "SAFARI";
        return $.Browser() === "SAFARI" || $.Browser() === "SAFARI_MAC";
    },
    Is_Opera: function () { return $.Browser() === "OPERA"; },
    Is_MSIE: function (version) {
        try {
            if (version === undefined) {
                return (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) || !!window.MSStream;
            }
            else {
                if (version > 10) // check if its Ms but not the versions we can work out, therefore its > MSIE10 (11,12,13 etc should all work here automatically(hopefully))
                    return !!window.MSStream && !$.Is_MSIE(7) && !$.Is_MSIE(8) && !$.Is_MSIE(9) && !$.Is_MSIE(10);
                else
                    return (navigator.appVersion.indexOf("MSIE " + version + ".") !== -1);
            }
        } catch (e) { return false; }
    },

    SetLogo: function (ctrl, ServerURN) {
        var img = $(ctrl);
        try
        {
            if ($.Is_MSIE(11)) { img.css({ "background-image": "url('/Images/Logos/IE11.jpg')", "alt": "IE11" }); }
            else if ($.Is_MSIE(10)) { img.css({ "background-image": "url('/Images/Logos/IE10.jpg')", "alt": "IE10" }); }
            else if ($.Is_MSIE(9)) { img.css({ "background-image": "url('/Images/Logos/IE9.jpg')", "alt": "IE9" }); }
            else if ($.Is_MSIE(8)) { img.css({ "background-image": "url('/Images/Logos/IE8.jpg')", "alt": "IE8" }); }
            else if ($.Is_MSIE(7)) { img.css({ "background-image": "url('/Images/Logos/IE7.jpg')", "alt": "IE7" }); }
            else if ($.Is_MSIE()) { img.css({ "background-image": "url('/Images/Logos/IE.jpg')", "alt": "IE?" }); }
            else if ($.Is_Chrome()) { img.css({ "background-image": "url('/Images/Logos/chrome.jpg')", "alt": "Chrome" }); }
            else if ($.Is_IPad() || $.Is_IPhone()) { img.css({ "background-image": "url('/Images/Logos/apple.jpg')", "alt": "iPad/iPhone" }); }
            else if ($.Is_Android()) { img.css({ "background-image": "url('/Images/Logos/android.jpg')", "alt": "Android" }); }
            else if ($.Is_Safari() || $.Is_MacSafari()) { img.css({ "background-image": "url('/Images/Logos/safari.jpg')", "alt": "Safari" }); }
            else if ($.Is_Opera()) { img.css({ "background-image": "url('/Images/Logos/opera.jpg')", "alt": "Opera" }); }
            else if ($.Is_FireFox()) { img.css({ "background-image": "url('/Images/Logos/firefox.jpg')", "alt": "Firefox" }); }
            else { img.css({ "background-image": "url('/Images/Logos/unknown.jpg')", "alt": "Unknown" }); }
        }
        catch (e) {
            img.css({ "background-image": "url('/Images/Logos/unknown.jpg')", "alt": "Unknown" });
        }
        img.attr("title", "[" + ServerURN + "] " + navigator.userAgent);
    },

    Is_SupportedBrowser: function () {
        // not < IE 7
        if ($.Is_MSIE(6) || $.Is_MSIE(5)) {
            top.location = 'MSG/NotSupportedIE.html';
        }
        // Not Anything other than (IE/Chrome/Firefox/Ipad/Android/Safari)
        if (!($.Is_MSIE() || $.Is_Chrome() || $.Is_FireFox() || $.Is_IPad() || $.Is_IPhone() || $.Is_Android() || $.Is_Safari())) {
            top.location = 'MSG/NotSupported.html';
        }
    },

    Is_Clicked : function (e,divName) {
        if (divName !== undefined) {
            if (this.use_layers) {
                var clickX = e.pageX;
                var clickY = e.pageY;
                var t = document.layers[divName];
                return ((clickX > t.left) && (clickX < t.left + t.clip.width) && (clickY > t.top) && (clickY < t.top + t.clip.height));
            }
            else if (document.all || $.Is_IPad() || $.Is_IPhone() || $.Is_Android()) { // Need to hard-code this to trap IE for error-handling
                var t2 = window.event.srcElement;
                while (t2 && t2.parentElement) {
                    if (t2.id === divName || "." + t2.className === divName || "#" + t2.id === divName) return true;
                    t2 = t2.parentElement;
                }
            }
            else if (this.use_gebi && e) {
                try {
                    var t1 = e.relatedTarget || e.toElement || e.target;
                    while (t1 && t1.parentNode) {
                        if (t1.id === divName) return true;
                        t1 = t1.parentNode;
                    }
                } catch (err) { }
            }
        }
        return false;
    },

    system_hint: function (msg, title) {
        Show_Hint(title, true, msg);
        setTimeout(DoResize, 500);
    },

    system_window: function (msg, title, buttons, buttonCount) {
        Show_Hint(title, false, msg, buttons, buttonCount);

        if (buttons)
            $('.Alert_overlay').css({ 'visibility': 'hidden' }).css({ 'visibility': 'visible', 'display': 'none' }).fadeIn(100, function () { setTimeout(CenterMainPopups, 100); });
        else
            setTimeout(CenterMainPopups, 100);
    },

    system_alert: function (msg, FocusControl, OK_Event, ForceSystemDialogue, AltCaption) {
        if (!ForceSystemDialogue) {
            Show_Alert("AlertPopup", msg.replace(/\r\n/g, "<br/>"), false, FocusControl, OK_Event,undefined, AltCaption);
        }
        else {
            alert(msg.replace(/\<[Bb][Rr] *\/\>/g, "\r\n"));
            if (FocusControl) { $.FocusControl(FocusControl, true, 10); }
            if (OK_Event) { OK_Event(); }
        }
        setTimeout(DoResize, 100);
    },

    system_confirm: function (msg, OK_Event, Cancel_Event, ForceSystemDialogue, AltCaption) {
        if (!ForceSystemDialogue) {
            Show_Alert("AlertPopup", msg.replace(/\r\n/g, "<br/>").replace(/\r\n/g, "<br />"), true, undefined, OK_Event, Cancel_Event, AltCaption);
        }
        else {
            if (confirm(msg.replace(/\<[Bb][Rr] *\/\>/g, "\r\n"))) { if (OK_Event) OK_Event(); }
            else { if (Cancel_Event) Cancel_Event(); }
        }
        setTimeout(DoResize, 100);
    },

    member_search: function (Source, OK_Event, AltCaption, SearchFromON, NotCN) { // NOTE: OK_Event needs 2 params : CN / Name
        Show_MemberSearch(Source, OK_Event, AltCaption, SearchFromON, !NotCN ? -1 : NotCN);
        setTimeout(DoResize, 100);
    },

    validate_member: function (Source, OK_Event, Invalid_Event, CheckCN, SearchFromON, NotCN) { // NOTE: OK_Event needs 2 params : CN / Name
        Valid_Member(Source, OK_Event, Invalid_Event, CheckCN, SearchFromON, !NotCN ? -1 : NotCN);
    },

    AttrToData: function (value) {
        if ($('[' + value + ']').size() > 0)
            $('[' + value + ']').each(function () { $(this).A2D(value); });
        if (value.toLowerCase().indexOf("data-") < 0 && $('[data-' + value + ']').size() > 0)
            $('[data-' + value + ']').each(function () { $(this).A2D(value); });
    }
});

(function ($) {
    $.fn.purgeFrame = function () {
        var deferred;

        if ($.Is_MSIE(8)) {
            deferred = purge(this);
        } else {
            this.remove();
            deferred = $.Deferred();
            deferred.resolve();
        }

        return deferred;
    };

    function purge($frame) {
        var sem = $frame.length
          , deferred = $.Deferred();

        $frame.load(function () {
            var frame = this;
            frame.contentWindow.document.innerHTML = '';

            sem -= 1;
            if (sem <= 0) {
                $frame.remove();
                deferred.resolve();
            }
        });
        $frame.attr('src', 'about:blank');

        if ($frame.length === 0) {
            deferred.resolve();
        }

        return deferred.promise();
    }

    $.fn.filterByData = function (prop, val) {
        var $self = this;
        if (typeof val === 'undefined') {
            return $self.filter(
                function () { return typeof $(this).data(prop) !== 'undefined'; }
            );
        }
        return $self.filter(
            function () { return $(this).data(prop) === val; }
        );
    };

})(window.jQuery);

$(document).ready(function () {
    //global form ready event (sets all Attributes we want hidden to be data objects instead)

    // put values in Data, so we can checkksum
    //var DecodedData = decodeURI($('#ctl00__POST_CTRL').val());
    $('#ctl00__POST_CTRL').data('chk', $('#ctl00__POST_CTRL').val()); // store encoded version
    $('#ctl00__POST_MD5').data('chk', $('#ctl00__POST_MD5').val());

    // put variables into seperate Data objects
    var SafeCTRL = $('#ctl00__POST_CTRL');
    var PageVariables = "";
    var ShowVar = false;
    if ($('#ctl00__POST_CTRL').val())
        for (var i = 0; i < $('#ctl00__POST_CTRL').val().split('~').length; i++) {
            var item = $('#ctl00__POST_CTRL').val().split('~')[i];

            if (item.split('#').length > 1) {
                $(SafeCTRL).data(item.split('#')[0].toLowerCase(), item.split('#')[1]);
                if (item.split('#')[0].toLowerCase() === "Master.Sys.ShowPageVariables".toLowerCase()) ShowVar = true;
                PageVariables += "<tr><td>" + item.split('#')[0] + "</td><td>" + item.split('#')[1] + "</td></tr>";
            }
        }

    if (ShowVar)
        setTimeout(function () { $.system_hint("<table style='max-width:400px;width:400px;'>" + PageVariables + "</table>", "<h2>System Variables</h2>"); }, 1000);

    // move DB values to Data object
    $.AttrToData("db");
});

function GetFontSize() {
    //0=big,1=med (default),2=small
    try
    {
        var vSize = pk_val("Master.Sys.TextSize");
        if (vSize === "0")
            return "x-small";
        else if (vSize === "2")
            return "8px";
        else
            return "xx-small";
    }
    catch (e) {
        return "xx-small";
    }
}

var vCountdownIDX = 0;
var vPopCountdownIDX = 0;
function clear_countdown(idx) {
    if (!idx) return;
    clearInterval(idx);
    if (idx === vCountdownIDX) vCountdownIDX = 0;
    if (idx === vPopCountdownIDX) vPopCountdownIDX = 0;
    window.status = "";
}

if (!jQuery.fn.countdown) {
    jQuery.fn.countdown = function (callback, duration, message, redforlast, windowsstatus) {
        // If no message is provided, we use an empty string
        message = message || "";
        // Get reference to container, and set initial content
        var container = $(this[0]).html(duration + message);
        // Get reference to the interval doing the countdown
        var CountdownIDX = setInterval(function () {
            // If seconds remain
            if (--duration) {
                // Update our container's message
                if (isNaN(duration))
                    duration = 0;

                if (redforlast && duration < redforlast)
                    $(container).css("color", "red");

                container.html(duration + message);

                if (windowsstatus)
                    window.status = windowsstatus + duration + message;
                // Otherwise
            } else {
                // Clear the countdown interval
                clear_countdown(CountdownIDX);
                // And fire the callback passing our container as `this`
                callback.call(container);
            }
            // Run interval every 1000ms (1 second)
        }, 1000);

        return CountdownIDX;
    };
}

if (!jQuery.fn.A2D) {
    jQuery.fn.A2D = function (value) {
        if (value === "DB")
            value = "db";

        if ($(this).attr(value))
            $(this).data(value.replace("data-", ""), $(this).attr(value)).removeAttr(value);
        else
            $(this).removeAttr(value);

        if (value.indexOf("data-") < 0 && $(this).attr("data-" + value))
            $(this).data(value.replace("data-", ""), $(this).attr("data-" + value)).removeAttr("data-" + value);
        else
            $(this).removeAttr("data-" + value);
    };
}

if (!jQuery.fn.AttrToData) { jQuery.fn.AttrToData = function (value) { $(this).each(function () { $(this).A2D(value); }); return this; }; }

if (!jQuery.fn.resetDB) {
    jQuery.fn.resetDB = function (defaultValue) {
        // dont do hidden fields
        if ($(this).length === 0 || $(this)[0].type === "hidden")
            return this;

        var OrigDBValue = $(this).data("db") || $(this).data("DB") || $(this).attr("DB") || $(this).attr("db");

        if ($(this).is(":checkbox")) {
            if (OrigDBValue === "True" || OrigDBValue === "true" || (OrigDBValue && defaultValue === "True"))
                $(this).prop("checked", "checked");
            else
                $(this).removeAttr("checked");
        }
        else {
            if (OrigDBValue)
                $(this).val(OrigDBValue);
            else if (defaultValue)
                $(this).val(defaultValue);
            else
                $(this).val("");

            if ($(this).is("textarea"))
                $(this).trigger("change");
        }

        return this;
    };
}

if (!jQuery.fn.autosize) {
    jQuery.fn.autosize = function (MaxRows) {
        var MinRows = $(this).attr("rows");

        $(this).on('input propertychange keyup change', function () {
            var CRs = this.value.match(/\n/g) ? this.value.match(/\n/g).length + 1 : 1;

            if (MaxRows && CRs > MaxRows) CRs = MaxRows;
            this.rows = (CRs <= MinRows ? MinRows : CRs);

            if ($(this)[0].scrollHeight > 0) {
                var TextHeight = Math.ceil(parseFloat($("textarea").css('font-size').replace("px", ""))) + 2;
                var MaybeRows = Math.ceil(($(this)[0].scrollHeight - 10) / TextHeight);

                if (MaybeRows > this.rows)
                    this.rows = (MaybeRows > MaxRows ? MaxRows : MaybeRows);
            }
        });

        $(this).trigger("propertychange");
    };
}

if (!jQuery.fn.isRequired) {
    jQuery.fn.isRequired = function () {
        return $(this).attr("req") === "Y" || $(this).attr("required") === "required";
    };
}

if (!jQuery.fn.makeRequired) {
    jQuery.fn.makeRequired = function (showSpan) {
        $(this).attr("required", "required");
        if (showSpan) $(this).nextAll('span.rfv:first').css({ 'visibility': 'visible' });

        return this;
    };
}

if (!jQuery.fn.makeNotRequired) {
    jQuery.fn.makeNotRequired = function (hideSpan) {
        $(this).removeAttr("required").removeAttr("req");
        if (hideSpan) $(this).nextAll('span.rfv:first').css({ 'visibility': 'hidden' });
        return this;
    };
}

if (!jQuery.fn.center) {
    jQuery.fn.center = function (fixtop, force) {
        var OrigTop = $(this).css("top");
        var top = "";
        var left = "";

        if (!force && $(this).attr("xVis") !== "Y") return;

        if ($.Is_MSIE(7) || $.Is_MSIE(8)) {
            if ($(this).attr("id") === "Datepopup" || $(this).attr("id") === "GridColPopup" || $(this).attr("id") === "AlertBox" || $(this).attr("id") === "HintBox") {
                if ($(this).attr("id") === "Datepopup" || $(this).attr("id") === "GridColPopup") {
                    top = Math.max(0, ($(window).height() - parseInt($(this).css("height").replace('px', ''), 10)) / 2);
                    left = Math.max(0, (($(window).width() / 2) - parseInt($(this).css("width").replace('px', ''), 10) / 2));
                }
                else
                {
                    var hh = (!$(this).css("height").replace('px', '') ? 0 : parseInt($(this).css("height").replace('px', ''),10));
                    if (hh === 0 && $('#divPopsize', $(this)).length > 0)
                        top = Math.max(0, ($(window).height() - $('#divPopsize', $(this))[0].clientHeight) / 2);
                    else
                        top = Math.max(0, ($(window).height() - hh) / 2);
                    left = Math.max(0, (($(window).width() / 2) - parseInt($(this).css("width").replace('px', ''), 10)));
                }
            }
            else {
                top = Math.max(0, ($(window.parent).height() - parseInt($(this).css("height").replace('px', ''), 10)) / 2);
                left = Math.max(0, ($(window.parent).width() - parseInt($(this).css("width").replace('px', ''), 10)) / 2);
            }
        }
        else {
            var h = $(this).outerHeight();

            // extra adjuster for alert popu centralisation (used a auto size div on alert setup code below)
            if (h === 0 && $('#divPopsize', $(this))[0])
                h = $('#divPopsize', $(this))[0].clientHeight - 50;

            if (!pk_UsePopup())
            {
                top = Math.max(0, (($(window).height() - h) / 2));
                left = Math.max(0, (($(window).width() - $(this).outerWidth()) / 2));
            }
            else
            {
                top = Math.max(0, (($(window).height() - h) / 2) + $(window).scrollTop());
                left = Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft());
            }
        }

        //window.status = "top"+ top+"   left"+ left

        if (fixtop) top = fixtop;
        if ($(this).attr("id") === "GridColPopup") {
            top = (top / 2) - 30;
            left = (left / 2) + 125;

            // check bounds
            if (top + 375 > $(window).height()) top = $(window).height() - 375;
            if (top < 0) top = 0;

            this.css({ "position": "absolute", "top": top + "px", "left": left + "px" });
        }
        else if ($(this).attr("id") === "Datepopup")
            this.css({ "position": "absolute", "top": top + "px", "left": left + "px" });
        else if ($(this).attr("id") === "AlertBox" || $(this).attr("id") === "HintBox") {
            if (window.location.href.indexOf("Settings.aspx") > 0)
                left = left / 2;
            top = top - 50;
            this.css({ "position": "absolute", "top": top + "px", "left": (left - 200) + "px" });
        }
        else if (!pk_UsePopup()) {
            this.css({ "position": "absolute", "left": left + "px" });
        }
        else {
            this.css({ "position": "absolute", "top": top + "px", "left": left + "px" });
        }

        // call self until actually centered
        if (OrigTop != top + "px") {
            var self = this;
            setTimeout(function () { self.center(); }, 500);
        }
        return this;
    };
}

if (!String.prototype.iTrim) {
    String.prototype.iTrim = function () {
        if ($.Is_MSIE(7) || $.Is_MSIE(8))
            return this.replace(/^\s\s*/,'').replace(/\s\s*$/,'');
        else
            return this.trim();
    };
}

if (!String.prototype.replaceAt) {
    String.prototype.replaceAt = function (index, char) {
        var a = this.split("");
        a[index] = char;
        return a.join("");
    };
}

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== undefined ? args[number] : match;
        });
    };
}

String.prototype.replaceAll = function (
strTarget, // The substring you want to replace
strSubString, // The string you want to replace in.
bCaseSensitive
) {
    var strText = this;
    var intIndexOfMatch = strText.indexOf(strTarget);
    if (!bCaseSensitive)
        intIndexOfMatch = strText.toUpperCase().indexOf(strTarget.toUpperCase());

    // Keep looping while an instance of the target string
    // still exists in the string.
    while (intIndexOfMatch !== -1) {
        // Replace out the current instance.
        strText = strText.replace(strText.substr(intIndexOfMatch, strTarget.length), strSubString);

        if (!bCaseSensitive)
            intIndexOfMatch = strText.toUpperCase().indexOf(strTarget.toUpperCase());
        else
            // Get the index of any next matching substring.
            intIndexOfMatch = strText.indexOf(strTarget);
    }

    // Return the updated string with ALL the target strings
    // replaced out with the new substring.
    return (strText ? strText.toString() : strText);
};


if (!String.prototype.RemoveUnwanted) {
    String.prototype.RemoveUnwanted = function () {
        var str = this;
        // grid seperators
        str = str.replace(/¬/g, "");
        str = str.replace(/~/g, "");
        str = str.replace(/`/g, "");
        str = str.replace(/^/g, "");
        str = str.replace(/#/g, "");
        str = str.replace(/"/g, "");

        return str;
    };
}

if (!String.prototype.DoubleUpQuotes) {
    String.prototype.DoubleUpQuotes = function () {
        var str = this;
        str = str.replace(/'/g, "''");
        return str;
    };
}

if (!String.prototype.RemoveQuotes) {
    String.prototype.RemoveQuotes = function () {
        var str = this;
        str = str.replace(/'/g, "");
        return str;
    };
}

if (!String.prototype.HTMLQuotes) {
    String.prototype.HTMLQuotes = function () {
        var str = this;
        str = str.replace(/'/g, "&#39;");
        return str;
    };
}

if (!String.prototype.htmlEncode) {
    String.prototype.htmlEncode = function () {
        var str = this;
        str = str.replace(/&(?!\w+([;\s]|$))/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replaceAll("/", "%2F");
        return str;
    };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (str){
        return this.slice(0, str.length) === str;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (str){
        return this.slice(-str.length) === str;
    };
}

if (!String.prototype.hashCode) {
    String.prototype.hashCode = function () {
        if (Array.prototype.reduce) {
            return this.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
        }
        var hash = 0;
        if (this.length === 0) return hash;
        for (var i = 0; i < this.length; i++) {
            var character = this.charCodeAt(i);
            hash = ((hash << 5) - hash) + character;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };
}

if (typeof Date.now() === 'undefined') {
    Date.now = function () {
        return new Date();
    };
}

if (!Array.prototype.filter) {
    Array.prototype.filter = function (fun /*, thisp */) {
        "use strict";

        if (this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}

/********** Alert Box Popup Code **********/

var AlertResponse;
var AlertFocusControl;
var AlertOKEvent;
var AlertCancelEvent;

function Show_Alert(anchor, Msg, IsConfirm, FocusControl, OK_EVT, Cancel_EVT, AltCaption) {
    AlertFocusControl = FocusControl;
    AlertOKEvent = OK_EVT;
    AlertCancelEvent = Cancel_EVT;
    AlertPopup.select(anchor, Msg, IsConfirm, AltCaption);
    $.FocusControl("#bnAlertOK", false, 100);
    $("#AlertBox").center(undefined, true);
    setTimeout(CenterPopupPopups, 10);
    return false;
}

function CloseAlertPopup() {
    AlertPopup.closeWindow();
}

var HintTimerID = null;
function Show_Hint(Title, UseAutoHide, Msg, ButtonBar, ButtonCount) {
    Msg = Msg.replace(/\r\n/g, "<br/>");

    HintPopup.autoHideEnabled = UseAutoHide;
    if (!Title) Title = "<h2>Information</h2>";
    //When displaying < and > in a hint popup (even when escaped as &lt; and &gt; in the source text) doesn't work. Could be dodgy anyway, so
    //have gone for substitute patterns of __# and #__ which get switched in here at the last moment.
    HintPopup.select(undefined, Title, UseAutoHide, Msg.replace("__#","&lt;").replace("#__","&gt;"), ButtonBar, ButtonCount);
    $("#HintBox").center(undefined,true);
    setTimeout(CenterPopupPopups, 10);

    if (HintTimerID)
    {
        clearTimeout(HintTimerID);
        HintTimerID = null;
    }

    if (UseAutoHide)
        HintTimerID = setTimeout(function () { CloseHintPopup(); HintTimerID = null;}, 30000);
    return false;
}

function CloseHintPopup() {
    if (HintTimerID)
    {
        clearTimeout(HintTimerID);
        HintTimerID = null;
    }
    $('.Alert_overlay').css({ 'visibility': 'hidden' });
    HintPopup.closeWindow();
}

// CONSTRUCTOR for the alert options Object
function PopupHint() {
    var c;
    if (arguments.length > 0) { c = new PopupWindow(arguments[0]); }
    else { c = new PopupWindow(); c.setSize(150, 175); }
    c.divName = "HintBox";
    c.select = HINT_select;
    c.closeWindow = ALERT_hidePopup;
    // Return the object
    return c;
}

// Simple method to interface popup calendar with a text-entry box
function HINT_select(anchorname, Title, UseAutoHide, Msg, ButtonBar, ButtonCount, noBR) {
    window.CP_targetInput = anchorname;
    this.populate(HINT_getOptions(Title, Msg, ButtonBar, UseAutoHide, ButtonCount, noBR));
    this.showPopup(anchorname);
    $(".sysmsg_close").click(CloseHintPopup);
}

function HINT_getOptions(Title, Msg, ButtonBar, UseAutoHide, nCols, noBR) {
    var result = "";
    if (UseAutoHide)
    // for close button onstead use this, for auto press close
        ButtonBar = "<input tabindex='1' class='sysmsg_close' type='button' value='Close Window' style='width:120px;'>";

    result += "<div id='divPopsize' class='hintMainBorder noPrint' style='z-index: 102;height:auto;width:auto; min-width:450px;padding-bottom: 25px;'>";
    result += "<div class='sysmsg_top_div'>" + Title + "</div>";
    result += "<table id='tblHint'><tr><td colspan='" + (nCols ? nCols : "2") + "' style='height:auto;'><div id='tbl_hdv' style='max-height:400px;'>" + (noBR ? "" : "") + Msg + "</div></td></tr></table>";
    if (ButtonBar) result += "<div class='sysmsg_bottom_div'>" + ButtonBar + "</div>";
    result += "</div></div>";

    if (!ButtonBar) {
        $(".hintMainBorder").css({ "height": $("#tblHint").height() + 30 });
        setTimeout(function () { HintSize(50); }, 100);
        setTimeout(function () { HintSize(50); }, 500);
    }
    else {
        $(".hintMainBorder").css({ "height": $("#tblHint").height() + 50 });
        setTimeout(function () { HintSize(43); }, 100);
        setTimeout(function () { HintSize(43); }, 500);
    }
    return result;
}

function HintSize(offset) { $(".hintMainBorder").css({ "height": $("#tblHint").height() + offset }); if ($("#tbl_hdv").height() >= 400) $("#tbl_hdv").css("overflow", "auto"); }

// CONSTRUCTOR for the alert options Object
function PopupAlert() {
    var c;
    if (arguments.length > 0) { c = new PopupWindow(arguments[0]); }
    else { c = new PopupWindow(); c.setSize(150, 175); }
    c.divName = "AlertBox";
    c.select = ALERT_select;
    c.closeWindow = ALERT_hidePopup;
    // Return the object
    return c;
}

function ALERT_hidePopup() {
    if (arguments.length > 0) { window.popupWindowObjects[arguments[0]].hidePopup(); }
    else { this.hidePopup(); }
    $('.Alert_overlay').css({ 'visibility': 'hidden' });
}

// Simple method to interface popup calendar with a text-entry box
function ALERT_select(anchorname, Msg, IsConfirm, AltCaption) {
    window.CP_targetInput = anchorname;
    this.populate(ALERT_getOptions(Msg, IsConfirm, AltCaption));
    $('.Alert_overlay').css({ 'visibility': 'visible', 'display': 'none' }).fadeIn(100);
    this.showPopup(anchorname);
    if (IsConfirm)
        $("#bnAlertCANCEL").click(function () {
            AlertResponse = false;
            CloseAlertPopup();
            if (AlertCancelEvent) AlertCancelEvent();
        });

    $("#bnAlertOK").click(function () {
        AlertResponse = true;
        CloseAlertPopup();
        if (AlertFocusControl)
            $.FocusControl(AlertFocusControl, true, 10);
        if (AlertOKEvent) AlertOKEvent();
    });
}

function ALERT_getOptions(Msg, IsConfirm, AltCaption) {
    var result = "<div tabindex='-1' class='alertMainBorder noPrint' style='z-index: 102;'><div class='sysmsg_top_div'>";//cursor:pointer; (for when i do drag + drop work)

    if (AltCaption)
        result += "<h2 id='caption'>" + AltCaption + "</h2>";
    else if (!IsConfirm)
        result += "<h2 id='caption'>System Message</h2>";
    else
        result += "<h2 id='caption'>System Confirmation</h2>";

    result += "<br/></div><table id='tblAlert'><tr><td colspan='2' style='text-align:center;'><label>" + Msg + "</label><br/><br/></td></tr><tr><td colspan='2'><br/><br/></td></tr></table>";

    if (!IsConfirm)
        result += "<div class='sysmsg_bottom_div'><input tabindex='1' id='bnAlertOK' type='button' value='OK'></div>";
    else
        result += "<div class='sysmsg_bottom_div'><input tabindex='1' type='button' id='bnAlertOK' value='OK'>&nbsp;<input type='button' tabindex='2' id='bnAlertCANCEL' value='Cancel'></div>";

    result += "</div>";

    setTimeout(function () { $(".alertMainBorder").height($("#tblAlert").height() + 50); }, 100);
    setTimeout(function () { $(".alertMainBorder").height($("#tblAlert").height() + 50); }, 500);

    return result;
}

/********** Mini Member Search Popup **********/

// only currently implemented on Trining advisor on member profile / training tab.
// NOTE: also still need to implement outside hierarchy

function Show_AllowOutsideHierarchy(Source) {
    /*
    TADV_A = Training Advisor (member profile, update training - adults)
    TADV_Y = Training Advisor (member profile, update training - youths)
    UPD_TADV_A = Training Advisor (update training - adults)
    UPD_TADV_Y = Training Advisor (update training - youths)
    ANR_TRVB = Validated By (Assign New Role)
    TRVB_A = Validated By (Update Training - adults)
    TRVB_Y = Validated By (Update Training - youths)
    UPD_TRVB_A =  = Validated By (Member Profile, Update Multiple Training - adults)
    UPD_TRVB_Y =  = Validated By (Member Profile, Update Multiple Training - youths)
    PASS = Permit Assessors
    MS_PASS = Permit Assessors via MemberSearch
    RP_PASS = Permit Assessors via RecommendPermit
    EVT_MAN = Events : Event Managers (both) (only used for validation so you can say, not youths/adults on this list)
    EVT_DC = Event District Commissioners
    EVT_MEM / EVT_MEM_A = Event Members (adults) NOTE: youths currently have outside hierarchy turned off.!
    EVT_PP = Event Passport Holder
    */

    // temporarily always turned off
    return ((Source === "TADV_A" || Source === "TADV_Y" || Source === "UPD_TADV_A" || Source === "UPD_TADV_Y" || Source === "TRVB" || Source === "ANR_TRVB" || Source === "TRVB_A" || Source === "TRVB_Y" || Source === "UPD_TRVB_A" || Source === "UPD_TRVB_Y" || Source === "PASS" || Source === "MS_PASS" || Source === "RP_PASS" || Source === "EVT_MAN" || Source === "EVT_DC" || Source === "EVT_MEM" || Source === "EVT_MEM_A") && 1 === 1); // 1==1/2 is turn on/off outside hierarchy functionality on bulk
    //|| Source == "NOM_MEM_Y"|| Source == "NOM_MEM_N" (not currently a requirment, we think this one should be turned on)
}

var vPopupCaption = "";
function Show_MemberSearch(Source, OK_EVT, PopupCaption, SearchFromON, NotCN)
{   // NOTE: OK event MUST have 2 properties which we will put the selected CN in, and contact name)
    if (!PopupCaption) PopupCaption = "Member Search";
    vPopupCaption = PopupCaption;
    if (!OK_EVT)
        return false;

    var popupHTML = "<table id='pop_TBL_memSearch' style='width:100%;margin-top: 2px; margin-bottom: -2px;'>" +
                    "<tr><td><label>Forenames</label><br/><input type='text' id='pop_txt_Forenames'/></td><td><label>Surname</label><br/><input type='text' id='pop_txt_surname'/></td></tr><tr><td colspan='2'>" +
                    (Show_AllowOutsideHierarchy(Source) ? "<label class='labelPoint' for='pop_CB_OUT'>Include Members Outside My Hierarchy</label>&nbsp;&nbsp;<input type='checkbox' id='pop_CB_OUT'/>" : "<label style='visibility:hidden;height:25px;'>X</label>") +
                    "<input type='button' style='width:80px;float:right;margin-right: 10px;' id='pop_SearchBN' value='Search'></td></tr>" +
                    "<tr><td colspan='2'><hr class='hr_menu_split'/></td></tr></table></td></tr><tr><td><div style='height:200px; overflow:auto;'>"+
                    "<table id='pop_TBL_Results' style='width:100%;'><tr><td colspan='4' style='text-align:center;'><br/><h3>Enter Name(s) and Search</h3></td></tr></table></div>";

    //***************

    HintPopup.autoHideEnabled = false;
    var ButtonBar = "<input type='button' id='mspC' value='Cancel' class='sysmsg_close'>";
    HintPopup.select(undefined, "<h2 id='pop_Caption'>" + PopupCaption + "</h2>", false, popupHTML, ButtonBar, 1, true);
    AlertOKEvent = OK_EVT;
    $("#HintBox").center(undefined, true);
    CenterPopupPopups();
    $('.Alert_overlay').css({ 'visibility': 'hidden' }).css({ 'visibility': 'visible', 'display': 'none' }).fadeIn(100);
    $("#pop_SearchBN").click(function () { pop_DoMemberSearch(Source, SearchFromON, NotCN); });
    $("#pop_txt_surname,#pop_txt_Forenames").keydown(function (event) { pop_keydown(event); }).css("width","200px");

    // event permit holders, they wanted the full list shown on form show.. (below does this)
    if (Source.indexOf("EVT_PERM") >= 0)
    {
        $("#pop_txt_Forenames").val("%");
        $("#pop_SearchBN").trigger("click");
        $("#pop_txt_Forenames").val("");
    }

    $.FocusControl("#pop_txt_Forenames", true, 100);

    return false;
}

function pop_DoMemberSearch(Source, SearchFromON, NotCN, ValidateCN)
{
    if (!ValidateCN && !$("#pop_txt_Forenames").val() && !$("#pop_txt_surname").val())
    {
        $.FocusControl("#pop_txt_Forenames");
        $("#pop_TBL_Results tr").remove();
        $("#pop_TBL_Results tbody").append("<tr><td colspan='4' style='text-align:center;'><br/><h3>Enter Name(s) and Search</h3></td></tr>");
        return;
    }

    var SetPageToQuery = function () {
        $("#pop_TBL_Results tr").remove();
        $("#pop_TBL_Results tbody").append("<tr><td colspan='4' style='text-align:center;'><br/><h3>Searching Database...</h3><br/><a class='popup_loading_gif' href='#' style='display: block;position:absolute;top:220px; left:45%;cursor:wait;' onclick='return false;'></a></td></tr>");
        $("#divPopsize").css("cursor", "wait");
        $("#pop_Caption").text(vPopupCaption);
        $("#pop_txt_Forenames,#pop_txt_surname").attr("readonly", "readonly");
        $("#pop_CB_OUT,#pop_SearchBN").attr("disabled", "disabled");
        SetEnabled();
    };

    var SuccessFunction = function (result) {
        $("#pop_TBL_Results tr").remove();

        Source = Source.split('~')[0]; // some have a primary key as second part, for this section we never need that primary key

        if (!pk_val("Master.Sys.REST") && result) result = result.d; // REST vs JSON result
        if (result) { // Has results
            var Data = $.parseJSON(result);
            if (ValidateCN) {// just validation
                if (AlertOKEvent) {
                    if (Source === "MEM_Y_JL" || Source === "MEM_A_JL")
                        AlertOKEvent(Data[0].contact_number, (!Data[0].name_withcn ? Data[0].name : Data[0].name_withcn), Data[0].forenames, Data[0].surname, Data[0].dob);
                    else if (Source === "ASMR")
                        AlertOKEvent(Data[0].contact_number, (!Data[0].name_withcn ? Data[0].name : Data[0].name_withcn), Data[0].dob, Data[0].age, Data[0].status);
                    else if (Source === "EVT_MAN")
                        AlertOKEvent(Data[0].contact_number, (!Data[0].name_withcn ? Data[0].name : Data[0].name_withcn), Data[0].membershipgrade);
                    else if (Source === "EVT_MEM" || Source === "EVT_MEM_Y" || Source === "EVT_MEM_A")
                        AlertOKEvent(Data[0].contact_number, Data[0].name, Data[0].age, Data[0].visibility_status, Data[0].role, Data[0].location);
                    else if (Source === "NOM_MEM_Y" || Source === "NOM_MEM_N")
                        AlertOKEvent(Data[0].contact_number, Data[0].name, Data[0].role, Data[0].location, Data[0].role_on); // need to do role ON
                    else if (Source === "EVT_DC" || Source === "EVT_PP")
                        AlertOKEvent(Data[0].contact_number, Data[0].name);
                    else if (Source === "EVT_LEAD" || Source === "EVT_PERM" || Source === "ORG_MEM" || Source === "SECT_MEM" || Source === "GRP_MEM")
                        AlertOKEvent(Data[0].contact_number, Data[0].name, Data[0].email, Data[0].phone);
                    else
                        AlertOKEvent(Data[0].contact_number, (!Data[0].name_withcn ? Data[0].name : Data[0].name_withcn));
                }
            }
            else {// popup selector
                $.each(Data, function (idx) {
                    var TRHTML = "<tr class='msTR'>";
                    TRHTML += "<td class='tdData'><label><b>" + this.name_withcn.replace("'", "&apos;") + "</b></label><br/>";
                    TRHTML += "<label>" + this.role + ", " + this.location + "</label></td>";
                    TRHTML += "<td class='tdData' style='text-align:right;'><input type='button' class='msri' value='Select'></td>";
                    TRHTML += "</tr>";

                    $("#pop_TBL_Results tbody").append(TRHTML);
                    var DataItem = this;

                    if (Source === "MEM_Y_JL" || Source === "MEM_A_JL")
                        $(".msri").last().click(function () { CloseHintPopup(); AlertOKEvent(DataItem.contact_number, (!DataItem.name_withcn ? DataItem.name : DataItem.name_withcn), DataItem.forenames, DataItem.surname, DataItem.dob); });
                    else if (Source === "ASMR")
                        $(".msri").last().click(function () { CloseHintPopup(); AlertOKEvent(DataItem.contact_number, (!DataItem.name_withcn ? DataItem.name : DataItem.name_withcn), DataItem.dob, DataItem.age, DataItem.status); });
                    else if (Source === "EVT_MAN")
                        $(".msri").last().click(function () { CloseHintPopup(); AlertOKEvent(DataItem.contact_number, (!DataItem.name_withcn ? DataItem.name : DataItem.name_withcn), DataItem.membershipgrade); });
                    else if (Source === "EVT_MEM" || Source === "EVT_MEM_Y" || Source === "EVT_MEM_A")
                        $(".msri").last().click(function () { CloseHintPopup(); AlertOKEvent(DataItem.contact_number, DataItem.name, DataItem.age, DataItem.visibility_status, DataItem.role, DataItem.location); });
                    else if (Source === "NOM_MEM_Y" || Source === "NOM_MEM_N")
                        $(".msri").last().click(function () { CloseHintPopup(); AlertOKEvent(DataItem.contact_number, DataItem.name, DataItem.role, DataItem.location, DataItem.role_on); }); // need to do role ON
                    else if (Source === "EVT_DC" || Source === "EVT_PP")
                        $(".msri").last().click(function () { CloseHintPopup(); AlertOKEvent(DataItem.contact_number, DataItem.name); });
                    else if (Source === "EVT_LEAD" || Source === "EVT_PERM" || Source === "ORG_MEM" || Source === "SECT_MEM" || Source === "GRP_MEM")
                        $(".msri").last().click(function () { CloseHintPopup(); AlertOKEvent(DataItem.contact_number, DataItem.name, DataItem.email, DataItem.phone); });
                    else
                        $(".msri").last().click(function () { CloseHintPopup(); AlertOKEvent(DataItem.contact_number, (!DataItem.name_withcn ? DataItem.name : DataItem.name_withcn)); });

                    $(".msTR").last().hover(
                        function () { $(this).addClass("Grid_HL").css({ "cursor": "" }); },
                        function () { $(this).removeClass("Grid_HL").css({ "cursor": "" }); }
                    );
                });
                $("#pop_Caption").text(vPopupCaption + " (" + Data.length + ")");
            }
        }
        else {// no results
            if (ValidateCN) { // just validation
                if (AlertCancelEvent)
                    AlertCancelEvent();
            }
            else // popup selector
            {
                $("#pop_TBL_Results tr").remove();
                $("#pop_TBL_Results tbody").append("<tr><td colspan='4' style='text-align:center;'><br/><h3>No Contacts Found.</h3></td></tr>");
                $.FocusControl("#pop_txt_Forenames");
            }
        }
        $("#divPopsize").css("cursor", "default");
        $("#pop_txt_Forenames,#pop_txt_surname").removeAttr("readonly");
        $("#pop_CB_OUT,#pop_SearchBN").removeAttr("disabled");
        SetEnabled();
    };

    var ErrorFunction = function (result, ts, et) {
        $("#divPopsize").css("cursor", "default");
        $("#pop_txt_Forenames,#pop_txt_surname").removeAttr("readonly");
        $("#pop_CB_OUT,#pop_SearchBN").removeAttr("disabled");

        if (!ValidateCN) {
            $("#pop_TBL_Results tr").remove();
            $("#pop_TBL_Results tbody").append("<tr><td colspan='4' style='text-align:center;'><br/><h3>No Contacts Found.</h3><br/><h3 style='color:red;'>An error occurred during the search.</h3></td></tr>");
            $.FocusControl("#pop_txt_Forenames");
        }
        SetEnabled();
        ServiceFailed(result, ts, et, this);
    };

    if (pk_val("Master.Sys.REST")) {
        // this is the code to run if using REST instead of JSON,
        // NOTE: subtally it is different.
        var vData = {};
        vData["Source"] = Source;
        if (SearchFromON) vData["SearchON"] = SearchFromON;
        if (NotCN) vData["NotCN"] = NotCN;
        if ($("#pop_txt_Forenames").val() && !ValidateCN) vData["Forenames"] = $("#pop_txt_Forenames").val();
        if ($("#pop_txt_surname").val() && !ValidateCN) vData["Surname"] = $("#pop_txt_surname").val();
        vData["IncludeOutsideHierarchy"] = ($("#pop_CB_OUT").is(":checked") || (Show_AllowOutsideHierarchy(Source) && ValidateCN) ? "Y" : "N");
        if (ValidateCN) vData["LookupCN"] = ValidateCN;

        SetPageToQuery();

        PostToHandler(vData, "/Search/Mini", SuccessFunction, ErrorFunction,false,true);
        // End
    } else {
        var Params = "";
        if (SearchFromON) Params += "&pSearchON=" + SearchFromON;
        if (NotCN) Params += "&pNotCN=" + NotCN;
        if ($("#pop_txt_Forenames").val() && !ValidateCN) Params += "&pForenames=" + $("#pop_txt_Forenames").val();
        if ($("#pop_txt_surname").val() && !ValidateCN) Params += "&pSurname=" + $("#pop_txt_surname").val();
        Params += "&pIncludeOutsideHierarchy=" + ($("#pop_CB_OUT").is(":checked") || (Show_AllowOutsideHierarchy(Source) && ValidateCN) ? "Y" : "N");
        if (ValidateCN) Params += "&pLookupCN=" + ValidateCN;

        SetPageToQuery();

        $.ajax({ url: WebServicePath() + "MiniSearch?pSource=" + Source + Params, async: (!ValidateCN), success: SuccessFunction, error: ErrorFunction });
    }
}

function pop_keydown(event) {
    var e = event || window.event; // for trans-browser compatibility
    var charCode = e.which || e.keyCode;
    if (charCode === 13) $("#pop_SearchBN").trigger("click");
}

function Valid_Member(Source, OK_EVT, Invalid_Event, CheckCN, SearchFromON, NotCN) {
    AlertOKEvent = OK_EVT;
    AlertCancelEvent = Invalid_Event;
    pop_DoMemberSearch(Source, SearchFromON, NotCN, CheckCN);
}
