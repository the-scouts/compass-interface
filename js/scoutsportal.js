var LoadingThreshold = 750;
var vFirstCount = true;
var vArchivedShown = false;
var vTextFilterIDX;
$(document).ready(FormReady);

function ResizeSP() {
    var Padding = 10;
    $("#tblMessages").css("padding-right",Padding);

    // and the scroll area is ok too..!
    var newMARGIN = $('#filteropts').width() + 20;
    if (!pk_val("Page.NoAlerts")) {
        if (parseInt($('#tblMessages').css('margin-left').replace("px"), 10) !== parseInt(newMARGIN, 10)) {
            $('#tblMessages').css('margin-left', parseInt(newMARGIN, 10).toString() + "px");
        }
    }
    else newMARGIN = 0;

    var newWidth = $('#mstr_work').width() - newMARGIN - Padding;
    if (parseInt($('#tblMessages').css('width').replace("px"), 10) !== parseInt(newWidth, 10)) {
        $('#tblMessages').css('width', parseInt(newWidth, 10).toString() + "px");
    }

    if ($("#filteropts").size() > 0) {
        $("#filteropts").height($('#mstr_scroll').height() - 20);
        positionFilter($("#divSearchFold").is(":hidden"));
    }
}

function positionFilter(Up) {
    var TitleBarHeight = parseInt(($('#menu2_bar').css("height") ? $('#menu2_bar').css("height") : "0").replace("px", ""), 10) + 32;

    if (Up)
    {
        $("#filteropts").css("top", TitleBarHeight > 70 ? "165px" : "125px");
    } else {
        $("#filteropts").css("top", TitleBarHeight > 70 ? "195px" : "160px");
    }
}

function FormReady() {
    $("#noalerthr").hide();

    if (!pk_val("Page.NoAlerts")) {
        CheckAllState();
        $("#fold").css({ "background-image": $(".foldimage_up").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });

        var vData = { divname: "#divSearchFold", foldname: "#fold", key: pk_val("Page.FoldName") + "ScoutsPortal_TopFold" };
        $("#SH_DIV_BN").click(vData,
            function (e) {
                var key = e === undefined ? 13 : e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
                if (key === 13 || e.charCode === undefined)
                    try {
                        if ($(e.data.divname).is(":hidden")) {
                            $(e.data.divname).slideDown(300, DoResize);
                            $(e.data.foldname).css({ "background-image": $(".foldimage_up").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
                            positionFilter(false);
                            SaveUserSettings(e.data.key, "");
                        }
                        else {
                            $(e.data.divname).slideUp(10, DoResize);
                            $(e.data.foldname).css({ "background-image": $(".foldimage_down").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
                            SaveUserSettings(e.data.key, "Y");
                            positionFilter(true);
                        }
                    } catch (err) { }
            });

        if (pk_val("Page.FoldUp")) {
            $("#divSearchFold").hide();
            $("#fold").css({ "background-image": $(".foldimage_down").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
            positionFilter(true);
        }
        else positionFilter(false);

        CustomResize = ResizeSP;
        $.FocusControl("#tblMessages", false, 500);

        $("#ctl00_plInnerPanel_head_tblFilter td").first().css({"width": "85px","font-size":"1.1em"});
        $("#ctl00_plInnerPanel_head_tblFilter td").last().css({ "width": "280px", "text-align": "right", "font-size": "1.1em" });
        $("#edSearch").css("width", "200px");
        $("#cboSort").css("width", "150px").attr("title", "Sort Order").html("<option selected='selected' value='5'>Priority</option><option value='1'>Date Ascending</option><option value='2'>Date Descending</option><option value='3'>Category A-Z</option><option value='4'>Category Z-A</option>").change(function () {
            SaveUserSettings(pk_val("Page.FoldName") + "ScoutsPortal_Sort", $(this).val());
            var DoWork = function () {
                ApplySort();
                ResetPagination(undefined, true);
            };
            if (mvData && mvData.length > LoadingThreshold) $("#loadingalerts").slideDown(DoWork); else DoWork();
        }).val(pk_val("Page.Sort") || "1");
        $('.alertcb').not("#cbAll").change(ApplyCBFilter);
        $("#cbAll").change(ApplyCBFilter);
        $('#edSearch').keyup(function (event) { ApplyTextFilter(event, this); }).blur(function () { ApplyTextFilter(undefined, this); });
        $("#bnShowAll").click(function () { ShowHideArchived(true, 1); });
        $("#bnShowAll2").click(function () { ShowHideArchived(true, 0); });
        $("tr", $("#tbPeople,#tbFilter")).addClass("msTR");

        setTimeout(function () {
            ShowHideArchived(false, 0);
            if (pk_val("Page.AlertCheckInterval"))
                setIntervalADV(function () { ShowHideArchived(true, 0); }, parseInt(pk_val("Page.AlertCheckInterval"), 10));
        }, 300);
    }
    else {
        $("#loadingalerts,#SH_DIV_BN,#mstr_head").remove();
        CustomResize = ResizeSP;
        $("#divSearchFold").html("<h2 style='margin-top: 3px;'>My Messages</h2>"); // for when messages are off (either no messages or < 14 etc),FYI:  only <14 for now get this at the mo
        $("#noalerthr").show();
    }
}

function Attr2Data() {
    $.AttrToData("data-cn");
    $.AttrToData("data-contactname");
    $.AttrToData("data-alerttype");
    $.AttrToData("data-dt");
    $.AttrToData("data-priority");
    $.AttrToData("data-Archived");
}

function ShowCounts() {
    var vTotal = 0;

    $(".alertcb").each(function () {
        var vCN = $(this).data("cn");
        var vAlertType = $(this).data("alerttype");

        if (vAlertType)
            try {
                vCount = mvData ? mvData.filter(function (data) {
                    return ($("#cbPerson_" + data.contact_number).length === 0 || $("#cbPerson_" + data.contact_number).is(":checked")) && data.alert_type === vAlertType && (vArchivedShown || data.historical === "N");
                }).length : 0;
                vTotal += vCount;

                oldCount = $("#lbCount_" + vAlertType).text();

                $("#lbCount_" + vAlertType).text("[" + vCount + "]");
                if ((oldCount !== ("[" + vCount + "]")) && !vFirstCount)
                    $("#lbCount_" + vAlertType).addClass("highlightLabel");
            }
            catch (e) { }

        if (vCN && $("#cbPerson_" + vCN).length > 0)
            try
            {
                vCount = mvData ? mvData.filter(function (data) {
                    return data.contact_number.toString() === vCN && (vArchivedShown || data.historical === "N");
                }).length : 0;
                oldCount = $("#lbCount_" + vCN).text();

                $("#lbCount_" + vCN).text("[" + vCount + "]");

                if ((oldCount !== ("[" + vCount + "]")) && !vFirstCount)
                    $("#lbCount_" + vCN).addClass("highlightLabel");
            }
            catch (e) { }
    });

    setTimeout(function () { $("label.highlightLabel").removeClass("highlightLabel"); }, 2000);
    $('#lbCount_All').text('[' + vTotal + ']');

    vFirstCount = false;
}

function ArchiveAlert() {
    var vButton = $(this);
    //TP-499: spec says that we need an "Are you sure?" message
    var msg = "Are you sure?";
    if (vButton.val() === "Un-Archive")
        msg = "Un-Archive this Message?";

    $.system_confirm(msg, function () {
        var vCard = vButton.closest(".alertcard");
        var UseFilteredData = GetUsableData();
        try{
        if (vButton.val() === "Remove" || vButton.val() === "Complete") {
            vButton.val("Un-Archive");

            if (!vArchivedShown) { vButton.closest(".alertcard").remove(); }
            else vCard.data("Archived", "Y");
            UseFilteredData[vCard.data("ds_idx")].historical = "Y";
        } else {
            vButton.val(parseInt(vCard.data('priority'), 10) <= 10 ? "Complete" : "Remove");
            vCard.data("Archived", "");
            UseFilteredData[vCard.data("ds_idx")].historical = "N";
        }
        }
        catch (e){}

        var DoRemove = function () {
            var CheckFilteredData = GetUsableData();
            if (!CheckFilteredData || CheckFilteredData.length === 0)
                ClearAllMessages();
            else
                ShowCounts();
        };

        if (pk_val("Master.Sys.REST")) {
            // this is the code to run if using REST instead of JSON,
            // NOTE: subtally it is different.
            var vData = {};
            vData["AlertNumber"] = vCard.attr('id').replace("A", "");
            PostToHandler(vData, "/Contact/ArchiveAlert", DoRemove, ServiceFailed,true,true);
            // End
        } else {
            $.ajax({ url: WebServicePath() + "ArchiveAlert?pCheck=" + pk_val("Master.User.JK") + "&pAlertID=" + vCard.attr('id').replace("A", "") + "&pParentCN=" + $('#cbAll').data('cn'), success: DoRemove, error: ServiceFailed });
        }
    });
}

function ShowHideArchived(FromClick, ToggleArc) {
    if (ToggleArc === 1)
    {
        $('#bnShowAll').val(vArchivedShown ? 'Show All Archived Messages' : 'Hide All Archived Alerts');
        vArchivedShown = !vArchivedShown;
    }

    var DoRecieve = function (JSON_List)
    {
        var vCurrentCount = (mvData ? mvData.length : 0);
        if (JSON_List) {
            if (JSON_List.length !== vCurrentCount)
                ResetPagination(JSON_List);

            $("#edSearch").removeAttr("readonly");
            $("#cboSort,.alertcb").removeAttr("disabled");
            $("#tbPeople label,#tbFilter label").addClass("labelPoint");
            SetEnabled();
        }
        else
            ClearAllMessages();
        $("#loadingalerts").hide();
    }

    if (pk_val("Master.Sys.REST")) {
        // this is the code to run if using REST instead of JSON,
        // NOTE: subtally it is different.
        var vData = {};
        vData["SortOrder"] = $("#cboSort").val();
        vData["IncludeArchived"] = (vArchivedShown ? "Y" : "N");
        PostToHandler(vData, "/Contact/Alerts", function (result) { DoRecieve(result); }, (FromClick ? ServiceFailed : null),true,true );
    } else {
        $.ajax({
            url: WebServicePath() + "ContactAlerts?pUseCN=" + $('#cbAll').data('cn') + "&pSortOrder=" + $("#cboSort").val() + "&pIncArc=" + vArchivedShown + "&pContactNumberList=" + pk_val("Page.CN_List"),
            success: function (result) { DoRecieve(result.d ? $.parseJSON(result.d) : ""); }, error: (FromClick ? ServiceFailed : null)
        });
    }
}

function ClearAllMessages() {
    // clear down all meeeage variables
    $("#noalerthr").show();
    $("#edSearch").attr("readonly", "readonly");
    $("#cboSort,.alertcb").attr("disabled", "disabled");
    $("#tbPeople label,#tbFilter label").removeClass("labelPoint");
    ShowCounts();
    $(".alertcard").remove();
    mvSkip = 0; //Number of skipped row (miss first row on purpose)
    mvTake = -2;
    mvData = undefined;
    SetEnabled();
}

function ResetPagination(datastr, reload) {
    if (!datastr && !reload) {
        $("#noalerthr").show();
        ShowCounts();
        return;
    }

    $("*").css("cursor", "wait");
    $("#noalerthr").hide();
    $("#ctl00_plInnerPanel_head_tblFilter").show();

    if (datastr) {
        mvData = datastr;
        if ($('#cboSort').val() !== "1")
            ApplySort();
    }
    ShowCounts();

    mvSkip = 0; //Number of skipped row (miss first row on purpose)
    mvTake = -2;
    PopulatePage();

    $("*").css("cursor", "");
    $("#loadingalerts").hide();
}

function GetUsableData() {
    var vQuery = $("#edSearch").val();
    if (vQuery)
        vQuery = $.trim(vQuery).replace(/ or /gi, '|'); //add OR for regex query

    if (!mvData.filter) { return mvData; }

    var UseFilteredData = mvData.filter(function (data) {
        if (!vArchivedShown && data.historical === "Y")
            return false;

        if (vQuery)
        {
            var vSearchSTR = RemoveAttachment(data.description);// + "¬" + data.alert_date + "¬" + data.name; // potential other search area's / items
            if (vSearchSTR.search(new RegExp(RegExp.quoteNotOR(vQuery), "i")) < 0)
                return false;
        }

        if (($("#cbPerson_" + data.contact_number).length === 0 || $("#cbPerson_" + data.contact_number).is(":checked")) &&
            $("#cb" + data.alert_type).is(":checked"))
            return true;

        return false;
    });
    return UseFilteredData;
}

function PopulatePage() {
    // no data
    if (!mvData || mvData.length === 0)
        return;

    // have pagination
    if (mvTake === -2) {
        mvTake = parseInt(pk_val("Page.Take"), 10);
        $(".alertcard").remove();
        $("#tblMessages").animate({ scrollTop: 0 }, "fast");
    }

    if (mvSkip === 0 && mvTake < mvData.length) {
        $("#mstr_scroll").scroll(function () {
            if (mvTake > 0 && mvTake < mvData.length && $("#mstr_scroll").scrollTop() >= $("#tblMessages").height() - $("#mstr_scroll").height()) {
                PopulatePage();
            }
        });
    }

    var added = 0;
    var StartPos = mvSkip;
    var offset = 0;
    var UseFilteredData = GetUsableData();
    for (var i = StartPos; i < UseFilteredData.length; i++) {
        if (StartPos >= UseFilteredData.length || i > UseFilteredData.length) {
            mvTake = -1;
            break;
        }

        LoadCard(UseFilteredData[i], i);
        added++;

        if (added === mvTake) break;
    }
    mvSkip = mvSkip + added;
    if (mvSkip === UseFilteredData.length) mvTake = -1; // mark as done.
    Attr2Data();
    DoResize();
}

function RemoveAttachment(pText) {
    return pText.replace("OpenAttachment(", "").replace(");return false;", "").replaceAll("\"", "").replace('<a href="#">', "").replaceAll('</a>', "");

    // this is remove attachment (whole bit) from search criteria
    //var idx = pText.indexOf("Attachments : <br/>");
    //if (idx < 0)
    //    return pText;

    //return pText = pText.substring(0, idx);
}

function LoadCard(itemData, idx) {
    var xCard = "<table data-Archived='{8}' id='{6}' class='alertcard{12}' data-alerttype='{0}' data-dt='{2}' data-priority='{9}' data-cn='{10}' style='width:100%;'><tr><td {5} style='vertical-align:top;{4}'><h3>{1} - {2}{11}</h3><br /><label class='ATD' style='position:relative; margin-left:0px;'>{3}</label></td><td style='vertical-align:top;text-align:right; width:50px;margin-top:10px;'><input type='button' class='REMAL' value='{7}' style='z-index:1;'></td></tr></table>";

    if ($("#A" + itemData.member_alert_number).length === 0) {
        var vDT = new Date(itemData.alert_date);
        var cardHTML = xCard.format(itemData.alert_type, itemData.alert_description, formatDate(vDT, DisplayDateFormat), itemData.description.replace(/''/g, "'"),
            (itemData.link_url ? "cursor: pointer;" : ""),
            (itemData.link_url ? "onclick='if (ShowLoadingMessage()) {window.location.href=\"" + itemData.link_url + (itemData.link_url.indexOf("CN=") > 0 ? "" : (itemData.link_url.indexOf("?") > 0 ? "&" : "?") + "CN=" + itemData.contact_number) + "\"} else return false;'" : ""),
            "A" + itemData.member_alert_number, itemData.historical === "Y" ? "Un-Archive" : (parseInt(itemData.priority, 10) <= 10 ? "Complete" : "Remove"),
            itemData.historical, itemData.priority, itemData.contact_number, (pk_val("Page.NoName") ? "":" - " + itemData.name), (itemData.link_url ? " alertcardhover" : ""));
        try {
            $("#tblMessages").append(cardHTML);
            $("a", $(".REMAL").last().click(ArchiveAlert).closest(".alertcard").attr("data-ds_idx", idx)).each(function () {
                var vClickText = $(this).attr("onclick");
                if (vClickText && vClickText.indexOf("OpenAttachment") >= 0)
                {
                    var vFileName = vClickText.replace("OpenAttachment(", "").replace(");return false;", "").replaceAll("\"", "");
                    $(this).removeAttr("onclick").click(function () { OpenAttachment(vFileName.split(",")[0], vFileName.split(",")[1]); return false; });
                }
            });
        }
        catch (e) { }
    }
}

function ApplyCBFilter() {
    var self = this;
    var fromall = $(self).attr("id") === "cbAll";

    var DoWork = function () {

        if (fromall) {
            if ($(self).is(":checked"))
                $('.alertcb:not(.alertcn)').not("#cbAll").prop('checked', 'checked');
            else
                $('.alertcb:not(.alertcn)').not("#cbAll").removeAttr('checked');

            $('.alertcb:not(.alertcn)').not("#cbAll").each(function () { SaveUserSettings(pk_val("Page.FoldName") + $(this).attr("id"), $(this).is(":checked") ? "Y" : "N"); });
        }

        ResetPagination(undefined, true);

        if (!fromall) {
            // check state of all checkbox
            CheckAllState();
            SaveUserSettings(pk_val("Page.FoldName") + $(self).attr("id"), $(self).is(":checked") ? "Y" : "N");
        }
    };

    if (fromall || (mvData && mvData.length > LoadingThreshold))
        $("#loadingalerts").slideDown(DoWork);
    else
        DoWork();
}

function CheckAllState() {
    var vCheckedCNT = 0;
    var vTotalCNT = 0;
    $('.alertcb:not(.alertcn)').not("#cbAll").each(function () {
        if ($(this).is(":checked")) vCheckedCNT++;
        vTotalCNT++;
    });
    if (vCheckedCNT === vTotalCNT)
        $('#cbAll').prop('checked', 'checked');
    else
        $('#cbAll').removeAttr('checked');
}

function ApplySort()
{
    // no data, so do nothing
    if (!mvData) return;

    // sort does not exist  (in JS) so simply remove option from page
    if (!mvData.sort)
    {
        $("#cboSort").parent().html("");
        return;
    }

    // set default soirt (if none exists)
    if (!$("#cboSort").val()) { $("#cboSort").val("5"); }

    if ($("#cboSort").val() === "1" || $("#cboSort").val() === "2") { sortDirection = ($("#cboSort").val() === "1" ? 1 : -1); }
    else if ($("#cboSort").val() === "5" || $("#cboSort").val() === "6") { sortDirection = ($("#cboSort").val() === "5" ? 1 : -1); }
    else { sortDirection = ($("#cboSort").val() === "3" ? 1 : -1); }

    mvData.sort(function (a_Data, b_Data) {
        var a_Key;
        var b_Key;

        if ($("#cboSort").val() === "1" || $("#cboSort").val() === "2") {
            a_Key = new Date(a_Data.alert_date);
            b_Key = new Date(b_Data.alert_date);
        }
        else if ($("#cboSort").val() === "5" || $("#cboSort").val() === "6") {
            a_Key = a_Data.priority;
            b_Key = b_Data.priority;
        }
        else {
            a_Key = a_Data.alert_type;
            b_Key = b_Data.alert_type;
        }

        if (a_Key < b_Key) return -sortDirection;
        if (a_Key > b_Key) return sortDirection;
        return 0;
    });
}

function ApplyTextFilter(EVT, self) {
    if (!mvData) return;

    if (vTextFilterIDX)
        clearTimeout(vTextFilterIDX);

    if (EVT && (EVT.keyCode === 27 || !$(self).val())) {
        $(self).val('');
        vLastSearch = "";
        ResetPagination(undefined, true);
    }
    else {
        vTextFilterIDX = setTimeout(function () {
            ResetPagination(undefined, true);
            vTextFilterIDX = undefined;
        }, 500);
    }
}