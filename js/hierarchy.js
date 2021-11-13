$.ajaxSetup({ cache: false });
var AnimationSpeed_open = 250;
var AnimationSpeed_close = 260;
var FoundEntY = "";
var FoundSect = "";

$(document).ready(FormReady);

function FormReady() {
    $("#TR_HIER1").click({ divname: "#TR_HIER1_DIV", foldname: "#FOLD_1" }, ShowHideHier).keydown({ divname: "#TR_HIER1_DIV", foldname: "#FOLD_1" }, ShowHideHier);
    $("#TR_HIER2").click({ divname: "#TR_HIER2_DIV", foldname: "#FOLD_2" }, ShowHideHier).keydown({ divname: "#TR_HIER2_DIV", foldname: "#FOLD_2" }, ShowHideHier);
    $("#TR_HIER3").click({ divname: "#TR_HIER3_DIV", foldname: "#FOLD_3" }, ShowHideHier).keydown({ divname: "#TR_HIER3_DIV", foldname: "#FOLD_3" }, ShowHideHier);
    $("#TR_HIER4").click({ divname: "#TR_HIER4_DIV", foldname: "#FOLD_4" }, ShowHideHier).keydown({ divname: "#TR_HIER4_DIV", foldname: "#FOLD_4" }, ShowHideHier);
    $("#TR_HIER5").click({ divname: "#TR_HIER5_DIV", foldname: "#FOLD_5" }, ShowHideHier).keydown({ divname: "#TR_HIER5_DIV", foldname: "#FOLD_5" }, ShowHideHier);
    $("#TR_HIER6").click({ divname: "#TR_HIER6_DIV", foldname: "#FOLD_6" }, ShowHideHier).keydown({ divname: "#TR_HIER6_DIV", foldname: "#FOLD_6" }, ShowHideHier);
    $("#TR_HIER7").click({ divname: "#TR_HIER7_DIV", foldname: "#FOLD_7" }, ShowHideHier).keydown({ divname: "#TR_HIER7_DIV", foldname: "#FOLD_7" }, ShowHideHier);
    $(".hierhome").click(function () { if (ShowLoadingMessage()) window.location = 'Hierarchy.aspx'; return false; });

    CloseAllFolds(1);
    $(".foldimage").css("background-position-y", "top");
    
    if (pk_val("Page.Hier1")) { $('#TR_HIER1').css({ 'display': 'none' }); }
    if (pk_val("Page.Hier2")) { $('#TR_HIER2').css({ 'display': 'none' }); }
    if (pk_val("Page.Hier3")) { $('#TR_HIER3').css({ 'display': 'none' }); }
    if (pk_val("Page.Hier4")) { $('#TR_HIER4').css({ 'display': 'none' }); }
    if (pk_val("Page.Hier5")) { $('#TR_HIER5').css({ 'display': 'none' }); }
    if (pk_val("Page.Hier6")) { $('#TR_HIER6').css({ 'display': 'none' }); }
    if (pk_val("Page.Hier7")) { $('#TR_HIER7').css({ 'display': 'none' }); }

    SetupEvents("#TR_HIER1_TBL");
    SetupEvents("#TR_HIER2_TBL");
    SetupEvents("#TR_HIER3_TBL");
    SetupEvents("#TR_HIER4_TBL");
    SetupEvents("#TR_HIER5_TBL");
    SetupEvents("#TR_HIER6_TBL");
    SetupEvents("#TR_HIER7_TBL");

    OpenItem(parseInt(pk_val("Page.Open"), 10));

    $("#TR_HIER1_TBL,#TR_HIER2_TBL,#TR_HIER3_TBL,#TR_HIER4_TBL,#TR_HIER5_TBL,#TR_HIER6_TBL,#TR_HIER7_TBL").css({ "width": "100%", "left": "0px" });

    CustomResize = ResizeSP;
}

function SetupEvents(parentTBL)
{
    $(".HIERTR", parentTBL).AttrToData("on");

    $(".h_ADD", parentTBL).click(AddOrg).AttrToData("level");
    $(".h_SECTION", parentTBL).click(AddSection).AttrToData("level");

    $(".h_VIEW", parentTBL).click(ViewOrg).css("width", "55px").AttrToData("level");
    $(".h_EDIT", parentTBL).click(EditOrg).css("width", "55px").AttrToData("level");

    $(".h_CLOSEORG", parentTBL).click(CloseOrg).AttrToData("level");

    $(".h_GH", parentTBL).click(GetHier).AttrToData("htype");
    $(".h_MM", parentTBL).click(ShowMemb);
}

var Pause = false;
function ResizeSP() {
    if (!Pause)
    {
        $(".HIERSECTTBL").css({ "width": $("#mstr_work").width() - 5 });
        
        var UseHeight = $("#mstr_scroll").height() - 50;
        if ($("#TR_HIER1").css("display") !== "none") UseHeight -= $("#TR_HIER1").height() + 5;
        if ($("#TR_HIER2").css("display") !== "none") UseHeight -= $("#TR_HIER2").height() + 5;
        if ($("#TR_HIER3").css("display") !== "none") UseHeight -= $("#TR_HIER3").height() + 5;
        if ($("#TR_HIER4").css("display") !== "none") UseHeight -= $("#TR_HIER4").height() + 5;
        if ($("#TR_HIER5").css("display") !== "none") UseHeight -= $("#TR_HIER5").height() + 5;
        if ($("#TR_HIER6").css("display") !== "none") UseHeight -= $("#TR_HIER6").height() + 5;
        if ($("#TR_HIER7").css("display") !== "none") UseHeight -= $("#TR_HIER7").height() + 5;
        $("#TR_HIER1_DIV,#TR_HIER2_DIV,#TR_HIER3_DIV,#TR_HIER4_DIV,#TR_HIER5_DIV,#TR_HIER6_DIV,#TR_HIER7_DIV").css({ "height": UseHeight, "left": "0px","position":"relative" });
    }
}

function AddOrg()
{
   OpeniFrame(WebSitePath() + 'Popups/Maint/NewOrgEntity.aspx?ON=' + $(this).closest("tr").data("on"), '69%', '990px', '90%', '550px', '90%', false, false);
}

function AddSection()
{
    OpeniFrame(WebSitePath() + 'Popups/Maint/NewSection.aspx?ON=' + $(this).closest("tr").data("on"), '69%', '990px', '90%', '550px', '90%', true, false);
}

function CloseOrg()
{
    if ($(this).data("level") === "ORG" || $(this).data("level") === "CNTR" || $(this).data("level") === "REG" || $(this).data("level") === "CNTY" || $(this).data("level") === "DIST" || $(this).data("level") === "SGRP")
        OpeniFrame(WebSitePath() + 'Popups/Maint/CloseOrgEntity.aspx?ON=' + $(this).closest("tr").data("on"), '49%', '530px', '310px', '530px', '310px', true, false);
    else       
        OpeniFrame(WebSitePath() + 'Popups/Maint/CloseSection.aspx?ON=' + $(this).closest("tr").data("on"), '69%', '90%', '80%', '750px', '400px', true, false);
}

function EditOrg() {
    //ORG,CNTR,REG,CNTY,DIST,SGRP,ORST,CNST,RGST,SGST,CTST,DTST
    if (!$(this).data("level")
        || $(this).data("level") === "ORST"
        || $(this).data("level") === "CNST"
        || $(this).data("level") === "RGST"
        || $(this).data("level") === "SGST"
        || $(this).data("level") === "CTST"
        || $(this).data("level") === "DTST"
        )
        OpeniFrame(WebSitePath() + 'Popups/Maint/NewSection.aspx?EDIT=' + $(this).closest("tr").data("on"), '69%', '990px', '90%', '550px', '90%', true, false);
    else
        OpeniFrame(WebSitePath() + 'Popups/Maint/NewOrgEntity.aspx?EDIT=' + $(this).closest("tr").data("on"), '69%', '990px', '90%', '550px', '90%', true, false);
}

function ViewOrg() {
    if (!$(this).data("level")
        || $(this).data("level") === "ORST"
        || $(this).data("level") === "CNST"
        || $(this).data("level") === "RGST"
        || $(this).data("level") === "SGST"
        || $(this).data("level") === "CTST"
        || $(this).data("level") === "DTST"
        )
        OpeniFrame(WebSitePath() + 'Popups/Maint/NewSection.aspx?VIEW=' + $(this).closest("tr").data("on"), '69%', '990px', '90%', '550px', '90%', true, false);
    else
        OpeniFrame(WebSitePath() + 'Popups/Maint/NewOrgEntity.aspx?VIEW=' + $(this).closest("tr").data("on"), '69%', '990px', '90%', '550px', '90%', true, false);
}

function ShowMemb() {
    var vData = {}; 
    var newDate = new Date();
    vData["SearchType"] = "HIERARCHY";
    vData["OrganisationNumber"] = $(this).closest("tr").data("on");
    vData["UI"] = newDate.getHours().toString() + newDate.getMinutes().toString() + newDate.getMilliseconds().toString();

    if (ShowLoadingMessage()) {
        PostToHandler(vData, (pk_val("Master.Sys.REST") ? "/Search/Members" : "/System/Search"), function () {
            window.location.href = WebSitePath() + "SearchResults.aspx";
        });
    }
    return false;
}

function GetHier() {
    var Level = $(this).data("htype");
    var ON = $(this).closest("tr").data("on"); 

    FoundEntY = "";
    FoundSect = "";
    var self = this;

    var f_country = function (result) { PopulateTBL("CNTR", result); $("#TR_HIER1 h2").text(GetCaptionName(0, false, false) + " - " + $(self).parent().text()); $("#TR_HIER2 h2").text(GetCaptionName(1, true, false)); SetupEvents("#TR_HIER2_TBL"); };
    var f_orgsection = function (result) { PopulateTBL("ORST", result); SetupEvents("#TR_HIER7_TBL"); };
    var f_region = function (result) { PopulateTBL("REG", result); $("#TR_HIER2 h2").text(GetCaptionName(1, false, false) + " - " + $(self).parent().text()); $("#TR_HIER3 h2").text(GetCaptionName(2, true, false)); SetupEvents("#TR_HIER3_TBL"); };
    var f_countrysection = function (result) { PopulateTBL("CNST", result); SetupEvents("#TR_HIER7_TBL"); };
    var f_county = function (result) { PopulateTBL("CNTY", result); $("#TR_HIER3 h2").text(GetCaptionName(2, false, false) + " - " + $(self).parent().text()); $("#TR_HIER4 h2").text(GetCaptionName(3, true, false)); SetupEvents("#TR_HIER4_TBL"); };
    var f_regionsection = function (result) { PopulateTBL("RGST", result); SetupEvents("#TR_HIER7_TBL"); };
    var f_district = function (result) { PopulateTBL("DIST", result); $("#TR_HIER4 h2").text(GetCaptionName(3, false, false) + " - " + $(self).parent().text()); $("#TR_HIER5 h2").text(GetCaptionName(4, true, false)); SetupEvents("#TR_HIER5_TBL"); };
    var f_countysection = function (result) { PopulateTBL("CTST", result); SetupEvents("#TR_HIER7_TBL"); };
    var f_group = function (result) { PopulateTBL("SGRP", result); $("#TR_HIER5 h2").text(GetCaptionName(4, false, false) + " - " + $(self).parent().text()); $("#TR_HIER6 h2").text(GetCaptionName(5, true, false)); SetupEvents("#TR_HIER6_TBL"); };
    var f_districtsection = function (result) { PopulateTBL("DTST", result); SetupEvents("#TR_HIER7_TBL"); };
    var f_groupsection = function (result) { PopulateTBL("SGST", result); $("#TR_HIER6 h2").text(GetCaptionName(5, false, false) + " - " + $(self).parent().text()); SetupEvents("#TR_HIER7_TBL"); };

    var vData = {};
    vData["LiveData"] = "Y";
    vData["ParentID"] = ON;

    if (Level === "ORG") {
        if (pk_val("Master.Sys.REST")) {
            PostToHandler(vData, "/hierarchy/countries", f_country, ServiceFailed, false, true);
            PostToHandler(vData, "/hierarchy/hq/sections", f_orgsection, ServiceFailed, false, true);
        } else {
            $.ajax({ url: WebServicePath() + "GetScoutCountries?pLiveData=true&pOrgID=" + ON, async: false, success: f_country, error: ServiceFailed });
            $.ajax({ url: WebServicePath() + "GetOrganisationSections?pLiveData=true&pOrgID=" + ON, async: false, success: f_orgsection, error: ServiceFailed });
        }
    }
    if (Level === "CNTR") {
        CountryOrganisationNumber = ON;
        if (pk_val("Master.Sys.REST")) {
            PostToHandler(vData, "/hierarchy/regions", f_region, ServiceFailed, false, true);
            PostToHandler(vData, "/hierarchy/country/sections", f_countrysection, ServiceFailed, false, true);
        } else {
            $.ajax({ url: WebServicePath() + "GetScoutRegions?pLiveData=true&pCountryID=" + ON, async: false, success: f_region, error: ServiceFailed });
            $.ajax({ url: WebServicePath() + "GetCountrySections?pLiveData=true&pCountryID=" + ON, async: false, success: f_countrysection, error: ServiceFailed });
        }
    }
    if (Level === "REG") {
        if (pk_val("Master.Sys.REST")) {
            PostToHandler(vData, "/hierarchy/counties", f_county, ServiceFailed, false, true);
            PostToHandler(vData, "/hierarchy/region/sections", f_regionsection, ServiceFailed, false, true);
        } else {
            $.ajax({ url: WebServicePath() + "GetScoutCounties?pLiveData=true&pRegionID=" + ON, async: false, success: f_county, error: ServiceFailed });
            $.ajax({ url: WebServicePath() + "GetRegionSections?pLiveData=true&pRegionID=" + ON, async: false, success: f_regionsection, error: ServiceFailed });
        }
    }
    if (Level === "CNTY") {
        if (pk_val("Master.Sys.REST")) {
            PostToHandler(vData, "/hierarchy/districts", f_district, ServiceFailed, false, true);
            PostToHandler(vData, "/hierarchy/county/sections", f_countysection, ServiceFailed, false, true);
        } else {
            $.ajax({ url: WebServicePath() + "GetScoutDistricts?pLiveData=true&pCountyID=" + ON, async: false, success: f_district, error: ServiceFailed });
            $.ajax({ url: WebServicePath() + "GetCountySections?pLiveData=true&pCountyID=" + ON, async: false, success: f_countysection, error: ServiceFailed });
        }
    }
    if (Level === "DIST") {
        if (pk_val("Master.Sys.REST")) {
            PostToHandler(vData, "/hierarchy/groups", f_group, ServiceFailed, false, true);
            PostToHandler(vData, "/hierarchy/district/sections", f_districtsection, ServiceFailed, false, true);
        } else {
            $.ajax({ url: WebServicePath() + "GetScoutGroups?pLiveData=true&pDistrictID=" + ON, async: false, success: f_group, error: ServiceFailed });
            $.ajax({ url: WebServicePath() + "GetDistrictSections?pLiveData=true&pDistrictID=" + ON, async: false, success: f_districtsection, error: ServiceFailed });
        }
    }
    if (Level === "SGRP") {
        FoundEntY = "0";
        if (pk_val("Master.Sys.REST")) {            
            PostToHandler(vData, "/hierarchy/group/sections", f_groupsection, ServiceFailed, false, true);
        } else {
            $.ajax({ url: WebServicePath() + "GetScoutGroupSections?pLiveData=true&pGroupID=" + ON, async: false, success: f_groupsection, error: ServiceFailed });
        }
    }    

    return false;
}

function PopulateTBL(Level, result) {
    var ItemNo = "";
    var SectionNo = 0;
        
    if (Level === "CNTR") { $("#TR_HIER2,#TR_HIER3,#TR_HIER4,#TR_HIER5,#TR_HIER6,#TR_HIER7").css({ "display": "none" }); ItemNo = "2"; SectionNo = 1; }
    if (Level === "REG") { $("#TR_HIER3,#TR_HIER4,#TR_HIER5,#TR_HIER6,#TR_HIER7").css({ "display": "none" }); ItemNo = "3"; SectionNo = 2; }
    if (Level === "CNTY") { $("#TR_HIER4,#TR_HIER5,#TR_HIER6,#TR_HIER7").css({ "display": "none" }); ItemNo = "4"; SectionNo = 3; }
    if (Level === "DIST") { $("#TR_HIER5,#TR_HIER6,#TR_HIER7").css({ "display": "none" }); ItemNo = "5"; SectionNo = 4; }
    if (Level === "SGRP") { $("#TR_HIER6,#TR_HIER7").css({ "display": "none" }); ItemNo = "6"; SectionNo = 5; }

    if (Level === "ORST" || Level === "CNST" || Level === "RGST" || Level === "CTST" || Level === "DTST" || Level === "SGST") {
        $("#TR_HIER7").css({ "display": "none" });
        ItemNo = "7";        
        FoundSect = "0"; // not found section

        if (Level === "ORST") { $("#TR_HIER7 h2").text(GetCaptionName(0, true, true)); }
        else if (Level === "CNST") { $("#TR_HIER7 h2").text(GetCaptionName(1, true, true)); }
        else if (Level === "RGST") { $("#TR_HIER7 h2").text(GetCaptionName(2, true, true)); }
        else if (Level === "CTST") { $("#TR_HIER7 h2").text(GetCaptionName(3, true, true)); }
        else if (Level === "DTST") { $("#TR_HIER7 h2").text(GetCaptionName(4, true, true)); }
        else if (Level === "SGST") { $("#TR_HIER7 h2").text(GetCaptionName(5, true, true)); }
    }  
    else
        FoundEntY = "0"; // not found entity

    $("#TR_HIER" + ItemNo + "_TBL tr:not(:first)").remove();        

    if (result && result.d) result = result.d; // REST vs JSON result
    if (result) {
        var TRHTML = "";
        $.each(result, function (idx) {
            if (this.Tag !== null && this.Value !== "0") {
                var datarow = $.parseJSON(this.Tag)[0];
                TRHTML += "<tr class='HIERTR' data-on='" + datarow.organisation_number + "'>";
                TRHTML += (ItemNo === "7" ? "<td><label>" + datarow.name + "</label></td>" : "<td><a class='h_GH' href='#' data-htype='" + Level + "'>" + datarow.name + "</a></td>");
                TRHTML += "<td><label>" + datarow.address + "</label></td>";

                //TP-417  https://jira.isg.co.uk/browse/TP-417
                //Groups & sections need type column
                if (Level === "SGRP")
                    TRHTML += "<td>" + datarow.GroupTypeDesc + "</td>";
                else if (ItemNo === "7")
                    TRHTML += "<td><label>" + datarow.SectionTypeDesc + "</label></td>";
                
                TRHTML += (datarow.Members === 0 ? "<td><label>" + datarow.Members + "</label></td>" : "<td><a class='h_MM' href='#'>" + datarow.Members + "</a></td>");                
                TRHTML += "<td style='white-space: nowrap;width:1px;'>" + meta_val("BtnHTML" + (ItemNo || "1")) + "</td></tr>"; //ORG,CNTR,REG,CNTY,DIST,SGRP,ORST,CNST,RGST,SGST,CTST,DTST
            }
        });

        if (TRHTML) {
            $("#TR_HIER" + ItemNo + "_TBL").append(TRHTML);
            // only if not already foung entity, check section
            // (calls come back in random order, so group/section may come back first)
            if (ItemNo === "7")
                FoundSect = "1"; // found section
            else
                FoundEntY = "1"; // found entity

            $("#TR_HIER" + ItemNo).css({ "display": "inline-block" });
        }        
    }    

    if (FoundEntY.length > 0 && FoundSect.length > 0) {
        if (FoundEntY === "0" && FoundSect === "0")
            $.system_alert("There are no items below this level.");
        // if only section found goto it.
        else if (FoundSect === "1" && FoundEntY === "0") {
            CloseAllFolds(AnimationSpeed_close);
            OpenItem(7);
        }
        else {
            CloseAllFolds(AnimationSpeed_close);
            if (Level === "ORST" || Level === "CNTR") { OpenItem(2); }
            if (Level === "CNST" || Level === "REG") { OpenItem(3); }
            if (Level === "RGST" || Level === "CNTY") { OpenItem(4); }
            if (Level === "CTST" || Level === "DIST") { OpenItem(5); }
            if (Level === "DTST" || Level === "SGRP") { OpenItem(6); }
        }
    }

    DoResize();
}

function OpenItem(ItemNo) {
    $("#TR_HIER" + ItemNo + "_DIV").slideDown(AnimationSpeed_open, DoResize);
    $("#FOLD_" + ItemNo).css({ "background-image": $(".foldimage_up").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });    
}

function CloseAllFolds(AnimationSpeed) {
    $("#TR_HIER1_DIV,#TR_HIER2_DIV,#TR_HIER3_DIV,#TR_HIER4_DIV,#TR_HIER5_DIV,#TR_HIER6_DIV,#TR_HIER7_DIV").slideUp(AnimationSpeed, DoResize);
    $("#FOLD_1,#FOLD_2,#FOLD_3,#FOLD_4,#FOLD_5,#FOLD_6,#FOLD_7").css({ "background-color": "transparent", "background-repeat": "no-repeat", "background-image": $(".foldimage_down").css("background-image") });
}

// method to allocate ALL clicks for all <a> tags in a div (if they are created or not) - can also do other element types too with 'is' clause
function ShowHideHier(e) {
    var key = e === undefined ? 13 : e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    if (key === 13 || !e.charCode)
        try {
            Pause = true; // pauses page resize event
            CloseAllFolds(AnimationSpeed_close);
            if ($(e.data.divname).is(":hidden")) {
                $(e.data.divname).slideDown(AnimationSpeed_open, DoResize);
                $(e.data.foldname).css({ "background-image": $(".foldimage_up").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
            }            
        } catch (err) { }
    Pause = false;
}        

