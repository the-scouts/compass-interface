$(document).ready(FormReady);

var timerIDX;
var vSearchString = "";
var vSearchData = {};
var vTMN;
var vDoPreviewCount = true; // simple turn on\off switch for preview count checking
var LastForceMode = 1;

function FormReady() {
    $("#tbl_th, #divNoRecords, #divToManyRecords").css({ "display": "none" });

    $("#fold").css({ "background-image": $(".foldimage_up").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
    $("#SH_DIV_BN").click({ divname: "#divSearchFold", foldname: "#fold" },
        function (e) {
            var key = e === undefined ? 13 : e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
            if (key === 13 || e.charCode === undefined)
                try {
                    if ($(e.data.divname).is(":hidden")) {
                        $(e.data.divname).slideDown(300, DoResize); $(e.data.foldname).css({ "background-image": $(".foldimage_up").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
                    }
                    else {
                        $(e.data.divname).slideUp(10, DoResize); $(e.data.foldname).css({ "background-image": $(".foldimage_down").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
                    }
                } catch (err) { }
        });

    $("#ctl00_plInnerPanel_head_cbo_p1_update").trigger("change");

    if (!HasAccess(pk_val("CRUD.MSEO"), "C") && !HasAccess(pk_val("CRUD.DIST"), "C") && !HasAccess(pk_val("CRUD.DIST"), "U")) $("#bnExport").css("display", "none");
    if (!HasAccess(pk_val("CRUD.YN_TRN_CRUD"), "U"))
        $("#bnUpdate").remove();
    else
        $("#bnUpdate").click(function () {
            UpdateTrainingPopup(GetSelectedCNs(), GetSelectedMTMNs(), 'B11', undefined);
            return false;
        });

    $("#ctl00_plInnerPanel_head_cbo_p1_update").change(function () {
        var vCap = "";
        if ($(this).val() === "OGL") {
            $("#cbo_p1_nextmonths").removeAttr("disabled");
            $(".TrainRenew").css("display", "");//TSA-694: Un-hide if relevant
            vCap = "On Going Learning";
        }
        else {
            $("#cbo_p1_nextmonths").attr("disabled", "disabled");
            $(".TrainRenew").css("display", "none");//TSA-694: Hide if not relevant
            vCap = "Training";
        }

        $.ajax({
            url: WebServicePath() + "GetTrainingModules?pUpdateType=" + $(this).val(), success: function (result) {
                PopulateCBO("#ctl00_plInnerPanel_head_cbo_p1_module", result, true, "--- No Items Available ---", true, "", "--- Select " + vCap + " Module ---");
                SetEnabled();
            }, error: ServiceFailed
        });
    });

    // ensure the Scottish Etc captions are ok.
    CountryOrganisationNumber = pk_val("Page.Country");
    if ($("#ctl00_plInnerPanel_head_cbo_p1_location_1").val())
        CountryOrganisationNumber = $("#ctl00_plInnerPanel_head_cbo_p1_location_1 option:selected").val();
    $("#ctl00_plInnerPanel_head_lbl_p1_location_3").text(GetCaptionName(3, false, false));

    $.FocusControl("#txt_p1_memberno", false, 200);

    //#region Location lookups

    var f_country = function (result) { PopulateCBO("#ctl00_plInnerPanel_head_cbo_p1_location_2", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };
    var f_region = function (result) { PopulateCBO("#ctl00_plInnerPanel_head_cbo_p1_location_3", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };
    var f_county = function (result) { PopulateCBO("#ctl00_plInnerPanel_head_cbo_p1_location_4", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };
    var f_district = function (result) { PopulateCBO("#ctl00_plInnerPanel_head_cbo_p1_location_5", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };

    if (!$("#ctl00_plInnerPanel_head_cbo_p1_location_1 option:selected").attr("value"))
        $("#ctl00_plInnerPanel_head_cbo_p1_location_1").change(function () {
            CountryOrganisationNumber = $("#ctl00_plInnerPanel_head_cbo_p1_location_1 option:selected").val();

            $('#ctl00_plInnerPanel_head_cbo_p1_location_2,#ctl00_plInnerPanel_head_cbo_p1_location_3,#ctl00_plInnerPanel_head_cbo_p1_location_4,#ctl00_plInnerPanel_head_cbo_p1_location_5').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
            $('#ctl00_plInnerPanel_head_cbo_p1_location_2,#ctl00_plInnerPanel_head_cbo_p1_location_3,#ctl00_plInnerPanel_head_cbo_p1_location_4,#ctl00_plInnerPanel_head_cbo_p1_location_5').attr("disabled", "disabled");
            if ($("#ctl00_plInnerPanel_head_cbo_p1_location_1 option:selected").val()) {
                vRegionCBO_Count = 2;
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_1 option:selected").val();
                    PostToHandler(vData, "/hierarchy/regions", f_country, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutRegions?pCountryID=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_1 option:selected").val(), success: f_country, error: ServiceFailed });
                }
                $("#ctl00_plInnerPanel_head_lbl_p1_location_3").text(GetCaptionName(3, false, false));
            }
            else SetEnabled();
        });

    if (!$("#ctl00_plInnerPanel_head_cbo_p1_location_2 option:selected").attr("value"))
        $("#ctl00_plInnerPanel_head_cbo_p1_location_2").change(function () {
            $('#ctl00_plInnerPanel_head_cbo_p1_location_3,#ctl00_plInnerPanel_head_cbo_p1_location_4,#ctl00_plInnerPanel_head_cbo_p1_location_5').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
            $('#ctl00_plInnerPanel_head_cbo_p1_location_3,#ctl00_plInnerPanel_head_cbo_p1_location_4,#ctl00_plInnerPanel_head_cbo_p1_location_5').attr("disabled", "disabled");
            if ($("#ctl00_plInnerPanel_head_cbo_p1_location_2 option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_2 option:selected").val();
                    PostToHandler(vData, "/hierarchy/counties", f_region, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutCounties?pRegionID=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_2 option:selected").val(), success: f_region, error: ServiceFailed });
                }
            }
            else SetEnabled();
        });

    if (!$("#ctl00_plInnerPanel_head_cbo_p1_location_3 option:selected").attr("value"))
        $("#ctl00_plInnerPanel_head_cbo_p1_location_3").change(function () {
            $('#ctl00_plInnerPanel_head_cbo_p1_location_4,#ctl00_plInnerPanel_head_cbo_p1_location_5').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
            $('#ctl00_plInnerPanel_head_cbo_p1_location_4,#ctl00_plInnerPanel_head_cbo_p1_location_5').attr("disabled", "disabled");
            if ($("#ctl00_plInnerPanel_head_cbo_p1_location_3 option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_3 option:selected").val();
                    PostToHandler(vData, "/hierarchy/districts", f_county, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutDistricts?pCountyID=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_3 option:selected").val(), success: f_county, error: ServiceFailed });
                }
            }
            else SetEnabled();
        });

    if (!$("#ctl00_plInnerPanel_head_cbo_p1_location_4 option:selected").attr("value"))
        $("#ctl00_plInnerPanel_head_cbo_p1_location_4").change(function () {
            $('#ctl00_plInnerPanel_head_cbo_p1_location_5').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
            $('#ctl00_plInnerPanel_head_cbo_p1_location_5').attr("disabled", "disabled");
            if ($("#ctl00_plInnerPanel_head_cbo_p1_location_4 option:selected").val()) {
                if (pk_val("Master.Sys.REST")) {
                    var vData = {};
                    vData["ParentID"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_4 option:selected").val();
                    PostToHandler(vData, "/hierarchy/groups", f_district, ServiceFailed, false, true);
                } else {
                    $.ajax({ url: WebServicePath() + "GetScoutGroups?pDistrictID=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_4 option:selected").val(), success: f_district, error: ServiceFailed });
                }
            }
            else SetEnabled();
        });

    //#endregion

    $("input").not("#CNLookup2").not("#CNLookup").keydown(function (event) {
        var e = event || window.event; // for trans-browser compatibility
        var charCode = e.which || e.keyCode;
        if (charCode === 13) DoSearch();
    });

    $('.msCheckAll').click(function () {
        if ($(this).is(":checked")) {
            $(".gridCB").each(function () {
                if ($(this).parent().parent().css("display") !== "none")
                    $(this).prop('checked', 'checked');
                else
                    $(this).removeAttr('checked');
            });
        }
        else
            $(".gridCB").removeAttr('checked');
    });

    $("#bn_p1_memblookup").click(SearchButtonClick);
    $("#bn_p1_clear").click(DoClear).css("width", "100px");
    $("#bn_p1_search").click(DoSearch).css("width", "100px");

    $("#bnExport").click(function () {
        var SelectedCN = GetSelectedCNs();
        return ChooseExportOption(
            SelectedCN,
            pk_val("Page.YA") === "Y" ? "CSVTY" : "CSVTA",
            pk_val("Page.YA") === "Y" ? "PDFTY" : "PDFTA",
            pk_val('CRUD.MSEO'),
            pk_val('CRUD.DIST'),
            pk_val('Master.User.MRN'),
            SelectedCN);
    });

    $("#bnDisplay").click(function () { DoActualSearch(1); return false; });
    $("#bnDisplay2").click(function () { DoActualSearch(2); return false; });

    $("#ctl00_plInnerPanel_head_cbo_p1_update").trigger("change");

    var options = [];
    for (var i = 1; i <= 36 ; i++) { options.push('<option value="', i, '">', i, '</option>'); }
    $("#cbo_p1_nextmonths").html(options.join(''));

    SetLocDisabled();
    SetEnabled();

    $(".msHeadTD", $("#tbl_p1_results")).each(function () {
        if ($(this).data("colname")) {
            $(this).click(function () {
                PopupGridOptions('gridPopup', "tbl_p1_results", $(this).data("colname"));
            });
        }
    });

    $('.msHeadTD').hover(
        function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')').not(".hdrTR").not(".hdrTD").addClass("Grid_HL"); },
        function () {
            if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')').not(".hdrTR").not(".hdrTD").removeClass("Grid_HL");
        });
}

function PopulateGridForSort() {
    $("#tbl_p1_results td").each(function () {
        var data = $("label", this).html();
        if ($("a", this).html()) { data = $("a", this).html(); }
        if (data) {
            GP_AddFilterItem("tbl_p1_results", $('table tr:eq(0) td:eq(' + $(this).index() + ')').attr("id"), data, $(this).index());
        }
    });
}

function SetLocDisabled() {
    var done = false;
    $('#ctl00_plInnerPanel_head_cbo_p1_location_1,#ctl00_plInnerPanel_head_cbo_p1_location_2,#ctl00_plInnerPanel_head_cbo_p1_location_3,#ctl00_plInnerPanel_head_cbo_p1_location_4,#ctl00_plInnerPanel_head_cbo_p1_location_5').each(function () {
        if (!done && $(this).val() === "") $(this).trigger("change");
    });
}

function Mem_Populate(CN, Name) {
    $("#txt_p1_memberno").val(CN);
    if (CN) {
        $("#txt_p1_membername").val(Name);
        $(".QuickSearchButton,#txt_p1_memberno").css({ "display": "none" });
        $(".rfv", $("#txt_p1_memberno").parent()).css({ "display": "none" });
        $("#txt_p1_membername").css({ "display": "block" });
    }
    else {
        $("#txt_p1_membername").val("");
        $("#ctl00_head_txt_p1_memberno").val("");
        $.FocusControl("#txt_p1_memberno");
    }
}

function SearchButtonClick() {
    if ($("#txt_p1_memberno").val() === "") {
        $.FocusControl("#txt_p1_memberno");
    }
    else {
        $.validate_member("MEM_TRAIN_" + pk_val("Page.YA"),
            Mem_Populate,
            function () { Mem_Populate("", ""); $.system_alert("Not a valid member number.", "#txt_p1_memberno"); },
            $("#txt_p1_memberno").val(),
            pk_val("Master.User.ON"),
            pk_val("Master.User.CN"));
    }
}

function DoClear() {
    // core reset edit/cbo values
    $("#tbl_module input").not("[type='button']").each(function () { if ($(this).css("disabled") !== 'disabled') $(this).resetDB(); });
    $("#tbl_module select").each(function () { if ($(this).attr("disabled") !== "disabled") $(this).resetDB(); });
    $("#tbl_person input").not("[type='button']").each(function () { if ($(this).css("disabled") !== 'disabled') $(this).resetDB(); });
    $("#tbl_person select").each(function () { if ($(this).attr("disabled") !== "disabled") $(this).resetDB(); });

    if ($("#ctl00_plInnerPanel_head_cbo_p1_location_1").val())
        CountryOrganisationNumber = $("#ctl00_plInnerPanel_head_cbo_p1_location_1 option:selected").val();
    $("#ctl00_plInnerPanel_head_lbl_p1_location_3").text(GetCaptionName(3, false, false));
    SetLocDisabled();
    $("#cbo_p1_nextmonths").val("1");
    $("#txt_p1_memberno").css({ "display": "" });
    $("#txt_p1_membername").css({ "display": "none" });
    $(".QuickSearchButton").css({ "display": "" });
    $("#txt_p1_recordcount").text("");
    GP_ClearGridArrayData("tbl_p1_results");
    $("#tbl_p1_results tr:not(:first)").remove();
    $("#tbl_th, #divNoRecords, #divToManyRecords").css({ "display": "none" });
    $("#ctl00_plInnerPanel_head_cbo_p1_update").trigger("change");
    $("#cb_p1_mylearners").removeAttr("checked");
    $.FocusControl("#txt_p1_memberno", false, 200);
}

function DoSearch() {
    var URLParams = "";
    var vData = {};

    $("#noRecords").text("No records found.");
    $("#tbl_th, #divNoRecords, #divToManyRecords").css({ "display": "none" });
    if ($("#txt_p1_memberno").val()) {
        URLParams += "&pMembNo=" + $("#txt_p1_memberno").val();
        vData["pMembNo"] = $("#txt_p1_memberno").val();
    }

    if ($("#txt_p1_forenames").val()) {
        URLParams += "&pName1=" + $("#txt_p1_forenames").val();
        vData["pName1"] = $("#txt_p1_forenames").val();
    }

    if ($("#txt_p1_surname").val()) {
        URLParams += "&pName2=" + $("#txt_p1_surname").val();
        vData["pName2"] = $("#txt_p1_surname").val();
    }

    if ($("#cb_p1_mylearners").is(":checked")) {
        URLParams += "&pMyLearners=Y";
        vData["pMyLearners"] = "Y";
    } else {
        URLParams += "&pAllMembers=Y";
        vData["pAllMembers"] = "Y";
    }

    if ($("#ctl00_plInnerPanel_head_cbo_p1_location_5").val()) {
        URLParams += "&pON=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_5").val();
        vData["pON"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_5").val();
    }
    else if ($("#ctl00_plInnerPanel_head_cbo_p1_location_4").val()) {
        URLParams += "&pON=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_4").val();
        vData["pON"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_4").val();
    }
    else if ($("#ctl00_plInnerPanel_head_cbo_p1_location_3").val()) {
        URLParams += "&pON=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_3").val();
        vData["pON"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_3").val();
    }
    else if ($("#ctl00_plInnerPanel_head_cbo_p1_location_2").val()) {
        URLParams += "&pON=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_2").val();
        vData["pON"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_2").val();
    }
    else if ($("#ctl00_plInnerPanel_head_cbo_p1_location_1").val()) {
        URLParams += "&pON=" + $("#ctl00_plInnerPanel_head_cbo_p1_location_1").val();
        vData["pON"] = $("#ctl00_plInnerPanel_head_cbo_p1_location_1").val();
    }
    else {
        URLParams += "&pON=" + pk_val("Master.Const.HQ");
        vData["pON"] = pk_val("Master.Const.HQ");
    }

    if ($("#ctl00_plInnerPanel_head_cbo_p1_update").val()) {
        URLParams += "&pUpdate=" + $("#ctl00_plInnerPanel_head_cbo_p1_update").val();
        vData["pUpdate"] = $("#ctl00_plInnerPanel_head_cbo_p1_update").val();
    }
    if ($("#ctl00_plInnerPanel_head_cbo_p1_module").val()) {
        vTMN = $("#ctl00_plInnerPanel_head_cbo_p1_module").val();
        URLParams += "&pModule=" + vTMN;
        vData["pModule"] = vTMN;
    } else {
        vTMN = undefined;
    }

    if ($("#cbo_p1_nextmonths").val() && $("#ctl00_plInnerPanel_head_cbo_p1_update").val() === "OGL") {
        URLParams += "&pMonths=" + $("#cbo_p1_nextmonths").val();
        vData["pMonths"] = $("#cbo_p1_nextmonths").val();
    }

    if ($("#txt_p1_memberno").val() && $("#txt_p1_memberno").val() === pk_val("Master.User.CN").toString()) {
        $.system_alert("You cannot maintain your own training.", "#txt_p1_memberno");
        return false;
    }

    if (URLParams === "") {
        $.system_alert("Please enter some search criteria.");
        return false;
    }

    if ($("#txt_p1_memberno").val() && $("#txt_p1_memberno").css("display") !== "none")
        SearchButtonClick();

    if (pk_val("Page.YA") === "Y") {
        URLParams += "&pType=YOUTH";
        vData["pType"] = "YOUTH";
    }
    else {
        URLParams += "&pType=ADULT";
        vData["pType"] = "ADULT";
    }

    ShowBusy_Main();
    GP_ClearGridArrayData("tbl_p1_results");
    $("#tbl_p1_results tr:not(:first)").remove();

    $(".msCheckAll").removeAttr("checked");

    if (vDoPreviewCount) {
        URLParams += "&pCountOnly=Y";
        vData["pCountOnly"] = "Y";
    }
    vSearchString = URLParams;
    vSearchData = vData;

    LastForceMode = 1;

    var SuccessFunction = function (result) {
        if (!pk_val("Master.Sys.REST") && result) result = result.d; // REST vs JSON result 
        HideBusy_Main();
        $("#divNoRecords").css({ "display": "none" });
        if (result && $.parseJSON(result).length > 0 && $.parseJSON(result)[0].cnt > 0) {
            if (parseInt(pk_val("Page.MaxResults"), 10) < $.parseJSON(result)[0].cnt) {
                $("#divToManyRecords").css({ "display": "" });
                $("#tbl_th").css({ "display": "none" });
                $("#txt_p1_recordcount").text(" - (" + (LastForceMode === 2 ? "First " : "") + $.parseJSON(result)[0].cnt + " Matches Found)");
            }
            else
                DoActualSearch(1);
        }
        else if (!vDoPreviewCount)
            PopulateGrid(result);
        else {
            $("#tbl_th").css({ "display": "none" });
            $("#divNoRecords").css({ "display": "" });
            $("#divToManyRecords").css({ "display": "none" });
            $("#txt_p1_recordcount").text(" - (No Records Found)");
        }
    };

    if (pk_val("Master.Sys.REST")) {
        // this is the code to run if using REST instead of JSON,
        // NOTE: subtally it is different.       
        PostToHandler(vData, "/Search/Training", SuccessFunction, ServiceFailed);
        // End
    } else {
        $.ajax({ url: WebServicePath() + "FindTrainees?" + URLParams, success: SuccessFunction, error: ServiceFailed });
    }
}

function DoActualSearch(ForceMode) {
    LastForceMode = ForceMode;
    ShowBusy_Main();
    $("#divToManyRecords").css({ "display": "none" });
    $("#tbl_th").css({ "display": "" });

    var SuccessFunction = function (result) {
        HideBusy_Main();
        PopulateGrid(pk_val("Master.Sys.REST") ? result : result.d);
    };

    if (pk_val("Master.Sys.REST")) {
        // this is the code to run if using REST instead of JSON,
        // NOTE: subtally it is different.   
        vSearchData["pCountOnly"] = "";
        vSearchData["pMaxRows"] = (ForceMode === 2 ? pk_val("Page.AllowFirst") : "-1");

        PostToHandler(vSearchData, "/Search/Training", SuccessFunction, ServiceFailed, true);
        // End
    } else {
        $.ajax({
            url: WebServicePath() + "FindTrainees?" + vSearchString.replace("&pCountOnly=Y", "") + (ForceMode === 2 ? "&pMaxRows=" + pk_val("Page.AllowFirst") : "&pMaxRows=-1"), success: SuccessFunction, error: ServiceFailed
        });
    }
}

function PopulateData(ForceAll) {
    if (mvTake == -2) mvTake = parseInt(pk_val("Page.Take"), 10);

    if (mvSkip == 0 && mvTake < mvData.length) {
        $("#mstr_scroll").scroll(function () {
            if (mvTake > 0 && mvTake < mvData.length && $("#mstr_scroll").scrollTop() >= $("#tbl_p1_results").height() - $("#mstr_scroll").height()) {
                PopulateData();
            }
        });
    }

    var added = 0;
    var StartPos = mvSkip;
    var TRHTML = "";
    var vGridOptsOffSet = ColsSpeed[0] === "¬" ? 0 : 1;
    var vformattedCN;
    var vAllIsChecked = $(".msCheckAll").is(":checked");

    var otm_TRN_CRUD = HasAccess(pk_val("CRUD.YN_TRN_CRUD"), "U");
    var otm_CRUD = otm_TRN_CRUD || HasAccess(pk_val("CRUD.MSEO"), "C") || HasAccess(pk_val("CRUD.DIST"), "C") || HasAccess(pk_val("CRUD.DIST"), "U");
    var otm_cbo_p1_update = $("#ctl00_plInnerPanel_head_cbo_p1_update").val();
    var otm_cbo_p1_module = $("#ctl00_plInnerPanel_head_cbo_p1_module").val();
    var otm_CRUD_YTHS = pk_val("CRUD.YTHS");
    var otm_CRUD_VULA = pk_val("CRUD.VULA");
    var otm_CRUD_VULY = pk_val("CRUD.VULY");

    for (var i = StartPos; i < (ForceAll ? mvData.length : StartPos + mvTake) ; i++) {
        if (StartPos >= mvData.length || i >= mvData.length) {
            mvTake = -1;
            break;
        }

        vformattedCN = ('00000000' + mvData[i].contact_number.toString()).substring(mvData[i].contact_number.toString().length);

        TRHTML = "<tr class='msTR newTR' data-ng_id='" + mvData[i].contact_number + "' data-mtmn_id='" + (mvData[i].member_training_module_number ? mvData[i].member_training_module_number : "") + "' data-tmn='" + mvData[i].training_module_number + "' data-desc='" + mvData[i].module_desc + "'>";
        var PK = (mvData[i].member_training_module_number ? mvData[i].member_training_module_number : mvData[i].contact_number);
        if (otm_CRUD) TRHTML += "<td class='tdData'><input id='cd" + i + "' class='gridCB' type='checkbox'" + (vAllIsChecked ? " checked='checked'" : "") + "></td>";

        if (CanSeeContact(mvData[i].visibility_status, otm_CRUD_YTHS, otm_CRUD_VULA, otm_CRUD_VULY)) {
            TRHTML += "<td class='tdData'><a href='MemberProfile.aspx?CN=" + mvData[i].contact_number + "' onclick='return GotoCN(" + mvData[i].contact_number + ",\"Training\");'>" + pad(mvData[i].contact_number.toString(), 8) + "</a></td>";
            TRHTML += "<td class='tdData'><a href='MemberProfile.aspx?CN=" + mvData[i].contact_number + "' onclick='return GotoCN(" + mvData[i].contact_number + ",\"Training\");'>" + mvData[i].name + "</a></td>";
        }
        else {
            TRHTML += "<td class='tdData'><label class='labelPoint' for='cd" + i + "'>" + pad(mvData[i].contact_number.toString(), 8) + "</label></td>";
            TRHTML += "<td class='tdData'><label class='labelPoint' for='cd" + i + "'>" + mvData[i].name + "</label></td>";
        }
        TRHTML += "<td class='tdData'><label class='labelPoint' for='cd" + i + "'>" + mvData[i].role + "</label></td>";
        TRHTML += "<td class='tdData'><label class='labelPoint' for='cd" + i + "'>" + mvData[i].location + "</label></td>";

        TRHTML += "<td class='tdData tdModule THD_MOD'><label class='label labelPoint' for='cd" + i + "'>" + mvData[i].module_desc + "</label></td>";

        TRHTML += "<td class='tdData tdModule THD_LR'>";
        if (mvData[i].learning_required === "Y") TRHTML += "<a href='#' class='TickIMG' onclick='return false;'>";
        TRHTML += "</td>";

        mvData[i].learning_complete = mvData[i].learning_complete ? formatDate(new Date(Date.parse(mvData[i].learning_complete)), DisplayDateFormat) : undefined;
        mvData[i].renewal_date = mvData[i].renewal_date ? formatDate(new Date(Date.parse(mvData[i].renewal_date)), DisplayDateFormat) : undefined;

        if (!mvData[i].learning_complete) TRHTML += "<td class='tdData tdModule THD_LC' />";
        else TRHTML += "<td class='tdData tdModule THD_LC' style='white-space: nowrap;'><label class='label labelPoint' for='cd" + i + "'>" + mvData[i].learning_complete + "</label></td>";

        if (!mvData[i].renewal_date) TRHTML += "<td class='tdData tdModule THD_RD' />";
        else TRHTML += "<td class='tdData tdModule THD_RD' style='white-space: nowrap;'><label class='label labelPoint' for='cd" + i + "'>" + mvData[i].renewal_date + "</label></td>";

        if (otm_TRN_CRUD) {
            var UseClass = "";

            if (mvData[i].member_training_module_number)
                UseClass = "bnUpdate1";
            else if (!mvData[i].training_module_number)
                UseClass = "bnUpdate2";
            else
                UseClass = "bnUpdate3";

            TRHTML += "<td class='tdData' style='width:50px;'><input class='" + UseClass + "' type=button value='Update Training'/></td>";
        }
        TRHTML += "</tr>";
        $("#tbl_p1_results tbody").append(TRHTML);

        if (otm_TRN_CRUD) {
            if (UseClass === "bnUpdate1")
                $(".bnUpdate1").last().click(function () {
                    var CN = $(this).closest("tr").data("ng_id").toString();
                    var MTMN = $(this).closest("tr").data("mtmn_id").toString();
                    UpdateTrainingPopup(CN, MTMN, "S11", undefined);
                });

            if (UseClass === "bnUpdate2")
                $(".bnUpdate2").last().click(function () {
                    var CN = $(this).closest("tr").data("ng_id").toString();
                    UpdateTrainingPopup(CN, undefined, "S11", undefined);
                });

            if (UseClass === "bnUpdate3")
                $(".bnUpdate3").last().click(function () {
                    var CN = $(this).closest("tr").data("ng_id").toString();
                    var TMN = $(this).closest("tr").data("tmn").toString();
                    var DESC = $(this).closest("tr").data("desc");
                    UpdateTrainingPopup(CN, TMN, "S11", DESC);
                });
        }

        // manual load of columns
        if (ColsSpeed) {
            GP_AddFilterItem("tbl_p1_results", "No", vformattedCN, 1);
            GP_AddFilterItem("tbl_p1_results", "Name", mvData[i].name, 2);
            GP_AddFilterItem("tbl_p1_results", "Role", mvData[i].role, 3);
            GP_AddFilterItem("tbl_p1_results", "Location", mvData[i].location, 4);
            GP_AddFilterItem("tbl_p1_results", "Module", mvData[i].module_desc, 5);
            if (!otm_cbo_p1_update) {
                GP_AddFilterItem("tbl_p1_results", "Learning~Required", "", 6);
                GP_AddFilterItem("tbl_p1_results", "Learning~Complete", "", 7);
                GP_AddFilterItem("tbl_p1_results", "Renewal~Date", "", 8);
            }
            else {
                GP_AddFilterItem("tbl_p1_results", "Learning~Required", mvData[i].learning_required, 6);
                GP_AddFilterItem("tbl_p1_results", "Learning~Complete", mvData[i].learning_complete, 7);
                GP_AddFilterItem("tbl_p1_results", "Renewal~Date", mvData[i].renewal_date, 8);
            }
        }

        added++;
    }

    $(".newTR").hover(
        function () { $(this).addClass("Grid_HL").css({ "cursor": "" }); },
        function () { $(this).removeClass("Grid_HL").css({ "cursor": "" }); }
    ).AttrToData("mtmn_id").AttrToData("ng_id").AttrToData("tmn").AttrToData("desc").removeClass("newTR");
    DisplayCorrectCols();

    mvSkip = mvSkip + added;
    if (mvSkip === mvData.length) mvTake = -1; // mark as done.
}

function PopulateGrid(result) {
    $("#mstr_scroll").off("scroll");
    mvSkip = 0;
    mvTake = -2;
    mvData = undefined;
    mvPopulateRoutine = undefined;

    $("#tbl_th").css({ "display": "" });
    if (result && $.parseJSON(result).length > 0) {
        if ($.parseJSON(result).length === 1 && !$.parseJSON(result)[0].contact_number) {
            $("#txt_p1_recordcount").text($.parseJSON(result)[0].error);
            $("#tbl_th").css({ "display": "none" });
            $("#noRecords").text($.parseJSON(result)[0].error);
            $("#divNoRecords").css({ "display": "" });
            $("#divToManyRecords").css({ "display": "none" });
        }
        else {
            mvData = $.parseJSON(result);
            AddGridSort_Columns("tbl_p1_results");
            mvPopulateRoutine = PopulateData;
            setTimeout(PopulateData, 100);

            if (mvData.length === 1) $("#txt_p1_recordcount").text(" - (1 Match Found)");
            else $("#txt_p1_recordcount").text(" - (" + (LastForceMode === 2 ? "First " : "") + mvData.length + " Matches Found)");
        }
    }
    else {
        $("#tbl_th").css({ "display": "none" });
        $("#divNoRecords").css({ "display": "" });
        $("#divToManyRecords").css({ "display": "none" });
        $("#txt_p1_recordcount").text(" - (No Records Found)");

        DisplayCorrectCols();
    }
}

function DisplayCorrectCols() {
    //$(".THD_LR, .THD_LC, .THD_RD").css({ "display": "" });
    $(".tdModule").css({ "display": "" });

    if ($("#ctl00_plInnerPanel_head_cbo_p1_update").val() === "") {
        //Search adult members, module not an option
        //Hide all module-related cols
        $(".tdModule").css({ "display": "none" });
    }
    else {
        //LR, VR or OGL search
        if ($("#ctl00_plInnerPanel_head_cbo_p1_module").val()) {
            //module selected, so hide actual module col
            $(".THD_MOD").css({ "display": "none" });
        }
        //LR - always hide required, complete & renewal 
        if ($("#ctl00_plInnerPanel_head_cbo_p1_update").val() === "LR")
            $(".THD_LR, .THD_LC, .THD_RD").css({ "display": "none" });

        //VR - always hide renewal, hide required & complete if module not selected
        if ($("#ctl00_plInnerPanel_head_cbo_p1_update").val() === "VR") {
            if ($("#ctl00_plInnerPanel_head_cbo_p1_module").val())
                $(".THD_RD").css({ "display": "none" });
            else
                $(".THD_LR, .THD_LC, .THD_RD").css({ "display": "none" });
        }

        //OGL - always hide required & compelte (plus renewal, if no module selected)
        if ($("#ctl00_plInnerPanel_head_cbo_p1_update").val() === "OGL")
            if ($("#ctl00_plInnerPanel_head_cbo_p1_module").val())
                $(".THD_LR, .THD_LC").css({ "display": "none" });
            else
                $(".THD_LR, .THD_LC, .THD_RD").css({ "display": "none" });
    }
}

function UpdateTrainingPopup(CN, PK, tr_opts, TrainingData) {
    // NOTE: tr_opts = S or B and then 10 for hours and 10 for MOGL  so 'S11' = 'S', and 'on', 'on',
    if (!CN || !CN.replaceAll(" ", "")) {
        $.system_alert("You must select at least 1 record when updating training for multiple people.");
        return;
    }

    if (tr_opts[0] === "B" && CN.split(",").length === 1 && tr_opts.length === 3) tr_opts = "S" + tr_opts[1] + tr_opts[2];

    var html = "";
    var Line = "<tr class='msTR' style='height:25px;'><td class='label' style='cursor:default;'>{1}</td><td style='width:75px; text-align:right;'><input style='width:60px;' type='button' value='Select' class='{0}' {2}></input></td></tr>";

    if (tr_opts[3] !== 'X' && !TrainingData) {
        CN = CN.replaceAll(" ", "");

        var f_success = function (result) {
            if (!pk_val("Master.Sys.REST") && result) result = result.d;

            HideBusy_Main();
            if (!result) UpdateTrainingPopup(CN, PK, tr_opts + "X", undefined);
            else {
                var Items = "";
                if (CN.split(",").length === 1) // single
                {
                    var RoleName = "";
                    $.each(result, function (idx) {
                        if (RoleName !== this.Parent) {
                            RoleName = this.Parent;
                            Items += "<tr style='height:25px;'><td class='label' colspan='2' style='cursor:default;'><b>Role : " + this.Parent + "</b></td></tr>";
                        }
                        Items += Line.format("update_trn", "Update - " + this.Description, "data-cn='" + CN + "' data-pk='" + (tr_opts[0] === 'B' ? this.Parent : this.Value) + "'");
                    });
                }
                else // multiple                
                    $.each(result, function (idx) { Items += Line.format("update_trn", "Update - " + this.Description, "data-cn='" + CN + "' data-pk='" + (tr_opts[0] === 'B' ? this.Parent : this.Value) + "'"); });

                UpdateTrainingPopup(CN, PK, tr_opts, Items);
            }
        };
        
        if (pk_val("Master.Sys.REST")) {
            var vData = {};
            vData["ContactNumber"] = CN;
            vData["MTMN_List"] = (!PK ? "" : PK);
            vData["YA"] = pk_val("Page.YA");
            PostToHandler(vData, "/role/plp/membermodules", f_success, ServiceFailed, false, true);
        } else {
            var vURL = WebServicePath() + "GetMemberTrainingModules?pUseContactNumber=" + CN + "&pList=" + (!PK ? "" : PK) + "&pYA=" + pk_val("Page.YA");
            //TSA-629 Testing feedback
            //On SH's PC (Windows8 / ie11) the url is being passed to the browser with commas replaced by %2c. This is enough (even in cases where the URL is 
            //significantly less than 2000 characters long) to pass through here unhindered but still blow up when it hits the browser.
            var testURL = encodeURI(vURL).replace(/,/g, "%2c");
            //PL 25.09.15
            //Testing @BPP is hitting URL length of ~2800 characters with ~75 contacts.
            //Stackoverflow http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
            //suggests a max of 2000 to be safe.
            //The 150 contacts check below fails, because the list of modules is also variable
            if (testURL.length > 2000) {
                var vPercent = Math.round(((testURL.length - 2000) * 100) / testURL.length);
                var vNum = Math.round(CN.split(",").length * (vPercent / 100) + 1);
                if (vPercent === 0) vPercent = 1;
                $.system_alert("Unfortunately it is not possible to update training for this many members at once. <br />Please remove approximately " + vPercent + "% of the selected items (" + (vNum > 1 ? (vNum < 10 ? (vNum - 1) + " or " + vNum : "about " + vNum) + " members" : "1 member") + ") and try again.");
                return;
            }
            ShowBusy_Main();
            $.ajax({ url: vURL, success: f_success, error: ServiceFailed });
        }
        return;
    }

    var buttonbar = "";
    html += "<table style='width:100%;min-width:500px;margin-right: 15px;'>";

    //#######

    if ((tr_opts[1] === '1' && HasAccess(pk_val("CRUD.YN_HRS_CRUD"), "C")) || (HasAccess(pk_val("CRUD.TOGL"), "C") && tr_opts[2] === '1')) {
        html += "<tr><td colspan='2'><h3>Ongoing Learning Options</h3></td></tr>";
        if (tr_opts[1] === '1' && HasAccess(pk_val("CRUD.YN_HRS_CRUD"), "C")) html += Line.format("trn_hours", "Add OGL Hours" + (CN.split(',').length > 1 ? " (" + CN.split(',').length + ")" : ""), "data-cn='" + CN + "'");
        if (HasAccess(pk_val("CRUD.TOGL"),"C") && tr_opts[2] === '1') html += Line.format("trn_ogl", "Add Mandatory OGL Training" + (CN.split(',').length > 1 ? " (" + CN.split(',').length + ")" : ""), "data-cn='" + CN + "'");
        html += "<tr><td colspan='2'><br/></td></tr>";
    }
    //#######

    if (tr_opts[0] === 'S' || $("#ctl00_plInnerPanel_head_cbo_p1_update").val() !== "OGL") {
        if (tr_opts[3] === 'X') {
            html += "<tr><td colspan='2'><h3>Member PLP Training</h3></td></tr>";
            html += "<tr><td colspan='2'><label>This member has no training</label></td></tr>";
            html += "<tr><td colspan='2'></td></tr>";
        }
        else if ((tr_opts[0] === 'S' || CN.split(',').length > 1) && TrainingData) {
            html += "<tr><td colspan='2'><h3>Member PLP Training</h3></td></tr>" + TrainingData + "<tr><td colspan='2'></td></tr>";
        }
        else {
            html += "<tr><td colspan='2'><h3>Member PLP Training</h3></td></tr>";
            html += Line.format("update_trn", "Update " + (!TrainingData ? " - " + $("#ctl00_plInnerPanel_head_cbo_p1_module option:selected").text() : " - " + TrainingData) + (PK.toString().split(',').length > 1 ? " (" + PK.toString().split(',').length + ")" : ""), "data-cn='" + CN + "' data-pk='" + PK + "'");
            html += "<tr><td colspan='2'></td></tr>";
        }
    }
    //#######
    buttonbar += "<input type='button' class='sysmsg_close' value='Cancel'>";

    html += "</table><br/>";

    if (tr_opts[0] === 'S')
        $.system_window(html, "<h2>Select Option-Single Member</h2>", buttonbar, 1);
    else if (CN.split(',').length > 1 && !PK)
        $.system_window(html, "<h2>Select Option-Multiple Members (" + CN.split(',').length + ")</h2>", buttonbar, 1);
    else
        $.system_window(html, "<h2>Select Option-Multiple Members</h2>", buttonbar, 1);

    $(".trn_hours").click(function () {
        AddHours($(this).data("cn"));
        CloseHintPopup();
    }).AttrToData("cn");
    $(".trn_ogl").click(function () {
        AddTraining($(this).data("cn"));
        CloseHintPopup();
    }).AttrToData("cn");
    $(".update_trn").click(function () {
        UpdateTraining($(this).data("cn"), $(this).data("pk"));
        CloseHintPopup();
    }).AttrToData("cn").AttrToData("pk");
}

function GetSelectedCNs() {
    var AllCN = " ";
    $(".gridCB").each(function () {
        var UseTR = $(this).closest("tr");
        if ($(this).is(":checked") && $(this).is(":visible") && AllCN.indexOf(" " + UseTR.data("ng_id") + " ") < 0) {
            AllCN += (AllCN !== " " ? ", " : "") + UseTR.data("ng_id") + " ";
        }
    });

    if (mvData && $(".msCheckAll").is(":checked")) {
        for (var i = mvSkip; i < mvData.length; i++) {
            if (AllCN.indexOf(" " + mvData[i].contact_number + " ") < 0) //made CN's unique                
                AllCN += (AllCN !== " " ? ", " : "") + mvData[i].contact_number + " ";
        }
    }

    return AllCN.replaceAll(" ", "");
}

function GetSelectedMTMNs() {
    if (!$(".gridCB").first().closest("tr").data("mtmn_id"))
        return "";

    var All = "";
    $(".gridCB").each(function () {
        var MTMN = $(this).closest("tr").data("mtmn_id");
        if ($(this).is(":checked") && MTMN) All += (All ? "," : "") + MTMN;
    });

    if (mvData && $(".msCheckAll").is(":checked")) {
        for (var i = mvSkip; i < mvData.length; i++) {
            All += (All ? "," : "") + mvData[i].member_training_module_number;
        }
    }

    return All;
}

function AddTraining(CN) {
    if (CN.split(",").length > 1)
        OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTrainingMultiple.aspx?FromPage=TM&Mode=OGL&All_CN=' + CN + "&YA=" + pk_val("Page.YA"), '54%', '650px', '380px', '650px', '380px', true, false);
    else
        OpeniFrame(WebSitePath() + 'Popups/Maint/TrainingOGL.aspx?FromPage=TM&CN=' + CN, '54%', '550px', '400px', '550px', '400px', true, false);
}

function AddHours(CN) {
    if (CN.split(",").length > 1)
        OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTrainingMultiple.aspx?FromPage=TM&Mode=HRS&All_CN=' + CN + "&YA=" + pk_val("Page.YA"), '54%', '650px', '380px', '650px', '380px', true, false);
    else
        OpeniFrame(WebSitePath() + 'Popups/Maint/TrainingHours.aspx?FromPage=TM&CN=' + CN, '54%', '550px', '420px', '550px', '420px', true, false);
}

function UpdateTraining(CN, MTMNs_PK, doClose) {
    if (doClose) CloseHintPopup();

    var vReloadAfterSave = "";
    if ($("#ctl00_plInnerPanel_head_cbo_p1_update option:selected").attr("value")) // only reload page on save IF specific training was queried for, (adhoc searches dont reload page)
        vReloadAfterSave = "&Reload=Y";

    // depending on whether its come from multi module select, or multi people select (who have multi modules) different PK select is needed)    
    if (CN.split(",").length > 1) {
        if (!MTMNs_PK)
            OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTrainingMultiple.aspx?All_MTMN=' + GetSelectedMTMNs() + "&Mode=TRN&YA=" + pk_val("Page.YA") + vReloadAfterSave, '69%', '890px', '90%', '550px', '', true, false);
        else
            OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTrainingMultiple.aspx?All_MTMN=' + MTMNs_PK + "&Mode=TRN&YA=" + pk_val("Page.YA") + vReloadAfterSave, '69%', '890px', '90%', '550px', '', true, false);
    }
    else {
        //SINGLE route; only one CN selected, so MTMNs_PK can only have one value?
        OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTraining.aspx?CN=' + CN + "&Mode=TRN&EDIT=" + MTMNs_PK + vReloadAfterSave, '69%', '850px', '90%', '750px', '350px', true, false);
    }
}
