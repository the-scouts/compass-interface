$(document).ready(FormReady);

var CloseDelay = 750;

function FormReady() {
    SetUpPage(false, false);
    $("input,select").change(CheckReq);
    ResetRequired('#mpage1');
    vLoading = false;

    // alternative small screen size (for inline use only)
    if (!pk_UsePopup()) {//'54%', '550px', '400px', '550px', '400px'
        UseTop = "5%";
        UseWidth = "550px";
        UseHeight = "420px";
        UseMinWidth = "550px";
        UseMinHeight = "420px";
    }

    $("#bnReset").click(ResetPage);
    $("#ctl00_footer_bnSave1,#ctl00_footer_bnSaveAdd1").attr("href", "#").click(ClientSave);

    //PL 23.10.17 - changed message to match the actual restriction (i.e. 5 year bit was removed ages ago)
    //$("#ctl00_workarea_txt_p1_date").blur(function () { AddTrainingDateOnlyFilter(); Date_TextBox_Blur(this, 'Only dates today or in the past up to 5 years can be entered for training OGL hours.'); });
    $("#ctl00_workarea_txt_p1_date").blur(function () { AddTrainingDateOnlyFilter(); Date_TextBox_Blur(this, 'Only dates today or in the past can be entered for training OGL hours.'); });
    $("#bn_p1_date").click(function () { PopupTrainingDateOnlySelect(this, 'ctl00_workarea_txt_p1_date'); });

    $("#ctl00_workarea_txt_p1_hours").keypress(function (e) { return NumberOnly_KeyPress(e || event, undefined, [58]); }).blur(Hours_Blur);

    setTimeout(function () { MakePageVisible(1); }, 60);
    $.FocusControl("#ctl00_workarea_txt_p1_hours",false,500);
    ShowOriginalSet(); // simple debug routine for checking if orig DB value is set.
    SetEnabled();
    HasChanges = false;
}

function ResetPage() {
    $("input, textarea, select").each(function () { $(this).resetDB(); });
    ResetRequired('#mpage1');
    $.FocusControl("#ctl00_workarea_txt_p1_hours");
    return false;
}

function CheckReq() { ShowRequired(this); }

function MakePageVisible(PageNo) {
    MakeTabVisible(PageNo);
    vCurrentPageNo = PageNo;
    if (PageNo === 1)
        $.FocusControl("#ctl00_workarea_txt_p1_hours");
}

function ValidatePage(PageNo) {
    vValid = true;
    vReqFocused = false;

    if (PageNo === 1) {
        var OldModified = HasChanges;
        $('input,select,textarea', $('#mpage' + PageNo)).each(CheckReq);
        HasChanges = OldModified;

        return vValid;
    }

    return true;
}

function ClientSave() {
    if (!ValidatePage(vCurrentPageNo)) return false;
    $("#ctl00_workarea_h_cbo_p1_module").val($("#ctl00_workarea_cbo_p1_module").val());
    $("#ctl00_workarea_h_cb_p1_AddMore").val($("#ctl00_footer_cb_p1_AddMore").is(":checked") ? "Y" : "N");

    if (SaveFormCheck("#ctl00_footer_bnSave1, #ctl00_footer_bnSaveAdd1"))
    {
        MakeFormReadonlyForSave();
        __doPostBack('ctl00$footer$bnSave1', '');
    }
    return false;
}

//region removed code
//function UpdateOGLHours(ngi, year, hours, date, notes, del) {
//    var oYears = [];
//    var oYear;
//    var oYearDate;
//    var bFound = false;

//    //loop through rows on form
//    $("#tbl_p5_TrainHours tr", window.parent.document).not(":first").each(function () {

//        //if outer row
//        if ($(this).attr("data-ng_year")) {
//            var totalMins = $("td:nth-child(2)", this).find("label").html().split(':')[0] * 60;
//            totalMins += parseInt($("td:nth-child(2)", this).find("label").html().split(':')[1],10);

//            //if year equals year on form, add hours to total hours
//            if ($(this).attr("data-ng_year") === year) {

//                totalMins += hours.split(':')[0] * 60;
//                totalMins += parseInt(hours.split(':')[1],10);
//                bFound = true;
//            }

//            var totalHours = parseInt(totalMins / 60,10);
//            var remMinutes = totalMins % 60;

//            if (totalHours < 10)
//                totalHours = "0" + totalHours;

//            if (remMinutes < 10)
//                remMinutes = "0" + remMinutes;

//            //create a Year object with total hours
//            oYear = JSON.parse("{\"Year\":\"" + $(this).attr("data-NG_Year") + "\",\"Hours\":\"" + totalHours + ":" + remMinutes + "\",\"YearDates\":[]}");

//            //loop through inner detail rows on form
//            $(".SubFoldTR_" + $(this).attr("data-NG_Year"), window.parent.document).each(function () {
//                if ($("td:nth-child(5)", this).find("input").length > 0) { //not a header or footer row

//                    //create a YearDate object and add to array of oYear.YearDates
//                    //oYearDate = JSON.parse("{\"NGI\":\"" + $("td:nth-child(5)", this).find("input").attr("ng_id") + "\",\"Hours\":\"" + $("td:nth-child(2)", this).find("label").html() + "\",\"Date\":\"" + $("td:nth-child(3)", this).find("label").html() + "\",\"Notes\":\"" + $("td:nth-child(4)", this).find("label").html() + "\"}");
//                    oYearDate = JSON.parse("{\"NGI\":\"" + $("td:nth-child(5)", this).find("input").attr("ng_id") + "\",\"Hours\":\"" + $("td:nth-child(2)", this).find("label").html() + "\",\"Date\":\"" + $("td:nth-child(3)", this).find("label").html() + "\",\"Notes\":\"\"}");
//                    oYearDate.Notes = $("td:nth-child(4)", this).find("label").html();// Issue 1150 (TSA 1122): Split notes out separately to prevent JSON.parse() breaking on " characters
//                    oYear.YearDates.push(oYearDate);
//                }
//            });

//            if ($(this).attr("data-NG_Year") === year) {

//                //add new YearDate object to array
//                oYearDate = JSON.parse("{\"NGI\":\"" + ngi + "\",\"Hours\":\"" + hours + "\",\"Date\":\"" + date + "\",\"Notes\":\"" + notes + "\"}");
//                oYear.YearDates.push(oYearDate);

//                //bubblesort detail rows
//                bubbleSortDates(oYear.YearDates);
//            }

//            oYears.push(oYear);
//        }

//    });

//    //year doesn't already exist, so create new Year and YearDate objects
//    if (!bFound) {

//        oYear = JSON.parse("{\"Year\":\"" + year + "\",\"Hours\":\"" + hours + "\",\"YearDates\":[]}");
//        oYearDate = JSON.parse("{\"NGI\":\"" + ngi + "\",\"Hours\":\"" + hours + "\",\"Date\":\"" + date + "\",\"Notes\":\"" + notes + "\"}");
//        oYear.YearDates.push(oYearDate);
//        oYears.push(oYear);
//    }

//    //bubblesort years
//    bubbleSortYears(oYears);

//    //build html markup using oYears data and update form
//    var vHTML = "<table id='tbl_p5_TrainHours' style='width:100%'><thead><tr ><td class='msHeadTDCB'><h2 class='tdh2'>Year</h2></td><td class='msHeadTDCB'><h2 class='tdh2'>Total Hours</h2></td><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td></tr></thead>";

//    for (var i = 0; i < oYears.length; i++) {
//        vHTML += "<tr class='msTR TrainHoursSumLine labelPoint' data-NG_Year='" + oYears[i].Year + "'><td class='tdData' style='width:10%'><label ><a href='#' onclick='return false;'>" + oYears[i].Year + "</a></label></td><td class='tdData' style='width:150px'  id='total_" + oYears[i].Year + "'><label >" + oYears[i].Hours + "</label></td><td class='tdData' style=''  ><label ></label></td><td class='tdData' style=''  ><label ></label></td><td class='tdData' style='width:80px;'><label ></label></td></tr>";
//        vHTML += "<tr class='SubFoldTR SubFoldTR_" + oYears[i].Year + "' style='display:none'><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td><td class='msHeadTDCB' ><h2 class='tdh2'>Hours</h2></td><td class='msHeadTDCB' style='white-space: nowrap;'><h2 class='tdh2'>Date</h2></td><td class='msHeadTDCB' ><h2 class='tdh2'>Notes</h2></td><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td></tr>";
//        for (var j = 0; j < oYears[i].YearDates.length; j++) {
//            var vDelBtn = "";//"<td />";
//            if (del === "Y") {  /* TSA-655: HAve to pass a parameter to control delete buttons to avoid XSS problems */
//                vDelBtn = "<td class='tdData' style='width:80px;text-align: right;'><input type='button' class='DelHours' value='Delete' data-minutes='" +
//                    HHMMtoMin(oYears[i].YearDates[j].Hours) +
//                    "' data-ng_id='" + oYears[i].YearDates[j].NGI + "'/></td>";
//            }
//            else
//            { //TSA-654: The ADDing code relies on the delete button being present to re-display the correct data after the add. Keep a button (no class so it won't function if hacked) to preserve this.
//                vDelBtn = "<td class='tdData' style='width:80px;text-align: right;'><input type='button' value='' data-minutes='" +
//                    HHMMtoMin(oYears[i].YearDates[j].Hours) +
//                    "' data-ng_id='" + oYears[i].YearDates[j].NGI + "' style='visibility:hidden'/></td>";
//            }
//            vHTML += "<tr class='msTR SubFoldTR SubFoldTR_" + oYears[i].Year + "' style='display:none'><td class='tdData' style='width:10%'><b>&#8226;</b></td><td class='tdData' style='width:100px'><label>" + oYears[i].YearDates[j].Hours + "</label></td><td class='tdData' style='white-space: nowrap;width:100px'><label>" + oYears[i].YearDates[j].Date + "</label></td><td class='tdData'><label>" + oYears[i].YearDates[j].Notes + "</label></td>" + vDelBtn + "</tr>";
//        }
//        vHTML += "<tr class='SubFoldTR SubFoldTR_" + oYears[i].Year + "' style='display:none'><td colspan='5'><br/><br/></td></tr>";
//    }

//    vHTML += "</table>";

//    $("#divProfile12", window.parent.document).html(vHTML);

//    // re-apply events
//    window.parent.ReApplyTrainingEvents();
//}

//function HHMMtoMin(t)
//{
//    //TSA-542: Need to work out the number of minutes in a string formatted "HH:MM"
//    return ((parseInt(t.split(":")[0],10) * 60) + (parseInt(t.split(":")[1],10)))
//}

//function bubbleSortYears(a) {
//    var swapped;
//    do {
//        swapped = false;
//        for (var i = 0; i < a.length - 1; i++) {
//            if (a[i].Year < a[i + 1].Year) {
//                var temp = a[i];
//                a[i] = a[i + 1];
//                a[i + 1] = temp;
//                swapped = true;
//            }
//        }
//    } while (swapped);
//}

//function bubbleSortDates(a) {
//    var swapped;
//    do {
//        swapped = false;
//        for (var i = 0; i < a.length - 1; i++) {
//            //if (parseDate(a[i].Date) < parseDate(a[i + 1].Date)) { //comparing the output of parseDate puts them in alphanumeric order, not date order
//            if (Date.parse(a[i].Date) < Date.parse(a[i + 1].Date)) {
//                    var temp = a[i];
//                a[i] = a[i + 1];
//                a[i + 1] = temp;
//                swapped = true;
//            }
//        }
//    } while (swapped);
//}
//end region removed code

function AddTrainingDateOnlyFilter() {
    calPopup.clearDisabledDates();

    var dd = new Date();
    dd.setDate(dd.getDate() + 1);

    // NOTE: DIDNT want 5 year limitation on hours...!
    //var d = new Date();
    //d.setDate(d.getDate() - 1);
    //d.setYear(d.getFullYear() - 5); // remove 5 years

    calPopup.addDisabledDates(formatDate(dd, DisplayDateFormat), null);
    //calPopup.addDisabledDates(null, formatDate(d, DisplayDateFormat));

    //calPopup.setYearStartEnd(d.getFullYear(), dd.getFullYear());
    calPopup.setYearStartEnd(undefined,dd.getFullYear());
}

function PopupTrainingDateOnlySelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddTrainingDateOnlyFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}