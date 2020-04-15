$(document).ready(SetupMenu);

function SetupMenu() {
    $('#ctl00_UserTitleMenu_cboUCRoles').data("orig", $('#ctl00_UserTitleMenu_cboUCRoles').val());
    setTimeout(function () { $("#menu2_icons").show(); }, 201);

    $("a", $("#menu2_bar")).each(function () { if (!$(this).is(":visible")) $(this).remove(); });
    if (($.Is_Android() || $.Is_IPad() || $.Is_IPhone()) && $("a", $("#menu2_bar")).length >= 8) {
        if ($("a", $("#menu2_bar")).length > 8)
            $("a", $("#menu2_bar").css("margin-left", "-50px")).css({ "margin-left": "2px", "margin-right": "2px" });
        else
            $("a", $("#menu2_bar").css("margin-left", "-30px")).css({ "margin-left": "2px", "margin-right": "2px" });
    }

    $("#ctl00_UserTitleMenu_cboUCRoles").change(SetNewRole);

    $("#mn_JN").click(function () { SH_Search(true, "#divJoiningMenu"); return false; }).mouseover(function () { SH_Search(true, "#divJoiningMenu"); });
    $("#mn_TRN").click(function () { SH_Search(true, "#divTrainingMenu"); return false; }).mouseover(function () { SH_Search(true, "#divTrainingMenu"); });
    $("#mn_MSG_HDR").click(function () { SH_Search(true, "#divMessagingMenu"); return false; }).mouseover(function () { SH_Search(true, "#divMessagingMenu"); });
    $("#mn_MSG2").click(function () { SH_Search(true, "#divMessagingMenu"); window.location.href = "ScoutsPortal.aspx"; return false; }).attr("href", "ScoutsPortal.aspx");
    $("#mn_MSG3").click(function () { SH_Search(true, "#divMessagingMenu"); window.location.href = "ScoutsPortal.aspx"; return false; }).mouseover(function () { SH_Search(true, "#divMessagingMenu"); }).attr("href", "ScoutsPortal.aspx");

    $("#mn_SYS").click(function () { SH_Search(true, "#divSystemMenu"); return false; }).mouseover(function () { SH_Search(true, "#divSystemMenu"); });
    $("#mn_SB").click(function () { SH_Search(true, "#divSearchMenu"); return false; }).mouseover(function () { SH_Search(true, "#divSearchMenu"); });
    $("#mn_CHL").click(function () { SH_Search(true, "#divChildrenMenu"); return false; }).mouseover(function () { SH_Search(true, "#divChildrenMenu"); });

    $(".mn_clk").click(function () { closeAllMenus(); return ShowLoadingMessage(); }).each(function () { $(this).parent().click(closeAllMenus); });
    $(".mn_mo").mouseover(closeAllMenus);

    $(".menu2-settings").click(function () {
        if (ShowLoadingMessage(true))
            OpeniFrame(WebSitePath() + "Popups/Settings.aspx", '350px', '600px', '290px', '600px', '290px', false, true);
        return false;
    });

    $(".menu2-logout").click(Logout);

    $("#mn_AD").click(SelectDistributionLists);

    $("#CNLookup2").keypress(function (e) { return NumberOnly_KeyPress(e || event, function (CN) { $('#divSearch').css('display', 'none'); GotoCN(CN); }); }).blur(function () { NumberOnly_Blur(this, true, 8); });

    $("#mn_QS").click(function () { $("#divSearchMenu").css("display", "none"); return SearchButtonClick("CNLookup2"); });
    $("#mn_HS").click(HierSearch);
    $("#mn_MS").click(function () {
        if (ShowLoadingMessage(true))
            OpeniFrame(WebSitePath() + "Popups/MemberSearch.aspx?Clear=Y", "69%", "890px", "90%", "550px", "", true, false);
        SH_Search(false, "#divSearch"); return false;
    });

    $("#mn_YJ").click(function () {
        SH_Search(false, "#divMenu");
        OpeniFrame(WebSitePath() + "Popups/YouthJoining.aspx", "69%", "1000px", "90%", "550px", "320px", true, false);
        return false;
    });

    $("#mn_AJ").click(function () {
        SH_Search(false, "#divMenu");
        OpeniFrame(WebSitePath() + "Popups/AdultJoining.aspx", "69%", "1000px", "90%", "550px", "320px", true, false);
        return false;
    });

    $("#mn_AR").click(function () {
        SH_Search(false, "#divMenu");
        OpeniFrame(WebSitePath() + "Popups/Profile/AssignNewRole.aspx", "69%", "900px", "90%", "550px", "320px", true, false);
        return false;
    });

    $(".mn_CLD").click(function () {
        SH_Search(false, "#divChildren");
        ShowLoadingMessage();
        GotoCN($(this).data("cn"));
        return false;
    });

    $.AttrToData("cn");

    $("#mn_MH").click(function () {
        window.location.href = "MessageHistory.aspx";
        return false;
    }).attr("href", "MessageHistory.aspx");

    $("#mn_LH").click(function () {
        window.location.href = "LoginHistory.aspx";
        return false;
    }).attr("href", "LoginHistory.aspx");

    $("#mn_ATRN").click(function () {
        window.location.href = "MemberTraining.aspx?YA=A";
        return false;
    }).attr("href", "MemberTraining.aspx?YA=A");

    $("#mn_YTRN").click(function () {
        window.location.href = "MemberTraining.aspx?YA=Y";
        return false;
    }).attr("href", "MemberTraining.aspx?YA=Y");

    $("#mn_WL").click(function () {
        window.location.href = "WaitingList.aspx";
        return false;
    }).attr("href", "WaitingList.aspx");

    $("#mn_NOM").click(function () {
        window.location.href = "Nominations.aspx";
        return false;
    }).attr("href", "Nominations.aspx");

    $("#mn_HR").click(function () {
        window.location.href = "Hierarchy.aspx";
        return false;
    }).attr("href", "Hierarchy.aspx");

    $("#mn_EV").click(function () {
        window.location.href = "Events.aspx";
        return false;
    }).attr("href", "Events.aspx");

    $("#mn_BG").click(function () {
        window.location.href = "Badgesearch.aspx";
        return false;
    }).attr("href", "Badgesearch.aspx");

    $("#mn_BS").click(function () {
        window.location.href = "Badges.aspx";
        return false;
    }).attr("href", "Badges.aspx");

    $("#mn_BR").click(function () {
        window.location.href = "BadgeRequirements.aspx";
        return false;
    }).attr("href", "BadgeRequirements.aspx");

    $("#mn_TS").click(function () {
        window.location.href = "Training.aspx";
        return false;
    }).attr("href", "Training.aspx");

    $("#mn_RS").click(function () {
        window.location.href = "Roles.aspx";
        return false;
    }).attr("href", "Roles.aspx");

    $("#mn_PS").click(function () {
        window.location.href = "Permits.aspx";
        return false;
    }).attr("href", "Permits.aspx");

    //TSA-783
    $("#mn_VT").click(function () {
        window.location.href = "Vetting.aspx";
        return false;
    }).attr("href", "Vetting.aspx");

    $("#mn_DL").click(function () {
        window.location.href = "DistributionLists.aspx";
        return false;
    }).attr("href", "DistributionLists.aspx");

    $("#mn_RP").click(function () {
        window.location.href = "Reports.aspx";
        return false;
    }).attr("href", "Reports.aspx");

    $(".menu2-spacer").click(function () { return false; });
}

function SetNewRole() {
    if (ShowLoadingMessage()) {
        var OrigURL = window.location.href;
        var NewURL = OrigURL;
        // remove any options or error messages
        if (NewURL.lastIndexOf("?") > 0) NewURL = NewURL.substr(0, NewURL.lastIndexOf('?'));
        if (NewURL.toLowerCase().lastIndexOf("searchresults.aspx") > 0)
            NewURL = NewURL.substr(0, NewURL.toLowerCase().lastIndexOf("searchresults.aspx")) + "ScoutsPortal.aspx"; //TP-397: switching roles on SearchResults falls over as search params lost

        // for profile, add back a few we want to keep)
        if (OrigURL.toLowerCase().lastIndexOf('memberprofile.aspx') > 0) {
            var Params = OrigURL.substr(OrigURL.lastIndexOf('?') + 1);
            for (var i = 0; i < Params.split('&').length; i++) {
                if (Params.toLowerCase().split('&')[i].indexOf('page=') >= 0 || Params.toLowerCase().split('&')[i].indexOf('cn=') >= 0)// allowed params to keep
                    NewURL += (NewURL.indexOf('?') > 0 ? "&" : "?") + Params.split('&')[i];
            }
        }

        // need to keep YA marker
        if (OrigURL.toLowerCase().lastIndexOf('membertraining.aspx') > 0) { NewURL = OrigURL; }

        if (NewURL.lastIndexOf("#") === NewURL.length - 1)
            NewURL = NewURL.substring(0, NewURL.length - 1);

        if (pk_val("Master.Sys.REST")) {
            var vData = {}; //var vData = new FormData();
            vData["MRN"] = $(this).val();
            PostToHandler(vData, "API/ChangeRole", function (result) { if (result) { window.location.href = NewURL; } else { window.location.href = "ScoutsPortal.aspx?Invalid=SecurityParam" } }, null, false, true);
        } else {
            var vData = {}; //var vData = new FormData();
            vData["ROLE"] = $(this).val();
            PostToHandler(vData, undefined, function () { window.location.href = NewURL; });
        }
        return true;
    } else {
        $(this).val($(this).data("orig"));
        return false;
    }
}

function positionMenus() {
    var MadeChange = false;
    if (StopResize) return MadeChange;

    var LeftPos = 0;
    var TopPos = 0;
    // menu items box width
    var PageWidth = Math.ceil((($("body").width() - $(".scoutslogo").width()) - $("#menu2_icons").width()) - 30 - parseInt(($("#menu2_bar").css("margin-left") ? $("#menu2_bar").css("margin-left") : "0").replace("px", ""), 10));
    if (PageWidth !== Math.ceil($("#menu2_bar").css("width").replace("px", ""))) {
        $("#menu2_bar").css({ "width": PageWidth });
        MadeChange = true;
    }

    // menu positions.
    try {
        if ($("#mn_CHL").position()) {
            LeftPos = Math.ceil($("#mn_CHL").position().left - ($("#divChildrenMenu").width() - $("#mn_CHL").width()));
            if (LeftPos !== Math.ceil($("#divChildrenMenu").css("left").replace("px", ""))) $("#divChildrenMenu").css("left", LeftPos);
            $("#divChildrenMenu").css("top", Math.ceil($("#mn_CHL").position().top - $("#mn_CHL").height() - 15));
        }
    } catch (e) { }

    // left positions of menu headers
    if ($("#mn_JN").position()) {
        LeftPos = Math.ceil($("#mn_JN").position().left - ($("#divJoiningMenu").width() - $("#mn_JN").width()));
        if (LeftPos !== Math.ceil($("#divJoiningMenu").css("left").replace("px", ""))) {
            $("#divJoiningMenu").css("left", LeftPos);
            MadeChange = true;
        }
    }
    if ($("#mn_TRN").position()) {
        LeftPos = Math.ceil($("#mn_TRN").position().left - ($("#divTrainingMenu").width() - $("#mn_TRN").width()));
        if (LeftPos !== Math.ceil($("#divTrainingMenu").css("left").replace("px", "")))
        {
            $("#divTrainingMenu").css("left", LeftPos);
            MadeChange = true;
        }
    }
    if ($("#mn_MSG_HDR").position()) {
        LeftPos = Math.ceil($("#mn_MSG_HDR").position().left - ($("#divMessagingMenu").width() - $("#mn_MSG_HDR").width()));
        if (LeftPos !== Math.ceil($("#divMessagingMenu").css("left").replace("px", ""))) {
            $("#divMessagingMenu").css("left", LeftPos);
            MadeChange = true;
        }
    }
    if ($("#mn_SYS").position()) {
        LeftPos = Math.ceil($("#mn_SYS").position().left - ($("#divSystemMenu").width() - $("#mn_SYS").width()));
        if (LeftPos !== Math.ceil($("#divSystemMenu").css("left").replace("px", ""))) {
            $("#divSystemMenu").css("left", LeftPos);
            MadeChange = true;
        }
    }
    if ($("#mn_SB").position()) {
        LeftPos = Math.ceil($("#mn_SB").position().left - ($("#divSearchMenu").width() - 30));
        if (LeftPos !== Math.ceil($("#divSearchMenu").css("left").replace("px", ""))) {
            $("#divSearchMenu").css("left", LeftPos);
            MadeChange = true;
        }
    }

    /// top position of menu headers
    if ($("#mn_JN").position()) {
        TopPos = Math.ceil($("#mn_JN").position().top - $("#mn_JN").height() - 16);
        if (TopPos !== Math.ceil($("#divJoiningMenu").css("top").replace("px", ""))) {
            $("#divJoiningMenu").css("top", TopPos);
            MadeChange = true;
        }
    }
    if ($("#mn_TRN").position()) {
        TopPos = Math.ceil($("#mn_TRN").position().top - $("#mn_TRN").height() - 16);
        if (TopPos !== Math.ceil($("#divTrainingMenu").css("top").replace("px", ""))) {
            $("#divTrainingMenu").css("top", TopPos);
            MadeChange = true;
        }
    }
    if ($("#mn_MSG_HDR").position()) {
        TopPos = Math.ceil($("#mn_MSG_HDR").position().top - $("#mn_MSG_HDR").height() - 16);
        if (TopPos !== Math.ceil($("#divMessagingMenu").css("top").replace("px", ""))) {
            $("#divMessagingMenu").css("top", TopPos);
            MadeChange = true;
        }
    }
    if ($("#mn_SYS").position()) {
        TopPos = Math.ceil($("#mn_SYS").position().top - $("#mn_SYS").height() - 16);
        if (TopPos !== Math.ceil($("#divSystemMenu").css("top").replace("px", ""))) {
            $("#divSystemMenu").css("top", TopPos);
            MadeChange = true;
        }
    }
    // now work out top of search menu (depends on which message menu is being used)
    if ($("#mn_MSG_HDR").position()) {
        TopPos = Math.ceil($("#mn_MSG_HDR").position().top - $("#mn_MSG_HDR").height() - 16);
        if (!$("#divSearchMenu").css("top") || TopPos !== Math.ceil($("#divSearchMenu").css("top").replace("px", ""))) {
            $("#divSearchMenu").css("top", TopPos);
            MadeChange = true;
        }
    }
    else if ($("#mn_MSG2").position()) {
        TopPos = Math.ceil($("#mn_MSG2").position().top - $("#mn_MSG2").height() - 16);
        if (!$("#divSearchMenu").css("top") || TopPos !== Math.ceil($("#divSearchMenu").css("top").replace("px", ""))) {
            $("#divSearchMenu").css("top", TopPos);
            MadeChange = true;
        }
    }
    else if ($("#mn_MSG3").position()) {
        TopPos = Math.ceil($("#mn_MSG3").position().top - $("#mn_MSG3").height() - 16);
        if (!$("#divSearchMenu").css("top") || TopPos !== Math.ceil($("#divSearchMenu").css("top").replace("px", ""))) {
            $("#divSearchMenu").css("top", TopPos);
            MadeChange = true;
        }
    }

    return MadeChange;
}

function closeAllMenus(NotMenu, forceQuick) {
    var FadeMenus = true;
    var Selector = (NotMenu ? $('#divChildrenMenu,#divJoiningMenu,#divTrainingMenu,#divMessagingMenu,#divSystemMenu,#divSearchMenu').not(NotMenu) : $('#divChildrenMenu,#divJoiningMenu,#divTrainingMenu,#divMessagingMenu,#divSystemMenu,#divSearchMenu'));
    if (!forceQuick && FadeMenus) Selector.fadeOut(100);
    else Selector.css({ "display": "none" });
    if (MenuTIDX > 0)clearTimeout(MenuTIDX);
    MenuTIDX = -1;
}

function SH_Search(Show, div) {
    closeAllMenus(div);
    $(div).css({ "display": (Show ? "" : "none") });
    positionMenus();
    if (Show && div === "#divSearchMenu") { $.FocusControl("#CNLookup2", true, 150); }
}