from __future__ import annotations

import json
from typing import TYPE_CHECKING

from compass.core.schemas import member as schema
from compass.core.settings import Settings
from compass.core.util.context_managers import validation_errors_logging
from compass.core.util.type_coercion import parse_date

if TYPE_CHECKING:
    from compass.core.util.client import Client

# /Contact/Avatar
# /Contact/ArchiveAlert
# /Contact/Alerts

lookup_nationality = {
    "AAAA": "British",
    "AAHL": "English",
    "AAAE": "Irish",
    "AAAB": "Northern Irish",
    "AAAC": "Scottish",
    "AAAD": "Welsh",
}

lookup_ethnicity = {
    "WHTE": "1.English/Welsh/Scottish/Northern Irish/British",
    "WIRH": "2.Irish",
    "WTRV": "3.Gypsy or Irish Traveller",
    "WOTH": "4.Any other White background",
    "MWBC": "5.White and Black Caribbean",
    "MWBA": "6.White and Black African",
    "MWAN": "7.White and Asian",
    "MOTH": "8.Any other mixed or Multiple ethic group",
    "AIND": "9.Indian",
    "APKN": "10.Pakistani",
    "ABGD": "11.Bangladeshi",
    "ACHN": "12.Chinese",
    "AOTH": "13.Any other Asian Background",
    "BAFR": "14.African",
    "BCRB": "15.Caribbean",
    "BOTH": "16.Any other Black/African/Caribbean background",
    "ARAB": "17.Arab",
    "OTHR": "18.Other",
    "PREF": "19.Prefer not to say",
}

lookup_religion = {
    "BUDD": "Buddhist",
    "CRST": "Christian (including all Christian denominations)",
    "HNDU": "Hindu",
    "JEW": "Jewish",
    "MSLM": "Muslim",
    "SIKH": "Sikh",
    "OTHR": "Any other religion (please specify)",
    "NONE": "No religion",
    "PREF": "Prefer not to say",
}

lookup_occupation = {
    "1": "Employed",
    "3": "Long term sick or disabled",
    "2": "Looking after home of family",
    "4": "Other",
    "12": "Student",
    "13": "Retired (whether receiving a pension or not)",
    "14": "Unemployed",
}


def get_contact_profile(client: Client, membership_number: int, /) -> schema.MemberDetails:
    request_json = {"Source": "ADULT", "ContactNumber": f"{membership_number}"}
    response = client.post(f"{Settings.base_url}/Contact/Profile", json=request_json)
    # yes, double loading the JSON is deliberate. The serialisation from Compass is insane...
    data = json.loads(json.loads(response.content.decode("utf-8")))

    if "PersonData" not in data:
        raise RuntimeError("!!!")

    person_data = data["PersonData"]

    details = {
        "membership_number": membership_number,
        "forenames": person_data["Forenames"],
        "surname": person_data["Surname"],
        "name": f"""{person_data["Forenames"]} {person_data["Surname"]}""",  # Full Name
        "known_as": person_data["KnownAs"],
        "join_date": parse_date(person_data["JoinDate"]),
        "sex": "Male" if person_data["Gender"] == "M" else "Female",
        "address": _process_address(person_data["Addresses"]),
        "main_phone": _process_phone_numbers(person_data["PhoneNumbers"]),
        "main_email": _process_email(person_data["EmailAddresses"]),
        "birth_date": parse_date(person_data["DOB"]),
        "nationality": lookup_nationality.get(person_data["Nationality"]["LookupValue"], "Other"),
        "ethnicity": lookup_ethnicity.get(person_data["Ethnicity"]["LookupValue"], ""),
        "religion": lookup_religion.get(person_data["Religion"]["LookupValue"], ""),
        "religion_detail": person_data["Religion"]["Details"],
        "occupation": lookup_occupation.get(person_data["Occupation"]["LookupValue"], ""),
        "occupation_detail": person_data["Occupation"]["Details"],
        "disabilities": _process_misc_sections(person_data["Disabilities"]),
        "qualifications": _process_misc_sections(person_data["Qualifications"]),
        "hobbies": _process_misc_sections(person_data["Hobbies"]),
    }
    # Filter out keys with no value.
    details = {k: v for k, v in details.items() if v}

    with validation_errors_logging(membership_number):
        return schema.MemberDetails.parse_obj(details)


def _process_address(addresses_props: list[dict[str, str]]) -> schema.AddressData:
    if not addresses_props:
        return {"unparsed_address": None, "country": None, "postcode": None, "county": None, "town": None, "street": None}
    address_props = addresses_props[0]
    return {
        "unparsed_address": address_props["Address"],
        "country": address_props["Country"],
        "postcode": address_props["Postcode"],
        "county": address_props["County"],
        "town": address_props["Town"],
        "street": f"""{address_props["Line1"]}, {address_props["Line2"]}, {address_props["Line3"]}""",
    }


def _process_phone_numbers(phone_numbers: list[dict[str, str]]) -> str:
    """Return a main phone number from a list of phone number properties.

    Each phone number record is as follows:
    {
        "CommunicationNumber": ...,
        "Type": "...",
        "Number": "...",
        "IsMain": bool
    }

    Args:
        phone_numbers: list of phone number records

    Todo:
        We could use the number type properties?

    Returns: main phone number

    """
    numbers = [""]
    for number_props in phone_numbers:
        if number_props["IsMain"]:
            return number_props["Number"]
        numbers.append(number_props["Number"])
    return numbers[0]


def _process_email(email_properties: list[dict[str, str]]) -> str:
    """Return a main phone number from a list of phone number properties.

    Each email record is as follows:
    {
        "CommunicationNumber": ...,
        "Type": "...",
        "EmailAddress": "...",
        "IsMain": bool
    }

    Args:
        email_properties: list of email records

    Todo:
        We could use the number type properties?

    Returns: main email address

    """
    emails = [""]
    for email_props in email_properties:
        if email_props["IsMain"]:
            return email_props["EmailAddress"]
        emails.append(email_props["EmailAddress"])
    return emails[0]


def _process_misc_sections(entries: list[str]) -> dict[str, str]:
    if not entries:
        return {}
    out = {}
    for entry in entries:
        field, _, optional_detail = entry.partition(" - ")
        out[field] = optional_detail
    return out
