$(document).ready(FormReady);
$.ajaxSetup({ cache: false });

function FormReady() {
    $("input").keydown(function (event) {
        var e = event || window.event; // for trans-browser compatibility
        var charCode = e.which || e.keyCode;
        var ActivePage = $(".mpage:visible:last").attr("id");
        if (charCode === 13 && ActivePage === "mpage1") {
            if ($("*:focus").attr("id") === "ctl00_workarea_txt_p1_dob" && !ValidateParentDoB($("#ctl00_workarea_txt_p1_dob")))
                return;

            ChangePage(1, 2);
        }
        //test GitHub integration post-ACS changeover
        return RemoveNotWantedChars(e);
    });
    
    $("#cbo_p3_Honours1, #cbo_p3_Honours2, #cbo_p3_Honours3").addClass("HONCHNG").change(function () {
        var Hons = "";
        $(".HONCHNG").each(function () {
            if ($("option:selected", this).attr("value"))
                Hons += $("option:selected", this).text() + " ";
        });
        $("#ctl00_workarea_txt_p3_honours").val(Hons);
    });

    $('.msHeadTD').hover(
        function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(),10) + 1) + ')').addClass("Grid_HL"); },
        function () {
            if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(),10) + 1) + ')').removeClass("Grid_HL");
        });
    
    $("input,select,textarea").change(CheckReq);
    $("#ctl00_workarea_txt_p4_email1").change(function () {
        if (!($('#radio_p4_email1').prop('checked') || $('#radio_p4_email2').prop('checked') || $('#radio_p4_email3').prop('checked'))) {
            $('#radio_p4_email1').prop('checked', true);
        }
    });
    $("#ctl00_workarea_txt_p4_tel1").change(function () {
        if (!($('#radio_p4_tel1').prop('checked') || $('#radio_p4_tel2').prop('checked') || $('#radio_p4_tel3').prop('checked'))) {
            $('#radio_p4_tel1').prop('checked', true);
        }
    });
    $("#ctl00_workarea_txt_p3_surname, #ctl00_workarea_txt_p3_forenames").change(GetAdultDisplayName);
    $("#ctl00_workarea_txt_p4_postcode").on("blur", function () { return validatePostCode($("#ctl00_workarea_txt_p4_postcode"), $('#cbo_p4_country option:selected').attr("value") !== 'UK'); });
    $("#cbo_p4_country").on("change", function () { return validatePostCode($("#ctl00_workarea_txt_p4_postcode"), $('#cbo_p4_country option:selected').attr("value") !== 'UK'); });
    $("#cbo_p4_contact_type1,#cbo_p4_contact_type2,#cbo_p4_contact_type3").change(CheckEmails);
    $("#ctl00_workarea_txt_p1_surname,#txt_p1_prev_surname").blur(function () { return validateMinSurname(this); });
    $("#ctl00_workarea_txt_p1_dob").blur(function () { ValidateParentDoB(this); });
    $("#bn_p1_dob").click(function () { PopupDoBSelect(this, 'ctl00_workarea_txt_p1_dob'); });
    $("#ctl00_workarea_txt_p1_postcode").blur(function () { return validatePostCode(this,($('#ctl00_workarea_cb_p1_NonUK').prop('checked'))); });
    $("#ctl00_workarea_txt_p3_dob").blur(function () { ValidateParentDoB(this); });
    $("#bn_p3_dob").click(function () { PopupDoBSelect(this, 'ctl00_workarea_txt_p3_dob'); });
    $("#ctl00_workarea_txt_p3_doj").blur(function () { Date_TextBox_Blur(this); });
    $("#bn_p3_doj").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p3_doj'); });
    $("#bn_p3_EditHonors").click(function () { EditHonors(this); });
    $("#bnReset1").click(function () { return ResetPage(1); }).removeAttr("id");
    $("#bnNext1").click(function () { return ChangePage(1, 2); }).removeAttr("id");
    $("#bnPrev2").click(function () { return MakePageVisible(1); }).removeAttr("id");
    $("#bnBlank").click(function () { InsertBlank(); return false; }).removeAttr("id");
    $("#bnPrev3").click(function () { return MakePageVisible(2); }).removeAttr("id");
    $("#bnReset3").click(function () { return ResetPage(3,true); }).removeAttr("id");
    $("#bnSummary3").click(function () { return ChangePage(3, 6); }).removeAttr("id");
    $("#bnNext3").click(function () { return ChangePage(3, 4); }).removeAttr("id");
    $("#bnPrev4").click(function () { return MakePageVisible(3); }).removeAttr("id");
    $("#bnReset4").click(function () { var r4 = ResetPage(4); CheckEmails(); ResetPage(4); return r4; }).removeAttr("id");
    $("#bnSummary4").click(function () { return ChangePage(4, 6); }).removeAttr("id");
    $("#bnNext4").click(function () { return ChangePage(4, 5); }).removeAttr("id");
    $("#bnPrev5").click(function () { return MakePageVisible(4); }).removeAttr("id");
    $("#bnReset5").click(function () { return ResetPage(5); }).removeAttr("id");
    $("#bnSummary5,#bnNext5").click(function () { return ChangePage(5, 6); }).removeAttr("id");
    $("#bnReset7").click(function () { return ResetPage(7); }).removeAttr("id");
    $("#bnSummary7").click(function () { return ChangePage(7, 6); }).removeAttr("id");
    $("#bnReset8").click(function () { return ResetPage(8); }).removeAttr("id");
    $("#bnSummary8").click(function () { return ChangePage(8, 6); }).removeAttr("id");
    $("#bnNotInList").click(function () { AddressBack(); return false; }).removeAttr("id");
    $("#bnPrev9").click(function () { return MakePageVisible(2); }).removeAttr("id");
    $("#bnEdit3").click(function () { ChangePage(6, 3); }).removeAttr("id");
    $("#bnEdit4").click(function () { ChangePage(6, 4); }).removeAttr("id");
    $("#bnEdit5").click(function () { ChangePage(6, 5); }).removeAttr("id");
    $("#bnEdit7").click(function () { ChangePage(6, 7); }).removeAttr("id");
    $("#bnEdit8").click(function () { ChangePage(6, 8); }).removeAttr("id");
    $("#ctl00_workarea_txt_p4_email1,#ctl00_workarea_txt_p4_email2,#ctl00_workarea_txt_p4_email3").blur(function () { validateEmail(this); });
    $("#bn_p4_QASLookup").click(function () { GetPAF('ctl00_workarea_txt_p4_addressline1¬ctl00_workarea_txt_p4_addressline2¬ctl00_workarea_txt_p4_addressline3¬ctl00_workarea_txt_p4_town¬ctl00_workarea_txt_p4_county¬ctl00_workarea_txt_p4_postcode¬cbo_p4_country', 'ctl00_workarea_txt_p4_postcode', 10, 4); });
    $("#ctl00_workarea_txt_p4_tel1,#ctl00_workarea_txt_p4_tel2,#ctl00_workarea_txt_p4_tel3").keypress(function () { return NumberOnly_KeyPress(event, null); }).blur(function () { validatePhone(this); });
    //$("#ctl00_workarea_txt_p4_socmed1,#ctl00_workarea_txt_p4_socmed2,#ctl00_workarea_txt_p4_socmed3").blur(function () { return validateWebAddress(this); });
    $("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2").attr("href", "#").click(function () { return SaveForm('#ctl00_footer_bnSave1,#ctl00_footer_bnSave2'); });
    $("#txt_p6_name").data("link", "#cbo_p3_title,#ctl00_workarea_txt_p3_forenames,#ctl00_workarea_txt_p3_surname,#ctl00_workarea_txt_p3_known_as").data("seperator", " ").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly").removeAttr("id");
    $("#txt_p6_DGE").data("link", "#ctl00_workarea_txt_p3_dob,#cbo_p3_gender,#cbo_p3_ethnicity").data("seperator", " / ").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly").removeAttr("id");
    $("#txt_p6_Hon").data("link", "#ctl00_workarea_txt_p3_honours").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly").removeAttr("id");
    $("#txt_p6_Occ").data("link", "#cbo_p3_occupation,#ctl00_workarea_txt_p3_occdetail").data("seperator", "/").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly").removeAttr("id");
    $("#ctl00_workarea_txt_p6_giftaid").data("link", "#ctl00_workarea_cb_p3_giftaid").data("seperator", "/").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly");
    $("#ctl00_workarea_txt_p6_homeaddress").data("link", "#ctl00_workarea_txt_p4_addressline1,#ctl00_workarea_txt_p4_addressline2,#ctl00_workarea_txt_p4_addressline3,#ctl00_workarea_txt_p4_town,#ctl00_workarea_txt_p4_county,#ctl00_workarea_txt_p4_postcode,#cbo_p4_country").data("seperator", "¬").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly");
    $("#txt_p9_Name").data("link", "#cbo_p3_title,#ctl00_workarea_txt_p3_forenames,#ctl00_workarea_txt_p3_surname,#ctl00_workarea_txt_p3_known_as").data("seperator", " ").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly").removeAttr("id");
    $("#txt_p9_DOB").data("link", "#ctl00_workarea_txt_p3_dob").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly").removeAttr("id");
    $("#txt_p9_gender").data("link", "#cbo_p3_gender").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly").removeAttr("id");
    $("#ctl00_workarea_txt_p9_homeaddress").data("link", "#ctl00_workarea_txt_p4_town,#ctl00_workarea_txt_p4_county,#ctl00_workarea_txt_p4_postcode,#cbo_p4_country").data("seperator", "¬").addClass("summary").css({ "width": "400px", "border": "none", "background-color": "transparent" }).attr("readonly", "readonly");
    $("#sum_p6_tel").data("link", "#ctl00_workarea_txt_p4_tel1,#cbo_p4_tel1,#radio_p4_tel1,#ctl00_workarea_txt_p4_tel2,#cbo_p4_tel2,#radio_p4_tel2,#ctl00_workarea_txt_p4_tel3,#cbo_p4_tel3,#radio_p4_tel3").data("seperator", " ").data("flds", "3").addClass("summary").closest("tr").css("display", "none");
    $("#sum_p6_email").data("link", "#ctl00_workarea_txt_p4_email1,#cbo_p4_contact_type1,#radio_p4_email1,#ctl00_workarea_txt_p4_email2,#cbo_p4_contact_type2,#radio_p4_email2,#ctl00_workarea_txt_p4_email3,#cbo_p4_contact_type3,#radio_p4_email3").data("seperator", " ").data("flds", "3").addClass("summary").closest("tr").css("display", "none");
    $("#sum_p6_socmed").data("link", "#ctl00_workarea_txt_p4_socmed1,#cbo_p4_socmed1,#ctl00_workarea_txt_p4_socmed2,#cbo_p4_socmed2,#ctl00_workarea_txt_p4_socmed3,#cbo_p4_socmed3").data("seperator", " ").data("flds", "2").addClass("summary").closest("tr").css("display", "none");

    //#region Optimisations

    // countries
    Opt_GetCBO("#ctl00_workarea_h_cbo_p4_country", "--- Select Country ---", "#cbo_p4_country", 4);
    // titles 
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_title", "--- Select Title ---", "#cbo_p1_title,#cbo_p3_title", undefined);
    // gender
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_gender", "--- Select ---", "#cbo_p1_gender,#cbo_p3_gender", 1);
    // honors
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_hon", "--- Select Honour ---", "#cbo_p3_Honours1,#cbo_p3_Honours2,#cbo_p3_Honours3", undefined);
    // hobbies
    Opt_GetCBO("#ctl00_workarea_txt_p8_hobbiesformatted", "--- Select Hobby ---", "#cbo_p8_hobby", 4);
    // qualifications
    Opt_GetCBO("#ctl00_workarea_txt_p7_qualificationsformatted", "--- Select Qualification ---", "#cbo_p7_qualification", 4);
    // disabilities
    Opt_GetCBO("#ctl00_workarea_txt_p5_Specialneedsformatted", "--- Select Disability ---", "#cbo_p5_disability", 4);
    // ethnicities
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_ethnicity", "--- Select Ethnicity ---", "#cbo_p3_ethnicity", 4);
    // occupation
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_occupation", "--- Select Occupation ---", "#cbo_p3_occupation", 4);
    // Email
    Opt_GetCBO("#ctl00_workarea_h_cbo_p4_contact_type1", "--- Select ---", "#cbo_p4_contact_type1,#cbo_p4_contact_type2,#cbo_p4_contact_type3", 4);
    // Phone
    Opt_GetCBO("#ctl00_workarea_h_cbo_p4_tel1", "--- Select ---", "#cbo_p4_tel1,#cbo_p4_tel2,#cbo_p4_tel3", 4);
    // SocMedia
    Opt_GetCBO("#ctl00_workarea_h_cbo_p4_socmed1", "--- Select ---", "#cbo_p4_socmed1,#cbo_p4_socmed2,#cbo_p4_socmed3", 4);

    //#endregion

    PopulateGridDiscCBO();
    PopulateGridQualCBO();
    PopulateGridHobbyCBO();
     
    $.FocusControl("#cbo_p1_title", true, 1000);
    SetEnabled();
    setTimeout(function () { MakePageVisible(1); }, PageVisibleDelay());
    HasChanges = false;
}

function AddDoBFilter() {
    // no dates for 18 years (no under 18's basically)
    var d = new Date();
    d.setYear(d.getFullYear() - 18); // remove 18 years
    //d.setDate(d.getDate() + 1); // add day (in case b'day is today)
    d.setDate(d.getDate() + 183); // add 6 months as member may join from 17.5 but may not start role until 18
    calPopup.addDisabledDates(formatDate(d, DisplayDateFormat), null);
    calPopup.setYearSelectStart(d.getFullYear() - 11);
    calPopup.setYearStartEnd("", d.getFullYear());
}

function PopupDoBSelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddDoBFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function ValidateParentDoB(self) {
    if (!$(self).val()) return true;
    calPopup.clearDisabledDates();
    AddDoBFilter();
    return Date_TextBox_Blur(self, 'Must be over 17½');
}

function InsertBlank() {
    ResetPage(3); ResetPage(4); ResetPage(5); ResetPage(7);  // in case a person is selected and then prev and a different person / new person
    GetAdultDisplayName();
    //PL 06.08.14  TSA ref 1178 "Missing Requests for Task Manager"
    //Ensure we make a note that a new record is being created
    $("#ctl00_workarea_h_pk").val("NEW");
    $("#cbo_p3_title").val($("#cbo_p1_title option:selected").attr("value")).attr("disabled", "disabled");
    $("#cbo_p3_gender").val($("#cbo_p1_gender option:selected").attr("value")).attr("disabled", "disabled");
    $("#ctl00_workarea_txt_p3_surname").val($("#ctl00_workarea_txt_p1_surname").val()).attr("readonly", "readonly");
    $("#ctl00_workarea_txt_p3_dob").val($("#ctl00_workarea_txt_p1_dob").val());
    $("#ctl00_workarea_txt_p4_postcode").val($("#ctl00_workarea_txt_p1_postcode").val()).removeAttr("readonly");
    $("#bn_p3_doj").show();
    $("#ctl00_workarea_txt_p3_doj, #ctl00_workarea_txt_p3_forenames").removeAttr("readonly");

    if ($("#cbo_p4_contact_type1 option[value='" + pk_val("Const.NOEMAILVALUE") + "']").length === 0)
        $("#cbo_p4_contact_type1").append("<option value='" + pk_val("Const.NOEMAILVALUE") + "'>" + pk_val("Const.NOEMAILTEXT") + "</option>");

    if (HasAccess(pk_val("CRUD.PDOB"), 'U')) {
        $("#bn_p3_dob").show();
        $("#ctl00_workarea_txt_p3_dob").removeAttr("readonly");
    }
    else {
        $("#bn_p3_dob").hide();
        $("#ctl00_workarea_txt_p3_dob").attr("readonly", "readonly");
    }
    
    if (pk_val("Page.JL_Forename")) $("#ctl00_workarea_txt_p3_forenames").val(pk_val("Page.JL_Forename")).attr("readonly", "readonly");
    else $("#ctl00_workarea_txt_p3_forenames").val("").removeAttr("readonly");
    
    // for honors
    $("#bn_p3_EditHonors").prop("value", "Add");
    $("#div_p3_EditHonors").slideUp(300);
    $(".HonorsTD").css({ "border": "" });

    // blank memb no field
    $("#ctl00_workarea_txt_p3_membno").val('');
    ResetRequired('#mpage3');
    ResetRequired('#mpage4');
    SetEnabled();
    GetAdultDisplayName();
    MakePageVisible(3);
}

function PopulateDetails(CN, Restricted) {
    ResetPage(3); ResetPage(4); ResetPage(5); ResetPage(7);  // in case a person is selected and then prev and a different person / new person            

    $("#ctl00_workarea_txt_p3_membno").val(CN);    
    parent.ShowBusy_Popup('Getting Details... Please wait.');

    var SuccessFunction = function (result) {
        parent.HideBusy_Popup();
        var xProfile = $.parseJSON(result.d || result);

        // Page 3                    
        if (xProfile.PersonData.Title === 'ms') xProfile.PersonData.Title = 'Ms';
        $("#cbo_p3_title").val(xProfile.PersonData.Title).data('ng_id', xProfile.PersonData.ContactNumber).attr("disabled", "disabled");

        $("#cbo_p3_gender").val(xProfile.PersonData.Gender);
        if (xProfile.PersonData.Gender && xProfile.PersonData.Gender !== "U") $("#cbo_p3_gender").attr("disabled", "disabled");
        else $("#cbo_p3_gender").removeAttr("disabled");

        $("#ctl00_workarea_txt_p3_forenames").val(xProfile.PersonData.Forenames);
        if (xProfile.PersonData.Forenames) $("#ctl00_workarea_txt_p3_forenames").attr("readonly", "readonly");
        else $("#ctl00_workarea_txt_p3_forenames").removeAttr("readonly");

        $("#ctl00_workarea_txt_p3_surname").val(xProfile.PersonData.Surname).attr("readonly", "readonly");

        GetAdultDisplayName();
        $("#ctl00_workarea_txt_p3_known_as").val(xProfile.PersonData.KnownAs);
        $("#cbo_p3_ethnicity").val(xProfile.PersonData.Ethnicity.LookupValue);
        $("#ctl00_workarea_txt_p3_ethnicity").val(xProfile.PersonData.Ethnicity.Details);

        if (xProfile.PersonData.DOB)
            $("#ctl00_workarea_txt_p3_dob").val(xProfile.PersonData.DOB);
        else
            $("#ctl00_workarea_txt_p3_dob").val($("#ctl00_workarea_txt_p1_dob").val());

        if (pk_val("CRUD.PDOB") !== "U") {
            $("#ctl00_workarea_txt_p3_dob").attr("readonly", "readonly");
            $("#bn_p3_dob").hide();
        }
        else {
            $("#ctl00_workarea_txt_p3_dob").removeAttr("readonly").val();
            $("#bn_p3_dob").show();
        }

        $("#ctl00_workarea_txt_p3_doj").val(xProfile.MembershipData.JoinDate);
        if (xProfile.MembershipData.JoinDate) {
            $("#ctl00_workarea_txt_p3_doj").attr("readonly", "readonly");
            $("#bn_p3_doj").hide();
        }
        else {
            $("#ctl00_workarea_txt_p3_doj").removeAttr("readonly");
            $("#bn_p3_doj").show();
        }
        $("#ctl00_workarea_txt_p3_honours").val(xProfile.PersonData.Honours);
        $("#cbo_p3_occupation").val(xProfile.PersonData.Occupation.LookupValue);
        $("#ctl00_workarea_txt_p3_occdetail").val(xProfile.PersonData.Occupation.Details);
        $("#ctl00_workarea_cb_p3_giftaid").prop('checked', xProfile.PersonData.GiftAid);

        $("#div_p3_EditHonors").slideUp(300);
        $(".HonorsTD").css({ "border": "" });
        if (xProfile.PersonData.Honours) {
            var lines = xProfile.PersonData.Honours.split(" ");
            for (ii = 0, ll = lines.length; ii < ll; ii += 1) {
                if (lines[ii].iTrim() && ii < 3)
                    $("#ctl00_workarea_cbo_p3_Honours" + (ii + 1)).val(lines[ii].iTrim());
            }
            $("#bn_p3_EditHonors").prop("value", "Edit");
        }
        else { $("#bn_p3_EditHonors").prop("value", "Add"); }

        //Page 4
        if (xProfile.PersonData.Addresses[0]) {
            if (!xProfile.PersonData.Addresses[0].Historical) $("#ctl00_workarea_txt_p4_addressline1").data('ng_id', xProfile.PersonData.Addresses[0].AddressNumber);

            if (Restricted || $("#ctl00_workarea_txt_p1_postcode").val().toUpperCase().replaceAll(" ", "") === xProfile.PersonData.Addresses[0].Postcode.toUpperCase().replaceAll(" ", "")) {
                $("#ctl00_workarea_txt_p4_addressline1").val(xProfile.PersonData.Addresses[0].Line1);
                $("#ctl00_workarea_txt_p4_addressline2").val(xProfile.PersonData.Addresses[0].Line2);
                $("#ctl00_workarea_txt_p4_addressline3").val(xProfile.PersonData.Addresses[0].Line3);
                $("#ctl00_workarea_txt_p4_town").val(xProfile.PersonData.Addresses[0].Town);
                $("#ctl00_workarea_txt_p4_county").val(xProfile.PersonData.Addresses[0].County);
                $("#ctl00_workarea_txt_p4_postcode").val(xProfile.PersonData.Addresses[0].Postcode);
                $("#cbo_p4_country").val(xProfile.PersonData.Addresses[0].Country);
            } else {
                $("#ctl00_workarea_txt_p4_postcode").val($("#ctl00_workarea_txt_p1_postcode").val().toUpperCase());
            }
        }
        if (xProfile.PersonData.EmailAddresses) {
            if (xProfile.PersonData.EmailAddresses.length > 0) {
                $("#cbo_p4_contact_type1").val(GetSelectValue("#cbo_p4_contact_type1", xProfile.PersonData.EmailAddresses[0].Type));
                $("#cbo_p4_contact_type1").data('ng_id', xProfile.PersonData.EmailAddresses[0].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_email1").val(xProfile.PersonData.EmailAddresses[0].EmailAddress);
                $('#radio_p4_email1').prop('checked', xProfile.PersonData.EmailAddresses[0].IsMain);
            }
            if (xProfile.PersonData.EmailAddresses.length > 1) {
                $("#cbo_p4_contact_type2").val(GetSelectValue("#cbo_p4_contact_type2", xProfile.PersonData.EmailAddresses[1].Type));
                $("#cbo_p4_contact_type2").data('ng_id', xProfile.PersonData.EmailAddresses[1].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_email2").val(xProfile.PersonData.EmailAddresses[1].EmailAddress);
                $('#radio_p4_email2').prop('checked', xProfile.PersonData.EmailAddresses[1].IsMain);
            }
            if (xProfile.PersonData.EmailAddresses.length > 2) {
                $("#cbo_p4_contact_type3").val(GetSelectValue("#cbo_p4_contact_type3", xProfile.PersonData.EmailAddresses[2].Type));
                $("#cbo_p4_contact_type3").data('ng_id', xProfile.PersonData.EmailAddresses[2].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_email3").val(xProfile.PersonData.EmailAddresses[2].EmailAddress);
                $('#radio_p4_email3').prop('checked', xProfile.PersonData.EmailAddresses[2].IsMain);
            }
            CheckEmails();
        }
        else {
            if ($("#cbo_p4_contact_type1 option[value='" + pk_val("Const.NOEMAILVALUE") + "']").length === 0)
                $("#cbo_p4_contact_type1").append("<option value='" + pk_val("Const.NOEMAILVALUE") + "'>" + pk_val("Const.NOEMAILTEXT") + "</option>");
        }
        if (xProfile.PersonData.PhoneNumbers) {
            if (xProfile.PersonData.PhoneNumbers.length > 0) {
                $("#cbo_p4_tel1").val(GetSelectValue("#cbo_p4_tel1", xProfile.PersonData.PhoneNumbers[0].Type));
                $("#cbo_p4_tel1").data('ng_id', xProfile.PersonData.PhoneNumbers[0].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_tel1").val(xProfile.PersonData.PhoneNumbers[0].Number);
                $('#radio_p4_tel1').prop('checked', xProfile.PersonData.PhoneNumbers[0].IsMain);
            }
            if (xProfile.PersonData.PhoneNumbers.length > 1) {
                $("#cbo_p4_tel2").val(GetSelectValue("#cbo_p4_tel2", xProfile.PersonData.PhoneNumbers[1].Type));
                $("#cbo_p4_tel2").data('ng_id', xProfile.PersonData.PhoneNumbers[1].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_tel2").val(xProfile.PersonData.PhoneNumbers[1].Number);
                $('#radio_p4_tel2').prop('checked', xProfile.PersonData.PhoneNumbers[1].IsMain);
            }
            if (xProfile.PersonData.PhoneNumbers.length > 2) {
                $("#cbo_p4_tel3").val(GetSelectValue("#cbo_p4_tel3", xProfile.PersonData.PhoneNumbers[2].Type));
                $("#cbo_p4_tel3").data('ng_id', xProfile.PersonData.PhoneNumbers[2].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_tel3").val(xProfile.PersonData.PhoneNumbers[2].Number);
                $('#radio_p4_tel3').prop('checked', xProfile.PersonData.PhoneNumbers[2].IsMain);
            }
        }
        if (xProfile.PersonData.SocialMedia) {
            if (xProfile.PersonData.SocialMedia.length > 0) {
                $("#cbo_p4_socmed1").val(GetSelectValue("#cbo_p4_socmed1", xProfile.PersonData.SocialMedia[0].Type));
                $("#cbo_p4_socmed1").data('ng_id', xProfile.PersonData.SocialMedia[0].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_socmed1").val(xProfile.PersonData.SocialMedia[0].Details);
            }
            if (xProfile.PersonData.SocialMedia.length > 1) {
                $("#cbo_p4_socmed2").val(GetSelectValue("#cbo_p4_socmed2", xProfile.PersonData.SocialMedia[1].Type));
                $("#cbo_p4_socmed2").data('ng_id', xProfile.PersonData.SocialMedia[1].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_socmed2").val(xProfile.PersonData.SocialMedia[1].Details);
            }
            if (xProfile.PersonData.SocialMedia.length > 2) {
                $("#cbo_p4_socmed3").val(GetSelectValue("#cbo_p4_socmed3", xProfile.PersonData.SocialMedia[2].Type));
                $("#cbo_p4_socmed3").data('ng_id', xProfile.PersonData.SocialMedia[2].CommunicationNumber);
                $("#ctl00_workarea_txt_p4_socmed3").val(xProfile.PersonData.SocialMedia[2].Details);
            }
        }        
        //Page 5

        ResetPage(5);
        if (xProfile.PersonData.Disabilities) {
            for (var m = 0; m < xProfile.PersonData.Disabilities.length; m++) { AddDisability(xProfile.PersonData.Disabilities[m]); }
        }
        //Page 7 (qualification)
        ResetPage(7);
        if (xProfile.PersonData.Qualifications) {
            for (var n = 0; n < xProfile.PersonData.Qualifications.length; n++) { AddQualification(xProfile.PersonData.Qualifications[n]); }
        }
        //Page 8 (hobbies)
        ResetPage(8);
        if (xProfile.PersonData.Hobbies) {
            for (var p = 0; p < xProfile.PersonData.Hobbies.length; p++) { AddHobby(xProfile.PersonData.Hobbies[p]); }
        }

        if (Restricted) {
            MakePageVisible(9);
            $("#LBTN3, #LBTN4, #LBTN5, #LBTN7, #LBTN8").css("display", "none");
            $('#LBTN6').addClass("navbutton_Disabled_Selected").data("selected", "Y");
        }
        else {
            $("#LBTN3, #LBTN4, #LBTN5, #LBTN7, #LBTN8").css("display", "");
            MakePageVisible(3);
        }

        ResetRequired('#mpage3');
        ResetRequired('#mpage4');
        SetEnabled();
    };

    if (pk_val("Master.Sys.REST")) {
        // this is the code to run if using REST instead of JSON,
        // NOTE: subtally it is different.
        var vData = {};
        vData["Source"] = "ADULT";
        vData["ContactNumber"] = CN;
        PostToHandler(vData, "/Contact/Profile", SuccessFunction, ServiceFailed, false,true);
        // End
    } else {
        var URLParams = "?ContactNumber=" + CN + "&Source=ADULT";
        $.ajax({ url: WebServicePath() + "GetProfileUsingContactNumber" + URLParams, success: SuccessFunction, error: ServiceFailed });
    }
}

function DoDeDupeSearch() {
    var URLParams = "";
    var vRedFlags = "";
    var vRedFlagged = false;
    var vData = {};

    if ($("#cbo_p1_title option:selected").attr("value")) {
        URLParams += "&Title=" + $("#cbo_p1_title option:selected").attr("value");
        vRedFlags += "¬Title~" + $("#cbo_p1_title option:selected").attr("value").RemoveUnwanted();
        vData["Title"] = $("#cbo_p1_title option:selected").attr("value");
    }
    else return false;

    if ($("#cbo_p1_gender option:selected").attr("value")) {
        URLParams += "&Gender=" + $("#cbo_p1_gender option:selected").attr("value");
        vRedFlags += "¬Gender~" + $("#cbo_p1_gender option:selected").attr("value").RemoveUnwanted();
        vData["Gender"] = $("#cbo_p1_gender option:selected").attr("value");
    }
    else return false;

    if ($("#ctl00_workarea_txt_p1_surname").val()) {
        URLParams += "&Surname=" + $("#ctl00_workarea_txt_p1_surname").val();
        vRedFlags += "¬Surname~" + $("#ctl00_workarea_txt_p1_surname").val().RemoveUnwanted();
        vData["Surname"] = $("#ctl00_workarea_txt_p1_surname").val();
    }
    else return false;

    if ($("#ctl00_workarea_txt_p1_prev_surname").val()) {
        URLParams += "&PrevSurname=" + $("#ctl00_workarea_txt_p1_prev_surname").val();
        vRedFlags += "¬PrevSurname~" + $("#ctl00_workarea_txt_p1_prev_surname").val().RemoveUnwanted();
        vData["PrevSurname"] = $("#ctl00_workarea_txt_p1_prev_surname").val();
    }

    if ($("#ctl00_workarea_txt_p1_dob").val()) {
        URLParams += "&DoB=" + $("#ctl00_workarea_txt_p1_dob").val();
        vRedFlags += "¬DoB~" + $("#ctl00_workarea_txt_p1_dob").val().RemoveUnwanted();
        vData["DoB"] = $("#ctl00_workarea_txt_p1_dob").val();
    }
    else return false;

    if ($("#ctl00_workarea_cb_p1_NonUK").prop('checked')) {
        URLParams += "&Postcode=" + $("#ctl00_workarea_txt_p1_postcode").val();
        URLParams += "&NonUK=true";
        vRedFlags += "¬Postcode~" + $("#ctl00_workarea_txt_p1_postcode").val().RemoveUnwanted();
        vData["NonUK"] = "true";
        vData["Postcode"] = $("#ctl00_workarea_txt_p1_postcode").val();
    }
    else {
        if ($("#ctl00_workarea_txt_p1_postcode").val()) {
            URLParams += "&Postcode=" + $("#ctl00_workarea_txt_p1_postcode").val();
            vRedFlags += "¬Postcode~" + $("#ctl00_workarea_txt_p1_postcode").val().RemoveUnwanted();
            vData["Postcode"] = $("#ctl00_workarea_txt_p1_postcode").val();
        }
        else return false;

        if (!validatePostCode($("#ctl00_workarea_txt_p1_postcode")))
            return false;
    }

    if (!validateMinSurname($("#ctl00_workarea_txt_p1_surname")) || !validateMinSurname($("#ctl00_workarea_txt_p1_prev_surname")))
        return false;

    if (!URLParams) { return false; }

    var SuccessFunction = function (result) {
        parent.HideBusy_Popup();
        ImgPath = "../../"; 
        $("#DeDupeTH").css({ "visibility": "visible" });
        $("#AdultDeDupeSearch tr:not(:first)").remove();
        if (!pk_val("Master.Sys.REST") && result) result = result.d;
        if (result) {
            $.each($.parseJSON(result), function (idx) {
                if (idx >= parseInt(pk_val("Const.MaxRows"), 10))
                    return;
                var TRHTML = "<tr class='msTR'>";
                TRHTML += "<td class='tdData'><label>" + (this.title ? this.title : "") + " " + this.forenames + " " + this.surname + "</label></td>";
                TRHTML += "<td class='tdData' style='white-space: nowrap;'><label>" + (this.date_of_birth ? this.date_of_birth : "") + "</label></td>";
                var addr = "";

                var vRestricted = (this.visibility_status.indexOf("V") >= 0 && pk_val("CRUD.VULA").indexOf("R") < 0) ? "Y" : "";// vulnerable + no vul CRUD
                if (this.visibility_status.indexOf("F") < 0) vRestricted = 'Y';

                TRHTML += "<td class='tdData'><label>";
                if (vRestricted)
                    addr = "...";
                else {
                    if (this.address_line1 && this.address_line1 !== "Unknown") addr += this.address_line1 + " ";
                    if (this.address_line2 && this.address_line2 !== "Unknown") addr += this.address_line2 + " ";
                    if (this.address_line3 && this.address_line3 !== "Unknown") addr += this.address_line3 + " ";
                    if (this.address_line4 && this.address_line4 !== "Unknown") addr += this.address_line4 + " ";
                }

                if (this.town && this.town !== "Unknown") addr += this.town + " ";
                if (this.postcode && this.postcode !== "Unknown") addr += this.postcode + " ";
                if (this.county && this.county !== "Unknown") addr += this.county + " ";
                if (this.country && this.country !== "Unknown") addr += this.country + " ";

                TRHTML += addr + "</label></td>";
                if (!this.last_role) TRHTML += "<td class='tdData' style='white-space: nowrap;'></td>";
                else TRHTML += "<td class='tdData'><label>" + this.last_role + "</label></td>";
                    
                if (this.contact_number !== parseInt(pk_val("Master.User.CN"),10))
                    TRHTML += "<td style='text-align: right;'><input type='button' id='bn_p2_dd_" + this.contact_number + "' value='Select' style='z-index:1;width:60px;'></td>";
                else TRHTML += "<td style='text-align: right;'><input type='button' id='bn_p2_self' value='Select' style='z-index:1;width:60px;'></td>";

                TRHTML += "</tr>";
                if (this.RedFlag === "Y") { vRedFlags += "¬Duplicate id found~" + this.contact_number + "(" + this.status.iTrim() + ")"; vRedFlagged = true; }
                $("#AdultDeDupeSearch tbody").append(TRHTML);
                var vcontactNumber = this.contact_number;

                //TSA-395 - Do display but don't allow selection of Excluded/Suspended/HQ Suspended members
                //TSA-640 - Suspended statii are now wildcarded (S% && HQ%)
                if (this.status.iTrim() === "E" || this.status.iTrim().startsWith("S") || this.status.iTrim().startsWith("HQ")) {
                    var vStat = this.status.iTrim();
                    $("#bn_p2_dd_" + this.contact_number).click(function () { StopWithMessage(vcontactNumber, vStat, vRedFlags); });
                }
                else
                    $("#bn_p2_dd_" + this.contact_number).click(function () { PopulateDetails(vcontactNumber, vRestricted); });                    
            });

            $("#bn_p2_self").click(function () { $.system_alert("You cannot put yourself through adult joining."); }); 
            vRedFlags += "¬ContactNumber~" + pk_val("Master.User.CN");
            if (vRedFlagged) { $('#ctl00_workarea_txt_p6_querytext').val(vRedFlags); } else { $('#ctl00_workarea_txt_p6_querytext').val(""); }

            var rowCount = $('#AdultDeDupeSearch tr').length -1;
            if (rowCount === 1) $("#DeDupe_Title").text("Possible Matches (1 Match Found)");
            else $("#DeDupe_Title").text("Possible Matches (" + rowCount + " Matches Found)");

            $(".msTR").hover(
                function () { $(this).addClass("Grid_HL").css({ "cursor": "" }); },
                function () { $(this).removeClass("Grid_HL").css({ "cursor": "" }); }
            );
        }
        else {
            $("#DeDupe_Title").text("Possible Matches (No Records Found)");
            $("#DeDupeTH").css({ "visibility": "hidden" });
            $("#AdultDeDupeSearch tbody").append("<tr><td colspan='5'><label>You may wish to:</label><br/><br/></td></tr>");
            $("#AdultDeDupeSearch tbody").append("<tr><td colspan='3'><label>Refine your search parameters and try again.</label></td><td colspan='2'><a id='bnSearch' class='footerbuttongreen' href='#'>Search Again</a></td></tr>");
            $("#AdultDeDupeSearch tbody").append("<tr><td colspan='5'><label> - or -</label></td></tr>");
            $("#AdultDeDupeSearch tbody").append("<tr><td colspan='3'><label>Alternatively, add a new person.</label></td><td colspan='2'><a id='bnSearch2' class='footerbuttongreen' href='#'>Add New Person</a></td></tr>");

            $("#bnSearch").click(function () { MakePageVisible(1); return false; }).removeAttr("id");
            $("#bnSearch2").click(function () { InsertBlank(); return false; }).removeAttr("id");
        }

        MakePageVisible(2);
    };

    var ErrorFunction = function (result, ts, et) {
        ServiceFailed(result, ts, et, this);
        parent.HideBusy_Popup();
    };

    parent.ShowBusy_Popup('Searching for matches... Please wait.');
    GP_ClearGridArrayData("AdultDeDupeSearch");
    if (pk_val("Master.Sys.REST")) {
        // this is the code to run if using REST instead of JSON,
        // NOTE: subtally it is different.
        vData["Type"] = "ADULT";
        PostToHandler(vData, "/Search/DeDupe", SuccessFunction, ErrorFunction, false,true);
        // End
    } else {
        URLParams = "Type=ADULT" + URLParams;
        $.ajax({ url: WebServicePath() + "DeDupeSearch?" + URLParams, success: SuccessFunction, error: ErrorFunction });
    }
}

function StopWithMessage(pCN, pStatus, pSearchParams) {
    //TSA-395: New "stop" message when selecting an Excluded member

    var vData = {}; 
    vData["pRoutine"] = "ADJ_TM_REQ";
    vData["pCN"] = pk_val("Master.User.CN");
    vData["pUseCN"] = pCN;
    vData["pStatus"] = pStatus;
    vData["pNotes"] = "Search criteria used : " + pSearchParams.replaceAll('~', '¬') + "¬Search by : ContactNumber : " + pk_val("Master.User.CN");

    CallBack = function () { $.system_alert("Please Contact the Info Centre", undefined, function () { HasChanges = false; DoClose(); }, false, "Unable to Proceed"); };
    PostToHandler(vData, "/System/Funcs", CallBack, CallBack);
}

function MakePageVisible(PageNo) {
    try {
        MakeTabVisible(PageNo);
        
        if (PageNo === 6) {
            PopulateSummary();
            $('.summarybutton').css("visibility", "visible");
            $('.summaryhide').css("display", "none"); // visibility leaves the space, display means buttons goto broder..!
        }
        if (PageNo === 1) {
            $.FocusControl("#cbo_p1_title");
            $('.summarybutton').css("visibility", "hidden");
            $('.summaryhide').css({ "visibility": "visible", "display": "block-inline" });
            $("#AdultName").text("Find Adult");
        }
        if (PageNo === 2) {
            $('#LBTN1').addClass("navbutton_Disabled_Selected").data("selected", "Y");
            $("#LBTN3, #LBTN4, #LBTN5, #LBTN7, #LBTN8").css("display", "");
            $("#AdultName").text("Possible Matches");
        }
        if (PageNo === 3) $.FocusControl("#cbo_p3_title");
        if (PageNo === 4) {
            if ($.Is_FireFox()) $("#td_p4_primary").css("text-align", "center");
            $.FocusControl("#ctl00_workarea_txt_p4_postcode");
        }
        if (PageNo === 7 || PageNo === 8) { $('#LBTN6').addClass("navbutton_Disabled_Selected").data("selected", "Y"); }
        if (PageNo === 9) PopulateSummary();
        if (PageNo === 10) $('#LBTN4').addClass("navbutton_Disabled_Selected").data("selected", "Y"); 
    }
    catch (err) { }
    return false;
}

function CheckReq() { ShowRequired(this); }

function ValidatePage(PageNo) {
    vValid = true;
    if (PageNo === 4) {
        //Validate Telephone contacts
        PairedValidation("cbo_p4_tel1", "ctl00_workarea_txt_p4_tel1");
        if (!vValid) return vValid;
        PairedValidation("cbo_p4_tel2", "ctl00_workarea_txt_p4_tel2");
        if (!vValid) return vValid;
        PairedValidation("cbo_p4_tel3", "ctl00_workarea_txt_p4_tel3");
        if (!vValid) return vValid;
        if ($("#cbo_p4_tel1 option:selected").attr("value") || $("#cbo_p4_tel2 option:selected").attr("value") || $("#cbo_p4_tel3 option:selected").attr("value")) {
            if (!($('#radio_p4_tel1').prop('checked') || $('#radio_p4_tel2').prop('checked') || $('#radio_p4_tel3').prop('checked'))) {
                vValid = false;
                $.system_alert('No Primary set for telephone contacts', $('#radio_p4_tel1'));
                return vValid;
            }
            if ((!$("#cbo_p4_tel1 option:selected").attr("value") && $('#radio_p4_tel1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#cbo_p4_tel1"));
                return vValid;
            }
            if ((!$("#cbo_p4_tel2 option:selected").attr("value") && $('#radio_p4_tel2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#cbo_p4_tel2"));
                return vValid;
            }
            if ((!$("#cbo_p4_tel3 option:selected").attr("value") && $('#radio_p4_tel3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#cbo_p4_tel3"));
                return vValid;
            }
        }
        //Validate Email contacts
        PairedValidation("cbo_p4_contact_type1", "ctl00_workarea_txt_p4_email1");
        if (!vValid) return vValid;
        PairedValidation("cbo_p4_contact_type2", "ctl00_workarea_txt_p4_email2");
        if (!vValid) return vValid;
        PairedValidation("cbo_p4_contact_type3", "ctl00_workarea_txt_p4_email3");
        if (!vValid) return vValid;
        if ($("#cbo_p4_contact_type1 option:selected").attr("value") || $("#cbo_p4_contact_type2 option:selected").attr("value") || $("#cbo_p4_contact_type3 option:selected").attr("value")) {
            if (!($('#radio_p4_email1').prop('checked') || $('#radio_p4_email2').prop('checked') || $('#radio_p4_email3').prop('checked'))) {
                vValid = false;
                $.system_alert('No Primary set for Email contacts', $("#cbo_p4_contact_type1"));
                return vValid;
            }
            if ((!$("#cbo_p4_contact_type1 option:selected").attr("value") && $('#radio_p4_email1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#cbo_p4_contact_type1"));
                return vValid;
            }
            if ((!$("#cbo_p4_contact_type2 option:selected").attr("value") && $('#radio_p4_email2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#cbo_p4_contact_type2"));
                return vValid;
            }
            if ((!$("#cbo_p4_contact_type3 option:selected").attr("value") && $('#radio_p4_email3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#cbo_p4_contact_type3"));
                return vValid;
            }
        }

        //Validate Social Media contacts
        PairedValidation("cbo_p4_socmed1", "ctl00_workarea_txt_p4_socmed1");
        if (!vValid) return vValid;
        PairedValidation("cbo_p4_socmed2", "ctl00_workarea_txt_p4_socmed2");
        if (!vValid) return vValid;
        PairedValidation("cbo_p4_socmed3", "ctl00_workarea_txt_p4_socmed3");
        if (!vValid) return vValid;

    }
    if (PageNo === 6) return true;
    if (PageNo === 5) {
        $("#tbl_p5_disabilities tr :last").each(function () {
            if (!$(":selected", this).attr("value") && $(".DisTXT", this).val()) {
                vValid = false;
                $.system_alert('No usage entered for description ' + $(".DisTXT", this).val(), $(".DisCBO", this));
                return vValid;
            }
        });
        var xtext = "";
        $("#disabilities_body tr").each(function () { if ($(".DisCBO", this).val()) xtext += $(".DisCBO", this).val() + "~" + $(".DisTXT", this).val().RemoveUnwanted() + "¬"; });
        $('#ctl00_workarea_lst_p5_hiddendata').val(xtext);
    }
    else
        if (PageNo === 7) {
            $("#tbl_p7_qualifications tr :last").each(function () {
                if (!$(":selected", this).attr("value") && $(".QualTXT", this).val()) {
                    vValid = false;
                    $.system_alert('No usage entered for description ' + $(".QualTXT", this).val(), $(".QualCBO", this));
                    return vValid;
                }
            });
            var xtext1 = "";
            $("#qualifications_body tr").each(function () { if ($(".QualCBO", this).val()) xtext1 += $(".QualCBO", this).val() + "~" + $(".QualTXT", this).val().RemoveUnwanted() + "¬"; });
            $('#ctl00_workarea_lst_p7_hiddendata').val(xtext1);
        }
        else
            if (PageNo === 8) {
                $("#tbl_p8_hobbies tr :last").each(function () {
                    if (!$(":selected", this).attr("value") && $(".HobbyTXT", this).val()) {
                        vValid = false;
                        $.system_alert('No usage entered for description ' + $(".HobbyTXT", this).val(), $(".HobbyCBO", this));
                        return vValid;
                    }
                });
            }
            else
            $('input,select', $('#mpage' + PageNo)).each(CheckReq);
    return vValid;
}

function PopulateSummary() {
    $(".summary").each(function () {
        var xtext = "";
        var sep = $(this).data("seperator") || "";
        var pref = $(this).data("pref") || "";
        var title = "";
        if ($(this).attr("title")) title = $(this).attr("title");
        if ($(this).data("link")) {
            var parts = $(this).data("link").split(","), i, l;

            if ($(this).data("flds")) {
                var index = $("#tbl_p6_summary tr").index($(this).closest("tr"));
                $(".tmp" + $(this).attr("id")).remove();
                var xhtml = "";
                var j = 1;
                for (i = 0, l = parts.length; i < l; i += 1) {
                    if ($(parts[i]).val() || $("option:selected", parts[i]).attr("value") || $(parts[i]).attr("type") === "radio" || $(parts[i]).attr("type") === "checkbox") { xtext += SummaryString($(parts[i])) + sep; }
                    if (xtext.replace(/^\s\s*/,'').replace(/\s\s*$/,'') !== "- MAIN") {
                        if (j++ === parseInt($(this).data("flds"),10)) {
                            var lines = xtext.split("\n");
                            for (ii = 0, ll = lines.length; ii < ll; ii += 1) {
                                if (lines[ii].replace(/^\s\s*/,'').replace(/\s\s*$/,'')) {
                                    xhtml += "<tr class='tmp" + $(this).attr("id") + "'><td><label>" + title + "</label></td><td colspan='2'><input class='summary' type='text' style='width:400px;border:none; background-color:transparent;' readonly='readonly' value='" + lines[ii] + "'></td></tr>";
                                    title = "";
                                }
                            }
                            j = 1; xtext = "";
                        }
                    }
                }
                if (xhtml) $('#tbl_p6_summary > tbody > tr').eq(index).after(xhtml); index++;
                return;
            }
            else {
                for (i = 0, l = parts.length; i < l; i += 1) {
                    if ($(parts[i]).val() || $(parts[i]).attr("type") === "radio" || $(parts[i]).attr("type") === "checkbox") { xtext += SummaryString($(parts[i])) + sep; }
                }
            }
        }
        else if ($(this).attr("id") === "tr_p6_specialNeeds") {

            var MyData = "";
            var index1 = $("#tbl_p6_summary tr").index(this); $(".tmpDis").remove();
            $("#tbl_p5_disabilities tr").not(':first').not(':last').each(function () {
                if ($(":selected", this).attr("value")) {
                    var xhtml = "<tr class='tmpDis'><td colspan='3'><label>" + $(":selected", this).text() + "</label><input class='summary' type='text' style='float:right;width:450px;border:none; background-color:transparent;margin-top:0px;' readonly='readonly' value='" + $(".DisTXT", this).val().HTMLQuotes() + "'></td></tr>";
                    $('#tbl_p6_summary > tbody > tr').eq(index1).after(xhtml); index++;
                    MyData += $(":selected", this).attr("value") + "~" + $(".DisTXT", this).val().RemoveUnwanted() + "¬"; // make separators unique
                }
            });
            $("#ctl00_workarea_txt_p6_Specialneedsformatted").val(MyData);
            return;
        }
        else if ($(this).attr("id") === "tr_p6_qualifications") {

            var MyData1 = "";
            var index2 = $("#tbl_p6_summary tr").index(this); $(".tmpQual").remove();
            $("#tbl_p7_qualifications tr").not(':first').not(':last').each(function () {
                if ($(":selected", this).val()) {
                    var xhtml = "<tr class='tmpQual'><td colspan='3'><label>" + $(":selected", this).text() + "</label><input class='summary' type='text' style='float:right;width:450px;border:none; background-color:transparent;margin-top:0px;' readonly='readonly' value='" + $(".QualTXT", this).val().HTMLQuotes() + "'></td></tr>";
                    $('#tbl_p6_summary > tbody > tr').eq(index2).after(xhtml); index++;
                    MyData1 += $(":selected", this).attr("value") + "~" + $(".QualTXT", this).val().RemoveUnwanted() + "¬"; // make separators unique
                }
            });
            $("#ctl00_workarea_txt_p6_qualificationsformatted").val(MyData1);
            return;
        }
        else if ($(this).attr("id") === "tr_p6_hobbies") {

            var MyData2 = "";
            var index3 = $("#tbl_p6_summary tr").index(this); $(".tmpHobby").remove();
            $("#tbl_p8_hobbies tr").not(':first').not(':last').each(function () {
                if ($(":selected", this).attr("value")) {
                    var xhtml = "<tr class='tmpHobby'><td colspan='3'><label>" + $(":selected", this).text() + "</label><input type='text' class='summary' style='float:right;width:450px;border:none; background-color:transparent;margin-top:0px;' readonly='readonly' value='" + $(".HobbyTXT", this).val().HTMLQuotes() + "'></td></tr>";
                    $('#tbl_p6_summary > tbody > tr').eq(index3).after(xhtml); index++;
                    MyData2 += $(":selected", this).attr("value") + "~" + $(".HobbyTXT", this).val().RemoveUnwanted() + "¬"; // make separators unique
                }
            });
            $("#ctl00_workarea_txt_p6_hobbiesformatted").val(MyData2);
            return;
        }

        if (xtext) { xtext = xtext.substr(0, xtext.length - sep.length); }
        if (xtext === " - MAIN") { xtext = ""; }
        if (pref) { xtext = pref + xtext; }
        if (xtext) {
            $(this).val(xtext.replace(/¬/g, "\n"));
            if (this.type === "textarea") { this.rows = this.value.split('\n').length; }
        }
    });    
}

function SummaryString(self) {
    var vtext = $(self).val();
    if ($(self).attr("type") === "checkbox") {
        if ($(self).is(':checked')) { vtext = 'YES'; } else { vtext = 'NO'; }
        return vtext;
    }

    if ($(self).attr("type") === "radio") {
        if ($(self).is(':checked')) {
            vtext = ' - MAIN';
            if ($(self).attr("id") === "radio_p4_tel1") $("#ctl00_workarea_h_tel_main").val("1");
            if ($(self).attr("id") === "radio_p4_tel2") $("#ctl00_workarea_h_tel_main").val("2");
            if ($(self).attr("id") === "radio_p4_tel3") $("#ctl00_workarea_txt_p6_telp4hmain").val("3");
            if ($(self).attr("id") === "radio_p4_email1") $("#ctl00_workarea_h_em_main").val("1");
            if ($(self).attr("id") === "radio_p4_email2") $("#ctl00_workarea_h_em_main").val("2");
            if ($(self).attr("id") === "radio_p4_email3") $("#ctl00_workarea_h_em_main").val("3");
        } else { vtext = ''; }
        return vtext;
    }

    if ($(self).is("select")) {
        vtext = $("option:selected", self).text();

        if ($(self).attr("id") === "cbo_p4_tel1" && vtext !== " ") { vtext = "(" + vtext + ")"; }
        if ($(self).attr("id") === "cbo_p4_tel2" && vtext !== " ") { vtext = "(" + vtext + ")"; }
        if ($(self).attr("id") === "cbo_p4_tel3" && vtext !== " ") { vtext = "(" + vtext + ")"; }
        if ($(self).attr("id") === "cbo_p4_contact_type1" && vtext !== " ") { vtext = "(" + vtext + ")"; }
        if ($(self).attr("id") === "cbo_p4_contact_type2" && vtext !== " ") { vtext = "(" + vtext + ")"; }
        if ($(self).attr("id") === "cbo_p4_contact_type3" && vtext !== " ") { vtext = "(" + vtext + ")"; }
        if ($(self).attr("id") === "cbo_p4_socmed1" && vtext !== " ") { vtext = "(" + vtext + ")"; }
        if ($(self).attr("id") === "cbo_p4_socmed2" && vtext !== " ") { vtext = "(" + vtext + ")"; }
        if ($(self).attr("id") === "cbo_p4_socmed3" && vtext !== " ") { vtext = "(" + vtext + ")"; }
    }

    if ($(self).attr("id") === "ctl00_workarea_txt_p3_known_as") { vtext = "(" + vtext + ")"; }    
    if ($(self).attr("id") === "ctl00_workarea_txt_p4_postcode") { vtext = vtext.toUpperCase(); }

    // trim start spaces
    while (vtext && vtext[0] === " ")
        vtext = vtext.replace(" ", ""); // only does forst space

    return vtext;
}

function SaveForm(SaveButtons) {
    //PL 06.08.14  TSA ref 1178 "Missing Requests for Task Manager"
    //Don't lose the "NEW" marker if adding a new record
    if ($("#cbo_p3_title").data('ng_id'))
        $("#ctl00_workarea_h_pk").val($("#cbo_p3_title").data('ng_id'));
    $("#ctl00_workarea_h_addr_pk").val($("#ctl00_workarea_txt_p4_addressline1").data('ng_id'));
    $("#ctl00_workarea_h_em1_pk").val($("#cbo_p4_contact_type1").data('ng_id'));
    $("#ctl00_workarea_h_em2_pk").val($("#cbo_p4_contact_type2").data('ng_id'));
    $("#ctl00_workarea_h_em3_pk").val($("#cbo_p4_contact_type3").data('ng_id'));
    $("#ctl00_workarea_h_tel1_pk").val($("#cbo_p4_tel1").data('ng_id'));
    $("#ctl00_workarea_h_tel2_pk").val($("#cbo_p4_tel2").data('ng_id'));
    $("#ctl00_workarea_h_tel3_pk").val($("#cbo_p4_tel3").data('ng_id'));
    $("#ctl00_workarea_h_sm1_pk").val($("#cbo_p4_socmed1").data('ng_id'));
    $("#ctl00_workarea_h_sm2_pk").val($("#cbo_p4_socmed2").data('ng_id'));
    $("#ctl00_workarea_h_sm3_pk").val($("#cbo_p4_socmed3").data('ng_id'));

    $("#ctl00_workarea_h_cbo_p3_title").val($("#cbo_p3_title option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_ethnicity").val($("#cbo_p3_ethnicity option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_gender").val($("#cbo_p3_gender option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_occupation").val($("#cbo_p3_occupation option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_country").val($("#cbo_p4_country option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_contact_type1").val($("#cbo_p4_contact_type1 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_contact_type2").val($("#cbo_p4_contact_type2 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_contact_type3").val($("#cbo_p4_contact_type3 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_tel1").val($("#cbo_p4_tel1 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_tel2").val($("#cbo_p4_tel2 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_tel3").val($("#cbo_p4_tel3 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_socmed1").val($("#cbo_p4_socmed1 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_socmed2").val($("#cbo_p4_socmed2 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p4_socmed3").val($("#cbo_p4_socmed3 option:selected").attr("value"));

  if (SaveFormCheck(SaveButtons)) {    
        //Issue #864 - duplicate save message after cancelling DP message and pressing save again
        $.system_confirm(AdultJoining_DataProtection_Message.format(AdultJoiningPath),
           function () {
               MakeFormReadonlyForSave("input[type='button']");
               __doPostBack('ctl00$footer$bnSave1', ''); 
           },
           function () { 
               SaveHasBeenPressed = false; 
               //$(SaveButtons).off("click"); 
           },
           false, "Before you finish");
    }

    return false;
}

function ChangePage(FromPageNo, ToPageNo) {
    if (ValidatePage(FromPageNo)) {
        if (FromPageNo === 1 && ToPageNo === 2)
            DoDeDupeSearch();
        else
            MakePageVisible(ToPageNo);
    }
    return false;
}

function ResetPage(PageNo, From3Click) {
    if (PageNo === 5) { $("#tbl_p5_disabilities .DisDBN").each(RemoveDisability); return false; }
    if (PageNo === 7) { $("#tbl_p7_qualifications .QualDBN").each(RemoveQualification); return false; }
    if (PageNo === 8) { $("#tbl_p8_hobbies .HobbyDBN").each(RemoveHobby); return false; }

    if (PageNo === 3 && From3Click) {
        if ($("#cbo_p3_title").data('ng_id'))
            $("input,select,textarea", $("#mpage" + PageNo)).not("#bn_p3_EditHonors, #ctl00_workarea_txt_p3_membno,#cbo_p3_title,#cbo_p3_gender,#ctl00_workarea_txt_p3_surname,#ctl00_workarea_txt_p3_dob,#ctl00_workarea_txt_p3_forenames,#ctl00_workarea_txt_p3_doj").val('');
        else
            $("input,select,textarea", $("#mpage" + PageNo)).not("#bn_p3_EditHonors, #ctl00_workarea_txt_p3_membno,#cbo_p3_title,#cbo_p3_gender,#ctl00_workarea_txt_p3_surname,#ctl00_workarea_txt_p3_dob").val('');

        GetAdultDisplayName();
    }
    else
        $("input,select,textarea", $("#mpage" + PageNo)).val('');

    ResetRequired('#mpage' + PageNo);

    if (PageNo === 3) {
        $("#ctl00_workarea_cb_p3_giftaid").prop('checked', false);
        if (!From3Click) $("#cbo_p3_title").data('ng_id', '');
    }
    if (PageNo === 4) {
        $('#radio_p4_tel1,#radio_p4_socmed1,#radio_p4_email1').prop('checked', false);
        $("#ctl00_workarea_txt_p4_addressline1").data('ng_id', '');
        $("#cbo_p4_contact_type1").data('ng_id', '');
        $("#cbo_p4_contact_type2").data('ng_id', '');
        $("#cbo_p4_contact_type3").data('ng_id', '');
        $("#cbo_p4_tel1").data('ng_id', '');
        $("#cbo_p4_tel2").data('ng_id', '');
        $("#cbo_p4_tel3").data('ng_id', '');
        $("#cbo_p4_socmed1").data('ng_id', '');
        $("#cbo_p4_socmed2").data('ng_id', '');
        $("#cbo_p4_socmed3").data('ng_id', '');
    }
    return false;
}

function GetAdultDisplayName() {
    $("#AdultName").text($("#ctl00_workarea_txt_p3_membno").val() + " " + $("#ctl00_workarea_txt_p3_forenames").val() + " " + $("#ctl00_workarea_txt_p3_surname").val());
}

function EditHonors(self) {
    if ($(self).prop("value") === "Hide") {
        $("#div_p3_EditHonors").slideUp(300);
        $(self).prop('value', $("#ctl00_workarea_txt_p3_honours").val() ? 'Edit' : "Add");
        $(".HonorsTD").css({ "border": "" });
    }
    else {
        $("#div_p3_EditHonors").slideDown(300);
        $(self).prop('value', 'Hide');
        $(".HonorsTD").css({ "border": "solid", "border-width": "thin" });
    }
}

function CheckEmails() {
    if ($("#cbo_p4_contact_type1 option:selected").attr("value") === pk_val("Const.NOEMAILVALUE")) {
        //set default 'no email' text in email addr 1 and disable both it and all the other email fields

        $("#radio_p4_email1").prop("checked", true);
        $(".noEmail").attr("disabled", "disabled").val("");
        $("#ctl00_workarea_txt_p4_email1").val(pk_val("Const.NOEMAILDESC"));
        $("#ctl00_workarea_h_em_main").val("1");
    }
    else {
        $(".noEmail").removeAttr("disabled");

        if ($("#ctl00_workarea_txt_p4_email1").val() === pk_val("Const.NOEMAILDESC")) $("#ctl00_workarea_txt_p4_email1").val("");

        if (!$("#cbo_p4_contact_type2 option:selected").attr("value") && !$("#cbo_p4_contact_type3 option:selected").attr("value")) {
            //if no email type selected in 2 or 3, ensure we have a 'no email' option in 1
            if ($("#cbo_p4_contact_type1 option[value='" + pk_val("Const.NOEMAILVALUE") + "']").length === 0)
                $("#cbo_p4_contact_type1").append("<option value='" + pk_val("Const.NOEMAILVALUE") + "'>" + pk_val("Const.NOEMAILTEXT") + "</option>");
        }
        else {
            //if 2 or 3 has an email type selected, 'no email' should not be an option in 1
            $("#cbo_p4_contact_type1 option[value='" + pk_val("Const.NOEMAILVALUE") + "']").remove();
        }
    }
    ResetRequired("#mpage4");
    SetEnabled();
}

//#region Disabilities

function AddDisability(value) {
    if (value) {
        $('.DisTXT').last().val(value.Details);
        $('.DisCBO').last().val(value.LookupValue).trigger("change");
    }
    else {
        $(".DisDBN").css({ "visibility": "visible" });
        $("#tbl_p5_disabilities").append("<tr>" + $("#tbl_p5_disabilities tr").last().html() + "</tr>");
        PopulateGridDiscCBO();        
    }
}

function DisCHANGE() {
    var self = this;
    $("#tbl_p5_disabilities tr:not(:first)").not(':last').each(function () {
        if ($(":selected", this).attr("value") === $(self).val() && $(":selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
            $.system_alert('This disability has already been used', $(".DisCBO", $(self)));
            if ($(".DisCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else $(self).val($(self).data("orig"));
            return;
        }
    });
    if ($(self).val()) { $(".DisCBO option[value='']", $(self).parent()).remove(); $(self).data("orig", $(self).val()); }
    if ($('.DisCBO', $("#tbl_p5_disabilities tr:eq(" + ($("#tbl_p5_disabilities tr").length - 1) + ")")).val()) AddDisability();
}

function PopulateGridDiscCBO() {
    $('.DisCBO').last().html($("#cbo_p5_disability").html()).removeData("ng_id");
    $('.DisTXT').last().val("");
    PopulateDisEvents();
}

function RemoveDisability() {
    if ($("#tbl_p5_disabilities tr").not(":first").length === 1)
        $(".DisTXT,.DisCBO", $(this).closest("tr")).val("");
    else
        $(this).closest("tr").remove();
}

function PopulateDisEvents() {
    $(".DisCBO").last().change(DisCHANGE).closest("tr").addClass("msTR");
    $(".DisDBN").last().click(RemoveDisability).css({ "visibility": "hidden" });
}

//#endregion

//#region Quals

function AddQualification(value) {
    if (value) {
        $('.QualTXT').last().val(value.Details);
        $('.QualCBO').last().val(value.LookupValue).trigger("change");
    }
    else {
        $(".QualDBN").css({ "visibility": "visible" });
        $("#tbl_p7_qualifications").append("<tr>" + $("#tbl_p7_qualifications tr").last().html() + "</tr>");
        PopulateGridQualCBO();        
    }
}

function QualCHANGE() {
    var self = this;
    $("#tbl_p7_qualifications tr:not(:first)").not(':last').each(function () {
        if ($(":selected", this).attr("value") === $(self).val() && $(":selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
            $.system_alert('This qualification has already been used', $(".QualCBO", $(self)));
            if ($(".QualCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else $(self).val($(self).data("orig"));
            return;
        }
    });
    if ($(self).val()) { $(".QualCBO option[value='']", $(self).parent()).remove(); $(self).data("orig", $(self).val()); }
    if ($('.QualCBO', $("#tbl_p7_qualifications tr:eq(" + ($("#tbl_p7_qualifications tr").length - 1) + ")")).val()) AddQualification();
}

function PopulateGridQualCBO() {
    $('.QualCBO').last().html($("#cbo_p7_qualification").html()).removeData("ng_id");
    $('.QualTXT').last().val("");
    PopulateQualEvents();
}

function RemoveQualification() {
    if ($("#tbl_p7_qualifications tr").not(":first").length === 1)
        $(".QualTXT,.QualCBO", $(this).closest("tr")).val("");
    else
        $(this).closest("tr").remove();
}

function PopulateQualEvents() {
    $(".QualCBO").last().change(QualCHANGE).closest("tr").addClass("msTR");
    $(".QualDBN").last().click(RemoveQualification).css({ "visibility": "hidden" });
}

//#endregion

//#region Hobby

function AddHobby(value) {
    if (value) {
        $('.HobbyTXT').last().val(value.Details);
        $('.HobbyCBO').last().val(value.LookupValue).trigger("change");
    }
    else {
        $(".HobbyDBN").css({ "visibility": "visible" });
        $("#tbl_p8_hobbies").append("<tr>" + $("#tbl_p8_hobbies tr").last().html() + "</tr>");
        PopulateGridHobbyCBO();        
    }
}

function HobbyCHANGE() {
    var self = this;
    $("#tbl_p8_hobbies tr:not(:first)").not(':last').each(function () {
        if ($(":selected", this).attr("value") === $(self).val() && $(":selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
            $.system_alert('This hobby has already been used', $(":selected", $(self)));
            if ($(".HobbyCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else $(self).val($(self).data("orig"));
            return;
        }
    });
    if ($(self).val()) { $(".HobbyCBO option[value='']", $(self).parent()).remove(); $(self).data("orig", $(self).val()); }
    if ($('.HobbyCBO', $("#tbl_p8_hobbies tr:eq(" + ($("#tbl_p8_hobbies tr").length - 1) + ")")).val()) AddHobby();
}

function PopulateGridHobbyCBO() {
    $('.HobbyCBO').last().html($("#cbo_p8_hobby").html()).removeData("ng_id");
    $('.HobbyTXT').last().val("");
    PopulateHobbyEvents();
}

function RemoveHobby() {
    if ($("#tbl_p8_hobbies tr").not(":first").length === 1)
        $(".HobbyTXT,.HobbyCBO", $(this).closest("tr")).val("");
    else
        $(this).closest("tr").remove();
}

function PopulateHobbyEvents() {
    $(".HobbyCBO").last().change(HobbyCHANGE).closest("tr").addClass("msTR");
    $(".HobbyDBN").last().click(RemoveHobby).css({ "visibility": "hidden" });
}

//#endregion