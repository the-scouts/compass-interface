var mvEmptyCaption = " [empty]";// for optimised columns (for js operations)
var ColsSpeed = "";
var mvSkip = 0; //Number of skipped row (miss first row on purpose)
var mvTake = -2; // -2 = not set yet, value = number to take next time, -1 = finished (no rows left to load)
var mvData; // the pagination data store
var mvPopulateRoutine;

function AddGridSort_Columns(tblName) {
    $(".msHeadTD", $("#" + tblName)).each(function () {
        if ($(this).data("colname")) {
            $(this).click(function () {
                PopupGridOptions('gridPopup', tblName, $(this).data("colname"));
            });
        }
    });

    $("#" + tblName + " tr:eq(0) td").not(".subTR").each(function () {
        ColsSpeed += $('#'+tblName+' tr:eq(0) td:eq(' + $(this).index() + ')').text().replaceAll(" ", "~") + "¬";
    });
    ColsSpeed = ColsSpeed.substr(0, ColsSpeed.length - 1);
}

function AddGridSortData(tblName, not) {
    AddGridSort_Columns(tblName);
    if (ColsSpeed)
        $("#" + tblName + " td").not(".msHeadTD").not(".msHeadTDCB").not(".msHeadTD_noclick").not(not).each(function () {
            var data = $("label", this).html();
            if ($("label", this).data("grid_data"))
                data = $("label", this).data("grid_data");
            if ($("a", this).html() || $("a", this).size() > 0) {
                if ($("a", this).data("grid_data"))
                    data = $("a", this).data("grid_data");
                else
                    data = $("a", this).html();
            }
            else if ($("b", this).html())
                data = $("b", this).html();
            else if ($("input", this).html() && $("input", this).data("grid_data"))
                data = $("input", this).data("grid_data");

            var idx = $(this).index();
            GP_AddFilterItem(tblName, ColsSpeed.split('¬')[idx], data, idx); // blank data row
        });
}

function PopupGridOptions(thisControl, grid_name, ColumnName) {
    if (mvData && mvTake > 0 && mvPopulateRoutine)
    {
        $.system_confirm("Load all data into grid?", function () {
            if (location.href.toString().toLowerCase().indexOf("/popups/") > 0)
                $('.Alert_overlay').css({ 'visibility': 'hidden' }).css({ 'visibility': 'visible', 'display': 'none' }).fadeIn(100);
            else
                ShowBusy_Main();

            setTimeout(function () {
                mvPopulateRoutine(true);
                if (location.href.toString().toLowerCase().indexOf("/popups/") > 0)
                    $('.Alert_overlay').css({ 'visibility': 'hidden' });
                else
                    HideBusy_Main();
                PopupGridOptions(thisControl, grid_name, ColumnName);
            }, 100);
        });
        // data not fully loaded
        return;
    }

    var ColVisible = true;
    $(".gpNotFiltered", $("#" + grid_name)).each( function(){
        if ($(this).css("visibility") === "hidden" && $(this).parent().data("colname") === ColumnName)
            ColVisible = false;
    });
    
    if (!ColVisible)
        return false;

    gridPopup.select(thisControl, grid_name, ColumnName);

    if (LastX === 0 || LastY === 0)
        $("#GridColPopup").center(undefined, true);
    else
        DoPopupMove(LastX, LastY);

    return false;
}

function CloseGridOptions() {
    $("#gpMainBorder").remove();
    gridPopup.closeWindow();
}

// CONSTRUCTOR for the grid options Object
function GridColumnOptions() {
    var c;
    if (arguments.length > 0) {c = new PopupWindow(arguments[0]);}
    else {c = new PopupWindow();c.setSize(150, 175);}

    c.AddFilterItem = GP_AddFilterItem;
    c.getOptions = GP_getOptions;
    c.select = GP_select;
    c.closeWindow = GP_hidePopup;
    c.autoHide();       

    // Return the object
    return c;
}

function GP_hidePopup() {
    if (arguments.length > 0) { window.popupWindowObjects[arguments[0]].hidePopup(); }
    else { this.hidePopup(); }
    $('td:nth-child(' + (ColNo + 1) + ')').removeClass("Grid_HL").css({ "background-color": "" });
    PauseGridColour = false;
}

// Simple method to interface popup calendar with a text-entry box
function GP_select(anchorname, grid_name, colname) {
    if (anchorname.disabled) { return; } // Can't use input on disabled form input!
    window.CP_targetInput = anchorname;
    var Data = GP_getOptions(grid_name, colname);
    if (Data) {
        this.populate(Data);
        this.showPopup(anchorname);
        GP_AssignEvents(grid_name, colname);
    }
}

try {
    var GP_Col_Array = new Array();

    Array.prototype.contains = function (k) {
        for (var p in this)
            if (this[p].key === k) return true; return false;
    };
    Array.prototype.contains_gridcol = function (g, c) {
        for (var p in this) if (this[p].grid === g && this[p].key === c) return this[p]; return undefined;
    };
    Array.prototype.contains_data = function (k) {
        for (var p in this)
            if (this[p].data === k)
                return true;
        return false;
    };
    Array.prototype.Data_Checked = function (g, c, d) {
        for (var p = 0 ; p < this.length; p++)
            if (this[p].grid === g && this[p].key === c && this[p].data.checked(d))
                return true;
        return false;
    };
    Array.prototype.checked = function (d) {
        for (var p = 0 ; p < this.length; p++)
            if (this[p].data === d && this[p].X === "checked")
                return true;
        return false;
    };
} catch (e) { }

function GP_AddFilterItem(grid_name, column, new_data, col_no) {
    if (!new_data) new_data = mvEmptyCaption;
    new_data = new_data.replace('<b>', '').replace('</b>', '').replaceAll("\r", "").replaceAll("\n", "");
    var Cell = GP_Col_Array.contains_gridcol(grid_name, column);
    if (!Cell) {
        var DT = new Array();
        DT.push({ data: new_data, X: 'checked' });
        GP_Col_Array.push({ grid: grid_name, key: column, data: DT, HasX: false, colno: col_no });
        return;
    }

    if (!Cell.data.contains_data(new_data))
        Cell.data.push({ data: new_data, X: 'checked' });
}

function GP_ClearGridArrayData(grid_name) {
    for (var i = 0 ; i < GP_Col_Array.length; i++) { if (GP_Col_Array[i].grid === grid_name) { GP_Col_Array[i].data.length = 0; } }
}

function GP_CheckAll(self) {
    if ($(self).is(":checked"))
        $('.gpCheckItems').prop('checked', 'checked');
    else
        $('.gpCheckItems').removeAttr('checked');
}

var filteridx;
function GP_FilterType(value) { 
    if (filteridx)
        clearTimeout(filteridx);

    filteridx = setTimeout(function () {
        value = value.replace(/ or /gi, '|'); //add OR for regex query  

        $(".gpCheckItems").each(function () {
            if ($('label[for=' + $(this).attr('ID') + ']').text().search(new RegExp(RegExp.quoteNotOR(value), "i")) < 0) {
                $(this).removeAttr('checked').parent().css('display', 'none');
            }
            else {
                $(this).prop('checked', 'checked').parent().css('display', 'block');
            }
        });
        filteridx = undefined;
    }, 500);
}

function GP_GoFilter(grid_name, colname) {
    GP_ShowBusy(true, "Creating Filter : " + colname);

    setTimeout(function () {
        var ColsWithFilter = 0;
        for (var i = 0 ; i < GP_Col_Array.length; i++) {
            if (GP_Col_Array[i].grid === grid_name) {
                if ((GP_Col_Array[i].key.replaceAll("~", " ") === colname)
                    || (GP_Col_Array[i].grid === grid_name && GP_Col_Array[i].grid + " " + GP_Col_Array[i].key === colname)) {
                    var DataArray = GP_Col_Array[i].data;
                    GP_Col_Array[i].HasX = false;
                    for (var j = 0 ; j < DataArray.length; j++) {
                        DataArray[j].X = ($('#gpCB' + j).is(":checked") ? "checked" : "");
                        GP_Col_Array[i].HasX = true;
                    }
                }
                if (GP_Col_Array[i].HasX) ColsWithFilter++;
            }
        }

        if (ColsWithFilter > 1) { window.status = "Clearing All Filters"; $("#" + grid_name + " tr").show(); }

        for (var k = 0 ; k < GP_Col_Array.length; k++) {
            if (GP_Col_Array[k].grid === grid_name && GP_Col_Array[k].HasX) {
                window.status = "Applying Filter For : " + GP_Col_Array[k].key;
                GP_PushToGrid(grid_name, GP_Col_Array[k].key, ColsWithFilter === 1);
            }
        }

        GP_ShowBusy(false);
    }, 0);
}

function GP_ClearFilter(grid_name, colname) {
    GP_ShowBusy(true, "Clearing Filter : " + colname);

    setTimeout(function () {
        GP_SetFilterImage(grid_name + "_" + colname, false);
        for (var i = 0 ; i < GP_Col_Array.length; i++) {
            if ((GP_Col_Array[i].grid === grid_name && (GP_Col_Array[i].key.replaceAll("~", " ") === colname) || GP_Col_Array[i].grid + ' ' + GP_Col_Array[i].key.replaceAll("~", " ") === colname)) {
                var DataArray = GP_Col_Array[i].data;
                GP_Col_Array[i].HasX = false;
                for (var j = 0 ; j < DataArray.length; j++) {
                    DataArray[j].X = "checked";
                }
            }
        }

        $('.gpCheckItems').prop('checked', 'checked');
        $('#gpAll').prop('checked', 'checked');
        $('#gpFilter').val('');
        GP_FilterType("");

        window.status = "Clearing All Filters";
        $("#" + grid_name + " tr").show(); 

        for (var k = 0 ; k < GP_Col_Array.length; k++) {
            if (GP_Col_Array[k].grid === grid_name && GP_Col_Array[k].HasX) {
                window.status = "Re-Applying Filter For : " + GP_Col_Array[k].key;
                GP_PushToGrid(grid_name, GP_Col_Array[k].key, false);
            }
        }

        GP_ShowBusy(false);
    }, 0);
}

function GP_ClearAll(grid_name) {
    GP_ShowBusy(true,"Clearing All Filters");

    setTimeout(function () {
        for (var i = 0 ; i < GP_Col_Array.length; i++) {
            if (GP_Col_Array[i].grid === grid_name) {
                GP_SetFilterImage(grid_name + "_" + GP_Col_Array[i].key, false);
                var DataArray = GP_Col_Array[i].data;
                GP_Col_Array[i].HasX = false;
                for (var j = 0 ; j < DataArray.length; j++) {
                    DataArray[j].X = "checked";
                }
            }
        }
        $("#" + grid_name + " tr").show();
        $('.gpCheckItems').prop('checked', 'checked');
        $('#gpAll').prop('checked', 'checked');
        $('#gpFilter').val('');
        GP_FilterType("");

        GP_ShowBusy(false);
    }, 0);
}

function GP_SetFilterImage(Name, On) {
    var vTD = $('#' + Name);
    if (vTD.length === 0 && Name.indexOf(" ") > 0)
        Name = Name.replaceAll(" ", "~");

    if (Name.indexOf("~") > 0)
    {
        $(".gpFiltered,.gpNotFiltered").each(function () {
            if ($(this).attr("id") === Name)
                vTD = $(this);
        });
    }

    if (On) {
        if (vTD.hasClass('gpFiltered')) { return; }
        vTD.removeClass('gpNotFiltered').addClass('gpFiltered');
    } else {
        if (vTD.hasClass('gpNotFiltered')) { return; }
        vTD.removeClass('gpFiltered').addClass('gpNotFiltered');
    }
}

function GP_PushToGrid(grid_name, colname, DoShow) {
    var HasFilter = false;
    $("td", $("#" + grid_name + " tr").not(":first")).each(function () {
        var GridColName = $('#' + grid_name + ' tr:eq(0) td:eq(' + $(this).index() + ')').attr("id");
        if ((colname === GridColName) || (GridColName === grid_name + '~' + colname)) {
            var data = $("label", this).html();
            if ($("b", this).html())
                data = $("b", this).html();
            else if ($("input", this).html() && $("input", this).data("grid_data"))
                data = $("input", this).html();
            else if ($("a", this).html() || $("a", this).size() > 0) {
                if ($("a", this).data("grid_data"))
                    data = $("a", $(this).parent()).data("grid_data");
                else
                    data = $("a", this).html();
            }

            if (!data) {
                data = $(this).html();
                if (data[0] === "<") data = "";
            }

            if (!GP_Col_Array.Data_Checked(grid_name, colname, !data ? mvEmptyCaption : data.replaceAll("\r", "").replaceAll("\n", ""))) {
                $(this).parent().hide().attr("V", "H");
                HasFilter = true;
            } else if (DoShow) {
                $(this).parent().show().removeAttr("V");
            }
        }
    });
    GP_SetFilterImage(grid_name + "_" + colname, HasFilter);

    if ($(document).data("FT") == "P")
        DoPopupReSize("RESIZE");
    else
        DoResize();
}

function GP_ShowArrayContents(Array) {
    var str = "Grid+Column.Count=" + Array.length + "<br/><table><tr>";
    for (var i = 0 ; i < Array.length; i++) {
        str += "<td>idx=" + i + " (" + Array[i].grid + "." + Array[i].key + ")<br/>(Item.Count:" + Array[i].data.length + ")<br/></td>";
    }
    str += "</tr><tr>";
    for (var k = 0 ; k < Array.length; k++) {
        str += "<td style='vertical-align:top;'>";
        var DataArray = Array[k].data;
        for (var j = 0 ; j < DataArray.length; j++) {str += DataArray[j].data + "<br/>";}
        str += "</td>";
    }
    str += "</tr></table>";
    var w = window.open("", "", "width=325, height=510,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=no ");
    w.document.write(str);
}

var ImgPath = "";
var ColNo = -1;

function GP_getOptions(grid_name, colname) {
    var MaxRows = 100;

    if (1===2)
        GP_ShowArrayContents(GP_Col_Array); // for debugging, this shows Array content in a popup to see its FULL content

    var DataArray;
    for (var i = 0 ; i < GP_Col_Array.length; i++) {
        if ((GP_Col_Array[i].grid === grid_name && GP_Col_Array[i].key === colname)
            || (GP_Col_Array[i].grid === grid_name && GP_Col_Array[i].grid + "~" + GP_Col_Array[i].key === colname)) {
            DataArray = GP_Col_Array[i].data;
            ColNo = GP_Col_Array[i].colno;
        }
    }

    if (!DataArray)
    {
        $.system_alert("There is no information about this column available.");
        return "";
    }

    var Disabled = !DataArray ? "disabled" : "";
    var TDClass = !DataArray ? "gpTD_Disabled" : "gpTD";

    colname = colname.replaceAll("~"," ");

    $('td').css({ "background-color": "" });    
    PauseGridColour = true;
    $("#" + grid_name + ' td:nth-child(' + (ColNo + 1) + ')').addClass("Grid_HL");

    var result = "";
    result += "<div class='gpMainBorder noPrint'>";
    result += "<a href='#' class='popupclose' style='position: absolute; left: 280px; top:6px; padding-right:0px;background-color:transparent;'> </a>";

    result += "<div class='gpMouse' style='height:23px;'>";
    result += "<h2 id='caption' style='text-align: center;'>Grid Options</h2>";
    result += "</div>";
    
    // table for header items (and any sundry options)
    result += "<table width='310px' class='gpBorder' border='0' cellspacing='0' cellpadding='0' borderwidth='0'><tbody>";

    result += "<TR class='gpTR gpTRu' style='height:25px;'><TD style='width:25px;'>&nbsp;&nbsp;<img class='labelPoint' src='" + ImgPath + "images/core/icn_sort_asc.png' " + Disabled + " style='width:15px;' /></TD><TD class='" + TDClass + "' style='cursor:pointer;'>&nbsp;&nbsp;Sort Column - Ascending</TD></TR>";
    result += "<TR class='gpTR gpTRd' style='height:25px;')><TD style='width:25px;'>&nbsp;&nbsp;<img class='labelPoint' src='" + ImgPath + "images/core/icn_sort_desc.png' " + Disabled + " style='width:15px;' /></TD><TD class='" + TDClass + "' style='cursor:pointer;'>&nbsp;&nbsp;Sort Column - Descending</TD></TR>";

    result += "<tr class='GridPopup_HL' style='width:100%;'><td class='GridPopupCap_HL' colspan='2' style='text-align: left; '><h3>&nbsp;Filter options for column:</h3><h2 class='tdh2'>&nbsp;" + colname.replace(grid_name + " ", "") + "</h2></TD></TR>";
    result += "</TABLE>\n";
    
    // now the filter options
    if (DataArray.length > MaxRows) 
        result += "<div class='GridPopup_HL'>&nbsp;&nbsp;<input id='gpAll' type='checkbox' checked disabled/>&nbsp; Filter : <input id='gpFilter' type='text' style='width:205px;' disabled></div>";
    else
        result += "<div class='GridPopup_HL'>&nbsp;&nbsp;<input id='gpAll' type='checkbox' checked " + Disabled + "/>&nbsp; Filter : <input id='gpFilter' type='text' style='width:205px;' " + Disabled + "></div>";

    if (pk_val("Master.Sys.TextSize") === "2") //0=big,1=med,2=small
        result += "<div id='gpWA' style='height:185px;overflow:auto;'>";
    else if (pk_val("Master.Sys.TextSize") === "0")
        result += "<div id='gpWA' style='height:175px;overflow:auto;'>";
    else
        result += "<div id='gpWA' style='height:180px;overflow:auto;'>";

    // loop all values and add them to the filter options
    
    if (DataArray) {
        if (DataArray.length > 1)
            DataArray.sort(function (a, b) {
            sortDirection = 1;
            if (!$.Is_Safari() && !isNaN(a.data) && !isNaN(b.data)) return (parseInt(a.data,10) < parseInt(b.data,10) ? -1 : 1) * sortDirection; 
            if (Date.parse(a.data) && Date.parse(b.data)) return (Date.parse(a.data) < Date.parse(b.data) ? 1 : -1) * sortDirection;
            if ((a.data || '').toUpperCase() < (b.data || '').toUpperCase()) return -sortDirection;
            if ((a.data || '').toUpperCase() > (b.data || '').toUpperCase()) return sortDirection;
            return 0;
            });        
        if (DataArray.length > MaxRows) {
            result += "<div class='gpRMV' style='white-space:nowrap;'><br/>&nbsp;&nbsp;<label>There are greater than " + MaxRows.toString() + " unique values (" + DataArray.length.toString() + ")<br/>&nbsp;&nbsp;in this column. would you like to load them?<br/><br/>&nbsp;&nbsp;NOTE: this may take a while to load and filter<br/>&nbsp;&nbsp;if there is a lot of data in the grid.</label><br/></div>";
            result += "<div class='gpRMV gpTD' style='white-space:nowrap;text-align: center;'><br/>&nbsp;&nbsp;<input id='gpLV' type='button' value='Load Values'/></div>";
        }
        else {
            for (var j = 0 ; j < DataArray.length; j++) {
                result += "<div class='" + TDClass + "' id='gpDiv" + j + "' style='white-space:nowrap;'>&nbsp;&nbsp;<input id='gpCB" + j + "' type='checkbox' class='gpCheckItems' " + DataArray[j].X + "/>&nbsp;&nbsp;<label for='gpCB" + j + "'>" + DataArray[j].data + "</label><br/></div>";
            }
        }
    }

    result += "</div><hr class='noPrint foot_hr'/><div class='GridPopup_FL'";
    if (pk_val("Master.Sys.TextSize") === "0") result += " style='padding-top:6px;' ";
    if (pk_val("Master.Sys.TextSize") === "1") result += " style='padding-top:9px;' ";
    if (pk_val("Master.Sys.TextSize") === "2") result += " style='padding-top:10px;' ";
    result += "><center>";

    if (DataArray.length > MaxRows) 
        result += "<input class='gpAPPLY' type='button' disabled value='Apply Filter'>&nbsp;";
    else
        result += "<input class='gpAPPLY' type='button' " + Disabled + " value='Apply Filter'>&nbsp;";

    result += "<input class='gpCLEAR1' type='button' " + Disabled + " value='Clear Filter'>&nbsp;";
    if ($.Is_MSIE(7)) result += "<input class='gpCLEAR2' type='button' value='Clear All'>";
    else result += "<input class='gpCLEAR2'  type='button' value='Clear All Filters'>";
    result += "</center></div></div>";

    if (DataArray)
        setTimeout(function () { $.FocusControl('#gpFilter', true, 10); },500);
    return result;
}

var vLastSortColumn = "";
var vLastFilter = "";
function GP_Sort(grid_name, sortDirection, colno) {    
    GP_ShowBusy(true,"Sorting Grid");

    setTimeout(function () {
        var $rows = $("#" + grid_name).find('tbody tr').get();
        var findSortKey = function ($cell) {
            var data = $("label", $cell).html();
            if ($("h4", $cell).html())
                data = $("h4", $cell).html();
            if ($("a", $cell).html()) {
                if ($("a", $cell).data("grid_data")) data = $("a", $cell).data("grid_data");
                else data = $("a", $cell).html();
            }
            if ($("b", $cell).html())
                data = $("b", $cell).html();
            if ($("input", $cell).html() && $("input", $cell).data("grid_data"))
                data = $("input", $cell).data("grid_data");

            if (!data) data = $cell.html();

            $cell.attr("title", data);

            return data.toUpperCase();
        };
        //loop through all the rows and find   
        $.each($rows, function (index, row) { row.sortKey = findSortKey($(row).children('td').eq(colno)); });

        //compare and sort the rows alphabetically  
        $rows.sort(function (a, b) {
            if (!$.Is_Safari() && !isNaN(a.sortKey) && !isNaN(b.sortKey)) return (parseInt(a.sortKey, 10) < parseInt(b.sortKey, 10) ? -1 : 1) * sortDirection; // i have no idea why this does not work in safari, gave REALLY odd results.!
            if (Date.parse(a.sortKey) && Date.parse(b.sortKey)) return (Date.parse(a.sortKey) < Date.parse(b.sortKey) ? -1 : 1) * sortDirection;
            if ((a.sortKey || '').toUpperCase() < (b.sortKey || '').toUpperCase()) return -sortDirection;
            if ((a.sortKey || '').toUpperCase() > (b.sortKey || '').toUpperCase()) return sortDirection;
            return 0;
        });

        //add the rows in the correct order to the bottom of the table  
        $.each($rows, function (index, row) { $("#" + grid_name + " tbody").append(row); row.sortKey = null; });
        $.FocusControl('#gpFilter', true, 10);
        vLastSortColumn = $($("TD", $("#" + grid_name + " tr").first())[colno]).attr("sortcolname") + (sortDirection > 0 ? " asc" : " desc");

        GP_ShowBusy(false);
    }, 0);
}

function GP_ShowBusy(show, statusMSG) {
    if (statusMSG)
        window.status = statusMSG;
    else
        window.status = "";

    if (show) {
        $("#gpLV").css("display", "none");
        $(".GridPopup_HL").after("<a class='popup_loading_gif gridbusy_border' href='#' style='display: block;position:absolute;top:220px; left:45%;' onclick='return false;'></a>");
        $("#gpWA").addClass("gridbusy_overlay");

        $("#gpAll,.gpTD,.gpCLEAR1,.gpCLEAR2").attr("disabled", "disabled");
        $("#gpFilter").addClass("ReadonlyInput");
        $(".gpMainBorder").css("cursor","wait");
    }
    else {
        $("#gpLV").css("display", "");
        $("#gpWA").removeClass("gridbusy_overlay");
        $(".gridbusy_border").remove();

        $("#gpAll,.gpTD,.gpCLEAR1,.gpCLEAR2").removeAttr("disabled");
        if ($("#gpLV").size() === 1) $("#gpAll").attr("disabled", "disabled");
        $("#gpFilter").removeClass("ReadonlyInput");
        $(".gpMainBorder").css("cursor", "");
    }
}

function GP_LoadValues(grid_name, colname) {
    GP_ShowBusy(true);
    $("#gpAll, #gpFilter, .gpAPPLY").removeAttr("disabled");

    setTimeout(function () {
        $(".gpRMV").last().remove();
        var DataArray;
        for (var i = 0 ; i < GP_Col_Array.length; i++) {
            if ((GP_Col_Array[i].grid === grid_name && GP_Col_Array[i].key === colname)
                || (GP_Col_Array[i].grid === grid_name && GP_Col_Array[i].grid + "~" + GP_Col_Array[i].key === colname)
                || (GP_Col_Array[i].grid === grid_name && GP_Col_Array[i].key === colname.replaceAll(" ", "~"))) {
                DataArray = GP_Col_Array[i].data;
                ColNo = GP_Col_Array[i].colno;
            }
        }

        for (var j = 0 ; j < DataArray.length; j++) {
            $(j === 0 ? ".gpRMV" : ".gpTD").last().after("<div class='gpTD' id='gpDiv" + j + "' style='white-space:nowrap;'>&nbsp;&nbsp;<input id='gpCB" + j + "' type='checkbox' class='gpCheckItems' " + DataArray[j].X + "/>&nbsp;&nbsp;<label for='gpCB" + j + "'>" + DataArray[j].data + "</label><br/></div>");            
        }

        $(".gpRMV").remove();

        GP_ShowBusy(false);
    }, 0);
}

function GP_AssignEvents(grid_name, colname) {
    colname = colname.replaceAll("~", " ");
    //$(ctrl)
    $(".gpAPPLY", $("#GridColPopup")).click(function () { GP_GoFilter(grid_name, colname); });
    $(".gpCLEAR1", $("#GridColPopup")).click(function () { GP_ClearFilter(grid_name, colname); });
    $(".gpCLEAR2", $("#GridColPopup")).click(function () { GP_ClearAll(grid_name); });

    $("#gpAll", $("#GridColPopup")).click(function () { GP_CheckAll(this); });
    $("#gpFilter", $("#GridColPopup")).keyup(function () { GP_FilterType(this.value); });

    $(".popupclose", $("#GridColPopup")).click(CloseGridOptions);
    $(".gpMouse", $("#GridColPopup")).mousedown(function () { mouse_down("GridColPopup"); });
    
    $(".gpTRu", $("#GridColPopup")).click(function () { GP_Sort(grid_name, 1, ColNo); });
    $(".gpTRd", $("#GridColPopup")).click(function () { GP_Sort(grid_name, -1, ColNo); });

    $("#gpLV").click(function(){GP_LoadValues(grid_name, colname);});
}

var ClearFilter = false;
// dragable popup code
var LastX = 0;
var LastY = 0;
var being_dragged = false;
function mouser(event) {
    var x = event.pageX - 150;
    var y = event.pageY - 15;

    if (!event.pageX) {
        x = event.x - 150;
        y = event.y - 15;
    }

    if (being_dragged && !isNaN(x) && !isNaN(y)) {
        DoPopupMove(x, y);
    }
}
function mouse_down(ele_name) {
    being_dragged = true;
    $("#GridColPopup").css({ "cursor": "move" });    
}
function mouse_up(event) {
    if (being_dragged){
        being_dragged = false;
        $("#GridColPopup").css({ "cursor": "auto" });
    }        
}
function DoPopupMove(UseX, UseY) {
    if (UseX + $(".gpMainBorder").width() + 70 > $(document).width())
        UseX = $(document).width() - $(".gpMainBorder").width() - 35;
    if (UseX < 30) UseX = 30;

    if (UseY + 385 > $(document).height())
        UseY = $(document).height() - 385;
    if (UseY < 10) UseY = 10;

    if ($.Is_Android() || $.Is_IPad() || $.Is_IPhone())
        $("#GridColPopup").center(undefined, true);
    else
        $("#GridColPopup").css({ "left": UseX + 'px', "top": UseY + 'px' });
    LastX = UseX,
    LastY = UseY;
}