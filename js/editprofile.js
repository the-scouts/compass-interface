$(document).ready(FormReady);

$.ajaxSetup({ cache: false });
var vCurrentPage = 0;
var doingreset = false;

function FormReady() {
    SetUpPage(vIsReadonly, false);
    $("#ctl00_workarea_cbo_p1_Honours1, #ctl00_workarea_cbo_p1_Honours2, #ctl00_workarea_cbo_p1_Honours3").addClass("HONCHNG");
    $(".HONCHNG").change(function () {
        var Hons = "";
        $(".HONCHNG").each(function () {
            if ($("option:selected", this).val())
                Hons += $("option:selected", this).text() + " ";
        });
        $("#ctl00_workarea_txt_p1_honours").val(Hons);
    });
    $("#bn_p1_EditHonors").prop('value', $("#ctl00_workarea_txt_p1_honours").val() === "" ? "Add" : 'Edit').click(EditHonors);

    $("#ctl00_workarea_cbo_p9_hlevel").change(function () {
        $.ajax({
            url: WebServicePath() + "GetOrganisationVisibilityLevels?pLookupLevel=" + $("#ctl00_workarea_cbo_p9_hlevel option:selected").val(),
            success: function (result) {
                PopulateCBO("#ctl00_workarea_cbo_p9_name", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_name").val($("#ctl00_workarea_cbo_p9_hlevel").val()).attr("disabled", "disabled");
                PopulateCBO("#ctl00_workarea_cbo_p9_Role", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Role").val($("#ctl00_workarea_cbo_p9_hlevel").val()).attr("disabled", "disabled");

                PopulateCBO("#ctl00_workarea_cbo_p9_Address", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Address").val($("#ctl00_workarea_cbo_p9_hlevel").val());
                PopulateCBO("#ctl00_workarea_cbo_p9_Phone", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Phone").val($("#ctl00_workarea_cbo_p9_hlevel").val());
                PopulateCBO("#ctl00_workarea_cbo_p9_Email", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Email").val($("#ctl00_workarea_cbo_p9_hlevel").val());
                PopulateCBO("#ctl00_workarea_cbo_p9_Social", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Social").val($("#ctl00_workarea_cbo_p9_hlevel").val());
                PopulateCBO("#ctl00_workarea_cbo_p9_Quals", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Quals").val($("#ctl00_workarea_cbo_p9_hlevel").val());
                PopulateCBO("#ctl00_workarea_cbo_p9_Hobbies", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Hobbies").val($("#ctl00_workarea_cbo_p9_hlevel").val());
                PopulateCBO("#ctl00_workarea_cbo_p9_Awards", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Awards").val($("#ctl00_workarea_cbo_p9_hlevel").val());
                PopulateCBO("#ctl00_workarea_cbo_p9_Training", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Training").val($("#ctl00_workarea_cbo_p9_hlevel").val());
                PopulateCBO("#ctl00_workarea_cbo_p9_Permits", result, true, "--- not visible ---", true);
                $("#ctl00_workarea_cbo_p9_Permits").val($("#ctl00_workarea_cbo_p9_hlevel").val());

                if ($("#ctl00_workarea_cbo_p9_Address option").size() > 1) {
                    $("#ctl00_workarea_cbo_p9_Address option[value='']").remove();
                    $("#ctl00_workarea_cbo_p9_Phone option[value='']").remove();
                    $("#ctl00_workarea_cbo_p9_Email option[value='']").remove();
                    $("#ctl00_workarea_cbo_p9_Social option[value='']").remove();
                    $("#ctl00_workarea_cbo_p9_Quals option[value='']").remove();
                    $("#ctl00_workarea_cbo_p9_Hobbies option[value='']").remove();
                    $("#ctl00_workarea_cbo_p9_Awards option[value='']").remove();
                    $("#ctl00_workarea_cbo_p9_Training option[value='']").remove();
                    $("#ctl00_workarea_cbo_p9_Permits option[value='']").remove();
                }

                if ($("#ctl00_workarea_cbo_p9_Address option").length === 1)
                    $('#ctl00_workarea_cbo_p9_Address,#ctl00_workarea_cbo_p9_Phone,#ctl00_workarea_cbo_p9_Email,#ctl00_workarea_cbo_p9_Social,#ctl00_workarea_cbo_p9_Quals,#ctl00_workarea_cbo_p9_Hobbies,#ctl00_workarea_cbo_p9_Awards,#ctl00_workarea_cbo_p9_Training,#ctl00_workarea_cbo_p9_Permits').attr("disabled", "disabled");

                if (doingreset) { $("#mpage9 select").not(':first').each(function () { $(this).resetDB();  }); }
                doingreset = false;
                ResetRequired("#mpage9");
                SetEnabled();
            }, error: ServiceFailed
        });
    });
    $('#radio_p9_sohY').prop('checked', ($("#ctl00_workarea_h_txt_p9_sohy").val() === "Y"));
    $('#radio_p9_vulY').prop('checked', ($("#ctl00_workarea_h_txt_p9_vuly").val() === "Y"));
    setAddressPrimarys();

    $("input,select, textarea").change(CheckReq);

    if (!pk_val("Page.IsMe") || pk_val("Page.RemoveAccount"))
        $(".SECURE, #reqDivAv").remove();
    else
        SetAccountDetailsRequired(false);

    $("#popup_container .navbutton").click(function () { ChangePage(vCurrentPage, $(this).attr("id").replace("LBTN", "")); });

    $("#bn_p10_pwv").click(function () { checkPW(true); });

    $("#ctl00_workarea_txt_p2_email1,#ctl00_workarea_txt_p2_email2,#ctl00_workarea_txt_p2_email3").blur(function () { validateEmail(this); });
    $("#ctl00_workarea_txt_p2_tel1,#ctl00_workarea_txt_p2_tel2,#ctl00_workarea_txt_p2_tel3,#ctl00_workarea_txt_p6_tel1,#ctl00_workarea_txt_p6_tel2,#ctl00_workarea_txt_p6_tel3,#ctl00_workarea_txt_p7_doctel1,#ctl00_workarea_txt_p7_doctel2").keypress(function (e) { return NumberOnly_KeyPress(e || event, null); }).blur(function () { validatePhone(this); });
    //$("#ctl00_workarea_txt_p2_socmed1,#ctl00_workarea_txt_p2_socmed2,#ctl00_workarea_txt_p2_socmed3").keypress(function () { return validateWebAddress(this); });

    $("#bn_p2_QASLookup").click(function () {
        GetPAF('ctl00_workarea_txt_p2_addressline1¬ctl00_workarea_txt_p2_addressline2¬ctl00_workarea_txt_p2_addressline3¬ctl00_workarea_txt_p2_town¬ctl00_workarea_txt_p2_county¬ctl00_workarea_txt_p2_postcode¬ctl00_workarea_cbo_p2_country', 'ctl00_workarea_txt_p2_postcode', 11, 2);
    });

    $("#bn_p7_QASLookup").click(function () {
        GetPAF('ctl00_workarea_txt_p7_surgery1¬ctl00_workarea_txt_p7_surgery2¬ctl00_workarea_txt_p7_surgery3¬ctl00_workarea_txt_p7_town¬ctl00_workarea_txt_p7_county¬ctl00_workarea_txt_p7_postcode¬ctl00_workarea_cbo_p7_country', 'ctl00_workarea_txt_p7_postcode', 11, 7);
    });

    if (pk_val("Page.HideContactDetails")) { // hide contact details
        $(".YDH").remove();
        $("#ctl00_workarea_txt_p2_addressline1,#ctl00_workarea_txt_p2_email1, #ctl00_workarea_txt_p2_tel1").makeNotRequired(true);
    }
    else if (pk_val("Page.IsYouth")) { // make youth details non required
        $("#ctl00_workarea_txt_p2_addressline1,#ctl00_workarea_txt_p2_email1, #ctl00_workarea_txt_p2_tel1").makeNotRequired(true);
    }

    if (pk_val("Page.HideSocialMedia")) { // remove social media details
        $(".YDSH").remove();
    }

    if (pk_val("Page.HasMailingTab")) { // remove mailing/comm tab
        $(".RMagazineY, .MagazineY").AttrToData("mag");
        $(".RMSuppY").AttrToData("msupp");
    }

    if (pk_val("Page.HasVisibilityOptions")) {
        $("#radio_p9_sohY,#radio_p9_sohN").change(function () { SOHCHANGE(this); });
        SOHCHANGE('#radio_p9_sohY');
    }

    if (pk_val("Page.HasVulnerableOptions")) {
        $("#radio_p9_vulY,#radio_p9_vulN").change(vulCHANGE);
        vulCHANGE();
    }

    $("#bnReset1,#bnReset3,#bnReset4,#bnReset5,#bnReset6,#bnReset7,#bnReset8,#bnReset9,#bnReset10").click(function () {
        var vPageNo = parseInt($(this).attr("ID").replace("bnReset",""),10);
        return ResetPage(vPageNo);
    });

    $("#bnReset2").click(function () {
        var r2 = ResetPage(2);
        CheckEmails();
        ResetPage(2);
        return r2;
    });

    $("#bnNext1").click(function () { ChangePage(vCurrentPage, 2); });
    $("#bnNext2").click(function () { ChangePage(vCurrentPage, 3); });
    $("#bnNext3").click(function () { ChangePage(vCurrentPage, 4); });
    $("#bnNext4").click(function () { ChangePage(vCurrentPage, 5); });
    $("#bnNext5").click(function () { ChangePage(vCurrentPage, 6); });
    $("#bnNext6").click(function () { ChangePage(vCurrentPage, 7); });
    $("#bnNext7").click(function () { ChangePage(vCurrentPage, 8); });
    $("#bnNext8").click(function () { ChangePage(vCurrentPage, 9); });
    $("#bnNext9").click(function () { ChangePage(vCurrentPage, 10); });

    $("#bnPrev2").click(function () { return PrevPageClick(vCurrentPage, 1, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 1); });
    $("#bnPrev3").click(function () { return PrevPageClick(vCurrentPage, 2, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 2); });
    $("#bnPrev4").click(function () { return PrevPageClick(vCurrentPage, 3, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 3); });
    $("#bnPrev5").click(function () { return PrevPageClick(vCurrentPage, 4, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 4); });
    $("#bnPrev6").click(function () { return PrevPageClick(vCurrentPage, 5, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 5); });
    $("#bnPrev7").click(function () { return PrevPageClick(vCurrentPage, 6, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 6); });
    $("#bnPrev8").click(function () { return PrevPageClick(vCurrentPage, 7, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 7); });
    $("#bnPrev9").click(function () { return PrevPageClick(vCurrentPage, 8, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 8); });
    $("#bnPrev10").click(function () { return PrevPageClick(vCurrentPage, 9, ValidatePage, MakePageVisible, ResetPage); });  //ChangePage(vCurrentPage, 9); });

    $("#bnAddrBK").click(function () { AddressBack(); return false; });

    $("#ctl00_footer_bnSave1,#bnSave2,#bnSave3,#bnSave4,#bnSave5,#bnSave6,#bnSave7,#bnSave8,#bnSave9,#bnSave10").click(function () {
        var vPageNo = $(this).attr("ID").replace("ctl00_footer_", "").replace("bnSave", "");
        SaveForm(vPageNo);
        return false;
    });

    if (pk_val("Page.DoBChange")) {
        $("#bn_p1_dob").click(function () { PopupDoBSelect(this, 'ctl00_workarea_txt_p1_dob'); });
        $("#ctl00_workarea_txt_p1_dob").blur(function () { AddDoBFilter(); Date_TextBox_Blur(this, 'Must be over 5¾ years old'); });
    }
    else {
        $("#bn_p1_dob").remove();
        $("#ctl00_workarea_txt_p1_dob").attr("readonly", "readonly");
    }

    $("#ctl00_workarea_cbo_p2_contact_type1,#ctl00_workarea_cbo_p2_contact_type2,#ctl00_workarea_cbo_p2_contact_type3").change(function () { CheckEmails($(this).attr("id") === "ctl00_workarea_cbo_p2_contact_type1"); });
    $("#ctl00_workarea_txt_p2_email1").change(function () {
        if (!($('#ctl00_workarea_radio_p2_email1').prop('checked') || $('#ctl00_workarea_radio_p2_email2').prop('checked') || $('#ctl00_workarea_radio_p2_email3').prop('checked'))) {
            $('#ctl00_workarea_radio_p2_email1').prop('checked', true);
        }
    });
    $("#ctl00_workarea_txt_p2_tel1").change(function () {
        if (!($('#radio_p2_tel1').prop('checked') || $('#radio_p2_tel2').prop('checked') || $('#radio_p2_tel3').prop('checked'))) {
            $('#radio_p2_tel1').prop('checked', true);
        }
    });

    $("#ctl00_workarea_txt_p2_postcode").on("blur", function () { return validatePostCode($("#ctl00_workarea_txt_p2_postcode"), $('#ctl00_workarea_cbo_p2_country option:selected').attr("value") !== 'UK'); });
    $("#ctl00_workarea_cbo_p2_country").on("change", function () { return validatePostCode($("#ctl00_workarea_txt_p2_postcode"), $('#ctl00_workarea_cbo_p2_country option:selected').attr("value") !== 'UK'); });

    $("#ctl00_workarea_txt_p1_occdetail").autosize(10);
    $("#ctl00_workarea_txt_p7_dietary").autosize(10);
    $("#ctl00_workarea_txt_p7_medical").autosize(10);

    //#region Optimisations

    // countries
    Opt_GetCBO("#ctl00_workarea_h_cbo_p2_country", "--- Select Country ---", "#ctl00_workarea_cbo_p2_country,#ctl00_workarea_cbo_p7_country", 4);
    // nationality
    Opt_GetCBO("#ctl00_workarea_h_cbo_p1_nationality", "--- Select Nationality ---", "#ctl00_workarea_cbo_p1_nationality", 4);
    // honors
    Opt_GetCBO("#ctl00_workarea_h_cbo_p1_hons", "--- Select Honour ---", "#ctl00_workarea_cbo_p1_Honours1,#ctl00_workarea_cbo_p1_Honours2,#ctl00_workarea_cbo_p1_Honours3", undefined);
    // disabilities
    Opt_GetCBO("#ctl00_workarea_h_cbo_p3_disability", "--- Select Disability ---", "#cbo_p3_disability", 4);
    // qualifications
    Opt_GetCBO("#ctl00_workarea_h_cbo_p4_qualification", "--- Select Qualification ---", "#cbo_p4_qualification", 4);
    // hobbies
    Opt_GetCBO("#ctl00_workarea_h_cbo_p5_hobby", "--- Select Hobby ---", "#cbo_p5_hobby", 4);
    // ethnicities
    Opt_GetCBO("#ctl00_workarea_h_cbo_p1_ethnicity", "--- Select Ethnicity ---", "#ctl00_workarea_cbo_p1_ethnicity", 4);
    // faith
    Opt_GetCBO("#ctl00_workarea_h_cbo_p1_faith", "--- Select Faith/Religion ---", "#ctl00_workarea_cbo_p1_faith", 4);
    // occupation
    Opt_GetCBO("#ctl00_workarea_h_cbo_p1_occupation", "--- Select Occupation ---", "#ctl00_workarea_cbo_p1_occupation", 4);
    // Email
    Opt_GetCBO("#ctl00_workarea_h_cbo_p2_contact_type1", "--- Select ---", "#ctl00_workarea_cbo_p2_contact_type1,#ctl00_workarea_cbo_p2_contact_type2,#ctl00_workarea_cbo_p2_contact_type3", 7);
    // Phone
    Opt_GetCBO("#ctl00_workarea_h_cbo_p2_tel1", "--- Select ---", "#ctl00_workarea_cbo_p2_tel1,#ctl00_workarea_cbo_p2_tel2,#ctl00_workarea_cbo_p2_tel3", 4);
    // SocMedia
    Opt_GetCBO("#ctl00_workarea_h_cbo_p2_socmed1", "--- Select ---", "#ctl00_workarea_cbo_p2_socmed1,#ctl00_workarea_cbo_p2_socmed2,#ctl00_workarea_cbo_p2_socmed3", 4);
    // Visibility Levels
    Opt_GetCBO("#ctl00_workarea_h_cbo_p9_visibility", "--- Select Level ---", "#ctl00_workarea_cbo_p9_hlevel", 4);

    $("#ctl00_workarea_cbo_p9_hlevel,#ctl00_workarea_cbo_p2_country,#ctl00_workarea_cbo_p7_country,#ctl00_workarea_cbo_p1_nationality,#ctl00_workarea_cbo_p1_Honours1,#ctl00_workarea_cbo_p1_Honours2,#ctl00_workarea_cbo_p1_Honours3,#ctl00_workarea_cbo_p1_ethnicity,#ctl00_workarea_cbo_p1_faith,#ctl00_workarea_cbo_p1_occupation,#ctl00_workarea_cbo_p2_contact_type1,#ctl00_workarea_cbo_p2_contact_type2,#ctl00_workarea_cbo_p2_contact_type3,#ctl00_workarea_cbo_p2_tel1,#ctl00_workarea_cbo_p2_tel2,#ctl00_workarea_cbo_p2_tel3,#ctl00_workarea_cbo_p2_socmed1,#ctl00_workarea_cbo_p2_socmed2,#ctl00_workarea_cbo_p2_socmed3").each(function () { $(this).resetDB(); });

    //#endregion

    ResetRequired('#mpage1');
    ResetRequired('#mpage2');
    ResetRequired('#mpage6');
    ResetRequired('#mpage7');
    ResetRequired('#mpage9');
    ResetRequired('#mpage10');

    PopulateGridDiscCBO();
    PopulateGridQualCBO();
    PopulateGridHobbyCBO();

    PopulateDisabilities();
    PopulateQualifications();
    PopulateHobbies();

    $.AttrToData("db");

    // remove any pages/buttons we dont have access to
    if ($("#LBTN2").size() === 0) $("#mpage2,#fpage2").remove();
    if ($("#LBTN6").size() === 0) $("#mpage6,#fpage6").remove();
    if ($("#LBTN7").size() === 0) $("#mpage7,#fpage7").remove();
    if ($("#LBTN8").size() === 0) $("#mpage8,#fpage8").remove();
    if ($("#LBTN9").size() === 0) $("#mpage9,#fpage9").remove();
    if ($("#LBTN10").size() === 0) $("#mpage10,#fpage10").remove();

    SetEnabled();
    try { setTimeout(function () { MakePageVisible(parseInt(pk_val("Nav.StartPage"), 10)); }, PageVisibleDelay()); } catch (e) { }
    HasChanges = false;
}

function SaveForm(PageNo) {
    var BTNs = '#ctl00_footer_bnSave1,#bnSave2,#bnSave3,#bnSave4,#bnSave5,#bnSave6,#bnSave7,#bnSave8,#bnSave9,#bnSave10';
    if (ValidatePage(PageNo, BTNs) && SaveFormCheck(BTNs)){
        $(".HONCHNG").trigger("change");

        $("#ctl00_workarea_h_cb_p1_giftaid").val($("#ctl00_workarea_cb_p1_giftaid").prop("checked") ? "true" : "false");
        $("#ctl00_workarea_h_cbo_p1_ethnicity").val($("#ctl00_workarea_cbo_p1_ethnicity").val());
        $("#ctl00_workarea_h_cbo_p1_nationality").val($("#ctl00_workarea_cbo_p1_nationality").val());
        $("#ctl00_workarea_h_cbo_p1_faith").val($("#ctl00_workarea_cbo_p1_faith").val());
        $("#ctl00_workarea_h_cbo_p1_occupation").val($("#ctl00_workarea_cbo_p1_occupation").val());
        $("#ctl00_workarea_h_cbo_p2_country").val($("#ctl00_workarea_cbo_p2_country").val());
        $("#ctl00_workarea_h_cbo_p2_contact_type1").val($("#ctl00_workarea_cbo_p2_contact_type1").val());
        $("#ctl00_workarea_h_cbo_p2_contact_type2").val($("#ctl00_workarea_cbo_p2_contact_type2").val());
        $("#ctl00_workarea_h_cbo_p2_contact_type3").val($("#ctl00_workarea_cbo_p2_contact_type3").val());
        $("#ctl00_workarea_h_cbo_p2_tel1").val($("#ctl00_workarea_cbo_p2_tel1").val());
        $("#ctl00_workarea_h_cbo_p2_tel2").val($("#ctl00_workarea_cbo_p2_tel2").val());
        $("#ctl00_workarea_h_cbo_p2_tel3").val($("#ctl00_workarea_cbo_p2_tel3").val());
        $("#ctl00_workarea_h_cbo_p2_socmed1").val($("#ctl00_workarea_cbo_p2_socmed1").val());
        $("#ctl00_workarea_h_cbo_p2_socmed2").val($("#ctl00_workarea_cbo_p2_socmed2").val());
        $("#ctl00_workarea_h_cbo_p2_socmed3").val($("#ctl00_workarea_cbo_p2_socmed3").val());
        $("#ctl00_workarea_h_cbo_p7_country").val($("#ctl00_workarea_cbo_p7_country").val());
        $("#ctl00_workarea_h_cbo_p9_hlevel").val($("#ctl00_workarea_cbo_p9_hlevel").val());

        if ($("#radio_p2_tel1").is(':checked')) { $("#ctl00_workarea_h_txt_p2_telp2main").val("1"); }
        if ($("#radio_p2_tel2").is(':checked')) { $("#ctl00_workarea_h_txt_p2_telp2main").val("2"); }
        if ($("#radio_p2_tel3").is(':checked')) { $("#ctl00_workarea_h_txt_p2_telp2main").val("3"); }

        if ($("#ctl00_workarea_radio_p2_email1").is(':checked')) { $("#ctl00_workarea_h_txt_p2_emailp2main").val("1"); }
        if ($("#ctl00_workarea_radio_p2_email2").is(':checked')) { $("#ctl00_workarea_h_txt_p2_emailp2main").val("2"); }
        if ($("#ctl00_workarea_radio_p2_email3").is(':checked')) { $("#ctl00_workarea_h_txt_p2_emailp2main").val("3"); }

        if ($("#radio_p9_sohY").is(':checked')) { $("#ctl00_workarea_h_txt_p9_sohy").val("Y"); } else { $("#ctl00_workarea_h_txt_p9_sohy").val("N"); }
        if ($("#radio_p9_vulY").is(':checked')) { $("#ctl00_workarea_h_txt_p9_vuly").val("Y"); } else { $("#ctl00_workarea_h_txt_p9_vuly").val("N"); }

        var MyData = "";
        $("#tbl_p3_disabilities tr").not(':first').not(':last').each(function () {
            if ($(":selected", this).val()) {
                MyData += $(":selected", this).val() + "~" + $(".DisTXT", this).val().RemoveUnwanted() + "¬";
            }
        });
        $("#ctl00_workarea_h_txt_p3_Specialneedsformatted").val(MyData);

        MyData = "";
        $("#tbl_p4_qualifications tr").not(':first').not(':last').each(function () {
            if ($(":selected", this).val()) {
                MyData += $(":selected", this).val() + "~" + $(".QualTXT", this).val().RemoveUnwanted() + "¬"; // make separators unique
            }
        });
        $("#ctl00_workarea_h_txt_p4_qualificationsformatted").val(MyData);

        MyData = "";
        $("#tbl_p5_hobbies tr").not(':first').not(':last').each(function () {
            if ($(":selected", this).val()) {
                MyData += $(":selected", this).val() + "~" + $(".HobbyTXT", this).val().RemoveUnwanted() + "¬"; // make separators unique
            }
        });
        $("#ctl00_workarea_h_txt_p5_hobbiesformatted").val(MyData);

        //DR1718 - Marketing
        MyData = "";
        $(".Marketing_Y").each(function () {
            if (MyData) MyData += "¬";
            MyData += $(this).data("grp") + "~" + $(this).data("code");
            //add them all, whether selected or not, so we get a complete list of all the marketing activities in use
            if ($(this).prop("checked")) {
                MyData += "~Y";
            }
            else {
                MyData += "~N";
            }
        });
        $("#ctl00_workarea_h_lst_p8_hiddenmktg").val(MyData);

        MyData = "";
        $("#ctl00_workarea_tbl_p9_options .optionlevel").each(function () {
            if ($(":selected", this).val())
                MyData += ($("input[type='checkbox']", $(this).closest("tr")).is(":checked") ? "Y":"N") + "~" + $(this).attr("id").replace("ctl00_workarea_cbo_p9_", "") + "~" + $(":selected", this).val() + "¬";
        });
        $("#ctl00_workarea_h_lst_p9_hiddencbos").val(MyData);

        MyData = "";
        $("#tbl_p8_mailsupp .RMSuppY").each(function () {
            if ($(this).prop("checked")) {
                if (MyData) MyData += "¬";
                MyData += $(this).data("msupp") + "~";
            }
        });
        $("#ctl00_workarea_h_lst_p8_hiddenoptmailings").val(MyData);

        // url encode PW fields
        var vSTR = "";
        if ($("#ctl00_workarea_txt_p10_PW").val()) {
            vSTR = encodeURIComponent($("#ctl00_workarea_txt_p10_PW").val());
            $("#ctl00_workarea_txt_p10_PW").val(vSTR);
        }

        if ($("#ctl00_workarea_txt_p10_PW_New1").val()) {
            vSTR = encodeURIComponent($("#ctl00_workarea_txt_p10_PW_New1").val());
            $("#ctl00_workarea_txt_p10_PW_New1").val(vSTR);

            vSTR = encodeURIComponent($("#ctl00_workarea_txt_p10_PW_New2").val());
            $("#ctl00_workarea_txt_p10_PW_New2").val(vSTR);
        }

        // always returning false and manually calling post routine (mainly for PW validation check)
        MakeFormReadonlyForSave("#bn_p1_EditHonors,.DisDBN,.QualDBN,.HobbyDBN,#bn_p10_pwv");
        __doPostBack('ctl00$footer$bnSave1', '');
    }
    return false;
}

function MakePageVisible(PageNo) {
    try {
        vCurrentPage = PageNo;
        MakeTabVisible(PageNo);
        if (PageNo === 1) $.FocusControl("#ctl00_workarea_cbo_p3_title");
        if (PageNo === 2) {
            if ($.Is_FireFox()) $("#td_p4_primary").css("text-align", "center");
            $.FocusControl("#ctl00_workarea_txt_p4_findpostcode");
        }
        if (PageNo === 12) { $('#LBTN2').addClass("navbutton_Disabled_Selected").data("selected", "Y"); }
    }
    catch (err) { }
    return false;
}

function CheckReq() {
    if (vCurrentPage === 10 && pk_val("Page.IsMe"))
        SetAccountDetailsRequired(false);

    ShowRequired(this);
}

function ValidatePage(PageNo, Savebuttons) {
    if (vIsReadonly) return true;

    PageNo = parseInt(PageNo, 10);

    vValid = true;
    if (PageNo === 2) {
        //Validate Telephone contacts
        PairedValidation("ctl00_workarea_cbo_p2_tel1", "ctl00_workarea_txt_p2_tel1");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p2_tel2", "ctl00_workarea_txt_p2_tel2");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p2_tel3", "ctl00_workarea_txt_p2_tel3");
        if (!vValid) return vValid;
        if ($("#ctl00_workarea_cbo_p2_tel1").val() || $("#ctl00_workarea_cbo_p2_tel2").val() || $("#ctl00_workarea_cbo_p2_tel3").val()) {
            if (!($('#radio_p2_tel1').prop('checked') || $('#radio_p2_tel2').prop('checked') || $('#radio_p2_tel3').prop('checked'))) {
                vValid = false;
                $.system_alert('No Primary set for telephone contacts', $('#radio_p2_tel1'));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p2_tel1").val() === "" && $('#radio_p2_tel1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#ctl00_workarea_cbo_p2_tel1"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p2_tel2").val() === "" && $('#radio_p2_tel2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#ctl00_workarea_cbo_p2_tel2"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p2_tel3").val() === "" && $('#radio_p2_tel3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary telephone has no details', $("#ctl00_workarea_cbo_p2_tel3"));
                return vValid;
            }
        }
        //Validate Email contacts
        PairedValidation("ctl00_workarea_cbo_p2_contact_type1", "ctl00_workarea_txt_p2_email1");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p2_contact_type2", "ctl00_workarea_txt_p2_email2");
        if (!vValid) return vValid;
        PairedValidation("ctl00_workarea_cbo_p2_contact_type3", "ctl00_workarea_txt_p2_email3");
        if (!vValid) return vValid;
        if ($("#ctl00_workarea_cbo_p2_contact_type1").val() || $("#ctl00_workarea_cbo_p2_contact_type2").val() || $("#ctl00_workarea_cbo_p2_contact_type3").val()) {
            if (!($('#ctl00_workarea_radio_p2_email1').prop('checked') || $('#ctl00_workarea_radio_p2_email2').prop('checked') || $('#ctl00_workarea_radio_p2_email3').prop('checked'))) {
                vValid = false;
                $.system_alert('No Primary set for Email contacts', $("#ctl00_workarea_cbo_p2_contact_type1"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p2_contact_type1").val() === "" && $('#ctl00_workarea_radio_p2_email1').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#ctl00_workarea_cbo_p2_contact_type1"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p2_contact_type2").val() === "" && $('#ctl00_workarea_radio_p2_email2').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#ctl00_workarea_cbo_p2_contact_type2"));
                return vValid;
            }
            if (($("#ctl00_workarea_cbo_p2_contact_type3").val() === "" && $('#ctl00_workarea_radio_p2_email3').prop('checked'))) {
                vValid = false;
                $.system_alert('Primary Email has no details', $("#ctl00_workarea_cbo_p2_contact_type3"));
                return vValid;
            }
        }

        if (!pk_val("Page.HideSocialMedia")) {
            //Validate Social Media contacts
            PairedValidation("ctl00_workarea_cbo_p2_socmed1", "ctl00_workarea_txt_p2_socmed1");
            if (!vValid) return vValid;
            PairedValidation("ctl00_workarea_cbo_p2_socmed2", "ctl00_workarea_txt_p2_socmed2");
            if (!vValid) return vValid;
            PairedValidation("ctl00_workarea_cbo_p2_socmed3", "ctl00_workarea_txt_p2_socmed3");
        }

        if (!vValid) return vValid;

    }
    else if (PageNo === 3) {
        $("#tbl_p3_disabilities tr :last").each(function () {
            if (!$(":selected", this).val() && $(".DisTXT", this).val()) {
                vValid = false;
                $.system_alert('No usage entered for description ' + $(".DisTXT", this).val(), $(".DisCBO", this));
                return vValid;
            }
        });
    }
    else if (PageNo === 4) {
        $("#tbl_p4_qualifications tr :last").each(function () {
            if (!$(":selected", this).val() && $(".QualTXT", this).val()) {
                vValid = false;
                $.system_alert('No usage entered for description ' + $(".QualTXT", this).val(), $(".QualCBO", this));
                return vValid;
            }
        });
    }
    else if (PageNo === 5) {
        $("#tbl_p5_hobbies tr :last").each(function () {
            if (!$(":selected", this).val() && $(".HobbyTXT", this).val()) {
                vValid = false;
                $.system_alert('No usage entered for description ' + $(".HobbyTXT", this).val(), $(".HobbyCBO", this));
                return vValid;
            }
        });
    }
    else if (PageNo === 10) {
        if (pk_val("Page.IsMe"))
            SetAccountDetailsRequired(true);

        if (pk_val("Page.IsMe") && ($("#ctl00_workarea_txt_p10_PW_New1").val() || $("#ctl00_workarea_txt_p10_PW_New2").val()) && $("#ctl00_workarea_txt_p10_PW_New1").val() !== $("#ctl00_workarea_txt_p10_PW_New2").val()) {
            $("#ll_p10_message").text("Your new Passwords don't match.");
            $("#ll_p10_message").css("color", "red");
            $("#ctl00_workarea_txt_p10_PW_New1,#ctl00_workarea_txt_p10_PW_New2").css("display", "");
            SetControlError("#ctl00_workarea_txt_p10_PW_New1,#ctl00_workarea_txt_p10_PW_New2", true);
            vValid = false;
        }
        else {
            $("#ll_p10_message").text("");
        }

        if (pk_val("Page.IsMe") && vValid && ($("#ctl00_workarea_txt_p10_PW").val() || $("#ctl00_workarea_txt_p10_PW_New1").val())) {
            var vData = {}; //var vData = new FormData();
            vData["pRoutine"] = "CRED_CHECK";
            vData["pCN"] = pk_val("Master.User.CN");
            vData["pOPW"] = encodeURIComponent($("#ctl00_workarea_txt_p10_PW").val());
            vData["pNPW"] = encodeURIComponent($("#ctl00_workarea_txt_p10_PW_New1").val());
            vData["pNQ"] = encodeURIComponent($("#ctl00_workarea_txt_p10_Question").val());

            PostToHandler(vData, "/System/Funcs", ProcessPWValidate, ProcessPWValidate);
        }
    }

    if (vValid) {
        var OrigHasChanges = HasChanges;
        if ((PageNo === 10 && pk_val("Page.IsMe")) || PageNo !== 10)
            $('input,select', $('#mpage' + PageNo)).each(CheckReq);
        HasChanges = OrigHasChanges;
    }

    return vValid;
}

function ChangePage(FromPageNo, ToPageNo, AlreadyValidated) {
    ToPageNo = parseInt(ToPageNo, 10);
    if (AlreadyValidated || ValidatePage(FromPageNo)) {
        if ($("#LBTN" + ToPageNo).size() === 0 || $("#LBTN" + ToPageNo).prop("style").display === "none") {
            if (FromPageNo < ToPageNo)
                ToPageNo = ToPageNo + 1;
            else
                ToPageNo = ToPageNo - 1;

            if (ToPageNo < 1 || ToPageNo > 10)
                ToPageNo = FromPageNo;

            ChangePage(FromPageNo, ToPageNo, true);
        }
        else
            MakePageVisible(ToPageNo);
    }
    return false;
}

function ResetPage(PageNo) {
    $("#mpage" + PageNo + " input").not("[type='button']").each(function () { $(this).resetDB(); });
    if (PageNo !== 9) $("#mpage" + PageNo + " select").each(function () { $(this).resetDB(); });
    $("#mpage" + PageNo + " textarea").each(function () { $(this).resetDB(); });

    ResetRequired('#mpage' + PageNo);

    if (PageNo === 1) { $("#bn_p1_EditHonors").val($("#ctl00_workarea_txt_p1_honours").val() === "" ? "Add" : "Edit"); }
    if (PageNo === 2) { setAddressPrimarys(); }
    if (PageNo === 3) { $("#tbl_p3_disabilities .DisDBN").each(RemoveDisability); PopulateDisabilities(); return false; }
    if (PageNo === 4) { $("#tbl_p4_qualifications .QualDBN").each(RemoveQualification); PopulateQualifications(); return false; }
    if (PageNo === 5) { $("#tbl_p5_hobbies .HobbyDBN").each(RemoveHobby); PopulateHobbies(); return false; }
    if (PageNo === 8) { $("#mpage8 input[type='radio']").each(function () { $(this).prop('checked', ($(this).data("db") === "True")); }); }
    if (PageNo === 9) {
        doingreset = true;
        $("#ctl00_workarea_cbo_p9_hlevel").val($("#ctl00_workarea_cbo_p9_hlevel").data("db")).trigger("change");
        if ($("#ctl00_workarea_h_txt_p9_sohy").val() === "Y") $('#radio_p9_sohY').prop('checked', 'checked');
        else $('#radio_p9_sohN').prop('checked', 'checked');
        SOHCHANGE('#radio_p9_sohY');
        if ($("#ctl00_workarea_h_txt_p9_vuly").val() === "Y") $('#radio_p9_vulY').prop('checked', 'checked');
        else $('#radio_p9_vulN').prop('checked', 'checked');
        vulCHANGE();
    }
    if (PageNo === 10) {
        if (pk_val("Page.IsMe"))
            SetAccountDetailsRequired(true);
        $("#ll_p10_message").text("");
        // clear file upload edit
        var control = $("#ctl00_workarea_fuPicture");
        control.replaceWith(control = control.clone(true));
    }

    return false;
}

//#region Page 1

function AddDoBFilter() {
    var d = new Date();
    d.setYear(d.getFullYear() - 6); // remove 18 years for a "best guess" start point
    //allow Beavers to join from 5.75 years old
    d.setDate(d.getDate() + 94); // add 94 days (= 366/4 = 91.5 round up to 92 and add 2 days to cover edge cases/leap years)
    calPopup.addDisabledDates(formatDate(d, DisplayDateFormat), null);
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
    if ($(self).val() === "") return true;
    calPopup.clearDisabledDates();
    AddDoBFilter();
    return Date_TextBox_Blur(self, 'Must be over 17½');
}

function EditHonors() {
    if ($(this).prop("value") === "Hide") {
        $("#div_p1_EditHonors").slideUp(300);
        $(this).prop('value', $("#ctl00_workarea_txt_p1_honours").val() === "" ? "Add" : 'Edit');
    }
    else {
        $("#div_p1_EditHonors").slideDown(300);
        $(this).prop('value', 'Hide');
    }
}

//#endregion

//#region Page 2

function setAddressPrimarys() {
    $('#radio_p2_tel1').prop('checked', ($("#ctl00_workarea_h_txt_p2_telp2main").val() === "1"));
    $('#radio_p2_tel2').prop('checked', ($("#ctl00_workarea_h_txt_p2_telp2main").val() === "2"));
    $('#radio_p2_tel3').prop('checked', ($("#ctl00_workarea_h_txt_p2_telp2main").val() === "3"));
    $('#ctl00_workarea_radio_p2_email1').prop('checked', ($("#ctl00_workarea_h_txt_p2_emailp2main").val() === "1"));
    $('#ctl00_workarea_radio_p2_email2').prop('checked', ($("#ctl00_workarea_h_txt_p2_emailp2main").val() === "2"));
    $('#ctl00_workarea_radio_p2_email3').prop('checked', ($("#ctl00_workarea_h_txt_p2_emailp2main").val() === "3"));
}

function CheckEmails(showWarning) {
    if ($("#ctl00_workarea_cbo_p2_contact_type1 option:selected").val() === pk_val("Const.NOEMAILVALUE")) {
        //set default 'no email' text in email addr 1 and disable both it and all the other email fields

        $("#ctl00_workarea_radio_p2_email1").prop("checked", true);
        $(".noEmail").attr("disabled", "disabled").val("");
        $("#ctl00_workarea_txt_p2_email1").val(pk_val("Const.NOEMAILDESC"));
        $("#ctl00_workarea_h_txt_p2_emailp2main").val("1");

        if (pk_val("Page.IsDesignated") && showWarning) ShowEmailWarning();
    }
    else {
        $(".noEmail").removeAttr("disabled");
        if ($("#ctl00_workarea_txt_p2_email1").val() === pk_val("Const.NOEMAILDESC")) $("#ctl00_workarea_txt_p2_email1").val("");

        if (($("#ctl00_workarea_cbo_p2_contact_type2 option:selected").val() === "") && ($("#ctl00_workarea_cbo_p2_contact_type3 option:selected").val() === "")) {
            //if no email type selected in 2 or 3, ensure we have a 'no email' option in 1
            if ($("#ctl00_workarea_cbo_p2_contact_type1 option[value='" + pk_val("Const.NOEMAILVALUE") + "']").length === 0)
                $("#ctl00_workarea_cbo_p2_contact_type1").append("<option value='" + pk_val("Const.NOEMAILVALUE") + "'>" + pk_val("Const.NOEMAILTEXT") + "</option>");
        }
        else {
            //if 2 or 3 has an email type selected, 'no email' should not be an option in 1
            $("#ctl00_workarea_cbo_p2_contact_type1 option[value='" + pk_val("Const.NOEMAILVALUE") + "']").remove();
        }
    }
    ResetRequired("#mpage2");
    SetEnabled();
}

function ShowEmailWarning() {
    var msg;

    if (pk_val("Page.IsMe"))
        msg = "You are currently set as a designated contact for one or more young people.<br /><br />Note that by removing your email address, you will no longer receive emails on their behalf.";
    else
        msg = "This person is set as a designated contact for one or more young people.<br /><br />Note that by removing their email address, they will no longer receive emails on behalf of the young people.";
    $.system_alert(msg, $("#ctl00_workarea_cbo_p2_contact_type1"), undefined, false, "Warning");
}

//#endregion

//#region Page 3

function PopulateDisabilities() {
    if ($("#ctl00_workarea_h_txt_p3_Specialneedsformatted").val()) {
        var mvData = $.parseJSON($("#ctl00_workarea_h_txt_p3_Specialneedsformatted").val());
        for (var i = 0; i < mvData.length ; i++)
            InitialiseDisability(mvData[i].Code, mvData[i].Desc);
    }
}

function SetPage3Events() {
    $(".DisCBO").last().change(DisCHANGE).closest("tr").addClass("msTR");
    $(".DisDBN").last().click(RemoveDisability).css({ "visibility": "hidden" });
}

function InitialiseDisability(plookup, pdetail) {
    $('.DisTXT').last().val(pdetail);
    $('.DisCBO').last().val(plookup).trigger("change");
}

function AddDisability() {
    $(".DisDBN").css({ "visibility": "visible" });
    $("#tbl_p3_disabilities").append("<tr>" + $("#tbl_p3_disabilities tr").last().html() + "</tr>");
    PopulateGridDiscCBO();
}

function DisCHANGE() {
    var self = this;
    $("#tbl_p3_disabilities tr:not(:first)").not(':last').each(function () {
        if ($(":selected", this).attr("value") === $(self).val() && $(":selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
            $.system_alert('This disability has already been used', $(".DisCBO", $(self)));
            if ($(".DisCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else $(self).val($(self).data("orig"));
            return;
        }
    });
    if ($(self).val()) { $(".DisCBO option[value='']", $(self).parent()).remove(); $(self).data("orig", $(self).val()); }
    if ($('.DisCBO').last().val()) AddDisability();
}

function PopulateGridDiscCBO() {
    SetPage3Events();
    $('.DisCBO').last().html($("#cbo_p3_disability").html()).removeData("ng_id");
    $('.DisTXT').last().val(""); //needed to fix ie8 bug
}

function RemoveDisability() {
    if ($("#tbl_p3_disabilities tr").not(":first").length === 1)
        $(".DisTXT,.DisCBO", $(this).closest("tr")).val("");
    else
        $(this).closest("tr").remove();
}

//#endregion

//#region Page 4

function PopulateQualifications() {
    if ($("#ctl00_workarea_h_txt_p4_qualificationsformatted").val()) {
        var mvData = $.parseJSON($("#ctl00_workarea_h_txt_p4_qualificationsformatted").val());
        for (var i = 0; i < mvData.length ; i++)
            InitialiseQualifications(mvData[i].Code, mvData[i].Desc);
    }
}

function SetPage4Events() {
    $(".QualCBO").last().change(QualCHANGE).closest("tr").addClass("msTR");
    $(".QualDBN").last().click(RemoveQualification).css({ "visibility": "hidden" });
}

function InitialiseQualifications(plookup, pdetail) {
    $('.QualTXT').last().val(pdetail.replace("&#39;", "'"));
    $('.QualCBO').last().val(plookup).trigger("change");
}

function AddQualification() {
    $(".QualDBN").css({ "visibility": "visible" });
    $("#tbl_p4_qualifications").append("<tr>" + $("#tbl_p4_qualifications tr").last().html() + "</tr>");
    PopulateGridQualCBO();
}

function QualCHANGE() {
    var self = this;
    $("#tbl_p4_qualifications tr:not(:first)").not(':last').each(function () {
        if ($(":selected", this).val() === $(self).val() && $(":selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
            $.system_alert('This qualification has already been used', $(".QualCBO", $(self)));
            if ($(".QualCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else $(self).val($(self).data("orig"));
            return;
        }
    });
    if ($(self).val()) { $(".QualCBO option[value='']", $(self).parent()).remove(); $(self).data("orig", $(self).val()); }
    if ($('.QualCBO').last().val()) AddQualification();
}

function PopulateGridQualCBO() {
    SetPage4Events();
    $('.QualCBO').last().html($("#cbo_p4_qualification").html()).removeData("ng_id");
    $('.QualTXT').last().val(""); //needed to fix ie8 bug
}

function RemoveQualification() {
    if ($("#tbl_p4_qualifications tr").not(":first").length === 1)
        $(".QualTXT,.QualCBO", $(this).closest("tr")).val("");
    else
        $(this).closest("tr").remove();
}

//#endregion

//#region Page 5

function PopulateHobbies() {
    if ($("#ctl00_workarea_h_txt_p5_hobbiesformatted").val()) {
        var mvData = $.parseJSON($("#ctl00_workarea_h_txt_p5_hobbiesformatted").val());
        for (var i = 0; i < mvData.length ; i++)
            InitialiseHobbies(mvData[i].Code, mvData[i].Desc);
    }
}

function SetPage5Events() {
    $(".HobbyCBO").last().change(HobbyCHANGE).closest("tr").addClass("msTR");
    $(".HobbyDBN").last().click(RemoveHobby).css({ "visibility": "hidden" });
}

function InitialiseHobbies(plookup, pdetail) {
    $('.HobbyTXT').last().val(pdetail.replace("&#39;", "'"));
    $('.HobbyCBO').last().val(plookup).trigger("change");
}

function AddHobby() {
    $(".HobbyDBN").css({ "visibility": "visible" });
    $("#tbl_p5_hobbies").append("<tr>" + $("#tbl_p5_hobbies tr").last().html() + "</tr>");
    PopulateGridHobbyCBO();
}

function HobbyCHANGE() {
    var self = this;
    $("#tbl_p5_hobbies tr:not(:first)").not(':last').each(function () {
        if ($(":selected", this).val() === $(self).val() && $(":selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
            $.system_alert('This hobby has already been used', $(":selected", $(self)));
            if ($(".HobbyCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else $(self).val($(self).data("orig"));
            return;
        }
    });
    if ($(self).val()) { $(".HobbyCBO option[value='']", $(self).parent()).remove(); $(self).data("orig", $(self).val()); }
    if ($('.HobbyCBO').last().val()) AddHobby();
}

function PopulateGridHobbyCBO() {
    SetPage5Events();
    $('.HobbyCBO').last().html($("#cbo_p5_hobby").html()).removeData("ng_id");
    $('.HobbyTXT').last().val(""); //needed to fix ie8 bug
}

function RemoveHobby() {
    if ($("#tbl_p5_hobbies tr").not(":first").length === 1)
        $(".HobbyTXT,.HobbyCBO", $(this).closest("tr")).val("");
    else
        $(this).closest("tr").remove();
}

//#endregion

//#region Page 9

function vulCHANGE() {
    if ($("#radio_p9_vulY").prop('checked')) {
        $("#radio_p9_sohN").prop('checked', 'checked');
        SOHCHANGE($("#radio_p9_sohN"));
        $("#radio_p9_sohN,#radio_p9_sohY").attr("disabled", "disabled");
    }
    else {
        $("#radio_p9_sohN,#radio_p9_sohY").removeAttr("disabled");
    }
}

function SOHCHANGE(self) {
    if (($(self).attr("id") === "radio_p9_sohY" && !$(self).prop('checked')) || ($(self).attr("id") === "radio_p9_sohN" && $(self).prop('checked'))) {
        $("#ctl00_workarea_cbo_p9_hlevel").val("").trigger("change").removeAttr("required");
        $('#ctl00_workarea_cbo_p9_hlevel').each(function () { ShowRequired(this, false); SetControlError(this, false); });
        $("#ctl00_workarea_cbo_p9_hlevel, .cbVisibilityGRP").attr("disabled", "disabled");
        $("#ctl00_workarea_tbl_p9_options input[type=checkbox]").prop("checked", false);
    }
    else {
        $("#ctl00_workarea_cbo_p9_hlevel, .cbVisibilityGRP").removeAttr("disabled").attr("required", "required");
        $('#ctl00_workarea_cbo_p9_hlevel').each(function () { $(this).attr("required", "required"); ShowRequired(this, true); });
        $("#ctl00_workarea_cb_p9_name, #ctl00_workarea_cb_p9_Role").prop("checked", true);
    }
    ResetRequired("#mpage9");
    SetEnabled();
}

//#endregion

//#region Page 10

function checkPW(pFromClick) {
    if (!$("#ctl00_workarea_txt_p10_PW").val()) {
        SetControlError("#ctl00_workarea_txt_p10_PW", true);
        return;
    }

    //if (pk_val("Page.IsMe") && vValid && ($("#ctl00_workarea_txt_p10_PW").val() || $("#ctl00_workarea_txt_p10_PW_New1").val())) {
    if (pk_val("Page.IsMe") && ($("#ctl00_workarea_txt_p10_PW").val() && $("#ctl00_workarea_txt_p10_PW_New1").val())) {
        var vData = {}; //var vData = new FormData();
        vData["pRoutine"] = "CRED_CHECK";
        vData["pCN"] = pk_val("Master.User.CN");
        vData["pOPW"] = encodeURIComponent($("#ctl00_workarea_txt_p10_PW").val());
        vData["pNPW"] = encodeURIComponent($("#ctl00_workarea_txt_p10_PW_New1").val());
        vData["pNQ"] = encodeURIComponent($("#ctl00_workarea_txt_p10_Question").val());

        var LocalFunc = function (result) { ProcessPWValidate(result, pFromClick); };
        PostToHandler(vData, "/System/Funcs", LocalFunc, LocalFunc);
    }
}

function ProcessPWValidate(JSONresult, fromClick) {
    if ((JSONresult.responseText || JSONresult) !== "OK") {
        MakePageVisible(10);
        if ((JSONresult.responseText || JSONresult).indexOf("current password") > 0)
            SetControlError("#ctl00_workarea_txt_p10_PW", true);
        else
            SetControlError("#ctl00_workarea_txt_p10_PW_New1", true);
        $("#ll_p10_message").text(JSONresult.responseText || JSONresult).css("color","red");
        vValid = false;
    }
    else {
        if (fromClick === true) {
            $("#ll_p10_message").text("New password OK").css("color", "green");
            setTimeout(function () { $("#ll_p10_message").text(""); }, 5000);
        }
        else
            $("#ll_p10_message").text("");
    }
}

function SetAccountDetailsRequired(DoReqcheck) {
    var vPWReq = false;
    SetControlError("#ctl00_workarea_txt_p10_PW_New1,#ctl00_workarea_txt_p10_PW_New2", false);
    ResetRequired('#mpage10');
    $("#PW1_ERROR").css("display", "none");
    if ($("#ctl00_workarea_txt_p10_PW_New1").val() || $("#ctl00_workarea_txt_p10_PW_New2").val()) {
        vPWReq = true;
        $("#ctl00_workarea_txt_p10_PW_New2").attr("required", "required");
        $("#PW1").css("display", "");
    }
    else {
        $("#ctl00_workarea_txt_p10_PW_New2").removeAttr("required");
        $("#PW1").css("display", "none");
    }

    if ($("#ctl00_workarea_txt_p10_Question").val() !== $("#ctl00_workarea_txt_p10_Question").data("db") || $("#ctl00_workarea_txt_p10_Answer").val() !== $("#ctl00_workarea_txt_p10_Answer").data("db"))
        vPWReq = true;

    if (vPWReq) {
        $("#ctl00_workarea_txt_p10_PW").attr("required", "required");
        $("#PW").css("display", "");
    }
    else {
        $("#ctl00_workarea_txt_p10_PW").removeAttr("required");
        $("#PW").css("display", "none");
    }

    if (DoReqcheck)
        $('input', $('#mpage10')).each(function () { ShowRequired(this); });
}

//#endregion

