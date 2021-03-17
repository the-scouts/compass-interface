var UseColor = "#78a22f";
var UseREST = false;
$(document).ready(function () {
    if (window.location.href.toLowerCase().indexOf("settings") > 0)
        formReady();
    else
        LoginReady();
});

function formReady() {
    UseWidth = "720px";
    UseMinWidth = "450px";
    UseHeight = "90%";
    UseMinHeight = "320px";
    UseTop = "2%";

    SettingsFormReady();
    var RunMode = pk_val("Page.RunMode");
    if ($.forceInline()) RunMode = "INLINE";

    if (pk_val("Page.TextSize") === "ST") {
        $("#REG1").attr("checked", "checked");
        SelectOption(undefined, undefined, "ST");
    }
    else if (pk_val("Page.TextSize") === "NT") {
        $("#REG2").attr("checked", "checked");
        SelectOption(undefined, undefined, "NT");
    }
    else {
        $("#REG3").attr("checked", "checked");
        SelectOption(undefined, undefined, "BT");
    }
    if (RunMode === "POPUP") {
        $("#INL1").attr("checked", "checked");
        SelectOption(undefined, undefined, "PC");
    }
    else {
        $("#INL2").attr("checked", "checked");
        SelectOption(undefined, undefined, "M");
    }

    if (!pk_val("Page.AllowTextSize")) $(".trSize").remove();
    if (!pk_val("Page.AllowThemeSelect")) $(".trTheme").remove();
    if (!pk_val("Page.AllowInlineOpt") || $.Is_MSIE(7) || $.Is_MSIE(8)) $(".trInline").remove();

    $(".popup-inlineframe").css("background-color", "white");

    $(".copt").click(function () { LoadCacheData(this,false); });
    $("#bnReset").click(function () {
        $.system_confirm("Reset all of your custom settings and reload this page?", function () {
            $.ajax({ url: WebServicePath() + "ReserUserSettings", async: false, success: function () { window.location.href = window.location.href; } });
        });
    });

    PopupPageReady();
    $.SetLogo(".OSLogo", pk_val("Page.ServerURN"));
    $("#popup_footer").css({ "margin-top": "0px"});
    $(".popup_footer_left_div,.popup_footer_right_div").css({ "margin-top": "-6px" });
}

var CacheList = "";
var WasDetailed;
function LoadCacheData(self, AutoRefresh) {
    DoPost = function () {
        $(".coptd, .clr").off("click");
        $("#txt_CacheContent").html("<br/><h3>System/Cache Info : Loading Data, Please Wait.....</h3><br/><br/>");
        $("body").css("cursor", "wait");

        vData["pCACHES"] = CacheList;
        if (WasDetailed) vData["pDETAILED"] = "Y";

        PostToHandler(vData, "/System/Funcs", function (pResult) {
            pResult = "<div class='SelectText' style='width:100%;background-color:#e9e8e8; padding-left:5px;'>" + pResult + "</div><br/><label>IIS Cached Data</label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input class='coptd' type='button' value='Refresh Cache Data'>&nbsp;<input id='bnHide' type='button' style='width:120px;' value='Hide Cache Info'><br/><br/>";
            $("#txt_CacheContent").html(pResult);
            $(".coptd").click(function () { LoadCacheData(this,true); });
            $("#bnHide").click(function () { $("#txt_CacheContent").html(""); CacheList = ""; WasDetailed = undefined; });
            $(".clr").click(function () {
                var f_process = function () { LoadCacheData(this, true); };

                if (pk_val("Master.Sys.REST")) {
                    PostToHandler(undefined, "/System/ResetCache", f_process);
                } else {
                    $.ajax({ url: WebServicePath() + "ResetCache", success: f_process });
                }
            });
            $("body").css("cursor", "default");
        }, function () {
            $("#txt_CacheContent").html("<br/><h3 style='color:red;'>An error occurred loading the cache data.</h3><br/><br/>");
            $("body").css("cursor", "default");
        }, true);
    };

    // now 'post' this key to the database
    var vData = {}; //var vData = new FormData();
    vData["pRoutine"] = "CacheManager";
    vData["pCN"] = pk_val("Master.User.CN");

    if ($(self).data("cachekey")) {
        vData["pCACHE"] = $(self).data("cachekey");
        if ($(self).data("key")) vData["pKEY"] = $(self).data("key");
        DoPost();
    }
    else if (AutoRefresh)
        DoPost();
    else
    {
        var html = "";
        var buttonbar = "";
        html += "<div style='overflow:auto;max-height:150px;'><table style='width:100%;'>";
        var TableOfContentsSplit = pk_val("Page.CacheList").split(',');
        $.each(TableOfContentsSplit, function (idx) {
            var vName = TableOfContentsSplit[idx];
            var vChecked = " checked='checked'";
            if (CacheList.split(',').indexOf(vName) < 0) vChecked = "";
            html += "<tr class='msTR'><td><label for='cb_" + vName + "' class='labelPoint'>" + vName + "</label></td><td style='text-align: center;'><input type='checkbox' class='CT' data-cache='" + vName + "' id='cb_" + vName + "'" + vChecked + "/></td></tr>";
        });

        html += "</table></div>";
        buttonbar += "<label class='labelPoint' for='cb_cachedetailed'>Show Detail</label>&nbsp;<input type='checkbox' id='cb_cachedetailed' " + (WasDetailed ? " checked='checked'" : "") + "/>&nbsp;<input id='bnOK' type='button' style='width:100px;' value='Show Data' class='sysmsg_bn'>&nbsp;" + ($("#txt_CacheContent").html() ? "<input id='bnClear' type='button' style='width:120px;' value='Hide Cache Info'>&nbsp;" : "") + "<input type='button' value='Cancel' class='sysmsg_close'>";

        $.system_window(html, "<h2 id='capclick' class='labelPoint' title='Click for All Checks On'>Cache Options</h2>", buttonbar, 2);
        $("#bnOK").click(function () {
            WasDetailed = $("#cb_cachedetailed").is(":checked");
            CacheList = "";
            $(".CT").each(function () {
                if ($(this).is(":checked")) {
                    if (CacheList) CacheList += ",";
                    CacheList += $(this).data("cache");
                }
            });
            DoPost();
            CloseHintPopup();
        });

        $("#capclick").click(function () { $(".CT").attr("checked", "checked"); });

        $("#bnClear").click(function () {
            $("#txt_CacheContent").html("");
            CloseHintPopup();
        });
    }
}

function SettingsFormReady() {
    $('.footerbuttongreen').hover(
        function () { $(this).css({ "backgroundColor": UseColor, "color": "#ffffff" }); },
        function () {
            $(this).css({ "backgroundColor": "#ffffff", "color": UseColor });
        });

    $(".popup-form").addClass("Popup-Inline-Border").css({ "background-color": "white" });
    if ($.Is_MSIE(8) || $.Is_MSIE(7)) $(".popup-inlineframe").css({ "background-color": "white" });
    $(".popup-inlineframe").css({ "background-image": "url('')" });
    $(".aps").click(ApplySettings);
    $(".OSLogo").click(function () { $.system_alert($(this).attr('title'), undefined, undefined, true); }).css({ "width": "240px", "height": "90px" });

    if (pk_val("Page.AllowInlineOpt")) {
        $("#INL1").click(function () { SelectOption('PC'); });
        $("#INL2").click(function () { SelectOption('M'); });
    }

    if (pk_val("Page.AllowTextSize")) {
        $("#REG1").click(function () { SelectOption('ST'); });
        $("#REG2").click(function () { SelectOption('NT'); });
        $("#REG3").click(function () { SelectOption('BT'); });
    }

    if (pk_val("Page.AllowThemeSelect"))
        $("#ctl00_workarea_cbo_theme").change(cboThemeChange).css("width", "300px");

    $("#txtOpt1").keypress(function (e) { return NumberOnly_KeyPress(e || event, function () { $(".aps").trigger("click"); }); }).css("width", "100px").blur(function () { NumberOnly_Blur(this, true, 8); });
}

function SelectOption(opt) {
    var _opts = $("#ThemeOptions").val();

    if (opt === "BT") { _opts = _opts.replaceAt(1, "0"); }
    else if (opt === "NT") { _opts = _opts.replaceAt(1, "1"); }
    else if (opt === "ST") { _opts = _opts.replaceAt(1, "2"); }
    else if (opt === "PC") { _opts = _opts.replaceAt(0, "1"); }
    else if (opt === "M") { _opts = _opts.replaceAt(0, "0"); }

    $("#ThemeOptions").val(_opts);
}

function cboThemeChange()
{
    var _opts = $("#ThemeOptions").val();
    _opts = _opts.replaceAt(2, $("#ctl00_workarea_cbo_theme").val());
    $("#ThemeOptions").val(_opts);
}

function ApplySettings() {
    if (!Navigator_OnLine()) {
        alert("There is no internet connection at the moment. Cannot Apply Settings.");
        return false;
    }

    if (pk_val("Page.AllowThemeSelect")) cboThemeChange(); // ensure theme value is selected (if available)
    var vData = {}; //var vData = new FormData();
    vData["O"] = $("#ThemeOptions").val();

    if ($("#txtOpt1").val()) {// validate credentials (if ok then allow change)
        var CallbackOK = function () {

            if ($("#pop_pw").val()) {
                var LocalFunc = function (result) {
                    if (result === "OK") {
                        vData["NC"] = $("#txtOpt1").val();
                        PostToHandler(vData, undefined);
                        window.location = WebSitePath() + "ScoutsPortal.aspx";
                    } else alert(result);
                };

                var vDataPW = {}; //var vData = new FormData();
                vDataPW["pRoutine"] = "CRED_CHECK";
                vDataPW["pCN"] = pk_val("Master.User.CN");
                vDataPW["pOPW"] = $("#pop_pw").val();
                PostToHandler(vDataPW, "/System/Funcs", LocalFunc, LocalFunc);
            }
            else $.system_alert("No password was entered.");
        };

        $.system_confirm("Please enter Password for currently logged in user to continue.<br/><br/>Password&nbsp;&nbsp;<input type='password' id='pop_pw' style='width:200px;'/>", CallbackOK);
        $.FocusControl("#pop_pw");
        $("#pop_pw").keydown(function (event) {
            var e = event || window.event; // for trans-browser compatibility
            var charCode = e.which || e.keyCode;
            if (charCode === 13) { $("#bnAlertOK").trigger("click"); }
        });
        return false;
    }

    PostToHandler(vData, undefined, function () { window.location = WebSitePath() + "ScoutsPortal.aspx"; });
    return false;
}

function LoginReady() {
    $("input").keydown(function (e) { var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0; if (key == 13) { e.preventDefault(); var inputs = $(this).closest('form').find(":input:visible:not(:disabled):not([readonly])"); idx = inputs.index(this); if (idx == inputs.length - 1) { inputs[0].select() } else $.FocusControl(inputs[idx + 1], true); } });
    $("#PW").blur(function () {if ($("#PW").val().length > 0) $("#PWE").css({ "visibility": "hidden" });else $("#PWE").css({ "visibility": "visible" });});
    if ($("#bnLogin").data("key")) {
        $("#llTitleCap").click(function () {
            UseREST = !UseREST;
            $("#llTitleCap").text("Sign in " + (UseREST ? " - [REST]" :" - [Handler]"));
        }).css("cursor","pointer");
        UseREST = true;
    }
    $("#PWE,#CNE").css({ "visibility": "visible" });
    $.FocusControl("#CN", true);

    if ($.Is_IPhone())
        setInterval(function () { $('.WorkArea').css({ 'width': '100%', 'left': '0px' }); }, 10);
    else
        setInterval(function () { $('.WorkArea').css({ 'left': (($(window).width() - $('.WorkArea').width()) / 2) - 10 }); }, 10);

    $("#PW").keydown(function (event) { if (event.keyCode == 13 && $("#PW").val() != "") { $("#bnLogin").trigger("click"); } });
    $("html").css("font-size","50%");
}

function login() {
    var haserror = false;
    if ($('#CN').val() === "") {
        $("#CNE").css({ "visibility": "visible" });
        haserror = true;
    }
    else $("#CNE").css({ "visibility": "hidden" });

    if ($('#PW').val() === "") {
        $("#PWE").css({ "visibility": "visible" });
        haserror = true;
    }
    else $("#PWE").css({ "visibility": "hidden" });

    if (haserror) return;

    var vSTR = encodeURIComponent($("#PW").val());
    $("#PW").val(vSTR);

    $('#bnLogin').css("visibility", "hidden");
    $('#CN, #PW').attr("readonly", "readonly").addClass("ReadonlyInput");
    $('#llLogin').show().text("Validating Credentials...").css("color", "green");

    var Enable = function (MSG) {
        $('#CN, #PW').removeAttr("readonly").removeClass("ReadonlyInput");;
        if (MSG) {
            $('#llLogin').show().text(MSG).css("color", "red");
            $('#bnLogin').css("visibility", "visible");
        }
        else {
            $('#llLogin').hide();
            $('#bnLogin').css("visibility", "visible");
        }
        $("#c").hide();
    };

    if (UseREST) {
        var vRESTData = function () { };
        vRESTData.prototype.MobileKey = $("#bnLogin").data("key");
        vRESTData.prototype.Password = vSTR;
        vRESTData.prototype.Username = $('#CN').val();
        vRESTData = JSON.stringify(vRESTData.prototype);

        $.ajax({
            url: "./API/Authorise",
            type: 'post',
            dataType: "json",
            async: true,
            contentType: "application/json;charset=utf-8",
            processData: false,
            data: vRESTData,
            success: function (result) {
                if (result && result.Message) {
                    Enable(result.Message);
                } else if (result && result.GUID_Token) {
                    $('#llLogin').hide();
                    window.location.href = "ScoutsPortal.aspx";
                }
                else Enable();
            },
            error: function (RR) {
                Enable(RR.statusText);
            }
        });
    } else {
        $("form").attr("action", "Login.ashx").submit();
    }
}

