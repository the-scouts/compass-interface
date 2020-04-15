var MyCloseFunction;
var StopResize = false; // simple variable, if set will halt timed screen resize refresh
var startTime;

$(window).load(function () {
    var millisecondsLoading = (new Date()).getTime() - startTime;
    if ($("#tdClientRender").size() > 0) { $("#tdClientRender")[0].innerHTML = (millisecondsLoading / 1000).toString() + "s"; }
});

function SP(val) // stat page routine, (JS from master pages previously)
{
    startTime = (new Date()).getTime();
    // this is the "Do you want to log off out of Compass?" call, seems not to work in FF as no event for position.

    // global startup code
    if (!val) {// main
        $("#TSA").prepend(
        '<div id="CompatabilityMode" class="CompatMode CompatCLK" style="display:none;padding-top: 5px;">' +
        '<div class="popup_footer_left_div" style="width: 610px;padding-top:3px;"><h3 style="width: 100%;font-size:1.3em;margin-top:2px;text-align: center;">Internet Explorer is in compatibility mode which will restrict the functionality of Compass.<br /><a href="MSG/BrowserCompatibility.html" target="_blank" title="Compatibility view settings">Click here</a> to learn how to turn Compatibility mode off.</h3></div>' +
        '<div class="popup_footer_right_div" style="width:70px;margin-top:17px;"><input type="button" class="CompatCLK" style="width:60px; cursor:pointer;" value="Close"></div>' +
        '</div><a href="#" class="foldimage_up" style="visibility:hidden;position: absolute;"></a><a href="#" class="foldimage_down" style="visibility:hidden;position: absolute;"></a>' +
        '<div id="Alert_overlay" class="Alert_overlay"></div><div id="AlertBox" class="AlertBox"></div><div id="HintBox" class="HintBox"></div><div id="Datepopup" class="Datepopup"></div><div id="GridColPopup" class="GridColPopup"></div>' +
        '<div id="OffLineMain" class="OffLine" style="display:none;"><a href="#" class="Internet" onclick="return false;" > </a><h2 style="margin:7px 0px 0px 30px;">Internet connection has been lost</h2></div>'
        );

        $(".popup_loading_gif").click(function () { return false; });
        $(".CompatCLK").click(HideCompatMessage);
    } else { // popup
        $("#TSA").prepend(
        '<div id="Alert_overlay" class="Alert_overlay" ></div><div id="AlertBox" class="AlertBox"></div><div id="HintBox" class="HintBox"></div><div id="Datepopup" class="Datepopup"></div><div id="GridColPopup" class="GridColPopup"></div>' +
        '<div id="OffLineMain" class="OffLine" style="display:none;"><a href="#" class="Internet" onclick="return false;" > </a><h2 style="margin:7px 0px 0px 30px;">Internet connection has been lost</h2></div>'
        );
    }

    $("html").css("font-size", GetFontSize());
    // center the Alert popup
    $("#AlertBox,#HintBox,#Datepopup,#GridColPopup").css("visibility", "hidden");

    calPopup = new CalendarPopup("Datepopup");
    gridPopup = new GridColumnOptions("GridColPopup");
    AlertPopup = new PopupAlert();
    HintPopup = new PopupHint();

    if (!val) // (Y or N from popup, null/undefined from main)
    {
        // main page startup code
        $.Is_SupportedBrowser();

        if (parent.frames.length > 0 && location.href.toLowerCase().indexOf("popups") < 0) {
            //TSA-580: Make the transition from popup to parent smoother
            //    //TSA-1483: Lose the message as it looks messy in reports
            if (location.href.toLowerCase().indexOf("report") < 0) {
                parent.ShowBusy_Popup();

                if (document.location.search !== "?CN=")
                    top.location.href = document.location.href;
                else if (top.location.search !== "?CN=")
                    setTimeout(function () { top.location.href = top.location.href; }, 10);
            }
        }
        else $(document).ready(MainPageReady).data("FT", "M");
    }
    else {
        // popup startup code
        TopCheck(val === "Y");
        $(document).ready(PopupPageReady).data("FT","P");
        $("#ctl00_InlineCheck").val(self == top ? "" : "Y");
    }
}

function startTimeout(popup) {
    setTimeout(function () {
        var STO_idx = setInterval(function () {
            if (ss_TimeoutCheck(popup)) {
                clearInterval(STO_idx);
                window.status = '';
            }
        }, 10000);
    }, parseInt(pk_val("Master.Sys.Timout"), 10));

    if (pk_val("Master.Sys.Ping")) {
        // and every minute or so do a basic check (its a sweep up)
        var STO_idx2 = setInterval(function () {
            if (ss_TimeoutCheck(popup, true)) {
                clearInterval(STO_idx2);
                window.status = '';
            }
        }, parseInt(pk_val("Master.Sys.Ping"), 10));
    }
}

function Logout()
{
    ShowLoadingMessage();
    window.location.href = WebSitePath() + "Login.ashx?Logout=Y" + (!pk_val("Master.SSO.ON") || pk_val("Master.SSO.ON") === "-1" ? "" : "&ON=" + pk_val("Master.SSO.ON"));
    return false;
}

function MainPageReady() {
    try
    {
        $("#ctl00_Popup_UpdatePanel").append("<div tabindex='1000' class='popup_overlay'><div class='popup_border noPrint'><div class='popup_loading_div'><a href='#' class='popup_loading_gif'></a><h2 id='BusyMessage'>&#160;</h2></div><div class='popup_iframe_div'></div></div></div>");

        $(".rfvh").each(function () { $(this).html("<b>&bull;</b> Required fields&nbsp;&nbsp;&nbsp;"); });
        $(".rfv").each(function () { $(this).html("&bull;"); });

        $(".InfoButton").AttrToData("xcaption").AttrToData("xtext").click(function () {$.system_hint($(this).data("xtext"), $(this).data("xcaption"));});

        if (!pk_val("Master.Sys.HiddenOpts") && !$.Is_MSIE(8) && !$.Is_CompatibilityMode())
            $('.jsRemove').removeAttr('src').html('');

        if (pk_val("Master.Sys.Timout")) startTimeout();
        closeAllMenus(undefined,true);
        menu_attachListener();
        SetEnabled();

        // Browser Specific
        if ($.Is_Safari()) $("input[type=search], input[type=email]").attr("type", "text");
        if ($.Is_MSIE(8)) { $(".msTitle").css({ "padding-bottom": "5px" }); }

        $("body").mousemove(function (event) { mouser(event); }).mouseup(mouse_up);

        intx = setInterval(DoResize, ($.Is_MSIE(8) ? 5000 : 100));

        setTimeout(function () {
            clearInterval(intx);
            window.onresize = DoResize;
            setIntervalADV(MainPageSize, ResizePingInterval);
        }, ResizePingInterval * 2);

        window.onbeforeprint = function () {
            if ($(".msTR").length > 0) {
                $("#mstr_work").height($(".msTR").last().position().top + $(".msTR").last().height());
            }
            if ($(".bCard").length > 0) {
                $(document.body).width("500px");
                $("#mstr_work").height($(".bCard").last().position().top + $(".bCard").last().height());
            }
            if ($(".msCard").length > 0) {
                $("#mstr_work").height($(".msCard").last().position().top + $(".msCard").last().height());
            }
            $(".SH_DIV_BN_MPT").css("margin-left","0px");

            if (window.location.href.toLowerCase().indexOf("memberprofile.aspx") > 0) {
                if (vCurrentPageNo !== 1) {
                    $("#mstr_work").css("top", "35px");
                    $(".SH_DIV_BN_MPT").css("margin-top", "-60px");
                }

                $("#mstr_work").height($("#mpage" + vCurrentPageNo).height());
            }

            StopResize = true;
            $("#mstr_scroll").height($("#mstr_work").height());
            $(document.body).height($("#mstr_scroll").height());

        };
        window.onafterprint = function () {
            $(".SH_DIV_BN_MPT").css("margin-left", "20px");
            if (window.location.href.toLowerCase().indexOf("memberprofile.aspx") > 0) {
                $("#mstr_work").css("top", "");
                $(".SH_DIV_BN_MPT").css("margin-top", "");
            }
            $(document.body).width($(document).width()).height(0);
            StopResize = false;
            DoResize();
        };

        DoResize();

        if (pk_val("Master.Sys.ErrorMessage"))
            setTimeout(function () { ShowInvalidMessage(pk_val("Master.Sys.ErrorMessage")); }, 200);

        $('#mstr_busy').hide();
        $('#mstr_panel').show().css("visibility","visible");

        if (pk_val("Master.Sys.UserVoice"))
            setTimeout(function () { $('.uv-top-right.uv, .uv-icon').show().animate({ 'right': '145px', 'top': '30px', 'z-index': '99' }, 100); }, 2000);
        else


        ss_Hardb4Soft();
    }
    catch (e) { }
}

var idx = null;
function PopupPageReady() {
    $(".rfvh").each(function () { $(this).html("<br/><b>&bull;</b> Required fields&nbsp;&nbsp;&nbsp;"); });
    $(".rfv").each(function () { $(this).html("&bull;"); });

    $(".InfoButton").AttrToData("xcaption").AttrToData("xtext").click(function () { $.system_hint($(this).data("xtext"), $(this).data("xcaption")); });
    if (pk_val("Master.Sys.Timout")) startTimeout('Y');
    $(".closepopevt").click(function () { DoClose(); return false; });
    $(".body-popup").mousemove(function (event) { mouser(event); }).mouseup(mouse_up);
    if (!pk_val("Master.Sys.HiddenOpts") && !$.Is_MSIE(8) && !$.Is_CompatibilityMode()) { $('.jsRemove').removeAttr('src').html(''); }

    if (!pk_UsePopup()) $(".popup-form").addClass("Popup-Inline-Border");
    // work around for the IE wont scroll issue..
    if ($.Is_MSIE()) { $("#popup_work").scroll(function () { $("#popup_work").attr("scrollTop", "0"); }); }

    if (idx) {
        clearInterval(idx);
        idx = undefined;
    }
    idx = setInterval(function () { DoPopupReSize("STARTUP"); }, 10);

    $("#popup_header").click(function () { DoPopupReSize("RESIZE"); });

    setTimeout(function () {
        clearInterval(idx);
        idx = undefined;
        window.onresize = function () { DoPopupReSize("RESIZE"); };
        setIntervalADV(function () { PopupPageSize("TIMER"); }, ResizePingInterval);
        $(".mpage").scrollTop(300);
    }, 2500);

    // WebKit bug (fix) http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes
    // the page in chrome + opera drew of the left of the screen, this forces the re-draw. (didnt put in normal routine as didnt want repeatedly called)
    if($.Is_Chrome() || $.Is_Opera())
        setTimeout(function () { $('#popuphtml').css('display', 'none').height(); $('#popuphtml').css('display', 'block'); }, 200);

    ss_Hardb4Soft(true);
}

function ShowHide(e) {
    var key = !e ? 13 : e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    if (key === 13 || !e.charCode)
        try {
            var DivName = "#" + e.data.divname;
            if ($(DivName).is(":hidden")) {
                $(DivName).slideDown(300);
                $(e.data.foldname).css({ "background-image": $(".foldimage_up").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
                SaveUserSettings(e.data.key, "");
            }
            else {
                $(DivName).slideUp(300);
                $(e.data.foldname).css({ "background-image": $(".foldimage_down").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
                SaveUserSettings(e.data.key, "Y");
            }
        } catch (err) { }
}

function DoActualClose() {
    if (window.location.href.toLowerCase().indexOf("settings.aspx") > 0) {
        window.location.href = WebSitePath() + "ScoutsPortal.aspx";
        return true;
    }
    else if (pk_UsePopup()) {
        clear_countdown(vPopCountdownIDX);
        return window.parent.CloseiFrame();
    }
    else {
        MakeFormReadonlyForSave("","Closing Page...");
        return CloseiFrame();
    }
}

function DoClose(msg) {
    if (SavePressesMessage()) return false;
    try { if (vIsReadonly) HasChanges = false; } catch (e) { }
    if (HasChanges) {
        $.system_confirm("Please be aware this will close the current process.<br/>All your unsaved changes will be lost.<br/><br/>Do you wish to continue?", DoActualClose);
        return false;
    }
    else
        return DoActualClose(msg);
}

var HideMSG = false;
function HideCompatMessage() {
    HideMSG = true;
    $(".CompatMode").center("10px", true).slideUp(500);
}

var FakeOffLine = false; // set when testing
function InternetCheck(OnPopup) {
    // compatability mode check
    if (!OnPopup && !HideMSG && $.Is_CompatibilityMode() && !pk_val("Master.Sys.App")) $(".CompatMode").center("10px", true).slideDown(500);
    // browser online check
    if (Navigator_OnLine() && !FakeOffLine) { $(".OffLine").slideUp(500); }
    else if ($(".OffLine").css("display") !== "block") { $(".OffLine").center("10px", true).slideDown(500); }
}

function HideBusy_Popup() {
    // for popups where we want a busy message (hide the message)
    $(".popup_iframe_div").css({ "visibility": "visible" });
    $('.popup_loading_div').css({ "display": "none", "left": "-500px", "height": "100%" });
    $('.popup_loading_gif').css({ "left": "-100px", "top": "0px", "position": "static" });
    $('.popup_border').css({ "cursor": "default" });
    $('#BusyMessage').text(' ');
}

function ShowBusy_Popup(Message) {
    // for popups where we want a busy message (show the message)
    $('.popup_iframe_div', window.document).css({ 'visibility': 'hidden' });
    $(".popup_loading_div").css({ "width": "100%", "left": "0px", "visibility": "visible", "display": "block", "margin-left": "5px", "margin-top": "5px" });
    $('.popup_loading_gif').css({ "left": "48%", "top": "45%", "position": "fixed" });
    $('.popup_border').css({ "cursor": "wait" });
    $('#BusyMessage').css({ "left": "0px", "width": "100%", "top": "65%", "text-align": "center", "display": "block" });
    if (Message)  $('#BusyMessage').text(Message);
}

function HideBusy_Main() {
    // for landing pages, show busy message (hide busy gif)
    $('.popup_border').css({ 'width': '', 'height': '', 'min-width': '', 'min-height': '','visibility':'hidden' });
    $('.popup_loading_div').css({ "display": "none", "left": "-500px", "height": "100%" });
    $('.popup_loading_gif').css({ "left": "", "top": "", "position": "" });
    $('.popup_overlay').css({ 'visibility': 'hidden' });
    $('.popup_border').removeClass("busyborder");
}

function ShowBusy_Main(Goto_URL) {
    // for landing pages, show busy message (Show busy gif) NOTE: if URL is sent, then it will goto it, if none is sent, HideBusy needs to be called
    if (!pk_UsePopup() && 1===2) {
        $(".popup_loading_div").css({ "left": "0px", "visibility": "visible", "display": "block", "margin-left": "5px", "margin-top": "5px" });
        if (Goto_URL) { window.location.href = Goto_URL; }
    }
    else {
        $('.popup_border').addClass("busyborder");
        $('.popup_border,.popup_iframe_div').css({ 'min-width': '0px', "min-height": '0px', 'max-width': '100%', "max-height": '100%' });
        $('.popup_overlay,.popup_border', window.document).css({ 'visibility': 'hidden' });

        if ($.Is_MSIE(7) || $.Is_MSIE(8)) { $(".popup_overlay").css({ "background-color": "rgb(68, 86, 96)" }); }
        $('.popup_border').css({ 'visibility': 'visible', 'width': '100%', 'height': '100%', 'top': '70%' });

        if ($.Is_MSIE(7) || $.Is_MSIE(8)) {
            $('.popup_border').css({ 'top': '45%', 'left': '45%' });
        } else {
            $('.popup_border').css({ 'top': '50%' });
        }
        $('.popup_border').css({ 'width': '100%', 'height': '100%', 'min-width': '0', 'min-height': '0' });
        $(".popup_loading_div").css({ "left": "0px", "visibility": "visible", "display": "block", "margin-left": "5px", "margin-top": "5px" });
        $(".popup_border").css({ width: "56px", height: "56px" }, 100);/*400*/
        $(".popup_iframe_div").css({ "visibility": "hidden" });
        $('.popup_overlay').css({ 'visibility': 'visible', 'display': 'none', "cursor": "wait" });
        $('.popup_overlay').fadeIn(100);

        if (Goto_URL) {
            if (!pk_UsePopup()) {
                window.location.href = Goto_URL;
            }
            else {
                $(".popup_iframe_div", window.document).html("");
                $('.popup_border,.popup_iframe_div').css({ 'min-width': '0px', "min-height": '0px', 'max-width': '100%', "max-height": '100%' });
                setTimeout(function () { document.location.href = Goto_URL; }, 250);
            }
        }
    }
}

function SetCloseiFrameFunction(obj) {
    if (pk_UsePopup())
        window.parent.MyCloseFunction = obj;
}

function CloseiFrame(message, delay) {
    strMessage = message;

    if (pk_UsePopup()) {
        // if the timeout countdown is happening, when we close a popup we dont want 2 overlapping timers occuring, so kill popup one.!
        setTimeout(function () { $("#popup_iframe").purgeFrame(); }, 250);

        if (delay) {
            $('.popup_border,.popup_iframe_div').css({ 'min-width': '0px', "min-height": '0px', 'max-width': '100%', "max-height": '100%' });
            iID = setInterval(function () { $('.popup_overlay,.popup_border,.popup_iframe_div', window.document).css({ 'visibility': 'hidden' }); }, 3);
            setTimeout(function () { window.clearInterval(iID); }, delay);
        } else {
            $('.popup_border,.popup_iframe_div').css({ 'min-width': '0px', "min-height": '0px', 'max-width': '100%', "max-height": '100%' });
            $('.popup_overlay,.popup_border,.popup_iframe_div', window.document).css({ 'visibility': 'hidden' });
        }
        try { if (MyCloseFunction) { MyCloseFunction(); MyCloseFunction = undefined; } } catch (e) { }
    }
    else {
        var OrigURL = document.referrer;
        var NewURL = "";
        // work around for multi add training hours and close popup on inline mode.
        if (OrigURL.toLowerCase().indexOf("popups/maint/traininghours.aspx") > 0) {
            OrigURL = OrigURL.substr(0, OrigURL.toLowerCase().indexOf("popups/maint/traininghours.aspx")) + "MemberProfile.aspx" + OrigURL.substr(OrigURL.toLowerCase().indexOf("popups/maint/traininghours.aspx") + 31);
            if (OrigURL.toLowerCase().indexOf("page=training") < 0)
                OrigURL += "&Page=Training";
        }

        NewURL = OrigURL;
        // for these 2 pages (home / profile) there are a lot of actions that can take place.
        // when inline mode we navigate back to the prev URL, and if there are actions in the URL we generally dont want to do them (like error messages for instance)
        // so the following is removing any URL parts that we dont want
        if (OrigURL.toLowerCase().lastIndexOf('scoutsportal.aspx') > 0 || OrigURL.toLowerCase().lastIndexOf('memberprofile.aspx') > 0) {
            // get raw URL (no params)
            if (OrigURL.lastIndexOf('?') > 0)
                NewURL = OrigURL.substr(0, OrigURL.lastIndexOf('?'));

            // for profile, add back a few we want to keep)
            if (OrigURL.toLowerCase().lastIndexOf('memberprofile.aspx') > 0) {
                var Params = OrigURL.substr(OrigURL.lastIndexOf('?') + 1);
                for (var i = 0; i < Params.split('&').length; i++) {
                    if (Params.split('&')[i].indexOf('Page=') >= 0 || Params.split('&')[i].indexOf('CN=') >= 0)// allowed params to keep
                        NewURL += (NewURL.indexOf('?') > 0 ? "&" : "?") + Params.split('&')[i];
                }
            }
        }
        // ensure no duff/blank URLS
        if (!OrigURL)
            NewURL = window.location.href.substr(0, window.location.href.toLowerCase().lastIndexOf('popup')) + "ScoutsPortal.aspx";
        window.location.href = NewURL;
    }
    return false;
}

function iFrameActive() { return (pk_UsePopup() && ($(".popup_iframe_div").css("visibility") === "visible" || vOpeningFrame)); }

var vOpeningFrame = false;
function OpeniFrame(URL, Top, Width, Height, MinWidth, MinHeight, ShowBusyMessage, ForceInline) {
    HasChanges = false;
    vOpeningFrame = true;
    // when opening popup, remove timer for countdown
    clear_countdown(vCountdownIDX);
    //startTimeout(); // keeping old timer alive

    if (!pk_UsePopup() || ForceInline) {
        var showBusy = false; // do we want this on for inline (ipad etc)???
        if (showBusy)
            ShowBusy_Main(URL);
        else
            window.location.href = URL;
    }
    else {
        if ($.Is_MSIE(7) || $.Is_MSIE(8)) { $(".popup_overlay").css({ "background-color": "rgb(68, 86, 96)" }); }
        $('.popup_border').css({ 'visibility': 'visible', 'width': '100%', 'height': '100%', 'top': '70%' });

        if (ShowBusyMessage) {
            $('.popup_border').addClass("busyborder");
            if ($.Is_MSIE(7) || $.Is_MSIE(8)) { $('.popup_border').css({ 'top': '45%', 'left': '45%' }); }
            else { $('.popup_border').css({ 'top': '50%' }); }
            $('.popup_border').css({ 'width': '100%', 'height': '100%', 'min-width': '0px', 'min-height': '0px' });
            $(".popup_loading_div").css({ "left": "0px", "visibility": "visible", "margin-left": "5px", "margin-top": "5px", "opacity": "1" });
            $(".popup_border").css({ width: "56px", height: "56px"});/*400*/
            $(".popup_border, .popup_loading_div").css({ "display": "block" });
        }
        else {
            $('.popup_border').css({ width: "0px", height: "0px", 'min-width': '0px', 'min-height': '0px', 'top': '50%', "visibility": "hidden" });
        }

        $(".popup_iframe_div").css({ "visibility": "hidden", "display": "none" });
        //$(".popup_iframe_div").html("<iframe id=\"popup_iframe\" width=\"100%\" height=\"100%\" frameborder=\"0\" scrolling=\"no\" src=\"about:blank\" onload=\"iFrameSize('" + Top + "','" + Width + "','" + Height + "','" + MinWidth + "','" + MinHeight + "');\" ></iframe>");
        $(".popup_iframe_div").html("<iframe id=\"popup_iframe\" width=\"100%\" height=\"100%\" frameborder=\"0\" scrolling=\"no\" src=\"about:blank\" ></iframe>");
        $("#popup_iframe").attr("src", URL).load(function () { iFrameSize(Top, Width, Height, MinWidth, MinHeight); });
        $('.popup_overlay').css({ 'visibility': 'visible', "display": "none", "cursor": "wait" });
        $('.popup_overlay').fadeIn();
    }
}

function iFrameSize(SetTop, SetWidth, SetHeight, MinWidth, MinHeight) {
    // only called in popup mode to set initial values
    $('.popup_border').removeClass("busyborder");
    $(".popup_iframe_div").css({ "visibility": "visible" });
    if ($('.popup_loading_div')) $('.popup_loading_div').css({ "visibility": "visible", "display": "none" });
    $('.popup_border').css({ "visibility": "visible","display":"none" });
    $('.popup_overlay').css({ "cursor": "default" });
    if (SetTop) { $('.popup_border').css({ 'top': SetTop }); }
    else { $('.popup_border').css({ 'top': '69%' }); }
    if (!MinWidth) MinWidth = SetWidth;
    if (!MinHeight) MinHeight = SetHeight;
    $('.popup_border,.popup_iframe_div').css({ 'min-width': '0px', "min-height": '0px', 'max-width': '100%', "max-height": '100%' });
    $('.popup_border').css({ width: SetWidth, height: SetHeight, 'max-width': SetWidth });/*500*/
    $('.popup_border,.popup_iframe_div').css({ 'min-width': MinWidth, 'min-height': MinHeight });

    $(window).bind('orientationchange', OrientationChange);
    $("#popup_iframe").off("load");
    tmpWidth = SetWidth;

    setTimeout(function () {
        if ($.Is_MSIE(8) || $.Is_MSIE(7))
        {
            $(".popup_border", parent.document.body).center(undefined, true);
            $('.popup_border').fadeIn(100);
            $('.popup_iframe_div').fadeIn(250);
        }
        else
        {
            $('.popup_iframe_div').fadeIn(250);
            $('.popup_border').fadeIn(100);
        }
        vOpeningFrame = false;
        STO = false;
        STO_Check = undefined;
    },200);
}

function ShowLoadingMessage(DontShowMessage) {
    if (!Navigator_OnLine()) {
        alert("There is no internet connection at the moment.");
        return false;
    }

    $('.uv-top-right.uv, .uv-icon').hide();

    if (!DontShowMessage) {
        $('#mstr_busy').show();
        $('#mstr_panel').hide();
    }
    return true;
}

function HideLoadingMessage() {
    $('#main_working_panel_busy_message').css("display", "none");
    $('#ctl00_main_working_panel').css("display", "block");
}

var CustomResize;

var LastMasterX;
var LastMasterY;

function DoResize() {
    LastMasterX = undefined;
    LastMasterY = undefined;
    MainPageSize();
}

function MainPageSize() {
    //return;
    if (StopResize) return;

    // if page has not re-sized dont bother with code below (timer optimisation basically)
    if (LastMasterX && LastMasterX === $("body").width() && LastMasterY === $(window).height())
        return;

    $("html").css("font-size", GetFontSize());

    try {
        if (!positionMenus()) {
            // no changes, so form is at rest, so mark measurements
            LastMasterX = $("body").width();
            LastMasterY = $(window).height();
        }
        else {
            // for size is changing so allow re-sizes.
            LastMasterX = undefined;
            LastMasterY = undefined;
        }
    } catch (e) {
        LastMasterX = undefined;
        LastMasterY = undefined;
        return;
    }

    InternetCheck(false);
    CenterMainPopups();

    try {
        // Page Item Visibility
        if ($('#ctl00_mstr_foot').size() > 0 && $('#ctl00_mstr_foot').html().iTrim() === "")
            $('#ctl00_mstr_foot').css("display", "none");

        if (pk_val("Master.Sys.App")) {
            $("#mstr_menu").hide();
            var WorkingArea = $(window).height() - ($('#ctl00_mstr_foot').css("display") !== "none" || $.Is_MSIE(7) || $.Is_MSIE(8) ? $('#ctl00_mstr_foot').height() - 8 : 0);
            $('#mstr_scroll').height(WorkingArea);
        } else {
            // Variables /  Get Menu Dimensions (if wrap of menu items)
            var HeaderBarHeight = $('#mstr_head').height();
            var TitleBarHeight = parseInt(($('#menu2_bar').css("height") ? $('#menu2_bar').css("height") : "0").replace("px", ""), 10) + 32;
            var CombinedHeaderHeight = HeaderBarHeight + TitleBarHeight + (TitleBarHeight > 70 ? 20 : 30);
            var WorkingArea_MinHeight = parseInt($('.mstr_container').css("min-height"), 10);
            var WorkingArea = $(window).height() - CombinedHeaderHeight - ($('#ctl00_mstr_foot').css("display") !== "none" || $.Is_MSIE(7) || $.Is_MSIE(8) ? $('#ctl00_mstr_foot').height() - 8 : 0);
            if (TitleBarHeight > 70) WorkingArea -= 5;

            // set new page dimensions for inner work area and parent scroll area
            $('#mstr_scroll').height(WorkingArea);
            if (TitleBarHeight > 70) $("#menu2_icons").css("margin-top", "36px"); else $("#menu2_icons").css("margin-top", "13px");
            if ($('#mstr_menu').height() !== TitleBarHeight) $("#mstr_menu").height(TitleBarHeight);
            $("#mstr_menu").css({ "padding-bottom": TitleBarHeight > 70 ? "10px" : "1px" });
        }
    }
    catch (e) { }

    // any custom page re-size events
    try { if (CustomResize) CustomResize(); } catch (e) { }
}

function CenterMainPopups() {
    try {
        // center the Alert popup
        if ($("#AlertBox").css("visibility") === "visible" && $("#AlertBox").css("display") !== "none") { $("#AlertBox").center(); }
        else if ($("#HintBox").css("visibility") === "visible" && $("#HintBox").css("display") !== "none") { $("#HintBox").center(); }
        else if ($("#Datepopup").css("visibility") === "visible" && $("#Datepopup").css("display") !== "none") { $("#Datepopup").center(undefined, true); }
        else if ($("#GridColPopup").css("visibility") === "visible" && $("#GridColPopup").css("display") !== "none") {
            if ($.Is_Android() || $.Is_IPad() || $.Is_IPhone()) $("#GridColPopup").center(undefined, true);
        }

        try { if ($(".CompatabilityMode").css("display") === "block") $(".CompatabilityMode").center("10px", true); } catch (e) { }
        try { if ($(".OffLine").css("display") === "block") $(".OffLine").center("10px", true); } catch (e) { }
    }
    catch (e) { }
}

function MakeFormReadonlyForSave(OptionalHideItems, CustomFooterMessage) {
    if (OptionalHideItems)
        $(OptionalHideItems).remove();

    $("select, input[type='radio'], input[type='checkbox']").attr("disabled", "disabled");
    $("input,textarea").attr("readonly", "readonly");
    $(".DateLookupButton, .QuickSearchButton, .rfv, .W3C, .InfoButton, .uv-top-right.uv, .uv-icon").remove();

    if (!pk_val("Master.Sys.SaveButtons")) {
        $(".footerbutton, .closepopevt").remove();

        if ($(".footerbuttongreen").closest(".fpage").length === 0) {
            $(".footerbuttongreen").closest("#popup_footer").html("<div class='popup_footer_left_div' style='width: 100%; text-align: center;'><hr class='noPrint foot_hr'/><label>" + (CustomFooterMessage ? CustomFooterMessage : "Saving Data....") + "</label></div>");
        }
        else {
            $(".footerbuttongreen").closest(".fpage").each(function () {
                $(this).html("<div class='popup_footer_left_div' style='width: 100%; text-align: center;'><label>" + (CustomFooterMessage ? CustomFooterMessage : "Saving Data....") + "</label></div>");
            });
        }
        $(".footerbuttongreen").remove();

        if (pk_UsePopup() && !pk_val("Page.DontAnimate")) {
            SetEnabled();
            window.parent.CloseiFrame_Animate();
            return;
        }
    }

    SetEnabled();
}

function CloseiFrame_Animate()
{
    if ($.Is_MSIE(8)) {
        $(".popup_border").hide().css("visibility","hidden");
        $('.popup_overlay').hide();
        ShowLoadingMessage();
    }
    else
        setTimeout(function () {
            if (!$("#popup_iframe").attr("error") && $(".popup_border").is(":visible") && $("#popup_iframe").attr("src")) {
                $(".popup_border, .popup_overlay").hide();
                ShowLoadingMessage();
            }
        }, 2000);

    if (window.location.href.toLowerCase().indexOf("memberprofile") > 0) { ShowLoadingMessage(); }
}

/*********************** Popup Form Functions *****************************/

function SearchButtonClick(ctrl) {
    if ($('#' + ctrl).val() === "") $.FocusControl('#' + ctrl, true);
    else GotoCN($('#' + ctrl).val());
    return false;
}

function isLandscape() { return ($(window).width() > $(window).height()); }
function isPortrate() { return ($(window).width() < $(window).height()); }

function OrientationChange(e) {
    if ($(window).width() < parseInt(tmpWidth.replace("px", ""), 10))
        $("#popup_iframe").width($(window).width() - 20);
    else
        $("#popup_iframe").width(tmpWidth);
}

function DoPopupReSize(CalledFrom) {
    LastMasterX = undefined;
    LastMasterY = undefined;
    PopupPageSize(CalledFrom);
}

function PopupPageSize(CalledFrom) {
    // CalledFrom = {STARTUP/RESIZE/TIMER}
    try { if (StopResize) return; } catch (e) { return; }

    // do page font sizing
    if (CalledFrom === "STARTUP") {
        $("html").css("font-size", GetFontSize());
        // randomly Safari didnt like search.email input types on popups..! (ipad etc ok)
        if ($.Is_Safari()) {
            $("input[type=search],input[type=email]").attr("type", "text");
        }
    }
    else {
        if (pk_UsePopup()) {
            try
            {
                if (LastMasterX && LastMasterX === $(window.parent).width() && LastMasterY === $(window.parent).height())
                    return;
            } catch (e) { }
        }
        else
        {
            if (LastMasterX && LastMasterX === $(window).width() && LastMasterY === $(window).height())
                return;
        }

        CenterPopupPopups();
    }

    // if loading is showing, dont do main re-size
    if ($(".popup_loading_div", parent.document.body).css("visibility") === "visible" && $(".popup_iframe_div", parent.document.body).css("visibility") !== "visible") {
        $(".popup_border").css({ width: "56px", height: "48px" });
        return;
    }

    // mac safari bug where bottom bar didnt redraw correctly (god knows) so LEAVE THIS LINE IN! (KK tsa-457,454,440,441)
    if ($.Is_Safari() || $.Is_IPad() || $.Is_IPhone())
        $('#popup_footer').hide().show(0);

    var vIsSettingPage = window.location.href.toLowerCase().toString().indexOf("settings.aspx") > 0;
    var HideMenu = (!$("#popup_container").html() || !$("#popup_container").html().replace(/\s+/, "")) ? 1 : 0; // 0 = normal witj panel, 1 = no panel, 2 = portrait so hide panel (or shown if landscape = 0)
    var FullPageHeight;
    var HeaderHeight = parseInt($("#popup_header").height(), 10);
    var vIsIE7or8 = ($.Is_MSIE(7) || $.Is_MSIE(8)) && !pk_val("Master.Sys.App");

    if (!pk_UsePopup())
        //#region Non Popup size Event
        try {
            if (!UseWidth) {
                if (isPortrate() && ($.Is_IPad() || $.Is_Android()))
                    $(document.body).css({ "max-width": "768px", "width": "768px", "min-width": "768px" });
                else
                    $(document.body).css({ "max-width": "990px", "width": "990px"});
            }
            else
                $(document.body).css({ "max-width": UseWidth, "width": UseWidth });

            if (UseMinWidth)
                $(document.body).css({ "min-width": UseMinWidth });

            if ($(window).width() > $(window.document.body).width())
                $(document.body).center(undefined, true);
            else
                $(document.body).css("left", "");

            if (vIsSettingPage && !pk_UsePopup() && ($.Is_MSIE(8) || $.Is_MSIE(7)))
                $(document.body).center(undefined, true);

            FullPageHeight = $(window).height() - 42;

            if (UseMinHeight)
                $(document.body).css("min-height", UseMinHeight);

            if (UseHeight) {
                $(document.body).css("height", UseHeight);
                FullPageHeight = $(document.body).height();
            }

            if (UseTop)
                $(document.body).css("top", UseTop);

            if (FullPageHeight < 350)
                FullPageHeight = 350;

            // hide left menu if applicable and set main area size accordingly
            if (window.location.toString().indexOf("MemberSearch.aspx") < 0 && parseInt($(document.body).css("width").replace("px", ""), 10) >= $(window).width())
                HideMenu = 2;

            // for diagnosis : get relevant sizes and put in top title
            //$("#Popup_MainTitle").text("Body.Width:" + parseInt($(document.body).css("width").replace("px", ""), 10).toString() + "  - Window.Width:" + $(window).width());

            if (HideMenu > 0) {
                $("#popup_container").css({ "display": "none" });
                if (HideMenu > 1)
                    $('.popup-inlineframe').width($(window).width() - 20);
                $('#popup_work,#Popup_MainTitle').width($('#popup_scroll').width());
                $(".Popup-Inline-Border").height("100%");

                //$("#popup_container").css("display", "none");

                //if (!$.Is_MSIE(8))
                //    $('#popup_work').css("width","100%");
                //else
                //    $('#popup_scroll').width($('#popup_work').width());
            }
            else {
                $("#popup_container").css({ "display": "block" });
                if ($.Is_MSIE(7) && !pk_val("Master.Sys.App"))
                    $('#popup_work').width($('#popup_scroll').width() - 210);
                else if ($.Is_MSIE(8) && !pk_val("Master.Sys.App"))
                    $('#popup_work').width($('#popup_scroll').width());
                else
                    $('#popup_work').width($('#popup_scroll').width() - $('#popup_container').width() - 13);

                if ($.Is_MSIE(8) && !pk_val("Master.Sys.App"))
                    $("#popup_scroll").css({ "margin-left": $('#popup_container').width() });

                $('.popup-inlineframe').css({ "margin-top": "0px", "position": "absolute", "height": "100%", "width": Math.ceil($('#popup_scroll').closest(".popup-form").width()) });
            }

            if (vIsIE7or8) {
                $("#popup_work").css({ "position": "absolute" });
                if (vIsSettingPage || $.Is_MSIE(7))
                    $("#popup_work").css("width", "100%");

                if ($.Is_MSIE(7)) {
                    $(".body-popup").css({ "height": Math.ceil(FullPageHeight) });
                    $(".popup-form").css({ "height": Math.ceil(FullPageHeight + 35) });
                }
                else if ($.Is_MSIE(8)) {
                    $(".body-popup").css({ "height": Math.ceil(FullPageHeight - 10), "width": $('#popup_scroll').width() + 10 });
                    $(".popup-form").css({ "height": Math.ceil(FullPageHeight - 15) });
                }
            }
            else $(".popup-form").css({ "height": Math.ceil(FullPageHeight) });

            $(".Popup-Inline-Border").css({ "padding-top": "0px", "margin-bottom": "0px" });
            $("#popup_scroll").height(FullPageHeight - 120);
            $(".body-popup,.popup-form").css({ "height": "100%", "top": "0px", "margin-top": "0px" });
            $('.popup-inlineframe').height($(window.document).height() - 35);

            if (vIsSettingPage) {
                $('#popup_work,#popup_container').css({ "overflow": "auto", "height": $(window).height() - HeaderHeight - 40 });
                $("#popup_work").css("padding-left", "0px");
            }
            else {
                $('#popup_work,#popup_container').css({ "overflow": "auto", "height": $(window).height() - HeaderHeight - 40 });
                $("#popup_work").css("padding-left", "2px");
            }

            $("#popup_footer,#popup_header").css({ "padding-left": "5px", "padding-right": "0px" });
            $("#popup_footer").css({ "width": $("#popup_header").width(), "margin-bottom": "0px" });

        } catch (e) {
            //alert("Popup.Master.PopupPageSize().Exception=" + e.description);
        }
        // NOTE: the footer (72 small text/95 for big text) in this line and above in the margin-bottom need to be the same (except margin bottom is a negative)
        // NOTE2: the items above with style values (form1,popup_scroll,popup_work),
        //        have to be here because of the ordering, they dont work from css and break the page formatting (so dont move them).

    //#endregion
    else
        //#region Popups size Event
        try {
            $("#popuphtml").css("background-color", "transparent");
            if (vIsIE7or8) { $('.popup_border').css({ 'top': '45%', 'left': '45%' }); }

            FullPageHeight = $('.popup_iframe_div', parent.document.body).height() || 600;
            $(document.body).height(FullPageHeight);
            $("#popup_scroll").height(Math.ceil((FullPageHeight + 5) - HeaderHeight - 53));

            if ($.Is_MSIE(8)) $("#popup_work").css({ "top": HeaderHeight + 2, "position": "absolute" });
            $("#popup_work").css({ "padding-top": "5px" });
            $('#popup_container').css({ "overflow": "auto", "height": $("#popup_scroll").height() });
            $('#popup_work').css({ "overflow": "auto" }).height($("#popup_scroll").height());

            var MyWidth = parseInt($(".popup_border", parent.document.body).css("width").replace('px', ''), 10);
            if (!vIsIE7or8 && $(".popup_border", parent.document.body).css("width").match("px")) {
                var PageWidth = $(window.parent).width();
                var MaxWidth = $(".popup_border", parent.document.body).css("max-width");
                if (MaxWidth.indexOf("%") > 0)
                    MaxWidth = (PageWidth / 100) * parseInt($(".popup_border", parent.document.body).css("max-width").replace('px', ''), 10);
                else
                    MaxWidth = parseInt($(".popup_border", parent.document.body).css("max-width").replace('px', ''), 10);
                var MinWidth = parseInt($(".popup_border", parent.document.body).css("min-width").replace('px', ''), 10);
                if (PageWidth < MyWidth && MyWidth < MinWidth) $(".popup_border", parent.document.body).css({ "width": MinWidth });
                else if (PageWidth > MaxWidth) $(".popup_border", parent.document.body).css({ "width": MaxWidth });
                else $(".popup_border", parent.document.body).css({ "width": PageWidth - 20 });
            }
            else
                $(".popup_border", parent.document.body).css({ "width": "90%" });

            if (HideMenu !== 1 && (!$(".popup_border", parent.document.body).css("max-width") || window.location.toString().indexOf("MemberSearch.aspx") < 0 && parseInt($(".popup_border", parent.document.body).css("max-width").replace("px", ""), 10) > $(parent.window).width())) {
                HideMenu = 2;
            }
            else {
                if (vIsIE7or8) { $(".popup_border", parent.document.body).center(undefined, true); }
                else { $(".popup_border").center(undefined, true); }
            }
        // hide left menu if applicable and set main area size accordingly
            if (HideMenu > 0) {
                $("#popup_container").css({ "display": "none" });
                $('.popup-inlineframe').width(MyWidth);
                if (HideMenu === 1) $("#popup_footer").width($('#popup_scroll').width()).css("padding-left", "5px");
                $('#popup_work,#Popup_MainTitle').width($('#popup_scroll').width());
                // when removing nav panel, add a little padding (as was to close to edge)
                $("#popup_scroll").css("margin-left", "5px");
            }
            else {
                $("#popup_scroll").css("margin-left", "0px");
                $('#popup_work').css("padding-left", "0px");
                $("#popup_container").css({ "display": "block" });
                if (vIsIE7or8) {
                    $('#popup_work').width($('#popup_scroll').width());
                    if ($.Is_MSIE(8))
                        $("#popup_scroll").css({ "margin-left": $('#popup_container').width() });
                }
                else
                    $('#popup_work').width($('#popup_scroll').width() - $('#popup_container').width() - 13); // this is the chrome wrap bug.
                $('.popup-inlineframe').css({ "margin": "0px", "position": "absolute", "min-width": "" }).width(Math.ceil($('#popup_scroll').closest(".popup-form").width())).height(Math.ceil($('#popup_scroll').closest(".popup-form").height()));
            }

        // double check stuff
            $('.popup_iframe_div', parent.document.body).width("100%");

            if ($('.popup_iframe_div', parent.document.body).css("visibility") === "visible")
                $('.popup_overlay', parent.document.body).css({ 'visibility': 'visible' });

            if ($.Is_IPad() || $.Is_IPhone()) // but NOT android or normal browsers
            {
                $(window.parent).scrollLeft(0);
                $("#popup_iframe").width($(document.dody).width());
            }
        }
        catch (e) {
            //alert("Popup.Master.PopupPageSize().Exception=" + e.description);
        }
    //#endregion

    if (window.location.href.toLowerCase().indexOf("settings.aspx") > 0) {
        if (pk_val("Master.Sys.TextSize") === "0") $(".popup_footer_left_div, .popup_footer_right_div, .popup_footer_alt_div").css({ "margin-top": "-8px" });
        if (pk_val("Master.Sys.TextSize") === "1") $(".popup_footer_left_div, .popup_footer_right_div, .popup_footer_alt_div").css({ "margin-top": "-5px" });
        if (pk_val("Master.Sys.TextSize") === "2") $(".popup_footer_left_div, .popup_footer_right_div, .popup_footer_alt_div").css({ "margin-top": "-5px" });
    }
    else {
        if (pk_val("Master.Sys.TextSize") === "0") $(".popup_footer_left_div, .popup_footer_right_div, .popup_footer_alt_div").css({ "margin-top": "-6px" });
        if (pk_val("Master.Sys.TextSize") === "1") $(".popup_footer_left_div, .popup_footer_right_div, .popup_footer_alt_div").css({ "margin-top": "" });
        if (pk_val("Master.Sys.TextSize") === "2") $(".popup_footer_left_div, .popup_footer_right_div, .popup_footer_alt_div").css({ "margin-top": "0px" });
    }

    if (pk_UsePopup()) {
        LastMasterX = $(window.parent).width();
        LastMasterY = $(window.parent).height();
    }
    else {
        LastMasterX = $(window).width();
        LastMasterY = $(window).height();
    }

    $('.uv-top-right.uv, .uv-icon').css({ 'right': '40px', 'top': '1px', 'visibility': 'visible' });
}

function CenterPopupPopups() {
    try {
        if ($("#AlertBox").css("visibility") === "visible" && $("#AlertBox").css("display") !== "none") { $("#AlertBox").center(); }
        if ($("#HintBox").css("visibility") === "visible" && $("#HintBox").css("display") !== "none") { $("#HintBox").center(); }
        if ($("#Datepopup").css("visibility") === "visible" && $("#Datepopup").css("display") !== "none") { $("#Datepopup").center(undefined, true); }
        if ($("#GridColPopup").css("visibility") === "visible" && $("#GridColPopup").css("display") !== "none") {
            if ($.Is_Android() || $.Is_IPad() || $.Is_IPhone())
                $("#GridColPopup").center(undefined, true);
        }

        if ($(".OffLine").css("display") === "block" && $("#AlertBox").css("display") !== "none") $(".OffLine").center("10px", true);
        if ($(".CompatabilityMode").css("display") === "block") $(".CompatabilityMode").center("10px", true);
    }
    catch (e) { }
}

//****************** Top Menu Items ***************************

function menu_hidePopupWindows(e) {
    try
    {
        for (var i = 0; i < popupWindowObjects.length; i++) {
            if (popupWindowObjects[i] && !$.Is_Clicked(e, "#divJoiningMenu") && !$.Is_Clicked(e, "#divTrainingMenu") && !$.Is_Clicked(e, "#divMessagingMenu") && !$.Is_Clicked(e, "#divSystemMenu") && !$.Is_Clicked(e, "#divSearchMenu") && !$.Is_Clicked(e, "#divChildrenMenu")) {
                closeAllMenus();
            }
        }
    }
    catch (e) { }

    if (MenuTIDX > 0) clearTimeout(MenuTIDX);
    MenuTIDX = -1;
}
function menu_keyupevent(e) { var localEvent; try { localEvent = event; } catch (err) { localEvent = e; } if (localEvent.keyCode === 27) { menu_hidePopupWindows(localEvent); } }
// Run this immediately to attach the event listener
function menu_attachListener() {
    if (document.layers) { document.captureEvents(Event.MOUSEUP); }
    window.popupWindowOldEventListener = document.onmouseup;
    //if (window.popupWindowOldEventListener) { document.onmouseup = new Function("window.popupWindowOldEventListener(); menu_hidePopupWindows();"); }
    if (window.popupWindowOldEventListener) {
        document.onmouseup = function () {
            window.popupWindowOldEventListener();
            menu_hidePopupWindows();
        };
    }
    else { document.onmouseup = menu_hidePopupWindows; }
    document.onkeyup = menu_keyupevent;

    if (!$.Is_IPad() && !$.Is_IPhone() && !$.Is_Android()) { // for browsers, on mouse leave close menu )
        if ($("#divJoiningMenu").length > 0) $("#divJoiningMenu")[0].onmouseleave = closeAllMenus;
        if ($("#divTrainingMenu").length > 0) $("#divTrainingMenu")[0].onmouseleave = closeAllMenus;
        if ($("#divMessagingMenu").length > 0) $("#divMessagingMenu")[0].onmouseleave = closeAllMenus;
        if ($("#divSystemMenu").length > 0) $("#divSystemMenu")[0].onmouseleave = closeAllMenus;
        //$("#divSearchMenu")[0].onmouseleave = closeAllMenus;
        if ($("#divChildrenMenu").length > 0) $("#divChildrenMenu")[0].onmouseleave = closeAllMenus;
    }
    else // for ipad/iphone/android, set 10 sec timer to auto close popup menu windows
        document.onmousemove = IsOverMenuItem;
}

var MenuTIDX = -1;
function IsOverMenuItem(e) {
    if (MenuTIDX < 0) {
        if ($("#divJoiningMenu").is(":visible") || $("#divTrainingMenu").is(":visible") || $("#divMessagingMenu").is(":visible") || $("#divSystemMenu").is(":visible") || $("#divSearchMenu").is(":visible") || $("#divChildrenMenu").is(":visible")) {
            MenuTIDX = setTimeout(closeAllMenus, 10000);
        }
    }
}

/*********************** Main Form Functions *****************************/
var iID = -1;
var strMessage = "";
var HasChanges = false; // global has popup had any input/select change (variable) (the popup close event checks this for whether to prompt close Y/N)
var UseWidth = "";
var UseMinWidth = "";
var UseHeight = "";
var UseMinHeight = "";
var UseTop = "";
var tmpWidth = "";

//"Message here to remind users of their <b>Data Protection</b> responsibilities, delete data once finished with it etc.<br /><em><b>TSA to provide text for this dialog.</b></em><br />";

var Scouts_DP_Page = "https://members.scouts.org.uk/supportresources/1861/data-protection-and-scouting?cat=55,400&moduleID=10"; //TSA to supply page on their site
//var Scouts_RoleDec_Page = "https://members.scouts.org.uk/documents/appointment/adult%20information%20form%20Nov%202014-print%20friendly.pdf"; //TSA to supply page on their site
var Scouts_RoleDec_Page = '<%=ConfigurationManager.AppSettings["AdultInformationFormURL"]%>';
//IRIS.NG.WebConfig.Paths.AWARD_GUIDANCE_URL

var DataProtection_Message =
    "You are exporting data from the system, please ensure you maintain this information in accordance with the Data Protection Act.<br /><br /><em><a target='_blank' href='" + Scouts_DP_Page + "'>Read about your data protection responsibilities here.</a></em><br /><br />";

var AdultJoining_DataProtection_Message =
    //"By selecting OK you are confirming that permission has been given to hold this information.<br /><br /><em><a target='_blank' href='" + Scouts_DP_Page + "'>Read about your data protection responsibilities here.</a></em><br /><br />";
  "<div style='text-align:left;'>&nbsp;&nbsp;By selecting OK you are confirming that the data has been<br/>&nbsp;&nbsp;provided by the Applicant who has:<br/><br/>&nbsp;&nbsp;&nbsp;1. Confirmed that the data is correct;<br/>&nbsp;&nbsp;&nbsp;2. Provided consent for the data to be held;<br/>&nbsp;&nbsp;&nbsp;3. Read and accepted the declarations with regard to<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Scouting Values Data Protection and (where relevant)<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;the Trustee Declaration<br /><br /><em>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='{0}'>Access the role declarations here.</a></em><br /><em>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='" + Scouts_DP_Page + "'>Read about your data protection responsibilities here.</a></em></div>";
    //"<div style='text-align:left;'>&nbsp;&nbsp;By selecting OK you are confirming that the data has been<br/>&nbsp;&nbsp;provided by the Applicant who has:<br/><br/>&nbsp;&nbsp;&nbsp;1. Confirmed that the data is correct;<br/>&nbsp;&nbsp;&nbsp;2. Provided consent for the data to be held;<br/>&nbsp;&nbsp;&nbsp;3. Read and accepted the declarations with regard to<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Scouting Values Data Protection and (where relevant)<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;the Trustee Declaration<br /><br /><em>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='" + Scouts_RoleDec_Page + "'>Access the role declarations here.</a></em><br /><em>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='" + Scouts_DP_Page + "'>Read about your data protection responsibilities here.</a></em></div>";

var YouthJoining_DataProtection_Message =
    "By selecting OK you are confirming that parental/guardian permission has been given to hold this information.<br /><br /><em><a target='_blank' href='" + Scouts_DP_Page + "'>Read about your data protection responsibilities here.</a></em><br /><br />";

var ResizePingInterval = 500;
var intx = null;