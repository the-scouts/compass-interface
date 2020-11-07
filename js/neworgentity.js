var vCurrentPageNo = 1;
var vLoadingCN = false;
$(document).ready(FormReady);

function FormReady() {
    SetUpPage(pk_val("Page.IsReadonly"), !pk_val("Page.NG_ID"));
    SetMessageReq();
    $("input,select,textarea").change(CheckReq);

    $.FocusControl("#ctl00_workarea_txt_p1_name", false,1000);

    if (!pk_val("Page.NG_ID") || vIsReadonly) {
        if (!pk_val("Page.NG_ID")) {
            $(".footerbuttongreen.EDITBN").not("#ctl00_footer_bnSave4,#ctl00_footer_bnSave3").remove();
            $("#ctl00_footer_bnSave4").css({ "display": "block-inline" });
        }
    }
    else {
        ResetRequired('#mpage1');
        ResetRequired('#mpage3');
        ResetRequired('#mpage5');
    }

    if (!HasAccess(pk_val("CRUD.RS"), "U") || vIsReadonly) {
        $(".RESET", $("#fpage2")).remove();
        $(".DateLookupButton", $("#mpage2")).remove();
    }

    if (!HasAccess(pk_val("CRUD.DEVOPTS"), "U") || vIsReadonly) {
        $("#mpage5req,#ctl00_footer_bnSave5,#bn_p5_Dev_CN").remove();
    }

    if (pk_val("Page.NG_ID")) {
        $("#LBTN1").click(function () { ChangePage(vCurrentPageNo, 1, true); });
        $("#LBTN2").click(function () { ChangePage(vCurrentPageNo, 2, true); });
        $("#LBTN3").click(function () { ChangePage(vCurrentPageNo, 3, true); });
        $("#LBTN4").click(function () { ChangePage(vCurrentPageNo, 4, true); });
        $("#LBTN5").click(function () { ChangePage(vCurrentPageNo, 5, true); });
    }

    $("#bnNext1").click(function () { return ChangePage(vCurrentPageNo, 2); });
    $("#bnNext2").click(function () { return ChangePage(vCurrentPageNo, 3); });
    $("#bnNext3").click(function () { return ChangePage(vCurrentPageNo, 4); });
    $("#ctl00_footer_bnNext4").click(function () { return ChangePage(vCurrentPageNo, 5); });

    $("#bnPrev2").click(function () { return MakePageVisible(1); });
    $("#bnPrev3").click(function () { return PrevPageClick(vCurrentPageNo, 2, ValidatePage, MakePageVisible, ResetPage); });
    $("#bnPrev4").click(function () { return PrevPageClick(vCurrentPageNo, 3, ValidatePage, MakePageVisible, ResetPage); });
    $("#bnPrev5").click(function () { return PrevPageClick(vCurrentPageNo, HasAccess(pk_val("CRUD.BP"), 'R') ? 4 : 3, ValidatePage, MakePageVisible, ResetPage); });

    //#region Optimisations

    // countries
    Opt_GetCBO("#ctl00_workarea_h_cbo_p1_maddrcountry", "--- Select Country ---", "#ctl00_workarea_cbo_p1_maddrcountry,#ctl00_workarea_cbo_p1_caddrcountry,#cbo_p4_GridCountry", 4);
    // Email
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_contact_type1", "--- Select ---", "#ctl00_workarea_cbo_p3_contact_type1,#ctl00_workarea_cbo_p3_contact_type2,#ctl00_workarea_cbo_p3_contact_type3", 7);
    // Phone
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_tel1", "--- Select ---", "#ctl00_workarea_cbo_p3_tel1,#ctl00_workarea_cbo_p3_tel2,#ctl00_workarea_cbo_p3_tel3", 4);
    // SocMedia
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_socmed1", "--- Select ---", "#ctl00_workarea_cbo_p3_socmed1,#ctl00_workarea_cbo_p3_socmed2,#ctl00_workarea_cbo_p3_socmed3", 4);

    $("#ctl00_workarea_cbo_p1_maddrcountry,#ctl00_workarea_cbo_p1_caddrcountry,#ctl00_workarea_cbo_p3_socmed1,#ctl00_workarea_cbo_p3_socmed2,#ctl00_workarea_cbo_p3_socmed3,#ctl00_workarea_cbo_p3_tel1,#ctl00_workarea_cbo_p3_tel2,#ctl00_workarea_cbo_p3_tel3,#ctl00_workarea_cbo_p3_contact_type1,#ctl00_workarea_cbo_p3_contact_type2,#ctl00_workarea_cbo_p3_contact_type3").each(function () { $(this).resetDB(); });

    //#endregion

    if (!vIsReadonly)
    {
        $("#bnReset1").click(function () { return ResetPage(1); });
        $("#bnReset3").click(function () { return ResetPage(3); });
        $("#bnReset4").click(function () { return ResetPage(4); });

        $("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnSave4,#ctl00_footer_bnSave5").attr("href", "#").click(ClientSave);

        // page 1
        $("#ctl00_workarea_txt_p1_date_registered").blur(function () { Date_TextBox_Blur(this); });
        $("#bn_p1_date_registered").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p1_date_registered'); });

        $(".CopyButton").click(function () {
            CopyAddressClick('#ctl00_workarea_txt_p1_caddr', '#ctl00_workarea_txt_p1_maddr');
            ShowRequired("#ctl00_workarea_txt_p1_caddrline1", !$("#ctl00_workarea_txt_p1_caddrline1").val());
            ShowRequired("#ctl00_workarea_txt_p1_caddrtown", !$("#ctl00_workarea_txt_p1_caddrtown").val());
            ShowRequired("#ctl00_workarea_cbo_p1_caddrcountry", !$("#ctl00_workarea_cbo_p1_caddrcountry option:selected").attr("value"));
            ShowRequired("#ctl00_workarea_txt_p1_caddrpcode", !$("#ctl00_workarea_txt_p1_caddrpcode").val());
        });

        $("#bn_p1_QASLookup").click(function () { GetPAF('ctl00_workarea_txt_p1_maddrline1¬ctl00_workarea_txt_p1_maddrline2¬ctl00_workarea_txt_p1_maddrline3¬ctl00_workarea_txt_p1_maddrtown¬ctl00_workarea_txt_p1_maddrcounty¬ctl00_workarea_txt_p1_maddrpcode¬ctl00_workarea_cbo_p1_maddrcountry','ctl00_workarea_txt_p1_maddrpcode',6,1); });
        $("#bn_p1_QASLookup2").click(function () { GetPAF('ctl00_workarea_txt_p1_caddrline1¬ctl00_workarea_txt_p1_caddrline2¬ctl00_workarea_txt_p1_caddrline3¬ctl00_workarea_txt_p1_caddrtown¬ctl00_workarea_txt_p1_caddrcounty¬ctl00_workarea_txt_p1_caddrpcode¬ctl00_workarea_cbo_p1_caddrcountry', 'ctl00_workarea_txt_p1_caddrpcode', 6, 1); });

        $("#ctl00_workarea_txt_p1_maddrpcode").blur(function () { return validatePostCode($("#ctl00_workarea_txt_p1_maddrpcode"), $('#ctl00_workarea_cbo_p1_maddrcountry option:selected').attr("value") !== 'UK'); });
        $("#ctl00_workarea_cbo_p1_maddrcountry").change(function () { return validatePostCode($("#ctl00_workarea_txt_p1_maddrpcode"), $('#ctl00_workarea_cbo_p1_maddrcountry option:selected').attr("value") !== 'UK'); });

        $("#ctl00_workarea_txt_p1_caddrpcode").blur(function () { return validatePostCode($("#ctl00_workarea_txt_p1_caddrpcode"), $('#ctl00_workarea_cbo_p1_caddrcountry option:selected').attr("value") !== 'UK'); });
        $("#ctl00_workarea_cbo_p1_caddrcountry").change(function () { return validatePostCode($("#ctl00_workarea_txt_p1_caddrpcode"), $('#ctl00_workarea_cbo_p1_caddrcountry option:selected').attr("value") !== 'UK'); });

        $("#ctl00_workarea_cbo_p1_grouptype").change(function () {
            if (($("#ctl00_workarea_cbo_p1_grouptype").val() === "SEA" || $("#ctl00_workarea_cbo_p1_grouptype").val() === "AIR") && HasAccess(pk_val("CRUD.RS"), "R"))
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
        $("#ctl00_workarea_txt_p3_memberno").blur(CheckMemberNo).keypress(function (e) { return NumberOnly_KeyPress(e || event, function () { $('#ctl00_workarea_txt_p3_memberno').trigger('blur'); }); });

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

        // page 3
        $("#tmpGridDate").change(GridDateChange);

        // page 5
        if (HasAccess(pk_val("CRUD.DEVOPTS"), "U")) {
            $("#ctl00_workarea_cbo_p5_status").change(SetupDevRequired);
            $("#ctl00_footer_bnReset5").click(function () { return ResetPage(5); });

            $("#ctl00_workarea_txt_p5_Dev_CN").blur(CheckVBno).keypress(function (e) { return NumberOnly_KeyPress(e || event, function (e) { $('#ctl00_workarea_txt_p5_Dev_CN').trigger('blur'); }); }).css("width", "100px");
            $("#bn_p5_Dev_CN").click(DevSearchClick);
            $("#ctl00_workarea_cb_p5_ShowMessage").click(SetMessageReq);
        }

        SetupMiniBusPermitEvents();
    }
    else
    {
        $("#ctl00_workarea_txt_p3_tel1,#ctl00_workarea_txt_p3_tel2,#ctl00_workarea_txt_p3_tel3").css("width", "200px");
        $("#ctl00_workarea_txt_p3_email1,#ctl00_workarea_txt_p3_email2,#ctl00_workarea_txt_p3_email3").css("width", "200px");
        $("#ctl00_workarea_txt_p3_webaddr1,#ctl00_workarea_txt_p3_webaddr2,#ctl00_workarea_txt_p3_webaddr3").css("width", "300px");

        $(".AddressLookupButton,.CopyButton, #fpage6, #mpage6").remove();

        $(".BusPermitBN").not(".DELBN").last().click(function () { ShowHideBusPermitPanel(this); });
    }

    if ($("#ctl00_workarea_txt_p3_memberno").val())
        $("#ctl00_workarea_txt_p3_membername").show();

    $("#ctl00_workarea_txt_p3_socmed1,#ctl00_workarea_txt_p3_socmed2,#ctl00_workarea_txt_p3_socmed3").css("width", "200px");
    $("#ctl00_workarea_cbo_p3_socmed1,#ctl00_workarea_cbo_p3_socmed2,#ctl00_workarea_cbo_p3_socmed3,#ctl00_workarea_cbo_p3_tel1,#ctl00_workarea_cbo_p3_tel2,#ctl00_workarea_cbo_p3_tel3,#ctl00_workarea_cbo_p3_contact_type1,#ctl00_workarea_cbo_p3_contact_type2,#ctl00_workarea_cbo_p3_contact_type3").css("width", "100px");

    //
    $(".TBLBODY").last().hide();
    $(".BusPermitsubTBL").last().hide();
    $(".DivBorder").last().css({ "background-color": "transparent", "border": "none" });
    $('span.rfv').last().css({ "visibility": "hidden" });

    if ($("#ctl00_workarea_txt_p3_membername").val())
        $("#ctl00_workarea_txt_p3_membername").show();

    if (!pk_val("Page.NG_ID"))
    {
        $(".QuickSearchButton", $("#mpage3")).hide();
        $("#ctl00_workarea_txt_p3_memberno").hide();
        $("#ctl00_workarea_txt_p3_membername").val("There are no contacts at this location yet.").show();
    }

    setAddressPrimarys();
    try {
        $(".txtCountry").last().html($("#ctl00_workarea_cbo_p1_maddrcountry").html());
        PopulateBusPermits();
        if (vIsReadonly)  $(".BusPermitDiv").last().parent().empty();
    }
    catch (e) { // no records as function dies not exist
        if (vIsReadonly)
            $('#mpage4')[0].innerHTML = "<br/><h3>There currently are no minibus permits holders setup.</h3>";
    }
    SetupDevRequired();

    try
    {
        // set page access
        if (!HasAccess(pk_val("CRUD.RS"), "U")) {
            $("input,select", $("#mpage2")).attr("readonly", "readonly");
            $("select", $("#mpage2")).attr("disabled", "disabled");
        }

        doBPSecurity();

        if (!HasAccess(pk_val("CRUD.DEVOPTS"), "U") || vIsReadonly)
        {
            $("input[type=text], textarea", $("#mpage5")).attr("readonly", "readonly").removeAttr("required");
            $("select, input[type=checkbox]", $("#mpage5")).attr("disabled", "disabled").removeAttr("required");
            $("label", $("#mpage5")).removeAttr("for").removeClass("labelPoint");
        }

        if ($("#ctl00_workarea_txt_p5_Dev_CName").val()) $("#ctl00_workarea_txt_p5_Dev_CName").css({ "visibility": "visible" });
    }
    catch (e) { }

    if (pk_val("Page.IsGroup")) {
        $("#ctl00_workarea_cbo_p1_grouptype").trigger("change");
    }
    else
    {
        $(".trGrp1").nextAll('span.rfv:first').remove();
        $(".trGrp1,.trGrp2,#LBTN2").remove();
        $("#ctl00_workarea_cbo_p1_grouptype").removeAttr("required");
    }

    $("#mpage1 .InputLessspace").not("select, #ctl00_workarea_txt_p1_maddrpcode, #ctl00_workarea_txt_p1_caddrpcode").css("width", "230px");
    $(".tdCommSpacer").css("width", "50px");
    $("#ctl00_workarea_txt_p5_MessageText").autosize(30);
    $.FocusControl("#ctl00_workarea_txt_p1_name");
    SetEnabled();
    setTimeout(function () { MakePageVisible(1); ResetRequired('#mpage1'); HasChanges = false; }, PageVisibleDelay());

    ShowOriginalSet(); // simple debug routine for checking if orig DB value is set.
}

function doBPSecurity() {
    if (!HasAccess(pk_val("CRUD.BP"), "R")) {
        $(".RESET", $("#fpage4")).remove();
        $("#LBTN4").remove();
        $(".DateLookupButton", $("#tbl_p4_BusPermits")).remove();
        $("select", $("#mpage4")).attr("disabled", "disabled");
        if (!vIsReadonly)
            $("#ctl00_footer_bnSave3").css({ "display": "block-inline" });
    }
    if (!HasAccess(pk_val("CRUD.BP"), "C") || !HasAccess(pk_val("CRUD.BP"), "U")) {
        $(".TBLDATA").last().remove();
        $(".RESET", $("#fpage4")).remove();
        if (!HasAccess(pk_val("CRUD.BP"), "C") && !HasAccess(pk_val("CRUD.BP"), "U")) {
            $(".DateLookupButton", $("#tbl_p4_BusPermits")).remove();
            $("select", $("#mpage4")).attr("disabled", "disabled");
        }
    }
    else { $(".TBLDATA").last().show(); }

    if (!HasAccess(pk_val("CRUD.BP"), "U")) {
        $("input,select", $(".TBLDATA")).attr("readonly", "readonly");
        $("RESET", $("#mpage4")).remove();
    }

    if (!HasAccess(pk_val("CRUD.BP"), "U") && !HasAccess(pk_val("CRUD.BP"), "C") && !HasAccess(pk_val("CRUD.BP"), "U"))
        $("EDITBN", $(".TBLDATA")).remove();
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
    if (!ValidatePage(vCurrentPageNo))
        return false;

    $("#ctl00_workarea_h_cbo_p1_sponsorship").val($("#ctl00_workarea_cbo_p1_sponsorship option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_grouptype").val($("#ctl00_workarea_cbo_p1_grouptype option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_maddrcountry").val($("#ctl00_workarea_cbo_p1_maddrcountry option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_caddrcountry").val($("#ctl00_workarea_cbo_p1_caddrcountry option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p1_maddrtype").val($("#ctl00_workarea_cbo_p1_maddrtype option:selected").attr("value"));
    if ($("#ctl00_workarea_cb_p1_jointgroup").is(':checked')) { $("#ctl00_workarea_h_cb_p1_jointgroup").val("Y"); } else { $("#ctl00_workarea_h_cb_p1_jointgroup").val("N"); }
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
    $("#ctl00_workarea_h_cbo_p5_status").val($("#ctl00_workarea_cbo_p5_status option:selected").attr("value"));
    $("#ctl00_workarea_h_cbo_p5_theme").val($("#ctl00_workarea_cbo_p5_theme option:selected").attr("value"));
    if ($("#ctl00_workarea_cb_p5_ShowAlerts").is(':checked')) { $("#ctl00_workarea_h_cb_p5_show_alerts").val("Y"); } else { $("#ctl00_workarea_h_cb_p5_show_alerts").val("N"); }
    if ($("#ctl00_workarea_cb_p5_ShowMessage").is(':checked')) { $("#ctl00_workarea_h_cb_p5_show_message").val("Y"); } else { $("#ctl00_workarea_h_cb_p5_show_message").val("N"); }

    if (SaveFormCheck('#ctl00_footer_bnSave5,#ctl00_footer_bnSave4,#ctl00_footer_bnSave3,#ctl00_footer_bnSave2,#ctl00_footer_bnSave1')) {
        if ($('#radio_p3_tel1').prop('checked')) $("#ctl00_workarea_txt_p3_telmain").val("1");
        if ($('#radio_p3_tel2').prop('checked')) $("#ctl00_workarea_txt_p3_telmain").val("2");
        if ($('#radio_p3_tel3').prop('checked')) $("#ctl00_workarea_txt_p3_telmain").val("3");
        if ($('#radio_p3_email1').prop('checked')) $("#ctl00_workarea_txt_p3_emailmain").val("1");
        if ($('#radio_p3_email2').prop('checked')) $("#ctl00_workarea_txt_p3_emailmain").val("2");
        if ($('#radio_p3_email3').prop('checked')) $("#ctl00_workarea_txt_p3_emailmain").val("3");
        if ($('#radio_p3_web1').prop('checked')) $("#ctl00_workarea_txt_p3_webmain").val("1");
        if ($('#radio_p3_web2').prop('checked')) $("#ctl00_workarea_txt_p3_webmain").val("2");
        if ($('#radio_p3_web3').prop('checked')) $("#ctl00_workarea_txt_p3_webmain").val("3");

        MinifyPageDataForSave();
        MakeFormReadonlyForSave(".BusPermitBN");
        __doPostBack('ctl00$footer$bnSave1', '');
        return false;
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
            if (($("#ctl00_workarea_cbo_p3_tel1").val() === "" && $('#radio_p3_tel1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#ctl00_workarea_cbo_p3_tel1"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p3_tel2").val() === "" && $('#radio_p3_tel2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#ctl00_workarea_cbo_p3_tel2"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p3_tel3").val() === "" && $('#radio_p3_tel3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#ctl00_workarea_cbo_p3_tel3"));
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
            if (($("#ctl00_workarea_cbo_p3_contact_type1").val() === "" && $('#radio_p3_email1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#ctl00_workarea_cbo_p3_contact_type1"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p3_contact_type2").val() === "" && $('#radio_p3_email2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#ctl00_workarea_cbo_p3_contact_type2"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p3_contact_type3").val() === "" && $('#radio_p3_email3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#ctl00_workarea_cbo_p3_contact_type3"));
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
                $.system_alert('Primary web address has no details', $("#ctl00_workarea_txt_p3_webaddr1"));
                return vValid;
            }
            if (($("#ctl00_workarea_txt_p3_webaddr2").val() === "" && $('#radio_p3_web2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary web address has no details', $("#ctl00_workarea_txt_p3_webaddr2"));
                return vValid;
            }
            if (($("#ctl00_workarea_txt_p3_webaddr3").val() === "" && $('#radio_p3_web3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary web address has no details', $("#ctl00_workarea_txt_p3_webaddr3"));
                return vValid;
            }
        }
    }

    if (PageNo === 4) DoneOpen = false;

    if (PageNo === 5) {
        if ($('#ctl00_workarea_cb_p5_ShowMessage').prop('checked')) {
            if ($("#ctl00_workarea_txt_p5_MessageText").val() === "") {
                vValid = false;
                //$.system_alert('No custom message supplied', $("#ctl00_workarea_txt_p5_MessageText"));
                ShowRequired($("#ctl00_workarea_txt_p5_MessageText"), !$("#ctl00_workarea_txt_p5_MessageText").val());
                return vValid;
            }
            if (!ValidHTML())
            {
                vValid = false;
                $.system_alert("The custom message text is not valid, please ensure all HTML tags have a corresponding close tag.", $("#ctl00_workarea_txt_p5_MessageText"));
                return vValid;
            }
            if (!CleanHTML($('#ctl00_workarea_txt_p5_MessageText').val(),true))
            {
                vValid = false;
                return vValid;
            }
        }
    }

    var OldModified = HasChanges;
    $('input,select,textarea', $('#mpage' + PageNo)).each(CheckReq);
    HasChanges = OldModified;
    return vValid;
}

function SetMessageReq() {
    if ($('#ctl00_workarea_cb_p5_ShowMessage').prop('checked'))
    {
        $("#ctl00_workarea_txt_p5_MessageText").attr('required', 'required').nextAll('span.rfv:first').css({ "visibility": "visible" });
        ShowRequired($("#ctl00_workarea_txt_p5_MessageText"), !$("#ctl00_workarea_txt_p5_MessageText").val());
    }
    else
    {

        ResetRequired("#mpage5");
        $("#ctl00_workarea_txt_p5_MessageText").removeAttr('required').nextAll('span.rfv:first').css({ "visibility": "hidden" });
        //ShowRequired($("#ctl00_workarea_txt_p5_MessageText"), false);//original
        //ShowRequired($("#ctl00_workarea_txt_p5_MessageText"), true);
        //ShowRequired($("#ctl00_workarea_txt_p5_MessageText"));
    }
}

var DoneOpen = false;
function CheckReq() {
    if (vCurrentPageNo === 5 && !HasAccess(pk_val("CRUD.DEVOPTS"), "U"))
        return;

    if (!vIsReadonly) {
        if (!ShowRequired(this) && vCurrentPageNo === 4 && !DoneOpen) {
            var vTR = $(this).parent().parent().parent();
            if (vTR.css("display") === "none") {
                $(".TBLDATA").hide();
                vTR.show();

                // show 'new' item stuff correctly
                $(".TBLDATA").last().show();
                $(".VCsubTBL").last().hide();
            }
            DoneOpen = true;
        }
    }
}

function MakePageVisible(PageNo) {
    try {
        if ((!HasAccess(pk_val("CRUD.RS"), "R") || !($('#ctl00_workarea_cbo_p1_grouptype').val() === "SEA" || $('#ctl00_workarea_cbo_p1_grouptype').val() === "AIR")) && PageNo === 2)
            PageNo = 1;

        MakeTabVisible(PageNo);
        vCurrentPageNo = PageNo;
        if (PageNo === 1) { $.FocusControl("#ctl00_workarea_txt_p1_name"); }
        if (PageNo === 2) { $.FocusControl("#ctl00_workarea_txt_p2_recogno"); }
        if (PageNo === 3) { $.FocusControl("#ctl00_workarea_txt_p3_tel1"); }
        if (PageNo === 4) { $.FocusControl($(".NewBusPermitTXT").last()); }
        if (PageNo === 6) { $('#LBTN1').addClass("navbutton_Disabled_Selected").data("selected", "Y"); }
        if (PageNo === 5) {
            var OldModified = HasChanges;
            ResetRequired("#mpage5");
            HasChanges = OldModified;
            $.FocusControl($("#ctl00_workarea_cbo_p5_status").last());
        }
    }
    catch (err) { }
    return false;
}

function ChangePage(FromPageNo, ToPageNo, FromMenu) {
    if (!pk_val("Page.NG_ID") && FromMenu)
        return false;

    if (ValidatePage(FromPageNo)) {
        // if page is not visible, pass it..!
        if (ToPageNo === 2 && FromPageNo === 1 && !HasAccess(pk_val("CRUD.RS"), "R")) ToPageNo = 3; // next 1>2
        if (!($("#ctl00_workarea_cbo_p1_grouptype").val() === "SEA" || $("#ctl00_workarea_cbo_p1_grouptype").val() === "AIR")) {
            if (ToPageNo === 2 && FromPageNo === 1) ToPageNo = 3;
            if (ToPageNo === 2 && FromPageNo === 3) ToPageNo = 1;
        }

        if (!HasAccess(pk_val("CRUD.BP"), "R"))
        {
            if (ToPageNo === 4 && FromPageNo === 3) ToPageNo = 5;
            if (ToPageNo === 4 && FromPageNo === 5) ToPageNo = 3;
        }

        MakePageVisible(ToPageNo);
    }
    return false;
}

function ResetPage(PageNo) {
    vLoadingCN = true;

    $("#mpage" + PageNo + " input").not(".BusPermitBN").each(function () { $(this).resetDB(); });
    $("#mpage" + PageNo + " select").each(function () { $(this).resetDB(); });
    $("#mpage" + PageNo + " textarea").each(function () { $(this).resetDB(); });
    ResetRequired('#mpage' + PageNo);
    if (PageNo === 1) {
        //$("#ctl00_workarea_cb_p1_jointgroup").prop('checked', false);
        $("#ctl00_workarea_cbo_p1_grouptype").trigger("change");
    }

    if (PageNo === 3) {
        setAddressPrimarys();
        if (!$("#ctl00_workarea_txt_p3_memberno").val())
            $("#ctl00_workarea_txt_p3_membername").hide();
    }

    if (PageNo === 4)
    {
        $(".TBLBODY").not(":last").remove();
        $(".TBLDATA").not(":last").remove();
        PopulateBusPermits();
        doBPSecurity();
    }

    if (PageNo === 5) {
        if (!$("#ctl00_workarea_txt_p5_Dev_CN").val())
            $("#ctl00_workarea_txt_p5_Dev_CName").css({ "visibility": "hidden" });
        SetupDevRequired();
        SetMessageReq();
    }

    vLoadingCN = false;

    return false;
}

//#region Page 3

function Con_Populate(CN, Name, email, phone) {
    $("#ctl00_workarea_txt_p3_memberno").val(CN);
    if (Name) {
        $("#ctl00_workarea_txt_p3_membername").val(Name).show();

        if ((email || phone) && !vLoadingCN) {
            $.system_confirm("Would you like to use the selected members phone and email settings?", function () {
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
        $.validate_member(pk_val("Page.IsGroup") ? "GRP_MEM" : "ORG_MEM",
            Con_Populate,
            function () { Con_Populate("", ""); $.system_alert("Not a valid member number."); },
            $("#ctl00_workarea_txt_p3_memberno").val(),
            pk_val("Page.NG_ID"),
            -1);
}

function LookupMemberNo() {
    $.member_search(pk_val("Page.IsGroup") ? "GRP_MEM" : "ORG_MEM",
        Con_Populate,
        "Find A Member",
        pk_val("Page.NG_ID"),
        -1);
}

//#endregion

//#region page 4

function PopulateBusPermits(){
    if ($("#ctl00_workarea_h_BusPermitData").val()) {
        var mvData = $.parseJSON($("#ctl00_workarea_h_BusPermitData").val());
        for (var i = 0; i < mvData.length ; i++)
            AddBusPermitData(mvData[i].BusPermitNumber, mvData[i].PermitHolder, mvData[i].SerialNumber, mvData[i].DateIssued, mvData[i].ExpiryDate, mvData[i].Unit, mvData[i].AddressNumber, mvData[i].Line1, mvData[i].Line2, mvData[i].Line3, mvData[i].Town, mvData[i].County, mvData[i].Postcode, mvData[i].Country);
    }
}

function SetupMiniBusPermitEvents() {
    // set security on grid
    if (!HasAccess(pk_val("CRUD.BP"), "D")) $(".DELBN").remove();
    else $(".DELBN").last().click(function () { RemoveBusPermit(this); });

    $(".BusPermitBN").not(".DELBN").last().click(function () { ShowHideBusPermitPanel(this); });
    $(".NewBusPermitTXT").keyup(function () { NewBusPermitKeyPress(this); }).blur(function () { NameChange(this); }).css("width", "460px");

    $(".mbwid").css("width", "240px");
    $(".NewBusPermitTXT").not(":last").css({ "margin-left": "49px", "width": "490px" });

    $(".txtPostcode").last().blur(function () {
        return validatePostCode($(this), $('.txtCountry option:selected', $(this).closest(".BusPermitDiv")).attr("value") !== 'UK');
    });
    $(".txtCountry").last().change(function () {
        return validatePostCode($(".txtPostcode", $(this).closest(".BusPermitDiv")), $('option:selected', this).attr("value") !== 'UK');
    });

    $(".txtIssued").last().blur(GenChange).data("datefor","llIssued");
    $(".txtExpiry").last().blur(GenChange).data("datefor", "llExpiry");
    $(".txtUnit").last().blur(GenChange).change(GenChange).data("datefor", "llUnit");

    $(".bnIssued").last().click(function () { GridPopupDateSelect(this, 'tmpGridDate'); });
    $(".bnExpiry").last().click(function () { GridPopupDateSelect(this, 'tmpGridDate'); });
}

function NewBusPermitKeyPress(self) {
    if ($(".NewBusPermitTXT").last().val()) {
        AddBusPermit();
    }
    NameChange(self);
}

function AddBusPermitData(BP_ID, PH, SN, DI, EX, UN, A_ID, A_L1, A_L2, A_L3, A_TW, A_CN, A_PC, A_CTY) {
    $(".NewBusPermitTXT", $(".TBLDATA").last()).attr("NG_ID", BP_ID);
    $(".NewBusPermitTXT", $(".TBLDATA").last()).val(PH);
    $(".txtSerial", $(".TBLDATA").last()).val(SN);
    $(".txtIssued", $(".TBLDATA").last()).val(DI);
    $(".txtExpiry", $(".TBLDATA").last()).val(EX);
    $(".txtUnit", $(".TBLDATA").last()).val(UN);

    $(".txtLine1", $(".TBLDATA").last()).val(A_L1);
    $(".txtLine2", $(".TBLDATA").last()).val(A_L2);
    $(".txtLine3", $(".TBLDATA").last()).val(A_L3);
    $(".txtTown", $(".TBLDATA").last()).val(A_TW);
    $(".txtCounty", $(".TBLDATA").last()).val(A_CN);
    $(".txtPostcode", $(".TBLDATA").last()).val(A_PC);
    $(".txtCountry", $(".TBLDATA").last()).val(A_CTY);
    $(".txtLine1", $(".TBLDATA").last()).attr("NG_ID", A_ID);

    $(".llName", $(".TBLBODY").last()).text(PH);
    $(".llUnit", $(".TBLBODY").last()).text(UN);
    $(".llIssued", $(".TBLBODY").last()).text(DI);
    $(".llExpiry", $(".TBLBODY").last()).text(EX);

    $('span.rfv:first', $(".TBLDATA").last()).css({ "visibility":"hidden" });

    $(".TBLDATA").hide();

    AddBusPermit();
}

function AddBusPermit() {
    // get forst 2 lines (for copy)
    var HTML1 = $("#tbl_p4_BusPermits tr:eq(1)").html(); // data row + buttons
    var HTML2 = $("#tbl_p4_BusPermits tr:eq(2)").html(); // insert box + table of data

    // current item bits
    $(".TBLBODY").last().show();
    $(".TBLBODY").not(":last").show();
    $(".TBLDATA").not(":last").hide();
    $(".BusPermitsubTBL").last().show();
    $(".BusPermitAddBN", $(".TBLDATA").last()).hide();
    $(".DivBorder").last().css({ "background-color": "", "border": "" });
    $(".NewBusPermitTXT").attr("required", "required").attr("tabindex", "101");
    $(".llNew").last().text("Permit Holder Name");

    $("HR", $("#tbl_p4_BusPermits")).hide();

    // add new blank data at end
    $("#tbl_p4_BusPermits").append("<tr class='TBLBODY'>" + HTML1 + "</tr>").append("<tr class='TBLDATA'>" + HTML2 + "</tr>");

    // set new (blank) item bits / visibility
    $(".TBLBODY").last().hide();
    $(".TBLDATA").last().show();
    $(".BusPermitsubTBL").last().hide();
    $(".DivBorder").last().css({ "background-color": "transparent", "border": "none" });
    $("HR", $("#tbl_p4_BusPermits")).last().show();
    $('span.rfv').last().css({ "visibility": "hidden" });
    $(".NewBusPermitTXT").last().removeAttr("required").attr("tabindex", "201").removeAttr("ng_id").val("");
    $(".txtLine1").last().removeAttr("ng_id");
    $(".llNew").last().text("New Permit Holder Name");
    $(".llUnit, .llIssued, .llExpiry, llName", $(".TBLBODY").last()).text("");

    $(".txtCountry").last().html($("#ctl00_workarea_cbo_p1_maddrcountry").html());

    SetupMiniBusPermitEvents();
}

function ShowHideBusPermitPanel(self) {
    // Show / Hide Details
    if ($(self).parent().parent().next().css("display") !== "none") {
        // if visible just hide
        $(self).parent().parent().next().toggle();
    }
    else
    {
        // close open item and open new item
        $(".TBLDATA").hide();
        $(self).parent().parent().next().show();
        $(".BusPermitsubTBL", $(self).parent().parent().next()).show();
        $(".BusPermitBN", $(self).parent().parent().next()).hide();
    }
    if (!vIsReadonly) {
        // show 'new' item stuff correctly
        $(".TBLDATA").last().show();
        $(".BusPermitsubTBL").last().hide();
        doBPSecurity();
    }
    else{
        $(".BusPermitBN").not(".DELBN").last().click(function () { ShowHideBusPermitPanel(this); });
    }
}

function NameChange(self) {
    // generic change routine for bus permit holder name, (does data > grid)
    $(".llName", $(self).parent().parent().parent().prev()).text($(self).val());

    if ($(self).prev().text() === "New Permit Holder Name")
        return;

    // do required if blanked text
    $(self).nextAll('span.rfv:first').css({ "visibility": ($(self).val() === "" ? "visible" : "hidden") });
    $(self).each(CheckReq);
}

function GenChange() {
    var gridTD = $(this).data("datefor");
    // change event for unit / serial > grid
    if (gridTD !== "llUnit")
        Date_TextBox_Blur(this);

    var vTR = $(this).closest(".TBLDATA").prev();
    $("." + gridTD, vTR).text($(this).val());
}

var Curdate;
function GridDateChange() {
    // if date changes then populate grid
    $(Curdate).val($(this).val()).trigger("blur");
}

function GridPopupDateSelect(thisControl, FromDate_Ctrl) {
    // special date selector, NOTE: as its a grid, there is a invisible text box for ALL dates, this then on change populates the correct grid item
    // its not linked to the edit on the grid (as it does not have an ID)
    Curdate = $(thisControl).prev();
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function RemoveBusPermit(self) {
    // delete button click, removed 2 rows (grid line + data line)
    $(self).parent().parent().next().remove();
    $(self).parent().parent().remove();
}

function MinifyPageDataForSave() {
    $("#ctl00_workarea_h_BusPermitData").val("");
    // make grid data into a usable line of data and put it into the hidden field to then be grabbed by the server on save.
    if (HasAccess(pk_val("CRUD.BP"), 'R')) {
        if ((HasAccess(pk_val("CRUD.BP"), 'C') && !pk_val("Page.NG_ID")) || (HasAccess(pk_val("CRUD.BP"), 'U') && pk_val("Page.NG_ID"))) {
            var vP4Data = "";
            $(".TBLDATA").not(":last").each(function () {
                if (vP4Data) vP4Data += "¬";

                vP4Data += $(".NewBusPermitTXT", this).attr("NG_ID") + "~" +
                    $(".NewBusPermitTXT", this).val().RemoveUnwanted() + "~" +
                    $(".txtSerial", this).val().RemoveUnwanted() + "~" +
                    $(".txtIssued", this).val() + "~" +
                    $(".txtExpiry", this).val() + "~" +
                    $(".txtUnit", this).val().RemoveUnwanted() + "~" +
                    $(".txtLine1", this).val().RemoveUnwanted() + "~" +
                    $(".txtLine2", this).val().RemoveUnwanted() + "~" +
                    $(".txtLine3", this).val().RemoveUnwanted() + "~" +
                    $(".txtTown", this).val().RemoveUnwanted() + "~" +
                    $(".txtCounty", this).val().RemoveUnwanted() + "~" +
                    $(".txtPostcode", this).val().RemoveUnwanted() + "~" +
                    $(".txtCountry", this).val() + "~" +
                    $(".txtLine1", this).attr("NG_ID");
            });

            $("#ctl00_workarea_h_BusPermitData").val(vP4Data.replaceAll("undefined", ""));
        }
    }

    if (pk_val("CRUD.DEVOPTS")) {
        var vSafeText = $("#ctl00_workarea_txt_p5_MessageText").val().htmlEncode();
        $("#ctl00_workarea_txt_p5_MessageText_H").val(vSafeText);
        $("#ctl00_workarea_txt_p5_MessageText").val("");
    }
}

//#endregion

//#region Page 5

function CheckVBno() {
    if (!$("#ctl00_workarea_txt_p5_Dev_CN").val())
        CN_PopulateDev("", "");
    else
        $.validate_member("ODEV",
            CN_PopulateDev,
            function () { VB_Populate("", ""); $.system_alert("Not a valid member number."); },
            $("#ctl00_workarea_txt_p5_Dev_CN").val(),
            pk_val("Master.User.ON"),
            -1);
}

function CN_PopulateDev(CN, Name) {
    $("#ctl00_workarea_txt_p5_Dev_CN").val(CN);
    $("#ctl00_workarea_txt_p5_Dev_CName").val(Name);
    $("#ctl00_workarea_txt_p5_Dev_CName").css({ "visibility": (CN ? "visible" : "hidden") });
    HasChanges = true;
}

function DevSearchClick() {
    $.member_search("ODEV",
        CN_PopulateDev,
        "Find A Member",
        pk_val("Master.User.ON"),
        -1);
}

function SetupDevRequired()
{
    ResetRequired('#mpage5');
    if ($("#ctl00_workarea_cbo_p5_status option:selected").val() === "A") // Active
    {
        $("#ctl00_workarea_txt_p5_Dev_CN").removeAttr("required").nextAll('span.rfv:first').css({ "visibility":"hidden" });
        $("#ctl00_workarea_txt_p5_LoginURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_LoginURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_FailedLoginURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_FailedLoginURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_LockedURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_LockedURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_LogoutURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_LogoutURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_LogoURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_LogoURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_MD5").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_MD5").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_IP_1").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_IP_1").val() === "" ? "visible" : "hidden") });
    }
    else if ($("#ctl00_workarea_cbo_p5_status option:selected").val() === "D") // Dev Mode
    {
        $("#ctl00_workarea_txt_p5_Dev_CN").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_Dev_CN").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_LoginURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_LoginURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_FailedLoginURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_FailedLoginURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_LockedURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_LockedURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_LogoutURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_LogoutURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_LogoURL").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_LogoURL").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_MD5").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_MD5").val() === "" ? "visible" : "hidden") });
        $("#ctl00_workarea_txt_p5_IP_1").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p5_IP_1").val() === "" ? "visible" : "hidden") });
    }
    else // Other (offline)
    {
        $("#ctl00_workarea_txt_p5_Dev_CN").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        $("#ctl00_workarea_txt_p5_LoginURL").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        $("#ctl00_workarea_txt_p5_FailedLoginURL").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        $("#ctl00_workarea_txt_p5_LockedURL").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        $("#ctl00_workarea_txt_p5_LogoutURL").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        $("#ctl00_workarea_txt_p5_LogoURL").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        $("#ctl00_workarea_txt_p5_MD5").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        $("#ctl00_workarea_txt_p5_IP_1").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
    }

    ValidatePage(5);
}

function ShowDocumentation(URL) {
    if (URL.toLowerCase().indexOf("login.ashx") >= 0)
        URL = Append(URL, "ON", pk_val("Page.NG_ID"));
    OpenDocument(URL);
    return false;
}

//#endregion

//#region HTML checking of HomePage message
var validHTML = ""; // global var for holding HTML temporarily for clean up in loop.
function CleanAttributes(node) {
    $(node).each(function () {
        if (this.attributes && this.attributes.length > 0)
            $.each(this.attributes, function (index, attr) {
                if (attr.name.toLowerCase() !== "style" && attr.name.toLowerCase() !== "href") {
                    validHTML = validHTML.replaceAll(attr.name, "xxx");
                    if (attr.value !== "") validHTML = validHTML.replaceAll(attr.value, "yyy");
                }
                // check style and href for javascript too
                if (attr.value.toLowerCase().indexOf("javascript:") >= 0 || attr.value.toLowerCase().indexOf("expression") >= 0) {
                    validHTML = validHTML.replaceAll(attr.name, "xxx");
                    if (attr.value !== "") validHTML = validHTML.replaceAll(attr.value, "yyy");
                }
            });
        validHTML = validHTML.replaceAll(" xxx=\"yyy\"", "");
        // now go into child components and repeat.
        $.each(this.childNodes, function (index, childnode) { if (childnode) CleanAttributes(childnode); });
    });
}

function CleanHTML(orig_html_text, ShowMessage) {
    validHTML = orig_html_text;

    CleanAttributes('<label>' + validHTML + '</label>');

    // remove ALL html tags by replacing < with [.    (basically break html and only fix what we want)
    validHTML = validHTML.replace(/</g, "[").replaceAll("&lt;", "[", false).replaceAll("%3C", "[", false);
    // then put back what we think is ok
    // allow only these tags
    validHTML = validHTML.replaceAll("[b>", "<b>", false).replaceAll("[b ", "<b ", false).replaceAll("[/b>", "</b>", false);
    validHTML = validHTML.replaceAll("[u>", "<u>", false).replaceAll("[u ", "<u ", false).replaceAll("[/u>", "</u>", false);
    validHTML = validHTML.replaceAll("[em>", "<em>", false).replaceAll("[em ", "<em ", false).replaceAll("[/em>", "</em>", false);
    validHTML = validHTML.replaceAll("[i>", "<i>", false).replaceAll("[i ", "<i ", false).replaceAll("[/i>", "</i>", false);
    validHTML = validHTML.replaceAll("[strike>", "<strike>", false).replaceAll("[strike ", "<strike ", false).replaceAll("[/strike>", "</strike>", false);
    validHTML = validHTML.replaceAll("[strong>", "<strong>", false).replaceAll("[strong ", "<strong ", false).replaceAll("[/strong>", "</strong>", false);
    validHTML = validHTML.replaceAll("[span>", "<span>", false).replaceAll("[span ", "<span ", false).replaceAll("[/span>", "</span>", false);
    validHTML = validHTML.replaceAll("[a>", "<a>", false).replaceAll("[a href", "<a href", false).replaceAll("[/a>", "</a>", false);//Allow for <a href=...> and <a>
    validHTML = validHTML.replaceAll("[br>", "<br>", false).replaceAll("[br />", "<br />", false).replaceAll("[/br>", "</br>", false);
    validHTML = validHTML.replaceAll("[h1>", "<h1>", false).replaceAll("[/h1>", "</h1>", false);
    validHTML = validHTML.replaceAll("[h2>", "<h2>", false).replaceAll("[/h2>", "</h2>", false);
    validHTML = validHTML.replaceAll("[h3>", "<h3>", false).replaceAll("[/h3>", "</h3>", false);

    //blank out dodgy start and end tags
    //Start tags: looking for [ followed by one or more characters, ending with >  e.g. [badtag>
    //            (Relies on dodgy attributes already having been removed.)
    //End tags: looking for [ followed by / then one or more characters, ending with >   e.g. [/badtag>
    validHTML = validHTML.replace(/\[\w+?\>/g, "", false).replace(/\[\/\w+?\>/g, "", false);

    orig_html_text = orig_html_text.replaceAll("%2F", "/").replaceAll("<~div", "<label").replaceAll("</~div", "</label");
    var Check_HTML = validHTML.replaceAll("%2F", "/").replaceAll("[~div", "<label").replaceAll("[/~div", "</label");

    var vCleaned = false;
    if (Check_HTML.toLowerCase() !== orig_html_text.toLowerCase()) vCleaned = true;
    if (vCleaned && ShowMessage) {
        $.system_alert("Invalid HTML tags or tag attributes have been removed.<br/><br/>NOTE: Only <b>href</b> and <b>style</b> are valid HTML tag attributes.<br/>only <b>B,U,EM,I,STRIKE,STRONG,SPAN,A,BR,H1,H2,H3</b> tags are allowed.");
    }
    $('#ctl00_workarea_txt_p5_MessageText').val(validHTML);
    return !vCleaned;
}

function ValidateHTML(html_text) {
    html_text = html_text.toLowerCase().replaceAll("</", "<@");

    // <b>
    var StartTagCnt = 0, EndTagCnt = 0;
    if (html_text.match(/<b /g) !== null) StartTagCnt = html_text.match(/<b /g).length;
    if (html_text.match(/<b>/g) !== null) StartTagCnt += html_text.match(/<b>/g).length;
    if (html_text.match(/<@b>/g) !== null) EndTagCnt = html_text.match(/<@b>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <u>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<u /g) !== null) StartTagCnt = html_text.match(/<u /g).length;
    if (html_text.match(/<u>/g) !== null) StartTagCnt += html_text.match(/<u>/g).length;
    if (html_text.match(/<@u>/g) !== null) EndTagCnt = html_text.match(/<@u>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <em>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<em /g) !== null) StartTagCnt = html_text.match(/<em /g).length;
    if (html_text.match(/<em>/g) !== null) StartTagCnt += html_text.match(/<em>/g).length;
    if (html_text.match(/<@em>/g) !== null) EndTagCnt = html_text.match(/<@em>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <i>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<i>/g) !== null) StartTagCnt = html_text.match(/<i>/g).length;
    if (html_text.match(/<i /g) !== null) StartTagCnt += html_text.match(/<i /g).length;
    if (html_text.match(/<@i>/g) !== null) EndTagCnt = html_text.match(/<@i>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <strike>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<strike /g) !== null) StartTagCnt = html_text.match(/<strike /g).length;
    if (html_text.match(/<strike>/g) !== null) StartTagCnt += html_text.match(/<strike>/g).length;
    if (html_text.match(/<@strike>/g) !== null) EndTagCnt = html_text.match(/<@strike>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <strong>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<strong /g) !== null) StartTagCnt = html_text.match(/<strong /g).length;
    if (html_text.match(/<strong>/g) !== null) StartTagCnt += html_text.match(/<strong>/g).length;
    if (html_text.match(/<@strong>/g) !== null) EndTagCnt = html_text.match(/<@strong>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <a>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<a /g) !== null) StartTagCnt = html_text.match(/<a /g).length;
    if (html_text.match(/<@a>/g) !== null) EndTagCnt = html_text.match(/<@a>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <span>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<span /g) !== null) StartTagCnt = html_text.match(/<span /g).length;
    if (html_text.match(/<span>/g) !== null) StartTagCnt += html_text.match(/<span>/g).length;
    if (html_text.match(/<@span>/g) !== null) EndTagCnt = html_text.match(/<@span>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <br>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<br /g) !== null) StartTagCnt = html_text.match(/<br /g).length;
    if (html_text.match(/<br>/g) !== null) StartTagCnt += html_text.match(/<br>/g).length;
    if (html_text.match(/<@br>/g) !== null) EndTagCnt = html_text.match(/<@br>/g).length;
    if (html_text.match(/<br \/>/g) !== null) EndTagCnt = html_text.match(/<br \/>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <h1>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<h1 /g) !== null) StartTagCnt += html_text.match(/<h1 >/g).length;
    if (html_text.match(/<h1>/g) !== null) StartTagCnt += html_text.match(/<h1>/g).length;
    if (html_text.match(/<@h1>/g) !== null) EndTagCnt = html_text.match(/<@h1>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <h2>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<h2 /g) !== null) StartTagCnt += html_text.match(/<h2 >/g).length;
    if (html_text.match(/<h2>/g) !== null) StartTagCnt += html_text.match(/<h2>/g).length;
    if (html_text.match(/<@h2>/g) !== null) EndTagCnt = html_text.match(/<@h2>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    // <h3>
    StartTagCnt = 0; EndTagCnt = 0;
    if (html_text.match(/<h3 /g) !== null) StartTagCnt += html_text.match(/<h3 >/g).length;
    if (html_text.match(/<h3>/g) !== null) StartTagCnt += html_text.match(/<h3>/g).length;
    if (html_text.match(/<@h3>/g) !== null) EndTagCnt = html_text.match(/<@h3>/g).length;
    if (StartTagCnt !== EndTagCnt) return false;

    return true;
}

function ValidHTML() {
    var HTMLText = $("#ctl00_workarea_txt_p5_MessageText").val();
    if ($("#ctl00_workarea_cb_p5_ShowMessage").is(":checked") && HTMLText && !ValidateHTML(HTMLText)) {
        return false;
    }

    return true;
}

//#endregion