import os
import uuid
import warnings

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import HTMLResponse

from compass.core.logon import Settings

# ASP.NET id is 24 characters, lower-case alpha and digits
asp_net_id = os.urandom(12).hex()
id_map: dict[str, str] = {}  # ASP.NET id -> session id
username_map: dict[str, str] = {}  # ASP.NET id -> username
session_id_default = "d6c76537-1b6c-3910-c3d4-d21d4e6453a6"

app = Starlette()


def generate_asp_net_id() -> str:
    return os.urandom(12).hex()


@app.route("/", methods=["head"])
async def get_root(_request: Request) -> HTMLResponse:
    _asp_net_id = generate_asp_net_id()
    id_map[_asp_net_id] = str(uuid.uuid4())
    response = HTMLResponse(b"")
    response.set_cookie("ASP.NET_SessionId", _asp_net_id)
    return response


@app.route("/_testing/no-cookie", methods=["head"])
async def get_testing_no_cookie(_request: Request) -> HTMLResponse:
    return HTMLResponse(b"")


@app.route("/Login.ashx", methods=["post"])
async def post_login_ashx(request: Request) -> HTMLResponse:
    if request.headers.get("Referer") != f"{Settings.base_url}/login/User/Login":
        # If the Referer header is not set properly, Compass silently fails and returns the login page
        return HTMLResponse(
            b'<!DOCTYPE html>\r\n<html lang="en">\r\n<head>\r\n    <meta charset="utf-8" />\r\n    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">\r\n    <title>The Scout Association</title>\r\n    <link rel="shortcut icon" media="all" type="image/x-icon" href="/login/Images/ico_compass.ico" />\r\n    <link rel="icon" media="all" type="image/vnd.microsoft.icon" href="/login/Images/ico_compass.ico" />\r\n    <!--[if IE]><script src="~/Scripts/html5.js"></script><![endif]-->\r\n\r\n    <script type="text/javascript">\r\n        //Break out of iframe\r\n        if (top.location !== location) {\r\n            top.location.href = document.location.href;\r\n        }\r\n    </script>\r\n    <link href="/login/Content/css?v=VZKccHPLGSKNFic6yG06sWCvfqCdbhlOngzX1wgfnHc1" rel="stylesheet"/>\r\n\r\n    <script src="/login/bundles/modernizr?v=qVODBytEBVVePTNtSFXgRX0NCEjh9U_Oj8ePaSiRcGg1"></script>\r\n\r\n</head>\r\n'
            b'<body>\r\n    <div id="background">\r\n        <div id="wrapper">\r\n            <div id="header">\r\n                <div id="logo">\r\n                    <img src="/login/Images/Template/The_Scout_Association.png" alt="The Scout Association Logo" />\r\n                </div>\r\n                <div id="maintitle">\r\n                    <h1>Login</h1>\r\n                </div>\r\n            </div>\r\n            <div id="content">\r\n                <div class="login-form-intro-text">\r\n    <p>\r\n        <i class="fa fa-info-circle scouts-colour"></i> Check out the <a href="http://compasssupport.scouts.org.uk/?page_id=59542" target="_blank" title="Warning, opens in a new window!">Support Site</a>\r\n        including video tutorials, user guides, <a href="http://compasssupport.scouts.org.uk/?page_id=59643" target="_blank" title="Warning, opens in a new window!">FAQs</a> and our \xe2\x80\x98'
            b'<a href="http://compasssupport.scouts.org.uk/?page_id=59537" target="_blank" title="Warning, opens in a new window!">Latest updates</a>\xe2\x80\x99 blog.\r\n    </p>\r\n    <p><i class="fa fa-exclamation-circle scouts-colour"></i> <a href="Register">Register</a> for Compass before you log in for the first time.\r\n    </p>\r\n</div>\r\n\r\n<!--Note, the compassMessages div is meant to be used to display external messages. The idea was that the messages would be hosted in a different server\r\n(members.scouts.org.uk) so that we could control the messages without having to deploy this page in Compass. Not working as of 17/02/2016 because\r\n we did not actaully complete it and approve it for go live.-->\r\n<div id="compassMessages">\r\n    <h2 id="compassMessagesTitle"></h2>\r\n    <span id="compassMessagesContent"></span>\r\n</div>\r\n\r\n\r\n\r\n'
            b'<form class="form-horizontal" role="form" action="https://compass.scouts.org.uk/Login.ashx" autocomplete="off" method="post" id="logonForm" data-parsley-validate>\r\n    <div class="form-group">\r\n        <label class="control-label col-sm-2" for="EM">Username</label>\r\n        <div class="col-sm-4">\r\n            <input type="text" class="form-control" id="EM" name="EM" placeholder="Enter username"\r\n                   required\r\n                   maxlength="80"\r\n                   data-parsley-required-message="Username is required"\r\n                   data-parsley-maxlength="80"\r\n                   data-parsley-maxlength-message="Username must not exceed 80 characters in length." />\r\n        </div>\r\n    </div>\r\n\r\n    <div class="form-group">\r\n        <label class="control-label col-sm-2" for="PW">Password</label>\r\n        <div class="col-sm-4">\r\n            '
            b'<input type="password" class="form-control" id="PW" name="PW" placeholder="Enter password"\r\n                   required\r\n                   maxlength="100"\r\n                   data-parsley-required-message="Password is required"\r\n                   data-parsley-maxlength="100"\r\n                   data-parsley-maxlength-message="Password must not exceed 100 characters in length.">\r\n        </div>\r\n    </div>\r\n\r\n    <div class="form-group">\r\n        <div class="col-sm-offset-2 col-sm-10">\r\n            <input type="hidden" name="ON" value="10000001" />\r\n            <button type="submit" class="btn btn-primary">Log in</button>\r\n        </div>\r\n    </div>\r\n</form>\r\n\r\n\r\n<div class="manageAccountLinksContainer">\r\n    <ul>\r\n        <li><a href="/login/User/Register">Register for your account</a> '
            b'(<a href="http://compasssupport.scouts.org.uk/?guide-cat=using-compass" target="_blank" title="Warning, opens in a new window!">Need help?</a>)</li>\r\n        <li> <a href="/login/User/ForgotUsername">Retrieve forgotten username</a> (<a href="http://compasssupport.scouts.org.uk/?guide-cat=using-compass" target="_blank" title="Warning, opens in a new window!">Need help?</a>)</li>\r\n        <li> <a href="/login/User/ForgotPassword">Reset your password</a> (<a href="http://compasssupport.scouts.org.uk/?guide-cat=using-compass" target="_blank" title="Warning, opens in a new window!">Need help?</a>)</li>\r\n    </ul>\r\n</div>\r\n\r\n\r\n\r\n            </div>\r\n            <div id="footer">\r\n                <!--<p>This is the Footer</p>-->\r\n            </div>\r\n        </div>\r\n    </div>\r\n    '
            b'<script type="text/javascript">\r\n\r\n        if (typeof console === "undefined") {\r\n            console = { log: function () { } };\r\n        }\r\n\r\n        window.ScoutLoginApplication = {};\r\n        (function (tsaApp) {\r\n            var rootPath = \'\';\r\n            tsaApp.rootPath = rootPath;\r\n        }(window.ScoutLoginApplication));\r\n        ScoutLoginApplication.rootPath = \'/login/\';\r\n        var applicationMessagesArray = new Array();\r\n            \r\n        applicationMessagesArray["RegistrationGenericErrorMsg"] = "Sorry, there was a problem registering you. You did not provide the correct information in one or more of the fields below. Please check your answers carefully. If this problem persists please call the Scout Information Centre on 0845 300 1818 or 020 8433 7100 for help."\r\n        \r\n            \r\n        applicationMessagesArray["EnableDatePickerWidgetOnAllForms"] = "True"'
            b'\r\n        \r\n            \r\n        applicationMessagesArray["InvalidUKPostCodePatternErrMsg"] = "Postcode does not match the required pattern. Take care to ensure that all letters are in UPPER CASE and that there is a space between the outer and inner parts of the post code e.g. E4 7QW instead of e47qw."\r\n        \r\n            \r\n        applicationMessagesArray["ValidUKPostCodePatternMsg"] = "Postcode pattern is valid."\r\n        \r\n            \r\n        applicationMessagesArray["ValidPasswordPatternMsg"] = "Password pattern is valid."\r\n        \r\n            \r\n        applicationMessagesArray["InvalidPasswordPatternErrMsg"] = "Password does not match the required pattern."\r\n        \r\n            \r\n        applicationMessagesArray["InvalidUsernamePatternErrMsg"] = "Username does not match allowed pattern"\r\n        \r\n            \r\n        '
            b'applicationMessagesArray["ValidUsernamePatternMsg"] = "Username pattern is valid"\r\n        \r\n\r\n        ScoutLoginApplication.applicationMessages = applicationMessagesArray;\r\n\r\n    </script>\r\n    \r\n    <script src="/login/bundles/logonjs?v=GIPO7plg5Q-bbDF8BW0hg7usbTfLYkbl72xdM3YPvts1"></script>\r\n\r\n\r\n</body>\r\n</html>\r\n'
        )
    valid_users = {
        b"EM=username&PW=password&ON=10000001": "username",
        b"EM=no_role_number&PW=password&ON=10000001": "no_role_number",
    }
    body = await request.body()
    if body not in valid_users:
        # If credentials are not correct, redirect to Failed Login page
        return HTMLResponse(
            b"<head><title>Compass - Failed Login</title><link rel='shortcut icon' type='image/vnd.microsoft.icon' href='https://compass.scouts.org.uk/Images/core/ico_compass.ico' sizes='16x16 24x24 32x32 48x48'></head><body onload='window.location.href=\"\"'></body>"
        )

    # store the requestor's id
    _asp_net_id = request.cookies["ASP.NET_SessionId"]
    username_map[_asp_net_id] = valid_users[body]

    # If all OK, return system startup page
    return HTMLResponse(
        b"<head><title>Compass - System Startup</title><link rel='shortcut icon' type='image/vnd.microsoft.icon' href='https://compass.scouts.org.uk/Images/core/ico_compass.ico' sizes='16x16 24x24 32x32 48x48'></head><body onload='window.location.href=\"https://compass.scouts.org.uk/ScoutsPortal.aspx\"'></body>"
    )


@app.route("/MemberProfile.aspx", methods=["get"])
async def get_member_profile(request: Request) -> HTMLResponse:
    if "TAB" not in request.query_params:
        warnings.warn("Didn't pass TAB", RuntimeWarning)
    page = request.query_params.get("Page")
    if page is None:
        pass  # TODO return Personal Details tab
    elif page == "ROLES":
        _asp_net_id = request.cookies["ASP.NET_SessionId"]
        username = username_map[_asp_net_id]
        role_number = {
            "username": b"~Master.User.MRN#9000000",
            "no_role_number": b"",
        }
        return HTMLResponse(
            b"<!DOCTYPE html><html xmlns='http://www.w3.org/1999/xhtml' id='mainhtml'><head><title>Scout - 10000000 John Smith</title></head><body><form name='aspnetForm' method='post' action='./MemberProfile.aspx?Page=ROLES&amp;TAB' id='aspnetForm' autocomplete='off'><div id='TSA'><input name='ctl00$_POST_CTRL' type='hidden' id='ctl00__POST_CTRL' value='Nav.Action#None~Nav.StartNo#-1~Nav.StartPage#3~Page.UseCN#10000000~CRUD.MDIS#R~CRUD.ROLES#R~CRUD.PEMD#R~CRUD.MMMD#R~CRUD.MVID#R~CRUD.PERM#R~CRUD.TRN#CRD~Page.HideBadges#Y~Page.Croc#OK~Page.HideNominations#Y~User.IsMe#Y~Page.CanDeleteOGLHrs#N~Page.FoldName#MP_~Master.SSO.ON#10000001~Master.User.CN#10000000"
            + role_number[username]
            + b"~Master.User.ON#10000001~Master.User.LVL#ORG~Master.User.JK#9b65d68f4aca0138b5bae4492e7cdfae220a834e3e69731d996be1ddbb496d32fd29497d4f9729525c9fbc77666bb520ea214c0802ea22b958e6ae525224fd15~Master.Const.Wales#10000007~Master.Const.Scotland#10000005~Master.Const.OverSeas#10000002~Master.Const.HQ#10000001~Master.Sys.SessionID#"
            + id_map[_asp_net_id].encode()
            + b"~Master.Sys.SafeJSON#Y~Master.Sys.WebPath#https%3a%2f%2fcompass.scouts.org.uk%2fJSon.svc%2f~Master.Sys.TextSize#1~Master.Sys.Timout#1729000~Master.Sys.REST#Y~Master.Sys.HardTime#20:18.28~Master.Sys.HardExpiry#6 hours~Master.Sys.TimeoutExtension#10~Master.Sys.Ping#300000~Const.Sys.STO#5~Const.Sys.STO_ASK#0'/></div><div id='ctl00_Popup_UpdatePanel'><div id='mstr_container'><div id='mstr_panel'><div id='mstr_scroll' style='position: relative; height: 50000px;'><div id='mstr_work'><div id='mpage3' class='mpage' style='visibility:hidden;'><div id='divProfile16'><table class='msTable' id='tbl_p3_roles'><tbody>"
            + b"<tr class='msTRRL msTR' data-pk='9000000'><td class='tdData'><a class='VIEWRL' data-ng_id='1' Title='Administrator' href='#'>Regional Administrator</a></td><td class='tdData'><label>Administrator</label></td><td class='tdData'><a class='VIEWHR' data-ng_id='10000069' data-lvl='REG' href='#'>Wessex</a></td><td class='tdData' style='white-space: nowrap;'><label>10 October 2019</label></td><td class='tdData'></td><td class='tdData' style='white-space: nowrap;'><label class='ll_role_Status'>Full</label><br/>Review Due<br/>30 Sep 2022</td><td class='tdData noPrint SortOpts' style='text-align:right '><label style='display:none;width:1px;' class='ORD' data-db='1'>1</label><input type='button' class='VIEWROLE VIEWMRN' value='View'/><div class='EDITROLE' style='width:260px;display:none;'><input type='button' class='RoleTop' value='Make Primary'/><input type='button' class='RoleUp' value='Up'/><input type='button' class='RoleDown' value='Down'/></div></td></tr>"
            + b"<tr class='msTRRL msTR' data-pk='6857721'><td class='tdData'><a class='VIEWRL' data-ng_id='24' Title='Scout Council Member' href='#'>TSA Council Member - Nominated Member (18-24)</a></td><td class='tdData'><label>Committee</label></td><td class='tdData'><a class='VIEWHR' data-ng_id='10000001' data-lvl='ORG' href='#'>The Scout Association</a></td><td class='tdData' style='white-space: nowrap;'><label>14 December 2018</label></td><td class='tdData'></td><td class='tdData' style='white-space: nowrap;'><label class='ll_role_Status'>Full</label></td><td class='tdData noPrint SortOpts' style='text-align:right '><label style='display:none;width:1px;' class='ORD' data-db='2'>2</label><input type='button' class='VIEWROLE VIEWMRN' value='View'/><div class='EDITROLE' style='width:260px;display:none;'><input type='button' class='RoleTop' value='Make Primary'/><input type='button' class='RoleUp' value='Up'/><input type='button' class='RoleDown' value='Down'/></div></td></tr>"
            + b"<tr class='msTRRL msTR ROLE_HIDEME' data-pk='3582685'><td class='tdData'><a class='VIEWRL' data-ng_id='74' Title='Scout Network Member' href='#'>County Scout Network Member</a></td><td class='tdData'><label>Supporter</label></td><td class='tdData'><a class='VIEWHR' data-ng_id='10000421' data-lvl='CTST' href='#'>Scout Network @ Trumptonshire</a></td><td class='tdData' style='white-space: nowrap;'><label>16 April 2018</label></td><td class='tdData' style='white-space: nowrap;'><label>18 April 2018</label></td><td class='tdData' style='white-space: nowrap;'><label class='ll_role_Status'>Closed</label></td><td class='tdData noPrint SortOpts' style='text-align:right '><label style='display:none;width:1px;' class='ORD' data-db='10003'>10003</label><input type='button' class='VIEWROLE VIEWMRN' value='View'/></td></tr>"
            + b"<tr class='msTRRL msTR ROLE_HIDEME' data-pk='4801342'><td class='tdData'><a class='VIEWRL' data-ng_id='22' Title='Executive Committee Member' href='#'>County Executive Committee Member</a></td><td class='tdData'><label>Committee</label></td><td class='tdData'><a class='VIEWHR' data-ng_id='10000420' data-lvl='CNTY' href='#'>Trumptonshire</a></td><td class='tdData' style='white-space: nowrap;'><label>25 September 2018</label></td><td class='tdData' style='white-space: nowrap;'><label>29 September 2020</label></td><td class='tdData' style='white-space: nowrap;'><label class='ll_role_Status'>Closed</label></td><td class='tdData noPrint SortOpts' style='text-align:right '><label style='display:none;width:1px;' class='ORD' data-db='10004'>10004</label><input type='button' class='VIEWROLE VIEWMRN' value='View'/></td></tr>"
            + b"<tr class='msTRRL msTR ROLE_HIDEME' data-pk='1158267'><td class='tdData'><a class='VIEWRL' data-ng_id='7' Title='Boat Inspector' href='#'>Regional Boat Inspector</a></td><td class='tdData'><label>Advisor</label></td><td class='tdData'><a class='VIEWHR' data-ng_id='10000069' data-lvl='REG' href='#'>Wessex</a></td><td class='tdData' style='white-space: nowrap;'><label>01 April 2020</label></td><td class='tdData'></td><td class='tdData' style='white-space: nowrap;'><label class='ll_role_Status'>Cancelled</label></td><td class='tdData noPrint SortOpts' style='text-align:right '><label style='display:none;width:1px;' class='ORD' data-db='10005'>10005</label><input type='button' class='VIEWROLE VIEWMRN' value='View'/></td></tr>"
            + b"</tbody></table></div></div></div></div></div></div></div></form></body></html>"
        )
    # TODO error conditions
