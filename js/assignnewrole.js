$.ajaxSetup({ cache: false });

var vCurrentPageNo = 1;
var vLoading = false;
var vRegionCBO_Count = 0;
var CloseDelay = 750;

$(document).ready(FormReady);

function FormReady() {
    if ($("#ctl00_workarea_h_cbo_p1_level").val() === "VETT-RELOAD")
        return;

    vLoading = true;
	SetUpPage(pk_val("Page.IsReadonly"), pk_val("Page.NG_ID") === "");

    if (!$.Is_MSIE(8))
        $("#ctl00_workarea_txt_p1_memberno").attr("type", "search");

		/***************/

	$("#LBTN1").click(function () { return ChangePage(vCurrentPageNo,1); });
	$("#LBTN2").click(function () { return ChangePage(vCurrentPageNo,2); });
	$("#LBTN3").click(function () { return ChangePage(vCurrentPageNo,3); });
	$("#LBTN4").click(function () { return ChangePage(vCurrentPageNo,4); });

	$("#bn_p1_next").click(function () { return ChangePage(1, 2); });
	$("#bn_p2_next").click(function () { return ChangePage(2, 3); });
	$("#bnPrev2").click(function () { return ChangePage(2,1); });
	$("#bnPrev3,#bnBack").click(function () { return PrevPageClick(vCurrentPageNo, 2, ValidatePage, MakePageVisible, ResetPage); });
	$("#bn_p2_next,#bn_p1_next").css({ "margin-top": "-5px", "float": "right" });

	if (!pk_val("Page.IsReadonly")) {
	    $("input").keydown(function (event) { return RemoveNotWantedChars(event); });
	    $("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnSave4,#ctl00_footer_bnSave5").attr("href", "#").click(ClientSave);
	    $("#ctl00_footer_bnDelete").attr("href", "#").click(ClientDelete);
	    $("#bnReset1,#bnReset2,#bnReset3").click(function () { return ResetPage(vCurrentPageNo); });
	    $("#bnRef").click(function () { return ChangePage(vCurrentPageNo, 3); });

	    $("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2").css({ "margin-top": "-5px", "margin-right": "5px", "float": "right" });

	    $("#lnk_p3_Email").click(SendEmailRequest);
	    $("#lnk_p3_vEmail").click(ViewEmailRequest);

	    // VOK = Role Update + CE options (need to know code), PCap = only for delete options enabled. RO = just make it readonly so ignore prev 2.!
	    //TSA-935
	    if ((pk_val("Const.CE.VOK") || pk_val("Const.CE.PCap")) && !pk_val("Const.CE.RO")) {
	        // can we update CE? if not dont setup events
	        if (HasAccess(pk_val("CRUD.VETT"), 'U')) {
	            $("#bn_p2_CE_Date").click(function () { PopupPriorDateOnlySelect(this, 'ctl00_workarea_txt_p2_CE_Date'); });

	            $("#ctl00_workarea_txt_p2_CE_Date").blur(function () {
	                AddPriorDateOnlyFilter();
	                Date_TextBox_Blur(this, 'Only dates today or in the past can be entered.');
	                $(this).trigger("change");
	            }).change(function () {
	                if ($("#ctl00_workarea_cbo_p2_CE_Status").val() === pk_val("Const.CE.VOK") || (!$("#ctl00_workarea_cbo_p2_CE_Status").val() && !pk_val("Page.Croc"))) {
	                    if (!$(this).val()) {
	                        if ($("#ctl00_workarea_cbo_p2_CE_Status").val() === pk_val("Const.CE.VOK") && !$(this).val())
	                            $("#ctl00_workarea_txt_p2_cecheck").val(formatDate(new Date(), DisplayDateFormat));
	                        else
	                            $("#ctl00_workarea_txt_p2_cecheck").resetDB();
	                    }
	                    else
	                        $("#ctl00_workarea_txt_p2_cecheck").val($(this).val());
	                }
	            });

	            $("#ctl00_workarea_cbo_p2_CE_Status").change(function () {
	                if ($("#ctl00_workarea_cbo_p2_CE_Status").val() === pk_val("Const.CE.VOK")) {
	                    $("#ctl00_workarea_txt_p2_CE_Date").val(formatDate(new Date(), DisplayDateFormat)).attr("required", "required").trigger("change");
	                } else {
	                    $("#ctl00_workarea_txt_p2_CE_Date").val("");
	                }
	                SetVettVis();
	            });
	        }

	        // can we actually delete (dont setup event if not)
	        if (HasAccess(pk_val("CRUD.VETT"), 'D') && pk_val("Const.CE.PCap")) {
	            $("#ctl00_workarea_bn_p2_CE_Remove").click(function () {
	                $("#ctl00_workarea_txt_p2_CE_Date").val("");// blank CE date
	                $("#ctl00_workarea_cbo_p2_CE_Status").val(pk_val("Const.CE.VRS"));// blank all Vetting edits to remove default value
	                $("#ctl00_workarea_txt_p2_status").val(pk_val("Const.CE.PPCap")); // change status Caption to PreProvisional
	                $("#ctl00_workarea_h_cbo_p2_VCR").val("Y"); // have pressed remove CE
	                SetVettVis();
	                HasChanges = true;
	            });
	        }
	    }

	    $("#ctl00_workarea_txt_p3_R1_RespBy").blur(function () { Date_TextBox_Blur(this); });
	    $("#bn_p3_R1_RespBy").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p3_R1_RespBy'); });

	    $("#ctl00_workarea_txt_p3_R1_RespOn").blur(function () { Date_TextBox_Blur(this); });
	    $("#bn_p3_R1_RespOn").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p3_R1_RespOn'); });

	    $("#ctl00_workarea_txt_p3_R2_RespBy").blur(function () { Date_TextBox_Blur(this); });
	    $("#bn_p3_R2_RespBy").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p3_R2_RespBy'); });

	    $("#ctl00_workarea_txt_p3_R2_RespOn").blur(function () { Date_TextBox_Blur(this); });
	    $("#bn_p3_R2_RespOn").click(function () { PopupDateSelect(this, 'ctl00_workarea_txt_p3_R2_RespOn'); });

	    $("#ctl00_workarea_txt_p3_R2_Email,#ctl00_workarea_txt_p3_R1_Email").blur(function () { validateEmail(this); });

	    $("#ctl00_workarea_bn_p2_Disc").click(function () { CallDisclosure(); return false; });

	    $("#ctl00_workarea_txt_p2_review").blur(function () { AddReviewDateFilter(); Date_TextBox_Blur(this, 'Only dates upto 5 years after the start date, or 5 years in the future can be added here.'); });
	    $("#bn_p2_review").click(function () { PopupReviewSelect(this, 'ctl00_workarea_txt_p2_review'); });

	    $("#ctl00_workarea_txt_p1_enddate").blur(function () { AddPriorDateFilter(); Date_TextBox_Blur(this, 'Only dates in the past can be entered for prior roles.'); });
	    $("#bn_p1_enddate").click(function () { PopupPriorDateSelect(this, 'ctl00_workarea_txt_p1_enddate'); });

	    $("#ctl00_workarea_txt_p1_startdate").blur(function () { StartDateBlur(this); });
	    $("#bn_p1_startdate").click(function () { PopupStartDateSelect(this, 'ctl00_workarea_txt_p1_startdate'); });

	    $("#bn_p1_refresh").click(AutoGenerateTitle);

	    $(".VariantsCBO").change(function () { VariantsChange(this); });
	    $(".VariantsBN").click(function () { RemoveVariant(this, false); });

	    $(".QuickSearchButton").click(function () { SearchButtonClick('Y'); });

	    $("#ctl00_workarea_txt_p1_memberno").blur(function () { SearchButtonClick('N'); }).keypress(function (e) { return NumberOnly_KeyPress(e || event, function (e) { $('#ctl00_workarea_txt_p1_memberno').trigger('blur'); }); });

	    if (pk_val("Page.NG_ID"))
	        $("#tbl_p2_Approval tr:not(.tr_p2_Review)").each(function () { SetTrainingEvents(this); });
    }
		/***************/

	$("#ctl00_workarea_txt_p1_membername").AttrToData("DoB"); // push DB from attribute to DOM Data    

		/***************/

	$(".VALON, .VALBY").removeAttr("required");
	SetControlError($(".VALBY"), false);
	SetControlError($(".VALON"), false);
	$(".VALON, .VALBY").each(function () { $(this).nextAll('span.rfv:first').css({ "visibility": "hidden" }); }).AttrToData("ng_id").AttrToData("rtrn_id").AttrToData("ng_value");
	$(".VALBY").each(function () { $(this).nextAll('span.rfv:first').css({ "display": "none" }); });
	
	ResetRequired('#mpage1');
	ResetRequired('#mpage3');

	if ($("#ctl00_workarea_txt_p1_memberno").val()) {
		$(".QuickSearchButton,#ctl00_workarea_txt_p1_memberno").not(".TRN").css({ "display": "none" });
		$(".rfv", $("#ctl00_workarea_txt_p1_memberno").parent()).css({ "display": "none" });
		$("#ctl00_workarea_txt_p1_membername").css({ "display": "block" });
	}
	else {
		$("#ctl00_workarea_cbo_p1_membershipgrade").attr("disabled", "disabled");
		$("#ctl00_workarea_cbo_p1_role").attr("disabled", "disabled");
		$("#ctl00_workarea_trTroop").css({ "display": "none", "visibility": "hidden" });
	}

	if (!pk_val("Page.IsReadonly")) {
		if (pk_val("Page.RoleStatus") === "A") {
			//$("#ctl00_workarea_cbo_p2_linemaneger").attr("disabled", "disabled");
			$("input", $("#mpage3")).attr("readonly", "readonly").makeNotRequired();
			$(".EDITBN", $("#mpage3")).css("display", "none");
			$(".EDITBN", $("#fpage3")).css("display", "none");
		}
	}

    // make fields readonly (NOTE leave remove button in place)
    //TSA-936
	if (pk_val("Const.CE.VOK") || pk_val("Const.CE.PCap") || pk_val("Const.CE.RO"))
	    SetVettVis(true);

	if (!pk_val("Page.ShowSummaryTab")) $("#LBTN4,#fpage4,#mpage4").remove();
	if (pk_val("Page.IsReadonly") || $("#ctl00_workarea_txt_p1_startdate").attr("readonly") === "readonly") $(".rfv").remove();
	try { if ($("#ctl00_workarea_txt_p1_memberno").val()) { PrePopulate(); } } catch (e) { }

	//#region Location Change Events

	if (pk_val("Master.Sys.TextSize") === "0")
        $("#ll_p2_Disc").css("font-size","0.9em");

	if (vInsertMode) {
	    $("#bnReset1,#bnReset2,#bnReset3").text("Clear");
	    
	    //#region Handler and REST Hierarchy

        // call back functions (used for both REST and JSON calls)
	    var f_Country = function (result) { PopulateCBO("#ctl00_workarea_cbo_p1_location_1", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };
	    var f_Region = function (result) { PopulateCBO("#ctl00_workarea_cbo_p1_location_2", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };
	    var f_County = function (result) { PopulateCBO("#ctl00_workarea_cbo_p1_location_3", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };
	    var f_District = function (result) { PopulateCBO("#ctl00_workarea_cbo_p1_location_4", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };
	    var f_Group = function (result) { PopulateCBO("#ctl00_workarea_cbo_p1_location_5", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };
	    var f_Section = function (result) { PopulateCBO("#ctl00_workarea_cbo_p1_location_6", result, true, "--- No Items Available ---", true, "", "--- Select Location ---"); SetEnabled(); };

	    $("#ctl00_workarea_cbo_p1_location_0").change(function () {
	        $('#ctl00_workarea_cbo_p1_location_1,#ctl00_workarea_cbo_p1_location_2,#ctl00_workarea_cbo_p1_location_3,#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
	        $('#ctl00_workarea_cbo_p1_location_1,#ctl00_workarea_cbo_p1_location_2,#ctl00_workarea_cbo_p1_location_3,#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').attr("disabled", "disabled");
	        if (pk_val("Master.Sys.REST")) {
	            var vData = {};
	            vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_0 option:selected").val();
	            PostToHandler(vData, "/hierarchy/countries", f_Country, ServiceFailed, false, true);
	            PostToHandler(vData, "/hierarchy/hq/sections", f_Section, ServiceFailed, false, true);
	        } else {
	            $.ajax({ url: WebServicePath() + "GetScoutCountries?pOrgID=" + $("#ctl00_workarea_cbo_p1_location_0 option:selected").val(), success: f_Country, error: ServiceFailed });
	            $.ajax({ url: WebServicePath() + "GetOrganisationSections?pOrgID=" + $("#ctl00_workarea_cbo_p1_location_0 option:selected").val(), success: f_Section, error: ServiceFailed });
	        }
	        $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(0, false, true));
	        $("#ctl00_workarea_cbo_p1_level").val("ORG").trigger("change").data("level", "0");
	    });

	    $("#ctl00_workarea_cbo_p1_location_1").change(function () {
	        $("#ctl00_workarea_h_txt_p1_countryorgno").val($("#ctl00_workarea_cbo_p1_location_1 option:selected").val());
	        CountryOrganisationNumber = $("#ctl00_workarea_cbo_p1_location_1 option:selected").val();

	        $('#ctl00_workarea_cbo_p1_location_2,#ctl00_workarea_cbo_p1_location_3,#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
	        $('#ctl00_workarea_cbo_p1_location_2,#ctl00_workarea_cbo_p1_location_3,#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').attr("disabled", "disabled");
	        if ($("#ctl00_workarea_cbo_p1_location_1 option:selected").val()) {
	            vRegionCBO_Count = 2;
	            if (pk_val("Master.Sys.REST")) {
	                var vData = {};
	                vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_1 option:selected").val();
	                PostToHandler(vData, "/hierarchy/regions", f_Region, ServiceFailed,false,true);
	                PostToHandler(vData, "/hierarchy/country/sections", f_Section, ServiceFailed, false, true);
	            } else {
	                $.ajax({ url: WebServicePath() + "GetScoutRegions?pCountryID=" + $("#ctl00_workarea_cbo_p1_location_1 option:selected").val(), success: f_Region, error: ServiceFailed });
	                $.ajax({ url: WebServicePath() + "GetCountrySections?pCountryID=" + $("#ctl00_workarea_cbo_p1_location_1 option:selected").val(), success: f_Section, error: ServiceFailed });
	            }
	            $("#ctl00_workarea_lbl_p1_location_3").text(GetCaptionName(3, false, false));
	            $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(1, false, true));
	            $("#ctl00_workarea_cbo_p1_level").val("CNTR").data("level", "1");
	        }
	        else {
	            if ($("#ctl00_workarea_cbo_p1_location_0 option:selected").val()) {
	                if (pk_val("Master.Sys.REST")) {
	                    var vData = {};	                    
	                    vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_0 option:selected").val();
	                    PostToHandler(vData, "/hierarchy/hq/sections", f_Section, ServiceFailed, false, true);
	                } else {
	                    $.ajax({ url: WebServicePath() + "GetOrganisationSections?pOrgID=" + $("#ctl00_workarea_cbo_p1_location_0 option:selected").val(), success: f_Section, error: ServiceFailed });
	                }
	                $("#ctl00_workarea_cbo_p1_level").val("ORG").data("level", "0");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(0, false, true));
	            }
	            else return;
	        }

	        $("#ctl00_workarea_cbo_p1_level").trigger("change");
	    });

	    $("#ctl00_workarea_cbo_p1_location_2").change(function () {
	        $('#ctl00_workarea_cbo_p1_location_3,#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
	        $('#ctl00_workarea_cbo_p1_location_3,#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').attr("disabled", "disabled");
	        if ($("#ctl00_workarea_cbo_p1_location_2 option:selected").val()) {
	            if (pk_val("Master.Sys.REST")) {
	                var vData = {};
	                vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_2 option:selected").val();
	                PostToHandler(vData, "/hierarchy/counties", f_County, ServiceFailed, false, true);
	                PostToHandler(vData, "/hierarchy/region/sections", f_Section, ServiceFailed, false, true);
	            } else {
	                $.ajax({ url: WebServicePath() + "GetScoutCounties?pRegionID=" + $("#ctl00_workarea_cbo_p1_location_2 option:selected").val(), success: f_County, error: ServiceFailed });
	                $.ajax({ url: WebServicePath() + "GetRegionSections?pRegionID=" + $("#ctl00_workarea_cbo_p1_location_2 option:selected").val(), success: f_Section, error: ServiceFailed });
	            }
	            $("#ctl00_workarea_cbo_p1_level").val("REG").data("level", "2");
	            $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(2, false, true));
	        }
	        else {
	            if ($("#ctl00_workarea_cbo_p1_location_1 option:selected").val()) {
	                if (pk_val("Master.Sys.REST")) {
	                    var vData = {};
	                    vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_1 option:selected").val();
	                    PostToHandler(vData, "/hierarchy/country/sections", f_Section, ServiceFailed, false, true);
	                } else {
	                    $.ajax({ url: WebServicePath() + "GetCountrySections?pCountryID=" + $("#ctl00_workarea_cbo_p1_location_1 option:selected").val(), success: f_Section, error: ServiceFailed });
	                }
	                $("#ctl00_workarea_cbo_p1_level").val("CNTR").attr("level", "1");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(1, false, true));
	            }
	            else return;
	        }
	        $("#ctl00_workarea_cbo_p1_level").trigger("change");
	    });

	    $("#ctl00_workarea_cbo_p1_location_3").change(function () {
	        $('#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
	        $('#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').attr("disabled", "disabled");
	        if ($("#ctl00_workarea_cbo_p1_location_3 option:selected").val()) {
	            if (pk_val("Master.Sys.REST")) {
	                var vData = {};
	                vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_3 option:selected").val();
	                PostToHandler(vData, "/hierarchy/districts", f_District, ServiceFailed, false, true);
	                PostToHandler(vData, "/hierarchy/county/sections", f_Section, ServiceFailed, false, true);
	            } else {
	                $.ajax({ url: WebServicePath() + "GetScoutDistricts?pCountyID=" + $("#ctl00_workarea_cbo_p1_location_3 option:selected").val(), success: f_District, error: ServiceFailed });
	                $.ajax({ url: WebServicePath() + "GetCountySections?pCountyID=" + $("#ctl00_workarea_cbo_p1_location_3 option:selected").val(), success: f_Section, error: ServiceFailed });
	            }
	            $("#ctl00_workarea_cbo_p1_level").val("CNTY").data("level", "3");
	            $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(3, false, true));

	        }
	        else {
	            if ($("#ctl00_workarea_cbo_p1_location_2 option:selected").val()) {
	                if (pk_val("Master.Sys.REST")) {
	                    var vData = {};
	                    vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_2 option:selected").val();
	                    PostToHandler(vData, "/hierarchy/region/sections", f_Section, ServiceFailed, false, true);
	                } else {
	                    $.ajax({ url: WebServicePath() + "GetRegionSections?pRegionID=" + $("#ctl00_workarea_cbo_p1_location_2 option:selected").val(), success: f_Section, error: ServiceFailed });
	                }
	                $("#ctl00_workarea_cbo_p1_level").val("REG").data("level", "2");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(2, false, true));
	            }
	            else return;
	        }
	        $("#ctl00_workarea_cbo_p1_level").trigger("change");
	    });

	    $("#ctl00_workarea_cbo_p1_location_4").change(function () {
	        $('#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
	        $('#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6').attr("disabled", "disabled");
	        if ($("#ctl00_workarea_cbo_p1_location_4 option:selected").val()) {
	            if (pk_val("Master.Sys.REST")) {
	                var vData = {};
	                vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_4 option:selected").val();
	                PostToHandler(vData, "/hierarchy/groups", f_Group, ServiceFailed, false, true);
	                PostToHandler(vData, "/hierarchy/district/sections", f_Section, ServiceFailed, false, true);
	            } else {
	                $.ajax({ url: WebServicePath() + "GetScoutGroups?pDistrictID=" + $("#ctl00_workarea_cbo_p1_location_4 option:selected").val(), success: f_Group, error: ServiceFailed });
	                $.ajax({ url: WebServicePath() + "GetDistrictSections?pDistrictID=" + $("#ctl00_workarea_cbo_p1_location_4 option:selected").val(), success: f_Section, error: ServiceFailed });
	            }
	            $("#ctl00_workarea_cbo_p1_level").val("DIST").data("level", "4");
	            $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(4, false, true));
	        }
	        else {
	            if ($("#ctl00_workarea_cbo_p1_location_3 option:selected").val()) {
	                if (pk_val("Master.Sys.REST")) {
	                    var vData = {};
	                    vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_3 option:selected").val();
	                    PostToHandler(vData, "/hierarchy/county/sections", f_Section, ServiceFailed, false, true);
	                } else {
	                    $.ajax({ url: WebServicePath() + "GetCountySections?pCountyID=" + $("#ctl00_workarea_cbo_p1_location_3 option:selected").val(), success: f_Section, error: ServiceFailed });
	                }
	                $("#ctl00_workarea_cbo_p1_level").val("CNTY").data("level", "3");
	                $("#ctl00_workarea_lbl_p6_location_1").text(GetCaptionName(3, false, true));
	            }
	            else return;
	        }
	        $("#ctl00_workarea_cbo_p1_level").trigger("change");
	    });

	    $("#ctl00_workarea_cbo_p1_location_5").change(function () {
	        $('#ctl00_workarea_cbo_p1_location_6').empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
	        $('#ctl00_workarea_cbo_p1_location_6').attr("disabled", "disabled");
	        if ($("#ctl00_workarea_cbo_p1_location_5 option:selected").val()) {
	            if (pk_val("Master.Sys.REST")) {
	                var vData = {};
	                vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_5 option:selected").val();
	                PostToHandler(vData, "/hierarchy/group/sections", f_Section, ServiceFailed, false, true);
	            } else {
	                $.ajax({ url: WebServicePath() + "GetScoutGroupSections?pGroupID=" + $("#ctl00_workarea_cbo_p1_location_5 option:selected").val(), success: f_Section, error: ServiceFailed });
	            }
	            $("#ctl00_workarea_cbo_p1_level").val("SGRP").data("level", "5");
	            $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(5, false, true));
	        }
	        else {
	            if ($("#ctl00_workarea_cbo_p1_location_4 option:selected").val()) {
	                if (pk_val("Master.Sys.REST")) {
	                    var vData = {};
	                    vData["ParentID"] = $("#ctl00_workarea_cbo_p1_location_4 option:selected").val();
	                    PostToHandler(vData, "/hierarchy/district/sections", f_Section, ServiceFailed, false, true);
	                } else {
	                    $.ajax({ url: WebServicePath() + "GetDistrictSections?pDistrictID=" + $("#ctl00_workarea_cbo_p1_location_4 option:selected").val(), success: f_Section, error: ServiceFailed });
	                }
	                $("#ctl00_workarea_cbo_p1_level").val("DIST").data("level", "4");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(4, false, true));
	            }
	            else return;
	        }
	        //ORG,CNTR,REG,CNTY,DIST,SGRP,ORST,CNST,RGST,SGST,CTST,DTST
	        $("#ctl00_workarea_cbo_p1_level").trigger("change");
	    });

	    $("#ctl00_workarea_cbo_p1_location_6").change(function () {
	        if ($("#ctl00_workarea_cbo_p1_location_6 option:selected").val() === "") {
	            if ($("#ctl00_workarea_cbo_p1_location_1 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("ORG").data("level", "0");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(0, false, true));
	            }
	            else if ($("#ctl00_workarea_cbo_p1_location_2 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("CNTR").data("level", "1");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(1, false, true));
	            }
	            else if ($("#ctl00_workarea_cbo_p1_location_3 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("REG").data("level", "2");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(2, false, true));
	            }
	            else if ($("#ctl00_workarea_cbo_p1_location_4 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("CNTY").data("level", "3");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(3, false, true));
	            }
	            else if ($("#ctl00_workarea_cbo_p1_location_5 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("DIST").data("level", "4");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(4, false, true));
	            }
	            else {
	                $("#ctl00_workarea_cbo_p1_level").val("SGRP").data("level", "5");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(5, false, true));
	            }

	            $('#ctl00_workarea_cbo_p1_troop').attr("disabled", "disabled").empty().append('<option selected="selected" value="">--- No Items Available ---</option>');
	        }
	        else {
	            if ($("#ctl00_workarea_cbo_p1_location_1 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("ORST").data("level", "0");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(0, false, true));
	            }
	            else if ($("#ctl00_workarea_cbo_p1_location_2 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("CNST").data("level", "1");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(1, false, true));
	            }
	            else if ($("#ctl00_workarea_cbo_p1_location_3 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("RGST").data("level", "2");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(2, false, true));
	            }
	            else if ($("#ctl00_workarea_cbo_p1_location_4 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("CTST").data("level", "3");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(3, false, true));
	            }
	            else if ($("#ctl00_workarea_cbo_p1_location_5 option:selected").val() === "") {
	                $("#ctl00_workarea_cbo_p1_level").val("DTST").data("level", "4");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(4, false, true));
	            }
	            else {
	                $("#ctl00_workarea_cbo_p1_level").val("SGST").data("level", "5");
	                $("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(5, false, true));
	            }
	        }
	        SetEnabled();
	        if ($("#ctl00_workarea_cbo_p1_location_6 option:selected").val())
	            $.ajax({ url: WebServicePath() + "GetSectionPatrols?pSource=AR&pSectionID=" + $("#ctl00_workarea_cbo_p1_location_6 option:selected").val(), success: function (result) { PopulateCBO("#ctl00_workarea_cbo_p1_troop", result, true, "--- No Items Available ---", true, "", "--- Select Lodge/Six/Patrol ---"); SetEnabled(); }, error: ServiceFailed });

	        $("#ctl00_workarea_cbo_p1_level").trigger("change");
	    });

        //#endregion
	    
	    $("#ctl00_workarea_cbo_p1_level").change(function () {
	        $('#ctl00_workarea_cbo_p1_role option').remove();
	        $("#ctl00_workarea_cbo_p1_role").attr("disabled", "disabled").append(new Option("--- No Roles Available ---", ""));
	        LoadVariants(true);
	        AutoGenerateTitle();
	        if ($("#ctl00_workarea_txt_p1_memberno").val() === "") {
	            $("#ctl00_workarea_cbo_p1_role, #ctl00_workarea_cbo_p1_membershipgrade").val("").attr("disabled", "disabled");
	            SetEnabled();
	            return;
	        }

	        $("#ctl00_workarea_cbo_p1_membershipgrade").attr("disabled", "disabled");
	        if ($("#ctl00_workarea_cbo_p1_level option:selected").val()) {
	            var FilterClass;
	            if ($("#ctl00_workarea_txt_p1_membername").data("DoB")) {
	                var d = new Date();
	                d.setYear(d.getFullYear() - 18); // remove 18 years
	                d.setDate(d.getDate() + 183); // add 6 months as member may join from 17.5 but may not start role until 18

	                if (Date.parse($("#ctl00_workarea_txt_p1_membername").data("DoB")) > d)
	                    FilterClass = "YTH";
	                else {
	                    var dd = new Date();
	                    dd.setYear(dd.getFullYear() - 18); // remove 18 years
	                    if (Date.parse($("#ctl00_workarea_txt_p1_membername").data("DoB")) <= dd)
	                        FilterClass = "!YTH";
	                }
	            }

	            GetInsertRoles_CBO("ctl00_workarea_cbo_p1_role",
                                $("#ctl00_workarea_cbo_p1_level option:selected").val(),
                                GetSelectedON(),
                                true,
                                FilterClass,
                                "No Roles Available",
                                true,
                                true,
                                vIsReadonly || pk_val("Page.NG_ID"),
                                $("#ctl00_workarea_txt_p1_membername").data("CurGrade"),
                                function () { SetEnabled(); HasChanges = false; },
                                $("#ctl00_workarea_cbo_p1_location_6 option:selected").val()
                                );
	        }
	        SetEnabled();
	    });
	    

		$("#ctl00_workarea_cbo_p1_location_6").trigger("change");
	}
	else // insert mode end
	{
		if (!$("#ctl00_workarea_cbo_p1_location_1 option:selected").val()) {
			$("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(0, false, true));
		}
		else if (!$("#ctl00_workarea_cbo_p1_location_2 option:selected").val()) {
			$("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(1, false, true));
		}
		else if (!$("#ctl00_workarea_cbo_p1_location_3 option:selected").val()) {
			$("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(2, false, true));
		}
		else if (!$("#ctl00_workarea_cbo_p1_location_4 option:selected").val()) {
			$("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(3, false, true));
		}
		else if (!$("#ctl00_workarea_cbo_p1_location_5 option:selected").val()) {
			$("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(4, false, true));
		}
		else {
			$("#ctl00_workarea_lbl_p1_location_6").text(GetCaptionName(5, false, true));
		}
	}

	//$("#ctl00_workarea_cbo_p1_membershipgrade").change(function () { if ($("option:selected ", this).attr("CanSelect") != "Y") $.system_alert("You cannot select this grade, another role you have does not have this grade available, you must close that role before you can have this role at this membership level.", "#ctl00_workarea_cbo_p1_membershipgrade", function () { $("#ctl00_workarea_cbo_p1_membershipgrade").val("") }); });

	//#endregion 

	if (!$("#ctl00_workarea_cbo_p2_linemaneger").isRequired())
		$("#req_p2_linemaneger").css("display", "none");

	if (vInsertMode) $("#ctl00_workarea_cbo_p1_role").change(function () {
		if (CheckAgeLimits(false)) {
			LoadVariants(false);
			LoadApproval();
		}
		//PopulateContactMemberGrades();        
	});
	else if (pk_val("Page.HasReferee")) {
	    $("#LBTN3, #bn_p2_next,#LBTN2, #bn_p1_next").css("display", "block");
	}

	if ($("#ctl00_workarea_txt_p1_memberno").val() === "") {
		$("#ctl00_workarea_cbo_p1_level").trigger("change");
		ClearVariants();
		PopulateVariantCBO($('.VariantsCBO').last());        
	}
	else if (!$("#ctl00_workarea_cbo_p1_role").val() || $("option", $("#ctl00_workarea_VariantsCBO")).size() === 0 || ($("option", $("#ctl00_workarea_VariantsCBO")).size() === 1 && $("option", $("#ctl00_workarea_VariantsCBO"))[0].value === ""))
		ClearVariants();
	else if (!vInsertMode)
		PopulateVariantCBO($('.VariantsCBO').last());

	try { if ($("#ctl00_workarea_txt_p1_memberno").val() === "") PrePopulate(); } catch (e) { }    

	// make readonly on update
	if (!vInsertMode) {
		$("#ctl00_workarea_cbo_p1_role,#ctl00_workarea_cbo_p1_location_0,#ctl00_workarea_cbo_p1_location_1,#ctl00_workarea_cbo_p1_location_2,#ctl00_workarea_cbo_p1_location_3,#ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_5,#ctl00_workarea_cbo_p1_location_6").attr("disabled", "disabled");
		if (HasAccess(pk_val("CRUD.MRLL"), 'U'))
			$("#ctl00_workarea_cbo_p1_location_6").removeAttr("disabled");
	}
	else if ($("#ctl00_workarea_txt_p1_memberno").val()) {
		GetContactRoles("ctl00_workarea_cbo_p1_replacerole", $("#ctl00_workarea_txt_p1_memberno").val(), true, "--- No Roles Available ---", true, true, function () { SetEnabled(); SetControlError("#ctl00_workarea_cbo_p1_role", false); }, "--- Select Role ---");
	}

	// Testing feedback - role desc needs to be read only on insert as well as update
	if (!HasAccess(pk_val("CRUD.MRLA"), 'U')) {
		$("#ctl00_workarea_txt_p1_alt_title").attr("readonly", "readonly").css("width", "400px");
		$("#bn_p1_refresh").remove();
	}

	if (!pk_val("Page.HasApproval")) { $("#bn_p1_next,#LBTN2").css("display", "none"); }

	if ($("#ctl00_workarea_txt_p1_startdate").attr("readonly") === "readonly") {
		$("#bn_p1_startdate,#bnRef").css("display", "none");
		$("#ctl00_workarea_txt_p1_startdate").addClass("ReadonlyInput");
		$(".App_Select, #ctl00_workarea_cbo_p1_replacerole").attr("disabled", "disabled"); 
	}    

	if (pk_val("Page.IsReadonly") && $("#ctl00_workarea_tbl_p1_Variants tr").size() > 1)
		$("#ctl00_workarea_tbl_p1_Variants tr").last().hide();

	// alternative small screen size (for inline use only)
	if (!pk_UsePopup()) {//'69%', '900px', '90%', '550px', '320px'
		UseWidth = "920px";
		UseMinWidth = "550px";
		UseHeight = "90%";
		UseMinHeight = "320px";
		UseTop = "2%";
	}

	if (!vIsReadonly) {
	    $("input,select").change(CheckReq);
		if ($("#ctl00_workarea_txt_p1_memberno").val()) {
			if ($("#ctl00_workarea_cbo_p1_role").attr("disabled") === "disabled")
				$.FocusControl("#ctl00_workarea_txt_p1_alt_title", false, 1000);
			else
				$.FocusControl("#ctl00_workarea_cbo_p1_role", false, 1000);
		}
		else { $.FocusControl("#ctl00_workarea_txt_p1_memberno", false, 1000); }
	}
	
	SetTrainingEnabled();
	$.AttrToData("DB"); // push DB from attribute to DOM Data
	HasChanges = false;
	vLoading = false;

	setTimeout(function () { MakePageVisible(pk_val("Nav.StartPage")); }, PageVisibleDelay());
	ShowOriginalSet(); // simple debug routine for checking if orig DB value is set.
}

function SetVettVis(pFromStart) {
    // can we do remove CE (only when full/Prov role + Delete CRUD) > will put back to PP (so then hide)
    if (pFromStart)
        $("#ctl00_workarea_bn_p2_CE_Remove").show();
    else
        $("#ctl00_workarea_bn_p2_CE_Remove").hide();

    // useful variables
    var vCurrentRoleStatus = $("#ctl00_workarea_h_cbo_p2_VCR").val() ? "PP" : pk_val("Page.RoleStatus"); // removal of CE sets status back to PP
    //TSA-932: Also need to respect the overall Page.IsReadonly flag
    var vMakeReadonly = !HasAccess(pk_val("CRUD.VETT"), 'U') || pk_val("Page.IsReadonly");// if no update, then simple, readonly               

    // if Active and from start (or reset) (must be set / OK CE) so make readonly (only remove will change status to PP + then make not Reaonly)
    if (pFromStart && !vMakeReadonly && $("#ctl00_workarea_txt_p2_cecheck").val() !== pk_val("Const.CE.PCap") && vCurrentRoleStatus !== "PP")
        vMakeReadonly = true;

    var fncProcess = function () {
        // if not set use DB value (either Pending or a date)
        if (!$("#ctl00_workarea_cbo_p2_CE_Status option:selected").val()) {
            if (pk_val("Page.Croc"))
                $("#ctl00_workarea_txt_p2_cecheck").val(pk_val("Const.CE.PCap"));
            else if ($("#ctl00_workarea_txt_p2_cecheck").data("db") && $("#ctl00_workarea_txt_p2_cecheck").data("db") !== pk_val("Const.CE.PCap"))
                $("#ctl00_workarea_txt_p2_cecheck").resetDB();
            else
                $("#ctl00_workarea_txt_p2_cecheck").val(formatDate(new Date(), DisplayDateFormat));
        }
        else if ($("#ctl00_workarea_cbo_p2_CE_Status option:selected").val() !== pk_val("Const.CE.VOK")) {
            $("#ctl00_workarea_txt_p2_cecheck").val(pk_val("Const.CE.PCap"));
        }
    };

    if (vMakeReadonly) {
        // we can delete but have no update CRUD
        if (!HasAccess(pk_val("CRUD.VETT"), 'U') && HasAccess(pk_val("CRUD.VETT"), 'D') && $("#ctl00_workarea_h_cbo_p2_VCR").val())
            fncProcess();

        // Read only so all fields disabled
        $("#ctl00_workarea_cbo_p2_CE_Status").attr("disabled", "disabled");
        $("#ctl00_workarea_txt_p2_CE_Date").attr("readonly", "readonly").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        SetControlError($("#ctl00_workarea_txt_p2_CE_Date"), false);
        $("#bn_p2_CE_Date").hide();
    }
    else {
        // can update so enable (on rules)
        if ($("#ctl00_workarea_cbo_p2_CE_Status option:selected").val() === pk_val("Const.CE.VOK")) {
            $("#ctl00_workarea_txt_p2_CE_Date").attr("required", "required").nextAll('span.rfv:first').css({ "visibility": ($("#ctl00_workarea_txt_p2_CE_Date").val() ? "hidden" : "visible") });
            $("#bn_p2_CE_Date").show();
        } else {
            $("#ctl00_workarea_cbo_p2_CE_Status").removeAttr("disabled");
            $("#ctl00_workarea_txt_p2_CE_Date").removeAttr("readonly").removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
            SetControlError($("#ctl00_workarea_txt_p2_CE_Date"), false);
            $("#bn_p2_CE_Date").show();
        }

        fncProcess();
    }

    SetEnabled();
}

function SetTrainingEnabled()
{
	try{
		if (!pk_val("CRUD.TAV")) {
			$(".VALBY, .VALON", $(".trTrainData")).attr("readonly", "readonly");
			$(".QuickSearchButton, .DateLookupButton", $(".trTrainData")).hide();
		}        
	}
	catch (e) { }

	SetEnabled();
}

function GetSelectedON() {
	var ON = $("#ctl00_workarea_cbo_p1_location_1").val();
	return (ON === "" || ON === undefined ? "-1" : ON);
}

function ClientDelete() {
	if (SaveFormCheck('#ctl00_footer_bnDelete',true,true)) {
		$.system_confirm("Delete member role?", function () {
			DeleteHasBeenPressed = true;
			LocalMakeFormReadonlyForSave("Deleting Member Role...");
			__doPostBack('ctl00$footer$bnDelete', '');
		});
		return false;
	}
	else
		return false;
}

function ClientSave() {
    if (!$("#ctl00_workarea_h_cbo_p1_orgno").val()) SetSelectedLocation();

    if (!ValidatePage(vCurrentPageNo))
		return false;

	var vP1ata = "";
	$("#ctl00_workarea_tbl_p1_Variants .VariantsCBO").each(function () {
		if ($(this).val() && $(this).val() !== null) {
			if (vP1ata) vP1ata += "¬";
			vP1ata += (!$(this).data("ng_id") ? "" : $(this).data("ng_id")) + "~" + $(this).val();
		}
	});
	$("#ctl00_head_lst_p1_hiddendata").val(vP1ata);

	if ($("#LBTN2").css("display") !== "none") { // if has a page 2 (approval)
		$("#ctl00_head_txt_p2_linemanager").val($("#ctl00_workarea_cbo_p2_linemaneger option:selected").val());

		if ($("#ctl00_head_txt_EmailRequested").val() === "Y" && ($("#ctl00_workarea_cbo_p2_referee_status option:selected").val() === "NR" || $("#ctl00_workarea_cbo_p2_referee_status option:selected").val() === "NC"))
			$("#ctl00_workarea_cbo_p2_referee_status").val("RR");

		// properties (appointment)
		var vP2PropData = "";
		var vHasUnsat = false;
		$(".App_Select, #ctl00_workarea_txt_p2_disclosure, #ctl00_workarea_txt_p2_cecheck").each(function () {
			if ($(this).data("app_code")) {
				if (vP2PropData) vP2PropData += "¬";
				
				// disclosures has a different code set to the rest
				if ($(this).data("app_code") === pk_val("Const.DISC1") || $(this).data("app_code") === pk_val("Const.DISC2")) {
					if ($("#ctl00_head_txt_p2_disclosurevalue").val() === "DR") vHasUnsat = true;
					vP2PropData += $(this).data("app_code") + "~" + $("#ctl00_head_txt_p2_disclosurevalue").val();
				}
				else if ($(this).data("app_code") === pk_val("Const.CE")) {
					vP2PropData += pk_val("Const.CE");
				}
				else {
					if ($(this).val() === "U") vHasUnsat = true;
					vP2PropData += $(this).data("app_code") + "~" + $(this).val();
				}                
			}
		});
		$("#ctl00_head_txt_p2_data").val(vP2PropData);

		// training
		var vP2TrainData = "";
		$(".trTrainData").each(function () {
			if ($(".VALON", this)) {
				if (vP2TrainData) vP2TrainData += "¬";
				vP2TrainData += $(".VALON", this).data("ng_id") + "~"; // MTN
				vP2TrainData += $(".VALON", this).data("rtrn_id") + "~"; // RTRN
				vP2TrainData += $(".VALON", this).attr("ID").replace("TRAIN_", "") + "~"; // TMN
				vP2TrainData += $(".VALON", this).data("ng_value") + "~"; // Module code                
				vP2TrainData += $(".VALON", this).val() + "~";
				vP2TrainData += $(".VALBY", this).val();
			}
		});
		$("#ctl00_head_txt_p2_traindata").val(vP2TrainData);

		$("#ctl00_workarea_h_cbo_p1_level").val($("#ctl00_workarea_cbo_p1_level").val());
		$("#ctl00_workarea_h_cbo_p1_membershipgrade").val($("#ctl00_workarea_cbo_p1_membershipgrade").val());
		$("#ctl00_workarea_h_cbo_p2_VC").val($("#ctl00_workarea_cbo_p2_CE_Status option:selected").attr("value"));

		if (vHasUnsat) {
			if (SaveFormCheck("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnDelete",false,true)) {
				$.system_confirm("Some requirements have been set to unsatisfactory this will end the appointment of the role and the new role will be cancelled.",
					function () {
						Set_SaveFormCheck_Variables("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnDelete", false);
						LocalMakeFormReadonlyForSave("Cancelling Member Role...");
						__doPostBack('ctl00$footer$bnSave2', '');
					});
			}
		}
		else {
			if (SaveFormCheck("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnDelete", false, true)) {
				Set_SaveFormCheck_Variables("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnDelete", false);
				LocalMakeFormReadonlyForSave();
				__doPostBack('ctl00$footer$bnSave2', '');
			}
		}
		return false;
	}
	else
	{
		if (SaveFormCheck("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnDelete", false, true)) {
			Set_SaveFormCheck_Variables("#ctl00_footer_bnSave1,#ctl00_footer_bnSave2,#ctl00_footer_bnSave3,#ctl00_footer_bnDelete", false);
			LocalMakeFormReadonlyForSave();
			__doPostBack('ctl00$footer$bnSave1', '');
		}
		return false;
	}
}

function LocalMakeFormReadonlyForSave(CustomMessage) {
    MakeFormReadonlyForSave("#bnRef, #bn_p1_refresh,#lnk_p3_Email,#lnk_p3_vEmail, #ctl00_workarea_bn_p2_Disc", CustomMessage);
}

function PrePopulate() {
	$('#ctl00_workarea_cbo_p1_location_0').val(pk_val("Page.LVL.0"));
	$('#ctl00_workarea_cbo_p1_location_1').val(pk_val("Page.LVL.1"));
	$('#ctl00_workarea_cbo_p1_location_2').val(pk_val("Page.LVL.2"));
	$('#ctl00_workarea_cbo_p1_location_3').val(pk_val("Page.LVL.3"));
	$('#ctl00_workarea_cbo_p1_location_4').val(pk_val("Page.LVL.4"));
	$('#ctl00_workarea_cbo_p1_location_5').val(pk_val("Page.LVL.5"));
	$('#ctl00_workarea_cbo_p1_location_6').val(pk_val("Page.LVL.6"));

	PopulateVariantCBO($('.VariantsCBO').last());

	if (pk_val("Page.DisableRef")) {
		$('#ctl00_workarea_cbo_p2_referee_status').last().attr('disabled', 'disabled');
		$('#bnRef').remove();
	}

	PrePopulateData();

	return false;
}

function PrePopulateData() {
    if ($("#ctl00_head_txt_p1_variantdata").val()) {
        var mvData = $.parseJSON($("#ctl00_head_txt_p1_variantdata").val());
        for (var i = 0; i < mvData.length ; i++)
            AddVariant_Data(mvData[i].Key, mvData[i].Value);
    }
}

//#region General Page Navigation

function MakePageVisible(PageNo) {
    PageNo = parseInt(PageNo, 10);
	MakeTabVisible(PageNo);
	vCurrentPageNo = PageNo;

	if (!vIsReadonly) {
		if (PageNo === 1 && $("#ctl00_workarea_txt_p1_memberno").val())
			$.FocusControl("#ctl00_workarea_txt_p1_membername");
		if (PageNo === 2)
			$.FocusControl("#ctl00_workarea_txt_p2_status");
		if (PageNo === 3)
			$.FocusControl("#ctl00_workarea_txt_p3_R1_Name");
	}
}

function ValidatePage(PageNo) {
	vValid = true;
	vReqFocused = false;

	PageNo = parseInt(PageNo, 10);

	if (vIsReadonly)
		return true;

	if (PageNo === 1) {
		if ($("#ctl00_workarea_txt_p1_memberno").css("display") !== "none" && $("#ctl00_workarea_txt_p1_memberno").val()) {
			$.system_alert("Please validate the member number first.", "#ctl00_workarea_txt_p1_memberno");            
			return false;
		}

		if ($("#ctl00_workarea_txt_p1_enddate").val() && $("#ctl00_workarea_txt_p1_startdate").val())
		{
			if (Date.parse($("#ctl00_workarea_txt_p1_startdate").val()) > Date.parse($("#ctl00_workarea_txt_p1_enddate").val()))
			{
				$.system_alert("The start date for the role cannot be after the end date.", "#ctl00_workarea_txt_p1_startdate");
				return false;
			}
		}

		if ($("#ctl00_workarea_txt_p1_membername").data("DoB"))
		{
			var MinAgeDate = new Date($("#ctl00_workarea_txt_p1_membername").data("DoB"));
			MinAgeDate.setYear(MinAgeDate.getFullYear() + 6); // remove 6 years
			//allow Beavers to join from 5.75 years old
			MinAgeDate.setDate(MinAgeDate.getDate() - 94); // add 94 days (= 366/4 = 91.5 round up to 92 and add 2 days to cover edge cases/leap years)

			if (Date.parse($("#ctl00_workarea_txt_p1_startdate").val()) < MinAgeDate)
			{
				$.system_alert("The start date for the role cannot be before the members 5¾ birth date.", "#ctl00_workarea_txt_p1_startdate");
				return false;
			}
		}

		var OldModified = HasChanges;
		$('input,select', $('#mpage' + PageNo)).each(CheckReq);
		HasChanges = OldModified;

		$("#ctl00_workarea_h_cbo_p1_role").val($("#ctl00_workarea_cbo_p1_role option:selected").val());
		$("#ctl00_workarea_h_cbo_p1_replacerole").val($("#ctl00_workarea_cbo_p1_replacerole option:selected").val());
		SetSelectedLocation();
		$("#ctl00_workarea_txt_p1_patrol").val($("#ctl00_workarea_cbo_p1_troop option:selected").val());

		return vValid;
	}

	if (PageNo === 2) {
		$('input,select', $('#mpage' + PageNo)).each(CheckReq);
		if (vValid)
		{
			$(".VALBY").each(function () {
				if ($(this).val() && $(this).css("display") !== "none") {
					vValid = false;
					SetControlError(this,true);
				}
			});
		}
		return vValid;
	}

	if (PageNo === 3) {
		$('input,select', $('#mpage' + PageNo)).each(CheckReq);
		return vValid;
	}

	return true; 
}

function SetSelectedLocation() {
	if ($("#ctl00_workarea_cbo_p1_location_6 option:selected").val()) $("#ctl00_workarea_h_cbo_p1_orgno").val($("#ctl00_workarea_cbo_p1_location_6 option:selected").val());
	else if ($("#ctl00_workarea_cbo_p1_location_5 option:selected").val()) $("#ctl00_workarea_h_cbo_p1_orgno").val($("#ctl00_workarea_cbo_p1_location_5 option:selected").val());
	else if ($("#ctl00_workarea_cbo_p1_location_4 option:selected").val()) $("#ctl00_workarea_h_cbo_p1_orgno").val($("#ctl00_workarea_cbo_p1_location_4 option:selected").val());
	else if ($("#ctl00_workarea_cbo_p1_location_3 option:selected").val()) $("#ctl00_workarea_h_cbo_p1_orgno").val($("#ctl00_workarea_cbo_p1_location_3 option:selected").val());
	else if ($("#ctl00_workarea_cbo_p1_location_2 option:selected").val()) $("#ctl00_workarea_h_cbo_p1_orgno").val($("#ctl00_workarea_cbo_p1_location_2 option:selected").val());
	else if ($("#ctl00_workarea_cbo_p1_location_1 option:selected").val()) $("#ctl00_workarea_h_cbo_p1_orgno").val($("#ctl00_workarea_cbo_p1_location_1 option:selected").val());
	else if ($("#ctl00_workarea_cbo_p1_location_0 option:selected").val()) $("#ctl00_workarea_h_cbo_p1_orgno").val($("#ctl00_workarea_cbo_p1_location_0 option:selected").val());
	return $("#ctl00_workarea_h_cbo_p1_orgno").val();
}

function ChangePage(FromPageNo, ToPageNo) {
	if (ValidatePage(FromPageNo)) {
		MakePageVisible(ToPageNo);
	}
	return false;
}

function CheckReq() {
	if (!vIsReadonly) {
		if ($(this).hasClass("VALBY") || $(this).hasClass("VALON")) {

			if ($(".VALON", $(this).parent().parent()).val() || $(".VALBY", $(this).parent().parent()).val()) {
				$(".VALON, .VALBY", $(this).parent().parent()).attr("required", "required");
				$(".VALBY", $(this).parent().parent()).nextAll('span.rfv:first').css({ "display": !ShowRequired($(".VALBY", $(this).parent().parent())) ? "" : "none" });
				ShowRequired($(".VALON", $(this).parent().parent()));
			}
			else {
				$(".VALON, .VALBY", $(this).parent().parent()).removeAttr("required");
				SetControlError($(".VALBY", $(this).parent().parent()), false);
				SetControlError($(".VALON", $(this).parent().parent()), false);
				$(".VALON", $(this).parent().parent()).nextAll('span.rfv:first').css({ "visibility": "hidden" });
				$(".VALBY", $(this).parent().parent()).nextAll('span.rfv:first').css({ "visibility": "hidden", "display": "none" });
			}

			return;
		}

		ShowRequired(this);
	}
}

function ResetPage(PageNo) {
	if (PageNo === 1) {
		var OrigNo = "";
		var OrigName = "";

		// custom stuff for maintaining member number depending on the form type
		if ($("#ctl00_workarea_txt_p1_memberno").attr("readonly") === "readonly")
		{
			OrigNo = $("#ctl00_workarea_txt_p1_memberno").val();
			OrigName = $("#ctl00_workarea_txt_p1_membername").val();
		}

		$(".QuickSearchButton,#ctl00_workarea_txt_p1_memberno").not(".TRN").css({ "display": "" });
		$(".rfv", $("#ctl00_workarea_txt_p1_memberno").parent()).css({ "display": "" });       

		// core reset edit/cbo values
		$("#mpage1 input").not("[type='button']").each(function () { if ($(this).css("disabled") !== 'disabled') $(this).resetDB(); });
		$("#mpage1 select").each(function () { if ($(this).attr("disabled") !== "disabled") $(this).resetDB(); });

		// do contact roles
		if (pk_val("Page.RoleStatus") === "P" || pk_val("Page.RoleStatus") === "PP")
			GetContactRoles("ctl00_workarea_cbo_p1_replacerole", $("#ctl00_workarea_txt_p1_memberno").val(), true, "--- No Roles Available ---", true, true, function () { SetEnabled(); SetControlError("#ctl00_workarea_cbo_p1_role", false); }, "--- Select Role ---");
		$("#ctl00_workarea_cbo_p1_location_6, #ctl00_workarea_cbo_p1_location_5, #ctl00_workarea_cbo_p1_location_4,#ctl00_workarea_cbo_p1_location_3,#ctl00_workarea_cbo_p1_location_2,#ctl00_workarea_cbo_p1_location_1").not( "[disabled='disabled']" ).trigger("change");
		// do reset of required markers etc
		ResetRequired('#mpage1');

		$("#ctl00_workarea_tbl_p1_Variants .VariantsBN").each(function () { RemoveVariant(this); });

		try {
			if ($("#ctl00_workarea_txt_p1_memberno").val())
				PrePopulate();
			else {
				LoadVariants(true);                
			}
		} catch (e) { }
		
		// custom stuff for maintaining member number depending on the form type
		if (OrigNo) {
			$("#ctl00_workarea_txt_p1_memberno").val(OrigNo);
			$("#ctl00_workarea_txt_p1_membername").val(OrigName);
			$(".QuickSearchButton,#ctl00_workarea_txt_p1_memberno").not(".TRN").css({ "display": "none" });
			$(".rfv", $("#ctl00_workarea_txt_p1_memberno").parent()).css({ "display": "none" });
			$("#ctl00_workarea_txt_p1_membername").css({ "display": "block" });
			if (!pk_val("Page.NG_ID"))
				$("#ctl00_workarea_cbo_p1_level").trigger("change");
		}
		else {
			$.FocusControl("#ctl00_workarea_txt_p1_memberno");
			$("#ctl00_workarea_txt_p1_membername").css({ "display": "none" });
			$("#ctl00_workarea_cbo_p1_membershipgrade").val("").attr("disabled", "disabled");
			// only on insert
			if (!pk_val("Page.NG_ID"))
				$("#ctl00_workarea_cbo_p1_level").trigger("change");
			$("#ctl00_workarea_trTroop").css({ "display": "none", "visibility": "hidden" });
		}
		
		// ensure the Scottish Etc captions are ok.
		if ($("#ctl00_workarea_cbo_p1_location_1").val())
			$("#ctl00_workarea_h_txt_p1_countryorgno").val($("#ctl00_workarea_cbo_p1_location_1 option:selected").val());
		$("#ctl00_workarea_lbl_p1_location_3").text(GetCaptionName(3, false, false));
		$("#ctl00_workarea_txt_p1_alt_title").resetDB();
		$("#hdr_title_name").text("");
	}

	if (PageNo === 2) {
	    $("#ctl00_workarea_txt_p2_review, .VALON, .VALBY, #ctl00_workarea_txt_p2_CE_Date,#ctl00_workarea_txt_p2_cecheck,#ctl00_workarea_txt_p2_status").each(function () { $(this).resetDB(); });

		$(".VALBY_NAME").each(function ()
		{
			if ($(".VALBY", $(this).parent()).val() === "" && (pk_val("Page.RoleStatus") === "P" || pk_val("Page.RoleStatus") === "PP")) {
				$(this).css("display", "none");
				$(".VALBY, .QuickSearchButton", $(this).parent()).css("display", "");
				$(".VALON", $(this).parent().parent()).removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden" });
				$(".VALBY", $(this).parent().parent()).removeAttr("required").nextAll('span.rfv:first').css({ "visibility": "hidden", "display": "none" });
				SetControlError($(".VALON", $(this).parent().parent()));
				SetControlError($(".VALBY", $(this).parent().parent()));
			}
		});
		CallDisclosure(true);
		$("#mpage2 select").each(function () { $(this).resetDB(); });

	    // reset remove vetting (if applicable)
		$("#ctl00_workarea_bn_p2_CE_Remove").show();
		$("#ctl00_workarea_h_cbo_p2_VCR").val("");
		SetVettVis(true);

		ResetRequired('#mpage2');
		$.FocusControl("#ctl00_workarea_txt_p2_status", false, 10);        
	}
	
	if (PageNo === 3) {
		$("#mpage3 input").each(function () { $(this).resetDB(); });
		$("#ll_p3_MSG_Email").css("display", "none");
		$("#lnk_p3_Email").css("display", "");
		$("#ctl00_head_txt_EmailRequested").val("");        
		ResetRequired('#mpage3');
		$.FocusControl("#ctl00_workarea_txt_p3_R1_Name", false, 10);
	}

	return false;
}

//#endregion

//#region Page 1

function AutoGenerateTitle() {
	if (vLoading) return;
	var Title = "";

	if ($("#ctl00_workarea_cbo_p1_role option:selected").val()) {
		Title = $("#ctl00_workarea_cbo_p1_role option:selected").text();

		var Variants = "";
		$(".VariantsCBO").each(function () {
			if ($("option:selected", this).val()) {
				if (Variants === "")
					Variants = " - ";
				else
					Variants = Variants + ", ";
				Variants = Variants + $("option:selected", this).text();
			}
		});
		Title = Title + Variants;
	}

	if (Title.length > parseInt($("#ctl00_workarea_txt_p1_alt_title").attr("MaxLength"),10)) {
		$.system_confirm("The auto generated role name exceeds the max length of this field. <br/>Only Show Role Description?", function () {
			Title = $("#ctl00_workarea_cbo_p1_role option:selected").text();
			$("#ctl00_workarea_txt_p1_alt_title").val(Title);
		}, function () {
			Title = Title.substr(0, parseInt($("#ctl00_workarea_txt_p1_alt_title").attr("MaxLength"),10));
			$("#ctl00_workarea_txt_p1_alt_title").val(Title);
		});

		return;
	}
	$("#ctl00_workarea_txt_p1_alt_title").val(Title);
}

var ddStart;
var MinAgeDate;
var MaxAgeDate;
var DateFilterMSG = "";

function CheckAgeLimits(FromBlur) {
	var MinAge = $("#ctl00_workarea_cbo_p1_role option:selected").data("minage");
	var MaxAge = $("#ctl00_workarea_cbo_p1_role option:selected").data("maxage");

	// get min age start date
	if (MinAge) {
	    MinAgeDate = parseDate($("#ctl00_workarea_txt_p1_membername").data("DoB"));
	    MinAgeDate.setYear(MinAgeDate.getFullYear() + parseInt(MinAge, 10)); // remove (min age years)

	    // if there is a decimal portion
	    if (MinAge % 1 !== 0) MinAgeDate.setDate(MinAgeDate.getDate() + Math.round(365 * (MinAge % 1)));

	    MinAgeDate.setDate(MinAgeDate.getDate() - 1); // inc actual b'day
	}
	else MinAgeDate = undefined;

	// get max age start date
	if (MaxAge) {
		MaxAgeDate = parseDate($("#ctl00_workarea_txt_p1_membername").data("DoB"));
		MaxAgeDate.setYear(MaxAgeDate.getFullYear() + parseInt(MaxAge,10)); // remove (min age years)

		// if there is a decimal portion
		if (MaxAge % 1 !== 0) MaxAgeDate.setDate(MaxAgeDate.getDate() + Math.round(365 * (MaxAge % 1)));
	}
	else MaxAgeDate = undefined;

	if (MinAge && !MaxAge) // min date only
	{
		var msgDate1 = new Date(MinAgeDate);
		msgDate1.setDate(msgDate1.getDate() + 1);// need to remove day for message
		DateFilterMSG = "The minimum age limit for this role is " + parseInt(MinAge,10).toString() + ". The earliest possible start date for this member is " + formatDate(msgDate1, DisplayDateFormat) + ".";
	}
	else if (MinAge && MaxAge) // min + max date
	{
	    var msgDate = new Date(MinAgeDate);
	    var msgMaxDate1 = new Date(MaxAgeDate);
		msgDate.setDate(msgDate.getDate() + 1);// need to add day for message
		msgMaxDate1.setDate(msgMaxDate1.getDate() - 1);// need to minus day for message
	    //TSA-477: They want a clearer message when a role has min/max age and the start date makes the member too old.
	    //         Will implement t his by reinstating the original message that they asked us to change at some point.
        //         Leaving the original comments in place to highlight this point.
	    ////DateFilterMSG = "The age limit for this role is " + MinAge + " to " + MaxAge + ". The earliest possible start date for this member is " + formatDate(msgDate, DisplayDateFormat) + "<br/>and the latest is " + formatDate(MaxAgeDate, DisplayDateFormat) + ".";
	    //// AL didnt want the end date bit of the message
		//DateFilterMSG = "The minimum age limit for this role is " + parseInt(MinAge, 10).toString() + ". The earliest possible start date for this member is " + formatDate(msgDate, DisplayDateFormat) + ".";
		DateFilterMSG = "The age limit for this role is " + MinAge + " to " + MaxAge + ". The earliest possible start date for this member is " + formatDate(msgDate, DisplayDateFormat) + "<br/>and the latest is " + formatDate(msgMaxDate1, DisplayDateFormat) + ".";
    }
	else if (!MinAge && MaxAge) // max date only (should never happen as min is a required field)
	{
	    var msgMaxDate2 = new Date(MaxAgeDate);
	    msgMaxDate2.setDate(msgMaxDate2.getDate() - 1);// need to minus day for message
	    DateFilterMSG = "The maximum age limit for this role is " + parseInt(MaxAge, 10).toString() + ". The latest possible start date for this member is " + formatDate(msgMaxDate2, DisplayDateFormat) + ".";
	}
	else // no max or min date (should never happen)
	    DateFilterMSG = "";

	if ($("#ctl00_workarea_txt_p1_startdate").val() && !FromBlur)
		$("#ctl00_workarea_txt_p1_startdate").trigger("blur");

	return true;
}

function AddStartDateFilter() {
	calPopup.clearDisabledDates();

	ddStart = undefined;
	MinAgeDate = undefined;

	if ($("#ctl00_workarea_cbo_p1_role option:selected").data("startdate")) {
		ddStart = parseDate($("#ctl00_workarea_cbo_p1_role option:selected").data("startdate"));
		ddStart.setDate(ddStart.getDate() - 1);
	}

	if ($("#ctl00_workarea_txt_p1_membername").data("DoB")) CheckAgeLimits(true);
	
	var useStartDateFilter = false;
	if (ddStart && ddStart > MinAgeDate) {
		calPopup.addDisabledDates(null, formatDate(ddStart, DisplayDateFormat));
		ddStart.setDate(ddStart.getDate() + 1);// add day for year check bit (if date is 01 01, then the filter = 31/12, so year includes prev year)
		calPopup.setYearSelectStart(ddStart.getFullYear());
		useStartDateFilter = true;
	}
	else if (MinAgeDate) {
		calPopup.addDisabledDates(null, formatDate(MinAgeDate, DisplayDateFormat));
		if (MinAgeDate > new Date())
			calPopup.setYearSelectStart(MinAgeDate.getFullYear());        
	}

	if (MaxAgeDate) {
		calPopup.addDisabledDates(formatDate(MaxAgeDate, DisplayDateFormat), null);
		calPopup.setYearStartEnd(useStartDateFilter ? ddStart.getFullYear() : (MinAgeDate ? MinAgeDate.getFullYear() : undefined), MaxAgeDate.getFullYear());
	}
}

function PopupStartDateSelect(thisControl, FromDate_Ctrl) {
	calPopup_ctrl = FromDate_Ctrl;
	calPopup.clearDisabledDates();
	AddStartDateFilter();
	if ($("#" + FromDate_Ctrl).val() === "" && MinAgeDate > Date.now()) {
		var msgDate = new Date(MinAgeDate);
		msgDate.setDate(msgDate.getDate() + 1);// need to add day for actual date
		$("#" + FromDate_Ctrl).val(formatDate(msgDate, DisplayDateFormat));
	}
	calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
	return false;
}

function StartDateBlur(self) {
	AddStartDateFilter();

	var vEditDate = new Date($(self).val());
	if (ddStart && ddStart > vEditDate)
		Date_TextBox_Blur(self, 'The role has not started yet on this date.');
	else if (MinAgeDate || MaxAgeDate) 
		//Date_TextBox_Blur(self, 'The start date for the role cannot be before the members 5¾ birth date.');
		Date_TextBox_Blur(self, DateFilterMSG);    
	else
		Date_TextBox_Blur(self);
}

function AddPriorDateFilter() {
	calPopup.clearDisabledDates();
	
	var dd = new Date();
	dd.setDate(dd.getDate()); 
	calPopup.addDisabledDates(formatDate(dd, DisplayDateFormat), null);
	calPopup.setYearStartEnd(null, dd.getFullYear());
}

function PopupPriorDateSelect(thisControl, FromDate_Ctrl) {
	calPopup_ctrl = FromDate_Ctrl;
	calPopup.clearDisabledDates();
	AddPriorDateFilter();
	calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
	return false;
}

/*function PopulateContactMemberGrades() {
	if ($("#ctl00_workarea_cbo_p1_role").val() == "")
	{
		$("#ctl00_workarea_cbo_p1_membershipgrade").val("");
		$("#ctl00_workarea_cbo_p1_membershipgrade").attr("disabled", "disabled");
	}
	else
	$.ajax({
		url: WebServicePath() + "GetContactPossibleGrades?pLookupContactNumber=" + $("#ctl00_workarea_txt_p1_memberno").val() + "&pRoleNumber=" + $("#ctl00_workarea_cbo_p1_role").val(), success: function (result) {
			var options = [];
			options.push('<option value="">', "", '</option>');
			if (result.d !== null && result.d !== undefined)
				for (var i = 0; i < result.d.length; i++) 
					options.push('<option value="', result.d[i].Value, '" CanSelect="' + result.d[i].Tag + '">', result.d[i].Description, '</option>');
			$("#ctl00_workarea_cbo_p1_membershipgrade").html(options.join('')).val("").removeAttr("disabled");
			$('#ctl00_workarea_cbo_p1_membershipgrade option:eq(0)').prop('selected', true);
		}, error: ServiceFailed
	});
}*/

function CN_Populate(CN, Name, DoB, Age, Status) {
	HasChanges = true;

	if (!CN) {
		$("#ctl00_workarea_txt_p1_membername, #ctl00_workarea_txt_p1_memberno").val("");
		$.system_alert("This member number does not exist or the member is outside your hierarchy, Please use Adult or Youth Joining instead.", "#ctl00_workarea_txt_p1_memberno");
		$("#ctl00_workarea_trTroop").css({ "display": "none", "visibility": "hidden" });
		return;
	}

	if (Status !== "A" && Age < 18) {        
		$.system_alert("This youths membership status is not active, please use youth joining instead.", "#ctl00_workarea_txt_p1_memberno");
		return;
	}

	$("#ctl00_workarea_txt_p1_memberno").val(CN);
	$(".rfv", $("#ctl00_workarea_txt_p1_memberno").parent()).css({ "display": "none" });
	$("#ctl00_workarea_txt_p1_membername").val(Name).data("DoB", DoB);

	$(".QuickSearchButton,#ctl00_workarea_txt_p1_memberno").not(".TRN").css({ "display": "none" });
	$("#ctl00_workarea_txt_p1_membername").css({ "display": "block" });

	$("#hdr_title_name").text(Name);

	GetContactRoles("ctl00_workarea_cbo_p1_replacerole", CN, true, "--- No Roles Available ---", true, true, function () { SetEnabled(); SetControlError("#ctl00_workarea_cbo_p1_role", false); }, "--- Select Role ---");
	$("#ctl00_workarea_cbo_p1_level").trigger("change");

	if (Age < 18) $("#ctl00_workarea_trTroop").css({ "display": "", "visibility": "visible" });
	else $("#ctl00_workarea_trTroop").css({ "display": "none", "visibility": "hidden" });
}

function SearchButtonClick(Lookup) {
	DoMemberSearch(Lookup); 
}

function DoMemberSearch(Lookup) {
	if ($("#ctl00_workarea_txt_p1_memberno").css("display") === "none")
		return;

	if (Lookup === "Y") {
		HintPopup.visible = true;
		$.member_search("ASMR",
			function (CN, Name, DoB, Age, Status) { CN_Populate(CN, Name, DoB, Age, Status); },
			"Find A Member",
			pk_val("Master.User.ON"),
			pk_val("Master.User.CN")
		);
		return;
	}

	if ($("#ctl00_workarea_txt_p1_memberno").val() && parseInt(pk_val("Master.User.CN"), 10) === parseInt($("#ctl00_workarea_txt_p1_memberno").val(), 10)) {
		CN_Populate("");
		$.system_alert("You cannot assign a role to yourself.", "#ctl00_workarea_txt_p1_memberno");
	}
	else if ($("#ctl00_workarea_txt_p1_memberno").val() === "")
	{}//CN_Populate("");
	else
		$.validate_member("ASMR",
			CN_Populate,
			function () { CN_Populate(""); $.system_alert("This member number does not exist or the member is outside your hierarchy, Please use Adult or Youth Joining instead.", "#ctl00_workarea_txt_p1_memberno"); },
			$("#ctl00_workarea_txt_p1_memberno").val(),
			pk_val("Master.User.ON"),
			pk_val("Master.User.CN")
		);    
}

function ClearVariants() {
	var options = [];
	options.push('<option value="">', "--- No Variant Types Available ---", '</option>');
	$("#ctl00_workarea_VariantsCBO").html(options.join(''));
	$(".VariantsCBO").attr("disabled", "disabled");
	$('#ctl00_workarea_VariantsCBO option:eq(0)').prop('selected', true);
	$("#ctl00_workarea_tbl_p1_Variants .VariantsBN").each(function () { RemoveVariant(this); });
}

function LoadVariants(DoClear) {
	if (vLoading) return;
	//$(".VariantsTD").css({ "border": "none", "border-width": "none" });
	if (DoClear || !$("#ctl00_workarea_cbo_p1_role option:selected").attr("value")) { ClearVariants(); }

	if ($("#ctl00_workarea_cbo_p1_role option:selected").attr("value") && !DoClear) {
	    var f_populate = function (result) {
	        if (!pk_val("Master.Sys.REST") && result) result = result.d;
	        if (result && !pk_val("Master.Sys.REST")) result = $.parseJSON(result); // REST comes as object, JSON comes as JSON

	        PopulateCBO("#ctl00_workarea_VariantsCBO", result, true, "--- No Variant Types Available ---", true, "", "--- Select Role Variant ---");
	        if ($("#ctl00_workarea_VariantsCBO").attr("disabled") !== "disabled") {
	            $(".VariantsCBO").removeAttr("disabled");
	        }
	        else $(".VariantsCBO").attr("disabled", "disabled");
	        
	        $("#ctl00_workarea_tbl_p1_Variants .VariantsBN").each(function () { RemoveVariant(this); });
	    };

	    if (pk_val("Master.Sys.REST")) {
	        var vData = {};
	        vData["RoleNumber"] = $("#ctl00_workarea_cbo_p1_role option:selected").attr("value").split('#')[0];
	        PostToHandler(vData, "/role/variants", f_populate, ServiceFailed, false, true);
	    } else {
	        $.ajax({ url: WebServicePath() + "GetRoleVariants?pRN=" + $("#ctl00_workarea_cbo_p1_role option:selected").attr("value").split('#')[0], success: f_populate, error: ServiceFailed });
	    }
	}
}

function VariantsChange(self) {
	var vLocalValid = true;
	$("#ctl00_workarea_tbl_p1_Variants tr").not(':last').each(function () {
		if ($(":selected", this).val() === $(self).val() && $(":selected", this).parent().parent().parent().index() !== $(self).parent().parent().index()) {
			$.system_alert('This variant has already been set up.', $(self));
			if ($(".VariantsCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
			else { $(self).val($(self).data("orig")); }
			vLocalValid = false;
			return;
		}
	});

	if (!vLocalValid) return;

	var CurValue = $(self).val();
	var CurOrig = $(self).data("orig");
	if (CurValue) {
		$(".VariantsCBO option[value='']", $(self).parent()).remove();
		$(self).data("orig", CurValue);
	}

	if ($('.VariantsCBO').last().val()) {
		AddVariant();
	}
	AutoGenerateTitle();
}

function AddVariant() {
	//$(".VariantsTD").css({ "border": "solid", "border-width": "thin" });
	var HTML = $("#ctl00_workarea_tbl_p1_Variants tr").first().html();
	// ensure buttons on new line are not visible
	$(".VariantsBN").css({ "visibility": "visible" });
	$("#ctl00_workarea_tbl_p1_Variants").append("<tr>" + HTML + "</tr>");
	$('.VariantsCBO').last().data("orig","").data("ng_id","");
	$(".VariantsBN").last().css({ "visibility": "hidden" });
	PopulateVariantCBO($('.VariantsCBO').last());
	$(".VariantsCBO").last().change(function () { VariantsChange(this); });
	$(".VariantsBN").last().click(function () { RemoveVariant(this, false); });
}

function AddVariant_Data(NG_ID, value) {
	var vItem = $("#ctl00_workarea_tbl_p1_Variants tr").length - 1;
	AddVariant();
	$('.VariantsCBO', $("#ctl00_workarea_tbl_p1_Variants tr:eq(" + vItem + ")")).data("ng_id", NG_ID).val(value);   
}

function RemoveVariant(self) {
	if ($("#ctl00_workarea_tbl_p1_Variants tr").length === 1) {
		$(".VariantsCBO", $(self).parent().parent()).val("");
		PopulateVariantCBO($('.VariantsCBO').last());
	}
	else
		$(self).parent().parent().remove();
	$(".VariantsBN").last().css({ "visibility": "hidden" });
	AutoGenerateTitle();
}

function PopulateVariantCBO(self) {
	$(self).html($("#ctl00_workarea_VariantsCBO").html());
	SetEnabled();
}

//#endregion

//#region page 2

function PopupReviewSelect(thisControl, FromDate_Ctrl) {
	calPopup_ctrl = FromDate_Ctrl;
	calPopup.clearDisabledDates();
	AddReviewDateFilter();
	calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
	return false;
}

function AddReviewDateFilter() {
	calPopup.clearDisabledDates();

	var dd1 = new Date($("#ctl00_workarea_txt_p1_startdate").val());
	var dd2 = new Date();
	var dd = new Date();

	// set min 
	if (dd1 > dd2)
		calPopup.addDisabledDates(null, formatDate(dd1, DisplayDateFormat));
	else
		calPopup.addDisabledDates(null, formatDate(dd2, DisplayDateFormat));

	// set max
	dd1.setYear(dd1.getFullYear() + 5); // add 5 years
	dd2.setYear(dd2.getFullYear() + 5); // add 5 years

	if (dd1 > dd2) {
		calPopup.addDisabledDates(formatDate(dd1, DisplayDateFormat), null);
		calPopup.setYearStartEnd(dd.getFullYear(), dd1.getFullYear());
	}
	else {
		calPopup.addDisabledDates(formatDate(dd2, DisplayDateFormat), null);
		calPopup.setYearStartEnd(dd.getFullYear(), dd2.getFullYear());
	}
}

function VB_SearchButton(ctrl, bn, lbl) {
	$.member_search("ANR_TRVB",
		function (CN, Name) { VB_Populate(CN, Name, ctrl, bn, lbl); },
		"Find A Training Validator",
		pk_val("Master.User.ON"),
		$("#ctl00_workarea_txt_p1_memberno").val());    
	return false;
}

function VB_Populate(CN, Name, ctrl, bn, lbl) {    
	$("#" + ctrl).val(CN).trigger("change");
	if (CN) {
		$("#" + bn + ",#" + ctrl).css({ "display": "none" });
		$("#" + lbl).css({ "display": "block" }).val(Name);
		$("#" + ctrl.replace("ValBy_", "ValOn_")).removeAttr("readonly").val(formatDate(new Date(), DisplayDateFormat));
		$("#" + bn.replace("ValByBN_", "ValOnBN_")).removeAttr("style");
		SetEnabled();
	}
}

function CheckVBno(ctrl, bn, lbl) {
	if ($("#" + ctrl).val() === $("#ctl00_workarea_txt_p1_memberno").val()) {
		$.system_alert("A member cannot validate their own training.");
		VB_Populate("", "", ctrl, bn, lbl);
	}
	else if ($("#"+ctrl).val() === "")
		VB_Populate("", "", ctrl, bn, lbl);
	else 
		$.validate_member("ANR_TRVB",
			function (CN, Name) { VB_Populate(CN, Name, ctrl, bn, lbl);  },
			function () { VB_Populate("", "", ctrl, bn, lbl); $.system_alert("Not a valid Training Validator number."); },
			$("#"+ctrl).val(),
			pk_val("Master.User.ON"),
			$("#ctl00_workarea_txt_p1_memberno").val());
}

var RefereeOptions = "";
function LoadApproval() {
	$("#ctl00_workarea_txt_p2_review").val(""); // blank review date on new role selected

	if (!RefereeOptions) RefereeOptions = $("#ctl00_workarea_cbo_p2_referee_status").html();
	if (!$("#ctl00_workarea_cbo_p1_role").val()) {
		$("#bn_p1_next,#LBTN2,#LBTN3,#bn_p2_next").css("display", "none");
	}
	else {
	    var f_populate = function (result) {
	        if (!pk_val("Master.Sys.REST") && result) result = result.d; // REST vs JSON result   
	        // clear items
	        $("#ctl00_workarea_cbo_p2_linemaneger options").each(function () { $(this).remove(); });
	        //$("#ctl00_workarea_txt_p2_review").val(""); - maybe just dont save it at the end but leave
	        $(".trProp").each(function () { $(this).remove(); });
	        $(".trTrain").each(function () { $(this).remove(); });
	        $("#ctl00_workarea_tr_p2_Approval_cecheck,#ctl00_workarea_tr_p2_Approval_disclosure,#ctl00_workarea_tr_p2_Approval_referee").css("display", "none");
	        $("#ctl00_workarea_cbo_p2_referee_status option:eq(0)").css("display", "");
	        $("#ctl00_workarea_cbo_p2_referee_status option:eq(1)").css("display", "");
	        $("#ctl00_workarea_cbo_p2_referee_status").html(RefereeOptions);
	        $("#LBTN3,#bn_p2_next").css("display", "none");
	        $("#ctl00_workarea_tr_p2_Approval_header").css("display", "");

	        if (result === null || result.HasApproval !== "True") {
	            $("#bn_p1_next,#LBTN2,#LBTN3,#bn_p2_next").css("display", "none");
	            // now clear all approval items
	            // remember to clear referee data too (just in case) - maybe just dont save it at the end but leave
	        }
	        else {
	            $("#LBTN2,#bn_p1_next").css("display", "");
	            $("#LBTN3,#bn_p2_next").css("display", "none");
	            var TitleDone = false;
	            var HasApproval = false;
	            var TitleHint = "Approval Item Status";
	            // now set all approval items
	            if (result.Properties && result.Properties.length > 0) {
	                for (pi = 0; pi < result.Properties.length; pi += 1) {
	                    if (result.Properties[pi].Activity === pk_val("Const.REFEREE")) {
	                        HasApproval = true;
	                        if (result.Properties[pi].Required === "Y") {
	                            $("#ctl00_workarea_cbo_p2_referee_status option:eq(1)").remove();
	                            if (result.Properties[pi].Pre_Populate_Status === "NR") result.Properties[pi].Pre_Populate_Status = "NC";
	                        }

	                        $("#ctl00_workarea_tr_p2_Approval_referee").css("display", "");
	                        $("#ctl00_workarea_cbo_p2_referee_status").val(result.Properties[pi].Pre_Populate_Status).data("db", result.Properties[pi].Pre_Populate_Status).attr("title", result.Properties[pi].SetBy);

	                        // if no enabler, disable cbo
	                        if (result.Properties[pi].Enabler && pk_val("Page.RoleEnablers").indexOf(result.Properties[pi].Enabler + ":") < 0) {
	                            $("#ctl00_workarea_cbo_p2_referee_status").last().attr("disabled", "disabled");
	                            $("#bnRef").hide();
	                        }
	                        else {
	                            $("#LBTN3").css("display", "block");
	                            $("#bnRef").show();
	                        }
	                        continue;
	                    }

	                    if (result.Properties[pi].Activity === pk_val("Const.CE")) {
	                        HasApproval = true;
	                        $("#ctl00_workarea_tr_p2_Approval_cecheck").css("display", "");
	                        if (result.Properties[pi].Pre_Populate_Status_Desc)
	                            $("#ctl00_workarea_txt_p2_cecheck").val(result.Properties[pi].Pre_Populate_Status_Desc.replace("Property : ", "")).data("db", $("#ctl00_workarea_txt_p2_cecheck").val());
	                        else
	                            $("#ctl00_workarea_txt_p2_cecheck").val("").data("db", "");

	                        continue;
	                    }

	                    if (result.Properties[pi].Activity === pk_val("Const.DISC1") || result.Properties[pi].Activity === pk_val("Const.DISC2")) {
	                        HasApproval = true;
	                        $("#ctl00_workarea_tr_p2_Approval_disclosure").css("display", "");
	                        $("#ctl00_head_txt_p2_disclosurevalue").val(result.Properties[pi].Pre_Populate_Status);
	                        $("#ctl00_workarea_txt_p2_disclosure").val(result.Properties[pi].Pre_Populate_Status_Desc).data("app_code", result.Properties[pi].Activity);
	                        $("#ctl00_workarea_ll_p2_disclosureLabel").text(result.Properties[pi].Description.replace("Property : ", ""));
	                        continue;
	                    }

	                    if (result.Properties[pi].Property_type === "2") {
	                        if (!TitleDone) {
	                            $("#tbl_p2_Approval").append("<tr class='trProp'><td colspan='3'><br/><h3><b>Appointment</b></h3></td></tr>");
	                            TitleDone = true;
	                            TitleHint = "Appointment Item Status";
	                        }
	                    }
	                    else HasApproval = true;

	                    $("#tbl_p2_Approval").append(meta_val('PropTMPL').format(
                            result.Properties[pi].Description.replace("Property : ", ""),
                            result.Properties[pi].Required === "Y" ? meta_val("ReqTMPL") : meta_val("NReqTMPL"),
                            " data-app_code='" + result.Properties[pi].Activity + "' ",
                            " data-db='" + result.Properties[pi].Pre_Populate_Status + "' ",
                            TitleHint + "\r\n" + result.Properties[pi].SetBy));

	                    $(".App_Select").last().val(result.Properties[pi].Pre_Populate_Status);

	                    // if no enabler, disable cbo
	                    if (result.Properties[pi].Enabler && pk_val("Page.RoleEnablers").indexOf(result.Properties[pi].Enabler + ":") < 0)
	                        $(".App_Select").last().attr("disabled", "disabled");
	                }
	            }

	            if (!HasApproval) $("#ctl00_workarea_tr_p2_Approval_header").css("display", "none");

	            // add training items
	            if (result.Training && result.Training.length > 0) {
	                $("#tbl_p2_Approval").append("<tr class='trTrain'><td colspan='3'><br/><h3><b>Getting Started Modules</b></h3></td></tr><tr class='trTrain'><td class=''> </td><td class='msHeadTDCB'><h3 class='tdh2'>Validated By</h3></td><td class='msHeadTDCB'><h3 class='tdh2'>Validated On</h3></td></tr>");
	                for (ti = 0; ti < result.Training.length; ti += 1) {
	                    var UseDate = result.Training[ti].Validated_On === "" ? "" : formatDate(new Date(result.Training[ti].Validated_On), DisplayDateFormat);
	                    $("#tbl_p2_Approval").append(meta_val('TrainTMPL').replaceAll('¬', '"').format(
                            result.Training[ti].Description, // 0
                            result.Training[ti].RTR_number, // 1
                            result.Training[ti].Validated_By ? "display:none;" : "",  // 2
                            "TRAIN_" + result.Training[ti].TM_number, // 3
                            result.Training[ti].MTM_number, // 4
                            result.Training[ti].Module, // 5
                            result.Training[ti].Validated_By,  // 6
                            UseDate, //7
                            result.Training[ti].Validated_On ? "readonly='readonly' data-db='" + UseDate + "' " : "",// 8
                            result.Training[ti].Validated_On || !pk_val("CRUD.TAV") ? "" : meta_val("ReqSpanTMPL") + "<input type='button' class='DateLookupButton' title='Select Date' value='&#160;'/>",// 9
                            result.Training[ti].Validated_On ? "" : meta_val("ReqSpanTMPL"),// 10
                            result.Training[ti].Validated_By === "" ? "display:none;" : "",// 11
                            result.Training[ti].Validated_By_Name === "" ? "" : result.Training[ti].Validated_By_Name, // 12
                            result.Training[ti].Validated_By ? "data-db='" + result.Training[ti].Validated_By + "' " : "", // 13
                            result.Training[ti].Validated_By_Name ? "data-db='" + result.Training[ti].Validated_By_Name + "' " : "" // 14
                        ));                            

	                    $("input", $("#TRAIN_" + result.Training[ti].TM_number).parent().parent()).change(CheckReq).trigger("change");
	                }

	                $("#tbl_p2_Approval tr:not(.tr_p2_Review)").each(function () { SetTrainingEvents(this); });

	                $(".VALON, .VALBY").each(function () { $(this).nextAll('span.rfv:first').css({ "visibility": "hidden" }); }).AttrToData("ng_id").AttrToData("rtrn_id").AttrToData("ng_value");
	                $(".VALBY").each(function () { $(this).nextAll('span.rfv:first').css({ "display": "none" }); });
	                //$("input", $("#TRAIN_" + result.Training[ti].TM_number).parent().parent()).change(CheckReq).trigger("change");

	                SetEnabled();
	            }

	            $.AttrToData("DB"); // pish DB from attribute to DOM Data 
	        }
	        // add line managers to drop down                                    
	        var options = [];
	        if (result && result.LineManagers && result.LineManagers.length > 0) {
	            options.push('<option value="">', "--- Select Line Manager ---", '</option>');
	            $("#bn_p1_next,#LBTN2").css("display", "");
	            if (result.HasApproval !== "True")
	                $("#ctl00_workarea_tr_p2_Approval_header").css("display", "none");

	            var AutoSelect = ""; // auto select only same level or above (NOTE sections have same seq no as parent level)

	            for (li = 0; li < result.LineManagers.length; li += 1) {
	                options.push('<option value="', result.LineManagers[li].LookupValue, '">', result.LineManagers[li].Details, '</option>');

	                if (AutoSelect === "") {
	                    var Level = parseInt($("#ctl00_workarea_cbo_p1_level").data("level"), 10);

	                    if ($("#ctl00_workarea_cbo_p1_location_6").val() && result.LineManagers[li].NG_ID === (Level + 1).toString())
	                        AutoSelect = result.LineManagers[li].LookupValue;
	                    else if ($("#ctl00_workarea_cbo_p1_location_6").val() === "" && (result.LineManagers[li].NG_ID === (Level + 1).toString() || result.LineManagers[li].NG_ID === Level.toString()))
	                        AutoSelect = result.LineManagers[li].LookupValue;
	                }
	            }

	            $("#ctl00_workarea_cbo_p2_linemaneger").html(options.join(''));
	            $('#ctl00_workarea_cbo_p2_linemaneger option:eq(0)').prop('selected', true);
	            $("#ctl00_workarea_cbo_p2_linemaneger").removeAttr("disabled");

	            if (AutoSelect) $("#ctl00_workarea_cbo_p2_linemaneger").val(AutoSelect);
	            else $("#ctl00_workarea_cbo_p2_linemaneger").val("");
	        }
	        else {
	            options.push('<option value="">', '--- No Line Managers Available ---', '</option>');
	            $("#ctl00_workarea_cbo_p2_linemaneger").html(options.join(''));
	            $('#ctl00_workarea_cbo_p2_linemaneger option:eq(0)').prop('selected', true);
	            $("#ctl00_workarea_cbo_p2_linemaneger").attr("disabled", "disabled");
	        }
			   
	        SetTrainingEnabled();
	    };

	    if (pk_val("Master.Sys.REST")) {
	        var vData = {};
	        vData["ContactNumber"] = $("#ctl00_workarea_txt_p1_memberno").val();
	        vData["OrganisationNumber"] = SetSelectedLocation();
	        vData["RoleNumber"] = $("#ctl00_workarea_cbo_p1_role option:selected").attr("value").split("#")[0]; // NOTE: (data = 123#-1) JSON version auto trimmed all text after # (BUG that went in our favour)
	        PostToHandler(vData, "/role/approval", f_populate, ServiceFailed, false, true);
	    } else {
	        $.ajax({ url: WebServicePath() + "GetRoleApproval?pLookupContactNumber=" + $("#ctl00_workarea_txt_p1_memberno").val() + "&pLocationON=" + SetSelectedLocation() + "&pRoleNumber=" + $("#ctl00_workarea_cbo_p1_role option:selected").attr("value"), success: f_populate, error: ServiceFailed });
	    }
	}
}

function CallDisclosure(isReset) {
	if (isReset) {
		$("#ctl00_workarea_bn_p2_Disc").css("display", "");
		$("#ll_p2_Disc").css("display", "none");
		$("#ctl00_workarea_h_p2_reqDisc").val("");
	}
	else {
		$("#ctl00_workarea_bn_p2_Disc").css("display", "none");
		$("#ll_p2_Disc").css("display", "block");
		$("#ctl00_workarea_h_p2_reqDisc").val("Y");
	}
}

function SetTrainingEvents(self) {
	// dont setup events if dont have Role property
	if (!pk_val("CRUD.TAV") || !(pk_val("Page.RoleStatus") === "P" || pk_val("Page.RoleStatus") === "PP"))
		return;

	$(".VALBY", self).blur(function () {
		var id = $(this).attr("id").replace("ValBy_", "");
		CheckVBno("ValBy_" + id, "ValByBN_" + id, "ValByName_" + id);
	}).keypress(function (e) {
		var id = $(this).attr("id").replace("ValBy_", "");
		return NumberOnly_KeyPress(e || event, function (e) { $("#ValBy_" + id).trigger("blur"); });
	});

	$(".TRN", self).click(function () {
		var id = $(this).attr("id").replace("ValByBN_", "");
		VB_SearchButton("ValBy_" + id, "ValByBN_" + id, "ValByName_" + id);
	});

	$(".VALON", self).blur(function () {
		AddPriorDateOnlyFilter();
		Date_TextBox_Blur(this, "Only dates of today or in the past are allowed.");
	});

	$(".DateLookupButton", self).not("#bn_p2_CE_Date").click(function () {
	    var id = $(".VALON", $(this).parent()).attr("id");
		PopupPriorDateOnlySelect(this, id);
	});
}

//#endregion

//#region page 3

function SendEmailRequest() {
	$("#ll_p3_MSG_Email").css("display", "block");
	$("#lnk_p3_Email").css("display", "none");
	$("#ctl00_head_txt_EmailRequested").val("Y");
	return false;
}

function ViewEmailRequest() {
    //TSA-1586: Ensure line breaks are formatted correctly depending on the template type (plain text or html)
    var vText = meta_val('EMAIL_Text');
    if (meta_val('EMAIL_IsHTML') == "Y") {
        vText = vText.replaceAll("&lt;br/&gt;", "<br />").replaceAll("&lt;br /&gt;", "<br />");
    }
    else
    {
        vText = vText.replaceAll("\n", "<br />");
    }
    vText = "<i>Email Subject</i> : <br /><b>" + meta_val('EMAIL_Subject') + "</b><br />" + "<br /><i>Email Body</i> : <br />" + vText + "<br /><br />";
	$.system_hint(vText, "<h2>Email Preview</h2>");
	return false;
}

//#endregion


