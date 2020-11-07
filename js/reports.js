$.ajaxSetup({ cache: false });
var UseDifferentWindow = false; // if you want to run in seperate (so not embeded) window set this to true..
var AutoRunExport = "";//XML/CSV/PDF/MHTML/EXCEL/IMAGE/WORD
var LoadingReport = false;
var ReportNo = "";
var ReportName = "";
var iFrame = null;

$(document).ready(FormReady);

function FormReady() {
    try {
        // Page fold 
        $('.SH_DIV_BN', $('#mpage1')).each(function () { definefold($(this).attr("tabindex")); });

        MakePageVisible(1);
        FixFoldimageTop();

        // FF has issue with reports in iframs, works outside i frame though
        if ($.Is_FireFox())
            UseDifferentWindow = true;

        // cant do XSS probe for export controls if in different window.
        if (UseDifferentWindow) {
            $(".FFFix").remove();
            $(".tdh2", $(".FFFix_HDR")).text("");
        }

        $(".RREP").click(function () {
            RunReportClick($(this).closest(".msTR").data("rn"), pk_val("Master.User.MRN"), $(this).data("type") || '', $(".RCAP", $(this).parent().parent()).text());
            return false;
        });

        $(".ARPT").click(function () {
            OpeniFrame(WebSitePath() + "Popups/Maint/NewReport.aspx", "69%", "700px", "90%", "550px", "320px", true, false);
            return false;
        });

        $(".ERPT").click(function () {
            OpeniFrame(WebSitePath() + "Popups/Maint/NewReport.aspx?RepNo=" + $(this).closest(".msTR").data("rn"), "69%", "700px", "90%", "550px", "320px", true, false);
            return false;
        }).css("min-width", "55px");

        $(".DRPT").click(function () {
            //Pete 01.06.15
            //TSA-342: Work out RN outside the ajax call as $(this) goes wrong otherwise
            var vRN = $(this).closest(".msTR").data("rn");
            $.system_confirm("Delete this Report?<br/><br/>Note: This report will be removed for all people who have access to it.", function () {
                ShowBusy_Main();
                $.ajax({
                    url: WebServicePath() + "DeleteReport?pReportNumber=" + vRN,
                    success: function (result) {
                        HideBusy_Main();
                        if (!result.d) window.location.href = window.location.href;
                        else if (result.d === "-2") {
                            MakePageVisible(1);
                            $.system_alert('Delete was not successful.');
                        }
                    },
                    error: function () { HideBusy_Main(); ServiceFailed(); }
                });
            });
        }).css("min-width", "55px");

        $(".RBCK").click(function () { return MakePageVisible(1); });
        $(".msTR").AttrToData("rn");
        $(".FFFix").AttrToData("type");

        $(".popup_footer_left_div").css("width", "300px");

        ResizeSP();
        CustomResize = ResizeSP;
    }
    catch (e) {
        MakePageVisible(1);
    }
}

function ResizeSP() {
    SizeReports();
    $(".SH_DIV_BN_MPT").width($(".SH_DIV_BN_MPT").parent().width() - 75);
}

function definefold(Foldno) {
    var vData = {
        divname: "divReport" + Foldno,
        foldname: "#MPfold" + Foldno,
        key: pk_val("Page.FoldName") + Foldno
    };
    // fold click / Key Press
    $("#SH_DIV_BN_MPT" + Foldno + ",#SH_DIV_BN_MPI" + Foldno).click(vData, ShowHide).keydown(vData, ShowHide);
    // Ensure Background is transparent etc
    $("#MPfold" + Foldno).css({ "background-color": "transparent", "background-repeat": "no-repeat" });
    if (pk_val("Page.Fold" + Foldno)) {
        $("#divReport" + Foldno).hide();
        $("#MPfold" + Foldno).css({ "background-image": $(".foldimage_down").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
    }
}

function MakeLookLikePortal() {
    iFrame.find("#ParameterTable_ReportViewer1_ctl04").css("background-color", "white");

    // make the 'view report' buitton look like the rest of the portal (cant insert class tags, so have to do direct css instead
    iFrame.find("#ReportViewer1_ctl04_ctl00").css({ 'border-radius': '4px', 'border-color': '#006595', 'border-style': 'solid', 'border-width': 'thin', 'background-color': 'rgb(233, 232, 232)', 'width': '120px', 'height': '25px', 'font-size': '1.1em' }).hover(
        function () { $(this).css({ "cursor": "pointer", "background-color": "#006595", "color": "white" }); },
        function () { $(this).css({ "cursor": "", "background-color": "rgb(233, 232, 232)", "color": "black" }); }
    );
    // and change the cancel popup to look like scouts portal (cant insert class tags, so have to do direct css instead)
    $("img", iFrame.find("#ReportViewer1_AsyncWait_Wait")).first().attr("src", "/images/core/core_logo_busy_more_frames.gif").css({ "width": "65px", "height": "65px" });
    iFrame.find("#ReportViewer1_AsyncWait_Wait").css({ "background-color": "white", 'border-radius': '4px', 'border-color': '#006595', 'border-style': 'solid', 'border-width': 'thin' });
    $("a", iFrame.find("#ReportViewer1_AsyncWait_Wait")).first().css({ 'border-radius': '4px', "color": "black", 'border-color': '#006595', 'border-style': 'solid', 'border-width': 'thin', 'background-color': 'rgb(233, 232, 232)', 'width': '80px', 'height': '25px', 'font-size': '0.9em', 'text-decoration': 'none', 'padding-top': '2px', 'padding-right': '10px', 'padding-bottom': '3px', 'padding-left': '10px' }).hover(
        function () { $(this).css({ "cursor": "pointer", "background-color": "#006595", "color": "white" }); },
        function () { $(this).css({ "cursor": "", "background-color": "rgb(233, 232, 232)", "color": "black" }); }
    ).parent().css("margin-top", "13px");
}

function iFrameLoaded() {
    if (!$(this).attr("src") || $(this).attr("src") === "#") return;

    /* XML/CSV/PDF/MHTML/EXCEL/IMAGE/WORD */
    var item_idx = -1; // get idx of item we want to export 
    if (AutoRunExport === 'XML') item_idx = 0;
    if (AutoRunExport === 'CSV') item_idx = 1;
    if (AutoRunExport === 'PDF') item_idx = 2;
    if (AutoRunExport === 'MHTML') item_idx = 3;
    if (AutoRunExport === 'EXCEL') item_idx = 4;
    if (AutoRunExport === 'IMAGE') item_idx = 5;
    if (AutoRunExport === 'WORD') item_idx = 6;

    iFrame = $(this).contents();
    MakeLookLikePortal();
    $('#bn_p2_back').hide();

    // 1 second timer waiting for report to finish loading
    var timeridx = setInterval(function () {
        ResizeSP();
        // if the report has finished (check if the cancel box has gone) then:
        if (!iFrame.find("#ReportViewer1_AsyncWait_Wait").is(':visible')) {
            // kill this timer
            clearInterval(timeridx);
            var SaveEnabled = function () { return iFrame.find("#ReportViewer1_ctl05_ctl04_ctl00_ButtonLink").css('cursor') === 'pointer'; };

            // if we have data (the export button is enabled)
            if (SaveEnabled()) {
                WriteAudit(6, "Report complete (with data)", "ReportNo=" + ReportNo + (!AutoRunExport ? "" : ", Export=" + AutoRunExport), "Report Name=" + ReportName);
                if (item_idx >= 0) // basically : press the button of the export option we want..!
                    $($('a', iFrame.find("#ReportViewer1_ctl05_ctl04_ctl00_Menu"))[item_idx]).trigger('click');
                // else dont know what to press but leave page on the report page 
                ResizeSP();
            }
            else  // there was no data, and go back to page 1
            {
                WriteAudit(6, "Report complete (no data)", "ReportNo=" + ReportNo + (!AutoRunExport ? "" : ", Export=" + AutoRunExport), "Report Name=" + ReportName);
                MakePageVisible(1);
            }

            $('#bn_p2_back').show();
        }
    }, 1000);

    // need this showing as without it 
    MakePageVisible(2);
    HideBusy_Main();
}

function RunReportClick(pRepNo, PMRN, AutoRun, pRepName) {
    if (!$("#mpage2").html()) {
        $("#mpage2").html("<iframe id='report_iframe' src='#'></iframe>");
        $("#report_iframe").on("load", iFrameLoaded).css({ "width": "100%", "height": "100%", "border": "none" });
    }

    iFrame = null;

    if (!UseDifferentWindow)
        ShowBusy_Main();

    WriteAudit(6, "Report requested", "ReportNo=" + pRepNo + (!AutoRun ? "" : ", Export=" + AutoRun), "Report Name=" + pRepName);

    ReportNo = pRepNo;
    ReportName = pRepName;

    $.ajax({
        url: WebServicePath() + "ReportToken?pReportNumber=" + pRepNo + "&pMemberRoleNumber=" + PMRN,
        success: function (result) {
            if (result.d !== "-1" && result.d !== "-2" && result.d !== "-3" && result.d !== "-4") {
                AutoRunExport = "";
                if (AutoRun) {
                    AutoRunExport = AutoRun;
                    LoadingReport = true;
                    $("#report_iframe").attr('SRC', result.d);
                }
                else if (UseDifferentWindow)
                    OpenDocument(result.d);
                else {
                    LoadingReport = true;
                    $("#report_iframe").attr('SRC', result.d);
                }
            }
            else if (result.d === "-2" || result.d === "-3") {
                MakePageVisible(3);
                setTimeout(HideBusy_Main, 100);
            }
            else if (result.d === "-4") {
                //User requested a report that they are not permitted to view
                WriteAudit(6, "Report aborted: USER DOES NOT HAVE PERMISSION", "ReportNo=" + pRepNo + (!AutoRun ? "" : ", Export=" + AutoRun), "Report Name=" + pRepName);
                MakePageVisible(3);
                setTimeout(HideBusy_Main, 100);
            }
        },
        error: ServiceFailed
    });

    return false;
}

function MakePageVisible(PageNo) {
    try {
        vCurrentPageNo = PageNo;
        var TextColor = $('.menulist').css("color");
        var SelectedColor = $('h2').css("color");
        $('.mpage').css({ "display": "none" });
        $('.tabbutton').data("selected", "").css({ "background-color": "transparent", "color": TextColor });
        $('#mpage' + PageNo).fadeIn(200);
        $('#LBTN' + PageNo).css({ "background-color": SelectedColor, "color": "white" }).data("selected", "Y");
        $('.fpage').css({ "display": "none" });
        $('#fpage' + PageNo).css({ "display": "block" });
    }
    catch (err) { }
    return false;
}

var StopReportResize = false;
function SizeReports() {
    if (StopReportResize) return;

    $("html").css("font-size", GetFontSize());

    try {
        if (vCurrentPageNo === 2 && iFrame) {
            MakeLookLikePortal();
            $('#report_iframe').height($('#mstr_scroll').height() - 10);
            iFrame.find("#ParameterTable_ReportViewer1_ctl04,#ReportViewer1_ToggleParam").css("width", $("#mstr_head").width() - 30);
        }
    }
    catch (e) { }
}