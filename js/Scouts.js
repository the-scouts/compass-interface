//#region standard Web Site Fun

var vReqFocused = false; // global var for when doing check required loop, that the first edit has been focused
var vValid = true; // global var for when looping all Required fields, this flag is the valid variable.
var DuplicateMessageShown = false; // global var for closing a form (duplicate presses) has the message been shown
var SaveHasBeenPressed = false; // global var for Save has been pressed on a popup
var DeleteHasBeenPressed = false; // global var for Delete has been presses on a popup
var PauseGridColour = false;
var CountryOrganisationNumber = -1;
var vIsReadonly = false; // global vIsReadonly Var (set by SetUpPage, or just as global var)
var vInsertMode = false; // global vInsertMode Var (set by SetUpPage, or just as global var)

var vUseTimers = true;
function setIntervalADV(obj, ms, aSync) {
    if (vUseTimers) {
        if (aSync) // if set, do standard interval, otherwise, start timer when this task is done. NOTE: not aSync the index wont work.
            return setInterval(obj, ms);
        else
            try
            {
            return setTimeout(function () { obj(); setIntervalADV(obj, ms); }, ms);
            } catch (e){}
    }
}

function WriteAudit(pCategory, pText, pData, pNotes) {
    //var URLParams = "pAct=" + pText + "&pCat=" + pCategory + "&pData=" + pData + "&pNotes=" + pNotes;
    //$.ajax({
    //    url: WebServicePath() + "WriteAudit?" + URLParams, async: true
    //});
}

function TopCheck(W3C) {
    if (!$.Is_MSIE(8)) {
        if (!W3C && self == top && pk_UsePopup() && self.location.toString().toLowerCase().indexOf("settings.aspx") < 0 && !pk_val("Master.Sys.InLine")) {
            BBO("PopupAccess");
            alert('These popup pages cannot be used directly. Thank you.');
        }
        // check the popup is in this site (not another trying to hijack it)
        if (top.location.host.toLocaleLowerCase() !== self.location.host.toLocaleLowerCase())
        {
            BBO("IllegalAccess");
            alert('These popup pages cannot be used outside the portal. Thank you.');
        }
    }
}

function BBO(MSG) {
    // Bad Boy Out Routine
    var go = "";
    if (window.location.href.indexOf("/Popups") > 0) {
        go = window.location.href.substr(0, window.location.href.indexOf("/Popups")) + "/ScoutsPortal.aspx";
    }
    else {
        go = window.location.href.substr(0, window.location.href.lastIndexOf("/")) + "/ScoutsPortal.aspx";
    }
    go += (MSG ? "?Invalid=" + MSG : "");

    top.location.href = go;
}

function FixFoldimageTop() {
    // on base forms the top spacing needs to be set slightly off from the CSS.
    if (pk_val("Master.Sys.TextSize") === "0") $(".foldimage").css({ "margin-top": "9px" });
    if (pk_val("Master.Sys.TextSize") === "1") $(".foldimage").css({ "margin-top": "7px" });
    if (pk_val("Master.Sys.TextSize") === "2") $(".foldimage").css({ "margin-top": "7px" });
}

function SelectDistributionLists() {
    SH_Search(false, '#divSearch');
    $.ajax({
        url: WebServicePath() + "GetContactDistLists?pSearch=Y", success: function (result) {
            var html = "<div style='max-height:150px; overflow:auto;'><table style='width:100%;'>";

            if (result.d && result.d.length > 0) {
                for (var i = 0; i < result.d.length; i++) {
                    html += "<tr class='msTR' style='height:25px;'><td class='label' style='cursor:default;'>" + result.d[i].Description.HTMLQuotes() +
                            "</td><td style='text-align:right;width:75px;'><input type='button' value='Select' class='clsdls' data-pk='" + result.d[i].Value + "'></input></td></tr>";
                }
            }
            else html += "<tr><td style='text-align:center;'><h3>There are no lists currently available</h3></td></tr>";
            html += "</div></table><br/>";

            var buttonbar = "<input type='button' class='sysmsg_close' value='Close'>";

            $.system_window(html, "<h2>Select Distribution List</h2>", buttonbar);
            $(".clsdls").click(function () { CloseHintPopup(); RunDistributionList($(this).attr("data-pk")); return false;}).css("width","65px");
        }, error: ServiceFailed
    });

    return false;
}

function UpdateProfileImage() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/EditProfile.aspx?StartPage=10&UseCN=' + pk_val("Page.UseCN"), '69%', '1000px', '90%', '550px', '320px', true, false);
    return false;
}

function SetEnabled(pContainer) {
    //TSA-588 (KK): ensure ReadOnlyInput class is removed/applied to the correct subset of controls

    if (pContainer) {
        $("select:disabled", pContainer).addClass("ReadonlyInput");
        $("select:enabled, input:enabled", pContainer).not("[type=button]").not("[type=checkbox]").not("[type=radio]").removeClass("ReadonlyInput");
        $("[readonly=readonly]", pContainer).addClass("ReadonlyInput");
        $("input[type=checkbox], input[type=radio]", pContainer).css("background-color", "transparent");
    }
    else {
        $("select:disabled").addClass("ReadonlyInput");
        $("select:enabled, input:enabled").not("[type=button]").not("[type=checkbox]").not("[type=radio]").removeClass("ReadonlyInput");
        $("[readonly=readonly]").addClass("ReadonlyInput");
        $("input[type=checkbox], input[type=radio]").css("background-color", "transparent");
    }
}

function GotoCN(CN, TAB, CMD,IDX) {
    if (!ShowLoadingMessage())
        return false;
    var Params = "";
    if (CN) Params = Append(Params, "CN", CN);
    if (TAB) Params = Append(Params, "Page", TAB);
    if (CMD) Params = Append(Params, "Action", CMD);
    if (IDX) Params = Append(Params, "Number", IDX);
    if (pk_UsePopup() && window.location.href.toLowerCase().indexOf('/popups/') > 0) {
        clear_countdown(vPopCountdownIDX);
        window.parent.ShowLoadingMessage();
        window.parent.location.href = WebSitePath() + 'MemberProfile.aspx' + Params;
        window.parent.CloseiFrame();
    }
    else { window.location.href = WebSitePath() + 'MemberProfile.aspx' + Params; }

    return false;
}

function ShowInvalidMessage(InvalidType) {
    // if on popup dont show, software will make this top page in a mo..
    if (pk_UsePopup() && window.location.href.toString() !== window.parent.location.href.toString())
        return;

    if (InvalidType === "Custom" && meta_val("ERROR_DETAIL"))
        $.system_alert(meta_val("ERROR_DETAIL"));

    // we have:
    // AccessON, AccessCN, Access, Reference, SearchError, PopupAccess, MemberNo, AccessMEMS, AccessMROL
    else if (InvalidType === "AccessCN")
        $.system_alert("You do not have access to this member with your current role.");

    else if (InvalidType === "WaitON")
        $.system_alert("This person has been placed on a joining list that is outside your hierarchy, cannot continue.");


    //TP-451 https://jira.isg.co.uk/browse/TP-451
    //        The AccessCN message is confusing for users when they receive it at the end of the adult/youth
    //        joining process as a result of NOT having Member Search permission on their role (MEMS).
    //        Therefore new type of AccessMEMS created for this circumstance. We can put a message in here
    //        if need be, but might as well just quietly ignore the error and let the user be returned to the
    //        portal homepage.
    // It turns out the do want a message, so here it is:
    else if (InvalidType === "AccessMEMS")
        $.system_alert("You do not have access to view this member.");

    //TP-451 Different message for completing adult joining but being unable to go to assign role
    else if (InvalidType === "AccessMROL")
        $.system_alert("These details have been saved to the database, <br/>but you do not have access to assign a role to this member.");

    else if (InvalidType === "AccessON")
        $.system_alert("You do not have access to this organisation entity with your current role.");

    else if (InvalidType === "SearchError")
        $.system_alert("Your search criteria has timed out or an invalid search has been attempted, so for security reasons you have been re-directed back to your home page.");

    else if (InvalidType === "Reference")
        $.system_alert("An invalid reference number has been supplied.");

    else if (InvalidType === "MemberNo")
        $.system_alert("An invalid member number has been supplied.");

    else if (InvalidType === "Access")
        $.system_alert("Access has not been permitted for the action you are attempting to do.");

        // moved routine in here, so we can have messages on other pages, ive plugged in reports (if running one causes an error)
    else if (InvalidType === "Report")
        $.system_alert("There was a problem running this report. If this problem persists please contact the Scouting Association for assistance.");

    else if (InvalidType === "Avatar")
        $.system_alert("There was a problem uploading your avatar.");

    else if (InvalidType === "Evidence")
        $.system_alert("There was a problem uploading an evidence file.");

    else if (InvalidType === "NewSuspension")
        $.system_alert("Membership has been suspended.");

    else if (InvalidType === "NewCancellation")
        $.system_alert("Membership has been cancelled.");

    else if (InvalidType === "NoMoreRoles")
        $.system_alert("This role has been closed. The member has no other active roles so their membership status has been set to inactive.");

    else if (InvalidType === "FileSize")
        $.system_alert("The file you are trying to upload is too big.");

    else if (InvalidType === "SecurityPostCheck")
        $.system_alert("This post has not passed our internal validation checks. The form data has not been saved." + meta_val("ERROR_DETAIL"));

    else if (InvalidType === "SecurityPostCheckJYP")
        $.system_alert("Parent details in this post have not passed our internal validation checks. The affected parent data has not been saved." + meta_val("ERROR_DETAIL"));

    else if (InvalidType === "SecurityPostCheckJ")
        $.system_alert("This post has not passed our internal validation checks. The joining data has not been saved." + meta_val("ERROR_DETAIL"));

    else if (InvalidType === "SecurityParam")
        $.system_alert("Page tamper event, Your details have been logged." + meta_val("ERROR_DETAIL"));

    else if (InvalidType === "Script")
        $.system_alert("A potentially dangerous Request/Form value was detected from the client, The form data has not been saved.");
}

function PostToHandler(vData, AltHandler, pSuccess, pError, pAsync, pKeepData) {
    try {
        if (AltHandler && AltHandler[0] === "/") AltHandler = AltHandler.substring(1, AltHandler.length);
        // new REST method (only if turned on and not CompassDownload functioanlity)
        if (AltHandler && pk_val("Master.Sys.REST") && AltHandler !== "System/CompassDownload") {
            var vRESTData = "";
            if (pKeepData) {
                vRESTData = JSON.stringify(vData);
            }
            else if (vData) {
                vRESTData = [];
                jQuery.each(vData, function (name, value) { vRESTData.push({ Key: name, Value: value }); });
                vRESTData = JSON.stringify(vRESTData);
            }

            $.ajax({
                url: WebSitePath() + AltHandler,
                type: 'post',
                dataType: "json",
                async: (pAsync ? true : false),
                contentType: "application/json;charset=utf-8",
                processData: false,
                data: vRESTData,
                success: pSuccess,
                error: pError
            });

            return;
        }

        // old functionality (for it REST is turned off, or is login or CompassDownload)
        var PostToURL = (WebSitePath() + (AltHandler || "Login") + ".ashx");

        if (typeof FormData !== 'undefined') { // if not < IE10
            var vFormData1 = new FormData();
            jQuery.each(vData, function (name, value) { vFormData1.append(name, value); });
            $.ajax({ type: "POST", url: PostToURL, data: vFormData1, contentType: false, processData: false, async: (pAsync ? true : false), success: pSuccess, error: pError });
        }
        else {
            var vFormData2 = "__EVENTTARGET=&__EVENTARGUMENT=";
            jQuery.each(vData, function (name, value) { vFormData2 += "&" + name + "=" + value; });
            $.ajax({ url: PostToURL, type: 'POST', dataType: 'json', data: vFormData2, async: (pAsync ? true : false), success: pSuccess, error: pError });
        }
    }
    catch (e) { }
}

function OpenDocument(URL) {
    if ($.Is_Android() || $.Is_IPad() || $.Is_IPhone())
        window.location.href = URL;
    else
        window.open(URL, '_blank');
}

function OpenAttachment(FILENAME, CN) {
    OpenDocument(WebSitePath() + "system/CompassDownload.ashx?pFN=" + FILENAME + "&pSB=" + CN);
    return;
}

function OpenExportDocument(FILENAME) {
    OpenDocument(WebSitePath() + "system/CompassDownload.ashx?pFN=" + FILENAME + "&pBAR=Y");
    return;
}

function OpenDbDocument(CN, URN) {
    OpenDocument(WebSitePath() + "system/CompassDownload.ashx?pDB=Y&pURN=" + URN + "&pCN=" + CN);
    return;
}

function DeleteExportDocument(FILENAME) {
    var vData = {}; //var vData = new FormData();
    vData["pRoutine"] = "DELETE_TEMP_FILE";
    vData["pFN"] = FILENAME;
    PostToHandler(vData, "/System/Funcs");
    return;
}

function PageVisibleDelay() { if ($.Is_FireFox()) return 300; else return 10; }

function ShowOriginalSet() {
    // essentially, this puts the text / select / text box to yellow 'if' a DB original value is set (helps to see youve done all fields),
    // and puts the value in the tip so we can see the value.  these values are set at server populate time.
    // this routine is only for debug assistance, and shoule have return; commented in al all times when not debugging.
    return;

    /*$("input,select,textarea").each(function () {
        if ($(this).data("db") != undefined) {
            $(this).css({ "background-color": "yellow" });
            if ($(this).data("db"))
                $(this).attr("title", $(this).data("db"));
            else
                $(this).attr("title", '[Null]');
        }
    });*/
}

function SetUpPage(Readonly, InsertMode) {
    vIsReadonly = Readonly;
    vInsertMode = InsertMode;

    if (Readonly) MakePageReadOnly();

    if (!InsertMode)
        $(".navbutton").hover(
            function () { if ($(this).data("selected") !== "Y") $(this).not("navbutton_Disabled").addClass("navbutton_hover"); },
            function () { if ($(this).data("selected") !== "Y") $(this).not("navbutton_Disabled").removeClass("navbutton_hover"); }
        );
    else
        $(".navbutton").css("pointer", "default").addClass("navbutton_Disabled");
}

function PrevPageClick(vCheckPN, vGotoPN, func_val, func_page, func_reset) {
    if (func_val(vCheckPN)) func_page(vGotoPN);
    else $.system_confirm("This page is not complete or is invalid, would you like to reset the page data and go to the previous page?", function () {
        func_reset(vCheckPN);
        func_page(vGotoPN);
    });
    return false;
}

function MakeTabVisible(PageNo) {
    try {
        $('.mpage').not('#mpage' + PageNo).css({ "display": "none" });
        $('.navbutton').not('#LBTN' + PageNo).css({ "background-color": "", "color": "" }).removeClass("navbutton_Disabled_Selected").removeClass("navbutton_hover").data("selected", "");
        $('.fpage').not('#fpage' + PageNo).css({ "display": "none" });

        $('#mpage' + PageNo).fadeIn(200);
        $('#LBTN' + PageNo).css({ "background-color": "", "color": "" }).removeClass("navbutton_hover").addClass("navbutton_Disabled_Selected").data("selected", "Y");
        $('#fpage' + PageNo).css({ "display": "block" });
    }
    catch (err) { }
}

function GetCaptionName(L, P, S) {// org level/plural wanted/ issection
    // set of constants for adjusting the name of counties,
    // there is a duplicate routine like this in the server code (in constants)
    //var Marker = "js "; // a visual marker to show this came from javascript
    var Marker = "";

    if (L === 0) return Marker + (S ? (P ? "Organisation Sections" : "Organisation Section") : (P ? "Organisations" : "Organisation"));
    if (L === 1) return Marker + (S ? (P ? "Country Sections" : "Country Section") : (P ? "Countries" : "Country"));
    if (L === 2) return Marker + (S ? (P ? "Regional Sections" : "Regional Section") : (P ? "Regions" : "Region"));
    if (L === 3) {

        if (CountryOrganisationNumber == pk_val("Master.Const.Wales"))
            return Marker + (S ? (P ? "Area Sections" : "Area Section") : (P ? "Areas" : "Area"));
        if (CountryOrganisationNumber == pk_val("Master.Const.Scotland"))
            return Marker + (S ? (P ? "Scottish Regional Sections" : "Scottish Regional Section") : (P ? "Scottish Regions" : "Scottish Region"));
        if (CountryOrganisationNumber == pk_val("Master.Const.OverSeas"))
            return Marker + (S ? (P ? "Branch Sections" : "Branch Section") : (P ? "Branches" : "Branch"));

        // Rest
        return Marker + (S ? (P ? "County Sections" : "County Section") : (P ? "Counties" : "County"));
    }
    if (L === 4) return Marker + (S ? (P ? "District Sections" : "District Section") : (P ? "Districts" : "District"));
    if (L === 5) return Marker + (S ? (P ? "Group Sections" : "Group Section") : (P ? "Groups" : "Group"));
    return "";
}

function SetControlError(ctrl, on) {
    if (on)
        $(ctrl).css({ "border": "1px", "border-style": "solid", "border-color": "red", "background-color": "#f5ebf2" });
    else
        $(ctrl).css({ "border": "", "border-style": "solid", "border-size": "1px", "border-color": "", "border-width": "1px", "background-color": "" });
}

function ShowRequired(self, forceOnOff) {
    // forceOnOff = true for on, false for off, undefined for standard use
    var ThisOK = true;
    HasChanges = true;
    if (forceOnOff)
    {
        $(self).nextAll('span.rfv:first').css({ "visibility": (forceOnOff ? "visible" : "hidden") });
        SetControlError(self, forceOnOff);
    }

    if ($(self).attr("req") === "Y" || $(self).attr("required") === "required") {
        if (!forceOnOff)
            $(self).nextAll('span.rfv:first').css({ "visibility": ($(self).val() === null || $(self).val().iTrim() === "" ? "visible" : "hidden") });

        if ($(self).val() === null || $(self).val().iTrim() === "") {
            if (!vReqFocused) {
                vReqFocused = true;
                $.FocusControl(self);
            }
            vValid = false;
            ThisOK = false;
            if (!forceOnOff) SetControlError(self, true);
        }
        else {// remove any custom settings (will default back to CSS values)
            if (!forceOnOff) SetControlError(self, false);
        }
    }

    // always ensure no checkboxes/radios have borders
    $("input[type='checkbox']").css({ "border": "0px", "border-style": "none", "background-color": "transparent" });
    $("input[type='radio']").css({ "border": "0px", "border-style": "none", "background-color": "transparent" });
    $("input[type='file']").css({ "border": "0px", "border-style": "none" });
    // need to keep this list of button images here so the border does not get put on them,
    // cant set all as proper buttons would then loose there borders and we dont want that either (3 places here + 2 in ResetRequired below))
    $(".QuickSearchButton, .DateLookupButton, .AddressLookupButton, .CopyButton, .Wizard").css({ "border": "", "border-style": "", "border-color": "", "background-color": "" });
    return ThisOK;
}

function ResetRequired(page) {
    // call required routine, so it adds the required marker on non filled in items (basically doing a required check)
    // but then (next bity after this) remove the red border so the required is not reset
    if (page) {
        $("input[req='Y'],select[req='Y'],textarea[req='Y'],input[required='required'],select[required='required'],textarea[required='required']", $(page)).each(function () { ShowRequired(this); }).css({ "border": "", "border-style": "solid", "border-size": "1px", "border-width": "1px", "border-color": "", "background-color": "" });  //////////////******************
        // ensure ALL checkboxes / radio's dont have borders
        $("input[type='checkbox']", $(page)).css({ "border": "0px", "border-style": "none", "background-color": "transparent" });
        $("input[type='radio']", $(page)).css({ "border": "0px", "border-style": "none", "background-color": "transparent" });
        // need to keep this list of button images here so the border does not get put on them,
        // cant set all as proper buttons would then loose there borders and we dont want that either (3 places 2 here and in ShowRequired above))
        $(".QuickSearchButton, .DateLookupButton, .AddressLookupButton, .CopyButton, .Wizard", $(page)).css({ "border": "", "border-style": "", "border-color": "", "background-color": "" });
    }
    else {
        $("input[req='Y'],select[req='Y'],textarea[req='Y'],input[required='required'],select[required='required'],textarea[required='required']").each(function () { ShowRequired(this); }).css({ "border": "", "border-style": "solid", "border-size": "1px", "border-width": "1px", "border-color": "", "background-color": "" }); //////////////******************
        // ensure ALL checkboxes / radio's dont have borders
        $("input[type='checkbox']").css({ "border": "0px", "border-style": "none", "background-color": "transparent" });
        $("input[type='radio']").css({ "border": "0px", "border-style": "none", "background-color": "transparent" });
        // need to keep this list of button images here so the border does not get put on them,
        // cant set all as proper buttons would then loose there borders and we dont want that either (3 places 2 here and in ShowRequired above))
        $(".QuickSearchButton, .DateLookupButton, .AddressLookupButton, .CopyButton, .Wizard").css({ "border": "", "border-style": "", "border-color": "", "background-color": "" });
    }
}

function PairedValidation(fldname1, fldname2) {
    var IsCBO = $("#" + fldname1 + "").is("select");
    var cboVal = (IsCBO ? $("#" + fldname1 + " option:selected").attr("value") : $("#" + fldname1).val());
    var txtVal = $("#" + fldname2).val();

    vValid = !((!cboVal && txtVal) || (cboVal && !txtVal));

    if (!vValid) {
        FocusRequired(!cboVal ? fldname1 : fldname2);
    }
    else {
        $("#" + fldname1 + ", #" + fldname2).css({ "border": "1px", "border-style": "solid", "border-color": "" });
    }
}

//function PairedValidation(fldname1, fldname2) {
//    //Pete 01.07.15 FIXES HERE COMMENTED OUT AS TSA DON'T CURRENTLY WANT THEM (Sprint 9)
//    //Check that both controls exist before attempting to see if they match
//    //If both don't exist (e.g. TSA-482, TSA-479), validation says it's ok and the error - that we're checking the wrong fields - is never picked up
//    if (($("#" + fldname1).length + $("#" + fldname2).length) === 2) {

//        var IsCBO = $("#" + fldname1 + "").is("select");
//        var cboVal = (IsCBO ? $("#" + fldname1 + " option:selected").attr("value") : $("#" + fldname1).val());
//        var txtVal = $("#" + fldname2).val();

//        vValid = !((!cboVal && txtVal) || (cboVal && !txtVal));

//        if (!vValid) {
//            FocusRequired(!cboVal ? fldname1 : fldname2);
//        }
//        else {
//            $("#" + fldname1 + ", #" + fldname2).css({ "border": "1px", "border-style": "solid", "border-color": "" });
//        }
//    }
//    else
//        vValid = false;
//}

function Opt_GetCBO(Data_CTRL, Select_Cap, CBO_CTRL, MinCharWidth) {
    if ($(Data_CTRL).val()) {
        var mvData = $.parseJSON($(Data_CTRL).val().replaceAll("`", '","'));
        var options = [];
        options.push('<option value="">'+Select_Cap+'</option>');
        for (var i = 0; i < mvData.length ; i++)
            if (MinCharWidth)
                options.push('<option value="', mvData[i].substring(0, MinCharWidth).replaceAll(" ", ""), '">', mvData[i].substring(MinCharWidth, mvData[i].length), '</option>');
            else
                options.push('<option value="', mvData[i], '">', mvData[i], '</option>');

        $(CBO_CTRL).html(options.join(''));
    } else {
        $(CBO_CTRL).html("<option value=''>--- None Available ---</option>").attr("disabled", "disabled");
    }
}

function FocusRequired(fldname) {
    $.FocusControl("#" + fldname, true).css({ "border": "1px", "border-style": "solid", "border-color": "red" });
}

function CopyAddressClick(to_prefix, from_prefix) {
    $(to_prefix + "line1").val($(from_prefix + "line1").val());
    $(to_prefix + "line2").val($(from_prefix + "line2").val());
    $(to_prefix + "line3").val($(from_prefix + "line3").val());
    $(to_prefix + "town").val($(from_prefix + "town").val());
    $(to_prefix + "county").val($(from_prefix + "county").val());
    $(to_prefix.replace("txt", "cbo") + "country").val($(from_prefix.replace("txt", "cbo") + "country").val());
    $(to_prefix + "pcode").val($(from_prefix + "pcode").val());
}

function GetAllRoles_CBOMS(cboname, Level, CON, AddBlankLine, Class, BlankText, AutoDisable, IsReset, MakeReadonly, MembershipGrade, CustomCompleteFunction, Sect_ON) {
    var ClassStr = (Class ? "&pClass=" + Class : "");
    var ConStr = ("&pCountry_ON=" + (CON ? CON : "-1"));
    var LocStr = ("&pSection_ON=" + (Sect_ON ? Sect_ON : "-1"));
    var MembStr = ("&pGrade=" + (MembershipGrade ? MembershipGrade : ""));

    $.ajax({
        url: WebServicePath() + "GetMSRoles?pLevel=" + Level + ConStr, success: function (result) {
            if (result.d) {
                result = $.parseJSON(result.d);
                var SetIDX = 0;
                $("#" + cboname + " option").remove();
                if (AddBlankLine)
                    $("#" + cboname).append('<option value="">--- Select Role ---</option>');
                for (var i = 0; i < result.length; i++) {
                    if (result[i]) {
                        $("#" + cboname).append('<option id="RO_' + i + '" value="' + result[i].Role_Number + "~" + result[i].Country_Organisation_Number + '">' + result[i].Primary_Description + '</option>');
                        if (IsReset && $("#" + cboname).data("db") == result[i].Role_Number)
                            SetIDX = i + 1;
                        $('#RO_' + i, $("#" + cboname)).data("grades", result[i].Available_Grades).data("StartDate", result[i].Start_Date).data("minage", (result[i].Min_Age ? result[i].Min_Age : "")).data("maxage", (result[i].Max_Age ? result[i].Max_Age : ""));
                    }
                }
                if (result.length === 1)
                    $('#' + cboname + ' option:eq(1)').prop('selected', true);
                else
                    $('#' + cboname + ' option:eq(' + SetIDX + ')').prop('selected', true);
                $('#' + cboname).trigger("change");

                if (AutoDisable) $("#" + cboname).removeAttr("disabled");
            }
            else {
                $('#' + cboname + ' option').each(function (index, option) { $(option).remove(); });
                $("#" + cboname).append(new Option((BlankText ? BlankText : "--- No Roles Available ---"), ""));
                if (AutoDisable) $("#" + cboname).attr("disabled", "disabled");
            }
            if (MakeReadonly)
                $("#" + cboname).attr("disabled", "disabled");

            if (CustomCompleteFunction)
                CustomCompleteFunction();

        }, error: ServiceFailed
    });
}

function GetInsertRoles_CBO(cboname, Level, CON, AddBlankLine, Class, BlankText, AutoDisable, IsReset, MakeReadonly, MembershipGrade, CustomCompleteFunction, Sect_ON) {
    var f_Process = function (result) {
        if (!pk_val("Master.Sys.REST") && result) result = result.d; // REST vs JSON result
        if (result) {
            if (!pk_val("Master.Sys.REST")) result = $.parseJSON(result); // REST comes as Class, JSON as JSON

            var SetIDX = 0;
            $("#" + cboname + " option").remove();
            if (AddBlankLine)
                $("#" + cboname).append('<option value="">--- Select Role ---</option>');
            for (var i = 0; i < result.length; i++) {
                $("#" + cboname).append('<option id="RO_' + i + '" value="' + result[i].Role_Number + "#" + result[i].Country_Organisation_Number + '">' + result[i].Primary_Description + '</option>');
                if (IsReset && $("#" + cboname).data("db") == result[i].Role_Number)
                    SetIDX = i + 1;
                $('#RO_' + i, $("#" + cboname)).data("grades", result[i].Available_Grades).data("StartDate", result[i].Start_Date).data("minage", (result[i].Min_Age ? result[i].Min_Age : "")).data("maxage", (result[i].Max_Age ? result[i].Max_Age : ""));
            }
            if (result.length === 1)
                $('#' + cboname + ' option:eq(1)').prop('selected', true);
            else
                $('#' + cboname + ' option:eq(' + SetIDX + ')').prop('selected', true);
            $('#' + cboname).trigger("change");

            if (AutoDisable) $("#" + cboname).removeAttr("disabled");
        }
        else {
            $('#' + cboname + ' option').each(function (index, option) { $(option).remove(); });
            $("#" + cboname).append(new Option((BlankText ? BlankText : "--- No Roles Available ---"), ""));
            if (AutoDisable) $("#" + cboname).attr("disabled", "disabled");
        }
        if (MakeReadonly)
            $("#" + cboname).attr("disabled", "disabled");

        if (CustomCompleteFunction)
            CustomCompleteFunction();

    };

    if (pk_val("Master.Sys.REST")) {
        var vData = {};
        vData["Level"] = Level;
        vData["Class"] = Class;
        vData["Section_ON"] = (Sect_ON ? Sect_ON : "-1");
        vData["Country_ON"] = (CON ? CON : "-1");
        vData["Grade"] = (MembershipGrade ? MembershipGrade : "");

        PostToHandler(vData, "/role/lookup", f_Process, ServiceFailed, false, true);
    } else {
        var ClassStr = (Class ? "&pClass=" + Class : "");
        var ConStr = ("&pCountry_ON=" + (CON ? CON : "-1"));
        var LocStr = ("&pSection_ON=" + (Sect_ON ? Sect_ON : "-1"));
        var MembStr = ("&pGrade=" + (MembershipGrade ? MembershipGrade : ""));

        $.ajax({
            url: WebServicePath() + "GetAllInsertRoles?pLevel=" + Level + ClassStr + LocStr + ConStr + MembStr, success: f_Process, error: ServiceFailed
        });
    }
}

function GetContactRoles(cboname, Lookup_CN, AddBlankLine, BlankText, AutoDisable, IsReset, CustomCompleteFunction, SelectMeText) {
    var f_process = function (result) {
        if (!pk_val("Master.Sys.REST") && result) result = result.d; // REST vs JSON result
        if (result) {
            if (!pk_val("Master.Sys.REST")) result = $.parseJSON(result); // REST comes as Class, JSON as JSON

            var options = [];
            var SetIDX = 0;
            if (AddBlankLine) options.push('<option value="">', SelectMeText ? SelectMeText : " ", '</option>');
            for (var i = 0; i < result.length; i++) {
                options.push('<option value="', result[i].member_role_number, '">', result[i].Role_Desc, '</option>');
                if (IsReset && $("#" + cboname).data("db") == result[i].member_role_number)
                    SetIDX = i + 1;
            }
            $("#" + cboname).html(options.join(''));
            $('#' + cboname + ' option:eq(' + SetIDX + ')').prop('selected', true);
            if (AutoDisable) { $("#" + cboname).removeAttr("disabled"); }
        }
        else {
            $('#' + cboname + ' option').each(function (index, option) { $(option).remove(); });
            $("#" + cboname).append(new Option((BlankText !== undefined ? BlankText : "No Roles Available"), ""));
            if (AutoDisable) $("#" + cboname).attr("disabled", "disabled");
        }

        if (CustomCompleteFunction) CustomCompleteFunction();
    };

    if (pk_val("Master.Sys.REST")) {
        var vData = {};
        vData["ContactNumber"] = Lookup_CN;
        PostToHandler(vData, "/Contact/Roles", f_process, ServiceFailed, false, true);
    } else {
        $.ajax({ url: WebServicePath() + "GetContactRoles?pLookupContactNumber=" + Lookup_CN, success: f_process, error: ServiceFailed });
    }
}

function Navigator_OnLine() {
    return true;
    //return navigator.onLine;
}

function SavePressesMessage() {
    if (SaveHasBeenPressed) {
        $.system_hint("<center>Please wait while data is being saved...</center>", "<h2>Compass is Saving</h2>");
        return true;
    }
    if (DeleteHasBeenPressed) {
        $.system_hint("<center>Please wait while data is being deleted...</center>", "<h2>Compass is Deleting</h2>");
        return true;
    }
    return false;
}

function Set_SaveFormCheck_Variables(DisableCtrls, IsDelete) {
    $(DisableCtrls).not("[CA='Y']").click(function () {
        if (!DuplicateMessageShown) SavePressesMessage();
        DuplicateMessageShown = true;
        SaveHasBeenPressed = true;
        return false;
    });

    $(DisableCtrls).attr("CA", "Y");

    if (IsDelete)
        DeleteHasBeenPressed = true;
    else
        SaveHasBeenPressed = true;
}

function SaveFormCheck(DisableCtrls, IsDelete, DontSetFlags) {
    if (Navigator_OnLine()) {
        // stop multiple clicks (return false)
        if (!$.Is_MSIE(7) && !$.Is_MSIE(8) && !DontSetFlags) {
            $(DisableCtrls).not("[CA='Y']").click(function () {
                if (!DuplicateMessageShown) SavePressesMessage(); //$.system_alert("You have pressed save more than once");
                if (!DontSetFlags) {
                    DuplicateMessageShown = true;
                    SaveHasBeenPressed = true;
                }
                return false;
            });

            $(DisableCtrls).attr("CA", "Y");
        }
        if (SaveHasBeenPressed || DeleteHasBeenPressed)
            return false;
        else if (!DontSetFlags) {
            if (IsDelete)
                DeleteHasBeenPressed = true;
            else
                SaveHasBeenPressed = true;
        }
        // and ok
        return true;
    }

    // we have no internet
    alert("There is no internet connection at the moment. Save Cancelled.\rNOTE: try again when you have internet, or cancel any changes.");
    return false;
}

function MakePageReadOnly() {
    $("input[type=text], textarea").attr("readonly", "readonly");
    $("select, input[type=checkbox], input[type=radio]").attr("disabled", "disabled").css("cursor","default");
    //$(".DateLookupButton, .rfv, .EDITBN, .QuickSearchButton").css({ "display": "none" });
    $(".DateLookupButton, .rfv, .EDITBN, .QuickSearchButton").remove();
    $(".labelPoint").removeClass("labelPoint");
}

function GetSelectValue(dropdown, lookupdesc) {
    // get selected value from description text of cbo value
    return $(dropdown + " option:contains(" + lookupdesc + ")").attr("value");
}

function RemoveNotWantedChars(evt) {
    var e = evt || window.event; // for trans-browser compatibility

    // 223 = ¬ + shift
    // 223= `
    // 222 = ~
    // 54 = ^

    if ($.Is_FireFox()) // firefox had issue
        return true;

    if (e.shiftKey && (e.keyCode === 222 || e.keyCode === 223 || e.keyCode === 54)) return false;
    if (e.keyCode === 223) return false;
    return true;
}

function NumberOnly_Blur(self, vDontFormat, vMaxLen) {
    if (isNaN(Number($(self).val()))) {
        $.system_alert("Not a valid number.", self);
        //needs setTimout for bug in firefox
        //        $.FocusControl(self,true);
        $(self).val("");
    }
    else if ($(self).val()) {
        if (vMaxLen)
            $(self).val($(self).val().toString().slice(0, vMaxLen));
        if (vDontFormat)
            $(self).val(Number($(self).val()).toString());
        else
            $(self).val(Number($(self).val()).toLocaleString());
    }
    else
        $(self).val("");
}

function MinutesToTime(mins) {
    var hours = Math.floor(mins / 60);
    //var minutes = mins % 60;
    return pad(hours.toString(), 2) + ":" + pad((mins - (hours * 60)).toString(), 2);
}

function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function formatTime(time, isTimeDuration) {
    // this routine presumes that chars other than '.' ':' and numbers have already been removed.!

    // check for multiple seperators and reject
    if (time.split('.').length > 2 || time.split(':').length > 2 || (time.match(/[.:]/g) !== null && time.match(/[.:]/g).length > 1))
        return false;

    // dp some manual cleaning first

    // if does not have ':' or '.'
   if (time.match(/[.:]/g) === null) {
        if (time.length === 1) time = "0" + time + ":00";
        else if (time.length === 2) time = time + ":00";
        else if (time.length === 3) time = "0" + time[0] + ":" + time[1] + time[2];
        else if (time.length === 4) time = time[0] + time[1] + ":" + time[2] + time[3];
        else if (time.length > 4) return false;
    }
    else {
        if (time.length === 1) time = "00" + time + "00";
        else if (time.length === 2 && (time[0] === "." || time[0] === ":")) time = "00" + time + "0";
        else if (time.length === 2) time = "0" + time + "00";
        else if (time.length === 3 && (time[0] === "." || time[0] === ":")) time = "00" + time;
        else if (time.length === 3 && (time[1] === "." || time[1] === ":")) time = "0" + time + "0";
        else if (time.length === 3 && (time[2] === "." || time[2] === ":")) time = time + "00";
        else if (time.length === 4 && (time[1] === "." || time[1] === ":")) time = "0" + time;
        else if (time.length === 4 && (time[2] === "." || time[2] === ":")) time = time + "0";
        else if (time.length === 5 && (time[2] === "." || time[2] === ":")) time = time;
        else return false;
    }

    // if decimal
    if (time.split('.').length > 1)
    {
        var mins = ((parseInt(time.split('.')[1],10) / 10000) * 60).toFixed(2).substring(2, 5);
        time = time.split('.')[0] + ":" + (mins.length === 2 ? "" : "0") + mins;
    }
    if (time.split(':').length > 1) {
        if (parseInt(time.split(':')[1], 10) >= 60)
            time = time.split(':')[0] + ":59";
    }

    // if isTimeDuration then its allowing 24:00 as a valid number, otherwise its time and 24:00 becomes 00:00
    if (time === "24:00") {
        if (isTimeDuration) return "24:00";
        else return "00:00";
    }
    else if (isTimeDuration && parseInt(time.split(':')[0],10) > 23)
        return "24:00";

    var result = false, m;
    var re = /^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/;
    if ((m = time.match(re))) {
        result = (m[1].length === 2 ? "" : "0") + m[1] + ":" + m[2];
    }
    return result;
}

function Time_Blur(self, min_criteria, max_criteria) {
    if ($(self).val() === "")
        return;

    var vResult = formatTime($(self).val(), false);
    if (!vResult)
        $.system_alert("Not a valid time, please use the format 09:59.", self);
    else {
        $(self).val(vResult);

        if (min_criteria && parseFloat(min_criteria.replace(":", ".")) > parseFloat(vResult.replace(":", "."))) {
            $.system_alert("Time must be after " + min_criteria, self);
            return;
        }

        if (max_criteria && parseFloat(max_criteria.replace(":", ".")) < parseFloat(vResult.replace(":", "."))) {
            $.system_alert("Time must be before " + max_criteria, self);
            return;
        }
    }
}

function TimeDuration_Blur(self, min_criteria, max_criteria) {
    if ($(self).val() === "")
        return;

    var vResult = formatTime($(self).val(), true);
    if (!vResult)
        $.system_alert("Not a valid time duration, please use the format 09:59", self);
    else {
        $(self).val(vResult);

        if (min_criteria && parseFloat(min_criteria.replace(":", ".")) > parseFloat(vResult.replace(":", "."))) {
            $.system_alert("Time duration must be greater than " + min_criteria, self);
            return;
        }

        if (max_criteria && parseFloat(max_criteria.replace(":", ".")) < parseFloat(vResult.replace(":", "."))){
            $.system_alert("Time duration must be less than " + max_criteria, self);
            return;
        }
    }
}

function Hours_Blur() {
    //TSA-424: Simplified HH:MM parsing to make it really obvious what's going on
    //TSA-511: Fixed by change made for TSA-424

    var hours = $(this).val();
    if (!hours) return;

    if (hours.split(':').length > 2 || !parseInt(hours.replace(":", ""), 10)) {
        $.system_alert("Not a valid value, please use the format HH:MM (max 99:59).", this);
        return;
    }

    if (hours.split(':').length < 2) hours = hours + ":00";

    var HH = hours.split(':')[0];
    var MM = hours.split(':')[1];


    if ((MM.length > 2) || (parseInt(MM, 10) > 59) ){
        $.system_alert("Not a valid value, please use the format HH:MM (max 99:59).", this);
        return;
    }
    else if (MM.length === 0) MM = "00";
    else if (MM.length === 1) MM = "0" + MM;

    if (HH.length === 0) HH = "00";
    else if (HH.length === 1) HH = "0" + HH;
    else if (parseInt(HH, 10) > 99) {
        HH = "99";
        MM = "59";
    }
    else if (HH.length > 2) HH = HH.slice(-2); //catches input like "000:30"

    $(this).val(HH + ":" + MM);
}

function NumberOnly_KeyPress(evt, DestinationEvt, exceptions) {
    var e = evt || window.event; // for trans-browser compatibility
    var charCode = e.which || e.keyCode;
    //alert(charCode);
    if (charCode > 31 && (charCode < 48 || charCode > 57) && $.inArray(charCode, exceptions) < 0)
        return false;

    //for Return, call the search routine
    var CTRL = e.currentTarget || e.srcElement;
    if (charCode === 13 && CTRL && CTRL.value && DestinationEvt) {
        DestinationEvt(CTRL.value);
        return false;
    }

    return true;
}

function PopulateCBO(self, result, ExcludeZero, BlankText, AutoDisable, DefaultValue, SelectMeText) {
    var options = [];
    var found = false;
    var DefaultIndex = 0;
    options.push('<option value="">', SelectMeText ? SelectMeText : " ", '</option>');

    if (result && result.d && result.d.length > 0)
        result = result.d;

    if (result)
        for (var i = 0; i < result.length; i++) {
            if (!(ExcludeZero && result[i].Value === "0")) {
                if (result[i].Value)
                    options.push('<option value="', result[i].Value, '">', result[i].Description, ' </option>');
                else
                    options.push('<option value="">', result[i].Description, ' </option>');

                found = true;

                if (DefaultValue && result[i].Value.toString() === DefaultValue.toString()) DefaultIndex = i + 1;
            }
        }

    if (AutoDisable) {
        if (!found) {
            if (BlankText) {
                options = [];
                options.push('<option value="">', BlankText, '</option>');
            }
            $(self).attr("disabled", "disabled");
        }
        else
            $(self).removeAttr("disabled");
    }

    $(self).html(options.join(''));
    $(self + ' option:eq(' + DefaultIndex + ')').prop('selected', true);
}

function validateWebAddress(self) {
    var webaddress = $(self).val();
    if (!webaddress) return true;
    var re = new RegExp("^(http:\/\/|www.)");
    if (!re.test($(self).val())) {
        $.system_alert("Not a valid web address.", self);
        return false;
    }
    return true;
}

function validateEmail(self) {
    var email = $(self).val();
    if (!email) return true;
    //var re = /\S+@\S+\.\S+/;
    var re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!re.test(email)) {
        $.system_alert("Not a valid email address.", self);
        return false;
    }
    return true;
}

function validatePhone(self) {
    var phone = $(self).val();
    if (!phone) return true;
    if (isNaN(phone)) {
        $.system_alert("Not a valid phone number.", self);
        return false;
    }
    return true;
}

function validatePostCode(self, isOutsideUK) {
    var pc = $(self).val().toUpperCase().replace("%", "").replace("*", "").replace("_", "");
    $(self).val(pc);
    if (pc === "") return true;

    if (isOutsideUK) return true;

    // UK & BFPO regex. If modifying this here, please also update the regex in Constants_WebConfig.cs (PORTAL.POSTCODE_REGEX) and/or the web.config
    var re = /^(GIR ?0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW]) ?[0-9][ABD-HJLNP-UW-Z]{2}|BFPO[ ]?\d{1,4})$/;
    if (!re.test(pc)) {
        $.system_alert("Not a valid postcode.", self);
        return false;
    }
    else
    {
        /* --- TSA-196 --- */
        //The string is now *definitely* a valid UK or BFPO postcode with at most one optional space in the middle.
        //We can therefore force a space into the string at the correct point, either after the "BFPO" bit or before the last 3 characters (for a UK code)
        pc = pc.replace(" ", "");
        var bTest = pc.substring(0, 4);
        if (bTest === "BFPO")
            $(self).val(pc.substring(0, 4) + " " + pc.substring(4));
        else
            $(self).val(pc.substring(0, (pc.length - 3)) + " " + pc.substring(pc.length - 3));
    }
    return true;
}

function validateMinSurname(self) {
    var sn = $(self).val().replace("%", "").replace("*", "").replace("_", "");
    $(self).val(sn);
    if (!sn || sn.length >= 2) return true;
    $.system_alert("A minimum of 2 characters is required for a surname.", self);
    return false;
}

function CanSeeContact(visibility_status, YTHS, VULA, VULY) {
    if (visibility_status.indexOf('F') < 0) // is not full access
        return false;

    if (!HasAccess(YTHS, 'R') && visibility_status.indexOf('Y') >= 0)// if youth and no access to youths
        return false;

    if (!HasAccess(VULY, 'R') && visibility_status.indexOf('Y') >= 0 && visibility_status.indexOf('V') >= 0)// if youth + vulnerable with no access to vulnerable youths
        return false;

    if (!HasAccess(VULA, 'R') && visibility_status.indexOf('Y') < 0 && visibility_status.indexOf('V') >= 0)// if adult + vulnerable with no access to vulnerable youths
        return false;

    return true;
}

function HasAccess(code, Access) {
    return code.indexOf(Access) >= 0;
}

function Append(URL, Param, Value, Data) {
    if (!Value) return URL;
    if (!URL || URL.indexOf("?") < 0) URL += "?";
    else URL += "&";

    if (Data) Data[Param] = encodeURIComponent(Value); //Data.append(Param, encodeURIComponent(Value));

    return URL + Param + '=' + encodeURIComponent(Value);
}

function pad(str, max) { return str.length < max ? pad("0" + str, max) : str; }

function HierSearch() {
    var vData = {};
    vData["AREA_RB"] = "1";
    vData["SearchType"] = "BASIC_HIER";
    var newDate = new Date();
    vData["UI"] = newDate.getHours().toString() + newDate.getMinutes().toString() + newDate.getMilliseconds().toString();
    vData["OrganisationNumber"] = pk_val("Master.User.ON");

    if (ShowLoadingMessage()) {
        PostToHandler(vData, (pk_val("Master.Sys.REST") ? "/Search/Members" : "/System/Search"), function () {
            window.location.href = WebSitePath() + "SearchResults.aspx";
        });
    }
}

function RunDistributionList(DL_ID) {
    var vData = {};
    vData["SearchType"] = "DISTLIST";
    vData["DistList"] = DL_ID;

    var newDate = new Date();
    vData["UI"] = newDate.getHours().toString() + newDate.getMinutes().toString() + newDate.getMilliseconds().toString();

    if (ShowLoadingMessage()) {
        PostToHandler(vData, (pk_val("Master.Sys.REST") ? "/Search/Members" : "/System/Search"), function () {
            window.location.href = WebSitePath() + "SearchResults.aspx";
        });
    }

    return false;
}

function FormatMemberNumber(CN) { return ("00000000" + CN.toString()).slice(-8); }

function SaveUserSettings(pName, pValue, pSuccess) {
    $.ajax({ url: WebServicePath() + "SaveUserSetting?pName=" + pName + "&pValue=" + pValue, success:pSuccess });
}

//#endregion

//#region  Web Site Security / global variables (here for obfuscation when minified)
$(document).ready(function () {
    $.ajaxSetup({
        cache: false,
        data: { __: "~", x1: pk_val("Master.User.CN"), x2: pk_val("Master.User.JK"), x3: pk_val("Master.User.MRN") },
        beforeSend: function (xhr, settings) {
            // add contact number + role check sum values to request header
            xhr.setRequestHeader("Authorization", pk_val("Master.User.CN") + "~" + pk_val("Master.User.MRN"));
            // add session variable to header (this is server session and does hard expire)
            xhr.setRequestHeader("SID", pk_val("Master.Sys.SessionID"));
            // add header for hash (not on posts, or high volume calls like get avatar/badge image)
            if (settings.type === "GET" && !jk_hash_exclusion(settings.url)) xhr.setRequestHeader("Auth", jk_hash());
        }
    });
});

function meta_val(val) {
    // get hidden (viewstate replacement) data from page
    var Value = "";
    try {
        Value = $('meta[name=' + val + ']').attr("content");
        if (!Value) Value = "";
    }
    catch (e) { }
    return Value;
}

var vHRD = false;
var vLastInline;
var QT;

function pk_val(val) {
    // get hidden (viewstate replacement) data from page
    try {
        var Data = $("#ctl00__POST_CTRL").val(); // encoded version
        // check data + encrypter are the same
        if (Data !== $("#ctl00__POST_CTRL").data("chk")) {
            if ($("#ctl00__POST_CTRL").data("chk") && !vHRD) {
                vHRD = true;
                BBO("SecurityParam");
            }
            return "";
        }

        var Value = "";
        // calc value (from list)
        QT = QT || Data.split('~');
        for (var i = 0; i < QT.length; i++) {
            var item = QT[i];

            if (!Value && item.split('#').length > 1 && item.split('#')[0].toLowerCase() === val.toLowerCase()) {
                Value = item.split('#')[1];
                // double check against data separated version too.
                if ($('#ctl00__POST_CTRL').data(val.toLowerCase()) !== Value) // get already decoded data from DOM and compair.
                {
                    if ($('#ctl00__POST_CTRL').data(val.toLowerCase()))// NOTE: undefined <> "" is blank so ok to return blank..!
                        BBO("SecurityParam");
                    else
                        return "";
                }
                else // return data value directly (if ok)
                    return Value;
            }
        }
    }
    catch (e) { }
    return "";
}

function pk_UsePopup() {
    if (!vLastInline) vLastInline = !$.forceInline() && !pk_val("Master.Sys.InLine") || (($.Is_MSIE(7) || $.Is_MSIE(8)) && !pk_val("Master.Sys.App"));
    return vLastInline;
}
function WebServicePath() { return decodeURIComponent(pk_val("Master.Sys.WebPath")).toString(); }
function WebSitePath() { return decodeURIComponent(pk_val("Master.Sys.WebPath")).replace("JSon.svc/", "").toString(); }

function jk_hash_exclusion(url) {
    if (!pk_val("Master.Sys.SafeJSON") || url.toLowerCase().indexOf("system/preflight") > 0) // server override to turn off checking (must match server setting)
        return true;

    // list of exclusions to adding hash. NOTE: the same exclude list exists server side so if any are added it will need to be added in code too.!
    var RoutineName = url.toLowerCase().replace(WebServicePath().toLowerCase(), "");
    RoutineName = RoutineName.substring(0, (RoutineName.indexOf("?") > 0 ? RoutineName.indexOf("?") : RoutineName.length));

    return (RoutineName === "sto_check");
}

/*
Create string list (change constructor method)
add items to list
call central post routine.
in post check browser Version.
if < ie10 add params from list to URL, and do get,
else add items to From data and post.
*/

function jk_hash() {
    // create unique key that's going to be inserted into the database.
    // this key will be used once and deleted. if it does not match the cn and have a value session too then it will fail
    // NOTE: the key could be changed to anything really... its just a posted checksum being added to the database.

    // now 'post' this key to the database
    var vData = {};
    vData["pKeyHash"] = Date.now().toString().hashCode() + pk_val("Master.User.JK") + pk_val("Master.User.MRN") + pk_val("Master.User.CN");// CN + Timestamp not hashed + hash of cn + mrn (= unique key) NOTE: the jk+mrn+cn is checksummed server side
    vData["pCN"] = pk_val("Master.User.CN");
    PostToHandler(vData, "/System/Preflight");
    return vData["pKeyHash"];
}

// Session Time out Variables
var STO = false; // marker to show timeout message has been shown
var STO_Check; // 3 possible values (undefined, "0", "5", "X"), blank is normal running, 0 is we have asked the user (the prompt is showing), 5 is the user said yes extend please (5 has no meaning BTW its a random const), X = your out, so dont bother with any more checks

function ss_goOut() {
    // set also do on timer incase of random device turn off, the timer gets lost and page may not do the logout
    setInterval(function () { window.location.href = WebSitePath() + "login.ashx?logout=TO"; }, 20000);
    // but do now as its required NOW.

    if (pk_UsePopup() && window.location.href.toLowerCase().indexOf("popup") > 0)
        window.parent.location.href = WebSitePath() + "login.ashx?logout=TO";
    else
        window.location.href = WebSitePath() + "login.ashx?logout=TO";
}

function ss_doTimeout(msg) {
    HideBusy_Main();

    if (!STO) {
        STO = true;
        STO_Check = "X";
        window.status = "Timed out";
        if (msg) {
            $.system_alert(msg, ss_goOut);
            setTimeout(ss_goOut, 30000);
        }
        else
            ss_goOut();
    }
}

function ss_Hardb4Soft(FromPopup) {
    // if hard timeout is due before soft timeout, then do this action
    if (pk_val("Master.Sys.HardB4Soft")) {
        var totalAmount = pk_val("Master.Sys.HardB4Soft");
        var WarningShown, loop, theFunction = function () {
            totalAmount--;
            if (totalAmount == 0) { clearInterval(loop); }
            var minutes = parseInt(totalAmount / 60,10);
            var seconds = parseInt(totalAmount % 60,10);
            if (seconds < 10) seconds = "0" + seconds;

            if (minutes < 2) {
                window.status = "The system hard timeout is due in : " + minutes + ":" + seconds;
            }

            // at 2 mins, simple popup warning (or on new page less than 2 mins)
            if (minutes < 2 && FromPopup && !WarningShown) {
                $.system_alert("The system hard timeout is due at : " + pk_val("Master.Sys.HardTime"));
                WarningShown = true;
            }
        };

        if (FromPopup) {
            loop = setInterval(theFunction, 1000);

            // add message here (when TSA agree)
            //setTimeout(function () { $.system_alert("The system hard timeout is due at : " + pk_val("Master.Sys.HardTime")); }, 3000);
        }
    }
}

// this routine is only ever called when autosessiontimeout is on and is timered to start x minutes (default 1) before session is due to expire, and then triggers every 30 seconds (until timed either now or on extension)
function ss_TimeoutCheck(p, nostst) {
    // NOTE: returning true turns off this timer, false leaves it running. (main timer only)
    if (!nostst && !pk_val("Master.Sys.HardB4Soft"))
        window.status = window.status.replace('.......', '') + ".";
    // global result variable
    var vResult = false;
    // if not landing page check and popup is showing, do nothing (!p = is landing page, and iFrameActive includes loading time (busy message etc))
    // if timer message is counting down do nothing (STO)
    // if already timed out, and 'you have been timed' out message is showing and your just waiting for user to press ok, or 30 sec trimer to auto move you, so dont do anything (STO_Check == "X")
    if (STO_Check === "X" || STO || (!p && iFrameActive()))
        return vResult;

    // standard timeout stuff
    $.ajax({
        url: WebServicePath() + "STO_CHK?pExtend=" + pk_val("Const.Sys.STO_ASK"),
        async: false, success: function (result) {
            if (result.d) { // either timed out, or in grace period to timeout (so prompt)
                if (result.d.split('~')[0] === "X") // timeout has passed so message and leave
                    ss_doTimeout(result.d.split('~')[1]);
                else if (!STO_Check) // is in grace period so give user option to extend by x mins
                {
                    // set my variables
                    STO_Check = pk_val("Const.Sys.STO_ASK"); // only do message once
                    // close any menu's (just in case)
                    if (!p) closeAllMenus();

                    // start timer for extended timeout (from now not when user says yes : if they say yes = ok timer is good, if they say no, we are leaving anyway)
                    setTimeout(function () { var STO_idx2 = setInterval(function () { if (ss_TimeoutCheck(p)) { clearInterval(STO_idx2); } }, 10000); }, result.d.split('~')[2]);

                    var html = "";
                    if (pk_val("Master.Sys.HardTime"))
                        html = "<tr><td colspan='2'><br/><b>NOTE:</b> that all connections to Compass have an absolute limit of " + pk_val("Master.Sys.HardExpiry") + ". If your connection to the portal exceeds this time limit then you will be disconnected from Compass sooner than the " + pk_val("Master.Sys.TimeoutExtension") + " minute extension indicated above.<br/><br/></td></tr><tr><td colspan='2' style='text-align:center;'>Your Compass connection will expire at " + pk_val("Master.Sys.HardTime") + ".</td></tr>";

                    html =
                        "<table style='width:100%;min-width:500px;margin-right: 15px;'>" +
                        "<tr><td colspan='2' style='text-align:center;'><b style='color:red;font-size:1.3em;'>The system is about to automatically log you out.</b></td></tr>" +
                        "<tr><td colspan='2' style='text-align:center;'><br/>Would you like to extend this time by " + result.d.split('~')[1] + " minute" + (result.d.split('~')[1] == "1" ? "" : "s") + " to finish off what you're doing?</td></tr>" +
                        "<tr><td colspan='2' style='text-align:center;'><br/> Time remaining till auto logout : <label id='pop_AutoLogTimer'></label></td></tr>" + html +
                        "</table>";
                    var Buttons = "<input tabindex='1' id='bnAWOK' style='width: 100px;' type='button' value='Yes Please' class='sysmsg_bn'>&nbsp;<input tabindex='2' style='width: 100px;' type='button' value='No Thanks' class='sysmsg_close'>";

                    if (!pk_val("Master.Sys.HardB4Soft"))
                        $.system_window(html, "<h2>System Warning</h2>", Buttons, 2);

                    $("#bnAWOK").click(function () {
                        $.ajax({ url: WebServicePath() + "STO_CHK?pExtend=" + pk_val("Const.Sys.STO"), async: true });
                        STO_Check = pk_val("Const.Sys.STO");
                        STO = false;
                        window.status = "Timeout extended by " + result.d.split('~')[1] + " minutes";
                        setTimeout(function () { window.status = ""; }, 2000);
                        clear_countdown(p ? vPopCountdownIDX : vCountdownIDX);
                        STO_PRG = "";
                        CloseHintPopup();
                    });

                    // set timer to do countdown (does popup + windos status bar when window closes)
                    var IDX = $("#pop_AutoLogTimer").countdown(function () {
                        CloseHintPopup();
                        if (STO_Check != pk_val("Const.Sys.STO") && !iFrameActive()) // when you press ok, this timer continues, so dont auto logout if ok was pressed. (let the other auto do that)
                        {
                            STO = false;
                            ss_doTimeout(" Your session has timed out<br/>You will now be redirected to the login page to login again.");
                        }
                    }, (result.d.split('~')[0] * 60), "s remaining", 30, "Timeout : ");

                    // global variable so we can cancel timers when (popup opens, stop landing page timer, or popup closes, stop popup one.)
                    if (p) vPopCountdownIDX = IDX;
                    else vCountdownIDX = IDX;

                    vResult = true;
                    STO = true;
                }
            }
        }
    });

    //return vResult; // off so i can keep timer going (after popup close needed a persistent timer)
    return false;
}

function ServiceFailed(result, textStatus, errorThrown, self) {// This is the jQuery Error message return class type etc
    try {
        var html = "";
        var buttonbar = "";
        var ErrorText = "";
        var IsSessionHardTimeout = false;
        var Routine = (self ? self : this).url;

        var vResponseJSON = result.responseJSON || $.parseJSON(result.responseText);

        // if (web.config : includeExceptionDetailInFaults = true) use StackTrace for error message, or receiving data about pending timeout
        if (vResponseJSON.StackTrace) {
            if (vResponseJSON.Message.indexOf("SessionHasTimedOut~") === 0) {
                if (!STO) ss_doTimeout(vResponseJSON.Message.substring(19));
            }
            else {
                // standard error handling
                var StartIDX = 0;
                var EndIDX = Routine.indexOf("?");
                if (EndIDX < 0) EndIDX = (self ? self : this).url.length;
                Routine = Routine.substr(StartIDX, EndIDX - StartIDX);

                ErrorText = "<div id='divErr' class='SelectText' style='display:none; background-color:#ededed; margin-right:5px;'>" +
                  formatDate(new Date(), DisplayDateFormat + " - HH:mm:ss") + " <br/>" +
                  "ERROR : " + result.status + " <br/>" +
                  "ERROR TEXT : " + result.statusText + "<br/>" +
                  "RESPONSE TEXT : " + vResponseJSON.Message +
                  "</div>";
            }
        }
        else  // NOTE: this is only every used if (web.config : includeExceptionDetailInFaults = false), so call api to check session timeout state (this call is a simple null/'custom message for user' response to is session alive)
            $.ajax({
                url: WebServicePath() + "STO_CHK", async: false, success: function (result) {
                    if (result.d) {
                        IsSessionHardTimeout = true;
                        ss_doTimeout(result.d.split('~')[1]);
                    }
                }
            });

        // if error is not a timeout, then standard message shows (with/without exception detail depending on (web.config : includeExceptionDetailInFaults = true/false))
        if (!IsSessionHardTimeout && !STO) {
            html += "<div style='overflow:auto; margin-left:10px;max-height:200px;'>";
            html += "<div class='SelectText'>Communication Error linking to : <br/>url: " + (Routine ? "Unknown" : Routine) + "<br/>" + ErrorText +
                  "<br/>Possible Problems:<br/>" +
                  "&#8226; Check you still have an internet connection.<br/>" +
                  "&#8226; The server may be busy, so just try again.<br/>" +
                  "&#8226; If the problem persists, please contact site administrator and report the problem quoting what you were doing, and any error information you may have.<br/><br/>" +
                  "We're sorry for the inconvenience.</div>";
            html += "</div>";

            if (vResponseJSON.StackTrace) buttonbar += "<input id='divErrBn' type='button' value='Show Error Detail' class='sysmsg_bn'>&nbsp;";
            buttonbar += "<input type='button' value='Close' class='sysmsg_close'>";

            $.system_window(html, "<h2>System Error Message</h2>", buttonbar, 2);
            $("#divErrBn").click(ShowHideErrorText).css("width", "130px");
            // tell server to write log to file (without a stack trace though we have very little info, so dont bother logging that)
            if (vResponseJSON.StackTrace) {
                var vErrorLine = (self ? self : this).url.substring(0, (self ? self : this).url.indexOf('__=~')) + ' ' + result.statusText + ' EXCEPTION : ' + vResponseJSON.Message;
                $.ajax({ url: WebServicePath() + "WriteLog?pLogData=" + vErrorLine });
            }
        }
    }
    catch (e) { }

    HideBusy_Main();
}

function ShowHideErrorText() {
    if ($("#divErrBn").val().indexOf("Show") >= 0) {
        $("#divErr").show(200);
        $("#divErrBn").val("Hide Error Detail");
    }
    else {
        $("#divErr").hide(200);
        $("#divErrBn").val("Show Error Detail");
    }
}

//#endregion

//#region Grid Export

var vSelectedURNs = "";
var vSelectedCNs = "";

function GoExport(ExportType) {
    ShowBusy_Main();
    CloseHintPopup();

    var d = new Date();
    var vData = {}; //var vData = new FormData();
    vData["pRoutine"] = "EXPORT";
    vData["pCN"] = pk_val("Master.User.CN");
    vData["pData"] = vSelectedURNs;
    vData["pBucket"] = ExportType + ($.Is_MSIE(8) ? d.toString() : d.toISOString());
    PostToHandler(vData, "/System/Funcs", function (ERROR) {
        if (ERROR) {
            HideBusy_Main();
            CloseHintPopup();
            $.system_alert("The Export Was Not Successful.");
        }
        else {
            var vCols = "";
            $(".msColCHK:checkbox:checked").each(function () { if (vCols) vCols += ","; vCols += $(this).attr("id"); });
            RunExport(vData["pBucket"], ExportType, vCols);
        }
    }, ServiceFailed,true);
}

function SetExportType(ExportType, DIST_CRUD) {
    CloseHintPopup();
    if (ExportType === "P") { window.print(); } // not currently used
    else if (ExportType === "DL") { AddToDistList(DIST_CRUD); }
    else { SelectExportColumns(ExportType); }
    return false;
}

function RunExport(GroupRef, ExportType, Columns) {
    // need to add code here to limit string size and call multiple times to complete list of ID's (IE has max URL limit etc)
    $.ajax({
        url: WebServicePath() + "DoExport?pGroupRef=" + GroupRef + "&pExportType=" + ExportType + "&pColumns=" + Columns + "&pLastSort=" + vLastSortColumn + "&pLastFilter=" + encodeURIComponent(vLastFilter), success: function (result) {
            HideBusy_Main();
            if (result.d) { $.system_confirm(DataProtection_Message, function () { OpenExportDocument(result.d); }, function () { DeleteExportDocument(result.d); }, false, "Before you finish"); }
            else $.system_alert("The Export Was Not Successful.");
        }, error: ServiceFailed
    });
}

function ChooseExportOption(Selected_URN, CSV_CODE, PDF_CODE, MSEO_CRUD, DIST_CRUD, pMRN, Selected_CN) {
    if (Selected_URN.replaceAll(" ", "") === "") {
        $.system_alert("You must select at least 1 record when exporting data.");
        return false;
    }

    vSelectedURNs = Selected_URN;
    vSelectedCNs = Selected_CN; //for dist lists. Selected_URN is list of URNS for export, but Selected_CN is list of CNs for adding to dist list.
    //These are usually the same (i.e. URNs are actually CNs for most search results) except for Permit Holder and Assessor searches, where the URNs are member role numbers
    //and are needed for the PDF & CSV exports but we still need the CNs for distribution lists.

    var html = "<div style='max-height:150px; overflow:auto;'><table style='width:100%;'>";

    if (HasAccess(MSEO_CRUD, "C")) {
        html += "<tr class='msTR' style='height:25px;'><td class='label' style='cursor:default;'>Export To PDF</td><td style='width:75px;'><input type='button' id='expPDF' value='Export'></input></td></tr>";
        html += "<tr class='msTR' style='height:25px;'><td class='label' style='cursor:default;'>Export To CSV</td><td style='width:75px;'><input type='button' id='expCSV'value='Export'></input></td></tr>";
    }

    if (HasAccess(DIST_CRUD, "U") || HasAccess(DIST_CRUD, "C"))
        html += "<tr class='msTR' style='height:25px;'><td class='label' style='cursor:default;'>Add To Distribution List</td><td style='width:75px;'><input type='button' id='expDIST' value='Select'></input></td></tr>";

    html += "</table></div>";

    var buttonbar = "<input type='button' value='Cancel' class='sysmsg_close'>";

    $.system_window(html, "<h2>Export Options</h2>", buttonbar, 2);

    $("#expPDF").click(function () { CloseHintPopup(); SetExportType(PDF_CODE); }).css("width", "75px");
    $("#expCSV").click(function () { CloseHintPopup(); SetExportType(CSV_CODE); }).css("width", "75px");
    $("#expDIST").click(function () { CloseHintPopup(); SetExportType("DL", DIST_CRUD); }).css("width", "75px");
    return false;
}

function ColClickCheck(ctrl) {
    if (!ctrl || $(ctrl).length === 0) {
        if ($(".msColCHK:checkbox:checked").size() === 0)
            $("#expOK").attr("disabled", "disabled");
        else
            $("#expOK").removeAttr("disabled");
    }
    else if ($(ctrl).is(":checked")) {
        $(ctrl).removeAttr("checked");
        if ($(".msColCHK:checkbox:checked").size() === 0)
            $("#expOK").attr("disabled", "disabled");
    }
    else {
        $(ctrl).prop("checked", "checked");
        $("#expOK").removeAttr("disabled");
    }
}

function SelectExportColumns(ExportType) {
    $.ajax({
        url: WebServicePath() + "GetExportColumns?pExportType=" + ExportType, success: function (result) {
            var html = "<div style='max-height:150px; overflow:auto;'><table style='width:100%;'>";

            var vIsChecked = "checked='checked'";
            var vNotChecked = "";
            var vDefaultCheckState = vIsChecked;

            if (result.d !== null && result.d !== undefined && result.d.length > 0) {
                for (var i = 0; i < result.d.length; i++) {
                    if (ExportType.startsWith("PDF")) {
                        //TSA-125: Set individual address fields (apart from postcode) as unticked by default in PDF exports
                        switch (result.d[i].Value) {
                            case "address_line1":
                            case "address_line2":
                            case "address_line3":
                            case "address_town":
                            case "address_county":
                            case "address_country":
                                vDefaultCheckState = vNotChecked;
                                break;
                            default:
                                vDefaultCheckState = vIsChecked;
                                break;
                        }
                    }
                    switch (ExportType.substring(4)) {
                        case "VETT":
                            switch (result.d[i].Value) {
                                case "member_role_number":
                                case "title":
                                case "forenames":
                                case "known_as":
                                case "surname":
                                case "suspension_status":
                                case "org_no":
                                case "role_end_date":
                                case "review_date":
                                case "CE_check_code":
                                    vDefaultCheckState = vNotChecked;
                                    break;
                                default:
                                    vDefaultCheckState = vIsChecked;
                                    break;
                            }
                            break;
                        default:
                            break;
                    }
                    html += "<tr class='msTR' style='height:25px;'><td class='expTD label'>" + result.d[i].Description + "</td><td class='label' style='white-space: nowrap;width:10px;cursor:default;'><input type='checkbox' class='msColCHK' " + vDefaultCheckState + " id='" + result.d[i].Value + "'/></td></tr>";
                }
            }
            else
            {
                $.system_alert("There seems to be a problem with this export. We are sorry for the inconvenience.");
                return;
            }

            var buttonbar = "<input type='button' id='expOK' value='OK' class='sysmsg_bn'>&nbsp;<input type='button' value='Cancel' class='sysmsg_close'>";

            html += "</div></table><br/>";
            if (ExportType.startsWith('PDF')) {
                $.system_window(html, "<h2>Select Columns For Export to PDF</h2>", buttonbar, 1);
            }
            else if (ExportType.startsWith('CSV')) {
                $.system_window(html, "<h2>Select Columns For Export to CSV</h2>", buttonbar, 1);
            }
            else {
                $.system_window(html, "<h2>Select Columns For Export</h2>", buttonbar, 1);
            }

            $("#expOK").click(function () { GoExport(ExportType); });
            $(".msColCHK").click(function () { ColClickCheck(); });
            $(".expTD").click(function () {
                var ID = $(".msColCHK",$(this).parent()).attr("id");
                ColClickCheck($("#" + ID));
            }).css("cursor", "pointer");
        }, error: ServiceFailed
    });
}

function AddToDistList(DIST_CRUD) {
    $.ajax({
        url: WebServicePath() + "GetContactDistLists?pSearch=N", success: function (result) {
            var html = "<div style='max-height:150px; overflow:auto;'><table style='width:100%;'>";

            if (HasAccess(DIST_CRUD, "U") && result.d && result.d.length > 0) {
                for (var i = 0; i < result.d.length; i++) {
                    html += "<tr class='msTR' style='height:25px;'><td class='label llDist' style='cursor:default;'>" +
                        result.d[i].Description.HTMLQuotes() +
                        "</td><td class='label' style='white-space: nowrap;width:10px;cursor:default;'>" +
                        result.d[i].Tag +
                        "</td><td style='text-align:right;width:75px;'><input type='button' class='DList' data-PK='" +
                        result.d[i].Value +
                        "' value='Select'></input></td></tr>";
                }
            }
            else if (HasAccess(DIST_CRUD, "U"))
                html += "<tr><td><h3>There are no lists currently available</h3></td></tr>";
            else
                html += "<tr><td><h3>You do not have permission to update distribution lists, however you do have permission to create a new list.</h3></td></tr>";

            var buttonbar = (HasAccess(DIST_CRUD, "C") ? "<input type='button' id='bnHintNew' value='New List' class='sysmsg_bn'>&nbsp;" : "") + "<input type='button' value='Cancel' class='sysmsg_close'>";

            html += "</div></table><br/>";

            $.system_window(html, "<h2>Select Distribution List</h2>", buttonbar);

            $("#bnHintNew").click(function () {
                CloseHintPopup();
                ShowBusy_Main();
                // add items to table but with (minus) your contact number as ID, will clean up later.
                setTimeout(function () { SelectDistList(0 - pk_val("Master.User.CN")); }, 10);
            });

            $(".DList").click(function () {
                CloseHintPopup();
                ShowBusy_Main();
                var self = this;
                setTimeout(function () { SelectDistList($(self).data("pk"), $(".llDist", $(self).parent().parent()).text()); }, 10);
            }).css("width", "65px");

        }, error: ServiceFailed
    });

    return false;
}

function SelectDistList(DL_ID, DESCR) {

    var vData = {}; //var vData = new FormData();
    vData["pRoutine"] = "DISTLIST";
    vData["pCN"] = pk_val("Master.User.CN");
    vData["pPK"] = DL_ID;
    vData["pData"] = vSelectedCNs;
    PostToHandler(vData, "/System/Funcs", function (Error) {
        if (Error) {
            CloseHintPopup();
            HideBusy_Main();
            $.system_alert("<center>There seems to have been a problem adding these members to the <b>'" + (DESCR || "New") + "'</b> list.</center>");
        }
        else if (DL_ID < 0)
            OpeniFrame(WebSitePath() + "Popups/Maint/NewDistributionList.aspx", '69%', '80%', '90%', '550px', '', true, false);
        else {
            CloseHintPopup();
            HideBusy_Main();
            $.system_alert("<center>The selected members have been successfully added to the <b>'" + DESCR + "'</b> list.</center>");
        }
    }, function () {
        $.system_alert("<center>There seems to have been a problem adding these members to the <b>'" + (DESCR || "New") + "'</b> list.</center>");
    }), true;
}

//#endregion

//function to escape ALL special characters in a string being passed into a regex, so we can filter on characters that have special meaning within a regex.
RegExp.quoteAll = function (str) {
    return (str + '').replace(/[.?*+^$[\]\\|\\(){}-]/g, "\\$&");
};
//function to escape special characters in a string being passed into a regex, so we can filter on characters that have special meaning within a regex.
//leave the pipe out of the list so that we can use it in the input for 'OR'
RegExp.quoteNotOR = function (str) {
    return (str + '').replace(/[.?*+^$[\]\\(){}-]/g, "\\$&");
};
