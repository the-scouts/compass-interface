from __future__ import annotations

import datetime
import re
from typing import get_args, Literal, Optional, TYPE_CHECKING, TypedDict, Union
import json

from compass.core import errors
from compass.core.logger import logger
from compass.core.schemas import member as schema
from compass.core.settings import Settings
from compass.core.util import cache_hooks
from compass.core.util.context_managers import validation_errors_logging
from compass.core.util.type_coercion import maybe_int
from compass.core.util.type_coercion import parse

if TYPE_CHECKING:
    from collections.abc import Iterable
    from collections.abc import Iterator

    from compass.core.util.client import Client

# /Contact/Profile
# /Contact/Avatar
# /Contact/Roles
# /Contact/ArchiveAlert
# /Contact/Alerts

lookup_nationality = {
    "AAAA": "British",
    "AAHL": "English",
    "AAAE": "Irish",
    "AAAB": "Northern Irish",
    "AAAC": "Scottish",
    "AAAD": "Welsh",
    "AAAF": "Afghan",
    "AAAG": "Albanian",
    "AAAH": "Algerian",
    "AAAI": "American",
    "AAAJ": "Andorran",
    "AAAK": "Angolan",
    "AAAL": "Antiguans",
    "AAAM": "Argentinean",
    "AAAN": "Armenian",
    "AAAO": "Australian",
    "AAAP": "Austrian",
    "AAAQ": "Azerbaijani",
    "AAAR": "Bahamian",
    "AAAS": "Bahraini",
    "AAAT": "Bangladeshi",
    "AAAU": "Barbadian",
    "AAAV": "Barbudans",
    "AAAW": "Batswana",
    "AAAX": "Belarusian",
    "AAAY": "Belgian",
    "AAAZ": "Belizean",
    "AABA": "Beninese",
    "AABB": "Bhutanese",
    "AABC": "Bolivian",
    "AABD": "Bosnian",
    "AABE": "Brazilian",
    "AABF": "Bruneian",
    "AABG": "Bulgarian",
    "AABH": "Burkinabe",
    "AABI": "Burmese",
    "AABJ": "Burundian",
    "AABK": "Cambodian",
    "AABL": "Cameroonian",
    "AABM": "Canadian",
    "AABN": "Cape Verdean",
    "AABO": "Central African",
    "AABP": "Chadian",
    "AABQ": "Chilean",
    "AABR": "Chinese",
    "AABS": "Colombian",
    "AABT": "Comoran",
    "AABU": "Congolese",
    "AABV": "Costa Rican",
    "AABW": "Croatian",
    "AABX": "Cuban",
    "AABY": "Cypriot",
    "AABZ": "Czech",
    "AACA": "Danish",
    "AACB": "Djibouti",
    "AACC": "Dominican",
    "AACD": "Dutch",
    "AACE": "East Timorese",
    "AACF": "Ecuadorean",
    "AACG": "Egyptian",
    "AACH": "Emirian",
    "AACI": "Equatorial Guinean",
    "AACJ": "Eritrean",
    "AACK": "Estonian",
    "AACL": "Ethiopian",
    "AACM": "Fijian",
    "AACN": "Filipino",
    "AACO": "Finnish",
    "AACP": "French",
    "AACQ": "Gabonese",
    "AACR": "Gambian",
    "AACS": "Georgian",
    "AACT": "German",
    "AACU": "Ghanaian",
    "AACV": "Greek",
    "AACW": "Grenadian",
    "AACX": "Guatemalan",
    "AACY": "Guinea-Bissauan",
    "AACZ": "Guinean",
    "AADA": "Guyanese",
    "AADB": "Haitian",
    "AADC": "Herzegovinian",
    "AADD": "Honduran",
    "AADE": "Hungarian",
    "AADF": "I-Kiribati",
    "AADG": "Icelander",
    "AADH": "Indian",
    "AADI": "Indonesian",
    "AADJ": "Iranian",
    "AADK": "Iraqi",
    "AADL": "Israeli",
    "AADM": "Italian",
    "AADN": "Ivorian",
    "AADO": "Jamaican",
    "AADP": "Japanese",
    "AADQ": "Jordanian",
    "AADR": "Kazakhstani",
    "AADS": "Kenyan",
    "AADT": "Kittian and Nevisian",
    "AADU": "Kuwaiti",
    "AADV": "Kyrgyz",
    "AADW": "Laotian",
    "AADX": "Latvian",
    "AADY": "Lebanese",
    "AADZ": "Liberian",
    "AAEA": "Libyan",
    "AAEB": "Liechtensteiner",
    "AAEC": "Lithuanian",
    "AAED": "Luxembourger",
    "AAEE": "Macedonian",
    "AAEF": "Malagasy",
    "AAEG": "Malawian",
    "AAEH": "Malaysian",
    "AAEI": "Maldivan",
    "AAEJ": "Malian",
    "AAEK": "Maltese",
    "AAEL": "Marshallese",
    "AAEM": "Mauritanian",
    "AAEN": "Mauritian",
    "AAEO": "Mexican",
    "AAEP": "Micronesian",
    "AAEQ": "Moldovan",
    "AAER": "Monacan",
    "AAES": "Mongolian",
    "AAET": "Moroccan",
    "AAEU": "Mosotho",
    "AAEV": "Motswana",
    "AAEW": "Mozambican",
    "AAEX": "Namibian",
    "AAEY": "Nauruan",
    "AAEZ": "Nepalese",
    "AAFA": "New Zealander",
    "AAFB": "Nicaraguan",
    "AAFC": "Nigerian",
    "AAFE": "Nigerien",
    "AAFG": "North Korean",
    "AAFD": "Norwegian",
    "AAFF": "Omani",
    "AAFH": "Pakistani",
    "AAFI": "Palauan",
    "AAFJ": "Panamanian",
    "AAFK": "Papua New Guinean",
    "AAFL": "Paraguayan",
    "AAFM": "Peruvian",
    "AAFN": "Polish",
    "AAFO": "Portuguese",
    "AAFP": "Qatari",
    "AAFQ": "Romanian",
    "AAFR": "Russian",
    "AAFS": "Rwandan",
    "AAFT": "Saint Lucian",
    "AAFU": "Salvadoran",
    "AAFV": "Samoan",
    "AAFW": "San Marinese",
    "AAFX": "Sao Tomean",
    "AAFY": "Saudi",
    "AAFZ": "Senegalese",
    "AAGA": "Serbian",
    "AAGB": "Seychellois",
    "AAGC": "Sierra Leonean",
    "AAGD": "Singaporean",
    "AAGE": "Slovakian",
    "AAGF": "Slovenian",
    "AAGG": "Solomon Islander",
    "AAGH": "Somali",
    "AAGI": "South African",
    "AAGJ": "South Korean",
    "AAGK": "Spanish",
    "AAGL": "Sri Lankan",
    "AAGM": "Sudanese",
    "AAGN": "Surinamer",
    "AAGO": "Swazi",
    "AAGP": "Swedish",
    "AAGQ": "Swiss",
    "AAGR": "Syrian",
    "AAGS": "Taiwanese",
    "AAGT": "Tajik",
    "AAGU": "Tanzanian",
    "AAGV": "Thai",
    "AAGW": "Togolese",
    "AAGX": "Tongan",
    "AAGY": "Trinidadian or Tobagonian",
    "AAGZ": "Tunisian",
    "AAHA": "Turkish",
    "AAHB": "Tuvaluan",
    "AAHC": "Ugandan",
    "AAHD": "Ukrainian",
    "AAHE": "Uruguayan",
    "AAHF": "Uzbekistani",
    "AAHG": "Venezuelan",
    "AAHH": "Vietnamese",
    "AAHI": "Yemenite",
    "AAHJ": "Zambian",
    "AAHK": "Zimbabwean",
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
    response = client.post(f"{Settings.base_url}/Contact/Profile", json={"Source": "ADULT", "ContactNumber": f"{membership_number}"})
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
        "join_date": parse(person_data["JoinDate"]),
        "sex": "Male" if person_data["Gender"] == "M" else "Female",
        "address": _process_address(person_data["Addresses"]),
        "main_phone": _process_phone_numbers(person_data["PhoneNumbers"]),
        "main_email": _process_email(person_data["EmailAddresses"]),
        "birth_date": parse(person_data["DOB"]),
        "nationality": lookup_nationality.get(person_data["Nationality"]["LookupValue"], ""),
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


def _process_address(addresses_props: list[dict[str, str]]):
    if not addresses_props:
        return {'unparsed_address': None, 'country': None, 'postcode': None, 'county': None, 'town': None, 'street': None}
    address_props = addresses_props[0]
    return {
        'unparsed_address': address_props["Address"],
        'country': address_props["Country"],
        'postcode': address_props["Postcode"],
        'county': address_props["County"],
        'town': address_props["Town"],
        'street': f"""{address_props["Line1"]}, {address_props["Line2"]}, {address_props["Line3"]}"""
    }


def _process_phone_numbers(phone_numbers: list[dict[str, str]]):
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


def _process_email(email_properties: list[dict[str, str]]):
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
