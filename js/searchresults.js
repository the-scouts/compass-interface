var vCurrentPageNo = 1;
var DuplicateSendMessageShown = false;
var file1, file2;
var vTextFilterIDX;

$(document).ready(FormReady);

//var HintMSG =
//    "<b><center>You may send any number of message types at once.</center></b>" +
//    "<br/>You can preview the message(s) on the next page before sending.<br/>" +
//    "<br/>NOTES: " +
//    "<br/>&#8226; Message personalisation and HTML tags are only available for Emails and Alerts." +
//    "<br/>&#8226; If you add HTML tags to an SMS message or if invalid tags are added to Emails or Alerts, they will not show correctly."+
//    "<br/>&#8226; If you add attributes other than <b>style</b>,<b>href</b> to HTML tags they will be removed.";
    
    
function FormReady() {
    try { MakePageVisible(pk_val("Page.StartPage")); } catch (e) { MakePageVisible(1); }

    // no messaging, so remove all pages.
    if (!pk_val("CRUD.MSEM")) $("#fpage2, #fpage3, #fpage4, #mpage2, #mpage3, #mpage4").remove();

    // Add events
    $("#ctl00_plInnerPanel_cb_p4_emailAtt").click(EmailAttachclick);
    $("#ctl00_plInnerPanel_cb_p4_alertAtt").click(AlertAttachclick);
    $('#bn_p2_del_attachment1').click(function () { $("#fu_p2_Attachment1").replaceWith($("#fu_p2_Attachment1").clone()); file1 = undefined; $('#fu_p2_Attachment1').change(fu1_Change); $("#ctl00_plInnerPanel_txt_p2_Attachment1").val("").data("uploaded",""); });
    $('#bn_p2_del_attachment2').click(function () { $("#fu_p2_Attachment2").replaceWith($("#fu_p2_Attachment2").clone()); file2 = undefined; $('#fu_p2_Attachment2').change(fu2_Change); $("#ctl00_plInnerPanel_txt_p2_Attachment2").val("").data("uploaded", ""); });
    $('#fu_p2_Attachment1').change(fu1_Change);
    $('#fu_p2_Attachment2').change(fu2_Change);
    $('.msHeadTD').hover(
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(),10) + 1) + ')').not(".SubTR").addClass("Grid_HL"); },
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(),10) + 1) + ')').not(".SubTR").removeClass("Grid_HL"); });

    $('.msCheckAll').click(function () {
        $('.msCheckAllPending').removeAttr('checked');
        var vGrid = $(".msCard").length > 0;
        if ($(this).is(":checked")) {
            $(".msCheckItems").each(function () {
                if (vGrid && $(this).parent().parent().parent().parent().parent().css("display") !== "none")
                    $(this).prop('checked', 'checked');
                else if (!vGrid && $(this).parent().parent().css("display") !== "none")
                    $(this).prop('checked', 'checked');
                else
                    $(this).removeAttr('checked');
            });
        }
        else
            $(".msCheckItems").removeAttr('checked');
    });
    $('.msCheckAll, .msCheckItems').prop('checked', 'checked');
    $('.msCheckAllPending').click(function () {
        $('.msCheckAll, .msCheckAllAccepted, .msCheckAllRejected, .msCheckItems').removeAttr('checked');
        if ($(this).is(":checked")) {
            $(".PNDG").each(function () {
                if ($(this).parent().parent().parent().css("display") !== "none")
                    $(this).prop('checked', 'checked');
                else
                    $(".PNDG").removeAttr('checked');
            });
        }
        else
            $(".PNDG").removeAttr('checked');
    });
    $('.msCheckAllAccepted').click(function () {
        $('.msCheckAll, .msCheckAllPending, .msCheckAllRejected, .msCheckItems').removeAttr('checked');
        if ($(this).is(":checked")) {
            $(".ACCT").each(function () {
                if ($(this).parent().parent().parent().css("display") !== "none")
                    $(this).prop('checked', 'checked');
                else
                    $(".ACCT").removeAttr('checked');
            });
        }
        else
            $(".ACCT").removeAttr('checked');
    });
    $('.msCheckAllRejected').click(function () {
        $('.msCheckAll, .msCheckAllPending, .msCheckAllAccepted, .msCheckItems').removeAttr('checked');
        if ($(this).is(":checked")) {
            $(".REJT").each(function () {
                if ($(this).parent().parent().parent().css("display") !== "none")
                    $(this).prop('checked', 'checked');
                else
                    $(".REJT").removeAttr('checked');
            });
        }
        else
            $(".REJT").removeAttr('checked');
    });

    $("#ctl00_plInnerPanel_cb_p2_email").prop('checked', 'checked');

    $("input,textarea").change(CheckReq);    

    $("#ctl00_plInnerPanel_cb_p2_email").change(function () {
        if ($(this).is(":checked")) {
            $("#ctl00_plInnerPanel_txt_p2_subject").attr("required", "required").removeAttr("readonly");
            $("#subjectReq").css("visibility", "visible");
        }
        else {
            $("#ctl00_plInnerPanel_txt_p2_subject").removeAttr("required").css("border-color", "").attr("readonly", "readonly");
            $("#subjectReq").css("visibility", "hidden");
        }
        SetEnabled("#mpage2");
        $("#ctl00_plInnerPanel_txt_p2_subject").trigger("change").css("background-color", "");
    });
    
    $("#bn_p2_data").click(AddData);
    $("#bn_previewemail").click(PreviewMessage).removeAttr("id");
    $("#bnReset2").click(function () { return ResetPage(2); }).removeAttr("id");
    $("#bnBack2, #bnBack3,#bnBack4").click(function () { ShowResultsCount(); MakePageVisible(1); return false; }).removeAttr("id");
    $("#bnEditEmail").click(function () { MakePageVisible(2); return false; }).removeAttr("id");
    $("#ctl00_plInnerPanel_foot_bnSend, #bnSend").attr("href", "#").click(DoSendEmails);
    $("#ctl00_plInnerPanel_txt_p2_body").keyup(function () { CheckLen(this); }).blur(function () { CheckLen(this); CheckReq(this); });
    $(".CardSizeSmall").click(function () { ReSizeCards(1); return false; });
    $(".CardSizeBig").click(function () { ReSizeCards(2); return false; });
    $("#bnStopImage").click(function () { ProgressCNT = 0; });

    $(".memsearch").click(function () { 
        OpeniFrame(WebSitePath() + "Popups/MemberSearch.aspx",'69%','890px','90%','550px','',true,false);
        return false;
    }).removeClass("memsearch");

    $("#bnDisplay").click(function () { ShowBusy_Main(WebSitePath() + "SearchResults.aspx?Force=1"); return false; }).removeAttr("id");
    $("#bnDisplay2").click(function () { ShowBusy_Main(WebSitePath() + "SearchResults.aspx?Force=2"); return false; }).removeAttr("id");
    $(".clicktitle").click(ShowLoadingMessage);

    $("#bnEmail").click(function () { if (ShowSelectedCount(false)) { ChooseTemplate(); } return false; });
    $("#bnExport").click(ExportGrid).removeAttr("id");
    $("#bnGridView1").click(function () { View('Card', $(this).data("force")); return false; });
    $("#bnGridView2").click(function () { View('Grid', $(this).data("force")); return false; });

    $("#bnUpdateAttendees").click(function () { return UpdateAttendeeDetails($(this).data("eventtype"), $(this).data("eventnumber"), $(this).data("eventname")); });
    $("#bnUpdateTraining").click(function () { UpdateTrainingPopup($(this).data("eventnumber"), '111'); return false; });

    $(".popupclose").not("#bnStopImage").click(function () { $("#ctl00_plInnerPanel_div_Parameters").remove(); });

    $("#cb_p2_html").change(CheckHTMLVis);    
    $("#ctl00_plInnerPanel_cb_p2_email, #ctl00_plInnerPanel_cb_p2_alert,#ctl00_plInnerPanel_cb_p2_sms,#ctl00_plInnerPanel_cb_p2_social,#ctl00_plInnerPanel_cb_p2_personal").change(EnablePersonal);    

    $("#bn_html_A,#bn_html_B,#bn_html_U,#bn_html_EM,#bn_html_I,#bn_html_STRIKE,#bn_html_SPAN,#bn_html_DATE").click(function(){
        var vOpt = $(this).attr("id").replace("bn_html_","");
        AddTag(vOpt);
    }).addClass("tags");

    CheckHTMLVis();
    CheckReq($("#ctl00_plInnerPanel_txt_p2_body"));

    if (!pk_val("Page.Card"))
        $(".cardresize").remove();
    else
    {
        $.FocusControl("#txt_p1_Search", true);
        $('#txt_p1_Search').keyup(ApplyCardFilter).on('blur', ApplyCardFilter);
    }

    // pagination
    if ($("#ctl00_plInnerPanel_head_txt_h_Data").val()) {
        mvData = $.parseJSON($("#ctl00_plInnerPanel_head_txt_h_Data").val());
        if (!pk_val("Page.Card")) AddGridSort_Columns("MemberSearch");
        mvPopulateRoutine = PopulateData; 
        setTimeout(PopulateData, 100);
    }
    else // old standard load
    {
        AddGridSortData("MemberSearch", ".subTR");
    }
    
    $("#ctl00_plInnerPanel_head_h_CustomFrom,#divWAIT,#h_adHocDate").css("display", "none");

    $("#h_adHocDate").change(function () {
        $("#ctl00_plInnerPanel_txt_p2_body").val($("#ctl00_plInnerPanel_txt_p2_body").val() + $(this).val());
        $.FocusControl("#ctl00_plInnerPanel_txt_p2_body");
    });   

    $("#tr_p4_emailAtt").hide();
    $("#div_p4_alertAtt").hide();

    SetEnabled();
    ResizeSP();
    CustomResize = ResizeSP;
}

function TrimCard(Data, Size) {
    //0=big,1=med (default),2=small
    try {        
        if (Size === "0")
        {
            if (Data && Data.length > 27) Data = Data.substring(0, 24) + "...";
        }
        else if (Size === "2") {
            if (Data && Data.length > 34) Data = Data.substring(0, 31) + "...";            
        }
        else {
            if (Data && Data.length > 31) Data = Data.substring(0, 28) + "...";
        }

        return Data;

    }
    catch (e) {
        return Data;
    }
}

function PopulateData(ForceAll) {
    var vIsCard = pk_val("Page.Card");
    var vSize = pk_val("Master.Sys.TextSize");
    if (mvTake === -2) mvTake = parseInt(pk_val("Page.Take"), 10);

    if (mvSkip === 0 && mvTake < mvData.length) {
        $("#mstr_scroll").scroll(function () {
            var useheight = vIsCard ? $(".msCard").last().position().top : $("#MemberSearch").height();
            if (mvTake > 0 && mvTake < mvData.length && $("#mstr_scroll").scrollTop() >= useheight - $("#mstr_scroll").height()) { PopulateData();}
        });
    }

    var added = 0;
    var StartPos = mvSkip;
    var TRHTML = "";
    var vSearchType = pk_val("Page.SearchType");
    var vGridOptsOffSet = ColsSpeed[0] === "¬" ? 0 : 1;
    var vformattedCN;
    var vAllIsChecked = $(".msCheckAll").is(":checked");
    var vTemplateHL;
    var vTemplate;
    var vContainer;
    var vImage;
    var vImageClass;
    
    if (vIsCard)
    {
        vTemplateHL = $("#ctl00_plInnerPanel_head_txt_h_data_template_HL").val();
        vTemplate = $("#ctl00_plInnerPanel_head_txt_h_data_template").val();
        vContainer = "#ctl00_plInnerPanel_div_Results";
    }
    else
    {
        vTemplateHL = "<tr class='msTR'>" + $("#ctl00_plInnerPanel_head_txt_h_data_template_HL").val() + "</tr>";
        vTemplate = "<tr class='msTR'>" + $("#ctl00_plInnerPanel_head_txt_h_data_template").val() + "</tr>";
        vContainer = "#MemberSearch tbody";
    }

    for (var i = StartPos; i < (ForceAll ? mvData.length : StartPos + mvTake) ; i++) {
        if (StartPos >= mvData.length || i >= mvData.length) {
            mvTake = -1;
            break;
        }

        //0 = CN (all)
        //1 = formatted CN  (basic/advanced/basic hier/dist list/hierarchy)
        //2 = Name (all)
        //3 = Location (basic/advanced/basic hier/dist list)
        //4 = Role (basic/advanced/basic hier/dist list/hierarchy)
        //5 = Date Of Birth (advanced)
        //6 = email (dist list)
        //7 = address (dist list/hierarchy)
        //8 = phone (dist list)
        //9 = activity (permit + assessor)
        //10 = category (permit + assessor)
        //11 = permit Type (permit)
        //12 = expiry date (permit)
        //13 = county (permit + assessor)
        //14 = district (permit)
        //15 = review date (assessor)
        //16 = Image (card view)
        //17 = Truncated Name (card view) (calc's at client)
        //18 = Truncated Role (card view) (calc's at client)
        //19 = Location 1 (card view) (calc's at client)
        //20 = Location 2 (card view) (calc's at client)
        //21 = Truncated Location 1 (card view) (calc's at client)
        //22 = Truncated Location 2 (card view) (calc's at client)
        //23 = Class for load image

        vImageClass = "";
        vImage = "Images/core/sil_contact.png";
        if (mvData[i].visibility_status) // 'Y' if add hyperlinks (so use that template)
        {
            TRHTML = vTemplateHL;
            if (!mvData[i].noavatar) {
                vImage = "Images/core/sil_hourglass.png";
                vImageClass = " msNoImage";
            } else {
                vImageClass = "";
            }
        }
        else
            TRHTML = vTemplate;

        if (!vAllIsChecked) TRHTML = TRHTML.replace(" checked='checked'","");

        vformattedCN = ('00000000' + mvData[i].contact_number.toString()).substring(mvData[i].contact_number.toString().length);

        TRHTML = TRHTML.replaceAll("{RN}", i);
        TRHTML = TRHTML.replaceAll("{0}", mvData[i].contact_number);
        TRHTML = TRHTML.replaceAll("{1}", vformattedCN);
        TRHTML = TRHTML.replace("{2}", mvData[i].name || "");
        TRHTML = TRHTML.replace("{3}", mvData[i].location || "");
        TRHTML = TRHTML.replace("{4}", mvData[i].role || "");
        TRHTML = TRHTML.replace("{5}", mvData[i].date_of_birth || "");
        TRHTML = TRHTML.replace("{6}", mvData[i].email || "");
        TRHTML = TRHTML.replace("{7}", mvData[i].address || "");
        TRHTML = TRHTML.replace("{8}", mvData[i].phone || "");
        TRHTML = TRHTML.replace("{9}", mvData[i].activity || "");
        TRHTML = TRHTML.replace("{10}", mvData[i].category || "");
        TRHTML = TRHTML.replace("{11}", mvData[i].permit_type || "");
        TRHTML = TRHTML.replace("{12}", mvData[i].expiry_date || "");
        TRHTML = TRHTML.replace("{13}", mvData[i].county || "");
        TRHTML = TRHTML.replace("{14}", mvData[i].district || "");
        TRHTML = TRHTML.replace("{15}", mvData[i].review_date || "");
        TRHTML = TRHTML.replace("{24}", mvData[i].urn || ""); // urn for assessor/permit

        if (vIsCard) {
            TRHTML = TRHTML.replace("{16}", vImage);
            TRHTML = TRHTML.replace("{23}", vImageClass); 
            TRHTML = TRHTML.replaceAll("{17}", TrimCard(mvData[i].name, vSize) || ""); // truncated name
            TRHTML = TRHTML.replaceAll("{18}", TrimCard(mvData[i].role, vSize) || ""); // truncated name

            var vLocation =  mvData[i].location;
            if (vLocation.indexOf(" @ ") > 0)
            {
                var vTmp1 = vLocation.substring(0, vLocation.indexOf(" @ "));
                var vTmp2 = vLocation.substring(vLocation.indexOf(" @ ") + 3);

                TRHTML = TRHTML.replace("{21}", vTmp1 || ""); // loc 1
                TRHTML = TRHTML.replace("{22}", vTmp2 || ""); // loc 2
                TRHTML = TRHTML.replace("{19}", TrimCard(vTmp1, vSize) || ""); // truncated loc 1
                TRHTML = TRHTML.replace("{20}", TrimCard(vTmp2, vSize) || ""); // truncated loc 2
            } else {
                TRHTML = TRHTML.replace("{19}", ""); 
                TRHTML = TRHTML.replace("{22}", vLocation || "");
                TRHTML = TRHTML.replace("{21}", ""); 
                TRHTML = TRHTML.replace("{20}", TrimCard(vLocation, vSize) || ""); // truncated loc 2
            }
        }

        $(vContainer).append(TRHTML);
        //        $("tr:last", vContainer).data("cn_checksum", mvData[i].contact_number ^ pk_val("Master.User.CN"));
        var vIsCard = pk_val("Page.Card");
        if (vIsCard)
            $(".msCheckItems:last", vContainer).closest("table").removeAttr("data-cn_checksum").data("cn_checksum", mvData[i].contact_number ^ pk_val("Master.User.CN"));
        else
            $(".msCheckItems:last", vContainer).closest("tr").removeAttr("data-cn_checksum").data("cn_checksum", mvData[i].contact_number ^ pk_val("Master.User.CN"));

        $(".msCheckItems:last", vContainer).removeAttr("data-cn").data("cn", mvData[i].contact_number);
        if (mvData[i].urn) {
            $(".msCheckItems:last", vContainer).removeAttr("data-urn").data("urn", mvData[i].urn);
            $("tr:last", vContainer).data("urn_checksum", mvData[i].urn);
        }

        // manual load of columns
        if (ColsSpeed && !vIsCard) {
            //DISTLIST, BASIC, BASIC_HIER, ADVANCED, HIERARCHY, PERMIT, ASSESSOR
            if (vSearchType === "BASIC" || vSearchType === "BASIC_HIER" || vSearchType === "ADVANCED")
            {
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[1 - vGridOptsOffSet], vformattedCN, 1 - vGridOptsOffSet); //CN
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[2 - vGridOptsOffSet], mvData[i].name, 2 - vGridOptsOffSet); // Name
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[3 - vGridOptsOffSet], mvData[i].location, 3 - vGridOptsOffSet); // Location
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[4 - vGridOptsOffSet], mvData[i].role, 4 - vGridOptsOffSet); // Role
            }
            else if (vSearchType === "ADVANCED+") { // NOTE: '+' means has extra age column
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[1 - vGridOptsOffSet], vformattedCN, 1 - vGridOptsOffSet); //CN
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[2 - vGridOptsOffSet], mvData[i].name, 2 - vGridOptsOffSet); // Name
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[3 - vGridOptsOffSet], mvData[i].date_of_birth, 3 - vGridOptsOffSet); // DoB
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[4 - vGridOptsOffSet], mvData[i].location, 4 - vGridOptsOffSet); // Location
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[5 - vGridOptsOffSet], mvData[i].role, 5 - vGridOptsOffSet); // Role
            }
            else if (vSearchType === "DISTLIST")
            {
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[1 - vGridOptsOffSet], vformattedCN, 1 - vGridOptsOffSet); //CN
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[2 - vGridOptsOffSet], mvData[i].name, 2 - vGridOptsOffSet); // Name
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[3 - vGridOptsOffSet], mvData[i].role, 3 - vGridOptsOffSet); // Role
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[4 - vGridOptsOffSet], mvData[i].email, 4 - vGridOptsOffSet); // email
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[5 - vGridOptsOffSet], mvData[i].address, 5 - vGridOptsOffSet); // address
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[6 - vGridOptsOffSet], mvData[i].phone, 6 - vGridOptsOffSet); // phone
            }
            else if (vSearchType === "HIERARCHY") {
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[1 - vGridOptsOffSet], vformattedCN, 1 - vGridOptsOffSet); //CN
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[2 - vGridOptsOffSet], mvData[i].name, 2 - vGridOptsOffSet); // Name
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[3 - vGridOptsOffSet], mvData[i].address, 3 - vGridOptsOffSet); // address
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[4 - vGridOptsOffSet], mvData[i].role, 4 - vGridOptsOffSet); // Role
            }
            else if (vSearchType === "PERMIT") {
                
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[1 - vGridOptsOffSet], mvData[i].name, 1 - vGridOptsOffSet); // Name                
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[2 - vGridOptsOffSet], mvData[i].activity, 2 - vGridOptsOffSet); // Activity
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[3 - vGridOptsOffSet], mvData[i].category, 3 - vGridOptsOffSet); // Category
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[4 - vGridOptsOffSet], mvData[i].permit_type, 4 - vGridOptsOffSet); // Permit Type
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[5 - vGridOptsOffSet], mvData[i].expiry_date, 5 - vGridOptsOffSet); // Expiry  Date
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[6 - vGridOptsOffSet], mvData[i].county, 6 - vGridOptsOffSet); // County
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[7 - vGridOptsOffSet], mvData[i].district, 7 - vGridOptsOffSet); // District
            }
            else if (vSearchType === "ASSESSOR") {

                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[1 - vGridOptsOffSet], mvData[i].name, 1 - vGridOptsOffSet); // Name                
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[2 - vGridOptsOffSet], mvData[i].activity, 2 - vGridOptsOffSet); // Activity
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[3 - vGridOptsOffSet], mvData[i].category, 3 - vGridOptsOffSet); // Category
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[4 - vGridOptsOffSet], mvData[i].county, 4 - vGridOptsOffSet); // County
                GP_AddFilterItem("MemberSearch", ColsSpeed.split('¬')[5 - vGridOptsOffSet], mvData[i].review_date, 5 - vGridOptsOffSet); // Review Date
            }
        }
        
        added++;
    }
    mvSkip = mvSkip + added;
    if (mvSkip === mvData.length) mvTake = -1; // mark as done.

    /* TSA-1461 - uncheck the "Select All" box if any individual result is ticked/unticked 
     *            NOTE that this has a knock-on effect when not all results have yet been
     *                 loaded; further pages of results will load un-checked if "select all"
     *                 is not ticked.
     *                 You may then have a page or two of results all ticked (apart from one 
     *                 or more that you manually un-ticked) and then load the rest un-ticked.
     *                 TSA may veto this change. If so, we'd just need to remove this func.
     * 
     * TSA-1490 - As suspected, this change is more trouble than its worth. TSA agree that 
     *            the original implemnentation (while not logical) is easier to understand
     *            as a user. Just comment out the click function to prevent it doing anything.
     */
    //$('.msCheckItems').click(function () {
    //    $('.msCheckAll').removeAttr('checked');
    //});

    if (vIsCard)
    {
        ReSizeCards();
        ImageLoading = false;
        setTimeout(function () { ImageLoading = true; Loadimages(); }, 1000);
    }
}

var ImageLoading = false;

function ApplyCardFilter(event) {
    if (vTextFilterIDX)
        clearTimeout(vTextFilterIDX);

    if (event && (event.keyCode === 27 || !$(this).val())) {
        $(this).val('');
        vLastSearch = "";
        DoCardFilter();
    }
    else {
        vTextFilterIDX = setTimeout(function () {
            DoCardFilter();
            vTextFilterIDX = undefined;
            $("#mstr_scroll").animate({ scrollTop: 0 }, "fast");
        }, 500);
    }
}

function DoCardFilter() {    
    if ($("#txt_p1_Search").val()) {
        var query = $("#txt_p1_Search").val();
        query = $.trim(query).replace(/ or /gi, '|'); //add OR for regex query  
        $(".msCard").each(function () {
            var txt = "";
            $(".crdqry, .msMembName", this).each(function () {
                if ($(this).attr("title"))
                    txt += $(this).attr("title") + " ";
                else if ($(this).text())
                    txt += $(this).text() + " ";
                else txt += $(this).val() + " ";
            });

            if (txt.search(new RegExp(RegExp.quoteNotOR(query), "i")) < 0)
                $(this).hide();
            else
                $(this).show();
        });
    }        
    else $(".msCard").show();
}

var StopPageSize = false;
function ResizeSP() {
    if (StopPageSize) return;

    var MinBodyHeight = 30;
    var PreviewHeight = 280;
          
    if ($("#ctl00_plInnerPanel_cb_p2_email").css("display") === undefined)
        PreviewHeight -= 70;

    if ($("#lbl_p2_oversize").css("display") === "none") PreviewHeight -= (pk_val("Master.Sys.TextSize") === "1" ? 20 : -5);
    PreviewHeight -= (pk_val("Master.Sys.TextSize") === "1" ? 40 : 15);

    //0=big,1=med,2=small
    if (pk_val("Master.Sys.TextSize") === "0") PreviewHeight -= 100;
    if (pk_val("Master.Sys.TextSize") === "1") PreviewHeight -= 55;
    if (pk_val("Master.Sys.TextSize") === "2") PreviewHeight -= 105;

    if ($('#ctl00_plInnerPanel_trPersonalisation').css("display") === "none")
        PreviewHeight -= $('#ctl00_plInnerPanel_trPersonalisation').height();

    if ($('#trPersonalisation2').css("display") !== "none")
        PreviewHeight += $('#trPersonalisation2').height();

    if ($('#ctl00_plInnerPanel_trEmailAttachment').length > 0 && $('#ctl00_plInnerPanel_trEmailAttachment').css("display") !== "none")
        PreviewHeight += $('#ctl00_plInnerPanel_trEmailAttachment').height();

    var BodyHeight = $("#mstr_scroll").height() - PreviewHeight;

    if (vCurrentPageNo === 3) BodyHeight += 40;

    var NewHieght = (BodyHeight > MinBodyHeight ? BodyHeight : MinBodyHeight);
    if (NewHieght !== $("#ctl00_plInnerPanel_txt_p2_body").height())
        $("#ctl00_plInnerPanel_txt_p2_body").css("height", NewHieght + "px");

    var NewWidth = $("#mstr_scroll").width() - (pk_val("Master.Sys.TextSize") === "1" ? 270 : 280);
    if (NewWidth !== $("#ctl00_plInnerPanel_txt_p2_body").width()) {
        $("#ctl00_plInnerPanel_txt_p2_subject,#ctl00_plInnerPanel_txt_p2_body").css("width", NewWidth + "px");
        $("#fu_p2_Attachment1,#fu_p2_Attachment2").css("width", (NewWidth - 40) + "px");
    }

    if ($(".msCard").length > 0)
        $("#mstr_work").height($(".msCard").last().position().top + $(".msCard").last().height());
    else if ($(".tdData").length > 0)
        $("#mstr_work").height($(".tdData").last().position().top + $(".tdData").last().height());
}

var resizesize = 0;
function ReSizeCards(UseStyle) {
    var Style = (!UseStyle ? 1 : UseStyle);

    $(".CardSizeTable, .CardSizeSmall, .CardSizeBig").css("background-color", "transparent");
    if (Style === 1) // small
        $(".CardSizeSmall").css("background-color", "lightgray");
    else if (Style === 2) // big
        $(".CardSizeBig").css("background-color", "lightgray");
    else
        $(".CardSizeTable").css("background-color", "lightgray");

    if (resizesize === Style) return;
    resizesize = Style;

    if (Style === 1) // small
    {
        $(".msCard").each(function () { if ($(this).data("SNX")) $(".msMembName", this).text($(this).data("SNX").toString()); });
        $(".msCardImage, .msCardImageBlank").css({ "max-height": "", "max-width": "", "min-height": "", "min-width": "" });
        $(".msCardImageBlank").css({ "height": "", "width": "" });
        $(".msMembName").css({ "font-size": "" });
        $(".msCard").css({ "float": "" });
        $(".msCard").animate({ "width": "340px", "height": "125px", "min-width": "340px", "min-height": "125px", "max-width": "340px", "max-height": "125px" }, 250);
        
        $(".msCard label").each(function () {
            if ($(this).data("old_cap")) {
                $(this).text($(this).data("old_cap").replace("~~~", "<br/>").replaceAll("&amp;","&"));
            }
        });

        $(".TB").css("white-space", "nowrap");
        $(".TV").css("display", "none");
    }
    else if (Style === 2) // big
    {
        $(".msCard").each(function () {
            $(".msMembName", this).text($(this).attr("title").toString());
        });
        $(".msCardImage, .msCardImageBlank").css({ "max-height": "185px", "max-width": "200px" });
        $(".msCardImageBlank").css({ "height": "185px", "width": "185px" });
        $(".msMembName").css({ "font-size": "1.30em" });
        $(".msCard").css({ "float": "" });        
        $(".msCard").animate({ "width": "499px", "height": "245px", "min-width": "499px", "min-height": "245px", "max-width": "499px", "max-height": "245px" }, 250);

        $(".msCard label").each(function () {
            if ($(this).attr("title")) {
                $(this).data("old_cap", $(this)[0].innerHTML.replace("<br/>", "~~~").replace("<br />", "~~~"));
                $(this).text($(this).attr("title"));
            }
        });
        $(".TB").css("white-space", "normal");
        $(".TV").css("display", "block");
    }
    else // 3 table (left side card)
    {
        $(".msCard").each(function () {
            $(".msMembName", this).text($(this).attr("title").toString());
        });
        $(".msCard").css({ "float": "none" });
        $(".msCardImage, .msCardImageBlank").css({ "max-height": "", "max-width": "" });
        $(".msCardImageBlank").css({ "height": "", "width": "" });
        $(".msMembName").css({ "font-size": "1.50em" });
        $(".msCard").animate({ "width": "480px", "min-height": "125px;" }, 250);
    }
}

var ProgressCNT = 0;

function Loadimages(dontshowbusy) {
    if (!ImageLoading) return;
    if (!dontshowbusy) {
        ProgressCNT = $(".msNoImage").length;
        $(".progress-bar, #bnStopImage").show();
    }

    var IMG = $(".msNoImage").first();
    if (IMG.length === 0 || ProgressCNT === 0) {
        $(".msNoImage").attr("src", "Images/core/sil_contact.png").removeClass("msNoImage");
        $("#bnStopImage").hide();
        $(".progress-bar").hide();
        ImageLoading = undefined;
        return;
    }
    
    var Step = (100 / ProgressCNT);
    var CurProgress = $(".msNoImage").length * Step;
    $(".progress-bar-info").css("width",(100 - CurProgress) + "%");

    var SuccessFunction = function (result) {
        if (result) {
            result = $.parseJSON(result.d || result);
            $(IMG).attr("src", "data:" + result.Key + ";base64, " + result.Value).removeClass("msCardImageBlank").removeClass("msNoImage").addClass("msCardImage");
            if (resizesize === 1) $(IMG).css({ "height": "", "width": "" });
        }
        else {
            $(IMG).attr("src", "Images/core/sil_contact.png").removeClass("msNoImage");
        }
        IMG.removeAttr("cn").data("cn","");
        Loadimages('Y');
    };

    if (pk_val("Master.Sys.REST")) {
        // this is the code to run if using REST instead of JSON,
        // NOTE: subtally it is different.
        var vData = {};
        vData["ContactNumber"] = IMG.data("cn");
        PostToHandler(vData, "/Contact/Avatar", SuccessFunction, ServiceFailed, true,true);
        // End
    } else {
        $.ajax({ url: WebServicePath() + "GetAvatar?ContactNumber=" + IMG.data("cn"), async: true, success: SuccessFunction, error: ServiceFailed });
    }
}

function CheckLen(self) {
    var eOK = CheckMessageLength($(self).val().length, 'email');
    var tOK = true;
    var aOK = true;
    var sOK = true;
    if($('#ctl00_plInnerPanel_cb_p2_sms').css("display") !== "none")
        tOK = CheckMessageLength($(self).val().length, 'sms');
    if ($('#ctl00_plInnerPanel_cb_p2_alert').css("display") !== "none")
        aOK = CheckMessageLength($(self).val().length, 'alert');
    //if ($('#ctl00_plInnerPanel_cb_p2_social').css("display") != "none")
    //    sOK = CheckMessageLength($(self).val().length, 'social');

    $("#lbl_p2_oversize").css("display", (eOK && tOK && aOK && sOK ? "none" : "block"));   
}

function View(g, force) {
    if (ShowLoadingMessage())
        window.location.href = WebSitePath() + "SearchResults.aspx?Force=" + force + "&View=" + g;
}

function MakePageVisible(PageNo) {
    try {
        //PL 19.11.14
        //If no records found | too many records found, we can end up here with no PageNo set, so default to current page or fail over to p1 if that too is not set
        if (!PageNo) PageNo = (vCurrentPageNo? vCurrentPageNo : 1);
        vCurrentPageNo = parseInt(PageNo,10);
        $('.mpage').css({ "display": "none" });
        $('#mpage' + PageNo).fadeIn(200);
        $('.fpage').css({ "display": "none" });
        $('#fpage' + PageNo).css({ "display": "block" });


        if (vCurrentPageNo === 1)
            $('#div_EventOptions').css("display", "block");
        else
            $('#div_EventOptions').css("display", "none");

        if (PageNo === 2) {
            CheckLen($("#ctl00_plInnerPanel_txt_p2_body"));
            if ($("#ctl00_plInnerPanel_trSubject").css("display") !== undefined)
                $.FocusControl("#ctl00_plInnerPanel_txt_p2_subject");
            else
                $.FocusControl("#ctl00_plInnerPanel_txt_p2_body");
        }

        if (pk_val("Page.Card")) {
            if (vCurrentPageNo === 1) $(".cardresize").fadeIn();
            else $(".cardresize").fadeOut();
        }

        DoResize();
        setTimeout(DoResize, 1000);
    }
    catch (err) { }
}

function CheckReq() { ShowRequired(this); }

function ResetPage(PageNo) {
    $("input, textarea", $("#mpage" + PageNo)).not("[type='button']").not("#cb_p2_html,#ctl00_plInnerPanel_cb_p2_email,#ctl00_plInnerPanel_cb_p2_alert,#ctl00_plInnerPanel_cb_p2_sms,#ctl00_plInnerPanel_cb_p2_social,#ctl00_plInnerPanel_cb_p2_personal").each(function () { $(this).resetDB(); });
    if (PageNo === 2) {
        $("textarea, #ctl00_plInnerPanel_cb_p2_email", $("#mpage" + PageNo)).trigger("change");
        $("#fu_p2_Attachment1").replaceWith($("#fu_p2_Attachment1").clone());
        $("#fu_p2_Attachment2").replaceWith($("#fu_p2_Attachment2").clone());
        $('#fu_p2_Attachment1').change(fu1_Change);
        $('#fu_p2_Attachment2').change(fu2_Change);
        $("#ctl00_plInnerPanel_txt_p2_Attachment1").val("").data("uploaded","");
        $("#ctl00_plInnerPanel_txt_p2_Attachment2").val("").data("uploaded", "");
        file1 = undefined;
        file2 = undefined;
    }
    ResetRequired('#mpage' + PageNo);
    return false;
}

function GetSelectedCNs() {
    //for when we absolutely definitely need CNs rather than URNs
    var CNList = "";
    
    $(".msCheckItems").each(function () {
        if (CNList === "HACKED") return;
        var vIsCard = pk_val("Page.Card");
        if (($(this).parent().parent().css("display") !== "none") && ($(this).is(":checked"))) {
            var UseCN = $(this).data("cn");
            var ChecksumCN = 0;
            if (vIsCard)
                ChecksumCN = $(this).closest("table").data("cn_checksum");
            else
                ChecksumCN = $(this).closest("tr").data("cn_checksum");

            if (UseCN != (ChecksumCN ^ pk_val("Master.User.CN")))
                CNList = "HACKED"; 
            else if ((CNList + ",").indexOf("," + UseCN + ",") < 0) //made CN's unique                
                CNList += "," + UseCN;
        }
    });
  
    if (CNList !== "HACKED"&& mvData && $(".msCheckAll").is(":checked")) {
        for (var i = mvSkip; i < mvData.length; i++) {
            var UseCNx = mvData[i].contact_number;

            if ((CNList + ",").indexOf("," + UseCNx + ",") < 0) //made CN's unique                
                CNList += "," + UseCNx;
        }
    }

    if (CNList !== "HACKED" && CNList.length > 0) return CNList.substring(1); else return "";
}

function GetSelectedIDs() {
    //for when we need the URNs (which are usually but not always CNs - see Assessor & Permit Holder searches)
    var IDList = "";

    $(".msCheckItems").each(function () {
        if (IDList === "HACKED") return;
        if (($(this).parent().parent().css("display") !== "none") && ($(this).is(":checked"))) {
            var UsePK = $(this).data("urn").toString().split("_")[0];
            var ChecksumPK = $(this).closest("tr").data("urn_checksum").toString().split("_")[0];
            if (UsePK != ChecksumPK)
                IDList = "HACKED";
            else if ((IDList + ",").indexOf("," + UsePK + ",") < 0) //made ID's unique
                IDList += "," + UsePK;
        }
    });

    if (IDList !== "HACKED" && mvData && $(".msCheckAll").is(":checked")) {
        for (var i = mvSkip; i < mvData.length; i++) {
            var UseURN = mvData[i].urn.split("_")[0];
            if ((IDList + ",").indexOf("," + UseURN + ",") < 0) //made CN's unique                
                IDList += "," + UseURN;
        }
    }

    if (IDList !== "HACKED" && IDList.length > 0) return IDList.substring(1); else return "";
}

function ExportGrid() {
    if (!ShowSelectedCount(true))
        return false;

    vLastFilter = pk_val("Page.SearchData");
    var calledfrom = pk_val("Page.SearchType");  
    var SelectedCNs = GetSelectedCNs();

    if (calledfrom === "PERMIT")
        return ChooseExportOption(GetSelectedIDs(), 'CSVP', 'PDFP', pk_val("CRUD.MSEO"), pk_val("CRUD.DIST"), pk_val("Master.User.MRN"), SelectedCNs);
    else if (calledfrom === "ASSESSOR")
        return ChooseExportOption(GetSelectedIDs(), 'CSVA', 'PDFA', pk_val("CRUD.MSEO"), pk_val("CRUD.DIST"), pk_val("Master.User.MRN"), SelectedCNs);
    else if (calledfrom === "CREATEINVITEES")
        return ChooseExportOption(SelectedCNs, 'CSVCI', 'PDFCI', pk_val("CRUD.MSEO"), pk_val("CRUD.DIST"), pk_val("Master.User.MRN"), SelectedCNs);
    else if (calledfrom === "MANAGEINVITEES")
        return ChooseExportOption(SelectedCNs, 'CSVMI', 'PDFMI', pk_val("CRUD.MSEO"), pk_val("CRUD.DIST"), pk_val("Master.User.MRN"), SelectedCNs);
    else if (calledfrom === "MANAGEATTENDEES")
        return ChooseExportOption(SelectedCNs, 'CSVMA', 'PDFMA', pk_val("CRUD.MSEO"), pk_val("CRUD.DIST"), pk_val("Master.User.MRN"), SelectedCNs);
    else
        if (vLastFilter.startsWith("rol:"))
            return ChooseExportOption(SelectedCNs, 'CSVR', 'PDFR', pk_val("CRUD.MSEO"), pk_val("CRUD.DIST"), pk_val("Master.User.MRN"), SelectedCNs);
        else
            return ChooseExportOption(SelectedCNs, 'CSV', 'PDF', pk_val("CRUD.MSEO"), pk_val("CRUD.DIST"), pk_val("Master.User.MRN"), SelectedCNs);


    return false;
}

//#region Events processing

function UpdateTraining(CN, MTMNs_PK) {
    // depending on whether its come from multi module select, or multi people select (who have multi modules) different PK select is needed)
    if (CN.split(",").length > 1)
        OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTrainingMultiple.aspx?All_MTMN=' + MTMNs_PK + "&Mode=EVT_TRN&Reload=Y&YA=A", '69%', '890px', '90%', '550px', '', true, false);
    else
        OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTraining.aspx?CN=' + CN + "&Mode=EVT_TRN&EDIT=" + MTMNs_PK, '69%', '850px', '90%', '750px', '350px', true, false);
}

function AddTraining(CN) {
    if (CN.split(",").length > 1)
        OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTrainingMultiple.aspx?FromPage=TM&Mode=EVT_OGL&All_CN=' + CN + "&YA=A", '54%', '650px', '380px', '650px', '380px', true, false);
    else
        OpeniFrame(WebSitePath() + 'Popups/Maint/TrainingOGL.aspx?FromPage=EV&CN=' + CN, '54%', '550px', '400px', '550px', '400px', true, false);
}

function AddHours(CN) {
    if (CN.split(",").length > 1)
        OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTrainingMultiple.aspx?FromPage=TM&Mode=EVT_HRS&All_CN=' + CN + "&YA=A", '54%', '650px', '380px', '650px', '380px', true, false);
    else
        OpeniFrame(WebSitePath() + 'Popups/Maint/TrainingHours.aspx?FromPage=EV&CN=' + CN, '54%', '550px', '420px', '550px', '420px', true, false);
}

function UpdateTrainingPopup(EN, tr_opts, TrainingData) {
    var CN = GetSelectedCNs();
    PK = "";

    if (CN === undefined || CN.replaceAll(" ", "") === "") {
        $.system_alert("Your must select at least 1 record when updating training for multiple people.");
        return;
    }

    if (tr_opts[0] === "B" && CN.split(",").length === 1 && tr_opts.length === 3)
        tr_opts = "S" + tr_opts[1] + tr_opts[2];

    var html = "";
    var Line = "<tr class='msTR' style='height:25px;'><td class='label' style='cursor:default;'>{1}" +
        "</td><td style='width:75px;'><input style='width:80px;' type='button' value='Select' " +
        "onclick='{0}'></input></td></tr>";

    if (tr_opts[3] !== 'X' && !TrainingData) {
        // GetMemberEventTrainingModules(string pContactNumber, string pContactNumber_MD5, string pON, string pCNList, string pEN)
        $.ajax({
            url: WebServicePath() + "GetMemberEventTrainingModules?pON=" + pk_val("Master.User.ON") + "&pCNList=" + CN + "&pEN=" + EN, success: function (result) {
                if (!result.d) { UpdateTrainingPopup(PK, tr_opts + "X", undefined); }
                else {
                    var Items = "";
                    $.each(result.d, function (idx) {
                        Items += Line.format("UpdateTraining(\"" + (!this.Value ? CN : this.Value) + "\",\"" + this.Parent + "\");CloseHintPopup();", "Update - " + this.Description);
                    });
                    UpdateTrainingPopup(EN, tr_opts, Items);
                }
            }, error: ServiceFailed
        });
        return;
    }
    
    html += "<div style='overflow:auto; margin-left:10px;max-height:400px; min-width:500px;'><table style='width:100%;'>";

    //#######

    html += "<tr><td colspan='2'><h3>Ongoing Learning Options</h3></td></tr>";
    if (tr_opts[1] === '1') html += Line.format("AddHours(\"" + CN + "\");CloseHintPopup();", "Add OGL Hours" + (CN.split(',').length > 1 ? " (" + CN.split(',').length + ")" : ""));
    if (tr_opts[2] === '1') html += Line.format("AddTraining(\"" + CN + "\");CloseHintPopup();", "Add Mandatory OGL Training" + (CN.split(',').length > 1 ? " (" + CN.split(',').length + ")" : ""));
    if (tr_opts[1] === '1' || tr_opts[1] === '1') html += "<tr><td colspan='2'><br/></td></tr>";

    //#######


    if (tr_opts[3] === 'X') {
        html += "<tr><td colspan='2'><h3>Member PLP Training</h3></td></tr>";
        if (CN.split(",").length === 1)
            html += "<tr><td colspan='2'><label>This member has no relevant training</label></td></tr>";
        else
            html += "<tr><td colspan='2'><label>These members have no relevant training</label></td></tr>";
        html += "<tr><td colspan='2'></td></tr>";
    }
    else
        html += "<tr><td colspan='2'><h3>Member PLP Training</h3></td></tr>" + TrainingData + "<tr><td colspan='2'></td></tr>";

    //#######    

    html += "</div></table><br/>";

    var buttonbar = "<input type='button' value='Cancel' class='sysmsg_close'>";

    if (CN.split(",").length === 1)
        $.system_window(html, "<h2>Select Option-Single Member</h2>", buttonbar, 1);
    else
        $.system_window(html, "<h2>Select Option-Multiple Members (" + CN.split(',').length + ")</h2>", buttonbar, 1);
}

function UpdateAttendeeDetails(event_type, eventNumber, eventName) {
    var CNCount = CountSelectedItems();

    if (CNCount === 0) 
        $.system_alert("You must select at least 1 attendee to update.");
    else {
        var page = "Maint/UpdateEventAttendees.aspx?EDIT=" + eventNumber + "&ET=" + eventName + "&EVTYPE=" + event_type + "&CNs=" + GetSelectedCNs();
        OpeniFrame(WebSitePath() + 'Popups/' + page, '69%', '95%', '90%', '550px', '90%', false, false);
    }
    return false;
}

function SetInviteeStatuses() {
    $(".msCheckItems").each(function () {
        if ($(this).prop('checked')) {
            $(".msApplicantStatus", $(this).parent().parent()).val($("#cbo_invitee_statuses").val());
            $(this).removeAttr('checked');
            $(".msApplicantStatus", $(this).parent().parent()).trigger("change");
        }
    });

    return false;
}

function UpdateInviteeStatus(e, eventNumber, contactNumber) {
    var status = $(e).val();
    $.ajax({
        url: WebServicePath() + "UpdateInviteeStatus?pEN=" + eventNumber + "&pCN=" + contactNumber + "&pStatus=" + status, async: false, success: function (result) {

            $(e).parent().parent().find(".msCheckItems").each(function () {
                $(this).removeClass().addClass("msCheckItems").addClass(status);
            });

        }, error: ServiceFailed
    });

    return false;
}

var evt_isYouth = false;
function CheckMemberNo(isYouth) {
    evt_isYouth = isYouth;
    var selected = $("#txt_p1_member_number").val();

    if (!selected)
        return;
    else if ($("#msIDCB_" + selected).length > 0) {
        $("#txt_p1_member_number").val("");
        $.system_alert("This member is already in the list.", "txt_p1_member_number");
        return;
    }
    else 
        $.validate_member("EVT_MEM" + (evt_isYouth ? "_Y" : "_A"), // for validation, do both so you can msg to say not adult/youth etc.
            MemberNo_Populate,
            function () { MemberNo_Populate("", ""); $.system_alert("Not a valid member number."); },
            selected,
            pk_val("Master.User.ON"),
            -1);
}

function MemberNo_Populate(CN, Name, Age, Visibility_Status, Role, Location) {
    if (CN) {
        if ((evt_isYouth && Age > 4 && Age < 18) || (!evt_isYouth && (Age >= 18 || Age < 0))) {
            var vRow = "<tr class='msTR'><td class='tdData'>";
            vRow += "<input type='checkbox' class='msCheckItems' checked id='msIDCB_" + CN + "' data-cn='" + CN + "'/></td>";

            if (CanSeeContact(Visibility_Status, pk_val("CRUD.YTHS"), pk_val("CRUD.VULA"), pk_val("CRUD.VULY"))) {
                vRow += "<td class='tdData'><a href='MemberProfile.aspx?CN=" + CN + "' onclick='return GotoCN(" + CN + ");'>" + CN + "</a></td>";
                vRow += "<td class='tdData'><a href='MemberProfile.aspx?CN=" + CN + "' onclick='return GotoCN(" + CN + ");'>" + Name + "</a></td>";
            }
            else {
                vRow += "<td class='tdData'><label>" + CN + "</label></td>";
                vRow += "<td class='tdData'><label>" + Name + "</label></td>";
            }
            vRow += "<td class='tdData'><label >" + Role + "</label></td><td class='tdData'><label>" + Location + "</label></td>";

            if (evt_isYouth) { vRow += "<td class='tdData'><label >" + Age + "</label></td>"; }
            vRow += "</tr>";

            $("#ctl00_plInnerPanel_div_Results tbody").append(vRow);
        }
        else {
            if (evt_isYouth)
                $.system_alert("This member is an adult, and this is a youth list.", "txt_p1_member_number");
            else
                $.system_alert("This member is a youth, and this is an adult list.", "txt_p1_member_number");
        }
    }

    $("#txt_p1_member_number").val("");
}

function MemberNoClick(isYouth) {
    evt_isYouth = isYouth;
    $.member_search("EVT_MEM_" + (evt_isYouth ? "Y" : "A"),
        MemberNo_Populate,
        "Find A Member",
        pk_val("Master.User.ON"),
        -1);
    return false;
}

//#endregion

//#region Email Stuff

// set each items whether they can have personalisation on/off
var EmailPersonalisation = true;
var AlertPersonalisation = true;
var SMSPersonalisation = false;
var SMPersonalisation = false;
var PlainText = false;

function CheckHTMLVis()
{
    if ($('#ctl00_plInnerPanel_trPersonalisation').css("display") !== "none" && $("#cb_p2_html").is(":checked"))
        $("#trPersonalisation2").show();
    else
        $("#trPersonalisation2").hide();
}

function EnablePersonal(self) {
    var vEnablePers = true;

    if (!EmailPersonalisation && $("#ctl00_plInnerPanel_cb_p2_email").is(":checked")) vEnablePers = false;
    if (!AlertPersonalisation && $("#ctl00_plInnerPanel_cb_p2_alert").is(":checked")) vEnablePers = false;
    if (!SMSPersonalisation && $("#ctl00_plInnerPanel_cb_p2_sms").is(":checked")) vEnablePers = false;
    //if (!SMPersonalisation && $("#ctl00_plInnerPanel_cb_p2_social").is(":checked")) vEnablePers = false;

    // all not checked
    if (!$("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && !$("#ctl00_plInnerPanel_cb_p2_alert").is(":checked") && !$("#ctl00_plInnerPanel_cb_p2_sms").is(":checked") /*&& !$("#ctl00_plInnerPanel_cb_p2_social").is(":checked")*/)
        vEnablePers = false;

    if (vEnablePers) {
        $('#ctl00_plInnerPanel_cb_p2_personal').removeAttr("disabled");
    }
    else {
        $('#ctl00_plInnerPanel_bn_p2_data').attr("disabled", "true");
        $('#ctl00_plInnerPanel_cb_p2_personal').attr("disabled", "disabled").removeAttr('checked');
    }
    
    if ($.Is_MSIE(8) || $.Is_MSIE(9) || $.Is_CompatibilityMode())
        $("#ctl00_plInnerPanel_trEmailAttachment").css("display", "none");
    else if ($("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && $("#ctl00_plInnerPanel_trEmailAttachment").data("email"))
        $("#ctl00_plInnerPanel_trEmailAttachment").css("display", "");
    else if ($("#ctl00_plInnerPanel_cb_p2_alert").is(":checked") && $("#ctl00_plInnerPanel_trEmailAttachment").data("alert"))
        $("#ctl00_plInnerPanel_trEmailAttachment").css("display", "");
    else
        $("#ctl00_plInnerPanel_trEmailAttachment").css("display", "none");

    $('#ctl00_plInnerPanel_trPersonalisation').css("display", (vEnablePers ? "" : "none"));
    CheckHTMLVis();

    if ($("#ctl00_plInnerPanel_cb_p2_personal").is(":checked")) {
        $('#bn_p2_data,#ctl00_plInnerPanel_cbo_p2_DataField').removeAttr("disabled");
    }
    else {
        $('#bn_p2_data').attr("disabled", "disabled");
        $('#ctl00_plInnerPanel_cbo_p2_DataField').attr("disabled", "true");

        if (self && (!vEnablePers || $(self).attr("id") === "ctl00_plInnerPanel_cb_p2_personal") && HasDataTags())
            $.system_alert("You have personalised this message but have now disabled message personalisation. Please review the message 'body'.");
    }

    SetEnabled("#mpage2");
    DoResize();
}

function CountSelectedItems()
{
    var myCount = 0;
    var myCheck = "";
    var vIsCard = pk_val("Page.Card");
    $(".msCheckItems").each(function () {
        if (myCheck === "HACKED") return;
        if (($(this).parent().parent().css("display") !== "none") && ($(this).is(":checked"))) {
            var UseCN = $(this).data("cn");
            var ChecksumCN = 0;
            if (vIsCard) 
                ChecksumCN = $(this).closest("table").data("cn_checksum");
            else 
                ChecksumCN = $(this).closest("tr").data("cn_checksum");

            if (UseCN != (ChecksumCN ^ pk_val("Master.User.CN")))
                myCheck = "HACKED";
            else
                myCount += 1;
        }
    });

    if (myCheck === "HACKED") {
        return 0;
    }
    else {
        // if using cached data, then add un shows counts
        if (mvData && $(".msCheckAll").is(":checked"))
            myCount += mvData.length - mvSkip;
    }

    return myCount;
}

function CheckMessageLength(MsgLength, MsgType) {    
    var max = $("#ctl00_plInnerPanel_cb_p2_" + MsgType).data("maxcontentlength");
    
    if (max > 0) {
        if (MsgType !== "email") {
            $("#txt_prev_" + MsgType).text($("#ctl00_plInnerPanel_txt_p2_body").val().substring(0, max));
        }
        if (MsgLength > max) {
            $("#lbl_p2_" + MsgType).css("color", "red");
            //$("#ctl00_plInnerPanel_cb_p2_" + MsgType).removeAttr("checked");
            return false;
        }
        else {
            $("#lbl_p2_" + MsgType).css("color", "");
            return true;
        }
    }
    else return true;
    
}

function AddDateDelayFilter() {
    // future dates only
    var d = new Date();
    calPopup.addDisabledDates(null, formatDate(d, DisplayDateFormat));
    //calPopup.setYearSelectStart(d.getFullYear());
    calPopup.setYearStartEnd(d.getFullYear(), "");
}

function PopupDateDelaySelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddDateDelayFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function ValidateDateDelay(self) {
    if ($(self).val() === "") return true;
    calPopup.clearDisabledDates();
    AddDateDelayFilter();
    return Date_TextBox_Blur(self, 'Must be a date in the future');
}

function AddTag(tag){
    var TagData = "";
    
    if (tag === "A") TagData = "<a href='http://google.com'>Navigate To</a>";
    if (tag === "B") TagData = "<b>bold text</b>";
    if (tag === "U") TagData = "<u>underlined</u>";
    if (tag === "EM") TagData = "<em>emphasised</em>";
    if (tag === "I") TagData = "<i>italic</i>";
    if (tag === "STRIKE") TagData = "<strike>striked</strike>";
    if (tag === "STRONG") TagData = "<strong>strong</strong>";
    if (tag === "SPAN") TagData = "<span style='color:red;font-size: 1em;'>Colour Text</span>";
    if (tag === "DATE") {
        calPopup_ctrl = "h_adHocDate";
        calPopup.clearDisabledDates();
        calPopup.select(document.getElementById("h_adHocDate"), "h_adHocDate", DisplayDateFormat);
    }
        
    $("#ctl00_plInnerPanel_txt_p2_body").val($("#ctl00_plInnerPanel_txt_p2_body").val() + TagData + " ");

    if (tag !== "DATE") 
        $.FocusControl("#ctl00_plInnerPanel_txt_p2_body");
}

function AddData()
{
    $("#ctl00_plInnerPanel_txt_p2_body").val($("#ctl00_plInnerPanel_txt_p2_body").val() + "<" + $("#ctl00_plInnerPanel_cbo_p2_DataField option:selected").val().toUpperCase() + ">");
    $.FocusControl("#ctl00_plInnerPanel_txt_p2_body");
    ShowRequired($("#ctl00_plInnerPanel_txt_p2_body"));
}

function ShowSelectedCount(isExport)
{    
    var CNCount = CountSelectedItems();

    if (isExport && CNCount === 0)
    {
        $.system_alert("You must select at least 1 person when exporting data.");
        return false;
    }

    if (!isExport && CNCount === 0) {
        $.system_alert("You must select at least 1 person to send a message to.");
        return false;
    }


    if (!isExport)
        $("#ctl00_plInnerPanel_head_lblRecordCount").text("(" + CNCount + " Recipient" + (CNCount === 1 ? "" : "s") + " Selected)");
    return true;
}

function ShowResultsCount()
{
    $("#ctl00_plInnerPanel_head_lblRecordCount").text("(" + pk_val("Page.ResultCount") + " Records Found)");
}

function HasDataTags()
{
    var Tags = false;
    var html_text = $("#ctl00_plInnerPanel_txt_p2_body").val().toUpperCase();
    $("option", $("#ctl00_plInnerPanel_cbo_p2_DataField")).each(function () {
        if (html_text.indexOf("<" + $(this).val().toUpperCase() + ">") >= 0)
            Tags = true;
    });
    return Tags;
}

var validHTML = ""; // global var for holding HTML temporarily for clean up in loop.
function CleanAttributes(node) {
    $(node).each(function () {
        if (this.attributes && this.attributes.length > 0)
            $.each(this.attributes, function (index, attr) {
                if (attr.name.toLowerCase() !== "style" && attr.name.toLowerCase() !== "href") {
                    validHTML = validHTML.replaceAll(attr.name, "xxx");
                    if (attr.value) validHTML = validHTML.replaceAll(attr.value, "yyy");
                }
                // check style and href for javascript too
                if (attr.value.toLowerCase().indexOf("javascript:") >= 0 || attr.value.toLowerCase().indexOf("expression") >= 0) {
                    validHTML = validHTML.replaceAll(attr.name, "xxx");
                    if (attr.value) validHTML = validHTML.replaceAll(attr.value, "yyy");
                }
            });
        validHTML = validHTML.replaceAll(" xxx=\"yyy\"", "");
        // now go into child components and repeat.
        $.each(this.childNodes, function (index, childnode) { if (childnode) CleanAttributes(childnode); });
    });
}

function cleanHTML(orig_html_text, MSG) {
    //PL 18.12.13
    //Issue #565
    //2 problems in this routine:
    //1. Any data fields with names starting with "a" were treated as <a> tags, and thus get mangled & stop working.
    //   Fixed by assuming that all <a> tags will be of the form <a href="xxx">yyy</a>
    //2. All data fields were reverted to whatever case the related column names in their original database views use, despite us jumping through hoops elsewhere to ensure they are all UPPERCASE.
    //   Fixed by uppercasing the values pulled from the cb_p2_personal selector

    validHTML = orig_html_text;
    CleanAttributes('<label>' + orig_html_text + '</label>');
   
    // remove ALL html tags by replacing < with [.    (basically break html and only fix what we want)
    validHTML = validHTML.replace(/</g, "[").replaceAll("&lt;", "[", false).replaceAll("%3C", "[", false);
    // then put back what we think is ok

    // allow these tags on emails / alerts only
    validHTML = validHTML.replaceAll("[b>", "<b>", false).replaceAll("[b ", "<b ", false).replaceAll("[/b>", "</b>", false);
    validHTML = validHTML.replaceAll("[u>", "<u>", false).replaceAll("[u ", "<u ", false).replaceAll("[/u>", "</u>", false);
    validHTML = validHTML.replaceAll("[em>", "<em>", false).replaceAll("[em ", "<em ", false).replaceAll("[/em>", "</em>", false);
    validHTML = validHTML.replaceAll("[i>", "<i>", false).replaceAll("[i ", "<i ", false).replaceAll("[/i>", "</i>", false);
    validHTML = validHTML.replaceAll("[strike>", "<strike>", false).replaceAll("[strike ", "<strike ", false).replaceAll("[/strike>", "</strike>", false);
    validHTML = validHTML.replaceAll("[strong>", "<strong>", false).replaceAll("[strong ", "<strong ", false).replaceAll("[/strong>", "</strong>", false);
    validHTML = validHTML.replaceAll("[span>", "<span>", false).replaceAll("[span ", "<span ", false).replaceAll("[/span>", "</span>", false);
    validHTML = validHTML.replaceAll("[a>", "<a>", false).replaceAll("[a href", "<a href", false).replaceAll("[/a>", "</a>", false);//Allow for <a href=...> and <a>
        
    // if personalisation is checked, then allow the data tags
    // change the < and > so that the data tags aren't removed in the next stage of removing all unwanted html tags
    if ($("#ctl00_plInnerPanel_cb_p2_personal").is(":checked"))
    {
        $("option", $("#ctl00_plInnerPanel_cbo_p2_DataField")).each(function () {                
            validHTML = validHTML.replaceAll("[" + $(this).val().toUpperCase() + ">", "{{{" + $(this).val().toUpperCase() + "}}}", false);
        });
    }

    //blank out dodgy start and end tags
    //Start tags: looking for [ followed by one or more characters, ending with >  e.g. [badtag>
    //            (Relies on dodgy attributes already having been removed.)
    //End tags: looking for [ followed by / then one or more characters, ending with >   e.g. [/badtag>
    validHTML = validHTML.replace(/\[\w+?\>/g, "", false).replace(/\[\/\w+?\>/g, "", false);

    //put back any data tags
    validHTML = validHTML.replaceAll("{{{", "<").replaceAll("}}}", ">");

    orig_html_text = orig_html_text.replaceAll("%2F", "/").replaceAll("<~div", "<label").replaceAll("</~div", "</label");
    var Check_HTML = validHTML.replaceAll("%2F", "/").replaceAll("[~div", "<label").replaceAll("[/~div", "</label");

    if (Check_HTML.toLowerCase() !== orig_html_text.toLowerCase() && MSG)
        $.system_alert("Some invalid HTML tags or tag attributes have been removed.<br/><br/>NOTE: Only <b>href</b> and <b>style</b> are valid HTML tag attributes.<br/>only <b>B,U,EM,I,STRIKE,STRONG,SPAN,A</b> tags are allowed.");    

    return validHTML.htmlEncode();
}

function ValidateHTML(html_text){
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

    return true;
}

function DoSendEmails() {
    if (!$("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && !($("#ctl00_plInnerPanel_cb_p2_alert").is(":checked")) && !($("#ctl00_plInnerPanel_cb_p2_sms").is(":checked")) /*&& !($("#ctl00_plInnerPanel_cb_p2_social").is(":checked"))*/)
    {
        $.system_alert("No message types selected<br/>");
        return false;
    }

    if ((!$("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && !$("#ctl00_plInnerPanel_cb_p2_alert").is(":checked")) //neither emails or alerts selected
        || !pk_val("Page.AllowAttachments") // no attachments allowed at all
        || ($("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && !$("#ctl00_plInnerPanel_cb_p2_alert").is(":checked") && pk_val("Page.AllowAttachments").indexOf("E") === -1) //email only selected and email does not allow attachments
        || ($("#ctl00_plInnerPanel_cb_p2_alert").is(":checked") && !$("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && pk_val("Page.AllowAttachments").indexOf("A") === -1) //alert only selected and alert does not allow attachments
        )
    {
        RemoveAttachments();
    }

    var SelectedCNs = GetSelectedCNs();
    $("#ctl00_plInnerPanel_head_h_SelectedCNs").val(SelectedCNs);

    if (pk_val("Page.SearchType") === "PERMIT" || pk_val("Page.SearchType") === "ASSESSOR")
        $("#ctl00_plInnerPanel_head_h_ExportIDs").val(GetSelectedIDs());
    else
        $("#ctl00_plInnerPanel_head_h_ExportIDs").val(SelectedCNs);

    if ($("#ctl00_plInnerPanel_head_h_SelectedCNs").val() === "")
    {
        $.system_alert("No message recipients selected");
        return false;
    }

    if (Navigator_OnLine()) {
        // stop multiple clicks (return false)
        if (!$.Is_MSIE(7) && !$.Is_MSIE(8))
            $('#ctl00_footer_bnSend,#bnSend').click(function () {
                if (!DuplicateSendMessageShown)
                    $.system_alert("You have pressed send more than once.");
                DuplicateSendMessageShown = true;
                return false;
            });
        // and ok

        if (!ValidHTML())
            return false;

        var HTMLText = $("#ctl00_plInnerPanel_txt_p2_body").val();        
        StopPageSize = true;
        if (HTMLText) HTMLText = cleanHTML(HTMLText, false);

        $("#ctl00_plInnerPanel_txt_p2_body").val(HTMLText).css("color", $("#ctl00_plInnerPanel_txt_p2_body").css("background-color"));

        if ($("#ctl00_plInnerPanel_txt_p2_subject").val()) 
            $("#ctl00_plInnerPanel_txt_p2_subject").val($("#ctl00_plInnerPanel_txt_p2_subject").val().htmlEncode());
        
        $("#ctl00_plInnerPanel_txt_p2_subject").css("color", $("#ctl00_plInnerPanel_txt_p2_body").css("background-color"));

        ShowBusy_Main();
        $.system_hint("<br/><center><label>Messages are being added to the appropriate message queue.<br/>Please Wait...</label></center>", "<h2>Information</h2>");

        $("#divEmailPreview,#divAlertPreview,#divSMSPreview,#divSMPreview,#divEmailFrom").val("");
        $("#ctl00_plInnerPanel_head_h_CustomFrom").val($("#ctl00_plInnerPanel_head_h_CustomFrom").val().htmlEncode());

        $("#ctl00_plInnerPanel_head_txt_h_data_template_HL").val($("#ctl00_plInnerPanel_head_txt_h_data_template_HL").val().htmlEncode());
        $("#ctl00_plInnerPanel_head_txt_h_data_template").val($("#ctl00_plInnerPanel_head_txt_h_data_template").val().htmlEncode());

        __doPostBack('ctl00$plInnerPanel_foot$bnSend', ''); 
        return false;
    }

    // we have no internet
    alert("There is no internet connection at the moment. Send Cancelled.\rNOTE: try again when you have internet or cancel.");
    return false;
}

function ChooseTemplate()
{
    if (!pk_val("CRUD.MSEM")) {
        //TSA-1293: Should never have got here in the first place; kill off the email stuff and go back to the search page. CRUD is double-checked server side but may as well do it here too.
        $.system_alert("Access Denied.");
        $("#bnEmail").remove();
        MakePageVisible(1);
        return;
    }

    var calledfrom = pk_val("Page.SearchType");

    if (calledfrom === "CREATEINVITEES" || calledfrom === "MANAGEINVITEES") {
        var html = "<div style='max-height:150px; overflow:auto; margin-left:10px;'><table style='width:100%;'>";

        var templates = $("#ctl00_plInnerPanel_head_h_email_templates").val().split(',');

        for (var i = 0; i < templates.length; i++) {
            var name = templates[i].split('~')[0];
            var file = templates[i].split('~')[1];

            if (file === "AcceptEventApplication.txt")
                name += " (" + $(".ACCT").length + ")";
            else if (file === "RejectEventApplication.txt")
                name += " (" + $(".REJT").length + ")";

            html += "<tr class='msTR' style='height:25px;'><td class='label' style='cursor:default;'>" + name + "</td><td style='width:75px;'><input type='button' class='SelTemp' value='Select' data-tempname='" + templates[i].split('~')[1] + "'/></td></tr>";
        }
        html += "</table></div><br/>";

        var buttonbar = "<input type='button' value='Cancel' class='sysmsg_close'>";        

        $.system_window(html, "<h2>Select Email Template</h2>", buttonbar, 2);
        $(".SelTemp").click(function () { return GetTemplate($(this).data("tempname")); }).css("width", "80px");
    }
    else {
            GetTemplate('GenericMessage.txt');
            //ResizeSP();
            DoResize();
            setTimeout(DoResize, 1000);

    }
}

var LastEmplate = "";
function GetTemplate(template)
{
    if (template === "AcceptEventApplication.txt") {
        $(".PNDG").removeAttr("checked");
        $(".REJT").removeAttr("checked");   
    }
    else if (template === "RejectEventApplication.txt") {
        $(".PNDG").removeAttr("checked");
        $(".ACCT").removeAttr("checked");
    }
    
    var CNCount = CountSelectedItems();

    if (CNCount === 0) {
        $('.msCheckAll').removeAttr('checked');
        CloseHintPopup();
        $.system_alert("You must select at least 1 person when messaging.");
    }
    else {
        if (LastEmplate !== template) {
            LastEmplate = template;
            CloseHintPopup();
        }
        else {
            CloseHintPopup();
            MakePageVisible(2);
            return;
        }

        ShowBusy_Main();

        $.ajax({
            url: WebServicePath() + "GetEmailFromTemplate?pTemplate=" + template, async: true, success: function (result) {
                if (result.d) {
                    vMsg = JSON.parse(result.d);

                    $("#ctl00_plInnerPanel_head_h_email_template").val(vMsg.Setup.Template.Text);

                    //TSA-1582: Needed to remove .Value from vMsg.Setup.Available_Datafields[i] as this is undefined
                    for (var i = 0; i < vMsg.Setup.Available_Datafields.length; i++)
                        $('#ctl00_plInnerPanel_cbo_p2_DataField').append("<option value='" + vMsg.Setup.Available_Datafields[i] + "'>" + vMsg.Setup.Available_Datafields[i] + "</option>");

                    $('#ctl00_plInnerPanel_trPersonalisationError').css("display", "none");

                    if (!vMsg.Setup.Available_Datafields) {
                        $('#ctl00_plInnerPanel_trPersonalisation').css("display", "none");

                        // if there is no view, just hide, if there is a view, but there is a view but no cols, then there is an error so show message
                        if (vMsg.Setup.ViewName.Text)
                            $('#ctl00_plInnerPanel_trPersonalisation').css("display", "");
                    }

                    if (vMsg.Setup.PlainText.Text === "True") {
                        PlainText = true;
                        $("#Ptxt_p4_PreviewType").show();
                    }
                    else {
                        PlainText = false;
                        $("#Ptxt_p4_PreviewType").hide();
                    }

                    // show /hide HTML options
                    if (vMsg.Setup.EnableHTMLOptions.Text === "True") $(".PlainTextOpt").show();
                    else $(".PlainTextOpt").hide();

                    // show/hide Attachment options
                    if (vMsg.Setup.DoEmailAttachments.Text === "True" || vMsg.Setup.DoAlertAttachments.Text === "True") {
                        $("#ctl00_plInnerPanel_trEmailAttachment").data("email", vMsg.Setup.DoEmailAttachments.Text === "True" ? "Y" : "");
                        $("#ctl00_plInnerPanel_trEmailAttachment").data("alert", vMsg.Setup.DoAlertAttachments.Text === "True" ? "Y" : "");
                        $("#ctl00_plInnerPanel_trEmailAttachment").show();
                    }
                    else {
                        $("#ctl00_plInnerPanel_trEmailAttachment").data("email", "").data("alert", "").hide();
                    }

                    if (vMsg.Setup.DoEmailAttachments.Text !== "True") { $(".EmailATT").hide(); $("#ctl00_plInnerPanel_cb_p4_emailAtt").removeAttr("checked"); }
                    if (vMsg.Setup.DoAlertAttachments.Text !== "True") { $(".AlertATT").hide(); $("#ctl00_plInnerPanel_cb_p4_alertAtt").removeAttr("checked"); }

                    if (!vMsg.Setup.Template.Text || vMsg.Setup.DoEmail.Text === "False") {
                        $('#ctl00_plInnerPanel_cb_p2_email, #lbl_p2_email, #ctl00_plInnerPanel_trSubject').css("display", "none");
                        $('#ctl00_plInnerPanel_cb_p2_email').removeAttr('checked');
                    }
                    else {
                        $('#ctl00_plInnerPanel_cb_p2_email, #lbl_p2_email, #ctl00_plInnerPanel_trSubject').css("display", "");
                        $('#ctl00_plInnerPanel_cb_p2_email').attr('checked', 'checked');
                    }

                    if (vMsg.Setup.DoAlert.Text === "False") {
                        $('#ctl00_plInnerPanel_cb_p2_alert, #lbl_p2_alert').css("display", "none");
                        $('#ctl00_plInnerPanel_cb_p2_alert').removeAttr('checked');
                    }
                    else {
                        $('#ctl00_plInnerPanel_cb_p2_alert, #lbl_p2_alert').css("display", "");
                        $('#ctl00_plInnerPanel_cb_p2_alert').attr('checked', 'checked');
                    }

                    if (vMsg.Setup.DoSMS.Text === "False") {
                        $('#ctl00_plInnerPanel_cb_p2_sms, #lbl_p2_sms').css("display", "none");
                        $('#ctl00_plInnerPanel_cb_p2_sms').removeAttr('checked');
                    }
                    else {
                        $('#ctl00_plInnerPanel_cb_p2_sms, #lbl_p2_sms').css("display", "");
                        $('#ctl00_plInnerPanel_cb_p2_sms').attr('checked', 'checked');
                    }

                    //if (vMsg.Setup.DoSM.Text === "False") {
                    //    $('#ctl00_plInnerPanel_cb_p2_social, #lbl_p2_social').css("display", "none");
                    //    $('#ctl00_plInnerPanel_cb_p2_social').removeAttr('checked');
                    //}
                    //else {
                    //    $('#ctl00_plInnerPanel_cb_p2_social, #lbl_p2_social').css("display", "");
                    //    $('#ctl00_plInnerPanel_cb_p2_social').attr('checked', 'checked');
                    //}

                    $('#ctl00_plInnerPanel_txt_p2_subject').val(vMsg.Data.Subject.Text);
                    $('#ctl00_plInnerPanel_txt_p2_body').val(vMsg.Data.Body.Text);

                    // no items are enabled so remove email / messaging options fully:
                    if ((!vMsg.Setup.Template.Text || vMsg.Setup.DoEmail.Text === "False") && vMsg.Setup.DoAlert.Text === "False" && vMsg.Setup.DoSMS.Text === "False" && vMsg.Setup.DoSM.Text === "False")
                        _vMSEM = "";
                    MakePageVisible(2);
                    EnablePersonal();
                    $("#ctl00_plInnerPanel_cb_p2_email").trigger("change");
                }
                else {
                    MakePageVisible(1);
                    $.system_alert("There seems to be a problem with messaging at the moment, Please try again later.");
                    $("#bnEmail").hide();
                }

                CloseHintPopup();                
                HideBusy_Main();
            }, error: ServiceFailed
        });
    }
    
    return false;
}

function ValidHTML() {
    var HTMLText = $("#ctl00_plInnerPanel_txt_p2_body").val();
    if ($("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && HTMLText && !ValidateHTML(HTMLText)) {
        $.system_alert("The email message text is not valid, please ensure all HTML tags have a corresponding close tag.");
        return false;
    }
    // the length of the email / alert are different, and in theory end tags could be truncated from the alert, so check it independently
    if ($("#ctl00_plInnerPanel_cb_p2_alert").is(":checked") && HTMLText && !ValidateHTML(HTMLText)) {
        $.system_alert("The alert message text is not valid, please ensure all HTML tags have a corresponding close tag.");
        return false;
    }

    return true;
}

function PreviewMessage() {
    if (!$("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && !($("#ctl00_plInnerPanel_cb_p2_alert").is(":checked")) && !($("#ctl00_plInnerPanel_cb_p2_sms").is(":checked")) /*&& !($("#ctl00_plInnerPanel_cb_p2_social").is(":checked"))*/) {
        $.system_alert("No message types selected<br/>");
        return false;
    }

    vValid = true;
    $('input,textarea', $('#mpage2')).each(CheckReq);    
    if (!vValid) 
        return false;

    var vUseEmailText = $("#ctl00_plInnerPanel_txt_p2_body").val();
    var vUseAlertText = $("#txt_prev_alert").text();
    var vUseSMSText = $("#txt_prev_sms").text();
    //var vUseSMText = $("#txt_prev_social").text();

    if (!$("#ctl00_plInnerPanel_cb_p2_email").is(":checked")) vUseEmailText = "";
    if (!$("#ctl00_plInnerPanel_cb_p2_alert").is(":checked")) vUseAlertText = "";
    if (!$("#ctl00_plInnerPanel_cb_p2_sms").is(":checked")) vUseSMSText = "";
    //if (!$("#ctl00_plInnerPanel_cb_p2_social").is(":checked")) vUseSMText = "";

    $("#ctl00_plInnerPanel_cbo_p2_DataField option").each(function () {
        vUseSMSText = vUseSMSText.replaceAll("<" + $(this).val() + ">", "[" + $(this).val() + "]");

        if ($("#ctl00_plInnerPanel_cb_p2_personal").is(":checked")) {
            vUseEmailText = vUseEmailText.replaceAll("<" + $(this).val() + ">", "<~div class='MergeField'>[" + $(this).val() + "]</~div>").toString();
            vUseAlertText = vUseAlertText.replaceAll("<" + $(this).val() + ">", "<~div class='MergeField'>[" + $(this).val() + "]</~div>").toString();
        }
        else {
            vUseEmailText = vUseEmailText.replaceAll("<" + $(this).val() + ">", "[" + $(this).val() + "]").toString();
            vUseAlertText = vUseAlertText.replaceAll("<" + $(this).val() + ">", "[" + $(this).val() + "]").toString();
        }
    });

    if (!ValidHTML())
        return false;

    if (vUseEmailText) {
        if (PlainText)
            vUseEmailText = "<label>" + $('<div />').html(cleanHTML(vUseEmailText,true)).text().replaceAll("%2F", "/").replaceAll("[~div", "<label").replaceAll("[/~div", "</label").htmlEncode().replaceAll("%2F", "/") + "</label>";
        else
            vUseEmailText = "<label>" + $('<div />').html(cleanHTML(vUseEmailText, true)).text().replaceAll("%2F", "/").replaceAll("[~div", "<label").replaceAll("[/~div", "</label") + "</label>";
    }

    if (vUseAlertText) {
        vUseAlertText = "<label>" + $('<div />').html(cleanHTML(vUseAlertText, true)).text().replaceAll("%2F", "/").replaceAll("[~div", "<label").replaceAll("[/~div", "</label") + "</label>";
    }

    vUseSMSText = cleanHTML(vUseSMSText, false).replaceAll("%2F", "/");
    //vUseSMText = cleanHTML(vUseSMText, false).replaceAll("%2F", "/");

    $("#divEmailFrom")[0].innerHTML = "<label>" + $("#ctl00_plInnerPanel_head_h_CustomFrom").val().htmlEncode().replaceAll("%2F", "/") + "</label>";
    $("#divEmailSubject")[0].innerHTML = "<label>" + $("#ctl00_plInnerPanel_txt_p2_subject").val().htmlEncode() + "</label>";
    $("#divEmailPreview")[0].innerHTML = vUseEmailText.replaceAll("\n", "<br/>");
    $("#divAlertPreview")[0].innerHTML = "<h3>Alert - " + formatDate(new Date(), DisplayDateFormat) + "</h3><br/>" + vUseAlertText.replaceAll("\n", "<br/>");
    $("#divSMSPreview")[0].innerHTML = "<label class='ForceWrap'>" + vUseSMSText + "</label>";
    //$("#divSMPreview")[0].innerHTML = vUseSMText;

    if (!UploadFiles())
        return false;

    $(".trEmail").css("display", !vUseEmailText? "none" : "");
    $(".trAlert").css("display", !vUseAlertText ? "none" : "");
    $(".trText").css("display", !vUseSMSText ? "none" : "");
    //$(".trSM").css("display", !vUseSMText ? "none" : "");

    MakePageVisible(4);
    return false;
}

function EmailAttachclick() {
    if ($("#ctl00_plInnerPanel_cb_p4_emailAtt").is(":checked") && (file1 || file2) && $("#ctl00_plInnerPanel_cb_p4_emailAtt").css("visibility") === "visible" && pk_val("Page.AllowAttachments").indexOf("E") > -1)
        $("#tr_p4_emailAtt").show();
    else
        $("#tr_p4_emailAtt").hide();
}

function AlertAttachclick() {
    if ($("#ctl00_plInnerPanel_cb_p4_alertAtt").is(":checked") && (file1 || file2) && $("#ctl00_plInnerPanel_cb_p4_alertAtt").css("visibility") === "visible" && pk_val("Page.AllowAttachments").indexOf("A") > -1)
        $("#div_p4_alertAtt").show();
    else
        $("#div_p4_alertAtt").hide();
}

function fu1_Change(e) {
    file1 = e.target.files;
    $("#ctl00_plInnerPanel_txt_p2_Attachment1").val($(this).val()).data("uploaded", "");
}

function fu2_Change(e) {
    file2 = e.target.files;
    $("#ctl00_plInnerPanel_txt_p2_Attachment2").val($(this).val()).data("uploaded", "");
}

function RemoveAttachments()
{
    $('#bn_p2_del_attachment1').trigger('click');
    $('#bn_p2_del_attachment2').trigger('click');
}
 
function UploadFiles() {
    //TSA-646: Hardening
    if (!pk_val("Page.AllowAttachments") //Don't care what's selected; neither allow for attachments
    || (!$("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && !$("#ctl00_plInnerPanel_cb_p2_alert").is(":checked")) //neither emails or alerts selected, so forget about attachments
    || ($("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && !$("#ctl00_plInnerPanel_cb_p2_alert").is(":checked") && pk_val("Page.AllowAttachments").indexOf("E") === -1) //email only selected and email does not allow attachments
    || ($("#ctl00_plInnerPanel_cb_p2_alert").is(":checked") && !$("#ctl00_plInnerPanel_cb_p2_email").is(":checked") && pk_val("Page.AllowAttachments").indexOf("A") === -1) //alert only selected and alert does not allow attachments
    )
    {
        RemoveAttachments();
        return true;
    }

    if (!file1 && !file2) {
        EmailAttachclick();
        AlertAttachclick();
        $("#ctl00_plInnerPanel_divEmailATT,#ctl00_plInnerPanel_divAlertATT").hide();
        return true;
    }    

    if (pk_val("Page.AllowAttachments").indexOf("A") > -1) $("#ctl00_plInnerPanel_divAlertATT").show();
    if (pk_val("Page.AllowAttachments").indexOf("E") > -1) $("#ctl00_plInnerPanel_divEmailATT").show();

    var vAttSTR = "<label>" + (file1 ? "[" + file1[0].name + "]" : "") + (file1 && file2 ? " - " : "") + (file2 ? "[" + file2[0].name + "]" : "") + "</label>";
    $("#div_p4_emailAtt")[0].innerHTML = (file1 ? "<label class='email_attachment'>" + file1[0].name + bytesToSize(file1[0].size) + "</label>" : "") + (file1 && file2 ? "  " : "") + (file2 ? "<label class='email_attachment'>" + file2[0].name + bytesToSize(file2[0].size) + "</label>" : "");

    if ($("#ctl00_plInnerPanel_trEmailAttachment").data("alert"))
        $("#divAlertPreview")[0].innerHTML += "<div id='div_p4_alertAtt'><br/>Attachments : <br/>" + (file1 ? file1[0].name + bytesToSize(file1[0].size) : "") + (file1 && file2 ? "<br/>" : "") + (file2 ? file2[0].name + bytesToSize(file2[0].size) : "") + "</div>";

    EmailAttachclick();
    AlertAttachclick();

    if ($("#ctl00_plInnerPanel_txt_p2_Attachment1").data("uploaded") !== fileStamp(file1) || $("#ctl00_plInnerPanel_txt_p2_Attachment2").data("uploaded") !== fileStamp(file2))
        ShowBusy_Main();

    UploadFile(file1, true, "#ctl00_plInnerPanel_txt_p2_Attachment1");
    UploadFile(file2, true, "#ctl00_plInnerPanel_txt_p2_Attachment2");

    HideBusy_Main();
    return true;
}

function fileStamp(useFile) { return !useFile ? undefined : useFile[0].name + " - " + useFile[0].size + " - " + useFile[0].lastModifiedDate; }

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)),20);
    return " (" + Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i] + ")";
}

function UploadFile(useFile, async, ctrl, attachment_no) {
    if (!useFile) 
        return;

    // for not uploading same document again and again when doing preview    
    if ($(ctrl).data("uploaded") !== fileStamp(useFile)) {
        var vData = {}; //var data = new FormData();
        vData["0"] = useFile[0];
        vData["pCN"] = pk_val("Master.User.CN");
        
        var ReturnFunction = function (errMsg) {// error text is always called (even when ok) dont know why, using response text as marker for result.!
            HideBusy_Main();
            if (errMsg !== "OK" && errMsg.responseText !== "OK") {
                if (errMsg.statusText === "OK")
                    $.system_alert("There was a problem uploading the attachment : " + useFile[0].name + ".<br/><br/> Reason : " + errMsg.responseText, function () { MakePageVisible(2); });
                else if (errMsg.startsWith("Duplicate"))
                    $.system_alert("File " + useFile[0].name + " already exists on the server.<br/><br/>Please re-name the file and try again.", function () { MakePageVisible(2); });
                //TSA-571: Should we wish to reveal that the file type has been rejected, uncomment the next bit
                //else if (errMsg.startsWith("Invalid"))
                //    $.system_alert("There was a problem uploading the attachment : " + useFile[0].name + ".<br/><br/> Reason : " + errMsg, function () { MakePageVisible(2); });
                else if (!errMsg.responseText)
                    $.system_alert("Uploading of the attachment : " + useFile[0].name + ". has timed out.", function () { MakePageVisible(2); });
                else 
                    $.system_alert("There was a problem uploading the attachment : " + useFile[0].name + ".", function () { MakePageVisible(2); });
            }
            else if (ctrl)
                $(ctrl).data("uploaded", fileStamp(useFile));
        };

        PostToHandler(vData, "/System/CompassDownload", ReturnFunction, ReturnFunction);
    }
}

//#endregion
