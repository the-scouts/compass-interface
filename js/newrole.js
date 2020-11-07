$(document).ready(FormReady);

var vCurrentPageNo = 1;
var vPropIDX = 1;
var vHierIDX = 1;
var HierPropIDX = 0;
var HierTrainIDX = 0;
var MSGIDX = 0;

//#region General Page Navigation

function FormReady() {
    SetUpPage(pk_val("Page.IsReadonly"), !pk_val("Page.NG_ID"));

    // scrunge inputs on access page so items are closer together
    $("input", $("#mpage7")).css({ "margin": "0px", "padding": "0px" });

    //if (pk_val("PAGE.MSG") && (!vInsertMode || pk_val("Page.COPYROW"))) {
    //    MSGIDX = setTimeout(function () {
    //        $.system_hint("<br/><center>Role setup can take a little while initialising.<br/><br/>Please wait.......</center>", "<h2>Information</h2>");
    //    }, 500);
    //}

    if (!vInsertMode) {
        $("#LBTN1").click(function () { ChangePage(vCurrentPageNo, 1); });
        $("#LBTN2").click(function () { ChangePage(vCurrentPageNo, 2); });
        $("#LBTN3").click(function () { ChangePage(vCurrentPageNo, 3); });
        $("#LBTN4").click(function () { ChangePage(vCurrentPageNo, 4); });
        $("#LBTN5").click(function () { ChangePage(vCurrentPageNo, 5); });
        $("#LBTN6").click(function () { ChangePage(vCurrentPageNo, 6); });
        $("#LBTN7").click(function () { ChangePage(vCurrentPageNo, 7); });
    }

    $("#bn_p1_next").click(function () { return ChangePage(vCurrentPageNo, 2); }).removeAttr("id");
    $("#bn_p2_next").click(function () { return ChangePage(vCurrentPageNo, 3); }).removeAttr("id");
    $("#bn_p3_next").click(function () { return ChangePage(vCurrentPageNo, 4); }).removeAttr("id");
    $("#bn_p4_next").click(function () { return ChangePage(vCurrentPageNo, 5); }).removeAttr("id");
    $("#bn_p5_next").click(function () { return ChangePage(vCurrentPageNo, 6); }).removeAttr("id");
    $("#bn_p6_next").click(function () { return ChangePage(vCurrentPageNo, 7); }).removeAttr("id");

    $("#bn_p2_prev").click(function () { return ChangePage(vCurrentPageNo, 1); }).removeAttr("id");
    $("#bn_p3_prev").click(function () { return ChangePage(vCurrentPageNo, 2); }).removeAttr("id");
    $("#bn_p4_prev").click(function () { return ChangePage(vCurrentPageNo, 3); }).removeAttr("id");
    $("#bn_p5_prev").click(function () { return ChangePage(vCurrentPageNo, 4); }).removeAttr("id");
    $("#bn_p6_prev").click(function () { return ChangePage(vCurrentPageNo, 5); }).removeAttr("id");
    $("#bn_p7_prev").click(function () { return ChangePage(vCurrentPageNo, 6); }).removeAttr("id");

    if (!vIsReadonly) {
        $("#ctl00_workarea_txt_p1_minage").AttrToData("orig");
        $("#ctl00_workarea_txt_p1_maxage").AttrToData("orig");
        $("#ctl00_workarea_cbo_p1_roleclass").AttrToData("orig");

        $("input,select").change(CheckReq);
        $("#ctl00_workarea_cb_p1_disabled").change(CheckReq);
        $("input").keydown(function (event) { return RemoveNotWantedChars(event); });
        $("input[type=checkbox]", $("#mpage6")).on("change", function (event) { CheckRowModified($(this).parents(".HierarchyDiv")); });
        $("input[type=text]", $("#mpage6")).on("keyup", function (event) { CheckRowModified($(this).parents(".HierarchyDiv")); });
        $("#bnReset1,#bnReset2,#bnReset3,#bnReset4,#bnReset5,#bnReset6,#bnReset7").click(function () { return ResetPage(vCurrentPageNo); }).removeAttr("id");
        $("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnSave4,#ctl00_footer_bnSave5,#ctl00_footer_bnSave6,#ctl00_footer_bnSave7").attr("href", "#").click(function () {
            if (!ValidatePage(vCurrentPageNo))
                return false;

            if (ClientSave()) {
                MakeFormReadonlyForSave(".MiscPropBN,.TrainingBN,.HierarchyBN");
                __doPostBack('ctl00$footer$bnSave7', '');
            }
            return false;
        });

        $(".p7full").click(FullCBClick);
        $(".p7cb").click(ItemCBClick);
        $("#ctl00_workarea_cb_p1_parentrole").change(function () { SetParentData($(this).prop("checked")); }).trigger("change");

        $("#ctl00_workarea_cbo_p1_roleclass").change(function () {
            if ($("#ctl00_workarea_cb_p1_parentrole").prop("checked")) {
                $(".SYSCRUD").hide(); // dont show System CRUD for parent
                $("#LBTN2,#LBTN3,#LBTN4,#LBTN5").hide(); // tabs to hide for parent
            } else if ($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") == pk_val("CONST.SystemClass")) {
                $(".SYSCRUD").show(); // do show System CRUD for System roles
                $("#LBTN2,#LBTN3,#LBTN5").hide(); // tabs to hide for SYSTEM roles
            } else {
                $(".SYSCRUD").hide(); // dont show System CRUD for normal roles
                $("#LBTN2,#LBTN3,#LBTN4,#LBTN5").show(); // ensure all hidden tabs are shown
            }
        }).trigger("change");

        $("#ctl00_workarea_txt_p1_startdate").blur(function () { AddStartDateFilter(); Date_TextBox_Blur(this, 'Members are already using this role at this date. Please select an earlier date.'); });
        $("#bn_p1_startdate").click(function () { PopupStartDateSelect(this, 'ctl00_workarea_txt_p1_startdate'); });
        $("#ctl00_workarea_txt_p1_minage").blur(AgeCheckBlur).keypress(function (e) { return NumberOnly_KeyPress(e || event, null, [46]); }).css("width", "50px");
        $("#ctl00_workarea_txt_p1_maxage").blur(AgeCheckBlur).keypress(function (e) { return NumberOnly_KeyPress(e || event, null, [46]); }).css("width", "50px");

        $(".STERR").click(function () {
            $.system_hint("This is where a member has this role at this hierarchy level but the item no longer exists on page 6 : Hierarchy. <br/>To rectify this, please add this item to the hierarchy and these member roles will automatically become available again.", "<center><h2>This item is orphaned.</h2></center>");
        }).css("color","red");

        $(".STCLK").click(function () {
            var LVL = $(this).data("lvl");
            var ON = $(this).data("orgid");
            $.system_confirm("Do a select of these " + $(this).text() + " members?<br/><br/>NOTE: CRUD settings in combination with an individuals status may effect the result set.", function () {
                var vData = {}; //var vData = new FormData();
                vData["AREA_RB"] = "1";
                vData["SearchType"] = "ADVANCED";
                vData["RoleLevel"] = LVL;
                vData["Role"] = pk_val("Page.NG_ID") + "~" + (ON ? ON : "");
                if (ON) vData["Country"] = ON;

                MakeFormReadonlyForSave(undefined, "Searching Database.....");
                var newDate = new Date();
                vData["UI"] = newDate.getHours().toString() + newDate.getMinutes().toString() + newDate.getMilliseconds().toString();

                PostToHandler(vData, (pk_val("Master.Sys.REST") ? "/Search/Members" : "/System/Search"), function () {
                    setTimeout(function () {
                        if (pk_UsePopup())
                            parent.ShowBusy_Main(WebSitePath() + "SearchResults.aspx");
                        else
                            ShowBusy_Main(WebSitePath() + "SearchResults.aspx");
                    }, 2000);
                });
            });
            return false;
        });
    }

    // Misc Properties
    Opt_GetCBO("#ctl00_workarea_h_cbo_p4_MiscProp", "--- Select Role Property ---", "#ctl00_workarea_cbo_p4_MiscProp", 12);
    // Misc Property Enablers
    Opt_GetCBO("#ctl00_workarea_h_cbo_p4_MiscProp_Enablers", "--- Select Role Enabler ---", "#ctl00_workarea_cbo_p4_MiscProp_Enablers", 4);
    // variant types
    Opt_GetCBO("#ctl00_workarea_h_cbo_p2_VariantTypes", "--- Select Role Variant ---", "#ctl00_workarea_cbo_p2_VariantTypes", 12);
    // variant types PA
    Opt_GetCBO("#ctl00_workarea_h_cbo_p2_VariantTypesPA", "--- Select Assessor Activity ---", "#ctl00_workarea_cbo_p2_VariantTypesPA", 4);
    // variant types PAV
    Opt_GetCBO("#ctl00_workarea_h_cbo_p2_VariantTypesPAV", "--- Select Assessor Category ---", "#ctl00_workarea_cbo_p2_VariantTypesPAV", 10);
    // Line Manager Roles
    Opt_GetCBO("#ctl00_workarea_h_cbo_p1_lmrole", "--- Select Line Manager Role ---", "#ctl00_workarea_cbo_p1_lmrole", 5);

    $("#ctl00_workarea_cbo_p1_lmrole").each(function () { $(this).resetDB(); });

    SetupVariantEvents();
    SetupPropertyEvents();
    SetupTrainingEvents();
    SetupHierarchyEvents();

    $("#tbl_p7_PortalAccess td").not(".msHeadTDCB").not(".p7td").css("text-align", "center");
    $(".p7td").AttrToData("ng_crud");
    $(".p3CB").AttrToData("ng_grade");
    $(".TRNDF").AttrToData("rtd_id");

    ResetRequired("#mpage1");
    $.FocusControl("#ctl00_workarea_txt_p1_primdesc", false, 1000);

    if ($.Is_MSIE(7))
        $(".TickIMG").css({ "display": "inline-block" });

    if (!pk_val("Page.NG_ID")) {
        $(".footerbuttongreen.EDITBN").css({ "display": "none" });
        $("#ctl00_footer_bnSave7").show();
    }

    PopulateVariantTypes();
    ShowVariantTypes(false);

    PopulateProperties();
    PopulateTraining();
    PopulateHierarchy();

    SetEnabled();

    if (vIsReadonly)
        MakePageReadOnly();
    MakePageVisible(1);
    HasChanges = false;
    ShowOriginalSet(); // simple debug routine for checking if orig DB value is set.
}

function SetParentData(value) {
    $("#LBTN2,#LBTN3,#LBTN4,#LBTN5,#LBTN6").css({ "display": (value ? "none" : "block") });
    $("#tbl_p7_PortalAccess tr").not(".FAMPP").css({ "display": (value ? "none" : "") });
    $("#ParentMSG").css({ "display": (value ? "block" : "none") });
    $("#ctl00_workarea_cbo_p1_roleclass").trigger("change");
}

function MakePageVisible(PageNo) {
    try {
        MakeTabVisible(PageNo);
        vCurrentPageNo = PageNo;
        if (PageNo === 1) $.FocusControl("#ctl00_workarea_txt_p1_primdesc");
        if (PageNo === 2) $.FocusControl($(".VariantTypeCBO").first());
        if (PageNo === 4) $.FocusControl($(".MiscPropCBO").first());
        if (PageNo === 5) $.FocusControl($(".TrainingCBO").first());
        if (PageNo === 6) {
            $.FocusControl($(".HierarchyCBO").first());
            CheckModified();
            if ($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") == pk_val("CONST.SystemClass")) {
                $(".tbl_p6_Hier_Train_td").hide();
                $(".tbl_p6_Hier_Prop").css("width","100%");
            }
            else {
                $(".tbl_p6_Hier_Train_td").show();
                $(".tbl_p6_Hier_Prop").css("width", "400px");
            }
        }
    }
    catch (err) { }
}

function ValidatePage(PageNo) {
    vValid = true;
    vReqFocused = false;
    var OldModified = HasChanges;
    if (PageNo === 1) {
        $('input,select', $('#mpagetbl1')).not("[type='button']").each(CheckReq);
        HasChanges = OldModified;

        return vValid;
    }

    if (PageNo === 2) {
        if ($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") === pk_val("CONST.AssessorCode")) {
            $('.VariantTypePAVCBO', $('#mpage2')).each(CheckReq);
        }
        return vValid;
    }

    if (PageNo === 5) {
        var ErrorMessage = "";
        $(".TRNDF").each(function () {
            if ($(this).is(":checked")) {
                var Code = $(this).attr("id").replace("cb_p5_", "");
                var found = false;
                $("#tbl_p5_Training .TrainingCBO").each(function () {
                    if ($(this).val() && !found) {
                        if($("#ctl00_workarea_cbo_p5_Training option[value='" + $(this).val() + "']").attr("data-" + Code) === "Y")
                            found = true;// NOTE have NOT done DataToAttr as need value on html copy, AND done know variable codes to call on
                    }
                });
                if (!found) {
                    vValid = false;
                    if (ErrorMessage === "")
                        ErrorMessage +=
                            "You must pick training that meets the 'Minimum Training Requirements'. " +
                            "Please select training that gives you: <br /><br />";
                    ErrorMessage += "&#8226; " + $(this).next("label").text() + "   ";
                }
            }
        });
        if (ErrorMessage) $.system_alert(ErrorMessage, undefined, undefined, false);
        return vValid;
    }

    if (PageNo === 6) {
        $('select', $('#mpage6')).each(CheckReq);
        HasChanges = OldModified;
        return vValid;
    }

    return true; // todo
}

function ChangePage(FromPageNo, ToPageNo, DontDoValidation) {
    if (DontDoValidation || ValidatePage(FromPageNo)) {
        // when going to page 2, if SYST then goto Properties, else goto CRUD (if parent) > known by LBTN2 being not visible
        if ($("#LBTN" + ToPageNo.toString()).css("display") === "none") {
            ChangePage(FromPageNo, ToPageNo + (FromPageNo < ToPageNo ? 1 : -1), true);
            return false;
        }

        MakePageVisible(ToPageNo);
    }
    return false;
}

function CheckReq() {
    if (!vIsReadonly) {
        var CTRL_ID = $(this).attr("id");

        if (CTRL_ID === "ctl00_workarea_txt_p1_primdesc" || CTRL_ID === "ctl00_workarea_cb_p1_disabled") {
            $("#hdr_caption").text($("#ctl00_workarea_txt_p1_primdesc").val() + ($("#ctl00_workarea_cb_p1_disabled").is(":checked") ? " [Disabled]" : ""));
        }
        else if (CTRL_ID === "ctl00_workarea_cbo_p1_roleclass") {
            ShowVariantTypes(true);
        }

        else if ($(this).hasClass("CountryCBO")) {
            var myTD = $(this).parent().parent().parent().parent().parent().parent().parent();
            var Hier = $(".HierarchyCBO", myTD).val();
            if (Hier && Hier !== "ORG") {
                var HasItemFocused = vReqFocused;
                ShowRequired(this);
                if (HasItemFocused !== vReqFocused) {
                    $(".HierarchyDiv").hide();
                    $(".HierarchyDiv", myTD).show();
                }
            }

            return;
        }

        ShowRequired(this);
    }
}

function ResetPage(PageNo) {
    if (PageNo === 1) {
        $("#mpage1 input").not(".STATS").each(function () { $(this).resetDB(); });
        $("#mpage1 select").each(function () { $(this).resetDB(); });
        $("#ctl00_workarea_cb_p1_parentrole").resetDB().trigger("change");
        ResetRequired('#mpage' + PageNo);
    }

    if (PageNo === 2) {
        if ($("#ctl00_workarea_lst_p2_hiddendata").val() && $.parseJSON($("#ctl00_workarea_lst_p2_hiddendata").val().replaceAll("`", '"')).length > 10)
            parent.ShowBusy_Popup('Loading Variants Page... Please wait.');

        $("#tbl_p2_VariantTypes tbody tr").not(":last").remove();

        // insert mode so do clear
        if (!$("#ctl00_workarea_cbo_p1_roleclass").data("db"))
            PopulateVariantTypes();
        else if ($("#ctl00_workarea_cbo_p1_roleclass").data("db") === pk_val("CONST.AssessorCode") && $("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") === pk_val("CONST.AssessorCode"))
            PopulateVariantTypes();
        else if ($("#ctl00_workarea_cbo_p1_roleclass").data("db") !== pk_val("CONST.AssessorCode") && $("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") !== pk_val("CONST.AssessorCode"))
            PopulateVariantTypes();
        else {
            $.system_alert("Cannot complete reset as the role class has changed, and the variant types cannot be put back.");
        }
    }

    if (PageNo === 3) {
        $("#tbl_p3_MemberGrades .p3CB").each(function () { $(this).resetDB(); });
    }

    if (PageNo === 4) {
        if ($("#tbl_p4_MiscProp tbody tr:not('.subTR'):not(:first):not(:last)").length === 0) {
            $("#tbl_p4_MiscProp .MiscPropBN").each(function () { RemoveMiscProp(this, true, true); });
            SetupPropertyEvents();
            PopulateProperties();
        }
        else $.system_confirm("<h3 style='color:red'>Warning</h3><br/>Resetting Properties will remove <em><b>all</b></em> Properties checked values against <em><b>all</b></em> Hierarchy items on the Hierarchy page.\r\n\r\nContinue With Reset?", function () {
            $("#tbl_p4_MiscProp .MiscPropBN").each(function () { RemoveMiscProp(this, true, true); });
            SetupPropertyEvents();
            PopulateProperties();
        });
    }

    if (PageNo === 5) {
        if ($("#tbl_p6_Hierarchy tr:not('.subTR'):not(:first):not(:last)").length === 0) {
            $("#tbl_p5_Training .TrainingBN").each(function () { RemoveTraining(this, true, true); });
            $("#mpage5 .TRNDF").each(function () { $(this).resetDB(); });
            PopulateTraining();
        }
        else $.system_confirm("<h3 style='color:red'>Warning</h3><br/>Resetting Training will remove <em><b>all</b></em> Training checked values against <em><b>all</b></em> Hierarchy items on the Hierarchy page.<br/><br/>Continue With Reset?", function () {
            $("#tbl_p5_Training .TrainingBN").each(function () { RemoveTraining(this, true, true); });
            $("#mpage5 .TRNDF").each(function () { $(this).resetDB(); });
            PopulateTraining();
        });
    }

    if (PageNo === 6) {
        $("#tbl_p6_Hierarchy .HierarchyBN").each(function () { RemoveHierarchy(this, true); });
        PopulateHierarchy();
        CheckModified();
    }

    if (PageNo === 7) {
        $("#tbl_p7_PortalAccess .p7cb").each(function () { $(this).resetDB(); });
        $("#tbl_p7_PortalAccess .p7full").each(function () { $(this).resetDB(); });
    }

    SetEnabled();
    return false;
}

//#endregion

//#region Page 1

function AddStartDateFilter() {
    calPopup.clearDisabledDates();

    //I think what KA is doing is saying: on edit (not new) don't let the date go forward in time beyond the date the first member who holds this role started it

    if ($("#ctl00_workarea_txt_stat_startDate").val()) {
        if ($("#ctl00_workarea_txt_stat_startDate").val().replaceAll(" ", "")) {
            var dd = new Date($("#ctl00_workarea_txt_stat_startDate").val().replaceAll(" ", ""));
            dd.setDate(dd.getDate() + 1); // add day
            calPopup.addDisabledDates(formatDate(dd, DisplayDateFormat), null);
        }
    }
}

function PopupStartDateSelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddStartDateFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function AgeCheckBlur() {
    if ($(this).val()) NumberOnly_Blur(this, false, 3);

    if ($("#ctl00_workarea_txt_p1_minage").val() && $("#ctl00_workarea_txt_p1_maxage").val())
    {
        var MinD = parseFloat($("#ctl00_workarea_txt_p1_minage").val());
        var MaxD = parseFloat($("#ctl00_workarea_txt_p1_maxage").val());

        if (MinD >= MaxD) {
            $.system_alert("Max-age must be greater than the min-age.", this);

            if ($(this).data("orig")) $(this).val($(this).data("orig"));
            else $(this).val("");

            return;
        }
    }

    $(this).data("orig", $(this).val());
}

//#endregion

//#region Page 2 Variant Types

function PopulateVariantTypes() {
    PopulateGridVariantsCBO();

    if ($("#ctl00_workarea_lst_p2_hiddendata").val()) {
        var mvData = $.parseJSON($("#ctl00_workarea_lst_p2_hiddendata").val().replaceAll("`", '"'));
        for (var i = 0; i < mvData.length ; i++)
            AddVariantType(mvData[i].Value, mvData[i].Key, mvData[i].Desc1, mvData[i].Desc2);
        SetupVariantEvents(true);
        SetEnabled();

        if (vIsReadonly) {
            //TSA-960: will now have blank combos added at the bottom of the page as per EDIT mode, so remove them
            $(".VariantTypePACBO").last().remove();
            $(".VariantTypePAVCBO").last().remove();
        }

        parent.HideBusy_Popup();
    }
}

function SetupVariantEvents(All) {
    if (All)
    {
        if (!vIsReadonly)
            $(".VariantTypeBN").not(":last").click(function () { RemoveVariantType(this); });
        return;
    }

    if (!vIsReadonly) {
        $(".VariantTypeCBO").last().change(function () { VariantTypeCBOChange(this); });
        $(".VariantTypePACBO").last().change(function () { VariantTypeCBOChange(this); });
        $(".VariantTypePAVCBO").last().change(function () { VariantTypeCBOChange(this); });
        $(".VariantTypeBN").last().click(function () { RemoveVariantType(this); }).css("visibility", "hidden");
    }
    else
    {
        $(".VariantTypeBN").last().remove();
    }

    $(".VariantTypeCBO").last().css("width", "580px");
    $(".VariantTypePACBO").last().css("width", "280px");
    $(".VariantTypePAVCBO").last().css("width", "280px");
}

function ShowVariantTypes(DoClear) {
    var myOrig = $("#ctl00_workarea_cbo_p1_roleclass").data("orig") || $("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value");

    if (!DoClear) {
        if ($("#ctl00_workarea_cbo_p1_roleclass").data("orig") === pk_val("CONST.AssessorCode")) {
            $(".TD_NOASS").css("display", "none");
            $(".TD_ASS, .varreq").css("display", "");
        }
        else {
            $(".TD_NOASS").css("display", "");
            $(".TD_ASS, .varreq").css("display", "none");
        }
    }
    else if ($("#ctl00_workarea_cbo_p1_roleclass").data("orig") === pk_val("CONST.AssessorCode") && ($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") !== pk_val("CONST.AssessorCode") || !DoClear)) {
        $(".TD_NOASS").css("display", "");
        $(".TD_ASS, .varreq").css("display", "none");
    }
    else if ($("#ctl00_workarea_cbo_p1_roleclass").data("orig") !== pk_val("CONST.AssessorCode") && ($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") === pk_val("CONST.AssessorCode") || !DoClear)) {
        $(".TD_NOASS").css("display", "none");
        $(".TD_ASS, .varreq").css("display", "");
    }
    else
        return;

    $("#ctl00_workarea_cbo_p1_roleclass").data("orig", $("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value"));

    if (DoClear && $("#tbl_p2_VariantTypes tbody tr").length > 1)
        $.system_confirm("By changing between Assessor and non-Assessor Role Class types, any variants that have been setup will be removed, additionally any uses of the variants on members roles will also be removed on saving of the role.",
            function () { ClearVariants(); },
            function () {
                $("#ctl00_workarea_cbo_p1_roleclass").val(myOrig);
                ShowVariantTypes(false);
            });
    else if (DoClear) ClearVariants();
}

function ClearVariants() {
    $("#tbl_p2_VariantTypes tbody tr").not(":last").remove();
    $('.VariantTypeCBO').last().val("");
    $('.VariantTypePACBO').last().val("").removeAttr("disabled");
    $('.VariantTypePAVCBO').last().val("").empty().attr("disabled", "disabled").append("<option selected='selected' value=''>--- Select Assessor Category ---</option>").removeAttr("required");
    $(".VariantTypeBN").last().css("visibility", "hidden");
    ResetRequired("#mpage2");
    SetEnabled();
}

function PopulateGridVariantsCBO() {
    $('.VariantTypeCBO').last().html($("#ctl00_workarea_cbo_p2_VariantTypes").html());
    $('.VariantTypePACBO').last().html($("#ctl00_workarea_cbo_p2_VariantTypesPA").html());
    $('.VariantTypeCBO').last().data("var_id","");
    $('.VariantTypePACBO').last().data("var_id", "");
    ShowRequired($(".VariantTypePAVCBO"));
}

var AssessorTRTamplate = "<tr class='msTR'><td class='TD_NOASS' style='display: none;'><select title='Variants' class='VariantTypeCBO' style='width: 580px;'></select></td><td class='TD_ASS' style=''><select title='Variant Header' disabled='disabled' class='VariantTypePACBO ReadonlyInput' style='width: 280px;'>{0}</select></td><td class='TD_ASS' style=''><select title='Variants Item' disabled='disabled' class='VariantTypePAVCBO ReadonlyInput' data-var_id='{2}' style='border-width: 1px; border-style: solid; width: 280px;' required='required'>{1}</select></td><td style='width: 50px; text-align: right;'><input class='VariantTypeBN EDITBN' style='visibility: visible;' type='button' value='Delete'></td></tr>";
var NonAssessorTRTamplate = "<tr class='msTR'><td class='TD_NOASS' style=''><select title='Variants' data-var_id='{1}' class='VariantTypeCBO' style='width: 580px;' disabled='disabled'>{0}</select></td><td class='TD_ASS' style='display: none;'><select title='Variant Header' disabled='disabled' class='VariantTypePACBO ReadonlyInput' style='width: 280px;'></select></td><td class='TD_ASS' style='display: none;'><select title='Variants Item' class='VariantTypePAVCBO' style='width: 280px;'></select></td><td style='width: 50px; text-align: right;'><input class='VariantTypeBN EDITBN' style='visibility: visible;' type='button' value='Delete'></td></tr>";
function AddVariantType(code, var_id, Desc1, Desc2) {
    if (code) {
        var vItem = $("#tbl_p2_VariantTypes tbody tr").length - 1;
        if ($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") === pk_val("CONST.AssessorCode")) {
            var Cat = code.substring(0, code.indexOf('#'));
            $("#tbl_p2_VariantTypes tbody tr:last").before(AssessorTRTamplate.replace("{0}", "<option value='" + Cat + "'>" + Desc1 + "</option>").replace("{1}", "<option value='" + code + "'>" + Desc2 + "</option>").replace("{2}", var_id));
            $('.VariantTypePAVCBO').last().removeAttr("required").attr("disabled", "disabled");
        }
        else {
            $("#tbl_p2_VariantTypes tbody tr:last").before(NonAssessorTRTamplate.replace("{0}", "<option value='" + code + "'>" + Desc1 + "</option>").replace("{1}", var_id));
        }
    }
    else {
        var HTML = $("#tbl_p2_VariantTypes tbody tr:eq(" + ($("#tbl_p2_VariantTypes tbody tr").length - 1) + ")").html();
        $(".VariantTypeBN").css({ "visibility": "visible" });
        $("#tbl_p2_VariantTypes").append("<tr class='msTR'>" + HTML + "</tr>");
        PopulateGridVariantsCBO();
        $('.VariantTypeCBO ').last().val("").removeAttr("required");
        $('.VariantTypePACBO').last().val("").removeAttr("required");
        $('.VariantTypePAVCBO').last().val("").removeAttr("required");
        $('.VariantTypePAVCBO option', $("#tbl_p2_VariantTypes tbody tr").last()).each(function () { $(this).remove(); }).attr("disabled", "disabled");
        ShowRequired($(".VariantTypePAVCBO"));
        $('.VariantTypePACBO').not(':last').attr("disabled", "disabled");
        $('.VariantTypePAVCBO').last().attr("disabled", "disabled").removeAttr("required");
        SetupVariantEvents();
    }
}

function VariantTypeCBOChange(self) {
    var UseClass = "";
    if ($(self).hasClass("VariantTypeCBO")) UseClass = ".VariantTypeCBO";
    if ($(self).hasClass("VariantTypePACBO")) UseClass = ".VariantTypePACBO";
    if ($(self).hasClass("VariantTypePAVCBO")) UseClass = ".VariantTypePAVCBO";

    var vLocalValid = true;
    if (UseClass !== ".VariantTypePACBO")
        $("#tbl_p2_VariantTypes tbody tr").not(':last').each(function () {
            if ($(UseClass + " :selected", this).attr("value") === $("option:selected", self).attr("value") && $(UseClass + " option:selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
                $.system_alert('This variant has already been set up.', $(self));
                if ($(UseClass + " option[value='']", $(self).parent()).length !== 0) $(self).val("");
                else { $(self).val($(self).data("orig")); }
                vValid = false;
                return;
            }
        });

    if (!vLocalValid) return;

    var CurValue = $("option:selected",self).attr("value");
    var CurOrig = $(self).data("orig");
    if (CurValue) {

        if (UseClass === ".VariantTypeCBO") $(UseClass + " option[value='']", $(self).parent()).remove();
        if (UseClass === ".VariantTypePAVCBO") {
            $(UseClass + " option[value='']", $(self).parent()).remove();
            $(".VariantTypePACBO option[value='']", $(self).parent()).remove();
        }

        $(self).data("orig", CurValue);
    }

    var LastTR = $("#tbl_p2_VariantTypes tbody tr:eq(" + ($("#tbl_p2_VariantTypes tbody tr").length - 1) + ")");
    if (UseClass === ".VariantTypeCBO") {
        if ($(UseClass + " option:selected", LastTR).attr("value"))
            AddVariantType();
    }
    else if (UseClass === ".VariantTypePAVCBO") {
        if ($(".VariantTypePACBO option:selected", LastTR).attr("value") && $(".VariantTypePAVCBO option:selected", LastTR).attr("value")) {
            AddVariantType();
            ShowRequired($(".VariantTypePAVCBO", LastTR));
        }
    }
    else {
        $('.VariantTypePAVCBO', LastTR).html($("#ctl00_workarea_cbo_p2_VariantTypesPAV").html());
        $('.VariantTypePAVCBO', LastTR).data("var_id", "");
        $('.VariantTypePAVCBO option', LastTR).each(function () {
            if ($(this).attr("value")) {
                var vItem = $(this).attr("value");
                var vCat = vItem.substring(0, vItem.indexOf('#'));
                if (vCat !== CurValue) $(this).remove();
            }
        });
        if ($(self).val()) {
            $(".VariantTypePAVCBO").attr("required", "required");
            $(".VariantTypePAVCBO", $(self).closest("tr")).removeAttr("disabled");
            ShowRequired($(".VariantTypePAVCBO", $(self).closest("tr")));
        }
        else {
            $(".VariantTypePAVCBO").removeAttr("required");
            $(".VariantTypePAVCBO", $(self).closest("tr")).attr("disabled", "disabled");
            SetControlError($(".VariantTypePAVCBO", $(self).closest("tr")), false);
        }
    }

    SetEnabled();
}

function DoRemoveVariantType(self) {
    if ($("#tbl_p2_VariantTypes tbody tr").length === 1) {
        if ($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") !== pk_val("CONST.AssessorCode")) {
            $(".VariantTypeCBO", $(self).closest("tr")).val("").removeAttr("disabled");
        }
        else {
            $(".VariantTypePACBO", $(self).closest("tr")).val("").trigger("change").removeAttr("disabled");
            $(".VariantTypePAVCBO", $(self).closest("tr")).removeAttr("required");
        }
        $(".VariantTypeBN", $(self).closest("tr")).css("visibility", "hidden");
    }
    else
        $(self).closest("tr").remove();
    HasChanges = true;
}

function RemoveVariantType(self, isReset) {
    if (isReset || vInsertMode)
        DoRemoveVariantType(self);
    else
        $.system_confirm("By deleting this variant type, any uses of this variant on a members roles will also be removed on saving of the role.<br/<br/>Continue With Delete?", function () { DoRemoveVariantType(self); });
}

//#endregion

//#region Page 4 Properties

function PopulateProperties() {
    PopulateGridMiscPropCBO(0);

    if ($("#ctl00_workarea_lst_p4_hiddendata").val()) {
        var mvData = $.parseJSON($("#ctl00_workarea_lst_p4_hiddendata").val().replaceAll("`", '"'));
        for (var i = 0; i < mvData.length ; i++)
            AddMiscProp(mvData[i].Activity, mvData[i].Property, mvData[i].Description, mvData[i].Property_type, mvData[i].Required, mvData[i].Pre_Populate, mvData[i].Default, mvData[i].Enabler, mvData[i].NG_ID);
    }

    $('.MiscPropDiv').hide();
}

function SetupPropertyEvents() {
    $(".MiscPropBN").not(".EDITBN").last().click(function () { ShowHideMiscPropPanel(this); }).css("visibility", "hidden");
    if (!vIsReadonly) {
        $(".MiscPropDelBN").last().click(function () { RemoveMiscProp(this, false); }).css("visibility", "hidden");
        $(".MiscPropCBO").last().change(function () { MiscPropChange(this); }).css("width", "500px");
        $(".p4cb3").last().click(function () { ChangePropDefault(this); });
    }
    else
    {
        $(".MiscPropDelBN").last().remove();
    }

    $(".p4cb1,.p4cb2,.p4cb3").css("height", "15px");
}

function ChangePropDefault(self) {
    //var myTR = $(self).closest(".trPropGroup");
    var myTR = $(self).parent().parent().parent().parent().parent().parent().parent();
    var Text = $(".MiscPropCBO :selected", myTR).text();
    var CurValue = $(".MiscPropCBO :selected", myTR).attr("value");
    $(".HierPropCB", $(".tbl_p6_Hier_Prop")).each(function () {
        if ($(this).attr("data-ng_prop_value") === CurValue) {
            $(".label", this.parentElement.parentElement).css("font-weight", $(self).is(":checked") ? "Bold" : "");
        }
    });
}

function PopulateGridMiscPropCBO(row) {
    $('.MiscPropCBO', $("#tbl_p4_MiscProp tbody tr:not('.subTR'):eq(" + (row) + ")")).html($("#ctl00_workarea_cbo_p4_MiscProp").html());
    $('.MiscPropCBO', $("#tbl_p4_MiscProp tbody tr:not('.subTR'):eq(" + (row) + ")")).data("mp_id","");
    $('.MiscPropEnabler', $("#tbl_p4_MiscProp tbody tr:not('.subTR'):eq(" + (row) + ")")).html($("#ctl00_workarea_cbo_p4_MiscProp_Enablers").html());
}

function AutoSetDisableSpecialCases(value, vTR) {
    //vCE_Code vDISC1_Code vDISC2_Code vREFEREE_Code
    //return false;
    if (!value)
        return;

    value = value.replace('#','|');
    if (value === pk_val("CONST.CE_Code") || value === pk_val("CONST.DISC1") || value === pk_val("CONST.DISC2")) {
        $('.p4cb1', vTR).prop("checked", "checked").attr("disabled", "disabled");
        $('.p4cb2', vTR).prop("checked", "checked").attr("disabled", "disabled");
    }
    else {
        $('.p4cb1', vTR).removeAttr("disabled");
        $('.p4cb2', vTR).removeAttr("disabled");
    }

    if (value === pk_val("CONST.CE_Code") || value === pk_val("CONST.DISC1") || value === pk_val("CONST.DISC2") || value === pk_val("CONST.REFEREE")) {
        $('input:radio', vTR).first().prop("checked", "checked");
        $(".p4rb", vTR).attr("disabled", "disabled");
    }
    else if (value.substring(0, 7) !== "ROLPRP|") {
        //$('input:radio', vTR).first().attr("disabled", "disabled").removeProp("checked");
        $(".p4rb", vTR).attr("disabled", "disabled");
        $('.p4cb1', vTR).removeProp("checked").attr("disabled", "disabled");
        $('.p4cb2', vTR).removeProp("checked").attr("disabled", "disabled");
    }
    else
        $(".p4rb", vTR).removeAttr("disabled");

    if (value.substring(0, 7) !== "ROLPRP|" || value === pk_val("CONST.CE_Code") || value === pk_val("CONST.DISC1") || value === pk_val("CONST.DISC2"))
        $(".MiscPropEnabler", vTR).val("").attr("disabled", "disabled");
    else
        $(".MiscPropEnabler", vTR).removeAttr("disabled");

    SetEnabled();
}

function AddMiscProp(activity, value, altdesc, ptype, chk1, chk2, chk3, ENB, MP_ID) {
    if (value) {
        value = activity + "#" + value;

        var vItem = $("#tbl_p4_MiscProp tbody tr").not(".subTR").length - 1;
        var vTR = $("#tbl_p4_MiscProp tbody tr:not('.subTR'):eq(" + vItem + ")");
        // populate cbo (note items after this line need to be there)
        // NG ID,Value selected
        $('.MiscPropCBO', vTR).data("mp_id", MP_ID).val(value);
        MiscPropChange($('.MiscPropCBO', vTR));
        // desc
        $('.MiscPropTXT', vTR).val(altdesc);
        // enabler
        $('.MiscPropEnabler', vTR).val(ENB);

        // check's
        if (chk1 === "True") $('.p4cb1', vTR).attr("checked", "checked"); else $('.p4cb1', vTR).removeAttr("checked");
        if (chk2 === "True") $('.p4cb2', vTR).attr("checked", "checked"); else $('.p4cb2', vTR).removeAttr("checked");
        if (chk3 === "True") $('.p4cb3', vTR).attr("checked", "checked"); else $('.p4cb3', vTR).removeAttr("checked");
        // radio

        vItem += 1;

        value = value.replace("#", "|");
        var IsSpecialCase = (value === pk_val("CONST.CE_Code") || value === pk_val("CONST.DISC1") || value === pk_val("CONST.DISC2") || value === pk_val("CONST.REFEREE"));

        var vUseItem = "00";
        if (vItem > 1) vUseItem = vItem;
        if (ptype === "1" || IsSpecialCase) $('#p4br1_' + vUseItem).prop("checked", "checked");
        else if (ptype === "2") $('#p4br2_' + vUseItem).prop("checked", "checked");
        else  $('#p4br3_' + vUseItem).prop("checked", "checked");

        if (!vIsReadonly)
            AutoSetDisableSpecialCases(value, vTR);
    }
    else {
        var HTML = $("#tbl_p4_MiscProp tbody tr:not('.subTR'):eq(0)").html();
        vPropIDX++;
        // radios
        HTML = HTML.replace("p4br1_00", "p4br1_" + vPropIDX).replace("p4br1_00", "p4br1_" + vPropIDX).replace("p4rl1_00", "p4rl1_" + vPropIDX).replace("p4br_00", "p4br_" + vPropIDX);
        HTML = HTML.replace("p4br2_00", "p4br2_" + vPropIDX).replace("p4br2_00", "p4br2_" + vPropIDX).replace("p4rl2_00", "p4rl2_" + vPropIDX).replace("p4br_00", "p4br_" + vPropIDX);
        HTML = HTML.replace("p4br3_00", "p4br3_" + vPropIDX).replace("p4br3_00", "p4br3_" + vPropIDX).replace("p4rl3_00", "p4rl3_" + vPropIDX).replace("p4br_00", "p4br_" + vPropIDX);
        // change check box names (as they all need to link up etc)
        HTML = HTML.replace("p4cb1_00", "p4cb1_" + vPropIDX).replace("p4cb1_00", "p4cb1_" + vPropIDX).replace("p4ll1_00", "p4ll1_" + vPropIDX);
        HTML = HTML.replace("p4cb2_00", "p4cb2_" + vPropIDX).replace("p4cb2_00", "p4cb2_" + vPropIDX).replace("p4ll2_00", "p4ll2_" + vPropIDX);
        HTML = HTML.replace("p4cb3_00", "p4cb3_" + vPropIDX).replace("p4cb3_00", "p4cb3_" + vPropIDX).replace("p4ll3_00", "p4ll3_" + vPropIDX);
        HTML = HTML.replace("visible", "hidden").replace("visible", "hidden").replace('class="MiscPropDiv">', 'class="MiscPropDiv" style="display: none;">');

        // ensure buttons on new line are not visible
        $(".MiscPropBN").css({ "visibility": "visible" });
        $("#tbl_p4_MiscProp").append("<tr>" + HTML + "</tr>");
        var vItem1 = $("#tbl_p4_MiscProp tbody tr").not(".subTR").length - 1;
        $('.MiscPropCBO', $("#tbl_p4_MiscProp tbody tr:not('.subTR'):eq(" + vItem1 + ")")).data("orig", "");
        PopulateGridMiscPropCBO(vItem1);

        $("input:radio", $("#tbl_p4_MiscProp tbody tr:not('.subTR'):eq(" + vItem1 + ")")).change(CheckReq);

        // and default radio
        if ((vPropIDX - 1) === 1)
            $("#p4br3_00").prop("checked", "checked");
        else
            $("#p4br3_" + (vPropIDX - 1)).prop("checked", "checked");
        SetupPropertyEvents();
    }
}

function MiscPropChange(self) {
    var vLocalValid = true;
    $("#tbl_p4_MiscProp tbody tr").not(".subTR").not(':last').each(function () {
        if ($(".MiscPropCBO :selected", this).val() === $(self).val() && $(".MiscPropCBO :selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
            $.system_alert('This property has already been set up.', $(self));
            if ($(".MiscPropCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else { $(self).val($(self).data("orig")); }
            vValid = false;
            vLocalValid = false;
            return;
        }
    });

    if (!vLocalValid) return;

    var CurValue = $(self).val();
    var CurOrig = $(self).data("orig");
    var DoneDisable = false;
    if (CurValue) {
        $(".MiscPropCBO option[value='']", $(self).parent()).remove();
        $(self).data("orig", CurValue);

        var Cap = "" + $(":selected", self).text();
        if (Cap.indexOf("Magazine : ") === 0 || Cap.indexOf("Sections : ") === 0 || Cap.indexOf("Report : ") === 0)
        {
            $(".p4rb", $(self).parent()).attr("disabled", "disabled"); // disable all radio's
            $($(".p4rb", $(self).parent())[2]).prop("checked", "checked"); // check property (as thats what these are)
            $('.p4cb1', $(self).parent()).removeAttr("checked").attr("disabled", "disabled");// disable required (as irrelevant)
            $('.p4cb2', $(self).parent()).removeAttr("checked").attr("disabled", "disabled");// disable required (as irrelevant)
            $(".MiscPropEnabler", $(self).parent()).val("").attr("disabled", "disabled"); // disabled (as irrelevant)
            DoneDisable = true;
            SetEnabled();
        }
        else
        {
            $(".p4rb", $(self).parent()).removeAttr("disabled");
        }
    }

    var vTR = $(self).parent().parent();
    if ($('.MiscPropCBO option:selected', $("#tbl_p4_MiscProp tbody tr:not('.subTR'):eq(" + ($("#tbl_p4_MiscProp tbody tr").not(".subTR").length - 1) + ")")).attr("value")) {
        AddMiscProp();
        ShowHideMiscPropPanel(self);
    }

    if (CurOrig) {
        $(".HierPropCB", $(".tbl_p6_Hier_Prop")).each(function () {
            if ($(this).attr("data-ng_prop_value") === CurOrig) {
                $(this).attr("data-ng_prop_value", CurValue);
                $(".label", this.parentElement.parentElement).text($(":selected", self).text().replace("Property : ", ""));//.replace("Magazine : ", "")
            }
        });
    }
    else {
        var IDX = 1;
        $(".tbl_p6_Hier_Prop").each(function () {
            AddHierarchyProperties(IDX, CurValue, $(":selected", self).text(), CurOrig);
            IDX++;
        });
    }

    if (!vIsReadonly && !DoneDisable)
        AutoSetDisableSpecialCases(CurValue, vTR);
}

function DoRemoveMiscProp(self) {
    var CurValue = $(".MiscPropCBO option:selected", $(self).parent().parent()).attr("value");
    $(".tbl_p6_Hier_Prop tr").each(function () {
        $("input[data-ng_prop_value=" + CurValue + "]", this).parent().parent().remove();
    });

    if ($("#tbl_p4_MiscProp tbody tr").not(".subTR").length === 1) {
        $(".MiscPropCBO", $(self).parent().parent().parent()).val("");

        // ensure that the Radio names are reset so the template can work
        var HTML = $(self).parent().parent().parent().html();
        if (HTML) {
            HTML = HTML.replace("p4br1_" + vPropIDX, "p4br1_00").replace("p4br1_" + vPropIDX, "p4br1_00").replace("p4rl1_" + vPropIDX, "p4rl1_00").replace("p4br_" + vPropIDX, "p4br_00");
            HTML = HTML.replace("p4br2_" + vPropIDX, "p4br2_00").replace("p4br2_" + vPropIDX, "p4br2_00").replace("p4rl2_" + vPropIDX, "p4rl2_00").replace("p4br_" + vPropIDX, "p4br_00");
            HTML = HTML.replace("p4br3_" + vPropIDX, "p4br3_00").replace("p4br3_" + vPropIDX, "p4br3_00").replace("p4rl3_" + vPropIDX, "p4rl3_00").replace("p4br_" + vPropIDX, "p4br_00");
            // change check box names (as they all need to link up etc)
            HTML = HTML.replace("p4cb1_" + vPropIDX, "p4cb1_00").replace("p4cb1_" + vPropIDX, "p4cb1_00").replace("p4ll1_" + vPropIDX, "p4ll1_00");
            HTML = HTML.replace("p4cb2_" + vPropIDX, "p4cb2_00").replace("p4cb2_" + vPropIDX, "p4cb2_00").replace("p4ll2_" + vPropIDX, "p4ll2_00");
            HTML = HTML.replace("p4cb3_" + vPropIDX, "p4cb3_00").replace("p4cb3_" + vPropIDX, "p4cb3_00").replace("p4ll3_" + vPropIDX, "p4ll3_00");
            $(self).parent().parent().parent().html(HTML);
        }
    }
    else
        $(self).parent().parent().parent().remove();
    HasChanges = true;
}

function RemoveMiscProp(self, FromAll, isReset) {
    if (isReset || FromAll || $("#tbl_p6_Hierarchy tr:not('.subTR'):not(:first):not(:last)").length === 0)
        DoRemoveMiscProp(self);
    else
        $.system_confirm("Removing Properties will also remove any Properties setup against any Hierarchy setup on the Hierarchy page.<br/><br/>Continue With Delete?", function () { DoRemoveMiscProp(self); });
}

function ShowHideMiscPropPanel(self)
{
    if ($(".MiscPropDiv", $(self).parent().parent()).css("display") === "none") {
        $(".MiscPropDiv").hide();
        $(".MiscPropDiv", $(self).parent().parent()).show();
    }
    else
        $(".MiscPropDiv", $(self).parent().parent()).hide();
}

//#endregion

//#region Page 5 Training

function PopulateTraining() {
    PopulateGridTrainingCBO(0);

    if ($("#ctl00_workarea_lst_p5_hiddendata").val()) {
        var mvData = $.parseJSON($("#ctl00_workarea_lst_p5_hiddendata").val().replaceAll("`", '"'));
        for (var i = 0; i < mvData.length ; i++)
            AddTraining(mvData[i].NG_TM_ID, mvData[i].Appointment, mvData[i].Default, mvData[i].NG_TR_ID, mvData[i].Desc);
    }

    SetEnabled();
}

function SetupTrainingEvents() {
    if (!vIsReadonly) {
        $(".TrainingCBO").last().change(function () { TrainingChange(this); });
        $(".TrainingBN").last().click(function () { RemoveTraining(this, false); }).css("visibility", "hidden");
        $(".TrainDef").last().click(function () { ChangeTrainDefault(this); });
    }
    else
    {
        $(".TrainingBN").last().remove();
    }
    $(".TrainingCBO").last().css("width", "300px");
}

function ChangeTrainDefault(self) {
    var myTR = $(self).parent().parent();
    var Text = $(".TrainingCBO :selected", myTR).text();
    var CurValue = $(".TrainingCBO :selected", myTR).val();
    $(".HierTrainCB", $(".tbl_p6_Hier_Train")).each(function () {
        if ($(this).attr("data-ng_trn_value") === CurValue) {
            $(".label", this.parentElement.parentElement).css("font-weight", $(self).is(":checked") ? "Bold" : "");
        }
    });
}

function PopulateGridTrainingCBO(row) {
    $('.TrainingCBO', $("#tbl_p5_Training tr:eq(" + (row + 1) + ")")).html($("#ctl00_workarea_cbo_p5_Training").html());
    $('.TrainingCBO', $("#tbl_p5_Training tr:eq(" + (row + 1) + ")")).data("trn_id");
}

var TrainingTRTemplate = "<tr class='msTR JustAdded'><td><select title='Training' class='TrainingCBO' style='width: 300px;' disabled='disabled'>{0}</select></td><td style='text-align: center;'><input class='TrainApp' style='border: 0px currentColor; visibility: visible; background-color: transparent;' type='checkbox'{1}></td><td style='text-align: center;'><input class='TrainDef' style='border: 0px currentColor; visibility: visible; background-color: transparent;' type='checkbox'{2}></td><td style='width: 50px; text-align: right;'><input class='TrainingBN EDITBN' style='visibility: visible;' type='button' value='Delete'></td></tr>";
function AddTraining(value, chk1, chk2, TRN_ID, Desc1) {
    if (value) {
        $("#tbl_p5_Training tbody tr:last").before(TrainingTRTemplate.replace("{0}", "<option value='" + value + "'>" + Desc1 + "</option>").replace("{1}", chk1 === "True" ? " checked='checked'" : "").replace("{2}", chk2 === "True" ? " checked='checked'" : ""));
        $(".JustAdded .TrainingBN").click(function () { RemoveTraining(this, false); });
        $(".JustAdded .TrainingCBO").data("trn_id", TRN_ID).closest(".msTR").removeClass("JustAdded");
    }
    else {
        var HTML = $("#tbl_p5_Training tr:eq(" + ($("#tbl_p5_Training tr").length - 1) + ")").html();
        $(".TrainingBN").css({ "visibility": "visible" });
        $("#tbl_p5_Training").append("<tr class='msTR'>" + HTML + "</tr>");

        var vItem2 = $("#tbl_p5_Training tr").length - 1;
        PopulateGridTrainingCBO(vItem2 - 1);
        $('.TrainApp', $("#tbl_p5_Training tr:eq(" + vItem2 + ")")).removeAttr("checked");
        $('.TrainDef', $("#tbl_p5_Training tr:eq(" + vItem2 + ")")).removeAttr("checked");
        $('.TrainingCBO', $("#tbl_p5_Training tr:eq(" + vItem2 + ")")).data("orig","").data("trn_id","");
        $('.TrainApp', $("#tbl_p5_Training tr:eq(" + vItem2 + ")")).css({ "visibility": "hidden" });
        $('.TrainDef', $("#tbl_p5_Training tr:eq(" + vItem2 + ")")).css({ "visibility": "hidden" });
        SetupTrainingEvents();
    }
}

function TrainingChange(self) {
    var vLocalValid = true;
    $("#tbl_p5_Training tr:not(:first)").not(':last').each(function () {
        if ($(":selected", this).val() === $(self).val() && $(":selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
            $.system_alert('This training has already been set up.', $(self));
            if ($(".TrainingCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else $(self).val($(self).data("orig"));
            vLocalValid = false;
            return;
        }
    });

    if (!vLocalValid) return;

    var CurValue = $(self).val();
    var CurOrig = $(self).data("orig");
    if (CurValue) {
        $(".TrainingCBO option[value='']", $(self).parent()).remove();
        $(self).data("orig", CurValue); // so if we select an existing item, we put back the last (correct) value
    }

    if ($('.TrainingCBO', $("#tbl_p5_Training tr:eq(" + ($("#tbl_p5_Training tr").length - 1) + ")")).val()) {
        $('.TrainApp, .TrainDef', $("#tbl_p5_Training tr:eq(" + ($("#tbl_p5_Training tr").length - 1) + ")")).css({ "visibility": "visible" });
        AddTraining();
    }

    if (CurOrig) {
        $(".HierTrainCB", $(".tbl_p6_Hier_Train")).each(function () {
            if ($(this).attr("data-ng_trn_value") === CurOrig) {
                $(this).attr("data-ng_trn_value", CurValue);
                $(".label", this.parentElement.parentElement).text($(":selected", self).text());
            }
        });
    }
    else {
        var IDX = 1;
        $(".tbl_p6_Hier_Train").each(function () {
            AddHierarchyTraining(IDX, CurValue, $(":selected", self).text());
            IDX++;
        });
    }
}

function DoRemoveTraining(self) {
    var CurValue = $(".TrainingCBO", $(self).parent().parent()).val();
    $(".tbl_p6_Hier_Train tr").each(function () {
        $("input[data-ng_trn_value=" + CurValue + "]", this).parent().parent().remove();
    });

    if ($("#tbl_p5_Training tr").not(":first").length === 1)
        $(".TrainingCBO", $(self).parent().parent()).val("");
    else
        $(self).parent().parent().remove();
    HasChanges = true;
}

function RemoveTraining(self, FromAll, isReset) {
    if (isReset || FromAll || $("#tbl_p6_Hierarchy tr:not('.subTR'):not(:first):not(:last)").length === 0)
        DoRemoveTraining(self);
    else
        $.system_confirm("Removing training will also remove any training setup against any Hierarchy setup on the Hierarchy page.<br/><br/>Continue With Delete?", function () { DoRemoveTraining(self); });
}

//#endregion

//#region Page 6 Hierarchy

function PopulateHierarchy() {
    PopulateGridHierarchyCBO(1);
    AddHierarchyProperties(1);
    AddHierarchyTraining(1);

    if ($("#ctl00_workarea_lst_p6_hiddendata").val()) {
        var mvData = $.parseJSON($("#ctl00_workarea_lst_p6_hiddendata").val().replaceAll("¬", '"'));
        for (var i = 0; i < mvData.length ; i++)
            AddHierarchy(mvData[i].NG_ID, mvData[i].Group, mvData[i].Desc, mvData[i].Country_ON, mvData[i].PropTBL, mvData[i].TrainTBL);
    }

    $('.HierarchyDiv').hide();
}

function SetupHierarchyEvents() {
    //TSA-886: Always enable Details button click; in View mode, the details are read-only anyway.
    $(".HierarchyBN").not(".HierarchyDelBN").last().click(function () { ShowHideHierarchyPanel(this); }).css("visibility", "hidden");
    if (!vIsReadonly) {
        $(".HierarchyDelBN").last().click(function () { RemoveHierarchy(this); }).css("visibility", "hidden");
        $(".HierarchyCBO").last().change(function () { HierarchyChange(this); });
        $(".CountryCBO").last().change(function () { HierarchyChange(this); }).attr("required","required");
    }
    else {
        $(".HierarchyDelBN").last().remove();
        $(".HierarchyBN").not(".HierarchyDelBN").last().css("visibility", "hidden");
    }
    $(".TickIMG", $("#tbl_p6_Hierarchy")).last().css({ "visibility": "hidden", "margin-left": "20px" }).click(function () { return false; });
    $(".HierarchyCBO").last().css("width", "230px");
    $(".CountryCBO").last().css("width", "415px");
}

function AddHierarchyProperties(row, pItem, pDesc) {
    var idx = 1;
    HierPropIDX++;
    var PropTBL = $(".tbl_p6_Hier_Prop", $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + row + ")"));

    if (pItem) { // for adhoc adding of items on page 6
        var newCB_ID = "p6Pr" + HierPropIDX + "_" + idx;
        var newLL_ID = "p6Pl" + HierPropIDX + "_" + idx;
        var UseText = pDesc;//.replace("Property : ", "").replace("Magazine : ", "");
        PropTBL.append("<tr class='subTR'>" +
                       "<td><input type='checkbox' class='HierPropCB' id='" + newCB_ID + "' data-ng_prop_value='" + pItem + "'/></td>" +
                       "<td><label class='label propcb labelPoint' style='font-size:0.9em;' id='" + newLL_ID + "' >" + UseText + "</label></td>" +
                       "<td><input type='text' class='HierPropTXT'/></td></tr>");

        $(".HierPropCB", PropTBL).last().change(function () { CheckRowModified($(this).parents(".HierarchyDiv")); });
        $(".HierPropTXT", PropTBL).last().keyup(function () { CheckRowModified($(this).parents(".HierarchyDiv")); }).css("width", "180px");

        $("#" + newLL_ID).attr("for", newCB_ID);
    }
    else { // loading page (loop all items)
        $(".subTR", PropTBL).remove();
        $("#tbl_p4_MiscProp tbody tr:not('.subTR')").each(function () {
            if ($('.MiscPropCBO :selected', this).attr("value")) {
                var newCB_ID = "p6Pr" + HierPropIDX + "_" + idx;
                var newLL_ID = "p6Pl" + HierPropIDX + "_" + idx;
                var UseText = $('.MiscPropCBO :selected', this).text();//.replace("Property : ", "").replace("Magazine : ", "");
                PropTBL.append("<tr class='subTR' >" +
                                "<td><input type='checkbox' class='HierPropCB' id='" + newCB_ID + "' data-ng_prop_value='" + $('.MiscPropCBO :selected', this).val() + "' data-pcb_id='" + $('.MiscPropCBO', this).data("mp_id") + "'/></td>" +
                                "<td><label class='label labelPoint' id='" + newLL_ID + "' style='font-size:0.9em;' >" + UseText + "</label></td>" +
                                "<td><input type='text' class='HierPropTXT' style='width:180px;' /></td>" +
                                "</tr>");
                $("#" + newLL_ID).attr("for", newCB_ID).css("font-weight", $(".p4cb3", this).is(":checked") ? "Bold" : "");
                HasChanges = true;
            }

            idx++;
        });
    }
}

function AddHierarchyTraining(row, pItem, pDesc) {
    var idx = 1;
    HierTrainIDX++;
    var TrainTBL = $(".tbl_p6_Hier_Train", $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + row + ")"));
    // adding Adhoc to grid

    if (pItem) { // for adhoc adding of items on page 5
        var newCB_ID = "p6Tr" + HierTrainIDX + "_" + idx;
        var newLL_ID = "p6Tl" + HierTrainIDX + "_" + idx;
        TrainTBL.append("<tr class='subTR' >" +
                        "<td><input type='checkbox' class='HierTrainCB' id='" + newCB_ID + "' data-ng_trn_value='" + pItem + "'/></td>" +
                        "<td style='width:300px;'><label class='label labelPoint' style='font-size:0.9em;'  id='" + newLL_ID + "' >" + pDesc + "</label></td>" +
                        "</tr>");
        $("#" + newLL_ID).attr("for", newCB_ID);
    }
    else { // loading page (loop all items)
        $(".subTR", TrainTBL).remove();
        $("#tbl_p5_Training tr:not('.subTR'):not(:first):not(:last)").each(function () {
            if ($('.TrainingCBO :selected', this).text()) {
                var newCB_ID = "p6Tr" + HierTrainIDX + "_" + idx;
                var newLL_ID = "p6Tl" + HierTrainIDX + "_" + idx;
                var UseText = $('.TrainingCBO :selected', this).text();
                TrainTBL.append("<tr class='subTR' >" +
                                "<td><input type='checkbox' class='HierTrainCB'  id='" + newCB_ID + "' data-ng_trn_value='" + $('.TrainingCBO :selected', this).val() + "' data-tcb_id='" + $('.TrainingCBO', this).data("trn_id") + "'/></td>" +
                                "<td style='width:300px;'><label class='label labelPoint' id='" + newLL_ID + "' style='font-size:0.9em;'>" + UseText + "</label></td>" +
                                "</tr>");
                $("#" + newLL_ID).attr("for", newCB_ID).css("font-weight", $(".TrainDef", this).is(":checked") ? "Bold" : "");
            }

            idx++;
        });
    }
}

function PopulateGridHierarchyCBO(row) {
    $('.HierarchyCBO', $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + (row) + ")")).html($("#ctl00_workarea_cbo_p6_Hierarchy").html());
    $('.HierarchyCBO', $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + (row) + ")")).data("hier_id");
    $('.HierarchyBN,.TickIMG', $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + (row) + ")")).css({ "visibility": "hidden" });
    $('.CountryCBO', $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + (row) + ")")).html($("#ctl00_workarea_cbo_p6_Country").html());
}

function AddHierarchy(HIER_ID, org_group, alt_desc, ON, Props, Training) {
    var vTR;
    var PopulateValues = function () {
        if (org_group) $('.HierarchyCBO', vTR).val(org_group).data("db", org_group);
        if (ON) $('.CountryCBO', vTR).val(ON).data("db", ON);
        if (org_group || ON) HierarchyChange($('.HierarchyCBO', vTR), true);// populate cbo (note items after this line need to be there)
        if (alt_desc) $('.HierarchyTXT', vTR).val(alt_desc);

        if (Props) {
            // add property grid data
            var xRows = Props.split("^"), IDX, MAX;
            for (IDX = 0, MAX = xRows.length; IDX < MAX; IDX += 1) {
                xItems = xRows[IDX].split("`");
                var vCB = $(".HierPropCB[data-pcb_id='" + xItems[1] + "']", vTR); // the checkbox
                if (!xItems[1]) vCB = $(vCB[IDX]);
                if (xItems[4] === "Y") vCB.prop("checked", "checked");
                else vCB.removeAttr("checked");
                vCB.attr("data-pcb_id", xItems[1]).attr("data-ng_prop_value", xItems[2]).parent().data("xref_id", xItems[0]); // primary key
                $(".HierPropTXT", vCB.parent().parent()).val(xItems[3]); // alt desc
            }
        }

        if (Training) {
            // add training grid data
            xRows = Training.split("^");
            MAX = xRows.length;
            for (IDX = 0; IDX < MAX; IDX += 1) {
                xItems = xRows[IDX].split("`");
                var vCB1 = $(".HierTrainCB[data-tcb_id='" + xItems[1] + "']", vTR); // the checkbox
                if (!xItems[1]) vCB1 = $(vCB1[IDX]);
                if (xItems[3] === "Y") vCB1.attr("checked", "checked");
                else vCB1.removeAttr("checked");
                vCB1.attr("data-tcb_id", xItems[1]).attr("data-ng_trn_value", xItems[2]).parent().data("xref_id", xItems[0]); // primary key
            }
        }
    };

    if (HIER_ID) {
        vTR = $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + ($("#tbl_p6_Hierarchy tr").not(".subTR").length - 1) + ")");
        // NG ID
        $('.HierarchyCBO', vTR).data("hier_id", HIER_ID);
        //Value selected
        PopulateValues();
        ShowRequired($('.CountryCBO', vTR));
    }
    else {
        vTR = $("#tbl_p6_Hierarchy tr:not('.subTR')").last();
        var HTML = $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(1)").html().replace(/p6Pr1/g, "p6Pr" + vHierIDX).replace(/p6Tr1/g, "p6Tr" + vHierIDX);
        vHierIDX++;
        // ensure buttons on new line are not visible
        $(".HierarchyBN").css({ "visibility": "visible" });
        $("#tbl_p6_Hierarchy").append("<tr>" + HTML + "</tr>");
        var vItem = $("#tbl_p6_Hierarchy tr:not(:first):not('.subTR')").length;

        // clear grids and populate from scratch from other pages current data
        $('.tbl_p6_Hier_Train tr:not(:first)', $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + (vItem) + ")")).remove();
        $('.tbl_p6_Hier_Prop tr:not(:first)', $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + (vItem) + ")")).remove();
        AddHierarchyTraining(vItem);
        AddHierarchyProperties(vItem);
        PopulateGridHierarchyCBO(vItem);

        $('.CountryCBO', vTR).change(CheckReq);
        $("input[type=checkbox]", vTR).on("change", function (event) { CheckRowModified($(this).parents(".HierarchyDiv")); });
        $("input[type=text]", vTR).on("keyup", function (event) { CheckRowModified($(this).parents(".HierarchyDiv")); });
        $(".CountryCBO, .HierarchyCBO ", $("#tbl_p6_Hierarchy tr:not('.subTR')").last()).data("orig", "");
        SetupHierarchyEvents();
        if (vInsertMode) PopulateValues(); // only check on insert (copy role basiclaly)
    }
}

function HierarchyChange(self, DontDoDefault) {
    var myTR = ($(self).hasClass("HierarchyCBO") ? $(self).parent() : $(self).parent().parent().parent().parent().parent().parent().parent().parent());
    var HierCBO = $(".HierarchyCBO", myTR);
    var CountryCBO = $(".CountryCBO", myTR);

    if (HierCBO.data("orig") === HierCBO.data("db") && HierCBO.data("db") && CountryCBO.data("orig") === CountryCBO.data("db") && HierExists(myTR)) {
        $.system_confirm("This Entity currently has members attached at this level, by changing it you will be removing access for anyone linked at this level. <br/><br/>Continue Anyway?",
            function () { DoHierarchyChange(self, DontDoDefault); $(HierCntItem).css({ "color": "red" }); },
            function () { $(self).val($(self).data("orig")); });
        return;
    }
    DoHierarchyChange(self, DontDoDefault);
}

function DoHierarchyChange(self, DontDoDefault) {
    var myTR = ($(self).hasClass("HierarchyCBO") ? $(self).parent() : $(self).parent().parent().parent().parent().parent().parent().parent().parent());
    var HierCBO = $(".HierarchyCBO", myTR);
    var CountryCBO = $(".CountryCBO", myTR);
    $(".CountryTXT", myTR).val($(":selected", CountryCBO).attr("value") ? $(":selected", CountryCBO).text() : "");
    var DoExit = false;
    if (!DontDoDefault) {
        $(".HierarchyCBO", myTR).data("self", "Y"); // mark row as self
        $("#tbl_p6_Hierarchy tr:not(:first)").not(".subTR").not(':last').each(function () {
            var ItemHierCBO = $(".HierarchyCBO", $(this)); $("tr:not(.subTR)", myTR.parent().parent().parent());

            if ($(".HierarchyCBO", $("#tbl_p6_Hierarchy tr:not(:first)").not(".subTR").not(':last')[$(this).index() - 1]).data("self") !== "Y") {// not self
                if (($(":selected", CountryCBO).val() ||  (HierCBO.val() === "ORG" || HierCBO.val() === "ORST")) && $(":selected", ItemHierCBO).val() === $(":selected", HierCBO).val() && $(":selected", $(".CountryCBO", $(this))).val() === (HierCBO.val() === "ORG" || HierCBO.val() === "ORST" ? "-1" : $(":selected", CountryCBO).val())) {
                    $.system_alert($(":selected", ItemHierCBO).val() !== "ORG" && $(":selected", ItemHierCBO).val() !== "ORST"  ? 'This hierarchy item and country combination<br/>has already been set up.' : 'This hierarchy item has already been set up.');

                    if ($(self).hasClass("HierarchyCBO")) {
                        if ($(".HierarchyCBO option[value='']", myTR).length !== 0) { HierCBO.val(""); }
                        else { HierCBO.val(HierCBO.data("orig")); }
                    }
                    else CountryCBO.val(CountryCBO.data("orig"));
                    DoExit = true;
                    return;
                }
            }
        });
        $(".HierarchyCBO", myTR).data("self",""); // remove mark as self
        if (DoExit) return;
    }

    if (HierCBO.val() === "ORG" || HierCBO.val() === "ORST") {
        $(".divCountry", myTR).css("display", "none");
        CountryCBO.val("-1");
    }
    else
        $(".divCountry", myTR).css("display", "");

    if (HierCBO.val()) {
        // remove blank line from CBO
        $(".HierarchyCBO option[value='']", myTR).remove();
        // set orig (future change checks)
        HierCBO.data("orig", HierCBO.val());
    }
    if (CountryCBO.val()) {
        // set orig (future change checks)
        CountryCBO.data("orig", CountryCBO.val());
    }
    if ($('.HierarchyCBO', $("#tbl_p6_Hierarchy tr:not('.subTR'):eq(" + ($("#tbl_p6_Hierarchy tr").not(".subTR").length - 1) + ")")).val()) {
        AddHierarchy();
        ShowHideHierarchyPanel(HierCBO);
    }

    // add default flag on 'new' picked items only
    if (!DontDoDefault) {
        // training
        myTR.Selector = "";
        $(".HierTrainCB", myTR).each(function () {
            if (GetTrainingDefault($(this).attr("data-ng_trn_value")))
                $(this).attr("checked", "checked");
        });
        // Properties
        myTR.Selector = "";
        $(".HierPropCB", myTR).each(function () {
            if (GetMiscPropDefault($(this).attr("data-ng_prop_value")))
                $(this).attr("checked", "checked");
        });

        if ($("input[type=checkbox]", myTR).first()) $("input[type=checkbox]", myTR).first().trigger("change");
    }
}

function IsBlank(value) { return !value || value === "0" || value === 0; }

function DoRemoveHierarchy(self) {
    if ($("#tbl_p6_Hierarchy tr:not(:first):not(:last)").not(".subTR").length === 1)
        $(".HierarchyCBO", $(self).parent().parent().parent()).val("");
    else
        $(self).parent().parent().parent().remove();
}

var HierCntItem = "";
function HierExists(self) {
    var vHierItem = $(".HierarchyCBO", self).data("db");
    var vCountry = $(".CountryCBO", self).data("db");
    if (IsBlank(vHierItem) || IsBlank(vCountry)) return false;
    if (vHierItem === "ORG" || vHierItem === "ORST") HierCntItem = "#txt_stat_active_" + vHierItem + "_All";
    else HierCntItem = "#txt_stat_active_" + vHierItem + "_" + (vCountry === "-1" ? "All" : vCountry);
    return !IsBlank($(HierCntItem).text());
}

function RemoveHierarchy(self, isReset) {
    //ORG,CNTR,REG,CNTY,DIST,SGRP,ORST,CNST,RGST,SGST,CTST,DTST
    if (isReset || !HierExists($(self).parent().parent()))
        DoRemoveHierarchy(self);
    else {
        $.system_confirm("This Entity currently has members attached at this level, by removing it you will be removing access for anyone linked at this level. <br/><br/>Continue Anyway?",
            function () { DoRemoveHierarchy(self); $(HierCntItem).css({ "color": "red", "border-color": "red" }); HasChanges = true; } );
    }
}

function ShowHideHierarchyPanel(self) {
    if ($(".HierarchyDiv", $(self).parent().parent()).css("display") === "none") {
        $(".HierarchyDiv").hide();
        $(".HierarchyDiv", $(self).parent().parent()).show();
    }
    else
        $(".HierarchyDiv", $(self).parent().parent()).hide();
}

function GetTrainingDefault(Training_Value) {
    var FoundValue;
    $(".TrainingCBO", $("#tbl_p5_Training")).each(function () {
        if ($(this).val() === Training_Value) {
            if ($(".TrainDef", $(this).parent().parent()).is(":checked"))
                FoundValue = 'checked';
            return;
        }
    });

    return FoundValue;
}

function GetMiscPropDefault(MiscProp_Value) {
    var FoundValue;
    $(".MiscPropCBO", $("#tbl_p4_MiscProp")).each(function () {
        if ($("option:selected",this).attr("value") === MiscProp_Value) {
            if ($(".p4cb3", $(this).parent().parent()).is(":checked"))
                FoundValue = 'checked';
            return;
        }
    });

    return FoundValue;
}

function CheckRowModified(self) {
    if ($(".HierarchyCBO", self.parentElement).val() === "") {
        $(".TickIMG", $(self).parent()).css({ "visibility": "hidden" });
        return;
    }
    // check text first (simple)
    var Modified = false;
    if ($(".HierarchyTXT", self).val())
        Modified = true;

    // now text of items (simple too) - simple first and most likely to change so saves process power too
    if (!Modified) $(".HierPropTXT", self).each(function () {
        if ($(this).val())
            Modified = true;
    });
    // now first check boxes

    var vDisc1_obj;
    var vDisc2_obj;
    $(".HierPropCB", self).each(function () {
        if ($(this).is(":checked") && $(this).attr("data-ng_prop_value").replace('#', '|') === pk_val("CONST.DISC1")) { vDisc1_obj = $(this).attr("id"); }
        if ($(this).is(":checked") && $(this).attr("data-ng_prop_value").replace('#', '|') === pk_val("CONST.DISC2")) { vDisc2_obj = $(this).attr("id"); }
    });
    if (vDisc1_obj && vDisc2_obj)
        $.system_alert("Please select only one disclosure type per hierarchy item.", $("#" + vDisc1_obj), function () {
            $("#" + vDisc1_obj).removeAttr("checked");
            $("#" + vDisc2_obj).removeAttr("checked").trigger("change");
        });

    if (!Modified) {
        $(".HierPropCB", self).each(function () {
            var CHK = ($(this).is(":checked") ? "checked" : undefined);
            if (GetMiscPropDefault($(this).attr("data-ng_prop_value")) !== CHK)
                Modified = true;
        });
    }

    if (!Modified) {
        $(".HierTrainCB", self).each(function () {
            var CHK = ($(this).is(":checked") ? "checked" : undefined);
            if (GetTrainingDefault($(this).attr("data-ng_trn_value")) !== CHK)
                Modified = true;
        });
    }

    $(".TickIMG", $(self).parent()).css({ "visibility": Modified ? "visible" : "hidden" });
}

function CheckModified() {
    $(".HierarchyDiv", $("#mpage6")).not(":last").each(function () { CheckRowModified(this); });
}

//#endregion

//#region Page 7 CRUD

function PopulateAllAccess() {
    $.system_confirm("Make All Items Checked On?", function () {
        $(".p7full").each(function () { $(this).removeProp('checked').trigger("click"); });
    });
}

function FullCBClick() {
    if ($(this).is(":checked"))
        $('.p7cb', $(this).parent().parent()).prop('checked', 'checked');
    else
        $('.p7cb', $(this).parent().parent()).removeAttr('checked');

    // ensure non visible items dont get checked
    $('.p7cb').filter(function () {
        return ($(this).css('visibility') === 'hidden' || $(this).css('display') === 'none');
    }).removeAttr('checked');
}

function ItemCBClick() {
    if (!$(this).is(":checked"))
        $('.p7full', $(this).closest("tr")).removeAttr('checked');
    else {
        var cnt = 0;
        $('.p7cb', $(this).closest("tr")).each(function () { if ($(this).is(":checked")) cnt++; });
        if (cnt === $('.p7cb', $(this).closest("tr")).size())
            $('.p7full', $(this).closest("tr")).prop('checked', 'checked');
    }
}

//#endregion

function ClientSave() {
    // check we have internet, and exit if we dont.
    if (!SaveFormCheck("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnSave4,#ctl00_footer_bnSave5,#ctl00_footer_bnSave6,#ctl00_footer_bnSave7"))
        return false;

    //Page 1
    $("#ctl00_workarea_h_cb_p1_parentrole").val(
        ($("#ctl00_workarea_cb_p1_parentrole").is(":checked") ? "Y" : "N") +
        ($("#ctl00_workarea_cb_p1_disable_insert").is(":checked") ? "Y" : "N") +
        ($("#ctl00_workarea_cb_p1_disable_search").is(":checked") ? "Y" : "N") +
        ($("#ctl00_workarea_cb_p1_disabled").is(":checked") ? "Y" : "N")
        );

    // page 2   - Variant Types
    var vP2Data = "";
    // if not loaded get from original data
    var UseClass = ".VariantTypeCBO";
    if ($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value") === pk_val("CONST.AssessorCode")) UseClass = ".VariantTypePAVCBO";

    $("#tbl_p2_VariantTypes " + UseClass).each(function () {
        if ($(this).val()) {
            if (vP2Data) vP2Data += "¬";
            vP2Data += $(this).data("var_id") + "~" + $(this).val();
        }
    });
    $("#ctl00_workarea_lst_p2_hiddendata").val(vP2Data);

    // page 3 - Grades
    var vP3Data = "";
    $("#tbl_p3_MemberGrades .p3CB").each(function () {
        if (vP3Data) vP3Data += "¬";
        vP3Data += $(this).data("ng_grade") + "~" + ($(this).is(":checked") ? "Y" : "");

    });
    $("#ctl00_workarea_lst_p3_hiddendata").val(vP3Data);

    // page 4 - Properties
    var vP4ata = "";
    var idx = 0;
    $("#tbl_p4_MiscProp .MiscPropCBO").each(function () {
        if ($("option:selected", this).attr("value")) {
            if (vP4ata) vP4ata += "¬";
            vP4ata += (!$(this).data("mp_id") ? "" : $(this).data("mp_id")) + "~" + $(this).val();// + "~~~~~";

            if ($(".MiscPropTXT", this.parentElement).val())
                vP4ata += "~" + $(".MiscPropTXT", this.parentElement).val().RemoveUnwanted();
            else
                vP4ata += "~" + $(".MiscPropCBO option:selected", this.parentElement).text();

            vP4ata += "~";
            idx = 0;
            $(".p4rb", this.parentElement).each(function () { idx++; if ($(this).is(":checked")) vP4ata += idx; });
            vP4ata += "~" + ($(".p4cb1", this.parentElement).is(":checked") ? "Y" : "") + "~" + ($(".p4cb2", this.parentElement).is(":checked") ? "Y" : "") + "~" + ($(".p4cb3", this.parentElement).is(":checked") ? "Y" : "");
            vP4ata += "~" + $(".MiscPropEnabler option:selected", this.parentElement).attr("value");
        }
    });
    $("#ctl00_workarea_lst_p4_hiddendata").val(vP4ata);

    // page 5 - Training
    var vP5Data = "";
    $("#tbl_p5_Training .TrainingCBO").each(function () {
        if ($(this).val()) {
            if (vP5Data) vP5Data += "¬";
            vP5Data += (!$(this).data("trn_id") ? "" : $(this).data("trn_id")) + "~" + $(this).val() + "~" + ($(".TrainApp", $(this).parent().parent()).is(":checked") ? "Y" : "") + "~" + ($(".TrainDef", $(this).parent().parent()).is(":checked") ? "Y" : "");
        }
    });
    $("#ctl00_workarea_lst_p5_hiddendata").val(vP5Data);

    vP5Data = "";
    $(".TRNDF").each(function () {
        if (vP5Data) vP5Data += "¬";
        vP5Data += (!$(this).data("rtd_id") ? "-1" : $(this).data("rtd_id")) + "~" + $(this).attr("ID").replace("cb_p5_", "") + "~" + ($(this).is(":checked") ? "Y" : "");
    });
    $("#ctl00_workarea_lst_p5_hiddendefaults").val(vP5Data);

    // page 6 - Hierarchy
    var vP6Data = "";
    var tblIDX = 1;
    $("#tbl_p6_Hierarchy .HierarchyCBO").each(function () {
        if ($(this).val()) {
            if (vP6Data) vP6Data += "¬";
            vP6Data += (!$(this).data("hier_id") ? "" : $(this).data("hier_id")) + "~" + $(this).val() + "~" + $(".HierarchyTXT", this.parentElement).val() + "~" + $(".CountryCBO", this.parentElement).val() + "~";

            $(".tbl_p6_Hier_Prop tr", this.parentElement).each(function () {
                var vCB = $(".HierPropCB", this);
                vP6Data += (vCB.parent().data("xref_id") ? vCB.parent().data("xref_id") : "") + "`"; // RHP Record ID
                if (vCB.attr("data-pcb_id")) vP6Data += vCB.attr("data-pcb_id") + "`"; else vP6Data += "`"; // Selected Req ID
                vP6Data += vCB.attr("data-ng_prop_value") + "`"; // Selected Req Value
                if (vCB.is(":checked")) vP6Data += "Y`"; else vP6Data += "`"; // check value
                vP6Data += $(".HierPropTXT", this).val().RemoveUnwanted() + "^"; // Custom TXT
            });

            vP6Data += "~";

            $(".tbl_p6_Hier_Train tr", this.parentElement).each(function () {
                var vCB = $(".HierTrainCB", this);
                vP6Data += (vCB.parent().data("xref_id") ? vCB.parent().data("xref_id") : "") + "`"; // Record ID
                if (vCB.attr("data-tcb_id")) vP6Data += vCB.attr("data-tcb_id") + "`"; else vP6Data += "`";// Selected Training Module ID
                vP6Data += vCB.attr("data-ng_trn_value") + "`"; // Selected Training Value
                if (vCB.is(":checked")) vP6Data += "Y^"; else vP6Data += "^"; // check Value
            });
        }
    });
    $("#ctl00_workarea_lst_p6_hiddendata").val(vP6Data);

    // page 7 - Access
    var vP7Data = "";
    $("#tbl_p7_PortalAccess .p7td").each(function () {
        if (vP7Data) vP7Data += "¬";
        vP7Data += $(this).data("ng_crud") + "~";
        $('.p7cb', $(this).parent()).each(function () {
            if ($(this).is(":checked")) vP7Data += $(this).attr("id").replace("p7_cb_", "")[0];
        });
    });
    $("#ctl00_workarea_lst_p7_hiddendata").val(vP7Data);

    // CBO Viewstate Fix
    $("#ctl00_workarea_h_cbo_p1_roleclass").val($("#ctl00_workarea_cbo_p1_roleclass option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_lmrole").val($("#ctl00_workarea_cbo_p1_lmrole option:selected").attr("value"));

    return true;
}