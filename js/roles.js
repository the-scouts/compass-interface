$(document).ready(FormReady);

function FormReady()
{
    AddGridSortData("RoleSetup");

    $('.msHeadTD').hover(
        function () {
            if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')').addClass("Grid_HL");
        },
        function () {
            if (!PauseGridColour) $('td:nth-child(' + (parseInt($(this).index(), 10) + 1) + ')').removeClass("Grid_HL");
        });

    $(".ADDRL").click(NewRole);
    $(".EDITRL").click(EditRole).css("min-width", "55px");
    $(".VIEWRL").click(ViewRole).css("min-width", "55px");
    $(".CLOSERL").click(CloseRole).css("min-width", "55px");
    $(".COPYRL").click(CopyRole).css("min-width", "55px");

    $(".msTR").AttrToData("pk");
}

function NewRole() {
    OpeniFrame('Popups/Maint/NewRole.aspx', '69%', '890px', '90%', '550px', '', true, false);
    return false;
}

function EditRole()
{
    var vPK = $(this).closest(".msTR").data("pk");
    OpeniFrame('Popups/Maint/NewRole.aspx?EDIT=' + vPK, '69%', '890px', '90%', '550px', '', true, false);
    return false;
}

function ViewRole() {
    var vPK = $(this).closest(".msTR").data("pk");
    OpeniFrame('Popups/Maint/NewRole.aspx?VIEW=' + vPK, '69%', '890px', '90%', '550px', '', true, false);
    return false;
}

function CloseRole() {
    var vPK = $(this).closest(".msTR").data("pk");
    OpeniFrame('Popups/Maint/CloseRole.aspx?RN=' + vPK, '59%', '550px', '500px', '550px', '500px', true, false);
    return false;
}

function CopyRole() {
    var vPK = $(this).closest(".msTR").data("pk");
    OpeniFrame('Popups/Maint/NewRole.aspx?COPYROW=' + vPK, '69%', '890px', '90%', '550px', '', true, false);
    return false;
}