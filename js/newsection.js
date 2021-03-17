$(document).ready(FormReady);
var vCurrentPageNo = 1;
var vLoadingCN = false;

function FormReady() {
    SetUpPage(pk_val("Page.IsReadonly"), IsInsertMode());

    ValidateType("#ctl00_workarea_cbo_p1_type");
    setAddressPrimarys();

    if (pk_val("Page.NG_ID")) {
        $("#LBTN1").click(function () { ChangePage(vCurrentPageNo, 1, true); });
        $("#LBTN2").click(function () { ChangePage(vCurrentPageNo, 2, true); });
        $("#LBTN3").click(function () { ChangePage(vCurrentPageNo, 3, true); });
        $("#LBTN4").click(function () { ChangePage(vCurrentPageNo, 4, true); });
    }

    $("#bnNext1").click(function () { return ChangePage(vCurrentPageNo, 2); });
    $("#bnNext2").click(function () { return ChangePage(vCurrentPageNo, 3); });
    $("#bnNext3").click(function () { return ChangePage(vCurrentPageNo, 4); });

    $("#bnPrev2").click(function () { return MakePageVisible(1); });
    $("#bnPrev3").click(function () { return PrevPageClick(vCurrentPageNo, 2, ValidatePage, MakePageVisible, ResetPage); });
    $("#bnPrev4").click(function () { return MakePageVisible(3); });

    //#region Optimisations

    // countries
    Opt_GetCBO("#ctl00_workarea_h_cbo_p1_maddrcountry", "--- Select Country ---", "#ctl00_workarea_cbo_p1_maddrcountry,#ctl00_workarea_cbo_p1_caddrcountry", 4);
    // Email
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_contact_type1", "--- Select ---", "#ctl00_workarea_cbo_p3_contact_type1,#ctl00_workarea_cbo_p3_contact_type2,#ctl00_workarea_cbo_p3_contact_type3", 7);
    // Phone
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_tel1", "--- Select ---", "#ctl00_workarea_cbo_p3_tel1,#ctl00_workarea_cbo_p3_tel2,#ctl00_workarea_cbo_p3_tel3", 4);
    // SocMedia
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_socmed1", "--- Select ---", "#ctl00_workarea_cbo_p3_socmed1,#ctl00_workarea_cbo_p3_socmed2,#ctl00_workarea_cbo_p3_socmed3", 4);

    $("#ctl00_workarea_cbo_p1_maddrcountry,#ctl00_workarea_cbo_p1_caddrcountry,#ctl00_workarea_cbo_p3_socmed1,#ctl00_workarea_cbo_p3_socmed2,#ctl00_workarea_cbo_p3_socmed3,#ctl00_workarea_cbo_p3_tel1,#ctl00_workarea_cbo_p3_tel2,#ctl00_workarea_cbo_p3_tel3,#ctl00_workarea_cbo_p3_contact_type1,#ctl00_workarea_cbo_p3_contact_type2,#ctl00_workarea_cbo_p3_contact_type3").each(function () { $(this).resetDB(); });

    //#endregion

    // set page access
    if (vIsReadonly) {
        $(".AddressLookupButton,.CopyButton").remove();
        $("#lbl_p1_lodge6patrols").remove();

        $("#ctl00_workarea_txt_p3_tel1,#ctl00_workarea_txt_p3_tel2,#ctl00_workarea_txt_p3_tel3").css("width", "200px");
        $("#ctl00_workarea_txt_p3_email1,#ctl00_workarea_txt_p3_email2,#ctl00_workarea_txt_p3_email3").css("width", "200px");
        $("#ctl00_workarea_txt_p3_webaddr1,#ctl00_workarea_txt_p3_webaddr2,#ctl00_workarea_txt_p3_webaddr3").css("width", "300px");
    }
    else {
        $("#bnReset1").click(function () { return ResetPage(1); });
        $("#bnReset3").click(function () { return ResetPage(3); });
        $("#bnReset4").click(function () { return ResetPage(4); });

        $("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnSave4").attr("href", "#").click(ClientSave);

        $("input,select").change(CheckReq);

        // Page 1
        $("#ctl00_workarea_txt_p1_date_registered").blur(function () { Date_TextBox_Blur(this); });
        $("#bn_p1_date_registered").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p1_date_registered'); });

        $(".CopyButton").click(function () {
            CopyAddressClick('#ctl00_workarea_txt_p1_caddr', '#ctl00_workarea_txt_p1_maddr');
            ShowRequired("#ctl00_workarea_txt_p1_caddrline1", !$("#ctl00_workarea_txt_p1_caddrline1").val());
            ShowRequired("#ctl00_workarea_txt_p1_caddrtown", !$("#ctl00_workarea_txt_p1_caddrtown").val());
            ShowRequired("#ctl00_workarea_cbo_p1_caddrcountry", !$("#ctl00_workarea_cbo_p1_caddrcountry option:selected").attr("value"));
            ShowRequired("#ctl00_workarea_txt_p1_caddrpcode", !$("#ctl00_workarea_txt_p1_caddrpcode").val());
        });

        $("#bn_p1_QASLookup").click(function () { GetPAF('ctl00_workarea_txt_p1_maddrline1¬ctl00_workarea_txt_p1_maddrline2¬ctl00_workarea_txt_p1_maddrline3¬ctl00_workarea_txt_p1_maddrtown¬ctl00_workarea_txt_p1_maddrcounty¬ctl00_workarea_txt_p1_maddrpcode¬ctl00_workarea_cbo_p1_maddrcountry', 'ctl00_workarea_txt_p1_maddrpcode', 5, 1); });
        $("#bn_p1_QASLookup2").click(function () { GetPAF('ctl00_workarea_txt_p1_caddrline1¬ctl00_workarea_txt_p1_caddrline2¬ctl00_workarea_txt_p1_caddrline3¬ctl00_workarea_txt_p1_caddrtown¬ctl00_workarea_txt_p1_caddrcounty¬ctl00_workarea_txt_p1_caddrpcode¬ctl00_workarea_cbo_p1_caddrcountry', 'ctl00_workarea_txt_p1_caddrpcode', 5, 1); });

        $("#ctl00_workarea_txt_p1_maddrpcode").blur(function () { return validatePostCode($("#ctl00_workarea_txt_p1_maddrpcode"), $('#ctl00_workarea_cbo_p1_maddrcountry option:selected').attr("value") !== 'UK'); });
        $("#ctl00_workarea_cbo_p1_maddrcountry").change(function () { return validatePostCode($("#ctl00_workarea_txt_p1_maddrpcode"), $('#ctl00_workarea_cbo_p1_maddrcountry option:selected').attr("value") !== 'UK'); });

        $("#ctl00_workarea_txt_p1_caddrpcode").blur(function () { return validatePostCode($("#ctl00_workarea_txt_p1_caddrpcode"), $('#ctl00_workarea_cbo_p1_caddrcountry option:selected').attr("value") !== 'UK'); });
        $("#ctl00_workarea_cbo_p1_caddrcountry").change(function () { return validatePostCode($("#ctl00_workarea_txt_p1_caddrpcode"), $('#ctl00_workarea_cbo_p1_caddrcountry option:selected').attr("value") !== 'UK'); });

        $("#ctl00_workarea_txt_p1_capacity").keypress(function (e) { return NumberOnly_KeyPress(e || event); }).css("width", "100px").blur(function () { NumberOnly_Blur(this, true); });
        $("#ctl00_workarea_cbo_p1_type").change(function (e) { ValidateType(this); });

        $("#ctl00_workarea_cbo_p1_Sectiontype").change(function () {
            var vSel = $("#ctl00_workarea_cbo_p1_Sectiontype option:selected").attr("value");
            if ((vSel === "SEA" || vSel === "AIR") && HasAccess(pk_val("CRUD.RS"), "R"))
                $("#LBTN2").css({ "display": "block" });
            else
                $("#LBTN2").css({ "display": "none" });
        });

        // page 2
        if (HasAccess(pk_val("CRUD.RS"), "U")) {
            $("#ctl00_workarea_txt_p2_date_registered").blur(function () { Date_TextBox_Blur(this); });
            $("#bn_p2_date_registered").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p2_date_registered'); });

            $("#ctl00_workarea_txt_p2_inspection_date").blur(function () { Date_TextBox_Blur(this); });
            $("#bn_p2_inspection_date").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p2_inspection_date'); });

            $("#bnReset2").click(function () { return ResetPage(2); });
        }

        // page 3
        $("#bn_p3_memberno").click(LookupMemberNo);
        $("#ctl00_workarea_txt_p3_memberno").blur(CheckMemberNo).keypress(function (e) { return NumberOnly_KeyPress(e || event, function (e) { $('#ctl00_workarea_txt_p3_memberno').trigger('blur'); }); });

        $("#ctl00_workarea_txt_p3_tel1,#ctl00_workarea_txt_p3_tel2,#ctl00_workarea_txt_p3_tel3").keypress(function (e) { return NumberOnly_KeyPress(e || event, null); }).css("width", "200px").blur(function () { validatePhone(this); });
        $("#ctl00_workarea_txt_p3_email1,#ctl00_workarea_txt_p3_email2,#ctl00_workarea_txt_p3_email3").blur(function () { validateEmail(this); }).css("width", "200px").attr("placeholder", "me@example.com");
        $("#ctl00_workarea_txt_p3_webaddr1,#ctl00_workarea_txt_p3_webaddr2,#ctl00_workarea_txt_p3_webaddr3").blur(function () { return validateWebAddress(this); }).css("width", "300px");

        $("#ctl00_workarea_txt_p3_email1").change(function () {
            if (!($('#radio_p3_email1').prop('checked') || $('#radio_p3_email2').prop('checked') || $('#radio_p3_email3').prop('checked'))) {
                $('#radio_p3_email1').prop('checked', true);
            }
        });

        $("#ctl00_workarea_txt_p3_tel1").change(function () {
            if (!($('#radio_p3_tel1').prop('checked') || $('#radio_p3_tel2').prop('checked') || $('#radio_p3_tel3').prop('checked'))) {
                $('#radio_p3_tel1').prop('checked', true);
            }
        });

        $("#ctl00_workarea_txt_p3_webaddr1").change(function () {
            if (!($('#radio_p3_web1').prop('checked') || $('#radio_p3_web2').prop('checked') || $('#radio_p3_web3').prop('checked'))) {
                $('#radio_p3_web1').prop('checked', true);
            }
        });

        $("#bnAddressBack").click(function () { AddressBack(); return false; });

        ResetRequired('#mpage3');
    }

    if ($("#ctl00_workarea_txt_p3_memberno").val())
        $("#ctl00_workarea_txt_p3_membername").show();

    $("#ctl00_workarea_txt_p3_socmed1,#ctl00_workarea_txt_p3_socmed2,#ctl00_workarea_txt_p3_socmed3").css("width", "200px");
    $("#ctl00_workarea_cbo_p3_socmed1,#ctl00_workarea_cbo_p3_socmed2,#ctl00_workarea_cbo_p3_socmed3,#ctl00_workarea_cbo_p3_tel1,#ctl00_workarea_cbo_p3_tel2,#ctl00_workarea_cbo_p3_tel3,#ctl00_workarea_cbo_p3_contact_type1,#ctl00_workarea_cbo_p3_contact_type2,#ctl00_workarea_cbo_p3_contact_type3").css("width", "100px");

    if (!HasAccess(pk_val("CRUD.RS"), "R")) {
        $("#LBTN2").css({ "display": "none" });

    }
    if (!HasAccess(pk_val("CRUD.RS"), "U")) {
        $(".RESET", $("#fpage2")).remove();
        $("input,select", $("#mpage2")).attr("readonly", "readonly");
        $("select", $("#mpage2")).attr("disabled", "disabled");
        $(".DateLookupButton", $("#mpage2")).remove();
    }

    if (IsInsertMode())
    {
        $(".QuickSearchButton", $("#mpage3")).remove();
        $("#ctl00_workarea_txt_p3_memberno").remove();
        $("#ctl00_workarea_txt_p3_membername").val("There are no contacts at this location yet.").show();

        $(".footerbuttongreen.EDITBN").not("#ctl00_footer_bnSave4").remove();
        $("#ctl00_footer_bnSave4").show();
    }

    $("#ctl00_workarea_cbo_p1_Sectiontype").trigger("change");
    $("#mpage1 .InputLessspace").not("select, #ctl00_workarea_txt_p1_maddrpcode, #ctl00_workarea_txt_p1_caddrpcode").css("width", "230px");
    $(".tdCommSpacer").css("width", "50px");
    $("#ctl00_workarea_txt_p4_schedule").autosize(20);
    $("#ctl00_workarea_txt_p4_times").autosize(20);

    ResetRequired('#mpage1');
    SetEnabled();
    setTimeout(function () { MakePageVisible(1); },600);
    HasChanges = false;

    ShowOriginalSet(); // simple debug routine for checking if orig DB value is set.
}

function setAddressPrimarys() {
    $('#radio_p3_tel1').prop('checked', ($("#ctl00_workarea_txt_p3_telmain").val() === "1"));
    $('#radio_p3_tel2').prop('checked', ($("#ctl00_workarea_txt_p3_telmain").val() === "2"));
    $('#radio_p3_tel3').prop('checked', ($("#ctl00_workarea_txt_p3_telmain").val() === "3"));
    $('#radio_p3_email1').prop('checked', ($("#ctl00_workarea_txt_p3_emailmain").val() === "1"));
    $('#radio_p3_email2').prop('checked', ($("#ctl00_workarea_txt_p3_emailmain").val() === "2"));
    $('#radio_p3_email3').prop('checked', ($("#ctl00_workarea_txt_p3_emailmain").val() === "3"));
    $('#radio_p3_web1').prop('checked', ($("#ctl00_workarea_txt_p3_webmain").val() === "1"));
    $('#radio_p3_web2').prop('checked', ($("#ctl00_workarea_txt_p3_webmain").val() === "2"));
    $('#radio_p3_web3').prop('checked', ($("#ctl00_workarea_txt_p3_webmain").val() === "3"));
}

function ClientSave() {
    if (!ValidatePage(vCurrentPageNo)) return false;

    $("#ctl00_workarea_h_cbo_p1_type").val($("#ctl00_workarea_cbo_p1_type option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_linkedgroup").val($("#ctl00_workarea_cbo_p1_linkedgroup option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_memberno").val($("#ctl00_workarea_cbo_p1_memberno option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_Sectiontype").val($("#ctl00_workarea_cbo_p1_Sectiontype option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_sponsorship").val($("#ctl00_workarea_cbo_p1_sponsorship option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_maddrcountry").val($("#ctl00_workarea_cbo_p1_maddrcountry option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_caddrcountry").val($("#ctl00_workarea_cbo_p1_caddrcountry option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_maddrtype").val($("#ctl00_workarea_cbo_p1_maddrtype option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p2_recogstat").val($("#ctl00_workarea_cbo_p2_recogstat option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_tel1").val($("#ctl00_workarea_cbo_p3_tel1 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_tel2").val($("#ctl00_workarea_cbo_p3_tel2 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_tel3").val($("#ctl00_workarea_cbo_p3_tel3 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_contact_type1").val($("#ctl00_workarea_cbo_p3_contact_type1 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_contact_type2").val($("#ctl00_workarea_cbo_p3_contact_type2 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_contact_type3").val($("#ctl00_workarea_cbo_p3_contact_type3 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_socmed1").val($("#ctl00_workarea_cbo_p3_socmed1 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_socmed2").val($("#ctl00_workarea_cbo_p3_socmed2 option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p3_socmed3").val($("#ctl00_workarea_cbo_p3_socmed3 option:selected").attr("value"));

    if ($('#radio_p3_tel1').prop('checked')) $("#ctl00_workarea_txt_p3_telmain").val("1");
    if ($('#radio_p3_tel2').prop('checked')) $("#ctl00_workarea_txt_p3_telmain").val("2");
    if ($('#radio_p3_tel3').prop('checked')) $("#ctl00_workarea_txt_p3_telmain").val("3");
    if ($('#radio_p3_email1').prop('checked')) $("#ctl00_workarea_txt_p3_emailmain").val("1");
    if ($('#radio_p3_email2').prop('checked')) $("#ctl00_workarea_txt_p3_emailmain").val("2");
    if ($('#radio_p3_email3').prop('checked')) $("#ctl00_workarea_txt_p3_emailmain").val("3");
    if ($('#radio_p3_web1').prop('checked')) $("#ctl00_workarea_txt_p3_webmain").val("1");
    if ($('#radio_p3_web2').prop('checked')) $("#ctl00_workarea_txt_p3_webmain").val("2");
    if ($('#radio_p3_web3').prop('checked')) $("#ctl00_workarea_txt_p3_webmain").val("3");

    if (SaveFormCheck('#ctl00_footer_bnSave4,#ctl00_footer_bnSave3,#ctl00_footer_bnSave2,#ctl00_footer_bnSave1'))// not the error page save button (but all the rest)
    {
        MakeFormReadonlyForSave(".CopyButton,.AddressLookupButton,.QuickSearchButton");
        __doPostBack('ctl00$footer$bnSave1', '');
    }
    return false;
}

function ValidatePage(PageNo) {
    if (vIsReadonly) return true;

    vValid = true;
    vReqFocused = false;
    if (PageNo === 3) {
        //Validate Telephone contacts
        PairedValidation("ctl00_workarea_cbo_p3_tel1", "ctl00_workarea_txt_p3_tel1");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p3_tel2", "ctl00_workarea_txt_p3_tel2");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p3_tel3", "ctl00_workarea_txt_p3_tel3");
        if (!vValid) return vValid;
        if ($("#ctl00_workarea_cbo_p3_tel1").val() || $("#ctl00_workarea_cbo_p3_tel2").val() || $("#ctl00_workarea_cbo_p3_tel3").val()) {
            if (!($('#radio_p3_tel1').prop('checked') || $('#radio_p3_tel2').prop('checked') || $('#radio_p3_tel3').prop('checked'))) {
                vValid = false;
                $.system_alert('No Primary set for telephone contacts', $('#radio_p3_tel1'));
                return vValid;
            }
            if ((!$("#ctl00_workarea_cbo_p3_tel1").val() && $('#radio_p3_tel1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', "#ctl00_workarea_cbo_p3_tel1");
                return vValid;
            }
            if ((!$("#ctl00_workarea_cbo_p3_tel2").val() && $('#radio_p3_tel2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', "#ctl00_workarea_cbo_p3_tel2");
                return vValid;
            }
            if ((!$("#ctl00_workarea_cbo_p3_tel3").val() && $('#radio_p3_tel3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', "#ctl00_workarea_cbo_p3_tel3");
                return vValid;
            }
        }
        //Validate Email contacts
        PairedValidation("ctl00_workarea_cbo_p3_contact_type1", "ctl00_workarea_txt_p3_email1");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p3_contact_type2", "ctl00_workarea_txt_p3_email2");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p3_contact_type3", "ctl00_workarea_txt_p3_email3");
        if (!vValid) return vValid;
        if ($("#ctl00_workarea_cbo_p3_contact_type1").val() || $("#ctl00_workarea_cbo_p3_contact_type2").val() || $("#ctl00_workarea_cbo_p3_contact_type3").val()) {
            if (!($('#radio_p3_email1').prop('checked') || $('#radio_p3_email2').prop('checked') || $('#radio_p3_email3').prop('checked'))) {
                vValid = false;
                $.system_alert('No Primary set for Email contacts', $('#radio_p3_email1'));
                return vValid;
            }
            if ((!$("#ctl00_workarea_cbo_p3_contact_type1").val() && $('#radio_p3_email1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', "#ctl00_workarea_cbo_p3_contact_type1");
                return vValid;
            }
            if ((!$("#ctl00_workarea_cbo_p3_contact_type2").val() && $('#radio_p3_email2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', "#ctl00_workarea_cbo_p3_contact_type2");
                return vValid;
            }
            if ((!$("#ctl00_workarea_cbo_p3_contact_type3").val() && $('#radio_p3_email3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', "#ctl00_workarea_cbo_p3_contact_type3");
                return vValid;
            }
        }

        //Validate Social Media contacts
        PairedValidation("ctl00_workarea_cbo_p3_socmed1", "ctl00_workarea_txt_p3_socmed1");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p3_socmed2", "ctl00_workarea_txt_p3_socmed2");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p3_socmed3", "ctl00_workarea_txt_p3_socmed3");
        if (!vValid) return vValid;

        //Validate Web Address contacts
        if ($("#ctl00_workarea_txt_p3_webaddr1").val() || $("#ctl00_workarea_txt_p3_webaddr2").val() || $("#ctl00_workarea_txt_p3_webaddr3").val()) {
            if (!($('#radio_p3_web1').prop('checked') || $('#radio_p3_web2').prop('checked') || $('#radio_p3_web3').prop('checked'))) {
                vValid = false;
                $.system_alert('No Primary set for web address contacts', $('#radio_p3_web1'));
                return vValid;
            }
            if (($("#ctl00_workarea_txt_p3_webaddr1").val() === "" && $('#radio_p3_web1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary web address has no details', "#ctl00_workarea_txt_p3_webaddr1");
                return vValid;
            }
            if (($("#ctl00_workarea_txt_p3_webaddr2").val() === "" && $('#radio_p3_web2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary web address has no details', "#ctl00_workarea_txt_p3_webaddr2");
                return vValid;
            }
            if (($("#ctl00_workarea_txt_p3_webaddr3").val() === "" && $('#radio_p3_web3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary web address has no details', "#ctl00_workarea_txt_p3_webaddr3");
                return vValid;
            }
        }
    }

    var OldModified = HasChanges;
    $('input,select', $('#mpage' + PageNo)).each(CheckReq);
    HasChanges = OldModified;
    return vValid;
}

function ValidateType(self) {
    if ($("option:selected", $(self)).attr("value") === "ES" && $("#ctl00_workarea_cbo_p1_linkedgroup option").size() > 1)
        $("#ctl00_workarea_cbo_p1_linkedgroup").removeAttr("disabled");
    else
        $("#ctl00_workarea_cbo_p1_linkedgroup").val("").attr("disabled", "disabled");

    SetEnabled();
}

function CheckReq() { if (!vIsReadonly) ShowRequired(this); }

function IsInsertMode() { return !pk_val("Page.NG_ID"); }

function MakePageVisible(PageNo) {
    try {
        var vSel = $('#ctl00_workarea_cbo_p1_Sectiontype option:selected').attr("value");
        if ((!HasAccess(pk_val("CRUD.RS"), "R") || !(vSel === "SEA" || vSel === "AIR")) && PageNo === 2)
            PageNo = 1;

        MakeTabVisible(PageNo);
        vCurrentPageNo = PageNo;

        if (PageNo === 1) { $.FocusControl("#ctl00_workarea_txt_p1_name"); }
        if (PageNo === 2) { $.FocusControl("#ctl00_workarea_txt_p2_recogno"); }
        if (PageNo === 3) { $.FocusControl("#ctl00_workarea_txt_p3_tel1"); }
        if (PageNo === 4) { $.FocusControl("#ctl00_workarea_txt_p4_schedule"); }
    }
    catch (err) { }
    return false;
}

function ChangePage(FromPageNo, ToPageNo, FromMenu) {
    if (IsInsertMode() && FromMenu)
        return false;

    if (ValidatePage(FromPageNo)) {
        if (ToPageNo === 2 && FromPageNo === 1 && !HasAccess(pk_val("CRUD.RS"), "R"))
            ToPageNo = 3; // next 1>2

        var vSel = $('#ctl00_workarea_cbo_p1_Sectiontype option:selected').attr("value");
        if (!(vSel === "SEA" || vSel === "AIR")) {
            if (ToPageNo === 2 && FromPageNo === 1) ToPageNo = 3;
            if (ToPageNo === 2 && FromPageNo === 3) ToPageNo = 1;
        }
        MakePageVisible(ToPageNo);
    }
    return false;
}

function ResetPage(PageNo) {
    $("#mpage" + PageNo + " input").each(function () { $(this).resetDB(); });
    $("#mpage" + PageNo + " select").each(function () { $(this).resetDB(); });
    $("#mpage" + PageNo + " textarea").each(function () { $(this).resetDB(); });

    ResetRequired('#mpage' + PageNo);

    if (PageNo === 1) { $("#ctl00_workarea_cbo_p1_Sectiontype").trigger("change"); }
    if (PageNo === 3) {
        setAddressPrimarys();
        if (!$("#ctl00_workarea_txt_p3_memberno").val())
            $("#ctl00_workarea_txt_p3_membername").hide();
    }
    return false;
}

//#region Page 3

function Con_Populate(CN, Name, email, phone) {
    $("#ctl00_workarea_txt_p3_memberno").val(CN);
    if (Name) {
        $("#ctl00_workarea_txt_p3_membername").val(Name).show();

        if ((email || phone) && !vLoadingCN) {
            $.system_confirm("Would you like to use the selected member's phone and email settings?", function () {
                $("#ctl00_workarea_cbo_p3_tel1,#ctl00_workarea_cbo_p3_tel2,#ctl00_workarea_cbo_p3_tel3,#ctl00_workarea_txt_p3_tel1,#ctl00_workarea_txt_p3_tel2,#ctl00_workarea_txt_p3_tel3").val("");
                $("#ctl00_workarea_cbo_p3_contact_type1,#ctl00_workarea_cbo_p3_contact_type2,#ctl00_workarea_cbo_p3_contact_type3,#ctl00_workarea_txt_p3_email1,#ctl00_workarea_txt_p3_email2,#ctl00_workarea_txt_p3_email3").val("");
                $("#radio_p3_tel1,#radio_p3_email1").prop("checked", "checked");
                $("#ctl00_workarea_txt_p3_tel1").val(phone);
                $("#ctl00_workarea_txt_p3_email1").val(email);
            });
            $("#bnAlertCANCEL").val("No");
            $("#bnAlertOK").val("Yes");
        }
    }
    else
        $("#ctl00_workarea_txt_p3_membername").val("").hide();
    HasChanges = true;
}

function CheckMemberNo() {
    if (!$("#ctl00_workarea_txt_p3_memberno").val())
        Con_Populate("", "");
    else
        $.validate_member("SECT_MEM",
            Con_Populate,
            function () { Con_Populate("", ""); $.system_alert("Not a valid member number."); },
            $("#ctl00_workarea_txt_p3_memberno").val(),
            pk_val("Page.NG_ID"),
            -1);
}

function LookupMemberNo() {
    $.member_search("SECT_MEM",
        Con_Populate,
        "Find A Member",
        pk_val("Page.NG_ID"),
        -1);
}

//#endregion
