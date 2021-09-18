$(document).ready(FormReady);
var vCurrentPage = 1;
function FormReady() {
    try {
        $("input").keydown(function (event) {
            var e = event || window.event; // for trans-browser compatibility
            var charCode = e.which || e.keyCode;
            if (charCode === 13) {
                if ($("*:focus").attr("id") === "ctl00_workarea_txt_p2_dob" && !ValidateDoB($("#ctl00_workarea_txt_p2_dob"))) return;
                DoMemberSearch();
            }
        });

        SetUpPage(false, false);

        //#region Location Lookups

        var f_p2_Country = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p2_Region", result, undefined, undefined, undefined, undefined, "--- Select Location ---");
            if ($('#ctl00_workarea_cbo_p2_Region option').size() > 1) $('#ctl00_workarea_cbo_p2_Region').removeAttr("disabled");
            $("#ctl00_workarea_cbo_p2_RoleLevels").trigger("change");
            SetEnabled();
        };
        var f_p2_region = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p2_County", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            if ($('#ctl00_workarea_cbo_p2_County option').size() > 1) $('#ctl00_workarea_cbo_p2_County').removeAttr("disabled");
            SetEnabled();
        };
        var f_p2_county = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p2_District", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            if ($('#ctl00_workarea_cbo_p2_District option').size() > 1) $('#ctl00_workarea_cbo_p2_District').removeAttr("disabled");
            SetEnabled();
        };
        var f_p2_district = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p2_Group", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            if ($('#ctl00_workarea_cbo_p2_Group option').size() > 1) $('#ctl00_workarea_cbo_p2_Group').removeAttr("disabled");
            SetEnabled();
        };

        $("#ctl00_workarea_cbo_p2_Country").change(function () {
            if ($("#ctl00_workarea_cbo_p2_Country option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p2_Country option:selected").val();
                    PostToHandler(vData, "/hierarchy/regions", f_p2_Country, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutRegions?pCountryID=" + $("#ctl00_workarea_cbo_p2_Country option:selected").val(), success: f_p2_Country, error: ServiceFailed });
                }

                $('#ctl00_workarea_cbo_p2_County,#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p2_County,#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group').attr("disabled", "disabled");
            }
            else {
                $('#ctl00_workarea_cbo_p2_County,#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group,#ctl00_workarea_cbo_p2_Region').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p2_County,#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group,#ctl00_workarea_cbo_p2_Region').attr("disabled", "disabled");
                $("#ctl00_workarea_cbo_p2_RoleLevels").trigger("change");
                SetEnabled();
            }
        });

        $("#ctl00_workarea_cbo_p2_Region").change(function () {
            if ($("#ctl00_workarea_cbo_p2_Region option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p2_Region option:selected").val();
                    PostToHandler(vData, "/hierarchy/counties", f_p2_region, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutCounties?pRegionID=" + $("#ctl00_workarea_cbo_p2_Region option:selected").val(), success: f_p2_region, error: ServiceFailed });
                }
                $('#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group').attr("disabled", "disabled");
            }
            else {
                $('#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group,#ctl00_workarea_cbo_p2_County').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group,#ctl00_workarea_cbo_p2_County').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        $("#ctl00_workarea_cbo_p2_County").change(function () {
            if ($("#ctl00_workarea_cbo_p2_County option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p2_County option:selected").val();
                    PostToHandler(vData, "/hierarchy/districts", f_p2_county, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutDistricts?pCountyID=" + $("#ctl00_workarea_cbo_p2_County option:selected").val(), success: f_p2_county, error: ServiceFailed });
                }
                $('#ctl00_workarea_cbo_p2_Group').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p2_Group').attr("disabled", "disabled");
            }
            else {
                $('#ctl00_workarea_cbo_p2_Group,#ctl00_workarea_cbo_p2_District').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p2_Group,#ctl00_workarea_cbo_p2_District').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        $("#ctl00_workarea_cbo_p2_District").change(function () {
            if ($("#ctl00_workarea_cbo_p2_District option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p2_District option:selected").val();
                    PostToHandler(vData, "/hierarchy/groups", f_p2_district, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutGroups?pDistrictID=" + $("#ctl00_workarea_cbo_p2_District option:selected").val(), success: f_p2_district, error: ServiceFailed });
                }
            }
            else {
                $('#ctl00_workarea_cbo_p2_Group').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p2_Group').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        //*****

        var f_p3_country =function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p3_Region", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            $('#ctl00_workarea_cbo_p3_Region').removeAttr("disabled");
            SetEnabled();
        };
        var f_p3_region = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p3_County", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            $('#ctl00_workarea_cbo_p3_County').removeAttr("disabled");
            SetEnabled();
        };
        var f_p3_county = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p3_District", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            $('#ctl00_workarea_cbo_p3_District').removeAttr("disabled");
            SetEnabled();
        };

        $("#ctl00_workarea_cbo_p3_Country").change(function () {
            if ($("#ctl00_workarea_cbo_p3_Country option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p3_Country option:selected").val();
                    PostToHandler(vData, "/hierarchy/regions", f_p3_country, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutRegions?pCountryID=" + $("#ctl00_workarea_cbo_p3_Country option:selected").val(), success: f_p3_country, error: ServiceFailed });
                }
                $('#ctl00_workarea_cbo_p3_County,#ctl00_workarea_cbo_p3_District').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p3_County,#ctl00_workarea_cbo_p3_District').attr("disabled", "disabled");
            }
            else {
                $('#ctl00_workarea_cbo_p3_County,#ctl00_workarea_cbo_p3_District,#ctl00_workarea_cbo_p3_Region').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p3_County,#ctl00_workarea_cbo_p3_District,#ctl00_workarea_cbo_p3_Region').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        $("#ctl00_workarea_cbo_p3_Region").change(function () {
            if ($("#ctl00_workarea_cbo_p3_Region option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p3_Region option:selected").val();
                    PostToHandler(vData, "/hierarchy/counties", f_p3_region, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutCounties?pRegionID=" + $("#ctl00_workarea_cbo_p3_Region option:selected").val(), success: f_p3_region, error: ServiceFailed });
                }
                $('#ctl00_workarea_cbo_p3_District').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p3_District').attr("disabled", "disabled");
            }
            else {
                $('#ctl00_workarea_cbo_p3_District,#ctl00_workarea_cbo_p3_County').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p3_District,#ctl00_workarea_cbo_p3_County').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        $("#ctl00_workarea_cbo_p3_County").change(function () {
            if ($("#ctl00_workarea_cbo_p3_County option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p3_County option:selected").val();
                    PostToHandler(vData, "/hierarchy/districts", f_p3_county, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutDistricts?pCountyID=" + $("#ctl00_workarea_cbo_p3_County option:selected").val(), success: f_p3_county, error: ServiceFailed });
                }
            }
            else {
                $('#ctl00_workarea_cbo_p3_District').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p3_District').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        //*****

        var f_p4_country = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p4_Region", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            $('#ctl00_workarea_cbo_p4_Region').removeAttr("disabled");
            SetEnabled();
        };
        var f_p4_region = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p4_County", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            $('#ctl00_workarea_cbo_p4_County').removeAttr("disabled");
            SetEnabled();
        };
        var f_p4_county = function (result) {
            PopulateCBO("#ctl00_workarea_cbo_p4_District", result, true, "--- No Items Available ---", true, "", "--- Select Location ---");
            $('#ctl00_workarea_cbo_p4_District').removeAttr("disabled");
            SetEnabled();
        };

        $("#ctl00_workarea_cbo_p4_Country").change(function () {
            if ($("#ctl00_workarea_cbo_p4_Country option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p4_Country option:selected").val();
                    PostToHandler(vData, "/hierarchy/regions", f_p4_country, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutRegions?pCountryID=" + $("#ctl00_workarea_cbo_p4_Country option:selected").val(), success: f_p4_country, error: ServiceFailed });
                }
                $('#ctl00_workarea_cbo_p4_County,#ctl00_workarea_cbo_p4_District').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p4_County,#ctl00_workarea_cbo_p4_District').attr("disabled", "disabled");
            }
            else {
                $('#ctl00_workarea_cbo_p4_County,#ctl00_workarea_cbo_p4_District,#ctl00_workarea_cbo_p4_Region').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p4_County,#ctl00_workarea_cbo_p4_District,#ctl00_workarea_cbo_p4_Region').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        $("#ctl00_workarea_cbo_p4_Region").change(function () {
            if ($("#ctl00_workarea_cbo_p4_Region option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p4_Region option:selected").val();
                    PostToHandler(vData, "/hierarchy/counties", f_p4_region, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutCounties?pRegionID=" + $("#ctl00_workarea_cbo_p4_Region option:selected").val(), success: f_p4_region, error: ServiceFailed });
                }
                $('#ctl00_workarea_cbo_p4_District').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p4_District').attr("disabled", "disabled");
            }
            else {
                $('#ctl00_workarea_cbo_p4_District,#ctl00_workarea_cbo_p4_County').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p4_District,#ctl00_workarea_cbo_p4_County').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        $("#ctl00_workarea_cbo_p4_County").change(function () {
            if ($("#ctl00_workarea_cbo_p4_County option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_workarea_cbo_p4_County option:selected").val();
                    PostToHandler(vData, "/hierarchy/districts", f_p4_county, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutDistricts?pCountyID=" + $("#ctl00_workarea_cbo_p4_County option:selected").val(), success: f_p4_county, error: ServiceFailed });
                }
            }
            else {
                $('#ctl00_workarea_cbo_p4_District').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p4_District').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        //*****

        //#endregion
                
        $("#ctl00_workarea_cbo_p3_Activity").change(function () {
            if ($("#ctl00_workarea_cbo_p3_Activity option:selected").val()) {
                $.ajax({                  
                    url: WebServicePath() + "PermitCategories?pActivity=" + $("#ctl00_workarea_cbo_p3_Activity option:selected").val() + "&pIncludeArchived=Y", async: false, success: function (result) {
                        PopulateCBO("#ctl00_workarea_cbo_p3_Category", result, true, "--- No Items Available ---", true, "", "--- Select Permit Category ---");
                        $('#ctl00_workarea_cbo_p3_Category').removeAttr("disabled");
                        SetEnabled();
                    }, error: ServiceFailed
                });
            }
            else {
                $('#ctl00_workarea_cbo_p3_Category').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p3_Category').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        $("#ctl00_workarea_cbo_p4_Activity").change(function () {
            if ($("#ctl00_workarea_cbo_p4_Activity option:selected").val()) {
                $.ajax({
                    url: WebServicePath() + "PermitCategories?pActivity=" + $("#ctl00_workarea_cbo_p4_Activity option:selected").val(), async: false, success: function (result) {
                        PopulateCBO("#ctl00_workarea_cbo_p4_Category", result, true, "--- No Items Available ---", true, "", "--- Select Assessor Category ---");
                        $('#ctl00_workarea_cbo_p4_Category').removeAttr("disabled");
                        SetEnabled();
                    }, error: ServiceFailed
                });
            }
            else {
                $('#ctl00_workarea_cbo_p4_Category').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
                $('#ctl00_workarea_cbo_p4_Category').attr("disabled", "disabled");
                SetEnabled();
            }
        });

        $("#LBTN1").click(function () { MakePageVisible(1); });
        $("#LBTN2").click(function () { MakePageVisible(2); });
        $("#LBTN3").click(function () { MakePageVisible(3); });
        $("#LBTN4").click(function () { MakePageVisible(4); });

        $("#bnReset").click(function () { return Reset(); }).removeAttr("id");
        $("#bnDoSearch").click(function () { DoMemberSearch(); return false; }).removeAttr("id");

        $("#ctl00_workarea_txt_p1_CN").keypress(function (e) { return NumberOnly_KeyPress(e || event, GotoCN); }).blur(function () { NumberOnly_Blur(this, true, 8); });
        $("#bn_p1_CN").click(function () { SearchButtonClick('ctl00_workarea_txt_p1_CN'); });
       
        $("#ctl00_workarea_txt_p2_CN").keypress(function (e) { return NumberOnly_KeyPress(e || event, GotoCN); }).blur(function () { NumberOnly_Blur(this, true, 8); });
        $("#bn_p2_CN").click(function () { SearchButtonClick('ctl00_workarea_txt_p2_CN'); });

        $("#ctl00_workarea_txt_p2_dob").blur(function () { ValidateDoB(this); });
        $("#bn_p2_dob").click(function () { PopupDoBSelect(this, 'ctl00_workarea_txt_p2_dob'); }).removeAttr("id");

        $("#ctl00_workarea_txt_p3_exp1").blur(function () { Date_TextBox_Blur(this); });
        $("#bn_p3_exp1").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p3_exp1'); }).removeAttr("id");

        $("#ctl00_workarea_txt_p3_exp2").blur(function () { Date_TextBox_Blur(this); });
        $("#bn_p3_exp2").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p3_exp2'); }).removeAttr("id");

        $("#txt_p3_AssNo").blur(function () { CheckASSno(); }).keypress(function (e) { return NumberOnly_KeyPress(e || event, function (e) { $('#ctl00_workarea_txt_p3_AssName').trigger('blur'); }); });
        $("#txt_p3_GrantComm").blur(function () { CheckPERCOMno(); }).keypress(function (e) { return NumberOnly_KeyPress(e || event, function (e) { $('#txt_p3_GrantComm').trigger('blur'); }); });

        $("#bn_p3_assnumber").click(function () { SearchASSClick(); }).removeAttr("id");
        $("#bn_p3_percomnumber").click(function () { SearchPERCOMClick(); }).removeAttr("id");

        $("#ctl00_workarea_txt_p4_rev").blur(function () { Date_TextBox_Blur(this); });
        $("#bn_p4_rev").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p4_rev'); }).removeAttr("id");

        $("#ctl00_workarea_cbo_p1_RoleLevel").change(function () {
            $('#ctl00_workarea_cbo_p1_Role option').each(function (index, option) { $(option).remove(); });
            $("#ctl00_workarea_cbo_p1_Role").append(new Option("--- No Roles Available ---", "")).attr("disabled", "disabled");

            var vSelCntry = GetSelectedON(1);

            if ($("#ctl00_workarea_cbo_p1_RoleLevel option:selected").val()) {
                GetAllRoles_CBOMS(
                    "ctl00_workarea_cbo_p1_Role",
                    $("#ctl00_workarea_cbo_p1_RoleLevel option:selected").val(),
                    vSelCntry,
                    true,
                    (HasAccess(pk_val("CRUD.YTHS"), 'R') ? undefined : "!YTH"),
                    "--- No Roles Available ---",
                    true,
                    undefined,
                    undefined,
                    undefined,
                    function () { if ($("#ctl00_workarea_cbo_p1_Role").data("db")) { $("#ctl00_workarea_cbo_p1_Role").resetDB(); $("#ctl00_workarea_cbo_p1_Role").data("db",""); } SetEnabled(); },
                    undefined
                    );
            }
            SetEnabled();
        });

        $("#ctl00_workarea_cbo_p2_RoleLevels").change(function () {
            $('#ctl00_workarea_cbo_p2_Role option').remove();
            $("#ctl00_workarea_cbo_p2_Role").append(new Option("--- No Roles Available ---", "")).attr("disabled", "disabled");

            var vSelCntry = GetSelectedON(2);

            if ($("#ctl00_workarea_cbo_p2_RoleLevels option:selected").val()) {
                GetAllRoles_CBOMS(
                   "ctl00_workarea_cbo_p2_Role",
                   $("#ctl00_workarea_cbo_p2_RoleLevels option:selected").val(),
                   vSelCntry,
                   true,
                   (HasAccess(pk_val("CRUD.YTHS"), 'R') ? undefined : "!YTH"),
                   "--- No Roles Available ---",
                   true,
                   undefined,
                   undefined,
                   undefined,
                   function () {
                       if ($("#ctl00_workarea_cbo_p2_Role").data("db")) {
                           $("#ctl00_workarea_cbo_p2_Role").resetDB();
                           $("#ctl00_workarea_cbo_p2_Role").data("db", "");
                           // just in case value does not exist
                           if (!$("#ctl00_workarea_cbo_p2_Role option:selected").text())
                               $("#ctl00_workarea_cbo_p2_Role").val("");
                       }
                       SetEnabled();
                   },
                   undefined
                   );
            }
            SetEnabled();
        });

        $(".MSRB").change(function () {
            if ($(".MSRB:checked").val() === 'cb_p2_Inactive' || $(".MSRB:checked").val() === 'cb_p2_NewMembers')
                $("#ctl00_workarea_cbo_p2_RoleLevels").val("").attr("disabled", "disabled");
            else
                $("#ctl00_workarea_cbo_p2_RoleLevels").removeAttr("disabled");

            if ($(".MSRB:checked").val() === 'cb_p2_ActiveElsewhere') {
                $(".P2LOC").attr("disabled", "disabled");
            }
            else {
                $(".P2LOC").removeAttr("disabled");
                $(".DISABLED").attr("disabled", "disabled");

                $("select.P2LOC").each(function () { if ($(this).find("option").length === 1 && !$(this).find("option").val()) { $(this).attr("disabled", "disabled"); } });
            }

            SetEnabled();
        });

        //*****        

        $("#ctl00_workarea_cbo_p1_RoleLevel,#ctl00_workarea_cbo_p2_RoleLevels").trigger("change");
        if (pk_val("Page.PrePopulate.Role")) $('#ctl00_workarea_cbo_p1_Role, #ctl00_workarea_cbo_p2_Role').val(pk_val("Page.PrePopulate.Role").replace("¬", "~")).data("db", pk_val("Page.PrePopulate.Role").replace("¬", "~"));

        if ($("#ctl00_workarea_cbo_p3_Activity option:selected").val()) $('#ctl00_workarea_cbo_p3_Activity,#ctl00_workarea_cbo_p4_Activity').trigger('change');
        $(".MSRB").trigger("change");

        if (pk_val("Page.PrePopulate.AssNo")) $('#txt_p3_AssNo').val(pk_val("Page.PrePopulate.AssNo"));
        if (pk_val("Page.PrePopulate.GrantComm")) $('#txt_p3_GrantComm').val(pk_val("Page.PrePopulate.GrantComm"));
        
        
        if (pk_val("Page.PrePopulate.Cat")) $('#ctl00_workarea_cbo_p3_Category, #ctl00_workarea_cbo_p4_Category').val(pk_val("Page.PrePopulate.Cat"));
        if (pk_val("Page.PrePopulate.RegRadio")) $('input:radio[name =\"REG\"]').filter('[value="' + pk_val("Page.PrePopulate.RegRadio") + '"]').attr('checked', true);

        setTimeout(function () { MakePageVisible(pk_val("Nav.StartPage")); }, 600);
        $("#ctl00_workarea_txt_p1_CN,#ctl00_workarea_txt_p2_CN").attr("type", "search");
    }
    catch (e) {
        MakePageVisible(1);
    }
    
    SetEnabled();
    HasChanges = false;
}

function GetSelectedON(PageNo) {
    var ON = 0;

    if (PageNo === 1)
        ON = pk_val("Page.CountryON");
    else
        ON = $("#ctl00_workarea_cbo_p" + PageNo + "_Country").val();
    return (!ON ? "-2" : ON);
}

function Reset() {
    $('input',".mpage").val('');
    $("select", ".mpage").each(function () { if ($(this).attr("disabled") !== "disabled") $(this).val(""); });

    $('#ctl00_workarea_cbo_p2_Region,#ctl00_workarea_cbo_p2_County,#ctl00_workarea_cbo_p2_District,#ctl00_workarea_cbo_p2_Group,#ctl00_workarea_cbo_p3_Region,#ctl00_workarea_cbo_p3_County,#ctl00_workarea_cbo_p3_District,#ctl00_workarea_cbo_p4_Region,#ctl00_workarea_cbo_p4_County').each(function () {
        if ($(this).attr("disabled") !== "disabled") $(this).empty().append('<option selected="selected" value="">--- No Items Available ---</option>'); 
    });
    
    if ($("#ctl00_workarea_cbo_p2_Region").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p2_Country").trigger("change");
    if ($("#ctl00_workarea_cbo_p2_County").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p2_Region").trigger("change");
    if ($("#ctl00_workarea_cbo_p2_District").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p2_County").trigger("change");
    if ($("#ctl00_workarea_cbo_p2_Group").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p2_District").trigger("change");

    if ($("#ctl00_workarea_cbo_p3_Activity").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p3_Activity").trigger("change");
    if ($("#ctl00_workarea_cbo_p3_Region").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p3_Country").trigger("change");
    if ($("#ctl00_workarea_cbo_p3_County").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p3_Region").trigger("change");
    if ($("#ctl00_workarea_cbo_p3_District").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p3_County").trigger("change");

    if ($("#ctl00_workarea_cbo_p4_Activity").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p4_Activity").trigger("change");
    if ($("#ctl00_workarea_cbo_p4_Region").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p4_Country").trigger("change");
    if ($("#ctl00_workarea_cbo_p4_County").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p4_Region").trigger("change");
    if ($("#ctl00_workarea_cbo_p4_District").attr("disabled") !== "disabled") $("#ctl00_workarea_cbo_p4_County").trigger("change");

    $("#ctl00_workarea_cbo_p1_RoleLevel,#ctl00_workarea_cbo_p2_RoleLevels").trigger("change");
    $('#REG1,#ROL1,#ctl00_workarea_cb_p2_Active').prop('checked', true);
    $('#REG1,#ROL1').val("1");
    $('.msCheckItems,#ctl00_workarea_cb_p2_Inactive,#ctl00_workarea_cb_p2_ActiveElsewhere,#ctl00_workarea_cb_p2_Suspended,#ctl00_workarea_cb_p2_NewMembers,#ctl00_workarea_cb_p2_HQ').removeAttr('checked');
    MakePageVisible(vCurrentPage);
    SetEnabled();
    return false;
}

function MakePageVisible(PageNo) {
    MakeTabVisible(PageNo);
    vCurrentPage = parseInt(PageNo,10);
    if (vCurrentPage === 1) $.FocusControl("#ctl00_workarea_txt_p1_CN", false);
    if (vCurrentPage === 2) $.FocusControl("#ctl00_workarea_txt_p2_CN", false);
    if (vCurrentPage === 3) $.FocusControl("#ctl00_workarea_cbo_p3_Activity", false);
    if (vCurrentPage === 4) $.FocusControl("#ctl00_workarea_cbo_p4_Activity", false);
}

function DoMemberSearch() {
    if (!Navigator_OnLine())
    {
        alert("There is no internet connection at the moment. Search cancelled.");
        return false;
    }

    var vData = {}; //var vData = new FormData();
    var URL_Text = "";

    if (vCurrentPage === 1) {
        URL_Text = Append(URL_Text, "ContactNumber", $("#ctl00_workarea_txt_p1_CN").val(), vData);
        URL_Text = Append(URL_Text, "Forenames", $("#ctl00_workarea_txt_p1_ForeNames").val().replaceAll(" or ", "|", false), vData);
        URL_Text = Append(URL_Text, "Surname", $("#ctl00_workarea_txt_p1_Surname").val().replaceAll(" or ", "|", false), vData);
        URL_Text = Append(URL_Text, "Email", $("#ctl00_workarea_txt_p1_Email").val(), vData);
        URL_Text = Append(URL_Text, "Role", $("#ctl00_workarea_cbo_p1_Role option:selected").val(), vData);
        URL_Text = Append(URL_Text, "RoleLevel", $("#ctl00_workarea_cbo_p1_RoleLevel").val(),vData);

        if (URL_Text) {
            if ($("#ctl00_workarea_cbo_p2_Country").attr("disabled") === "disabled")
                URL_Text = Append(URL_Text, "Country", $("#ctl00_workarea_cbo_p2_Country").val(),vData);
            if ($("#ctl00_workarea_cbo_p2_Region").attr("disabled") === "disabled")
                URL_Text = Append(URL_Text, "Region", $("#ctl00_workarea_cbo_p2_Region").val(),vData);
            if ($("#ctl00_workarea_cbo_p2_County").attr("disabled") === "disabled")
                URL_Text = Append(URL_Text, "County", $("#ctl00_workarea_cbo_p2_County").val(),vData);
            if ($("#ctl00_workarea_cbo_p2_District").attr("disabled") === "disabled")
                URL_Text = Append(URL_Text, "District", $("#ctl00_workarea_cbo_p2_District").val(),vData);
            if ($("#ctl00_workarea_cbo_p2_Group").attr("disabled") === "disabled")
                URL_Text = Append(URL_Text, "Group", $("#ctl00_workarea_cbo_p2_Group").val(),vData);

            URL_Text = Append(URL_Text, "AREA_RB", "1",vData);
            URL_Text = Append(URL_Text, "SearchType", "BASIC",vData);
        }
    }

    if (vCurrentPage === 2) {
        var AIESN = ""; // 'A'ctivne, 'I'nactive, Active 'E'lsewhere, 'S'uspended, 'N'ew members, 'H'Q* members
        if ($("#ctl00_workarea_cb_p2_Active").is(":checked")) AIESN += "A";
        if ($("#ctl00_workarea_cb_p2_Inactive").is(":checked")) AIESN += "I";
        if ($("#ctl00_workarea_cb_p2_ActiveElsewhere").is(":checked")) AIESN += "E";
        if ($("#ctl00_workarea_cb_p2_Suspended").is(":checked") && HasAccess(pk_val("CRUD.ASMS"), 'R')) AIESN += "S";
        if ($("#ctl00_workarea_cb_p2_NewMembers").is(":checked")) AIESN += "N";
        if ($("#ctl00_workarea_cb_p2_HQ").is(":checked") && HasAccess(pk_val("CRUD.HQSO"), 'R')) AIESN += "H";
        if (AIESN === "") {
            $.system_alert("There are no membership filters selected, this would always return no people. Please select at least 1 membership option.");
            return false;
        }

        if ($("#ctl00_workarea_cb_p2_ExactForenames").is(':checked')) { URL_Text = Append(URL_Text, "ExactForenames", $("#ctl00_workarea_txt_p2_ForeNames").val(), vData); }
        else { URL_Text = Append(URL_Text, "Forenames", $("#ctl00_workarea_txt_p2_ForeNames").val().replaceAll(" or ", "|", false), vData); }

        if ($("#ctl00_workarea_cb_p2_ExactSurname").is(':checked')) { URL_Text = Append(URL_Text, "ExactSurname", $("#ctl00_workarea_txt_p2_Surname").val(), vData); }
        else { URL_Text = Append(URL_Text, "Surname", $("#ctl00_workarea_txt_p2_Surname").val().replaceAll(" or ", "|", false), vData); }

        URL_Text = Append(URL_Text, "Email", $("#ctl00_workarea_txt_p2_Email").val(), vData);
        if (AIESN !== "E") {
            URL_Text = Append(URL_Text, "AREA_RB", $("input:radio[name ='REG']:checked").val(), vData);
            URL_Text = Append(URL_Text, "Country", $("#ctl00_workarea_cbo_p2_Country").val(), vData);
            URL_Text = Append(URL_Text, "Region", $("#ctl00_workarea_cbo_p2_Region").val(), vData);
            URL_Text = Append(URL_Text, "County", $("#ctl00_workarea_cbo_p2_County").val(), vData);
            URL_Text = Append(URL_Text, "District", $("#ctl00_workarea_cbo_p2_District").val(), vData);
            URL_Text = Append(URL_Text, "Group", $("#ctl00_workarea_cbo_p2_Group").val(), vData);
        }
        URL_Text = Append(URL_Text, "AIESN_FILTERS", AIESN, vData);
        URL_Text = Append(URL_Text, "Postcode", $("#ctl00_workarea_txt_p2_Postcode").val().toUpperCase(), vData);
        URL_Text = Append(URL_Text, "Date_of_Birth", $("#ctl00_workarea_txt_p2_dob").val(), vData);
        URL_Text = Append(URL_Text, "Sex", $("#ctl00_workarea_cbo_p2_Gender").val(), vData);
        URL_Text = Append(URL_Text, "RoleLevel", $("#ctl00_workarea_cbo_p2_RoleLevels").val(), vData);
        URL_Text = Append(URL_Text, "Role", $("#ctl00_workarea_cbo_p2_Role").val(), vData);
        URL_Text = Append(URL_Text, "ContactNumber", $("#ctl00_workarea_txt_p2_CN").val(), vData);
        URL_Text = Append(URL_Text, "Sort1", $("#ctl00_workarea_cbo_p2_Sort1").val(), vData);
        URL_Text = Append(URL_Text, "Sort2", $("#ctl00_workarea_cbo_p2_Sort2").val(), vData);
        URL_Text = Append(URL_Text, "Sort3", $("#ctl00_workarea_cbo_p2_Sort3").val(), vData);
        if (URL_Text) URL_Text = Append(URL_Text, "SearchType", "ADVANCED", vData);
    }

    if (vCurrentPage === 3) {
        if ($("#ctl00_workarea_cbo_p3_Country").val()) URL_Text = Append(URL_Text, "Country", $("#ctl00_workarea_cbo_p3_Country").val(), vData);
        if ($("#ctl00_workarea_cbo_p3_Region").val()) URL_Text = Append(URL_Text, "Region", $("#ctl00_workarea_cbo_p3_Region").val(), vData);
        if ($("#ctl00_workarea_cbo_p3_County").val()) URL_Text = Append(URL_Text, "County", $("#ctl00_workarea_cbo_p3_County").val(), vData);
        if ($("#ctl00_workarea_cbo_p3_District").val()) URL_Text = Append(URL_Text, "District", $("#ctl00_workarea_cbo_p3_District").val(), vData);
        URL_Text = Append(URL_Text, "Activity", $("#ctl00_workarea_cbo_p3_Activity").val(), vData);
        URL_Text = Append(URL_Text, "Category", $("#ctl00_workarea_cbo_p3_Category").val(), vData);
        URL_Text = Append(URL_Text, "PermitType", $("#ctl00_workarea_cbo_p3_Type").val(), vData);
        URL_Text = Append(URL_Text, "Expires1", $("#ctl00_workarea_txt_p3_exp1").val(), vData);
        URL_Text = Append(URL_Text, "Expires2", $("#ctl00_workarea_txt_p3_exp2").val(), vData);
        if ($("#txt_p3_AssNo").val()) URL_Text = Append(URL_Text, "Assessor", $("#txt_p3_AssNo").val(), vData);
        URL_Text = Append(URL_Text, "Assessorname", $("#ctl00_workarea_txt_p3_AssName").val(), vData);
        if ($("#txt_p3_GrantComm").val()) URL_Text = Append(URL_Text, "Commissioner", $("#txt_p3_GrantComm").val(), vData);
        if (URL_Text) URL_Text = Append(URL_Text, "SearchType", "PERMIT", vData);
    }

    if (vCurrentPage === 4) {
        URL_Text = Append(URL_Text, "Activity", $("#ctl00_workarea_cbo_p4_Activity").val(), vData);
        URL_Text = Append(URL_Text, "Category", $("#ctl00_workarea_cbo_p4_Category").val(), vData);
        if ($("#ctl00_workarea_cbo_p4_Country").val()) URL_Text = Append(URL_Text, "Country", $("#ctl00_workarea_cbo_p4_Country").val(), vData);
        if ($("#ctl00_workarea_cbo_p4_Region").val()) URL_Text = Append(URL_Text, "Region", $("#ctl00_workarea_cbo_p4_Region").val(), vData);
        if ($("#ctl00_workarea_cbo_p4_County").val()) URL_Text = Append(URL_Text, "County", $("#ctl00_workarea_cbo_p4_County").val(), vData);
        if ($("#ctl00_workarea_cbo_p4_District").val()) URL_Text = Append(URL_Text, "District", $("#ctl00_workarea_cbo_p4_District").val(), vData);
        URL_Text = Append(URL_Text, "ReviewBefore", $("#ctl00_workarea_txt_p4_rev").val(), vData);
        if (URL_Text === "") {
            $.system_alert("Please enter some search criteria.");
            return false;
        }
        URL_Text = Append(URL_Text, "AREA_RB", "1", vData);
        if (URL_Text) URL_Text = Append(URL_Text, "SearchType", "ASSESSOR", vData);
    }
    if (URL_Text === "") {
        $.system_alert("Please enter some search criteria.");
        return false;
    }
    else {
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
    }
}

function AddDoBFilter() {
    var d = new Date();
    d.setYear(d.getFullYear() - 6); // remove 18 years for a "best guess" start point
    //allow Beavers to join from 5.75 years old
    d.setDate(d.getDate() + 94); // add 94 days (= 366/4 = 91.5 round up to 92 and add 2 days to cover edge cases/leap years)
    calPopup.setYearSelectStart(d.getFullYear());
    calPopup.setYearStartEnd("", d.getFullYear());
    calPopup.addDisabledDates(formatDate(d, DisplayDateFormat), null);
}

function PopupDoBSelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddDoBFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function ValidateDoB(self) {
    if ($(self).val() === "") return true;
    calPopup.clearDisabledDates();
    AddDoBFilter();
    return Date_TextBox_Blur(self, 'Must be over 5¾ years old');
}

function SearchASSClick() {    
    $.member_search("MS_PASS",
        ASS_Populate,
        "Find An Assessor",
        pk_val("Master.User.ON"),
        -1);    
    return false;
}

function ASS_Populate(CN, Name) {
    $("#txt_p3_AssNo").val(CN);
    HasChanges = true;
}

function CheckASSno() {
    if (!$("#txt_p3_AssNo").val())
        ASS_Populate("", "");
    else 
        $.validate_member("MS_PASS",
            ASS_Populate,
            function () { $.system_alert("This is not a current valid Assessor number."); },
            $("#txt_p3_AssNo").val(),
            pk_val("Master.User.ON"),
            -1);    
}

function SearchPERCOMClick() {    
    $.member_search("PERCOM",
        PERCOM_Populate,
        "Find A Permit Commissioner",
        pk_val("Master.User.ON"),
        -1);
    return false;
}

function PERCOM_Populate(CN, Name) {
    $("#txt_p3_GrantComm").val(CN);
    HasChanges = true;
}

function CheckPERCOMno() {
    if (!$("#txt_p3_GrantComm").val())
        PERCOM_Populate("", "");
    else 
        $.validate_member("PERCOM",
            PERCOM_Populate,
            function () { $.system_alert("This is not a current valid permit commissioner number."); },
            $("#txt_p3_GrantComm").val(),
            pk_val("Master.User.ON"),
            -1);
}