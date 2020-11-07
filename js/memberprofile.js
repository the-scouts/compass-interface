var vCurrentPageNo = 1;
var vEditing = false;
var timer;

$(document).ready(FormReady);

function FormReady() {
    $("msTRRL").AttrToData("comap").AttrToData("pk");
    var LoadingPage = pk_val("Page.LoadAllPages") ? undefined : parseInt(pk_val("Nav.StartPage"),10);// -1 for all pages
    // tab menu navigation
    $(".tabitem").css({ "visibility": "hidden" });
    $(".tabbutton").each(function () {
        var ButtonNo = $(this).attr("id").replace("LBTN", "");

        $(this).click(function () {
            if (pk_val("Page.LoadAllPages"))
                ChangePage(vCurrentPageNo, parseInt(ButtonNo, 10));
            else {
                // disable form features
                $("select, input[type='radio'], input[type='checkbox'], a").attr("disabled", "disabled");
                $("input,textarea").attr("readonly", "readonly");
                $(".DateLookupButton, .QuickSearchButton, .rfv, .W3C, .InfoButton, .footerbutton, .closepopevt, input[type='button']").remove();

                // redirect (to requested tab)
                window.location.href = WebSitePath() + "MemberProfile.aspx?CN=" + pk_val("Page.UseCN") + ($(this).data("pn") ? "&Page=" + $(this).data("pn") : "")+"&TAB";
            }
        });
    }).AttrToData("pn");

    // footer defaults
    $(".fpage").not(".hideme").css({ "min-height": "30px", "height": "auto" });
    $(".btnL").css({ "float": "left", "min-height": "27px;" });
    $(".EbtnL").css({ "float": "right", "margin-right": "10px", "width": "60px" });
    $(".PDFbtnL").css({ "float": "right", "margin-right": "10px", "width": "105px" });
    $(".SH_DIV_BN").css({ "cursor": "pointer", "min-height": "24px", "padding-bottom": "3px", "padding-top": "1px;" });
    $(".EPC").css("width", "60px");

    // edit profile clicks (all pages)
    $(".EPC").each(function () {
        var ButtonNo = $(this).attr("id").replace("bnEP", "");
        $(this).click(function () { EditProfile(parseInt(ButtonNo, 10)); return false; });
    });

    // PDF clicks
    $(".PDFE").each(function () {
        var ButtonNo = $(this).attr("id").replace("bnPDF", "");
        $(this).click(function () { SendtoPDF(parseInt(ButtonNo, 10)); return false; });
    });

    if (!LoadingPage || LoadingPage === 1)
        $(".PICLK").click(UpdateProfileImage).css("cursor", "pointer");

    $(".clicktitle").click(ReLoadPage);

    // on tab 3 and 5 (dev role popup clicks)
    if ($("#mpage3").length > 0 || $("#mpage5").length > 0) {
        $(".EDITRL").click(function () {
            OpeniFrame(WebSitePath() + "Popups/Maint/NewRole.aspx?EDIT=" + $(this).data("ng_id"), '69%', '890px', '90%', '550px', '', true, false);
            return false;
        });
        $(".VIEWRL").click(function () {
            OpeniFrame(WebSitePath() + "Popups/Maint/NewRole.aspx?VIEW=" + $(this).data("ng_id"), '69%', '890px', '90%', '550px', '', true, false);
            return false;
        });
    }

    // roles tab
    if ($("#mpage3").length > 0) {
        $("#bnAddRole").click(AddRole);
        $("#bnEndMemb").click(EndMembership);
        $("#bnEndRole").click(EndRoles);
        $("#bnSuspendRole").click(SuspendRoles);
        $("#bnApprRejSusp").click(ApprRejSusp);
        $("#bnOrder").click(SetOrderPreference);
        $("#bnCancelOrder").click(CancelOrderPreference);
        $("#bnSaveOrder").click(SaveOrderPreference);

        $(".VIEWHR").AttrToData("ng_id").AttrToData("lvl");
        $(".EDITHR").AttrToData("ng_id").AttrToData("lvl");
        $(".EDITRL").AttrToData("ng_id");
        $(".VIEWHR").AttrToData("ng_id");

        $(".EDITHR").click(function () {
            ViewOrg($(this).data("lvl"), $(this).data("ng_id"), "EDIT");
            return false;
        });
        $(".VIEWHR").click(function () {
            ViewOrg($(this).data("lvl"), $(this).data("ng_id"), "VIEW");
            return false;
        });
        $(".EDITMRN").click(EditRole);
        $(".VIEWMRN").click(ViewRole);
        $(".VIEWROLE").css("min-width", "55px");

        $(".ENDMRN").click(EndRole);
        $(".SUSPMRN").click(SuspendRole).css("min-width", "75px");
        $(".USUSPMRN").click(UnSuspendRole);
        $(".REJMRN").click(RejectRole);

        $(".RoleTop").click(MoveTop).css({ "width": "100px", "margin-right": "5px" });
        $(".RoleUp").click(function () { return MoveUp(this); }).css({ "min-width": "55px", "margin-right": "5px" });
        $(".RoleDown").click(MoveDown).css({ "min-width": "55px" });

        $('.msRoleCheckAll').click(function () {
            if ($(this).is(":checked")) {
                $(".msMRNCheckItems").each(function () {
                    if ($(this).parent().parent().css("display") !== "none")
                        $(this).prop('checked', 'checked');
                    else
                        $(this).removeAttr('checked');
                });
            }
            else
                $(".msMRNCheckItems").removeAttr('checked');
        });
        HideOrderPreferenceButtons();
        $(".EDITROLE", $("#mpage3")).css({ "display": "none" });
        AddGridSortData("tbl_p3_roles");
    }

    // permit tab
    if ($("#mpage4").length > 0) {
        $("#bnAddPermit").click(AddPermit);
        $("#bnRecommendPermit").click(RecommendPermit);
        $(".VPERM").click(function () { ViewPermit($(this).closest("tr").data("pk")); return false; });
        $(".UPDATEPERMIT").click(function () { UpdatePermit($(this).closest("tr").data("pk")); return false; });
        $(".REVOKEPERMIT").click(function () { OpeniFrame(WebSitePath() + "Popups/Maint/RevokePermit.aspx?CN=" + pk_val("Page.UseCN") + "&PN=" + $(this).closest("tr").data("pk"), '62%', '550px', '450px', '550px', '450px', true, false); return false; });
        $(".msTRPERM").AttrToData("pk");

        $("#cb_p4_expired").click(function () { HideShowPermit(this, "expired"); });
        $("#cb_p4_revoked").click(function () { HideShowPermit(this, "revoked"); });

        HideShowPermit($("cb_p4_expired"), 'expired');
        HideShowPermit($("cb_p4_revoked"), 'revoked');

        AddGridSortData("tbl_p4_permits");
        AddGridSortData("tbl_p4_inprogress");

        // highlight columns when hovering the grid title TD (top grid on permits)
        $('.msHeadTD', $("#tbl_p4_permits")).hover(
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')', $("#tbl_p4_permits")).addClass("Grid_HL"); },
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')', $("#tbl_p4_permits")).removeClass("Grid_HL"); });

        // highlight columns when hovering the grid title TD (bottom grid on permits)
        $('.msHeadTD', $("#tbl_p4_inprogress")).hover(
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')', $("#tbl_p4_inprogress")).addClass("Grid_HL"); },
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')', $("#tbl_p4_inprogress")).removeClass("Grid_HL"); });
    }

    // Disclosure tab
    if ($("#mpage12").length > 0) {
        $("#bnReqDisc").click(function () { ReqDisclosure(); return false; });
        AddGridSortData("tbl_p12_disclosures");
    }

    // nomination tab
    if ($("#mpage6").length > 0) {
        $("#bn_p5_Nominate").click(AwardNominate);

        if (!pk_val("User.IsMe")) {
            $("#bn_p5_Nominate").text("Nominate this member");
            $("#h2_NominationTitle").text("Nominations for member");
        }
        else {
            $("#bn_p5_Nominate").text("Nominate another member");
            $("#h2_NominationTitle").text("Nominations made");
        }
        if ((pk_val("CRUD.AWAA") !== "U" && (!pk_val("Page.Croc") && !pk_val("User.IsMe"))) || !pk_val("Page.EnableAwards")) {
                //$("#bn_p5_Nominate").css("display", "none");
            $("#bn_p5_Nominate").remove();
            $("#fpage6").addClass("hideme");
        }

        if (pk_val("Page.HideNominations")) {
            $("#divNominations").remove();
            $("#hrNominations").remove();
        }
        if (pk_val("Page.ShowArcNom"))
            $("#chkArcNom").prop("checked", true);
        $("#chkArcNom").click(ShowHideArchivedNominations);
        ShowHideArchivedNominations(true);
    }

    // training tab
    if ($("#mpage5").length > 0) {
        $("#AddMOGL").click(AddTrainingModules);
        $("#AddOGL").click(AddTrainingHours);
        $(".SHPLP").click(ShowHidePLP);

        $(".trnADD").click(function () { AddTraining($(this).closest(".MEMBTRNDIV").data("pk")); }).css("width", "130px");

        $(".TRN_UPDATE2").click(function () {
            var ID = $(this).closest(".msTR").data("pk");
            UpdateTraining(ID, $(this).closest(".msTR").data("vb") === "Y", false);
        }).css("width", "70px");

        $(".TRN_DELETE1").click(DeleteTraining).css("width", "70px");

        $(".TRN_UPDATE1").click(function () {
            var ID = $(this).closest(".msTR").data("pk");
            var MRN = $(this).closest(".msTR").data("mrn");
            UpdateTraining(ID, false, true, MRN);
        }).css("width", "70px");

        $(".TRN_VIEW1").click(TRN_VIEW1_Click).css("width", "70px");

        $(".TRN_VIEW").click(function () {
            var ID = $(this).closest(".msTR").data("pk");
            UpdateTraining(ID, true, false);
        }).css("width", "70px");

        $(".MOGL_DELETE").click(function () { DeleteMOGL($(this).data("pk"), $(this).closest("tr"), $(this).data("OGLcode")); }).AttrToData("pk").AttrToData("OGLcode");

        $("#lit_ALLPLP").text($(".trAllMTMN").size() > 0 ? " (" + $(".trAllMTMN").size() + ")" : "");
        $("#lit_PLP").text($(".MEMBTRNDIV").size() > 0 ? " (" + $(".MEMBTRNDIV").size() + ")" : "");

        $("#tbl_p5_AllTrainModules .msTR").AttrToData("pk").AttrToData("vb");
        $(".PPLP").click(PrintPLP).css("width", "130px");
        $(".RWOOD").click(RecomendWood).css("width", "175px");
        $(".MEMBTRNDIV").AttrToData("pk").AttrToData("plp_desc").AttrToData("rsc").AttrToData("rsd");
        $(".msTR").AttrToData("pk").AttrToData("mrn");
        $("#tbl_p5_TrainModules .msTR").AttrToData("ng_mrn");
        //$(".TrainHoursSumLine").AttrToData("ng_year"); // parent form wont read data objects, needs to be attribute
        $(".TrainOGLSumLine").AttrToData("ng_code");

        $(".EPLPD").blur(function () { PLP_Date($(this).closest(".MEMBTRNDIV").data("pk"), this); }).change(function () { PLP_Date($(this).closest(".MEMBTRNDIV").data("pk"), this); });
        $(".EPLPDL").click(function () { PopupPriorDateOnlySelect(this, 'PLPAG_' + $(this).closest(".MEMBTRNDIV").data("pk")); });

        $(".PLPTANO").blur(function () {
            var id = $(this).closest(".MEMBTRNDIV").data("pk");
            CheckTAno(id, this, "txt_p1_TAname" + id);
        }).keypress(function (e) {
            var id = $(this).closest(".MEMBTRNDIV").data("pk");
            return NumberOnly_KeyPress(e || event, function (e) { $("#txt_p1_TAno" + id).trigger("blur"); });
        });

        $(".PLPTANOS").click(function () {
            var id = $(this).closest(".MEMBTRNDIV").data("pk");
            TA_SearchClick(id, "txt_p1_TAno" + id, "txt_p1_TAname" + id, 'PLP_TA');
        });

        $(".trnLR").change(function () {
            var id = $(this).closest(".trMTMN").data("pk");
            ReqChange(this, id);
        }).css("width", "70px");

        $(".COMPL").change(function () {
            var id = $(this).closest(".trMTMN").data("pk");
            LCVB_Change(this, "LC", id);
            setTimeout(function () {
                $(".COMPL_" + id).parent().html("<label>" + $(".COMPL_" + id).val() + "</label>");
                $(".cbo_LM_" + id).parent().html("<label>" + $(".cbo_LM_" + id + " option:selected").first().text() + "</label>");
                $(".cbo_LR_" + id).parent().html("<label>" + $(".cbo_LR_" + id + " option:selected").first().text() + "</label>").css("text-align", "left");
            }, 100);
        });

        $(".trnLM").change(function () {
            var id = $(this).closest(".trMTMN").data("pk");
            MethodChange(this, id);
        }).css("width", "150px");

        $(".TRValBN").click(function () {
            var id = $(this).closest(".trMTMN").data("pk");
            var name = $(".TRVal", $(this).parent()).attr("id");
            VB_SearchButton(name, id);
        });

        $(".TRVal").blur(function () {
            var id = $(this).closest(".trMTMN").data("pk");
            CheckVBno(this, id);
        }).keypress(function (e) {
            var CTRL = $(this);
            return NumberOnly_KeyPress(e || event, function (e) { $(CTRL).trigger('blur'); });
        });

        //
        $(".VALON").change(function () {
            var id = $(this).closest(".trMTMN").data("pk");
            LCVB_Change(this, "VB", id);
            setTimeout(function () { $(".ValOn_" + id).parent().html("<label>" + $(".ValOn_" + id).val() + "</label>"); }, 100);
        });

        ReApplyTrainingEvents(); // training hours only

        HideTrainingFolds(undefined, 'SubFoldTR', 'ng_year');
        HideTrainingFolds(undefined, 'SubFoldOGL', 'ng_code');
        HideTrainingFolds(undefined, 'trPLP', 'ng_mrn');
        $(".TrainOGLSumLine").click(function () { HideTrainingFolds(this, 'SubFoldOGL', 'ng_code'); });
        $(".TrainModuleSumLine").click(function () { HideTrainingFolds(this, 'trPLP', 'ng_mrn'); });
        AddGridSortData("tbl_p5_AllTrainModules");
        GP_Sort("tbl_p5_AllTrainModules", 1, 0);

        // highlight columns when hovering the grid title TD (bottom grid on permits)
        $('.msHeadTD', $("#tbl_p5_AllTrainModules")).hover(
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')', $("#tbl_p5_AllTrainModules")).addClass("Grid_HL"); },
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')', $("#tbl_p5_AllTrainModules")).removeClass("Grid_HL"); });

        $("input[type=text], input[type=text]:focus, select, select:focus", "#mpage5").css({"margin-top": "0px", "margin-bottom": "0px" });
    }

    // Children Tab
    if ($("#mpage2").length > 0) {
        AddGridSortData("tbl_p2_child");
    }

    // parent tab
    if ($("#mpage13").length > 0) {
        $("#bnAddParent").click(AddParent);
        $(".UPAR").click(function () { UpdateParent(pk_val("Page.UseCN"), $(this).closest("tr").data("pk")); return false; });
        $(".DPAR").click(function () { RemoveParent(pk_val("Page.UseCN"), $(this).closest("tr").data("pk")); return false; });
        $(".togPAR").change(function () { TogglePrimaryContact(this, pk_val("Page.UseCN"), $(this).closest("tr").data("pk")); });
        $(".togCHILD").change(function () { TogglePrimaryContact(this, $(this).closest("tr").data("pk"), pk_val("Page.UseCN")); });
        $(".msTRPG").AttrToData("pk");
        AddGridSortData("tbl_p13_parents");
    }

    // events tab
    if ($("#mpage8").length > 0) {
        $(".AcceptButton").each(function () { $(this).parent().AttrToData("evin").AttrToData("evpk"); });
        $(".UpdateButton").each(function () { $(this).parent().AttrToData("evin").AttrToData("evpk"); });
        $(".RejectButton").each(function () { $(this).parent().AttrToData("evin").AttrToData("evpk"); });
        $(".ChangeButton").each(function () { $(this).parent().AttrToData("evin").AttrToData("evpk"); });

        $(".AcceptButton,.UpdateButton").click(function () {
            var ID = $(this).parent().data("evin");
            OpeniFrame(WebSitePath() + 'Popups/Maint/NewEventApplication.aspx?EDIT=' + ID + '&USECN=' + pk_val("Page.UseCN"), '69%', '890px', '90%', '550px', '', true, false);
        });
        $(".RejectButton").click(function () {
            var ID = $(this).parent().data("evpk");
            UpdateInviteeStatus(this, ID, pk_val("Page.UseCN"), 'DECL');
        });
        $(".ChangeButton").click(function () {
            var ID = $(this).parent().data("evpk");
            UpdateInviteeStatus(this, ID, pk_val("Page.UseCN"), 'INVT');
        });

        AddGridSortData("tbl_p8_event_invitations");
    }

    // badges
    if ($("#mpage7").length > 0) {
        $(".ViewBadgeProgress").each(function () { $(this).closest(".bCard").AttrToData("PK"); });
        $(".BadgeProgress").each(function () { $(this).closest(".bCard").AttrToData("PK"); });
        $(".RegisterBadge").each(function () { $(this).closest(".bCard").AttrToData("PK"); });

        $(".ViewBadgeProgress").click(function () {
            var ID = $(this).closest(".bCard").data("PK");
            ViewBadgeProgress(ID);
            return false;
        }).css("cursor", "pointer");
        $(".BadgeProgress").click(function () {
            var ID = $(this).closest(".bCard").data("PK");
            BadgeProgress(ID);
            return false;
        }).css("cursor", "pointer");

        $(".RegisterBadge").click(function () {
            var ID = $(this).closest(".bCard").data("PK");
            BadgeInterest(this, ID);
            return false;
        });

        $(".BadgeImage").error(BadgeIMGERR);

        $('.badgeA, .badgeNYA, .badgeR').keyup(function (e) {
            DoBadgeFilter(this, e);
        });
        $('.badgeA, .badgeNYA, .badgeR').blur(function (e) {
            DoBadgeFilter(this, e);
        });
    }

    // Page fold
    definefolds();
    // end of Page fold

    $(".tabbutton").hover(
        function () { if ($(this).data("selected") !== "Y") $(this).addClass("navbutton_hover"); },
        function () { if ($(this).data("selected") !== "Y") $(this).removeClass("navbutton_hover"); }
    );

    try {
        // highlight columns when hovering the grid title TD (common tables)
        $('.msHeadTD', $("#mpage2,#mpage3,#mpage6,#mpage12,#mpage13")).hover(
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')').addClass("Grid_HL"); },
            function () { if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')').removeClass("Grid_HL"); });

        // now do custom navigation
        if ($.Is_Android() || $.Is_IPad() || $.Is_IPhone())
            $(".tabbutton").css({ "padding-left": "4px", "padding-right": "4px" });

        $(".mpage").css("visibility", "visible");
        $("#mpage1").removeAttr("style");

        setTimeout(function () {
            DoPageNavigation(parseInt(pk_val("Nav.StartPage") || 1, 10), pk_val("Nav.Action"), pk_val("Nav.StartNo"));
        }, 500);

        $(".RME").remove();
    }
    catch (e) {
        $(".mpage").css("visibility", "visible");
        $("#mpage1").removeAttr("style");
        DoPageNavigation();
        MakePageVisible(1);
    }

    SetEnabled();
    // for wrapping of buttons and main tabs when the page width is small.
    FixFoldimageTop();

    setTimeout(function () {
        $.FocusControl("#myCN");

        //PL 13.05.14
        //Changed profile image *only* to be async=false, as the Personal Details page is the 1st to be shown and can sit on the hourglass for a long time
        //whilst other async images get in first.
        //Looks a lot snappier with this small change.
        if (pk_val("Page.GetProfileImage")) {
            var SuccessFunction = function (result) {
                if (result) {
                    result = $.parseJSON(result.d || result);
                    $(".ProfileImage").attr("src", "data:" + result.Key + ";base64, " + result.Value);
                }
                else
                    $(".ProfileImage").attr("src", "Images/core/sil_contact.png");
            };

            if (pk_val("Master.Sys.REST")) {
                // this is the code to run if using REST instead of JSON,
                // NOTE: subtally it is different.
                var vData = {};
                vData["ContactNumber"] = pk_val("Page.UseCN");
                PostToHandler(vData, "/Contact/Avatar", SuccessFunction, ServiceFailed, true, true);
                // End
            } else {
                $.ajax({ url: WebServicePath() + "GetAvatar?ContactNumber=" + pk_val("Page.UseCN"), async: false, success: SuccessFunction, error: ServiceFailed });
            }
        }

        CustomResize = ResizeSP;
        DoResize();
    }, 250);
}

function BadgeIMGERR() {
    $(this).unbind("error").attr("src", meta_val("BADGE_URL"));
}

function ReApplyTrainingEvents() {
    $(".DelHours").click(DelTrainingHours).AttrToData("ng_id").AttrToData("minutes");
    $(".TrainHoursSumLine").click(function () { HideTrainingFolds(this, 'SubFoldTR', 'ng_year'); });
}

function ResizeSP() {
    $(".SH_DIV_BN_MPT").not("#SH_DIV_BN_MPT0").width($(".SH_DIV_BN_MPT").parent().width() - 95);
    $("#SH_DIV_BN_MPT0").width($(".SH_DIV_BN_MPT").parent().width() - 225);
    // wrapping of tabs, change div size
    var obj = $(".tabitem *:visible").last();

    if (obj.position() && obj.position().top > (pk_val("Master.Sys.App") ? 50 : 130))
        $("#tabcontainer").height($("#hrPro1").css("display") === "none" ? "50" : "60");
    else
        $("#tabcontainer").height("25");

    // wrapping of bottom footer buttons (roles tab)
    if (pk_val("User.IsMe") || !$("#bnOrder") || !$("#bnOrder").position() || ($("#bnOrder").position().left > 50 && $("#cancdiv").width() > 800))
        $("#cancdiv").height("20");
    else
        $("#cancdiv").height("37");
}

function DoPageNavigation(GoToTab, FormAction, GoToNumber)
{
    if (pk_val("User.ParentRole") && !pk_val("User.IsMe"))
        $('#DLB_11,#DLB_12,#mpage11,#mpage12,#fpage11,#fpage12').remove();

    $('#DLB_1,#DLB_2,#DLB_3,#DLB_4,#DLB_5,#DLB_6,#DLB_7,#DLB_8,#DLB_9,#DLB_10,#DLB_11,#DLB_12,#DLB_13').css({ "visibility": "" });

    if (!GoToTab) GoToTab = 1;

    if (pk_val("Page.HideAllTabs") && !pk_val("User.IsMe")) { // only show these tabs (if viewing this person NOT self)
        $('#DLB_2,#DLB_4,#DLB_5,#DLB_6,#DLB_7,#DLB_8,#DLB_10,#DLB_11,#mpage2,#mpage4,#mpage5,#mpage6,#mpage7,#mpage8,#mpage10,#mpage11,#fpage2,#fpage4,#fpage5,#fpage6,#fpage7,#fpage8,#fpage10,#fpage11').remove();
        if (GoToTab !== 1 && GoToTab !== 3 && GoToTab !== 9 && GoToTab !== 12 && GoToTab !== 13)
            GoToTab = 1;
    }
    else if (pk_val("User.ParentRole") && pk_val("User.IsMe")) {
        $('#DLB_3,#DLB_4,#DLB_5,#DLB_6,#DLB_7,#DLB_8,#DLB_10,#DLB_11,#mpage3,#mpage4,#mpage5,#mpage6,#mpage7,#mpage8,#mpage10,#mpage11,#fpage3,#fpage4,#fpage5,#fpage6,#fpage7,#fpage8,#fpage10,#fpage11').remove();
        $('#DLB_2').css({ "display": "block" });

        if (GoToTab !== 1 && GoToTab !== 2 && GoToTab !== 9 && GoToTab !== 12)
            GoToTab = 1;
    }
    else $("#LBTN2,#DLB_2,#mpage2,#fpage2").remove();


    if (!pk_val("Page.IsYouth") || !HasAccess(pk_val("CRUD.PRNT"), "R")) // parents tab
    {
        $('#LBTN13,#DLB_13,#mpage13,#fpage13').remove();
        if (GoToTab === 13) GoToTab = 1;
    }

    if (GoToTab === 3 && !HasAccess(pk_val("CRUD.ROLES"), "R")) GoToTab = 1;
    if (GoToTab === 4 && !HasAccess(pk_val("CRUD.PERM"), "R")) GoToTab = 1;
    if (GoToTab === 5 && !HasAccess(pk_val("CRUD.TRN"), "R")) GoToTab = 1;
    if (GoToTab === 9 && !HasAccess(pk_val("CRUD.PEMD"), "R")) GoToTab = 1;
    if (GoToTab === 10 && !HasAccess(pk_val("CRUD.MMMD"), "R")) GoToTab = 1;
    if (GoToTab === 8 && !HasAccess(pk_val("CRUD.EVTI"), "R")) GoToTab = 1;
    if (GoToTab === 12 && !HasAccess(pk_val("CRUD.MDIS"), "R")) GoToTab = 1;
    if (GoToTab === 11 && !HasAccess(pk_val("CRUD.MVID"), "R")) GoToTab = 1;

    // make pages visible on visibility access
    if (!HasAccess(pk_val("CRUD.ROLES"), "R")) { $("#LBTN3,#DLB_3,#mpage3,#fpage3").remove(); } // works for others + me+family on CRUD (Roles tab)
    if (!HasAccess(pk_val("CRUD.CHILD"), "R")) { $("#LBTN2,#DLB_2,#mpage2,#fpage2").remove(); } // new (Children tab)
    if (!HasAccess(pk_val("CRUD.PERM"), "R")) { $("#LBTN4,#DLB_4,#mpage4,#fpage4").remove(); } // moved (Permit tab)
    if (!HasAccess(pk_val("CRUD.TRN"), "R")) { $("#LBTN5,#DLB_5,#mpage5,#fpage5").remove(); } // moved (Training tab)
    if (!HasAccess(pk_val("CRUD.PEMD"), "R")) { $("#LBTN9,#DLB_9,#mpage9,#fpage9").remove(); } // moved (Emergency details tab)
    if (!HasAccess(pk_val("CRUD.MMMD"), "R")) { $("#LBTN10,#DLB_10,#mpage10,#fpage10").remove(); }// moved (marketing tab)
    if (!HasAccess(pk_val("CRUD.EVTI"), "R")) { $("#LBTN8,#DLB_8,#mpage8,#fpage8").remove(); }// moved (event Invite tab)
    if (pk_val("Page.HideAwards")) {// moved (Awards Tab)
        if (GoToTab === 6) GoToTab = 1;
        $("#LBTN6,#DLB_6,#mpage6,#fpage6").remove();
    }
    if (pk_val("Page.HideBadges")) {// moved (Badges Tab)
        if (GoToTab === 7) GoToTab = 1;
        $("#LBTN7,#DLB_7,#mpage7,#fpage7").remove();
    }
    //
    if (!HasAccess(pk_val("CRUD.MVID"), "R")) { $("#LBTN11,#DLB_11,#mpage11,#fpage11").remove(); } // (visibility tab)
    if (!HasAccess(pk_val("CRUD.MDIS"), "R")) { $("#LBTN12,#DLB_12,#mpage12,#fpage12").remove(); } // (Disclosures tab)

    // if only 1 tab, then remove l;ast one to make more space.
    if ($(".tabitem").length === 1) $("#LBTN1,#DLB_1,#tabcontainer,#br1").remove();

    setTimeout(function () {
        //TSA-1396: We're checking that the tab is/is not available to the user by seeing if the html for the tab is present.
        //          In Chrome, this fails - leading to us assuming the tab is not available and redirecting.
        //          Fixed by delaying the check for 1.5s
        if (!$("#mpage" + GoToTab).html()) {
            // fall back for if the page does not exist, and the div does not exist, simply call load page (tab 1)
            if (!$("#mpage1").html())
                window.location.href = "MemberProfile.aspx" + (!pk_val("User.IsMe") && pk_val("Page.UseCN") ? "?CN=" + pk_val("Page.UseCN") : "");
            else
                GoToTab = 1;
        };
    },1500);

    MakePageVisible(GoToTab);

    if (GoToNumber && parseInt(GoToNumber,10) !== -1) {
        // roles actions
        if (FormAction === 'Open' && HasAccess(pk_val("CRUD.ROLES"), "U") && GoToTab === 3)
            OpeniFrame(WebSitePath() + 'Popups/Profile/AssignNewRole.aspx?EDIT=' + GoToNumber, '69%', '900px', '90%', '550px', '320px', true, false);
        if (FormAction === 'View' && HasAccess(pk_val("CRUD.ROLES"), "R") && GoToTab === 3)
            OpeniFrame(WebSitePath() + 'Popups/Profile/AssignNewRole.aspx?VIEW=' + GoToNumber, '69%', '900px', '90%', '550px', '320px', true, false);

        // Training Actions
        if (FormAction === 'Open' && GoToTab === 5) {
            $("#SHTRNBN_" + GoToNumber).val("Hide PLP");
            HideTrainingFolds($("#SHTRNBN_" + GoToNumber).parent().parent(), 'trPLP', 'ng_mrn');
        }
    }

    if (FormAction === 'New' && HasAccess(pk_val("CRUD.ROLES"), "C") && GoToTab === 3)
        OpeniFrame(WebSitePath() + 'Popups/Profile/AssignNewRole.aspx?CN=' + pk_val("Page.UseCN"), '69%', '900px', '90%', '550px', '320px', true, false);

    if (FormAction === 'REQDISC') { ReqDisclosure(GoToNumber); }

    if (FormAction === 'REFFAIL')
        $.system_alert("There was a problem sending the reference request emails.");

    // if commissioner Approval alert is clicked
    if (FormAction === 'COMAP') {
        if ($("#bnApprRejSusp").attr("id") !== undefined)
            ApprRejSusp();
        else
            $.system_alert("There are currently no role suspensions requiring commissioner approval for this person.");
    }

    // if membership commissioner Approval alert is clicked
    if (FormAction === 'MEMBCOMAPP' || FormAction === 'MEMBREVIEW') {
        if ($("#bnEndMemb").attr("id"))
            EndMembership();
        else
            $.system_alert("Your current role does not allow access to any membership options.");
    }
}

function definefolds()
{
    for (var i = 0; i <= 24; i++) { definefold(i.toString()); }

    //definefold("0");
    //definefold("1");
    //definefold("2");
    //definefold("3");
    //definefold("4");
    //definefold("5");
    //definefold("6");  // Awards
    //definefold("7");
    //definefold("8");
    //definefold("9"); // Training Fold 0
    //definefold("10"); // Training Fold 1
    //definefold("11"); // Training Fold 2
    //definefold("12"); // Training Fold 3
    //definefold("13"); // Awards Fold 1
    //definefold("14"); // Awards Fold 2
    //definefold("15"); // Disclosure Tab
    //definefold("16"); // Roles Tab
    //definefold("17"); // Children tab
    //definefold("18"); // Events
    //definefold("19"); // Permits
    //definefold("20"); // Permits
    //definefold("21"); // Badges
    //definefold("22"); // Badges
    //definefold("23"); // Badges
    //definefold("24"); // Parent
}

function definefold(Foldno) {
    var vData = {
        divname: "divProfile" + Foldno,
        foldname: "#MPfold" + Foldno,
        key: pk_val("Page.FoldName") + Foldno
    };
    // fold click / Key Press
    $("#SH_DIV_BN_MPT" + Foldno + ",#SH_DIV_BN_MPI" + Foldno).click(vData, ShowHide).keydown(vData, ShowHide);
    // Ensure Background is transparent etc
    $("#MPfold" + Foldno).css({ "background-color": "transparent", "background-repeat": "no-repeat" });
    if (pk_val("Page.Fold" + Foldno)) {
        $("#divProfile" + Foldno).hide();
        $("#MPfold" + Foldno).css({ "background-image": $(".foldimage_down").css("background-image"), "background-color": "transparent", "background-repeat": "no-repeat" });
    }
}

function ReLoadPage(NoInvalid) {
    if (ShowLoadingMessage()) {
        var URL = "MemberProfile.aspx?Reload";
        if (NoInvalid) URL += "&NoInvalidMessage=Y";
        if (!pk_val("User.IsMe")) URL += "&CN=" + pk_val("Page.UseCN");
        if (vCurrentPageNo > 1) {
            if (vCurrentPageNo === 2) URL += "&Page=Child";
            else if (vCurrentPageNo === 3) URL += "&Page=Roles";
            else if (vCurrentPageNo === 4) URL += "&Page=Permits";
            else if (vCurrentPageNo === 5) URL += "&Page=Training";
            else if (vCurrentPageNo === 6) URL += "&Page=Awards";
            else if (vCurrentPageNo === 7) URL += "&Page=Badges";
            else if (vCurrentPageNo === 8) URL += "&Page=Events";
            else if (vCurrentPageNo === 9) URL += "&Page=Emergency";
            else if (vCurrentPageNo === 10) URL += "&Page=Comms";
            else if (vCurrentPageNo === 11) URL += "&Page=Visibility";
            else if (vCurrentPageNo === 12) URL += "&Page=Disclosures";
            else if (vCurrentPageNo === 13) URL += "&Page=Parent";
        }

        window.location.href = URL;
    }

    return false;
}

function MakePageVisible(PageNo) {
    try {
        $('.mpage,.fpage').not('#mpage' + PageNo).hide();
        $('.tabbutton').not('#LBTN' + PageNo).css({ "background-color": "", "color": "" }).removeClass("navbutton_Disabled_Selected").removeClass("navbutton_hover").data("selected", "");
        $('#mpage' + PageNo).fadeIn(150);
        $('#LBTN' + PageNo).css({ "background-color": "", "color": "" }).removeClass("navbutton_hover").addClass("navbutton_Disabled_Selected").data("selected", "Y");

        // hide whole bottom bar if no buttons
        if (!$('#fpage' + PageNo).hasClass("hideme")) {
            $('#fpage' + PageNo).fadeIn(350);
            if ($('#ctl00_mstr_foot').css("display")) $('#ctl00_mstr_foot').css("display", "");
            MainPageSize();
        }
        else
            $('#ctl00_mstr_foot').hide();

        vCurrentPageNo = parseInt(PageNo, 10);
    }
    catch (err) { }
}

function ChangePage(FromPageNo, ToPageNo) {
    if (FromPageNo === ToPageNo) return false;

    if (FromPageNo === 3 && vEditing)
        $.system_alert("Please save or cancel the order preference changes.");
    else MakePageVisible(ToPageNo);

    return false;
}

function SendtoPDF(Pageno) {
    ShowBusy_Main();
    $.ajax({
        url: WebServicePath() + "DoProfileExport?pUseContactNumber=" + pk_val("Page.UseCN") + "&pPageNo=" + Pageno, success: function (result) {
            HideBusy_Main();
            if (result.d) { $.system_confirm(DataProtection_Message, function () { OpenExportDocument(result.d); }, undefined, false, "Before you finish"); }
            else $.system_alert("The Export Was Not Successful.");
        }, error: ServiceFailed
    });
    return false;
}

function EditProfile(pOption) {
    var URL = WebSitePath() + "Popups/Profile/EditProfile.aspx?StartPage=" + pOption + "&UseCN=" + pk_val("Page.UseCN");
    OpeniFrame(URL, '69%', '1000px', '90%', '550px', '320px', true, false);
}

//#region page 2 - your children

function TogglePrimaryContact(self, childCN, parentCN)
{
    // now also used for toggling on Parents tab on child profile as well as children tab on parent profile
    $.ajax({
        url: WebServicePath() + "UpdateContactRelationship?pChildContactNumber=" + childCN + "&pParentContactNumber=" + parentCN + "&pIsContact=" + ($(self).is(":checked") ? "Y" : "N"), success: function (result) {

            if (result.d === "-1") {
                if (parentCN === pk_val("Master.User.CN"))
                    $.system_alert("You are the only contact for this youth and therefore cannot be deselected as a contact.");
                else
                    $.system_alert("You cannot deselect the only contact for a youth.");
                $(self).prop("checked", true);
            }
        }, error: ServiceFailed
    });
}

//#endregion

//#region page 3 - roles

function NotInEditMode() { return !vEditing; }

function HideOrderPreferenceButtons() {
    vEditing = false;
    $("#orderdiv").css({ "display": "none" });
    $("#cancdiv, .msMRNCheckItems, .msRoleCheckAll").css({ "display": "" });
    $(".VIEWROLE, .ROLE_HIDEME", $("#mpage3")).css({ "display": "" });
    $(".gpNotFiltered", $("#mpage3")).css({ "visibility": "" });
    $(".EDITROLE", $("#mpage3")).css({ "display": "none" });
    $("H2", ".OPT_HDR").text("Options");
    $('td:nth-child(3)', $("#tbl_p3_roles")).show();
    $('td:nth-child(5)', $("#tbl_p3_roles")).show();
    $('td:nth-child(6)', $("#tbl_p3_roles")).show();
    $(".SortOpts").css("width", "");
}

function CancelOrderPreference() {
    HideOrderPreferenceButtons();
    $(".ORD").each(function () { $(this).text($(this).data("db")); });
    reSort();
    $(".llDesc").first().each(function () { $("Label", this).html($("Label", this).html() + " [Primary]"); });
    return false;
}

function SaveOrderPreference() {
    HideOrderPreferenceButtons();
    var UseOrderPref = "";

    $(".llDesc").first().each(function () { $("Label", this).html($("Label", this).html() + " [Primary]"); });

    $(".ORD").each(function () {
        if (UseOrderPref) UseOrderPref += ",";
        UseOrderPref += $(this).closest("tr").data("pk");
    });

    $.ajax({
        url: WebServicePath() + "SaveRoleOP?pLookupContactNumber=" + pk_val("Page.UseCN") + "&pOrderPref=" + UseOrderPref, success: function (result) {
            if (result.d === "OK") {
                if (pk_val("User.IsMe")) {
                    $.system_alert("Your changes have been saved.<br/><br/>NOTE: The changes will take effect next time you log in.");
                }
                else {
                    $.system_alert("Your changes have been saved.<br/><br/>NOTE: The changes will take effect next time the member logs in.");
                }
                $(".ORD").each(function () { $(this).data("db", $(this).text()); });
            }
            else {
                $.system_alert("There was a problem saving this data, the changes have been undone.");
                $(".ORD").each(function () { $(this).text($(this).data("db")); reSort(); });
            }
        }, error: ServiceFailed
    });
    return false;
}

function SetOrderPreference() {
    vEditing = true;
    GP_ClearAll("tbl_p3_roles");
    reSort();
    $("#orderdiv").css({ "display": "" });
    $("#cancdiv, .msMRNCheckItems, .msRoleCheckAll").css({ "display": "none" });
    $(".VIEWROLE, .ROLE_HIDEME", $("#mpage3")).css({ "display": "none" });
    $(".gpNotFiltered", $("#mpage3")).css({ "visibility": "hidden" });
    $(".EDITROLE", $("#mpage3")).css({ "display": "inline" });
    $(".RoleUp,.RoleDown, .RoleTop", $(".EDITROLE")).css({ "visibility": "visible" });
    $(".RoleUp, .RoleTop", $(".EDITROLE").first()).css({ "visibility": "hidden" });
    $(".RoleDown", $(".EDITROLE").last()).css({ "visibility": "hidden" });
    $(".llDesc").each(function () { $("Label", this).html($("Label", this).html().replace(" [Primary]", "")); });
    $("H2", ".OPT_HDR").text("Ordering Options");
    $('td:nth-child(3)', $("#tbl_p3_roles")).hide();
    $('td:nth-child(5)', $("#tbl_p3_roles")).hide();
    $('td:nth-child(6)', $("#tbl_p3_roles")).hide();
    $(".SortOpts").css("width", "260px");
    return false;
}

function reSort() {
    var $rows = $("#tbl_p3_roles").find('tbody tr').get();
    //loop through all the rows and find
    $.each($rows, function (index, row) { row.sortKey = $(".ORD", row).text(); });
    //compare and sort the rows alphabetically
    $rows.sort(function (a, b) { return (parseInt(a.sortKey, 10) - parseInt(b.sortKey, 10)); });
    //add the rows in the correct order to the bottom of the table
    $.each($rows, function (index, row) { $("#tbl_p3_roles tbody").append(row); row.sortKey = null; });

    $(".RoleUp,.RoleDown, .RoleTop", $(".EDITROLE")).css({ "visibility": "visible" });
    $(".RoleUp, .RoleTop", $(".EDITROLE").first()).css({ "visibility": "hidden" });
    $(".RoleDown", $(".EDITROLE").last()).css({ "visibility": "hidden" });
}

function MoveTop() {
    var self = this;
    $(".ORD", $(self).closest("tbody")).each(function () { MoveUp(self); });
    $(".ORD", $(self).closest("tr")).text("0");
    reSort();
    return false;
}

function MoveUp(self) {
    var myTR = $(self).closest("tr");
    var myPos = $(".ORD", myTR).text();
    var myOtherPos = $(".ORD", myTR.prev()).text();
    $(".ORD", myTR).text(myOtherPos);
    $(".ORD", myTR.prev()).text(myPos);
    reSort();
    return false;
}

function MoveDown() {
    var self = this;
    var myTR = $(self).closest("tr");
    var myPos = $(".ORD", myTR).text();
    var myOtherPos = $(".ORD", myTR.next()).text();
    $(".ORD", myTR).text(myOtherPos);
    $(".ORD", myTR.next()).text(myPos);
    reSort();
    return false;
}

function ViewOrg(level, ON, FormAction) {
    window.location.href = 'Hierarchy.aspx?ON=' + ON;
}

function GetSelectedRoles() {
    var SelRoles = "";
    $(".msMRNCheckItems").each(function () {
        if ($(this).is(":checked")) {
            if (SelRoles) SelRoles += ",";
            SelRoles += $(this).closest("tr").data("pk");
        }
    });
    return SelRoles;
}

function GetSuspRejRoles() {
    var SelRoles = "";
    $(".msMRNCheckItems").each(function () {
        if ($(this).parent().parent().data("comap") === "Y") {
            if (SelRoles) SelRoles += ",";
            SelRoles += $(this).closest("tr").data("pk");
        }
    });
    return SelRoles;
}

function ViewRole() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/AssignNewRole.aspx?VIEW=' + $(this).closest("tr").data("pk"), '69%', '900px', '90%', '550px', '320px', true, false);
    return false;
}

function EditRole() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/AssignNewRole.aspx?EDIT=' + $(this).closest("tr").data("pk"), '69%', '900px', '90%', '550px', '320px', true, false);
    return false;
}

function EndRole() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/EndRoles.aspx?CN=' + pk_val("Page.UseCN") + '&MRN=' + $(this).closest("tr").data("pk"), '69%', '630px', '75%', '630px', '400px', true, false);
    return false;
}

function ApprRejSusp() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/SuspendRole_Approval.aspx?CN=' + pk_val("Page.UseCN"), '69%', '800px', '70%', '800px', '400px', true, false);
    return false;
}

function UnSuspendRole() {
    var self = this;
    $.system_confirm("Un-suspend role now?", function () {
        $.ajax({
            url: WebServicePath() + "UnSuspendRole?pUseMRN=" + $(self).closest("tr").data("pk"), success: function (result) {
                ReLoadPage();
            }, error: ServiceFailed
        });
    });
    return false;
}

function SuspendRole() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/SuspendRole.aspx?CN=' + pk_val("Page.UseCN") + '&MRN=' + $(this).closest("tr").data("pk"), '59%', '630px', '70%', '630px', '400px', true, false);
    return false;
}

function AddRole() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/AssignNewRole.aspx?CN=' + pk_val("Page.UseCN"), '69%', '900px', '90%', '550px', '320px', true, false);
    return false;
}

function EndRoles() {
    var SelRoles = GetSelectedRoles();
    if (SelRoles === "")
        $.system_alert("select at least 1 role to end.");
    else
        OpeniFrame(WebSitePath() + 'Popups/Profile/EndRoles.aspx?CN=' + pk_val("Page.UseCN") + "&MRN=" + SelRoles, '69%', '630px', '75%', '630px', '400px', true, false);
    return false;
}

function SuspendRoles() {
    var SelRoles = GetSelectedRoles();
    if (SelRoles === "")
        $.system_alert("select at least 1 role to suspend.");
    else
        OpeniFrame(WebSitePath() + 'Popups/Profile/SuspendRole.aspx?CN=' + pk_val("Page.UseCN") + "&MRN=" + SelRoles, '69%', '630px', '59%', '630px', '400px', true, false);
    return false;
}

function EndMembership() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/UpdateMemberStatus.aspx?CN=' + pk_val("Page.UseCN"), '64%', '690px', '550px', '690px', '400px', true, false);
    return false;
}

function RejectRole() {
    var TD = $(this).parent();
    var ng_id = $(this).closest("tr").data("pk");
    var idx = $(".ORD", TD).data("db");

    $.system_confirm("Set this " + $(".ll_role_Status", TD.parent()).text() + " roles status to Cancelled?", function () {
        ShowBusy_Main();
        $.ajax({
            url: WebServicePath() + "CancelRole?pUseMRN=" + ng_id + "&pUseCN=" + pk_val("Page.UseCN"), success: function (result) {
                if (!result.d)
                    $.system_alert("There was a problem cancelling this role, Cancellation is not complete.");
                else {
                    $(".VIEWROLE", TD).remove();
                    TD.html('<input class="VIEWROLE" type="button" value="View" style="min-width: 55px;"><label class="ORD" style="width: 1px; display: none;">' + idx + '</label>');
                    $(".ll_role_Status", TD.parent()).text("Cancelled");
                    TD.parent().addClass("ROLE_HIDEME");
                    $(".VIEWROLE", TD).click(ViewRole);
                    $(".ORD", TD).data("db", idx);
                }
                HideBusy_Main();
            }, error: ServiceFailed
        });
    });
    return false;
}

//#endregion

//#region page 4 - Permits

function HideShowPermit(self, type) {
    $("#tbl_p4_permits").css("display", "");

    if ($(".PERM_EXP").size() === 0)
        $("#ll_p4_expired, #cb_p4_expired").css("display","none");

    if ($(".PERM_REV").size() === 0)
        $("#ll_p4_revoked, #cb_p4_revoked").css("display","none");

    var CNT = $(".PERM_OK").size();

    if (type === 'expired')
    {
        if ($(self).is(':checked')) {
            $(".PERM_EXP").parent().show();
            CNT += $(".PERM_EXP").size();
        }
        else $(".PERM_EXP").parent().hide();

        if ($("#cb_p4_revoked").is(':checked')) {
            $(".PERM_REV").parent().show();
            CNT += $(".PERM_REV").size();
        }
    }

    if (type === 'revoked') {
        if ($(self).is(':checked')) {
            $(".PERM_REV").parent().show();
            CNT += $(".PERM_REV").size();
        }
        else $(".PERM_REV").parent().hide();

        if ($("#cb_p4_expired").is(':checked'))
        {
            $(".PERM_EXP").parent().show();
            CNT += $(".PERM_EXP").size();
        }
    }

    if (CNT === 0) {
        $("#permitNoItems").css("display", "block");
        $("#tbl_p4_permits").css("display", "none");
    }
    else {
        $("#permitNoItems").css("display", "none");
    }
}

function RecommendPermit() {
    OpeniFrame(WebSitePath() + 'Popups/Maint/RecommendPermit.aspx?CN=' + pk_val("Master.User.CN") + '&UseCN=' + pk_val("Page.UseCN"), '59%', '720px', '490px', '720px', '500px', true, false);
    return false;
}

function AddPermit() {
    OpeniFrame(WebSitePath() + 'Popups/Maint/NewPermit.aspx?CN=' + pk_val("Master.User.CN") + '&EDIT=0' + '&UseCN=' + pk_val("Page.UseCN"), '69%', '750px', '90%', '750px', '320px', true, false);
    return false;
}

function ViewPermit(pPN) {
    OpeniFrame(WebSitePath() + 'Popups/Maint/NewPermit.aspx?CN=' + pk_val("Master.User.CN") + '&VIEW=' + pPN + '&UseCN=' + pk_val("Page.UseCN"), '69%', '750px', '90%', '750px', '320px', true, false);
    return false;
}

function UpdatePermit(pPN) {
    OpeniFrame(WebSitePath() + 'Popups/Maint/NewPermit.aspx?CN=' + pk_val("Master.User.CN") + '&EDIT=' + pPN + '&UseCN=' + pk_val("Page.UseCN"), '69%', '750px', '90%', '750px', '320px', true, false);
    return false;
}

//#endregion

//#region Page 5 - Training
function UpdateOGLHours(ngi, year, hours, date, notes, del, Doclose) {
    if (Doclose) CloseiFrame();

    var oYears = [];
    var oYear;
    var oYearDate;
    var bFound = false;

    //loop through rows on form
    $("#tbl_p5_TrainHours tr").not(":first").each(function () {

        //if outer row
        if ($(this).attr("data-ng_year")) {
            var totalMins = $("td:nth-child(2)", this).find("label").html().split(':')[0] * 60;
            totalMins += parseInt($("td:nth-child(2)", this).find("label").html().split(':')[1], 10);

            //if year equals year on form, add hours to total hours
            if ($(this).attr("data-ng_year") === year) {

                totalMins += hours.split(':')[0] * 60;
                totalMins += parseInt(hours.split(':')[1], 10);
                bFound = true;
            }

            var totalHours = parseInt(totalMins / 60, 10);
            var remMinutes = totalMins % 60;

            if (totalHours < 10)
                totalHours = "0" + totalHours;

            if (remMinutes < 10)
                remMinutes = "0" + remMinutes;

            //create a Year object with total hours
            oYear = JSON.parse("{\"Year\":\"" + $(this).attr("data-NG_Year") + "\",\"Hours\":\"" + totalHours + ":" + remMinutes + "\",\"YearDates\":[]}");

            //loop through inner detail rows on form
            $(".SubFoldTR_" + $(this).attr("data-NG_Year")).each(function () {
                if ($("td:nth-child(5)", this).find("input").length > 0) { //not a header or footer row

                    //create a YearDate object and add to array of oYear.YearDates
                    oYearDate = JSON.parse("{\"NGI\":\"" + $("td:nth-child(5)", this).find("input").attr("ng_id") + "\",\"Hours\":\"" + $("td:nth-child(2)", this).find("label").html() + "\",\"Date\":\"" + $("td:nth-child(3)", this).find("label").html() + "\",\"Notes\":\"\"}");
                    oYearDate.Notes = $("td:nth-child(4)", this).find("label").html();// Issue 1150 (TSA 1122): Split notes out separately to prevent JSON.parse() breaking on " characters
                    oYear.YearDates.push(oYearDate);
                }
            });

            if ($(this).attr("data-NG_Year") === year) {

                //add new YearDate object to array
                oYearDate = JSON.parse("{\"NGI\":\"" + ngi + "\",\"Hours\":\"" + hours + "\",\"Date\":\"" + date + "\",\"Notes\":\"" + notes + "\"}");
                oYear.YearDates.push(oYearDate);

                //bubblesort detail rows
                bubbleSortDates(oYear.YearDates);
            }

            oYears.push(oYear);
        }

    });

    //year doesn't already exist, so create new Year and YearDate objects
    if (!bFound) {

        oYear = JSON.parse("{\"Year\":\"" + year + "\",\"Hours\":\"" + hours + "\",\"YearDates\":[]}");
        oYearDate = JSON.parse("{\"NGI\":\"" + ngi + "\",\"Hours\":\"" + hours + "\",\"Date\":\"" + date + "\",\"Notes\":\"" + notes + "\"}");
        oYear.YearDates.push(oYearDate);
        oYears.push(oYear);
    }

    //bubblesort years
    bubbleSortYears(oYears);

    //build html markup using oYears data and update form
    var vHTML = "<table id='tbl_p5_TrainHours' style='width:100%'><thead><tr ><td class='msHeadTDCB'><h2 class='tdh2'>Year</h2></td><td class='msHeadTDCB'><h2 class='tdh2'>Total Hours</h2></td><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td></tr></thead>";

    for (var i = 0; i < oYears.length; i++) {
        vHTML += "<tr class='msTR TrainHoursSumLine labelPoint' data-NG_Year='" + oYears[i].Year + "'><td class='tdData' style='width:10%'><label ><a href='#' onclick='return false;'>" + oYears[i].Year + "</a></label></td><td class='tdData' style='width:150px'  id='total_" + oYears[i].Year + "'><label >" + oYears[i].Hours + "</label></td><td class='tdData' style=''  ><label ></label></td><td class='tdData' style=''  ><label ></label></td><td class='tdData' style='width:80px;'><label ></label></td></tr>";
        vHTML += "<tr class='SubFoldTR SubFoldTR_" + oYears[i].Year + "' style='display:none'><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td><td class='msHeadTDCB' ><h2 class='tdh2'>Hours</h2></td><td class='msHeadTDCB' style='white-space: nowrap;'><h2 class='tdh2'>Date</h2></td><td class='msHeadTDCB' ><h2 class='tdh2'>Notes</h2></td><td class='msHeadTDCB' ><h2 class='tdh2'></h2></td></tr>";
        for (var j = 0; j < oYears[i].YearDates.length; j++) {
            var vDelBtn = "";//"<td />";
            if (del === "Y") {  /* TSA-655: HAve to pass a parameter to control delete buttons to avoid XSS problems */
                vDelBtn = "<td class='tdData' style='width:80px;text-align: right;'><input type='button' class='DelHours' value='Delete' data-minutes='" +
                    HHMMtoMin(oYears[i].YearDates[j].Hours) +
                    "' data-ng_id='" + oYears[i].YearDates[j].NGI + "'/></td>";
            }
            else { //TSA-654: The ADDing code relies on the delete button being present to re-display the correct data after the add. Keep a button (no class so it won't function if hacked) to preserve this.
                vDelBtn = "<td class='tdData' style='width:80px;text-align: right;'><input type='button' value='' data-minutes='" +
                    HHMMtoMin(oYears[i].YearDates[j].Hours) +
                    "' data-ng_id='" + oYears[i].YearDates[j].NGI + "' style='visibility:hidden'/></td>";
            }
            vHTML += "<tr class='msTR SubFoldTR SubFoldTR_" + oYears[i].Year + "' style='display:none'><td class='tdData' style='width:10%'><b>&#8226;</b></td><td class='tdData' style='width:100px'><label>" + oYears[i].YearDates[j].Hours + "</label></td><td class='tdData' style='white-space: nowrap;width:100px'><label>" + oYears[i].YearDates[j].Date + "</label></td><td class='tdData'><label>" + oYears[i].YearDates[j].Notes + "</label></td>" + vDelBtn + "</tr>";
        }
        vHTML += "<tr class='SubFoldTR SubFoldTR_" + oYears[i].Year + "' style='display:none'><td colspan='5'><br/><br/></td></tr>";
    }

    vHTML += "</table>";

    $("#divProfile12").html(vHTML);

    // re-apply events
    ReApplyTrainingEvents();
    HideLoadingMessage();
}

function HHMMtoMin(t) {
    //TSA-542: Need to work out the number of minutes in a string formatted "HH:MM"
    return ((parseInt(t.split(":")[0], 10) * 60) + (parseInt(t.split(":")[1], 10)))
}

function bubbleSortYears(a) {
    var swapped;
    do {
        swapped = false;
        for (var i = 0; i < a.length - 1; i++) {
            if (a[i].Year < a[i + 1].Year) {
                var temp = a[i];
                a[i] = a[i + 1];
                a[i + 1] = temp;
                swapped = true;
            }
        }
    } while (swapped);
}

function bubbleSortDates(a) {
    var swapped;
    do {
        swapped = false;
        for (var i = 0; i < a.length - 1; i++) {
            //if (parseDate(a[i].Date) < parseDate(a[i + 1].Date)) { //comparing the output of parseDate puts them in alphanumeric order, not date order
            if (Date.parse(a[i].Date) < Date.parse(a[i + 1].Date)) {
                var temp = a[i];
                a[i] = a[i + 1];
                a[i + 1] = temp;
                swapped = true;
            }
        }
    } while (swapped);
}

function ShowHidePLP() {
    if ($(this).val() === "Show PLP") {
        $(".SHPLP").val("Show PLP");
        $(this).val("Hide PLP");
    }
    else
        $(this).val("Show PLP");
    HideTrainingFolds($(this).parent().parent(), 'trPLP', 'ng_mrn');
}

function PrintPLP() {
    ShowBusy_Main();
    $.ajax({
        url: WebServicePath() + "DoPLPExport?pUseContactNumber=" + pk_val("Page.UseCN") + "&pUseMRN=" + $(this).closest(".MEMBTRNDIV").data("pk"), success: function (result) {
            HideBusy_Main();
            if (result.d) { $.system_confirm(DataProtection_Message, function () { OpenExportDocument(result.d); }, undefined,false, "Before you finish"); }
            else $.system_alert("The Export Was Not Successful.");
        }, error: ServiceFailed
    });
}

function RecomendWood() {
    var self = this;
    var MRN = $(this).closest(".MEMBTRNDIV").data("pk");

    $.system_confirm("Are you sure?", function () {
        $.ajax({
            url: WebServicePath() + "PLPRecomendWood?pUseMRN=" + MRN,
            success: function (result) {
                if (result.d)
                    $("#WB_" + MRN).html("<label>Wood Badge : " + formatDate(new Date(), DisplayDateFormat) + "</label>");
            },
            error: ServiceFailed
        });
        $(self).remove();
    });
}

function UpdatePLPHeader(MRN, PLPCN, PLP_Agreed) {
    //UpdatePLPHeader(string pContactNumber, string pContactNumber_MD5, string pUseContactNumber, string pMRN, string pPLPCN, string pPLPAgreed)
    $.ajax({ url: WebServicePath() + "UpdatePLPHeader?pUseMRN=" + MRN + "&pPLPCN=" + PLPCN + "&pPLPAgreed=" + PLP_Agreed, error: ServiceFailed });
}

function UpdatePLPDetails(MTMN, Req, OrigMeth, Meth, Comp, VB, VO) {
    // UpdatePLPDetails(string pContactNumber, string pContactNumber_MD5, string pMTMN, string pReq, string pMethod, string pComplete, string pValBy, string pValOn)
    $.ajax({ url: WebServicePath() + "UpdatePLPDetails?pMTMN=" + MTMN + "&pReq=" + Req + "&pMethod=" + Meth + "&pComplete=" + Comp + "&pValBy=" + VB + "&pValOn=" + VO, error: ServiceFailed });
}

function SetDB(self, UseVal) {
    if ($(self).hasClass("VALON") || $(self).hasClass("COMPL")) {
        if ((UseVal ? UseVal : $(self).val()))
            $(self).data("db", (UseVal ? UseVal : $(self).val()));
    }
    else $(self).data("db", (UseVal ? UseVal : $(self).val()));
}

function ReqChange(self, PK) {
    $(".cbo_LR_" + PK).val($(self).val());
    var Vis = $("option:selected", $(self)).val() === "Y" && !$("option:selected", $(".cbo_LM_" + PK)).attr("value") ? "hidden" : "visible";
    $(".ValBy_" + PK + ", .ValOn_" + PK + ", .ValByBN_" + PK).css("visibility", Vis);
    UpdatePLPDetails(PK, $("option:selected", $(self)).val());
}

function LCVB_Change(self, CLS, PK) {
    var NewVal = $(self).val();
    if (!NewVal) {
        $(self).resetDB();
        return;
    }

    if (CLS === "VB" && isDate(NewVal, DisplayDateFormat)) {
        $(".ValOn_" + PK).val(NewVal).data("db", NewVal);
        UpdatePLPDetails(PK, undefined, undefined, undefined, undefined, undefined, NewVal);
    }
    if (CLS === "LC" && isDate(NewVal, DisplayDateFormat)) {
        $(".COMPL_" + PK).val(NewVal).data("db", NewVal);
        UpdatePLPDetails(PK, undefined, $("option:selected", $(".cbo_LM_" + PK, $(self).parent().parent())).val(), undefined, NewVal);
    }
}

function MethodChange(self, PK) {
    var NewVal = $("option:selected", $(self)).val();

    if (!$("option", $(self)).first().attr("value")) { // if first item has blank text
        $(".cbo_LM_" + PK).each(function () { $("option", $(this)).first().remove(); });
        $(".ValBy_" + PK + ", .ValOn_" + PK + ", .ValByBN_" + PK).css("visibility", "visible");
        $(".COMPL_" + PK).val(formatDate(new Date(), DisplayDateFormat));
        SetEnabled();
        UpdatePLPDetails(PK, undefined, undefined, NewVal, formatDate(new Date(), DisplayDateFormat));

        setTimeout(function () {
            PopupPriorDateOnlySelect(undefined, $(".COMPL_" + PK).attr("id"));
            $(".popupclose", $("#Datepopup")).remove();
            $("#dp_h2_cap").text("Learning Completed Date");
        }, 500);
    }
    else {
        UpdatePLPDetails(PK, undefined, $(self).data("db"), NewVal);
        SetDB(".cbo_LM_" + PK, NewVal);
    }

    $(".cbo_LM_" + PK).val(NewVal).data("db", NewVal);
}

//#region VB Lookup

function VB_SearchButton(ctrl, MTMN) {
    $.member_search("UPD_TRVB" + (pk_val("Page.IsYouth") === "Y" ? "_Y" : "_A"),
        function (CN, Name) { VB_Populate(CN, Name, MTMN); },
        "Find A Training Validator",
        pk_val("Master.User.ON"),
        pk_val("Page.UseCN"));
    return false;
}

function VB_Populate(CN, Name, MTMN) {
    if (CN === "") {
        $(".ValBy_" + MTMN).val("");
    }
    else {
        $(".ValBy_" + MTMN).val(CN);
        $(".ValByBN_" + MTMN + ",.ValBy_" + MTMN).remove();
        $(".ValByName_" + MTMN).css({ "display": "" }).text(Name).attr("onclick", "return GotoCN(" + CN + ");");
        $(".ValOn_" + MTMN).val(formatDate(new Date(), DisplayDateFormat)).data("db", formatDate(new Date(), DisplayDateFormat));

        $(".cbo_LR_" + MTMN).parent().html("<label>" + $(".cbo_LR_" + MTMN + " option:selected").first().text() + "</label>").css("text-align", "left");

        if ($(".cbo_LM_" + MTMN + " option:selected").first().attr("value"))
            $(".cbo_LM_" + MTMN).parent().html("<label>" + $(".cbo_LM_" + MTMN + " option:selected").first().text() + "</label>");
        else
            $(".cbo_LM_" + MTMN).parent().html("");

        $(".COMPL_" + MTMN).parent().html("<label>" + $(".COMPL_" + MTMN).first().val() + "</label>");

        SetDB(".ValBy_" + MTMN);
        UpdatePLPDetails(MTMN, undefined, undefined, undefined, undefined, CN, formatDate(new Date(), DisplayDateFormat));

        // will have update button (if this routine called)
        var Parent = $(".TRN_UPDATE_" + MTMN).parent();

        // change Update into View (if no crud)
        if (!HasAccess(pk_val("CRUD.TRV"), "U")) {
            Parent.append("<input class='TRN_VIEW1' type='button' value='View'>");
            $(".TRN_VIEW1", Parent).click(TRN_VIEW1_Click).css("width", "70px");
            $(".TRN_UPDATE_" + MTMN).remove();
        }

        // remove delete (if no crud)
        if (!HasAccess(pk_val("CRUD.TRV"),"D"))
            $(".TRN_DELETE_" + MTMN).remove();
        else if ($(".TRN_DELETE_" + MTMN).size() === 0) // didnt have delete on normal, but does on validated
        {
            Parent.append("<input class='TRN_DELETE1 TRN_DELETE_" + MTMN + "' type='button' value='Delete'>");
            $(".TRN_DELETE1", Parent).click(DeleteTraining).css("width", "70px");
        }

        setTimeout(function () {
            PopupPriorDateOnlySelect(undefined, $(".ValOn_" + MTMN).attr("id"));
            $(".popupclose", $("#Datepopup")).remove();
            $("#dp_h2_cap").text("Validation Date");
        }, 1000);
    }
    SetEnabled();
}

function TRN_VIEW1_Click() {
    var ID = $(this).closest(".msTR").data("pk");
    var MRN = $(this).closest(".msTR").data("mrn");
    UpdateTraining(ID, true, true, MRN);
}

function CheckVBno(self, MTMN) {
    if ($(self).val() === pk_val("Page.UseCN")) {
        $.system_alert("A member cannot validate their own training.");
        $(self).resetDB();
    }
    else if ($(self).val() !== $(self).data("db")) {
        if ($(self).val() === "")
            VB_Populate("", "", MTMN);
        else
            $.validate_member("UPD_TRVB" + (pk_val("Page.IsYouth") === "Y" ? "_Y" : "_A"),
                function (CN, Name) { VB_Populate(CN, Name, MTMN); },
                function () { VB_Populate("", "", MTMN); $.system_alert("Not a valid Training Validator number.", self); },
                $(self).val(),
                pk_val("Master.User.ON"),
                pk_val("Page.UseCN"));
    }
}

//#endregion

//#region TA Lookup

function TA_SearchClick(MRN, ctrl, lbl) {
    $.member_search("UPD_TADV" + (pk_val("Page.IsYouth") === "Y" ? "_Y" : "_A"),
        function (CN, Name) { TA_Populate(CN, Name, MRN); },
        "Find A Training Advisor",
        pk_val("Master.User.ON"),
        pk_val("Page.UseCN"));

    return false;
}

function TA_Populate(CN, Name, MRN) {
    $("#txt_p1_TAname" + MRN).val(Name.substring(9));
    $("#txt_p1_TAno" + MRN).val(CN);
    SetDB("#txt_p1_TAno" + MRN);
    //$("#adv_" + MRN).html("<a href='MemberProfile.aspx?CN=" + CN + "' onclick='return GotoCN(" + CN + ");'>" + Name + "</a>");
    $("#adv_" + MRN).html("<label>" + Name + "</label>");
    UpdatePLPHeader(MRN, CN, undefined);
}

function CheckTAno(MRN, self, lbl) {
    if ($(self).val() === pk_val("Page.UseCN")) {
        $.system_alert("A member cannot be their own training advisor.");
        $(self).resetDB();
    }
    else if ($(self).val() !== $(self).data("db")) {
        if ($(self).val() === "")
            TA_Populate("", "", MRN);
        else
            $.validate_member("UPD_TADV" + (pk_val("Page.IsYouth") === "Y" ? "_Y" : "_A"),
                function (CN, Name) { TA_Populate(CN, Name, MRN); },
                function () { TA_Populate("", "", MRN); $.system_alert("Not a valid training advisor number.", self); },
                $(self).val(),
                pk_val("Master.User.ON"),
                pk_val("Page.UseCN"));
    }
}

//#endregion

function PLP_Date(MRN, self) {
    calPopup_ctrl = self;
    calPopup.clearDisabledDates();
    AddPriorDateOnlyFilter();
    if (!Date_TextBox_Blur(self,"Only dates of today or in the past are allowed.")) return;
    if ($(self).val() !== $(self).data("db")) {
        SetDB(self);
        UpdatePLPHeader(MRN, undefined, $(self).val());
    }
}

function AddTrainingHours() {
    OpeniFrame(WebSitePath() + 'Popups/Maint/TrainingHours.aspx?CN=' + pk_val("Page.UseCN") + "&D=" + pk_val("Page.CanDeleteOGLHrs"), '54%', '550px', '420px', '550px', '420px', true, false);
}

function AddTrainingModules() {
    OpeniFrame(WebSitePath() + 'Popups/Maint/TrainingOGL.aspx?CN=' + pk_val("Page.UseCN"), '54%', '550px', '400px', '550px', '400px', true, false);
}

function DeleteTraining() {
    var MTMN = $(this).closest(".msTR").data("pk");   // MTMN PK
    var vLinkedRoles = $(".trDesc_" + MTMN).size();   // Linked PLP's (count)
    var TrainingName = $(".trDesc_" + MTMN).first().text();  // name of training item (for captions)
    var ThisPLP_PK = $(this).closest(".MEMBTRNDIV").data("pk"); // the PLP's PK (member_role_number)
    var ThisPLP_TR = $(this).closest(".MEMBTRNDIV"); // the PLP div component (for removal + navigation)

    if (vLinkedRoles === 1) {
        // if this is the only trainin gitem in the PLP, add remove PLP message
        // prompt YN, do it?
        $.system_confirm("Are you sure you want to delete <br/><br/><b>" + TrainingName + "</b><br/><br/>training module from this PLP?",
        function () {
            // the XREF PK
            var XrefPK = $(".trDesc_" + MTMN).first().attr("id").replace("trX_", "");

            CloseHintPopup();
            ShowBusy_Main();
            $.ajax({
                url: WebServicePath() + "DeleteMemberTraining?pUseContactNumber=" + pk_val("Page.UseCN") + "&pPKs=" + XrefPK + "&pMTMN=" + MTMN, success:
               function (result) {
                   HideBusy_Main();
                    // if delete was ok
                   if (result.d) {
                        if ($(".trMTMN", ThisPLP_TR).size() === 1) $(".trPLPHead", ThisPLP_TR).remove();
                        $(".trMTMN, .trAllMTMN").each(function () { if ($(this).data("pk") === MTMN) $(this).remove(); });
                        $.system_alert("Training item<br/><br/><b>" + TrainingName + "</b><br/><br/>has been deleted.");

                       // set count on all PLP training modules grid
                       $("#lit_ALLPLP").text($(".trAllMTMN").size() > 0 ? " (" + $(".trAllMTMN").size() + ")" : "");
                       $("#lit_PLP").text($(".MEMBTRNDIV").size() > 0 ? " (" + $(".MEMBTRNDIV").size() + ")" : "");

                       if ($(".MEMBTRNDIV").size() === 0) {
                           if (pk_val("User.IsMe")) $("#tbl_p5_TrainModules").parent().html("You don't have any roles with any training requirements.<br/><br/>");
                           else $("#tbl_p5_TrainModules").parent().html("There are no roles with any training requirements for this person.<br/><br/>");
                       }

                       if ($(".trAllMTMN").size() === 0) {
                           if (pk_val("User.IsMe")) $("#tbl_p5_AllTrainModules").parent().html("You don't have any training requirements.<br/><br/>");
                           else $("#tbl_p5_AllTrainModules").parent().html("There are no training requirements for this person.<br/><br/>");
                       }
                   }
                   else {
                       $.system_alert("Failed to delete : <b>" + TrainingName + "</b>.");
                   }
               }, error: ServiceFailed
            });
        },
        CloseHintPopup,
        false);
}
    else {
        // build message + table of all linked PLP's
        var vRolelist = "<table style='width:100%'>";
        vRolelist += "<tr><td colspan='2' style='text-align:left;'><label>Remove <b>" + TrainingName + "</b> from the following PLP's?<br/><br/><b>NOTE:</b> If there are no remaining linked PLP's it will be permanently deleted.</lable></td></tr>";
        vRolelist += "<tr><td class='msHeadTDCB'><h2 class='tdh2'>PLP / Role name</h2></td><td class='msHeadTDCB' style='width: 70px;text-align: center;'><h2 class='tdh2'>Remove<br/>Link?</h2></td></tr>";
        $(".trDesc_" + MTMN).each(function () {
            var PLP_Container = $(this).closest(".MEMBTRNDIV");
            if (PLP_Container.data("rsc") === "C" || PLP_Container.data("rsc") === "X")
                vRolelist += "<tr class='msTR'><td style='text-align:left'><label>" + PLP_Container.data("plp_desc") + "</label></td><td style='text-align: center;'><label>" + PLP_Container.data("rsd") + "</label></td></tr>";
            else
                vRolelist += "<tr class='msTR'><td style='text-align:left'><label class='labelPoint' for='plp_chk_" + PLP_Container.data("pk") + "'>" + PLP_Container.data("plp_desc") + "</label></td><td style='text-align: center;'><input class='TRD_CHK' id='plp_chk_" + PLP_Container.data("pk") + "' type='checkbox' data-pk='" + $(this).attr("id").replace("trX_", "") + "' " + (ThisPLP_PK === PLP_Container.data("pk") ? "checked='checked'" : "") + "/></td></tr>";
        });
        vRolelist += "</table>";

        var windowTitle = "<h2>System Confirmation</h2>";
        var buttonbar = "<input id='bnOKlTRD' type='button' value='Remove Links' style='width:120px;' class='sysmsg_bn'>&nbsp;<input type='button' id='bnCancelTRD' value='Cancel' class='sysmsg_close'>";

        $.system_window(vRolelist, windowTitle, buttonbar, 2);

        $(".TRD_CHK").AttrToData("pk");

        // the ok click (do the delete)
        $("#bnOKlTRD").click(function () {
            $('#bnCancelTRD, #bnOKlTRD, .TRD_CHK').attr('disabled', 'disabled');

            // grab Xref PK's
            var PKs = "-1";
            $(".TRD_CHK").each(function () { if ($(this).is(":checked")) PKs += "," + $(this).data("pk"); });

            // call delete
            $.ajax({
                url: WebServicePath() + "DeleteMemberTraining?pUseContactNumber=" + pk_val("Page.UseCN") + "&pMTMN=" + MTMN + "&pPKs=" + PKs.replace("-1,",""), success:
                function (result) {
                    // if OK
                    if (result.d) {
                        var RemovedPLP = 0;

                        // loop all instances of training
                        $(".TRD_CHK").each(function () {
                            // if selected to remove
                            if ($(this).is(":checked")) {
                                if ($(".trMTMN", $("#trX_" + $(this).data("pk")).closest(".MEMBTRNDIV")).size() === 1)
                                    $(".trPLPHead", $("#trX_" + $(this).data("pk")).closest(".MEMBTRNDIV")).remove();
                                $("#trX_" + $(this).data("pk")).parent().remove(); // the TR
                            }
                        });

                        // check to see how many other instances there are
                        var vReamaining = 0;
                        $(".trMTMN").each(function () { if ($(this).data("pk") === MTMN) vReamaining = vReamaining + 1; });

                        // if none, then remove from all training plp's
                        if (vReamaining === 0) $(".trAllMTMN").each(function () { if ($(this).data("pk") === MTMN) $(this).remove(); });

                        $("#lit_ALLPLP").text($(".trAllMTMN").size() > 0 ? " (" + $(".trAllMTMN").size() + ")" : "");
                        $("#lit_PLP").text($(".MEMBTRNDIV").size() > 0 ? " (" + $(".MEMBTRNDIV").size() + ")" : "");

                        if ($(".MEMBTRNDIV").size() === 0) {
                            if (pk_val("User.IsMe")) $("#tbl_p5_TrainModules").parent().html("You don't have any roles with any training requirements.<br/><br/>");
                            else $("#tbl_p5_TrainModules").parent().html("There are no roles with any training requirements for this person.<br/><br/>");
                        }

                        if ($(".trAllMTMN").size() === 0) {
                            if (pk_val("User.IsMe")) $("#tbl_p5_AllTrainModules").parent().html("You don't have any training requirements.<br/><br/>");
                            else $("#tbl_p5_AllTrainModules").parent().html("There are no training requirements for this person.<br/><br/>");
                        }

                        // show correct message
                        if (RemovedPLP > 0)
                            $.system_alert("PLP Link for<br/><br/><b>" + TrainingName + "</b><br/><br/>has been deleted.<br/>" + RemovedPLP + " Empty PLP" + (RemovedPLP > 1 ? "'s have" : " has") + " also been removed.");
                        else
                            $.system_alert("PLP Link for<br/><br/><b>" + TrainingName + "</b><br/><br/>has been deleted.");
                    }
                }, error: ServiceFailed
            });

            CloseHintPopup();
            return true;
        });
    }
}

function DeleteMOGL(pMTHN, pTR, pOGLcode) {
    var MSG = "Are you sure you want to <b>delete</b> this Mandatory Ongoing Learning item?";

    $.system_confirm(MSG,
        function () {
            CloseHintPopup();
            $.ajax({
                url: WebServicePath() + "DeleteMemberOGL?pUseContactNumber=" + pk_val("Page.UseCN") + "&pMTHN=" + pMTHN, success:
               function (result) {
                   if (result.d) {
                       DeleteMOGL_TR(pTR, pOGLcode);

                       //TSA-635 Look for anywhere else this same item is listed and remove it from there too.
                       $(".MOGL_DELETE").each(function () {
                           if ($(this).data('pk') === pMTHN) DeleteMOGL_TR($(this).closest("tr"), $(this).data('OGLcode'));
                       });

                       //Finally tidy up if nothing is left
                       if ($(".TrainOGLSumLine").length < 1) {
                           //No MOGL left
                           $("#tbl_p5_TrainOGL").remove();

                           if (pk_val("User.IsMe"))
                               $("#divProfile11").text("You currently have no mandatory ongoing learning history.");
                           else
                               $("#divProfile11").text("There is no mandatory ongoing learning history for this person.");
                       }
                   }
                   else
                       $.system_alert("Failed to delete Mandatory Ongoing Learning item.");
               }, error: ServiceFailed
            });
        },
        CloseHintPopup,
        false);
}

function DeleteMOGL_TR(pTR, pOGLcode)
{
    //TSA-635: New function ONLY TO BE CALLED FROM DeleteMOGL() above, NOT DIRECTLY.
    //         When a training item that 'lives' in 2+ categories is deleted, only ask the user once if they want to delete it and just scrub the on-screen records.
    //         The process managed by DeleteMOGL() and this function is called to tidy up each removed entry.
    if ($(".SubFoldOGLdata_" + pOGLcode).length > 1) {
        //some data remains, so remove the deleted item, leave the header in place and update the summary with the most recent data
        $(pTR).remove();

        var vNewComp = $(".OGLComp_" + pOGLcode).first().text();
        var vNewRen = $(".OGLRenew_" + pOGLcode).first().text();

        $("#tdLastComplete_" + pOGLcode + " > label").first().text(vNewComp);
        $("#tdRenewal_" + pOGLcode + " > label").first().text(vNewRen);
    }
    else {
        //last one deleted, so remove it, the header and the summary
        $(pTR).remove();
        $(".SubFoldOGL_" + pOGLcode).remove();
        $(".TrainOGLSumLine_" + pOGLcode).remove();
    }
}


function UpdateTraining(MTMN, Readonly,FromPLP, MRN) {
    var ExtraURLParam = "";
    if (FromPLP) {
        if ($(".cbo_LM_" + MTMN).attr("value")) {
            $(".cbo_LR_" + MTMN).parent().html("<label>" + $(".cbo_LR_" + MTMN + " option:selected").first().text() + "</label>").css("text-align", "left");

            if ($(".cbo_LM_" + MTMN + " option:selected").first().attr("value"))
                $(".cbo_LM_" + MTMN).parent().html("<label>" + $(".cbo_LM_" + MTMN + " option:selected").first().text() + "</label>");
            else
                $(".cbo_LM_" + MTMN).parent().html("");

            $(".COMPL_" + MTMN).parent().html("<label>" + $(".COMPL_" + MTMN).first().val() + "</label>");
        }
        if ($(".ValOn_" + MTMN).val()) {
            $(".ValOn_" + MTMN).parent().html("<label>" + $(".ValOn_" + MTMN).first().val() + "</label>");
        }
        SetEnabled();

        if (MRN)
            ExtraURLParam = "&MRN=" + MRN;
    }

    OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTraining.aspx?CN=' + pk_val("Page.UseCN") + "&" + (Readonly ? "VIEW" : "EDIT") + "=" + MTMN + ExtraURLParam, '69%', '850px', '90%', '750px', '350px', true, false);
}

function AddTraining(MRN) {
    OpeniFrame(WebSitePath() + 'Popups/Maint/UpdateTraining.aspx?CN=' + pk_val("Page.UseCN") + "&MRN=" + MRN, '69%', '850px', '90%', '750px', '350px', true, false);
}

function HideTrainingFolds(Self, cls, PK) {
    // this line when commented out will allow All/many/none training items to be folded at the same time, commented in only 1 open at a time.
    if (Self) $("." + cls).not("." + cls + "_" + $(Self).data(PK)).css("display", "none");

    if (Self && $(Self).next().css("display") === "none") $("." + cls + "_" + $(Self).data(PK)).css("display", "");
    else $("." + cls).css("display", "none");
}

function DelTrainingHours() {
    var self = this;
    $.system_confirm("Are you sure?", function () {
        var ParentTR = $(self).parent().parent();
        var year = ParentTR[0].className.substr(ParentTR[0].className.indexOf('SubFoldTR_') + 10, 4);
        var trSectionCLS = ParentTR.prev()[0].classList[ParentTR.prev()[0].classList.length - 1]; // header (total line) class name (SubFoldTR_2011 etc)
        // DB remove
        $.ajax({ url: WebServicePath() + "DeleteTrainingHours?pUseContactNumber=" + pk_val("Page.UseCN") + "&pURN=" + $(self).data("ng_id") });
        // remove row
        ParentTR.remove();
        // calc remaining hours
        var mins = 0;
        $(".DelHours", $("." + trSectionCLS)).each(function () {
            mins += parseInt($(this).data("minutes"), 10);
        });
        // hide section if none left
        if (mins === 0) $(".SubFoldTR").css("display", "none");
        // show total (even if zero)
        $("label", $("#" + trSectionCLS.replace("SubFoldTR_", "total_"))).text(MinutesToTime(mins));
        if (mins === 0) {
            $(".SubFoldTR_" + year).first().prev().remove();
            $(".SubFoldTR_" + year).remove();
        }

        if ($("tr", $("#tbl_p5_TrainHours")).length === 1)
            $("#divProfile12").html("There is no ongoing learning history for this person.<br><br>");
    });
}

//#endregion

//#region Page 6 - Awards

function DoNomDelete(pID) {
    $.ajax({
        url: WebServicePath() + "DeleteNomination?pNominationID=" + pID
       , success:
           function (result) {
               if (result.d) {
                   $('#trNom_' + pID).remove();
               }
               else $.system_alert("Failed to delete nomination.");
           }, error: ServiceFailed
    });
}

function FormatNomText(TextToFormat) {
    return TextToFormat.replace("¬", "'");
}

function AwardNominate() {
    //u,t,w,h,mw,mh
    OpeniFrame(WebSitePath() + 'Popups/Nomination.aspx?FROM=PROF' + (!pk_val("User.IsMe") ? '&CN=' + pk_val("Page.UseCN") : ''), '69%', '760px', '90%', '760px', '380px', true, false);
    return false;
}

function DeleteNomination(pID, pDesc) {
    $.system_confirm("Are you sure you want to <b>delete</b> your nomination of " + FormatNomText(pDesc) + "?",
        function () { CloseHintPopup(); DoNomDelete(pID); },
        function () { CloseHintPopup(); },
        false);
}

function SetNomAwarded(pID, pDesc) {
    $.system_confirm("Set the status of " + FormatNomText(pDesc) + " to <b>Awarded</b>?",
        function () { CloseHintPopup(); ChangeNominationStatus(pID, 'A', 'Awarded', '', ''); },
        function () { CloseHintPopup(); },
        false);
}

function SetNomPublished(pID, pDesc, pLocation, pAwardedDate) {
    $.system_confirm("Set the status of " + FormatNomText(pDesc) + " to <b>Published</b>?",
        function () { CloseHintPopup(); ChangeNominationStatus(pID, 'P', 'Published', pLocation, pAwardedDate); },
        function () { CloseHintPopup(); },
        false);
}

function SetNomDeclined(pID, pDesc) {
    $.system_confirm("Set the status of " + FormatNomText(pDesc) + " to <b>Declined</b>?",
        function () { CloseHintPopup(); ChangeNominationStatus(pID, 'D', 'Declined', '', ''); },
        function () { CloseHintPopup(); },
        false);
}

function SetNomArchived(pID, pDesc) {
    $.system_confirm("<b>Archive</b> " + FormatNomText(pDesc) + "?",
        function () { CloseHintPopup(); ChangeNominationStatus(pID, 'X', 'Archived', '', ''); },
        function () { CloseHintPopup(); },
        false);
}

function ChangeNominationStatus(pID, pNewStatus, pNewStatusDesc, pLocation, pAwardedDate) {
    $.ajax({
        url: WebServicePath() + "SetNominationStatus?pNominationID=" + pID
                            + "&pNewStatus=" + pNewStatus
       , success:
           function (result) {
               if (result.d) {
                   //if (pNewStatus == 'P') {
                   //    //remove from list
                   //    $('#trNom_' + pID).remove();
                   //}

                   if (pNewStatus === 'D' || pNewStatus === 'A' || pNewStatus === 'X' || pNewStatus === 'P') {
                       //update entry on-screen
                       if (pNewStatus === 'X') {
                           var oldStat = $("#tdNomStatus_" + pID + " label").text();
                           $("#tdNomStatus_" + pID + " label").text(oldStat + "/" + pNewStatusDesc);
                           $("#trNom_" + pID).attr('archived', 'archived');
                           $("#tbNom_" + pID).removeClass("msAward");
                           $("#tbNom_" + pID).addClass("msAwardArchived");
                       }
                       else {
                           $("#tdNomStatus_" + pID + " label").text(pNewStatusDesc);
                       }
                       $("#tdNomStatusDate_" + pID + " label").text(formatDate(new Date(), "dd MMM yyyy"));

                       //hide all buttons
                       $("#tdNomOptions_" + pID + " input").css('display', 'none').css('margin-right', '0px');

                       //re-enable relevant buttons
                       $("#bnNomReview_" + pID).css('display', 'inline').css('margin-right', '5px');
                       if (pNewStatus === 'D') $("#bnNomArchive_" + pID).css('display', 'inline');
                       if (pNewStatus === 'A') $("#bnNomPublish_" + pID).css('display', 'inline');
                       if (pNewStatus === 'P') {
                           $("#bnNomReview_" + pID).val("View");
                           $("#trNomName_" + pID).remove();
                           $("#tdNomStatusCap_" + pID + " b").text("Award Location");
                           $("#tdNomStatus_" + pID + " label").text(FormatNomText(pLocation));
                           $("#tdNomStatusDateCap_" + pID + " b").text("Awarded Date");
                           $("#tdNomStatusDate_" + pID + " label").text(pAwardedDate);
                           //Move table row from nominations table to awards table.
                           $('#trNom_' + pID).clone().end().appendTo($('#tbl_p6_Awards'));
                           $('#lblNoAwards').remove();
                       }
                   }
                   ShowHideArchivedNominations();
               }
               else $.system_alert("Failed to " + (pNewStatus === 'X' ? "archive" : "update") + " nomination.");
           }, error: ServiceFailed
    });
}

function ShowHideArchivedNominations(DontDoSave) {
    $("tr[archived]").css("display", ($("#chkArcNom").prop("checked") ? "" : "none"));
    if (!DontDoSave) SaveUserSettings("MemberProfile_ShowArcNom", $("#chkArcNom").prop("checked") ? "Y" : "");
    // hide checkbox TR line if there are no archived nominations
    $("#trArcNom").css("display", $("tr[archived]").size() === 0 ? "none" : "");
}
//#endregion

//#region page 7 - youth badges
function BadgeProgress(pBN) {
    OpeniFrame(WebSitePath() + 'Popups/Maint/BadgeProgress.aspx?CN=' + pk_val("Master.User.CN") + '&EDIT=' + pBN + '&UseCN=' + pk_val("Page.UseCN"), '69%', '90%', '90%', '550px', '400px', true, false);
}
function ViewBadgeProgress(pBN) {
    OpeniFrame(WebSitePath() + 'Popups/Maint/BadgeProgress.aspx?CN=' + pk_val("Master.User.CN") + '&VIEW=' + pBN + '&UseCN=' + pk_val("Page.UseCN"), '69%', '90%', '90%', '550px', '400px', true, false);
}

function BadgeInterest(e,pBN) {
    var html = "";
    var buttonbar = "";
    var windowTitle = "";

    html += "<div style='max-height:300px;overflow:auto; margin-left:20px; margin-right:20px;'><table style='width:100%;'>";
    html += "<tr id=\"mytr\"><td><center>Are you sure you wish to register for the following badge?<br /><br /><img class='BadgeImage bCardImage' src='" + $("img", $(e).parent().parent()).eq(0).attr("src") + "' /><br/><b>" + $("a", $(e).parent().parent()).eq(0).html() + "</b></center></td></tr>";
    html += "</table></div><br/>";
    buttonbar += "<input id='bnRegister' type='button' value='Register' class='sysmsg_bn'>&nbsp;<input type='button' id='bnCancelReg' class='sysmsg_close' value='Cancel'>";

    windowTitle = "<h2>Register Interest</h2>";

    $.system_window(html, windowTitle, buttonbar, 2);

    $("#bnRegister").click(function () {
        $('#bnRegister, #bnCancelReg').attr('disabled', 'disabled');
        RegisterInterest(pBN);
        setTimeout(function () { CloseHintPopup(); }, 7500);
        return true;
    });
}

function RegisterInterest(pBN) {
    $.ajax({
        url: WebServicePath() + "RegisterBadgeInterest?pBN=" + pBN + "&pUseCN=" + pk_val("Page.UseCN"), async: false, success: function (result) {

            if (result.d > 0)
                window.location.href = window.location.href + "&Page=Badges";

        }, error: ServiceFailed
    });

}

function DoBadgeFilter(self,e) {
    var query = $.trim($(self).val()).replace(/ or /gi, '|');

    if (query) {
        //add OR for regex query
        $(".bCard", "." + $(self).prop("class")).each(function () {
            if ($(".badgeDesc", this).text().search(new RegExp(query, "i")) < 0)
                $(this).hide();
            else
                $(this).show();
        });
    }
    else if (e.type === "blur" && query === "")
    {
        $(".bCard", "." + $(self).prop("class")).each(function () {
            $(this).show();
        });
    }
}

//#endregion

//#region page 8 - Events
    function UpdateInviteeStatus(e, eventNumber, contactNumber, status) {

        $.ajax({
            url: WebServicePath() + "UpdateInviteeStatus?pEN=" + eventNumber + "&pCN=" + contactNumber + "&pStatus=" + status, async: false, success: function (result) {
                if (status === 'DECL') {
                    $(".AcceptButton", $(e).parent()).css("display", "none");
                    $(".RejectButton", $(e).parent()).css("display", "none");
                    $(".ChangeButton", $(e).parent()).css("display", "");
                }
                else {
                    $(".AcceptButton", $(e).parent()).css("display", "");
                    $(".RejectButton", $(e).parent()).css("display", "");
                    $(".ChangeButton", $(e).parent()).css("display", "none");
                }
            }, error: ServiceFailed
        });

    }
//#endregion

//#region page 12 - Disclosures

function ReqDisclosure(MRN) {
    OpeniFrame(WebSitePath() + 'Popups/Profile/RequestDisclosure.aspx?CN=' + pk_val("Page.UseCN") + (MRN ? "&MRN=" + MRN : ""), '55%', (MRN ? "700px" : "900px"), '420px', '550px', '420px', true, false);
    return false;
}

//#endregion

//#region Page 13 - Parents

function UpdateParent(ChildCN, ParentCN) {
    OpeniFrame(WebSitePath() + 'Popups/Profile/Parent.aspx?EDIT=' + ChildCN + "." + ParentCN, '69%', '1000px', '90%', '550px', '320px', true, false);
}

function AddParent() {
    OpeniFrame(WebSitePath() + 'Popups/Profile/Parent.aspx?NEW=' + pk_val("Page.UseCN"), '69%', '1000px', '90%', '550px', '320px', true, false);
    return false;
}

function RemoveParent(ChildCN, ParentCN) {
    var vDetail1 = "";
    var vDetail2 = "";

    vDetail1 = $("#msIDTD_name_" + ParentCN).children('label:first').text();
    if (!vDetail1) vDetail1 = $("#msIDTD_name_" + ParentCN).children('a:first').text();
    vDetail2 = $("#msIDTD_rel_" + ParentCN).children('label:first').text();

    if ($("#msIDTD_name_" + ParentCN).closest("tr").find('.togPAR').first().is(":checked")) //TSA-340: change selector now checkbox doesn't have a CN-specific ID
        $.system_alert("Cannot remove a parent who is set to receive communications.<br />&nbsp;");
    else if ($('#tbl_p13_parents tr').length <= 2)
        $.system_alert("Cannot remove the only parent.<br />&nbsp;");
    else
        $.system_confirm("Remove : " + vDetail1 + " (" + vDetail2 + ")?<br />&nbsp;", function () {
            $.ajax({
                url: WebServicePath() + "RemoveParentLink?pParentContactNumber=" + ParentCN + "&pChildcontactNumber=" + ChildCN, success: function (result) {
                    if (result.d === "OK") $("#msIDTD_name_" + ParentCN).closest("tr").remove();
                }, error: ServiceFailed
            });
        });
}

//#endregion