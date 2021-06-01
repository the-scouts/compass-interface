from __future__ import annotations

import datetime
from typing import Optional, TYPE_CHECKING, Union

from lxml import html

import compass.core as ci
from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.util import cache_hooks
from compass.core.util.context_managers import validation_errors_logging
from compass.core.util.type_coercion import maybe_int
from compass.core.util.type_coercion import parse_date

if TYPE_CHECKING:
    from collections.abc import Iterator

    from compass.core.util.client import Client

renamed_modules = {
    "001": "module_01",
    "TRST": "trustee_intro",
    "002": "module_02",
    "003": "module_03",
    "004": "module_04",
    "GDPR": "GDPR",
    "SFTY": "safety",
    "SAFE": "safeguarding",
}
unset_vals = {"--- Not Selected ---", "--- No Items Available ---", "--- No Line Manager ---"}

module_names = {
    "Essential Information": "M01",
    "Trustee Introduction": "TRST",
    "Personal Learning Plan": "M02",
    "Tools for the Role (Section Leaders)": "M03",
    "Tools for the Role (Managers and Supporters)": "M04",
    "General Data Protection Regulations": "GDPR",
    "Safety Training": "SFTY",
    "Safeguarding Training": "SAFE",
}

references_codes = {
    "NC": "Not Complete",
    "NR": "Not Required",
    "RR": "References Requested",
    "S": "References Satisfactory",
    "U": "References Unsatisfactory",
}


# See getAppointment in PGS\Needle
@cache_hooks.cache_result(key=("role_detail", 1))
def get_roles_detail(client: Client, role_number: int, /) -> ci.MemberRolePopup:
    """Returns detailed data from a given role number.

    Args:
        client: HTTP client
        role_number: Role Number to use

    Returns:
        A MemberRolePopup model with the data from the role detail popup
        (keys will always be present):

        {'hierarchy': {'organisation': 'The Scout Association',
          'country': '...',
          'region': '...',
          'county': '...',
          'district': '...',
          'group': '...',
          'section': '...'},
         'details': {'role_number': ...,
          'organisation_level': '...',
          'birth_date': datetime.datetime(...),
          'membership_number': ...,
          'name': '...',
          'role_title': '...',
          'role_start': datetime.datetime(...),
          'role_status': '...',
          'line_manager_number': ...,
          'line_manager': '...',
          'ce_check': datetime.datetime(...),
          'disclosure_check': '...',
          'references': '...',
          'appointment_panel_approval': '...',
          'commissioner_approval': '...',
          'committee_approval': '...'},
         'getting_started': {...: {'name': '...',
           'validated': datetime.datetime(...),
           'validated_by': '...'},
           ...
          }}

    Raises:
        CompassNetworkError:
            For errors while executing the HTTP call

    """
    response = client.get(f"{Settings.base_url}/Popups/Profile/AssignNewRole.aspx?VIEW={role_number}")
    tree = html.fromstring(response.content)
    if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=Access":
        raise ci.CompassPermissionError(f"You do not have permission to the details of role {role_number}")

    inputs: dict[str, Union[html.InputElement, html.SelectElement]] = dict(tree.forms[0].inputs)
    fields: dict[str, str] = {k: v.value for k, v in inputs.items() if v.value is not None}

    line_manager_number, line_manager_name = _extract_line_manager(inputs["ctl00$workarea$cbo_p2_linemaneger"])
    ce_check = fields.get("ctl00$workarea$txt_p2_cecheck", "")  # CE (Confidential Enquiry) Check
    disclosure_check, disclosure_date = _extract_disclosure_date(fields.get("ctl00$workarea$txt_p2_disclosure", ""))

    approval_values = {row[1][0].get("data-app_code"): row[1][0].get("data-db") for row in tree.xpath("//tr[@class='trProp']")}
    # row[1][0].get("title") gives title text, but this is not useful as it does not reflect latest changes,
    # but only who added the role to Compass.

    role_details: dict[str, Union[None, int, str, datetime.date]] = dict(
        role_number=role_number,
        # `organisation_level` is ignored, no corresponding field in MemberTrainingRole:
        organisation_level=fields.get("ctl00$workarea$cbo_p1_level"),
        birth_date=parse_date(inputs["ctl00$workarea$txt_p1_membername"].get("data-dob")),
        membership_number=int(fields.get("ctl00$workarea$txt_p1_memberno", 0)),
        # `name` is ignored, no corresponding field in MemberTrainingRole:
        name=fields.get("ctl00$workarea$txt_p1_membername", " ").split(" ", 1)[1],
        role_title=fields.get("ctl00$workarea$txt_p1_alt_title"),
        role_start=parse_date(fields.get("ctl00$workarea$txt_p1_startdate", "")),
        role_status=fields.get("ctl00$workarea$txt_p2_status"),
        line_manager_number=line_manager_number,
        line_manager=line_manager_name,
        review_date=parse_date(fields.get("ctl00$workarea$txt_p2_review", "")),
        ce_check=parse_date(ce_check) if ce_check != "Pending" else None,  # TODO if CE check date != current date then is valid
        disclosure_check=disclosure_check,
        disclosure_date=disclosure_date,
        references=references_codes.get(fields.get("ctl00$workarea$cbo_p2_referee_status", "")),
        appointment_panel_approval=approval_values.get("ROLPRP|AACA"),
        commissioner_approval=approval_values.get("ROLPRP|CAPR"),
        committee_approval=approval_values.get("ROLPRP|CCA"),
    )

    logger.debug(f"Processed details for role number: {role_number}.")
    # TODO data-ng_id?, data-rtrn_id?

    full_details = {
        "hierarchy": dict(_process_hierarchy(inputs)),
        "details": {k: v for k, v in role_details.items() if v is not None},  # Filter null values
        "getting_started": _process_getting_started(tree.xpath("//tr[@class='trTrain trTrainData']")),
    }

    with validation_errors_logging(role_number, name="Role Number"):
        return ci.MemberRolePopup.parse_obj(full_details)


def _extract_line_manager(line_manager_list: html.SelectElement) -> tuple[Optional[int], Optional[str]]:
    line_manager_el = next((op for op in line_manager_list if op.get("selected")), None)
    if line_manager_el is None:
        return None, None
    number = maybe_int(line_manager_el.get("value"))
    name = line_manager_el.text.strip()
    if name in unset_vals:
        return number, None
    return number, name


def _extract_disclosure_date(disclosure_status: str) -> tuple[Optional[str], Optional[datetime.date]]:
    """Return tuple of disclosure check status, disclosure date."""
    if disclosure_status.startswith("Disclosure Issued : "):
        return "Disclosure Issued", parse_date(disclosure_status.removeprefix("Disclosure Issued : "))
    return (disclosure_status or None), None


def _process_hierarchy(inputs: dict[str, html.HtmlElement]) -> Iterator[tuple[str, str]]:
    """Get all levels of the org hierarchy and select those that will have information."""
    # Get all inputs with location data
    for input_name, input_el in inputs.items():
        if "ctl00$workarea$cbo_p1_location" not in input_name:
            continue
        level_name = input_el.get("title").lower()
        level_value = input_el[0].text
        if level_value not in unset_vals:
            yield "county" if level_name == "county / area / scottish region / overseas branch" else level_name, level_value


def _process_getting_started(getting_started_modules: html.HtmlElement) -> dict[str, dict[str, Union[None, str, datetime.date]]]:
    """Process getting started modules."""
    modules_output = {}
    # Get all training modules and then extract the required modules to a dictionary
    for module in getting_started_modules:
        module_name = module[0][0].text.strip()
        if module_name in module_names:
            info = {
                # "name": module_names[module_name],  # short_name
                "validated": parse_date(module[2][0].value),  # Save module validation date
                "validated_by": module[1][1].get("value") or None,  # Save who validated the module
            }
            mod_code: str = module[2][0].get("data-ng_value")
            modules_output[renamed_modules[mod_code]] = info

    return modules_output
