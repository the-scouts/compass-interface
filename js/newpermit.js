
$(document).ready(FormReady);

function FormReady() {
    try {
        $.FocusControl("#ctl00_workarea_cbo_p1_Activity", false, 1000);

        if ($("#ctl00_workarea_txt_p1_assdate").attr("readonly") === "readonly")
            $("#bn_p1_assdate").css("display", "none");

        if ($("#ctl00_workarea_txt_p1_membername").val()) {            
            $("#ctl00_workarea_txt_p1_assnumber,#bn_p1_assnumber,#trAssessorName").css("display", "none");
            $("#ctl00_workarea_txt_p1_membername").show();
            $("#ll_p1_assname").text("Assessor Name");
        }

        if (!pk_val("Page.IsReadonly"))
            $("#ctl00_workarea_txt_p1_granteddate").change(function () {
                if (!$("#ctl00_workarea_txt_p1_granteddate").val())
                {
                    $("#ctl00_workarea_txt_p1_expiry").attr("readonly", "readonly");
                    $("#bn_p1_expiry").hide();
                }
                else
                {
                    $("#ctl00_workarea_txt_p1_expiry").removeAttr("readonly");
                    $("#bn_p1_expiry").show();
                }
                SetEnabled();
            });

        if (!$("#ctl00_workarea_txt_p1_membername").val()) {
            $("#ctl00_workarea_txt_p1_membername").css("display", "none");
            $("#CN_REQ").css("display", "");
            $.FocusControl("#ctl00_workarea_txt_p1_assnumber", false, 1000);
        }
        else {
            $("#ctl00_workarea_txt_p1_assnumber, #CN_REQ,#bn_p1_assnumber").css("display", "none");
            $.FocusControl("#ctl00_workarea_cbo_p1_Activity", false, 1000);
        }

        if (!pk_val("Page.IsReadonly") && !pk_val("Page.RECData")) {
            $("#ctl00_workarea_cbo_p1_Activity").change(function () { PopulateCategories(); $("#ctl00_workarea_cbo_p1_Category").trigger('change'); });
            $("#ctl00_workarea_cbo_p1_Category").change(PopulateCategoryTypes);
        }

        $("#txt_p1_reason").val($("#ctl00_head_h_p1_RejectReason").val());
        if ($("#ctl00_head_h_p1_AddedInError").val() === "Y") $("#cb_p1_inerror").prop("checked", "checked");
        if ($("#ctl00_head_h_p1_InformHolder").val() === "Y") $("#cb_p1_inform").prop("checked", "checked");

        if (pk_val("Page.IsReadonly")) {
            MakePageReadOnly();
            if (!$("#ctl00_workarea_txt_p1_assnumber").val() && $("#ctl00_workarea_txt_p1_assname").val())
                $("#ctl00_workarea_txt_p1_assnumber").parent().parent().remove();

            if (!$("#ctl00_workarea_txt_p1_assname").val() && $("#ctl00_workarea_txt_p1_assnumber").val())
                $("#ctl00_workarea_txt_p1_assname").parent().parent().remove();
        }
        else
        {
            if (pk_val("Page.IsUnder18"))
                $("#ctl00_workarea_txt_p1_expiry").blur(function () { AddExpiry_DateFilter(); Date_TextBox_Blur(this, 'Only future dates (up to 5 years in the future and not beyond the member&quot;s 18th birthday) are allowed for the expiry date'); });
            else
                $("#ctl00_workarea_txt_p1_expiry").blur(function () { AddExpiry_DateFilter(); Date_TextBox_Blur(this, 'Only future dates (up to 5 years in the future) are allowed for the expiry date'); });

            AddEvents();
        }
        
        $("#ctl00_workarea_txt_p1_restrictions").autosize(10);
        $("#ctl00_workarea_txt_p1_comprestrictions").autosize(10);
        $("#ctl00_workarea_txt_p1_tsarestrictions").autosize(6);
        $("#ctl00_workarea_txt_p1_saferestrict").autosize(6);
        $("#ctl00_workarea_txt_p1_suitrestrict").autosize(6);
        $("#txt_p1_reason").autosize(6);

        // alternative small screen size (for inline use only)
        if (!pk_UsePopup()) {
            UseWidth = "750px";
            UseMinWidth = "750px";
            UseHeight = "90%";
            UseMinHeight = "320px";
            UseTop = "3%";
        }

        ResetRequired('#mpage1');       
        SetEnabled();
    } catch (e) { MakePageReadOnly(); }
    ResetReq();    

    if (!pk_val("Page.IsReadonly") && pk_val("Page.NG_ID")) {
        //Editing:
        //   In case selected CATEGORY or TYPE is no longer valid & the default lists from C# include the invalid one(s), reload the cat & types and select the ones from the database. 
        //   If that fails, it is no longer valid so select the "please select" option - this processing is contained in the change() functionality of the lists.
        //Viewing:
        //   OK to display the invalid items as they must have been OK when they were saved.
        $("#ctl00_workarea_cbo_p1_Activity").trigger('change');  
    }

    ResetRequired('#mpage1');
    HasChanges = false;
}

function AddEvents() {
    $("#ctl00_footer_bnSave").attr("href", "#").click(function () { return ClientSave('S'); });
    $("#ctl00_footer_bnReject").attr("href", "#").click(function () { return ClientSave('R'); });
    $("#ctl00_footer_bnGrant").attr("href", "#").click(function () { return ClientSave('G'); });
    $("#bnReset").click(ResetPage);
    $("#ctl00_workarea_txt_p1_assdate").blur(function () { AddPriorDateOnlyFilter(); Date_TextBox_Blur(this, 'Only dates today or in the past can be entered for the assessment date.'); });
    $("#bn_p1_assdate").click(function () { PopupPriorDateOnlySelect(this, 'ctl00_workarea_txt_p1_assdate'); });
    $("#ctl00_workarea_txt_p1_assnumber").keypress(function (e) { return NumberOnly_KeyPress(e || event, function (e) { $('#ctl00_workarea_txt_p1_assnumber').trigger('blur'); }); }).blur(function () { CheckASSno(); });
    $("#bn_p1_assnumber").click(function () { SearchASSClick(); });
    $("#ctl00_workarea_txt_p1_granteddate").change(HideShowSaveBN);
    //$("#bn_p1_granteddate").click(function () { PopupPriorDateOnlySelect(this, 'ctl00_workarea_txt_p1_granteddate'); });
    $("#bn_p1_granteddate").click(function () { Granted_PopupDateSelect(this, 'ctl00_workarea_txt_p1_granteddate'); });
    $("#ctl00_workarea_txt_p1_granteddate").blur(function () { AddGranted_DateFilter(); Date_TextBox_Blur(this, 'Permits cannot be granted before they have been assessed.'); });
    $("#bn_p1_expiry").click(function () { Expiry_PopupDateSelect(this, 'ctl00_workarea_txt_p1_expiry'); });

    $("input,select, textarea").change(CheckReq);   
}

function ResetReq() {
    $("#txt_p1_reason").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
    $("#ctl00_workarea_cbo_p1_commissioner").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
    $("#ctl00_workarea_txt_p1_granteddate").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
    $("#ctl00_workarea_txt_p1_expiry").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
    $("#ctl00_workarea_txt_p1_assnumber").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden", "display": "none" });
    $("#ctl00_workarea_txt_p1_granteddate").trigger("change");
    SetControlError("#txt_p1_reason", false);
    SetControlError("#ctl00_workarea_cbo_p1_commissioner", false);
    SetControlError("#ctl00_workarea_txt_p1_granteddate", false);
    SetControlError("#ctl00_workarea_txt_p1_expiry", false);
    SetControlError("#ctl00_workarea_txt_p1_assnumber", false);
}

function ClientSave(pSaveType) {
    if (!ValidatePage(pSaveType)) return false;
    $("#ctl00_head_h_p1_Category").val(encodeURI($("#ctl00_workarea_cbo_p1_Category").val()));
    $("#ctl00_head_h_p1_Activity").val(encodeURI($("#ctl00_workarea_cbo_p1_Activity").val()));
    $("#ctl00_head_h_p1_Type").val($("#ctl00_workarea_cbo_p1_Type").val());

    $("#ctl00_head_h_cb_p1_techcomp").val($("#ctl00_workarea_cb_p1_techcomp").prop("checked") ? "Y" : "N");
    $("#ctl00_head_h_cb_p1_tsarules").val($("#ctl00_workarea_cb_p1_tsarules").prop("checked") ? "Y" : "N");
    $("#ctl00_head_h_cb_p1_safe").val($("#ctl00_workarea_cb_p1_safe").prop("checked") ? "Y" : "N");
    $("#ctl00_head_h_cb_p1_suit").val($("#ctl00_workarea_cb_p1_suit").prop("checked") ? "Y" : "N");

    if ($("#cb_p1_inerror").prop("checked")) { $("#ctl00_head_h_p1_AddedInError").val("Y"); } else { $("#ctl00_head_h_p1_AddedInError").val("N"); }
    if ($("#cb_p1_inform").prop("checked")) { $("#ctl00_head_h_p1_InformHolder").val("Y"); } else { $("#ctl00_head_h_p1_InformHolder").val("N"); }
    $("#ctl00_head_h_p1_RejectReason").val($("#txt_p1_reason").val());

    if (pSaveType === "S" && $("#ctl00_workarea_txt_p1_granteddate").val()) $("#ctl00_head_h_p1_Status").val("GRNT");
    if (pSaveType === "R") $("#ctl00_head_h_p1_Status").val("REJ");
    if (pSaveType === "G") {
        $("#ctl00_head_h_p1_Status").val("GRNT");
        if ($("#cb_p1_inerror").prop("checked"))
        {
            $.system_alert("Cannot grant a permit while its marked as added in error.", "#cb_p1_inerror");
            return false;
        }
        $("#ctl00_head_h_p1_InformHolder").val("N");
        $("#ctl00_head_h_p1_RejectReason").val("");
    }    

    // CBO Viewstate Fix
    $("#ctl00_head_h_p1_Commissioner").val($("#ctl00_workarea_cbo_p1_commissioner").val());

    
    if (pSaveType === "S") {
        MakeFormReadonlyForSave("");
        __doPostBack('ctl00$footer$bnSave', '');
    }
    else if (pSaveType === "R") {
        MakeFormReadonlyForSave("", "Rejecting Permit...");
        __doPostBack('ctl00$footer$bnReject', '');
    }
    else if (pSaveType === "G") {
        MakeFormReadonlyForSave("", "Granting Permit...");
        __doPostBack('ctl00$footer$bnGrant', '');
    }

    return false;

}

function ValidatePage(pSaveType) {
    vValid = true;
    ResetReq();
    $('input,select, textarea', $('#mpage1')).each(CheckReq);   
    if (pSaveType === "R") {
        if (!$("#cb_p1_inerror").prop("checked") && $("#txt_p1_reason").val() === "") {
            vValid = false;
            $.system_alert('Must add a rejection reason if not added in error');
            SetControlError("#txt_p1_reason", true);
            $("#txt_p1_reason").nextAll('span.rfv:first').css({ "visibility": "visible" }).attr("required", "required");
            $.FocusControl("#txt_p1_reason");
            return vValid;
        }
    }
    else {
        if (pSaveType === "G") {

            if ($("#ctl00_workarea_cbo_p1_commissioner").val() === "" || $("#ctl00_workarea_cbo_p1_commissioner").val() === null) {
                SetControlError("#ctl00_workarea_cbo_p1_commissioner", true);
                $("#ctl00_workarea_cbo_p1_commissioner").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": "visible" });
                vValid = false;
            }

            if ($("#ctl00_workarea_txt_p1_granteddate").val() === "") {
                SetControlError("#ctl00_workarea_txt_p1_granteddate", true);
                $("#ctl00_workarea_txt_p1_granteddate").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": "visible" });
                vValid = false;
            }

            if ($("#ctl00_workarea_txt_p1_expiry").val() === "") {
                SetControlError("#ctl00_workarea_txt_p1_expiry", true);
                $("#ctl00_workarea_txt_p1_expiry").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": "visible" });
                vValid = false;
            }

            if (!$("#ctl00_workarea_txt_p1_membername").val() && !$("#ctl00_workarea_txt_p1_assname").val()) {
                vValid = false;
                SetControlError("#ctl00_workarea_txt_p1_assnumber", true);
                $("#ctl00_workarea_txt_p1_assnumber").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": "visible", "display": "" });
            }

            if (!pk_val("Page.IsUnder18")) {
                if (!$("#ctl00_workarea_cb_p1_techcomp").prop("checked") ||
                    !$("#ctl00_workarea_cb_p1_tsarules").prop("checked") ||
                    !$("#ctl00_workarea_cb_p1_safe").prop("checked") ||
                    !$("#ctl00_workarea_cb_p1_suit").prop("checked")) {
                    vValid = false;
                    $.system_alert('Technical competence, association rules, safeguarding and suitability must all be ticked before granting');
                    return vValid;
                }
            }
            else {
                if (!$("#ctl00_workarea_cb_p1_techcomp").prop("checked") ||
                    !$("#ctl00_workarea_cb_p1_tsarules").prop("checked") ||
                    !$("#ctl00_workarea_cb_p1_suit").prop("checked")) {
                    vValid = false;
                    $.system_alert('Technical competence, association rules and suitability must all be ticked before granting');
                    return vValid;
                }
            }

            if (!$("#ctl00_workarea_txt_p1_assnumber").val() && !$("#ctl00_workarea_txt_p1_assname").val()) {
                $.system_alert('Either an assessor member number or assessor name must be entered', '#ctl00_workarea_txt_p1_assnumber');
                return vValid;
            }
        }
    }
    return vValid;
}

function CheckReq() { ShowRequired(this); }

function ResetPage() {
    $("#mpage1 input").not("[type='button']").each(function () { $(this).resetDB(); });
    $("#mpage1 textarea").each(function () { $(this).resetDB(); });

//    if (pk_val("Page.NG_ID") === "0") {
    PopulateActivities($("#ctl00_workarea_cbo_p1_Activity").data("db"));

    $("#ctl00_workarea_cbo_p1_Activity").resetDB();
    $("#ctl00_workarea_cbo_p1_Activity").trigger("change");
    $("#ctl00_workarea_cbo_p1_Category").resetDB();
    $("#ctl00_workarea_cbo_p1_Category").trigger("change");
    $("#ctl00_workarea_cbo_p1_Type").resetDB();
    $("#ctl00_workarea_cbo_p1_commissioner").resetDB();

    //if (pk_val("Page.OriginalStatus") === "REC")
    //{
    //    $("#ctl00_workarea_cbo_p1_Activity,#ctl00_workarea_cbo_p1_Category,#ctl00_workarea_cbo_p1_Type").attr("disabled", "disabled");
    //}
  
    if (!$("#ctl00_workarea_txt_p1_membername").val()) {
        $("#ctl00_workarea_txt_p1_membername").css("display", "none");
        $("#ctl00_workarea_txt_p1_assnumber,#bn_p1_assnumber").css("display", "");
    }

    SetControlError("#ctl00_workarea_cbo_p1_commissioner", false);
    SetControlError("#ctl00_workarea_txt_p1_granteddate", false);
    SetControlError("#ctl00_workarea_txt_p1_expiry", false);
    SetControlError("#txt_p1_reason", false);
    SetControlError("#ctl00_workarea_txt_p1_assnumber", false);

    ResetRequired('#mpage1');
    ResetReq();
    HideShowSaveBN();
    HasChanges = false;
    return false;
}

function HideShowSaveBN() {
    if (!$("#ctl00_workarea_txt_p1_granteddate").val())
        $("#ctl00_footer_bnSave").css({ "display": "" });
    else {
        $("#ctl00_footer_bnSave").css({ "display": "none" });
        $("#ctl00_workarea_txt_p1_expiry").trigger("blur");
    }
}

function AddExpiry_DateFilter() {    
    calPopup.clearDisabledDates();

    var dd = new Date();
    var dd_End = new Date();
    if ($("#ctl00_workarea_txt_p1_granteddate").val()) {
        dd = new Date($("#ctl00_workarea_txt_p1_granteddate").val());
        dd_End = new Date($("#ctl00_workarea_txt_p1_granteddate").val());
    }
    else {
        dd.setDate(dd.getDate());
        dd_End.setDate(dd_End.getDate());
    }

    // set start date
    calPopup.addDisabledDates(null, formatDate(dd, DisplayDateFormat));

    // add 5 years for end date
    dd_End.setYear(dd_End.getFullYear() + 5);
    
    // 18 birthday rules
    if (pk_val("Page.IsUnder18") && pk_val("Page.DOB"))
    {
        var dd_18th = new Date(pk_val("Page.DOB"));
        if (dd_18th < dd_End) dd_End = dd_18th;
    }

    // add a day
    dd_End.setDate(dd_End.getDate() + 1);
    calPopup.addDisabledDates(formatDate(dd_End, DisplayDateFormat), null);

    // set end dates
    calPopup.setYearSelectStart(dd.getFullYear());
    calPopup.setYearStartEnd(dd.getFullYear(), dd_End.getFullYear());
}

function Expiry_PopupDateSelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddExpiry_DateFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function AddGranted_DateFilter() {
    calPopup.clearDisabledDates();

    var dd = new Date();
    var dd_End = new Date();
    if ($("#ctl00_workarea_txt_p1_assdate").val()) {
        //Grant after assessment
        dd = new Date($("#ctl00_workarea_txt_p1_assdate").val());
        dd.setDate(dd.getDate() - 1);
        dd_End.setDate(dd_End.getDate() + 1);
    }
    else {
        //Grant in past only
        dd.setDate(dd.getDate());
        dd_End.setDate(dd_End.getDate());
    }

    // set start date
    calPopup.addDisabledDates(null, formatDate(dd, DisplayDateFormat));

    calPopup.addDisabledDates(formatDate(dd_End, DisplayDateFormat), null);

    // set end dates
    calPopup.setYearSelectStart(dd.getFullYear());
    calPopup.setYearStartEnd(dd.getFullYear(), dd_End.getFullYear());
}

function Granted_PopupDateSelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddGranted_DateFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

//#region Member lookup

function SearchASSClick() {
    $.member_search("PASS",
        ASS_Populate,
        "Find An Assessor",
        pk_val("Master.User.ON"),
        pk_val("Page.UseCN"));
    return false;
}

function ASS_Populate(CN, Name) {
    $("#ctl00_workarea_txt_p1_assnumber").val(CN);
    if (CN) {
        var validAssessor = true;
        if ($("#ctl00_workarea_cbo_p1_Activity").val()) {
            $.ajax({
                url: WebServicePath() + "ValidAssessorActCat?pLookupContactNumber=" + $("#ctl00_workarea_txt_p1_assnumber").val() + "&pActivity=" + encodeURI($("#ctl00_workarea_cbo_p1_Activity").val()) + "&pCategory=" + encodeURI($("#ctl00_workarea_cbo_p1_Category").val()).replace('+', '%2b'), async: false, success: function (result_2) {
                    if (!result_2.d) validAssessor = false;
                }, error: ServiceFailed
            });
        }

        if (validAssessor) {
            $("#ctl00_workarea_txt_p1_assnumber,#bn_p1_assnumber").css({ "display": "none" });
            $("#ctl00_workarea_txt_p1_membername").val(Name).show();
        }
        else {
            $.system_alert("The selected assessor <b>" + Name.substring(9) + "</b> cannot assess for the selected permit.", "#ctl00_workarea_txt_p1_assnumber");
            $("#ctl00_workarea_txt_p1_assnumber").val("");
            $.FocusControl("#ctl00_workarea_txt_p1_assnumber");
        }

        if (validAssessor) {
            var vAct = $("#ctl00_workarea_cbo_p1_Activity").val();
            var vCat = $("#ctl00_workarea_cbo_p1_Category").val();
            var vTyp = $("#ctl00_workarea_cbo_p1_Type").val();

            PopulateActivities(vAct);

            if ($("#ctl00_workarea_cbo_p1_Activity").val()) $("#ctl00_workarea_cbo_p1_Activity").trigger('change');

            $("#ctl00_workarea_cbo_p1_Category").val(vCat).trigger('change');
            $("#ctl00_workarea_cbo_p1_Type").val(vTyp);
        }
        else
            $("#ctl00_workarea_txt_p1_assnumber").val("");
    }
}

function CheckASSno() {
    if ($("#ctl00_workarea_txt_p1_assnumber").val() === pk_val("Page.UseCN")) {
        $.system_alert("An assessor cannot assess their own permits.");
        ASS_Populate("", "");
    }
    else if (!$("#ctl00_workarea_txt_p1_assnumber").val())
        ASS_Populate("", "");
    else
        $.validate_member("PASS",
            ASS_Populate,
            function () { ASS_Populate("", ""); $.system_alert("Not a valid Assessor number."); },
            $("#ctl00_workarea_txt_p1_assnumber").val(),
            pk_val("Master.User.ON"),
            pk_val("Page.UseCN"));

    if ($("#ctl00_workarea_txt_p1_assnumber").data("db")) {
        if ($("#ctl00_workarea_txt_p1_assnumber").val() !== $("#ctl00_workarea_txt_p1_assnumber").data("db"))
            HasChanges = true;
    }
    else if ($("#ctl00_workarea_txt_p1_assnumber").val())
        HasChanges = true;
}

//#endregion

function PopulateActivities(pPreSelectedValue) {
    $.ajax({
        url: WebServicePath() + "PermitActivities?pAssessorCN=" + $("#ctl00_workarea_txt_p1_assnumber").val(), async: false, success: function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p1_Activity", result, false, "--- No Items Available ---", true, pPreSelectedValue, "--- Select a permit activity ---");

            if (!$("#ctl00_workarea_cbo_p1_Activity").val())
                $('#ctl00_workarea_cbo_p1_Category').empty().append('<option selected="selected" value="">--- No Items Available ---</option>').attr("disabled", "disabled");               

            if (pPreSelectedValue) {
                $("#ctl00_workarea_cbo_p1_Activity").val(pPreSelectedValue).trigger('change');
            }

            SetEnabled();
        }, error: ServiceFailed
    });

    if (pk_val("Page.IsReadonly"))
        HasChanges = false;
}

function PopulateCategories() {
    if ($("#ctl00_workarea_cbo_p1_Activity option:selected").val()) {
        $.ajax({
            url: WebServicePath() + "PermitCategories?pActivity=" + $("#ctl00_workarea_cbo_p1_Activity option:selected").val() + "&pAssessorCN=" + $("#ctl00_workarea_txt_p1_assnumber").val(), async: false, success: function (result) {
                // if data is pre populated check assessor can still assess category
                PopulateCBO("#ctl00_workarea_cbo_p1_Category", result, false, "--- No Items Available ---", true, $("#ctl00_workarea_cbo_p1_Category").val(),"--- Select a permit category ---");

                if (pk_val("Page.IsReadonly") || $('#ctl00_workarea_cbo_p1_Activity').attr("disabled") === "disabled" || $('#ctl00_workarea_cbo_p1_Activity').val() === "") $('#ctl00_workarea_cbo_p1_Category').attr("disabled", "disabled");
                else $('#ctl00_workarea_cbo_p1_Category').removeAttr("disabled");

                if ($('#ctl00_workarea_cbo_p1_Activity').val() === $('#ctl00_workarea_cbo_p1_Activity').data("db")) {
                    $("#ctl00_workarea_cbo_p1_Category").val($("#ctl00_workarea_cbo_p1_Category").data("db"));
                    if ($("#ctl00_workarea_cbo_p1_Category").val() !== $("#ctl00_workarea_cbo_p1_Category").data("db")) $("#ctl00_workarea_cbo_p1_Category").val("");
                    ResetRequired('#mpage1');
                    if (!pk_val("Page.IsReadonly") && !$("#ctl00_workarea_cbo_p1_Category").val())
                        $('#ctl00_workarea_cbo_p1_Type').empty().append('<option selected="selected" value="">--- No Items Available ---</option>').attr("disabled", "disabled");
                }
                else if (!pk_val("Page.IsReadonly") && !$("#ctl00_workarea_cbo_p1_Category").val())
                    $('#ctl00_workarea_cbo_p1_Type').empty().append('<option selected="selected" value="">--- No Items Available ---</option>').attr("disabled", "disabled");

                SetEnabled();
            }, error: ServiceFailed
        });
    }
    else {
        $('#ctl00_workarea_cbo_p1_Category').empty().append('<option selected="selected" value="">--- No Items Available ---</option>').attr("disabled", "disabled");
        $('#ctl00_workarea_cbo_p1_Type').empty().append('<option selected="selected" value="">--- No Items Available ---</option>').attr("disabled", "disabled");
        SetEnabled();
    }
    if (pk_val("Page.IsReadonly")) HasChanges = false;
}

function PopulateCategoryTypes() {
    if ($("#ctl00_workarea_cbo_p1_Category option:selected").val()) {
        $.ajax({
            url: WebServicePath() + "PermitCategoryTypes?pActivity=" + encodeURI($("#ctl00_workarea_cbo_p1_Activity option:selected").val()) + "&pCategory=" + encodeURI($("#ctl00_workarea_cbo_p1_Category").val()).replace('+', '%2b'), async: false, success: function (result) {
                var options = [];
                var DefaultIndex = 0;
                var okIDX = 1;
                if (result.d) {
                    options.push('<option value="">', "--- Select a permit type ---", '</option>');
                    for (var i = 0; i < result.d.length; i++) {
                        if (!(!pk_val("Page.IsUnder18") && result.d[i].Value === "PERS") && result.d[i].Parent) {
                            okIDX++;
                            options.push('<option value="', result.d[i].Value, '">', result.d[i].Description, ' </option>');
                        }
                    }

                    if (okIDX === 1) {
                        options = [];
                        options.push('<option value="">', "--- No Items Available ---", '</option>');
                        $('#ctl00_workarea_cbo_p1_Type').attr("disabled", "disabled");
                    }
                    else {
                        $("#ctl00_workarea_cbo_p1_Type").removeAttr("disabled");
                    }
                }
                else {
                    options.push('<option value="">', "--- No Items Available ---", '</option>');
                    $("#ctl00_workarea_cbo_p1_Type").attr("disabled", "disabled");
                }
                $("#ctl00_workarea_cbo_p1_Type").html(options.join(''));

                if ($("#ctl00_workarea_cbo_p1_Activity").val() === $("#ctl00_workarea_cbo_p1_Activity").data("db")
                        && $("#ctl00_workarea_cbo_p1_Category").val() === $("#ctl00_workarea_cbo_p1_Category").data("db")) {
                    $("#ctl00_workarea_cbo_p1_Type").val($("#ctl00_workarea_cbo_p1_Type").data("db"));
                    if ($("#ctl00_workarea_cbo_p1_Type").val() !== $("#ctl00_workarea_cbo_p1_Type").data("db")) $("#ctl00_workarea_cbo_p1_Type").val("");
                }
                else
                {
                    $('#ctl00_workarea_cbo_p1_Type option:eq(' + DefaultIndex + ')').prop('selected', true);
                }

            }, error: ServiceFailed
        });
    }
    else {
        $('#ctl00_workarea_cbo_p1_Type').empty().append('<option selected="selected" value="">--- No Items Available ---</option>').attr("disabled", "disabled");
        SetEnabled();
    }
    SetEnabled();
    if (pk_val("Page.IsReadonly")) HasChanges = false;
}

function PopulateCategoryTypesOLD(ResetDBValues) {
    if ($("#ctl00_workarea_cbo_p1_Category option:selected").val()) {
        $.ajax({
            url: WebServicePath() + "PermitCategoryTypes?pActivity=" + encodeURI($("#ctl00_workarea_cbo_p1_Activity option:selected").val()) + "&pCategory=" + encodeURI($("#ctl00_workarea_cbo_p1_Category").val()).replace('+', '%2b'), async: false, success: function (result) {
                var options = [];
                var DefaultIndex = 0;
                var okIDX = 1;
                var orig = $("#ctl00_workarea_cbo_p1_Type option:selected").val();
                if (result.d) {
                    options.push('<option value="">', "--- Select a permit type ---", '</option>');
                    for (var i = 0; i < result.d.length; i++) {
                        if (((pk_val("Page.IsUnder18") && result.d[i].Value === "PERS") && result.d[i].Parent) || (result.d[i].Value !== "PERS")) {
                            okIDX++;
                            options.push('<option value="', result.d[i].Value, '">', result.d[i].Description, ' </option>');
                            if (orig === result.d[i].Value)
                                DefaultIndex = okIDX;
                        }
                    }

                    if (okIDX === 1) {
                        options = [];
                        options.push('<option value="">', "--- No Items Available ---", '</option>');
                        $('#ctl00_workarea_cbo_p1_Type').attr("disabled", "disabled");
                        ResetDBValues = null;
                    }
                    else
                        $("#ctl00_workarea_cbo_p1_Type").removeAttr("disabled");
                }
                else {
                    options.push('<option value="">', "--- No Items Available ---", '</option>');
                    $("#ctl00_workarea_cbo_p1_Type").attr("disabled", "disabled");                    
                }
                $("#ctl00_workarea_cbo_p1_Type").html(options.join(''));

                if (ResetDBValues)
                    $("#ctl00_workarea_cbo_p1_Type").resetDB();
                else
                    $('#ctl00_workarea_cbo_p1_Type option:eq(' + DefaultIndex + ')').prop('selected', true);
                SetEnabled();
            }, error: ServiceFailed
        });
    }
    else
    {
        $('#ctl00_workarea_cbo_p1_Type').empty().append('<option selected="selected" value="">--- No Items Available ---</option>').attr("disabled", "disabled");
        SetEnabled();
    }
    if (pk_val("Page.IsReadonly")) HasChanges = false;
}

