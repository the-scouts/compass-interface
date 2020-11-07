var BackPage = -1;

function AddressBack() {
    $("#AddressMatch tr:not(:first)").remove();
    MakePageVisible(BackPage);
}

function GetPAF(Addrflds, postcodelookup, qaspage, returnpage) {
    BackPage = returnpage;
    var PostCode = $("#" + postcodelookup).val();
    var Addressflds = Addrflds.split("¬");
    if (!PostCode) { $.FocusControl("#" + postcodelookup, true); return false; }
    if (!Navigator_OnLine()) { alert("There is no internet connection at the moment."); return false; }
    
    parent.ShowBusy_Popup('Searching for matches... Please wait.');
   
    $.ajax({
        url: WebServicePath() + "GetPAF?pPostcode=" + PostCode, success: function (result) {
            var xAddresses = result.d;
            if (!xAddresses) {
                parent.HideBusy_Popup();
                $.system_alert("The Postcode software is not available right now,\r\n We are sorry for any inconvenience.");
            }
            else {
                parent.HideBusy_Popup();
                $("#AddressMatch tr:not(:first)").remove();

                if (xAddresses.length === 1) {
                    if (xAddresses[0].Line1 === "Too Many Results")
                        $.system_alert("Too many results returned, please narrow your search");
                    else {
                        $("#" + Addressflds[0]).val(xAddresses[0].Name1);
                        $("#" + Addressflds[1]).val(xAddresses[0].Line1);
                        $("#" + Addressflds[2]).val(xAddresses[0].Line2);
                        $("#" + Addressflds[3]).val(xAddresses[0].Town);
                        $("#" + Addressflds[4]).val(xAddresses[0].County);
                        $("#" + Addressflds[5]).val(xAddresses[0].Postcode);
                        $("#" + Addressflds[6]).val("UK");
                    }
                }
                else {
                    $("#AddrMatchAdj").css({ "visibility": "visible" });
                    for (i = 0; i < xAddresses.length; i++) {
                        var Addr = "";
                        if (xAddresses[i].Name1 && xAddresses[i].Name1 !== "Unknown") { Addr += xAddresses[i].Name1; }
                        Addr += "¬";
                        if (xAddresses[i].Line1 && xAddresses[i].Line1 !== "Unknown") { Addr += xAddresses[i].Line1; }
                        Addr += "¬";
                        if (xAddresses[i].Line2 && xAddresses[i].Line2 !== "Unknown") { Addr += xAddresses[i].Line2; }
                        Addr += "¬";
                        if (xAddresses[i].Line3 && xAddresses[i].Line3 !== "Unknown") { Addr += xAddresses[i].Line3; }
                        Addr += "¬";
                        if (xAddresses[i].Town && xAddresses[i].Town !== "Unknown") { Addr += xAddresses[i].Town; }
                        Addr += "¬";
                        if (xAddresses[i].Postcode && xAddresses[i].Postcode !== "Unknown") { Addr += xAddresses[i].Postcode; }
                        Addr += "¬";
                        if (xAddresses[i].County && xAddresses[i].County !== "Unknown") { Addr += xAddresses[i].County; }
                        Addr += "¬";
                        if (xAddresses[i].Country && xAddresses[i].Country !== "Unknown") { Addr += xAddresses[i].Country; }
                        Addr += "¬";
                        Addr = Addr.replace(/'/g, "&apos;");
                        $("#AddressMatch tbody").append(
                            "<tr class='msTR'><td>" +
                            xAddresses[i].AddressText +
                            "</td><td style='text-align:right;'><input type='button' class='selAddr' value='Select' style='z-index:1;' data-addr='" +
                            Addr + 
                            "'></td></tr>");
                    }
                    $(".selAddr", $("#AddressMatch tbody")).off("click").click(function () { InsertAddress(this, Addrflds, returnpage); });
                    $("#ctl00_workarea_txt_p" + qaspage + "_postcode").val(PostCode);
                    MakePageVisible(qaspage);
                }
            }
        }, error: ServiceFailed
    });
}

function InsertAddress(self, Addrflds, returnpage) {
    var lines = $(self).data("addr").split("¬");
    var Addressflds = Addrflds.split("¬");

    $("#" + Addressflds[0]).val("");
    $("#" + Addressflds[1]).val("");
    $("#" + Addressflds[2]).val("");
    var linecount = 0;
    for (i = 0; i < 3; i++) {
        if (lines[i]) {
            if (linecount === 0) { $("#" + Addressflds[0]).val(lines[i]); linecount++; }
            else if (linecount === 1) { $("#" + Addressflds[1]).val(lines[i]); linecount++; }
            else if (linecount === 2) { $("#" + Addressflds[2]).val(lines[i]); linecount++; }
        }
    }

    $("#" + Addressflds[3]).val(lines[4]); //town
    $("#" + Addressflds[4]).val(lines[6]); //county
    $("#" + Addressflds[5]).val(lines[5]); //postcode
    $("#" + Addressflds[6]).val("UK");

    $("#AddressMatch tr:not(:first)").remove();

    MakePageVisible(returnpage);
}
