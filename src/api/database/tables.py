import enum

class MemberFields(str, enum.Enum):
    Membership_Number = "membership_number"
    Forenames = "forenames"
    Surname = "surname"
    Known_As = "known_as"
    Email = "email"
    Phone_number = "phone_number"
    Address = "address"
    Postcode = "postcode"
    Disclosure_number = "disclosure_number"
    Disclosure_Date = "disclosure_check"
    Disclosure_Expiry = "disclosure_expiry"
    Role = "role_name"
    Role_Start_Date = "role_start"
    Role_End_Date = "role_end"
    RoleStatus = "role_status"
    Line_manager_number = "line_manager_number"
    LineManager = "line_manager"
    review_date = "review_date"
    Region = "region"
    County = "county"
    County_Section = "county_section"
    District = "district"
    District_Section = "district_section"
    ScoutGroup = "group"
    scout_group_section = "scout_group_section"
    CE_Check = "ce_check"
    AppAdvComm_Approval = "appointment_panel_approval"
    Commissioner_Approval = "commissioner_approval"
    Committee_Approval = "committee_approval"
    References = "references"
    Essential_Info = "module_01"
    PersonalLearningPlan = "module_02"
    Tools4Role = "module_03"
    WoodBadgeReceived = "training_completion_date"
    OngoingSafetyTraining = "safety"
    OngoingSafeguardingTraining = "safeguarding"
    FirstAidTraining = "first_aid"
    OngoingLearningHours = "ongoing_learning_hours"
