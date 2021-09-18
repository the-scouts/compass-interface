$(document).ready(FormReady);

function FormReady() {
    SetUpPage(false, false);
    $("input,select").change(CheckReq);
    ResetRequired('#mpage1');    
    
    $("#bnReset").click(ResetPage);
    $("#ctl00_footer_bnSave1").attr("href", "#").click(ClientSave);

    $("#ctl00_workarea_txt_p1_training_date").blur(function () { AddTrainingDateOnlyFilter(); TrainingDate_TextBox_Blur(this); }).change(PrePopulateRenewal);
    $("#bn_p1_training_date").click(function () { PopupTrainingDateOnlySelect(this, 'ctl00_workarea_txt_p1_training_date'); });

    $("#ctl00_workarea_txt_p1_renewal_date").blur(function () { AddRenewDateFilter(); RenewalDate_TextBox_Blur(this); }).change(PrePopulateRenewal);
    $("#bn_p1_renewal_date").click(function () { PopupRenewDateSelect(this, 'ctl00_workarea_txt_p1_renewal_date'); });

    // alternative small screen size (for inline use only)
    if (!pk_UsePopup()) {
        UseTop = "5%";
        UseWidth = "550px";
        UseHeight = "400px";
        UseMinWidth = "550px";
        UseMinHeight = "400px";
    }

    setTimeout(function () { MakePageVisible(1); }, 100);
    $.FocusControl("#ctl00_workarea_cbo_p1_modules", false, 500);

    ShowOriginalSet(); // simple debug routine for checking if orig DB value is set.
    SetEnabled();
    HasChanges = false;
    vLoading = false;
}

function ResetPage() {
    $("input, textarea, select").each(function () { $(this).resetDB(); });
    ResetRequired('#mpage1');
    $.FocusControl("#ctl00_workarea_cbo_p1_modules");
    return false;
}

function CheckReq() { ShowRequired(this); }

function MakePageVisible(PageNo) {
    MakeTabVisible(PageNo);
    vCurrentPageNo = PageNo;
    if (PageNo === 1)
        $.FocusControl("#ctl00_workarea_cbo_p1_modules");
}

function ValidatePage(PageNo) {
    vValid = true;
    vReqFocused = false;

    if (PageNo === 1) {
        var OldModified = HasChanges;
        $('input,select,textarea', $('#mpage' + PageNo)).each(CheckReq);
        HasChanges = OldModified;

        // TSA-607: check if renewal date is ok before saving.
        if (vValid) if (!RenewalCheck($("#ctl00_workarea_txt_p1_renewal_date"))) vValid = false;

        return vValid;
    }

    return true;
}

function ClientSave() {
    if (!ValidatePage(vCurrentPageNo))
        return false;

    $("#ctl00_workarea_h_cbo_p1_modules").val($("#ctl00_workarea_cbo_p1_modules").val());

    if (SaveFormCheck("#ctl00_footer_bnSave1")) {
        MakeFormReadonlyForSave();
        __doPostBack('ctl00$footer$bnSave1', '');
    }
    return false;
}

function AddTrainingDateOnlyFilter() {
    calPopup.clearDisabledDates();

    var dd = new Date();
    dd.setDate(dd.getDate() + 1);

    var d = new Date();
    d.setDate(d.getDate() - 1);
    d.setYear(d.getFullYear() - 3); // remove 3 years

    calPopup.addDisabledDates(formatDate(dd, DisplayDateFormat), null);
    calPopup.addDisabledDates(null, formatDate(d, DisplayDateFormat));
    
    calPopup.setYearStartEnd(d.getFullYear(), dd.getFullYear());
}

function PopupTrainingDateOnlySelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddTrainingDateOnlyFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}

function TrainingDate_TextBox_Blur(self)
{    
    if (Date_TextBox_Blur(self, 'Only dates today or up to 3 years in the past can be entered for training.'))
    {
        //TSA-459: Don't call PrePoulate here, this is handled by the change event on the training date box.
        //PrePopulateRenewal(self);
        return true;
    }
    else
        return false;
}

function RenewalDate_TextBox_Blur(self) {

    if (Date_TextBox_Blur(self, 'Only future dates are allowed here up to 3 years in the future.'))
        return true;
    else
        return false;
}

function PrePopulateRenewal(self) {
    if (!$("#ctl00_workarea_txt_p1_renewal_date").val() && $("#ctl00_workarea_txt_p1_training_date").val()) {

        //TSA-459: Need to format the date unambiguously via the blur function before working out the +5y value, as otherwise
        //         a manually input date (rather than selected from the date picker) that is ambiguous (e.g. 10/06/15) will
        //         be interpreted as a US-formatted date, i.e. 6th Oct and the resulting calculation will be outside the 
        //         allowable bounds.
        TrainingDate_TextBox_Blur($("#ctl00_workarea_txt_p1_training_date"));

        var dd = new Date($("#ctl00_workarea_txt_p1_training_date").val());
        if (dd.toString() !== 'Invalid Date') {
            dd.setYear(dd.getFullYear() + 3);
            $("#ctl00_workarea_txt_p1_renewal_date").val(formatDate(dd, DisplayDateFormat));
        }
        ShowRequired($("#ctl00_workarea_txt_p1_renewal_date"));
    }
    else
        RenewalCheck(self);
}

function RenewalCheck(self) {
    if ($("#ctl00_workarea_txt_p1_renewal_date").val() && $("#ctl00_workarea_txt_p1_training_date").val())
    {
        var dd_now = new Date();
        var dd_renewal = new Date($("#ctl00_workarea_txt_p1_renewal_date").val());
        if (dd_renewal.toString() === 'Invalid Date') return;

        dd_renewal.setYear(dd_renewal.getFullYear() - 3);

        if (dd_renewal > dd_now) {
            $.system_alert("Renewal date cannot be greater than 3 years from the training date.", "#ctl00_workarea_txt_p1_renewal_date");
            return false;
        }
        else if ($("#ctl00_workarea_txt_p1_training_date").val()) {
            var dd_renewal_check = new Date($("#ctl00_workarea_txt_p1_renewal_date").val());

            var dd_training = new Date($("#ctl00_workarea_txt_p1_training_date").val());
            if (dd_renewal_check < dd_training) {
                dd_training.setYear(dd_training.getFullYear() + 3);
                $("#ctl00_workarea_txt_p1_renewal_date").val(formatDate(dd_training, DisplayDateFormat));
                return false;
            }
            else {
                dd_training.setYear(dd_training.getFullYear() + 3);
                if (dd_renewal_check > dd_training) {
                    $("#ctl00_workarea_txt_p1_renewal_date").val(formatDate(dd_training, DisplayDateFormat));
                    return false;
                }
            }
        }
        return true;
    }
    return false;
}

function AddRenewDateFilter() {
    calPopup.clearDisabledDates();

    var dd = ($("#ctl00_workarea_txt_p1_training_date").val() ? new Date($("#ctl00_workarea_txt_p1_training_date").val()) : new Date());
    calPopup.setYearSelectStart(dd.getFullYear());
    calPopup.addDisabledDates(null, formatDate(dd, DisplayDateFormat));

    var dd_end = ($("#ctl00_workarea_txt_p1_training_date").val() ? new Date($("#ctl00_workarea_txt_p1_training_date").val()) : new Date());
    dd_end.setYear(dd_end.getFullYear() + 3);
    dd_end.setDate(dd_end.getDate() + 1);
    calPopup.addDisabledDates(formatDate(dd_end, DisplayDateFormat), null);

    calPopup.setYearStartEnd(dd.getFullYear(), dd_end.getFullYear());
}

function PopupRenewDateSelect(thisControl, FromDate_Ctrl) {
    calPopup_ctrl = FromDate_Ctrl;
    calPopup.clearDisabledDates();
    AddRenewDateFilter();
    calPopup.select(document.getElementById(FromDate_Ctrl), FromDate_Ctrl, DisplayDateFormat);
    return false;
}