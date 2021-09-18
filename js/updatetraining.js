$(document).ready(FormReady);
$.ajaxSetup({ cache: false });
var vLoadingVC = false;
var vLoading = true;

function FormReady() {    
    SetUpPage(pk_val("Page.IsReadonly"), !pk_val("Page.MTMN"));

    $("input,select").change(CheckReq);

    try {
        AssignLMEvents();
        AssignVCEvents();
        $('.LM_DPL_TXT, .LMPL_D, .LM_DAC_TXT, .LMAC_D, .LM_Remove, .VC_DPL_TXT, .VCPL_D, .VC_DAC_TXT, .VCAC_D, .VC_Remove').css("display", "none");
        PopulateLMCBO(1);
        PopulateVCCBO(1);
        PopulateData();
    }
    catch (e) { }

    // inert mode, attach change event
    if (vInsertMode) {
        $(".VMTRHDR").css("display", "none");
        $("#ctl00_workarea_cbo_p1_modules").change(function () {
            $(".LM_Remove").not(":last").each(function () { RemoveLM(this); });
            $(".VC_Remove").not(":last").each(function () { RemoveVC(this); });
            $('.LM_DPL_TXT, .LMPL_D, .LM_DAC_TXT, .LMAC_D, .LM_Remove, .VC_DPL_TXT, .VCPL_D, .VC_DAC_TXT, .VCAC_D, .VC_Remove').css("display", "none");            
            $('select[id$="ctl00_workarea_cb_p1_learningreq"]').trigger("change");
            $(".VMTR").remove();
            $(".VMTRHDR").css("display", "none");

            var f_success = function (result) {
                if (!pk_val("Master.Sys.REST") && result) result = result.d;
                if (result !== null && result.length > 0) {
                    $.system_alert("This training module is already setup against this PLP for this role.", "#ctl00_workarea_cbo_p1_modules");
                    $("#ctl00_workarea_cbo_p1_modules").val("");
                }
                else PopulateModuleData($("option:selected", $("#ctl00_workarea_cbo_p1_modules")).val());      
            }

            if (pk_val("Master.Sys.REST")) {
                var vData = {};
                vData["ContactNumber"] = pk_val("Page.UseCN");
                vData["TrainingModuleNumber"] = $("option:selected", this).val();
                vData["MemberRoleNumber"] = pk_val("Page.MRN");
                vData["YA"] = pk_val("Page.YA");
                PostToHandler(vData, "/role/plp/membermodules", f_success, ServiceFailed, false, true);
            } else {
                // call
                $.ajax({
                    url: WebServicePath() + "GetMemberTrainingModules?pUseContactNumber=" + pk_val("Page.UseCN") + "&pTMN=" + $("option:selected", this).val() + "&pPLP_MRN=" + pk_val("Page.MRN") + "&pYA=" + pk_val("Page.YA"),
                    async: false, success: f_success, error: ServiceFailed
                });
            }
        });
    }
    else if (!vIsReadonly) // ensure all Mand VC are on screen
        AddMandatoryVC(true);

    if ($("#ctl00_workarea_txt_p1_VBno").val()) {
        $("#ctl00_workarea_txt_p1_VBname").show();
        if (!pk_val("Page.CanUpdateValidated")) {
            vIsReadonly = true;
            $("#ctl00_workarea_txt_p1_VBno,#bn_p1_VBname").css({ "display": "none" });
        }
    }
    else {
        $("#ctl00_workarea_txt_p1_VBno").show();
    }
    $("#ctl00_workarea_txt_p1_VBno").nextAll('span.rfv:first').css({ "visibility": "hidden", "display":"none" });
    $("#ctl00_workarea_txt_p1_validateddate").nextAll('span.rfv:first').css({ "visibility": "hidden" });

    if (!vIsReadonly) {
        $("#ctl00_workarea_txt_p1_TAname,#ctl00_workarea_txt_p1_VBname").css({ "width": "300px" }).show();
        $("#ctl00_workarea_txt_p1_VBno,#bn_p1_VBname").show();
    }
    else {
        $("#ctl00_workarea_txt_p1_TAname,#ctl00_workarea_txt_p1_VBname").css({ "width": "430px" }).show();
        $("#ctl00_workarea_txt_p1_VBno,#ctl00_workarea_txt_p1_TAno").css({ "display": "none" });
    }
    
    CheckVALBY();

    ResetRequired('#mpage1');
    vLoading = false;

    if (!$("#ctl00_workarea_cbo_p2_modules").text() && vInsertMode) {
        $.FocusControl("#ctl00_workarea_cbo_p1_modules", false, 700);
        if ($("option", $("#ctl00_workarea_cbo_p1_modules")).size() === 1)
            vIsReadonly = true;
    }
    else
        $.FocusControl("#ctl00_workarea_txt_p1_TAno", false, 700);

    if (vIsReadonly) {
        MakePageReadOnly();
        $(".LMCBO").last().parent().parent().remove();
        $(".VCCBO").last().parent().parent().remove();
        if ($(".LMCBO").size() === 0) $("#tbl_p1_LM").parent().parent().remove();
        if ($(".VCCBO").size() === 0) $("#tbl_p1_VC").parent().parent().remove();
    }
    else {
        $("#bnReset").click(ResetPage);
        $("#ctl00_footer_bnSave1").attr("href", "#").click(ClientSave);
        // Old code removed - TSA-588 (KK): trigger change event to ensure readonly state correctly set
        $('select[id$="ctl00_workarea_cb_p1_learningreq"]').change(CheckVALBY);
        
        CheckVALBY(true);
            

        $("#bn_p1_TAname").click(TA_SearchClick);
        $("#ctl00_workarea_txt_p1_TAno").blur(CheckTAno).keypress(function (e) { return NumberOnly_KeyPress(e || event, function (e) { $('#ctl00_workarea_txt_p1_TAno').trigger('blur'); });});

        if (pk_val("CRUD.VALIDATOR")) {
            $("#ctl00_workarea_txt_p1_validateddate").change(function () {
                VB_DateChange(this);
            }).blur(function () {
                AddPriorDateOnlyFilter();
                Date_TextBox_Blur(this, 'Only dates today or in the past can be entered.');
            });

            $("#bn_p1_validateddate").click(function () {
                PopupPriorDateOnlySelect(this, 'ctl00_workarea_txt_p1_validateddate');
            });

            $("#bn_p1_VBname").click(VB_SearchClick);
            $("#ctl00_workarea_txt_p1_VBno").blur(CheckVBno).keypress(function(e){
                return NumberOnly_KeyPress(e || event, function (e) { $('#ctl00_workarea_txt_p1_VBno').trigger('blur'); });
            });
        }        
    }

    // alternative small screen size (for inline use only)
    if (!pk_UsePopup()) {//'69%', '850px', '90%', '750px', '350px'
        UseTop = "2%";
        UseWidth = "850px";
        UseHeight = "90%";
        UseMinWidth = "750px";
        UseMinHeight = "350px";
    }
    
    SetEnabled();
    setTimeout(function () {
        MakePageVisible(1);
        HasChanges = false;
    }, 1000);
    vLoading = false;
    HasChanges = false;
}

function MakePageVisible(PageNo) { MakeTabVisible(PageNo); }

function ValidatePage() {
    vValid = true;
    vReqFocused = false;

    $('input, select', $('#mpage1')).each(CheckReq);

    // check VB is valid
    if ($("#ctl00_workarea_txt_p1_VBno").val() && !$("#ctl00_workarea_txt_p1_VBname").val())
    {
        vValid = false;
        SetControlError("#ctl00_workarea_txt_p1_VBno", true);
    }

    // check TA is valid
    if ($("#ctl00_workarea_txt_p1_TAno").val() && !$("#ctl00_workarea_txt_p1_TAname").val()) {
        vValid = false;
        SetControlError("#ctl00_workarea_txt_p1_TAno", true);
    }

    if ($('select[id$="ctl00_workarea_cb_p1_learningreq"]').val() === "True" && $("#ctl00_workarea_txt_p1_VBno").val())
    {
        var ItemsComplete = 0;
        $(".LM_DAC_TXT").not(":last").each(function () {
            if ($(this).val()) ItemsComplete++;
        });

        if (ItemsComplete === 0)
        {            
            $.system_alert("You cannot save validated training with :<br/>learning required set to yes, and have no learning methods with an actual completion date set.");
            if (vValid)
                SetControlError("#ctl00_workarea_txt_p1_VBno", true);
            vValid = false;
        }
    }

    return vValid;
}

function CheckReq() { ShowRequired(this); }

function ResetPage() {
    vLoading = true;
    $("input, select", $("#mpage1")).not(".EDITBN").each(function () { $(this).resetDB(); });

    if (!pk_val("Page.MTMN"))// insert mode
    {
        $("#ctl00_workarea_cbo_p1_LearningMethods").empty();
        $("#ctl00_workarea_cbo_p1_ValidationCriteria").empty();
        $("#ctl00_workarea_cbo_p1_LearningMethods").append($("<option></option>").text("There are no learning methods setup for this module"));
        $("#ctl00_workarea_cbo_p1_ValidationCriteria").append($("<option></option>").text("There are no validation criteria setup for this module"));
        $(".LMCBO").attr("disabled", "disabled");
        $(".VCCBO").attr("disabled", "disabled");
        $(".VMTR").remove();
        $(".VMTRHDR").css("display","none");        
    }

    $(".LM_Remove").not(":last").each(function () { RemoveLM(this); });
    $(".VC_Remove").not(":last").each(function () { RemoveVC(this); });
    $('.LM_DPL_TXT, .LMPL_D, .LM_DAC_TXT, .LMAC_D, .LM_Remove, .VC_DPL_TXT, .VCPL_D, .VC_DAC_TXT, .VCAC_D, .VC_Remove').css("display", "none");

    PopulateLMCBO(1);
    PopulateVCCBO(1);
    PopulateData();

    AddMandatoryVC(true);
    
    CheckVALBY();    

    ResetRequired('#mpage1');
    SetControlError("#ctl00_workarea_txt_p1_VBno", false);
    SetControlError("#ctl00_workarea_txt_p1_validateddate", false);
    $.FocusControl("#ctl00_workarea_cbo_p2_modules");

    //if (!pk_val("Page.MTMN"))// insert mode
        HasChanges = false;

    vLoading = false;

    return false;
}

function ClientSave() {
    if (SaveHasBeenPressed || !ValidatePage())
        return false;    

    if ($("#ctl00_workarea_txt_p1_VBno").data("db")) // was validated at the start of this    
        if ($("#ctl00_workarea_txt_p1_VBno").data("db") != $("#ctl00_workarea_txt_p1_VBno").val() || $("#ctl00_workarea_txt_p1_validateddate").data("db") != $("#ctl00_workarea_txt_p1_validateddate").val())
        {
            var html =
                "<table style='width:100%;min-width:500px;margin-right: 15px;'>" +
                "<tr><td colspan='2'><label>This validated training module is linked to the following PLP's.</label></td></tr>" +
                "<tr><td  colspan='2'><br/>" + meta_val("LinkedPLPs") + "<br/></td></tr>" +
                "<tr><td colspan='2'><br/><label>Do you want to continue with your changes?</label></td></tr>" +
                "</table>";
            var Buttons = "<input tabindex='1' id='bnAWOK' type='button' value='OK' class='sysmsg_bn'>&nbsp;<input tabindex='2' id='bnAWCANCEL' type='button' value='Cancel' class='sysmsg_close'>";

            $.system_window(html,"<h2>System Warning</h2>",Buttons,2);
            $("#bnAWOK").click(function () { CloseHintPopup(); DoSave(); });
            return false;
        }    

    DoSave();
    return false;
}

function DoSave() {
    if (!SaveFormCheck("#ctl00_footer_bnSave1")) // not the error page save button (but all the rest)
        return false;

    // Validation Methods   
    var vVM = "";
    $(".VMCB").each(function () {
        if ($(this).is(":checked")) {
            if (vVM) vVM += "¬";
            vVM += $(this).data("ng_value");
        }
    });
    $("#ctl00_head_lst_p1_VM").val(vVM);

    // Learning Methods   
    var vLM = "";
    $("#tbl_p1_LM tr").not(":first").not(":last").each(function () {
        if (vLM) vLM += "¬";
        vLM += $(".LMCBO", this).val() + '~';
        vLM += $(".LM_DPL_TXT", this).val() + '~';
        vLM += $(".LM_DAC_TXT", this).val();
    });
    $("#ctl00_head_lst_p1_LM").val(vLM);

    // Validation Criteria   
    var vVC = "";
    $("#tbl_p1_VC tr").not(":first").not(":last").each(function () {
        if (vVC) vVC += "¬";
        vVC += $(".VCCBO", this).val() + '~';
        vVC += $(".VC_DPL_TXT", this).val() + '~';
        vVC += $(".VC_DAC_TXT", this).val();
    });
    $("#ctl00_head_lst_p1_VC").val(vVC);

    $("#ctl00_workarea_h_cbo_p1_modules").val($("#ctl00_workarea_cbo_p1_modules").val());
  if ($('select[id$="ctl00_workarea_cb_p1_learningreq"]').val() === "") {
    $("#ctl00_workarea_h_cb_p1_learningreq").val("");
  }
  else {
    $("#ctl00_workarea_h_cb_p1_learningreq").val($('select[id$="ctl00_workarea_cb_p1_learningreq"]').val() === "True" ? "Y" : "N");
  }

    MakeFormReadonlyForSave(".LM_Remove,.VC_Remove");
    __doPostBack('ctl00$footer$bnSave1', '');
}

function VB_Populate(CN, Name) {
    $("#ctl00_workarea_txt_p1_VBno").val(CN);
    $("#ctl00_workarea_txt_p1_VBname").val(Name);    
    if (CN) {
        $("#ctl00_workarea_txt_p1_validateddate, #ctl00_workarea_txt_p1_VBno").attr("required", "required");
        if (!$("#ctl00_workarea_txt_p1_validateddate").val())
            $("#ctl00_workarea_txt_p1_validateddate").val(formatDate(new Date(), DisplayDateFormat));        
        ShowRequired($("#ctl00_workarea_txt_p1_VBno"));
        ShowRequired($("#ctl00_workarea_txt_p1_validateddate"));
    }
    else
    {
        if ($("#ctl00_workarea_txt_p1_validateddate").val()) {
            $("#ctl00_workarea_txt_p1_VBno").attr("required", "required");
            ShowRequired($("#ctl00_workarea_txt_p1_VBno"));
        }
        else
        {
            $("#ctl00_workarea_txt_p1_VBno, #ctl00_workarea_txt_p1_validateddate").removeAttr("required");
            $("#ctl00_workarea_txt_p1_VBno").nextAll('span.rfv:first').css({ "visibility": "hidden" });
            $("#ctl00_workarea_txt_p1_validateddate").nextAll('span.rfv:first').css({ "visibility": "hidden" });
            SetControlError("#ctl00_workarea_txt_p1_VBno", false);
            SetControlError("#ctl00_workarea_txt_p1_validateddate", false);
        }
    }
    HasChanges = true;
    SetEnabled();
}

function VB_SearchClick() {
    $.member_search("TRVB" + (pk_val("Page.YA") === "Y" ? "_Y" : "_A"),
        function (CN, Name) { VB_Populate(CN, Name); },
        "Find A Training Validator",
        pk_val("Master.User.ON"),
        pk_val("Page.UseCN")
    );
    
    return false;
}

function CheckVBno() {
    var self = this;
    if (!$("#ctl00_workarea_txt_p1_VBno").val())
        VB_Populate("", "");
    else if ($("#ctl00_workarea_txt_p1_VBno").val() === pk_val("Page.UseCN")) {
        $.system_alert("A member cannot validate their own training.");
        VB_Populate("", "");
    }
    else 
        $.validate_member("TRVB" + (pk_val("Page.YA") === "Y" ? "_Y" : "_A"),
            VB_Populate,
            function () { VB_Populate("", ""); $.system_alert("Not a valid Training Validator number.", self); },
            $("#ctl00_workarea_txt_p1_VBno").val(),
            pk_val("Master.User.ON"),
            pk_val("Page.UseCN")
        );
}

function TA_Populate(CN, Name) {
    if (!CN) $("#ctl00_workarea_txt_p1_TAname").val("");
     
    $("#ctl00_workarea_txt_p1_TAno").val(CN);
    $("#ctl00_workarea_txt_p1_TAname").val(Name);
    if (($("#ctl00_workarea_txt_p1_TAno").data("db") || "") != CN)
        HasChanges = true;
    SetEnabled();
}

function TA_SearchClick() {
    $.member_search("TADV" + (pk_val("Page.YA") === "Y" ? "_Y" : "_A"),
        function (CN, Name) { TA_Populate(CN, Name); },
        "Find A Training Advisor",
        pk_val("Master.User.ON"),
        pk_val("Page.UseCN"));
    
    return false;
}

function CheckTAno(self) {
    if (!$("#ctl00_workarea_txt_p1_TAno").val())
        TA_Populate("", "");
    else if ($("#ctl00_workarea_txt_p1_TAno").val() === pk_val("Page.UseCN")) {
        TA_Populate("", "");
        $.system_alert("A member cannot be their own training advisor.");
    }
    else 
        $.validate_member("TADV" + (pk_val("Page.YA") === "Y" ? "_Y" : "_A"),
            TA_Populate,
            function () { TA_Populate("", ""); $.system_alert("Not a valid training advisor number.", self); },
            $("#ctl00_workarea_txt_p1_TAno").val(),
            pk_val("Master.User.ON"),
            pk_val("Page.UseCN")
        );
}

function VB_DateChange(self) {
    if ($(self).val()) {    
        $("#ctl00_workarea_txt_p1_validateddate, #ctl00_workarea_txt_p1_VBno").attr("required", "required");

        if (!$("#ctl00_workarea_txt_p1_VBno").val()) {
            $.FocusControl("#ctl00_workarea_txt_p1_VBno");
            $("#ctl00_workarea_txt_p1_VBno").nextAll('span.rfv:first').css({ "visibility": "visible", "display": "" });
        }

        ShowRequired($("#ctl00_workarea_txt_p1_VBno"));
        ShowRequired($("#ctl00_workarea_txt_p1_validateddate"));
    }
    else if (!$(self).val() && !$("#ctl00_workarea_txt_p1_VBno").val())
    {
        $("#ctl00_workarea_txt_p1_validateddate, #ctl00_workarea_txt_p1_VBno").removeAttr("required");
        $("#ctl00_workarea_txt_p1_VBno").nextAll('span.rfv:first').css({ "visibility": "hidden", "display": "none" });
        SetControlError("#ctl00_workarea_txt_p1_VBno",false);
        SetControlError("#ctl00_workarea_txt_p1_validateddate",false);
    }
    else if (!$(self).val() && $("#ctl00_workarea_txt_p1_VBno").val()) {
        $("#ctl00_workarea_txt_p1_validateddate").attr("required", "required");        
        SetControlError("#ctl00_workarea_txt_p1_validateddate", true);
    }
}

function CheckVALBY(DontResetVB) {
    var ItemsComplete = 0;
    $(".LM_DAC_TXT").not(":last").each(function () {
        if ($(this).val()) ItemsComplete++;
    });
    
  if ($('select[id$="ctl00_workarea_cb_p1_learningreq"]').val() === "True" && ItemsComplete === 0 && !vIsReadonly && !vLoading && !DontResetVB)
    {
        $("#ctl00_workarea_txt_p1_validateddate, #ctl00_workarea_txt_p1_VBno, #ctl00_workarea_txt_p1_VBname").attr("readonly", "readonly").val("");
        $("#bn_p1_VBname, #bn_p1_validateddate, #ctl00_workarea_txt_p1_VBname").css("display", "none");
        $("#ctl00_workarea_txt_p1_VBno").css("display", "");
    }
    else if (!vIsReadonly)
    {
        $("#ctl00_workarea_txt_p1_validateddate, #ctl00_workarea_txt_p1_VBno").removeAttr("readonly");
        $("#bn_p1_validateddate, #ctl00_workarea_txt_p1_VBname").css("display", "");

        if (!$("#ctl00_workarea_txt_p1_VBno").val())
            $("#bn_p1_VBname").css("display", "");
    }

    if (!$("#ctl00_workarea_txt_p1_validateddate").val() && !$("#ctl00_workarea_txt_p1_VBno").val())
    {
        $("#ctl00_workarea_txt_p1_VBno").nextAll('span.rfv:first').css({ "visibility": "hidden", "display": "none" });
        $("#ctl00_workarea_txt_p1_validateddate").nextAll('span.rfv:first').css({ "visibility": "hidden" });
        SetControlError($("#ctl00_workarea_txt_p1_VBno"), false);
        SetControlError($("#ctl00_workarea_txt_p1_validateddate"), false);
    }

    SetEnabled();
}

function TM_PastPopupDateSelect(self, CLS) {
    PopupPriorDateOnlySelect(self, $(CLS, $(self).parent().parent()).attr("id"));
}

function TM_FuturePopupDateSelect(self, CLS) {
    PopupFutureDateOnlySelect(self, $(CLS, $(self).parent().parent()).attr("id"));
}

function PopulateModuleData(TMN) {
    $.ajax({
        url: WebServicePath() + "GetTrainingModuleData?pTMN=" + TMN + "&pYA=" + pk_val("Page.YA") + "&pCN=" + pk_val("Page.UseCN"),
        async:false,
        success: function (result) {

            $("#ctl00_workarea_cbo_p1_LearningMethods").empty();
            $("#ctl00_workarea_cbo_p1_ValidationCriteria").empty();

            if (result.d) {
                result = $.parseJSON(result.d);
                var idx;
                if (result.LearningMethods) {
                    $("#ctl00_workarea_cbo_p1_LearningMethods").append($("<option>--- Select Learning Method ---</option>"));
                    for (idx = 0; idx < result.LearningMethods.split('¬').length; idx++) {
                        var vItem0 = result.LearningMethods.split('¬')[idx];
                        $("#ctl00_workarea_cbo_p1_LearningMethods").append($("<option></option>").attr("value", vItem0.split('~')[0]).text(vItem0.split('~')[1]));
                    }
                }

                if (result.ValidationCriteria) {
                    $("#ctl00_workarea_cbo_p1_ValidationCriteria").append($("<option>--- Select Validation Criteria ---</option>"));
                    for (idx = 0; idx < result.ValidationCriteria.split('¬').length; idx++) {
                        var vItem1 = result.ValidationCriteria.split('¬')[idx];
                        $("#ctl00_workarea_cbo_p1_ValidationCriteria").append(
                            $("<option></option>").attr("value", vItem1.split('~')[0]).attr("data-mandatory", (vItem1.split('~')[2] === "Y" ? "Y" : "")).text(vItem1.split('~')[1])
                            );
                    }                    
                }

                if (result.ValidationMethods) {
                    $(".VMTRHDR").css("display", "");
                    var vHTML = "";
                    for (idx = 0; idx < result.ValidationMethods.split('¬').length; idx++) {
                        var vItem2 = result.ValidationMethods.split('¬')[idx];
                        vHTML += "<tr class='VMTR'><td style='white-space: nowrap;width: 300px'><label class='labelPoint' for='cb_VM_" + vItem2.split('~')[0] + "'>" + vItem2.split('~')[1] + "</label></td><td><input class='VMCB' data-ng_value='" + vItem2.split('~')[0] + "' type='checkbox' id='cb_VM_" + vItem2.split('~')[0] + "'/></td><td></td></tr>";
                    }
                    $("#VMTBL").html("<tbody>" + vHTML + "</tbody>");
                }
            }

            if ($("option", $("#ctl00_workarea_cbo_p1_LearningMethods")).size() === 0) {
                $("#ctl00_workarea_cbo_p1_LearningMethods").append($("<option></option>").text("--- There are no learning methods setup for this module ---"));
                $(".LMCBO").attr("disabled", "disabled");
            }
            else $(".LMCBO").removeAttr("disabled");

            if ($("option", $("#ctl00_workarea_cbo_p1_ValidationCriteria")).size() === 0) {
                $("#ctl00_workarea_cbo_p1_ValidationCriteria").append($("<option></option>").text("--- There are no validation criteria setup for this module ---"));
                $(".VCCBO").attr("disabled", "disabled");
            }
            else $(".VCCBO").removeAttr("disabled");            

            PopulateLMCBO(1);
            PopulateVCCBO(1);
            AssignLMEvents();
            AssignVCEvents();            
            AddMandatoryVC(false);
            SetEnabled();
        }, error: ServiceFailed
    });
}

function PopulateData() {
    var mvData;
    var i;
    if ($("#ctl00_head_lst_p1_VC").val()) {
        mvData = $.parseJSON($("#ctl00_head_lst_p1_VC").val());
        for (i = 0; i < mvData.length ; i++)
            AddVC(mvData[i].Code, mvData[i].Planned, mvData[i].Actual);
    }

    if ($("#ctl00_head_lst_p1_LM").val()) {
        mvData = $.parseJSON($("#ctl00_head_lst_p1_LM").val());
        for (i = 0; i < mvData.length ; i++)
            AddLM(mvData[i].Code, mvData[i].Planned, mvData[i].Actual);
    }

    if (pk_val("Page.CanUpdateValidated"))
    {
        $("option[data-arch='Y']", $('.LMCBO').last()).remove();
        $("option[data-arch='Y']", $('.VCCBO').last()).remove();
    }
}

// LM
function PopulateLMCBO(row) {
    $('.LMCBO', $("#tbl_p1_LM tr:eq(" + row + ")")).html($("#ctl00_workarea_cbo_p1_LearningMethods").html());
    if ($("option", $("#ctl00_workarea_cbo_p1_LearningMethods")).length === 1) $(".LMCBO").attr("disabled", "disabled");

    // remove all archived items
    if (!vLoading)
        $("option[data-arch='Y']", $(".LMCBO").last()).remove();
}

function LMCBOChange(self) {
    var vLocalValid = true;
    var TR = $(self).parent().parent();

    $("#tbl_p1_LM tr").not(':first').not(':last').each(function () {
        if ($(".LMCBO :selected", this).val() === $(self).val() && $(".LMCBO :selected", this).parent().parent().parent().index() !== TR.index()) {
            if (!vLoading) $.system_alert('This Learning Method has already been set up.', $(self));
            if ($(".LMCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
            else { $(self).val($(self).data("orig")); }
            vLocalValid = false;
            return;
        }
    });

    if (!vLocalValid || !$(self).val()) return;

    // set the date button ID's
    $(".LM_DPL_TXT", TR).attr("id", "LMPLDTXT_" + $(self).val());
    $(".LMPL_D", TR).attr("id", "LMPLDBN_" + $(self).val());
    $(".LM_DAC_TXT", TR).attr("id", "LMACDTXT_" + $(self).val());
    $(".LMAC_D", TR).attr("id", "LMACDBN_" + $(self).val());

    if (!$("option:eq(0)", $(self)).attr("value")) {
        if (pk_val("Page.IsReadonly")) {
            $("option", $(self)).not(":selected").remove();
        }
        else {
            $(self).data("orig", $(self).val());
            $("option:eq(0)", $(self)).remove();
        }
        $('.LM_DPL_TXT, .LMPL_D, .LM_DAC_TXT, .LMAC_D, .LM_Remove').css("display", "");

        ////if (!vIsReadonly) {
            AddLM();
            PopulateLMCBO($("#tbl_p1_LM tr").length - 1);
        ////}
    }
}

function RemoveLM(self) {
    if ($("#tbl_p1_LM tr").length === 1) {
        $(".LMCBO", $(self).parent().parent()).val("").data("orig","");
        $('.LM_DPL_TXT, .LMPL_D, .LM_DAC_TXT, .LMAC_D, .LM_Remove').css("display", "none");
        PopulateLMCBO($("#tbl_p1_LM tr").length - 1);
    }
    else
        $(self).parent().parent().remove();
    HasChanges = true;
    CheckVALBY();
}

function AddLM(Code, PC, AC) {
    if (Code) {
        $("option[value='" + Code + "']", $(".LMCBO").last()).attr('selected', 'selected');        
        $(".LM_DPL_TXT").last().val(PC);
        $(".LM_DAC_TXT").last().val(AC);

        ////setTimeout(function () {
        ////    LMCBOChange($(".LMCBO").last());
        ////}, 200);

        LMCBOChange($(".LMCBO").last());////

        // if selected item is archived, remove all others and disable
        if ($("option:selected", $(".LMCBO").not(":last").last()).attr("data-arch"))
        {
            $("option[value!='" + Code + "']", $(".LMCBO").not(":last").last()).remove();
            $(".LMCBO").not(":last").last().attr("disabled", "disabled");
        }
        else
            $("option[data-arch='Y']", $(".LMCBO").not(":last").last()).remove();
    }
    else {
        var HTML = $("#tbl_p1_LM tr:eq(" + ($("#tbl_p1_LM tr").length - 1) + ")").html();
        $("#tbl_p1_LM").append("<tr>" + HTML + "</tr>");
        $('.LM_DPL_TXT, .LMPL_D, .LM_DAC_TXT, .LMAC_D, .LM_Remove', $("#tbl_p1_LM tr:eq(" + ($("#tbl_p1_LM tr").length - 1) + ")")).css("display", "none");
        CheckVALBY();
        AssignLMEvents();        
    }    
}

function AssignLMEvents() {
    $(".LMCBO").last().change(function () { LMCBOChange(this); });
    $(".LM_DPL_TXT").last().blur(function () { AddFutureDateOnlyFilter(); Date_TextBox_Blur(this, 'Only dates in the future can be entered.'); });
    $(".LMPL_D").last().click(function () { TM_FuturePopupDateSelect(this, '.LM_DPL_TXT'); });

    $(".LM_DAC_TXT").last().blur(function () { AddPriorDateOnlyFilter(); Date_TextBox_Blur(this, 'Only dates today or in the past can be entered.'); }).change(CheckVALBY);
    $(".LMAC_D").last().click(function () { TM_PastPopupDateSelect(this, '.LM_DAC_TXT'); });
    $(".LM_Remove").last().click(function () { RemoveLM(this); });
}

// VC
function AddMandatoryVC(OnlyReadonlyBit) {
    if (!OnlyReadonlyBit) {
        vLoadingVC = true;

        $("option", $("#ctl00_workarea_cbo_p1_ValidationCriteria")).each(function () {
            var vTVN = $(this).val();
            if (vTVN && $(this).data("mandatory")) {
                $('option[value=' + vTVN + ']', $(".VCCBO").last()).attr('selected', 'selected');
                $(".VCCBO").last().data("orig", vTVN);
                VCCBOChange($(".VCCBO").last());
            }
        });        
        vLoadingVC = false;
    }

    $(".VCCBO").each(function () {
        if ($("option:selected", this).data("mandatory")) {
            $(this).closest("select").attr("disabled", "disabled");            
            $(".VC_Remove", this.parentElement.parentElement).css("display","none");
        }
    });
    SetEnabled();
}

function PopulateVCCBO(row) {
    $('.VCCBO', $("#tbl_p1_VC tr:eq(" + row + ")")).html($("#ctl00_workarea_cbo_p1_ValidationCriteria").html());
    if ($("option", $("#ctl00_workarea_cbo_p1_ValidationCriteria")).length === 1) $(".VCCBO").attr("disabled", "disabled");

    // remove all archived items
    if (!vLoading)
        $("option[data-arch='Y']", $(".VCCBO").last()).remove();
}

function VCCBOChange(self) {
    var vLocalValid = true;
    var TR = $(self).parent().parent();

    if (!vLoadingVC)
        $("#tbl_p1_VC tr").not(':first').not(':last').each(function () {
            if ($(".VCCBO :selected", this).val() === $(self).val() && $(".VCCBO :selected", this).parent().parent().parent().index() !== TR.index()) {
                if (!vLoading) $.system_alert('This Validation Criteria has already been set up.', $(self));
                if ($(".VCCBO option[value='']", $(self).parent()).length !== 0) $(self).val("");
                else { $(self).val($(self).data("orig")); }
                vLocalValid = false;
                return;
            }
        });

    if (!vLocalValid) return;

    // set the date button ID's
    $(".VC_DPL_TXT", TR).attr("id", "VCPLDTXT_" + $(self).val());
    $(".VCPL_D", TR).attr("id", "VCPLDBN_" + $(self).val());
    $(".VC_DAC_TXT", TR).attr("id", "VCACDTXT_" + $(self).val());
    $(".VCAC_D", TR).attr("id", "VCACDBN_" + $(self).val());

    if (vLoadingVC || !$("option:eq(0)", $(self)).attr("value")) {
        if (pk_val("Page.IsReadonly")) {
            $("option", $(self)).not(":selected").remove();
        }
        else {
            $(self).data("orig", $(self).val());
            if (!vLoadingVC) $("option:eq(0)", $(self)).remove();
        }
        $('.VC_DPL_TXT, .VCPL_D, .VC_DAC_TXT, .VCAC_D').css("display", "");

        $(".VC_Remove").each(function () {
            if (!$(".VCCBO option:selected", $(this).closest("tr")).data("mandatory"))
                $(this).css("display", "");
        });

        AddVC();
        PopulateVCCBO($("#tbl_p1_VC tr").length - 1);
        //AddMandatoryVC(true);
    } else {        
        if (!$(".VCCBO option:selected", $(self).closest("tr")).data("mandatory"))
            $(".VC_Remove", $(self).closest("tr")).css("display", "");
        else
            $(".VC_Remove", $(self).closest("tr")).css("display", "none");
    }   
}

function RemoveVC(self) {
    if ($(".VCCBO option:selected", $(self).closest("tr")).data("mandatory")) {
        $.system_alert("You cannot remove mandatory validation criteria Items.");
        return;
    }

    if ($("#tbl_p1_VC tr").length === 1) {
        $(".VCCBO", $(self).parent().parent()).val("").data("orig","");
        $('.VC_DPL_TXT, .VCPL_D, .VC_DAC_TXT, .VCAC_D, .VC_Remove').css("display", "none");
        PopulateVCCBO($("#tbl_p1_VC tr").length - 1);
    }
    else
        $(self).parent().parent().remove();
    HasChanges = true;
}

function AddVC(TVN, PC, AC) {
    if (TVN) {
        $("option[value='" + TVN + "']", $(".VCCBO").last()).attr('selected', 'selected');        
        $(".VC_DPL_TXT").last().val(PC);
        $(".VC_DAC_TXT").last().val(AC);        
        VCCBOChange($(".VCCBO").last());

        // if selected item is archived, remove all others and disable
        if ($("option:selected", $(".VCCBO").not(":last").last()).attr("data-arch")) {
            $("option[value!='" + TVN + "']", $(".VCCBO").not(":last").last()).remove();
            $(".VCCBO").not(":last").last().attr("disabled", "disabled");
        }
        else
            $("option[data-arch='Y']", $(".VCCBO").not(":last").last()).remove();
    }
    else {
        var HTML = $("#tbl_p1_VC tr:eq(" + ($("#tbl_p1_VC tr").length - 1) + ")").html();

        $("#tbl_p1_VC").append("<tr>" + HTML + "</tr>");
        $('.VC_DPL_TXT, .VCPL_D, .VC_DAC_TXT, .VCAC_D, .VC_Remove', $("#tbl_p1_VC tr:eq(" + ($("#tbl_p1_VC tr").length - 1) + ")")).css("display", "none");
        $(".VCCBO").last().data("orig", "");
        AssignVCEvents();
    }
}

function AssignVCEvents() {
    $(".VCCBO").last().change(function () { VCCBOChange(this); });
    $(".VC_DPL_TXT").last().blur(function () { AddFutureDateOnlyFilter(); Date_TextBox_Blur(this, 'Only dates in the future can be entered.'); });
    $(".VCPL_D").last().click(function () { TM_FuturePopupDateSelect(this, '.VC_DPL_TXT'); });

    $(".VC_DAC_TXT").last().blur(function () { AddPriorDateOnlyFilter(); Date_TextBox_Blur(this, 'Only dates today or in the past can be entered.'); });
    $(".VCAC_D").last().click(function () { TM_PastPopupDateSelect(this, '.VC_DAC_TXT'); });
    $(".VC_Remove").last().click(function () { RemoveVC(this); });
}