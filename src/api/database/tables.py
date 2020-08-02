import enum

# from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
# from sqlalchemy.orm import relationship
#
# from src.api.database.database import Base


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
    ScoutGroup = "scout_group"
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


# class User(Base):
#     __tablename__ = "users"
#
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True)
#     auth = Column(String)
#     member_id = Column(Integer, ForeignKey("members.membership_number"))
#
#     member = relationship("User")
#
#
# class Member(Base):
#     __tablename__ = "members"
#     id = Column(Integer, autoincrement=True, primary_key=True)
#     membership_number = Column(Integer, index=True)  # primary_key=True,
#     forenames = Column(String)
#     surname = Column(String)
#     known_as = Column(String)
#
#     join_date = Column(String)  # Only through scraping
#     sex = Column(String)  # Only through scraping
#     email = Column(String)
#     phone_number = Column(Integer)
#     address = Column(String)
#     postcode = Column(String)
#
#     disclosure_number = Column(String)
#     disclosure_check = Column(Integer)
#     disclosure_expiry = Column(String)
#
#     role_name = Column(String)
#     role_start = Column(String)
#     role_end = Column(String)
#     role_status = Column(String)
#     line_manager_number = Column(Integer)
#     line_manager = Column(String)
#     review_date = Column(String)
#     region = Column(String)
#     county = Column(String)
#     county_section = Column(String)
#     district = Column(String)
#     district_section = Column(String)
#     scout_group = Column(String)
#     scout_group_section = Column(String)
#     ce_check = Column(String)
#     appointment_panel_approval = Column(String)
#     commissioner_approval = Column(String)
#     committee_approval = Column(String)
#     references = Column(String)
#     module_01 = Column(String)
#     module_02 = Column(String)
#     module_03 = Column(String)
#     training_completion_date = Column(String)
#
#     safety = Column(String)
#     safeguarding = Column(String)
#     first_aid = Column(String)
#     ongoing_learning_hours = Column(String)  # TODO should this be a float/int??
#
#
# class Item(Base):
#     __tablename__ = "items"
#
#     id = Column(Integer, primary_key=True, index=True)
#     title = Column(String, index=True)
#     description = Column(String, index=True)
#     owner_id = Column(Integer, ForeignKey("users.id"))
#
#     owner = relationship("User", back_populates="items")
