from __future__ import annotations

from typing import Literal, Optional, TypedDict

# sync with _scrapers/member_profile.py::ROLE_STATUSES
TYPES_ROLE_STATUS = Literal["Cancelled", "Closed", "Full", "Pre provisional", "Provisional"]
TYPES_SEX = Literal["Male", "Female", "Unknown"]
TYPES_ETHNICITY = Literal[
    "1.English/Welsh/Scottish/Northern Irish/British",
    "2.Irish",
    "3.Gypsy or Irish Traveller",
    "4.Any other White background",
    "5.White and Black Caribbean",
    "6.White and Black African",
    "7.White and Asian",
    "8.Any other mixed or Multiple ethic group",
    "9.Indian",
    "10.Pakistani",
    "11.Bangladeshi",
    "12.Chinese",
    "13.Any other Asian Background",
    "14.African",
    "15.Caribbean",
    "16.Any other Black/African/Caribbean background",
    "17.Arab",
    "18.Other",
    "19.Prefer not to say",
]
TYPES_RELIGION = Literal[
    "Buddhist",
    "Christian (including all Christian denominations)",
    "Hindu",
    "Jewish",
    "Muslim",
    "Sikh",
    "Any other religion (please specify)",
    "No religion",
    "Prefer not to say",
]
TYPES_OCCUPATION = Literal[
    "Employed",
    "Unemployed",
    "Retired (whether receiving a pension or not)",
    "Student",
    "Long term sick or disabled",
    "Looking after home of family",
    "Other",
]
TYPES_ROLE_CLASS = Literal[
    "Administrator",
    "Advisor",
    "Assessor",
    "Co-ordinator",
    "Commissioner",
    "Committee",
    "Helper",
    "Honorary",
    "Leader",
    "Manager",
    "Secretary",
    "Staff",
    "System Role",
    "Supporter",
    "Trainer",
    "Default role class",
]
TYPES_REFERENCES = Literal[
    "Not Complete",
    "Not Required",
    "References Requested",
    "References Satisfactory",
    "References Unsatisfactory",
]
TYPES_DISCLOSURES_APPOINTMENT = Literal[
    "Application submitted - in progress",
    "Disclosure Issued",
    "ID check required",
    "No Disclosure",
]  # Disclosure statuses in role details popup
TYPES_LEARNING_METHOD = Literal[
    "Course",
    "DVD/Video",
    "E-Learning",
    "External Course",
    "Independent Study",
    "On the Job",
    "One to One",
    "Practical",
    "Small Group",
    "Workbook",
    "Your prior learning/experience recognised",
    "Other",
    # First Aid
    "Life Support",
    "Major illness",
    "Trauma and injury",
    # Manager and Supporter: Induction (rare)
    "RST Induction [England only]",
    # Manager and Supporter: Skills Courses
    "Skills Course - Achieving Growth",
    "Skills Course - Meeting the Challenges",
    "Skills Course - Skills of Management",
    # Manager and Supporter: Independent Learning
    "IL - Building Effective Teams",
    "IL - Dealing with Difficult Situations",
    "IL - Decision Making",
    "IL - Enabling Change",
    "IL - Financial and Physical Resources",
    "IL - Finding, Appointing and Welcoming Volunteers",
    "IL - Getting the Word Out",
    "IL - Keeping, Developing and Managing Volunteers",
    "IL - Leading Local Scouting",
    "IL - Managing Time and Personal Skills",
    "IL - Planning For Growth",
    "IL - Project Management",
    "IL - Safety for Managers and Supporters",
    "IL - Supporting the Adult Training Scheme",
]
TYPES_PERMIT = Literal[
    "Archery",
    "Bell Boating",
    "Canoeing",
    "Caving",
    "Climbing and Abseiling",
    "Dinghy Sailing",
    "Dragon Boating",
    "Hill Walking",
    "Hovercrafting",
    "Ice Climbing",
    "Kayaking",
    "Keelboating",
    "Kite Surfing",
    "Mine Exploration",
    "Motor Cruising",
    "Mountain Biking",
    "Narrow Boating",
    "Nights Away",
    "Personal Watercraft (Jet Ski)",
    "Power Boating",
    "Pulling",
    "Rafting (Traditional)",
    "Rowing and Sculling",
    "Scuba Diving",
    "Snorkelling",
    "Snowsports",
    "Water Skiing",
    "White Water Rafting",
    "Windsurfing",
    "Yachting",
]
TYPES_PERMIT_CATEGORIES = Literal[
    "B1 Waters",
    "B2 Waters",
    "B2+ Waters",
    "B3 Waters",
    "C Waters",
    "Campsite",
    "Greenfield",
    "Indoor",
    "Lightweight Expedition",
    "Open Inland B1 Waters",
    "Open Inland B2 Waters",
    "Open Inland B3 Waters",
    "River B1 Waters",
    "Sea B1 Waters",
    "Sea B2 Waters",
    "Surf B2 Waters",
    "With Compound Bows",
    "Without Compound Bows",
]
TYPES_PERMIT_TYPE = Literal["Leadership", "Supervisory"]
TYPES_AWARD_TYPE = Literal[
    "Chief Scout's 5 years Service Award",
    "Chief Scout's 10 years Service Award",
    "Chief Scout's 15 years Service Award",
    "Chief Scout's 20 years Service Award",
    "Chief Scout's 25 years Service Award",
    "Chief Scout's 30 years Service Award",
    "Chief Scout's 40 years Service Award",
    "Chief Scout's 50 years Service Award",
    "Chief Scout's 60 years Service Award",
    "Chief Scout's 70 years Service Award",
    # Local / less formal awards
    "Commissioners Commendation",
    # Formal awards process - lower good service
    "Chief Scout's Commendation for Good Service",
    "Award for Merit",
    "Bar to the Award for Merit",
    "Silver Acorn",
    # Formal awards process - higher good service
    "Bar to the Silver Acorn",
    "Silver Wolf",
    # Meritorious Conduct Awards
    "Chief Scout's Commendation for Meritorious Conduct",
    "The Medal for Meritorious Conduct",
    # Gallantry Awards
    "The Gilt Cross",
    "The Silver Cross",
    "The Bronze Cross",
    # Other Awards
    "The Cornwell Scout Badge",
    "The Chief Scout's Personal Award",
    # Past Awards (not in the current awards scheme)
    "Medal of Merit",
    "Bar to the Medal of Merit",
]
TYPES_DISCLOSURE_PROVIDERS = Literal[
    "Access NI",
    "Atlantic Data",
    "DBS Paper Application",
    "Disclosure Scotland",
    "Local Check",  # BSO
    "Other",
]
TYPES_DISCLOSURE_STATUSES = Literal[
    "Application Withdrawn",
    "Application received at HQ",
    "Application submitted - in progress",
    "Disclosure Expired",
    "Disclosure Issued",
    "Expired",
    "Final applicant information required",  # BSO
    "ID check required",
    "ID selection required",
]  # Disclosure statuses in disclosures tab


class AddressData(TypedDict):
    unparsed_address: Optional[str]
    country: Optional[str]
    postcode: Optional[str]
    county: Optional[str]
    town: Optional[str]
    street: Optional[str]
