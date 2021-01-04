import datetime
import re
import time

import pandas as pd
import requests
from lxml import html
from dateutil.parser import parse

from compass.settings import Settings
from compass.utility import cast

from typing import Union

normalise_cols = re.compile(r"((?<=[a-z0-9])[A-Z]|(?!^)[A-Z](?=[a-z]))|_([^_])")


class CompassPeopleScraper:
    def __init__(self, session: requests.Session):
        self.s = session

    def get(self, url, **kwargs) -> requests.models.Response:
        Settings.total_requests += 1
        return self.s.get(url, **kwargs)

    def _get_member_profile_tab(self, membership_num: int, profile_tab: str) -> dict:
        profile_tab = profile_tab.upper()
        tabs = ["ROLES", "PERMITS", "TRAINING", "AWARDS", "EMERGENCY", "COMMS", "VISIBILITY", "DISCLOSURES"]
        url = f"{Settings.base_url}/MemberProfile.aspx?CN={membership_num}"
        if profile_tab == "PERSONAL":
            response = self.get(url)
        elif profile_tab in tabs:
            url += f"&Page={profile_tab}&TAB"
            response = self.get(url)
        else:
            raise ValueError(f"Specified member profile tab {profile_tab} is invalid. Allowed values are {tabs.append('PERSONAL')}")

        return {"content": response.content, "encoding": response.encoding}

    def get_personal_tab(self, membership_num: int) -> dict:
        response = self._get_member_profile_tab(membership_num, "Personal")

        tree = html.fromstring(response.get("content"))

        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise PermissionError(f"You do not have permission to the details of {membership_num}")

        details = dict()

        ### Extractors ###
        ## Core:

        details["membership_number"] = membership_num

        # Name(s)
        names = tree.xpath("//title//text()")[0].strip().split(" ")[3:]
        details["forenames"] = names[0]
        details["surname"] = " ".join(names[1:])

        # Main Phone
        details["main_phone"] = tree.xpath('string(//*[text()="Phone"]/../../../td[3])')
        # details['main_phone'] = self._extract_details(tree, 'string(//*[text()="Phone"]/../../../td[3])')

        # Main Email
        details["main_email"] = tree.xpath('string(//*[text()="Email"]/../../../td[3])')

        ## Core - Positional:

        # Full Name
        details["name"] = tree.xpath("string(//*[@id='divProfile0']//tr[1]/td[2]/label)")
        # Known As
        details["known_as"] = tree.xpath("string(//*[@id='divProfile0']//tr[2]/td[2]/label)")
        # Join Date
        details["join_date"] = parse(tree.xpath("string(//*[@id='divProfile0']//tr[4]/td[2]/label)"))

        ## Position Varies:

        # Gender
        details["sex"] = tree.xpath("string(//*[@id='divProfile0']//*[text()='Gender:']/../../td[2])")
        # DOB
        details["birth_date"] = parse(tree.xpath("string(//*[@id='divProfile0']//*[text()='Date of Birth:']/../../td[2])"))
        # Nationality
        details["nationality"] = tree.xpath("string(//*[@id='divProfile0']//*[text()='Nationality:']/../../td[2])")
        # Ethnicity
        details["ethnicity"] = tree.xpath("normalize-space(//*[@id='divProfile0']//*[text()='Ethnicity:']/../../td[2])")
        # Religion
        details["religion"] = tree.xpath("normalize-space(//*[@id='divProfile0']//*[text()='Religion/Faith:']/../../td[2])")
        # Occupation
        details["occupation"] = tree.xpath("normalize-space(//*[@id='divProfile0']//*[text()='Occupation:']/../../td[2])")
        # Address
        details["address"] = tree.xpath('string(//*[text()="Address"]/../../../td[3])')

        # Filter out keys with no value.
        return {k: v for k, v in details.items() if v}

    def get_roles_tab(self, membership_num: int, keep_non_volunteer_roles: bool = False) -> dict:
        """
        Gets the data from the Role tab in Compass for the specified member.

        Sanitises the data to a common format, and removes Occasional Helper, Network, and PVG roles by default.

        :param membership_num:
        :param keep_non_volunteer_roles:
        :return:
        """
        print(f"getting roles tab for member number: {membership_num}")
        response = self._get_member_profile_tab(membership_num, "Roles")
        tree = html.fromstring(response.get("content"))

        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise PermissionError(f"You do not have permission to the details of {membership_num}")

        roles_data = {}
        rows = tree.xpath("//tbody/tr")
        for row in rows:
            cells = row.getchildren()
            role_number = cast(row.get("data-pk"))
            roles_data[role_number] = {
                "role_number": role_number,
                "membership_number": membership_num,
                "role_name": cells[0].text_content().strip(),
                "role_class": cells[1].text_content().strip(),
                # role_type only visible if access to System Admin tab
                "role_type": [*row.xpath("./td[1]/*/@title"), None][0],
                # location_id only visible if role is in hierarchy AND location still exists
                "location_id": cast([*row.xpath("./td[3]/*/@data-ng_id"), None][0]),
                "location_name": cells[2].text_content().strip(),
                "role_start_date": cells[3].text_content().strip(),
                "role_end_date": cells[4].text_content().strip(),
                "role_status": cells[5].xpath("normalize-space(label)"),
            }

        if not keep_non_volunteer_roles:
            # Remove OHs from list
            filtered_data = {}
            for role_number, role_details in roles_data.items():

                if "role_class" in role_details:
                    role_class = role_details.get("role_class").lower()
                    if "helper" in role_class:
                        continue

                role_title = role_details["role_name"].lower()
                if "occasional helper" in role_title:
                    continue

                if "pvg" in role_title:
                    continue

                if "network member" in role_title:
                    continue

                filtered_data[role_number] = role_details
            roles_data = filtered_data
        return roles_data

    def get_training_tab(self, membership_num: int, ongoing_only: bool = False) -> dict:
        """
        Gets training tab data for a given member

        :param membership_num: Compass ID
        :param ongoing_only: Return a dataframe of role training & OGL info? Otherwise returns all data
        :return:
        """
        response = self._get_member_profile_tab(membership_num, "Training")
        tree = html.fromstring(response.get("content"))

        rows = tree.xpath("//table[@id='tbl_p5_TrainModules']/tr")
        roles = [row for row in rows if "msTR" in row.classes]

        personal_learning_plans = [row for row in rows if "trPLP" in row.classes]

        training_plps = {}
        training_gdpr = []
        for plp in personal_learning_plans:
            plp_table = plp.getchildren()[0].getchildren()[0]
            plp_data = []
            content_rows = [row for row in plp_table.getchildren() if "msTR trMTMN" == row.get("class")]
            for module_row in content_rows:
                module_data = {}
                child_nodes = module_row.getchildren()
                module_data["pk"] = cast(module_row.get("data-pk"))
                module_data["module_id"] = cast(child_nodes[0].get("id")[4:])
                matches = re.match(r"^([A-Z0-9]+) - (.+)$", child_nodes[0].text_content()).groups()
                if matches:
                    module_data["code"] = cast(matches[0])
                    module_data["name"] = matches[1]

                    # Skip processing if we only want ongoing learning data and the module
                    # is not GDPR.
                    if ongoing_only and "gdpr" not in str(module_data["code"]).lower():
                        continue

                module_data["learning_required"] = "yes" in child_nodes[1].text_content().lower()
                module_data["learning_method"] = child_nodes[2].text_content()
                module_data["learning_completed"] = child_nodes[3].text_content()
                try:
                    module_data["learning_date"] = datetime.datetime.strptime(child_nodes[3].text_content(), "%d %B %Y")
                except ValueError:
                    pass

                validated_by_string = child_nodes[4].text_content()
                validated_by_data = validated_by_string.split(" ", maxsplit=1) + [""]  # Add empty item to prevent IndexError
                module_data["validated_membership_number"] = cast(validated_by_data[0])
                module_data["validated_name"] = validated_by_data[1]
                try:
                    module_data["validated_date"] = datetime.datetime.strptime(child_nodes[5].text_content(), "%d %B %Y")
                except ValueError:
                    pass

                plp_data.append(module_data)

                # Save GDPR validations
                if str(module_data.get("code")).upper() == "GDPR":
                    training_gdpr.append(module_data.get("validated_date"))

            training_plps[int(plp_table.get("data-pk"))] = plp_data

        training_ogl = {}
        ongoing_learning_rows = tree.xpath("//tr[@data-ng_code]")
        for ongoing_learning in ongoing_learning_rows:
            cell_text = {c.get("id"): c.text_content() for c in ongoing_learning.getchildren()}
            cell_text = {k.split("_")[0] if isinstance(k, str) else k: v for k, v in cell_text.items()}

            ogl_data = {
                "code": ongoing_learning.get("data-ng_code"),
                "name": cell_text.get(None),
                "completed_date": datetime.datetime.strptime(cell_text.get("tdLastComplete"), "%d %B %Y"),
                "renewal_date": datetime.datetime.strptime(cell_text.get("tdRenewal"), "%d %B %Y"),
            }

            training_ogl[ogl_data["code"]] = ogl_data
            # TODO missing data-pk from cell.getchildren()[0].tag == "input", and module names/codes. Are these important?

        # Handle GDPR
        date_zero = datetime.date(1900, 1, 1)
        sorted_gdpr = sorted([date for date in training_gdpr if isinstance(date, datetime.datetime)], reverse=True)
        gdpr_date = sorted_gdpr[0] if sorted_gdpr else date_zero
        training_ogl["GDPR"] = {
            "code": "GDPR",
            "name": "GDPR",
            "completed_date": gdpr_date,
        }

        if ongoing_only:
            return training_ogl

        training_roles = {}
        for role in roles:
            child_nodes = role.getchildren()

            info = {}

            info["role_number"] = int(role.xpath("./@data-ng_mrn")[0])
            info["title"] = child_nodes[0].text_content()
            info["start_date"] = datetime.datetime.strptime(child_nodes[1].text_content(), "%d %B %Y")
            info["status"] = child_nodes[2].text_content()
            info["location"] = child_nodes[3].text_content()

            training_advisor_string = child_nodes[4].text_content()
            info["ta_data"] = training_advisor_string
            training_advisor_data = training_advisor_string.split(" ", maxsplit=1) + [""]  # Add empty item to prevent IndexError
            info["ta_number"] = training_advisor_data[0]
            info["ta_name"] = training_advisor_data[1]

            completion_string = child_nodes[5].text_content()
            info["completion"] = completion_string
            if completion_string:
                parts = completion_string.split(":")
                info["completion_type"] = parts[0].strip()
                info["completion_date"] = datetime.datetime.strptime(parts[1].strip(), "%d %B %Y")
                info["ct"] = parts[3:]  # TODO what is this? From CompassRead.php
            info["wood_badge_number"] = child_nodes[5].get("id")

            training_roles[info["role_number"]] = info

        training_data = {
            "roles": training_roles,
            "plps": training_plps,
            "mandatory": training_ogl,
        }

        return training_data

    def get_permits_tab(self, membership_num: int) -> list:
        response = self._get_member_profile_tab(membership_num, "Permits")
        tree = html.fromstring(response.get("content"))

        # Get rows with permit content
        rows = tree.xpath('//table[@id="tbl_p4_permits"]//tr[@class="msTR msTRPERM"]')

        permits = []
        for row in rows:
            permit = {}
            child_nodes = row.getchildren()
            permit["permit_type"] = child_nodes[1].text_content()
            permit["category"] = child_nodes[2].text_content()
            permit["type"] = child_nodes[3].text_content()
            permit["restrictions"] = child_nodes[4].text_content()
            permit["expires"] = datetime.datetime.strptime(child_nodes[5].text_content(), "%d %B %Y")
            permit["status"] = child_nodes[5].get("class")

            permits.append(permit)

        return permits

    # See getAppointment in PGS\Needle
    def get_roles_detail(self, role_number: int, response: str = None) -> dict:
        renamed_levels = {
            "County / Area / Scottish Region / Overseas Branch": "County",
        }
        renamed_modules = {
            1: "module_01",
            2: "module_02",
            "M03": "module_03",
            4: "module_04",
        }
        unset_vals = {"--- Not Selected ---", "--- No Items Available ---", "--- No Line Manager ---"}

        module_names = {
            "Essential Information": "M01",
            "PersonalLearningPlan": "M02",
            "Tools for the Role (Section Leaders)": "M03",
            "Tools for the Role (Managers and Supporters)": "M04",
            "General Data Protection Regulations": "GDPR",
        }

        references_codes = {
            "NC": "Not Complete",
            "NR": "Not Required",
            "RR": "References Requested",
            "S": "References Satisfactory",
            "U": "References Unsatisfactory",
        }

        start_time = time.time()
        if response is None:
            response = self.get(f"{Settings.base_url}/Popups/Profile/AssignNewRole.aspx?VIEW={role_number}")
            print(f"Getting details for role number: {role_number}. Request in {(time.time() - start_time):.2f}s")

        if isinstance(response, str):
            tree = html.fromstring(response)
        else:
            tree = html.fromstring(response.content)
        form = tree.forms[0]

        member_string = form.fields.get("ctl00$workarea$txt_p1_membername")
        ref_code = form.fields.get("ctl00$workarea$cbo_p2_referee_status")

        # Approval and Role details
        role_details = {
            "role_number": role_number,
            "organisation_level": form.fields.get("ctl00$workarea$cbo_p1_level"),
            "dob": form.inputs["ctl00$workarea$txt_p1_membername"].get("data-dob"),
            "member_number": cast(form.fields.get("ctl00$workarea$txt_p1_memberno")),
            "member_name": member_string.split(" ", maxsplit=1)[1],
            "role_title": form.fields.get("ctl00$workarea$txt_p1_alt_title"),
            "start_date": form.fields.get("ctl00$workarea$txt_p1_startdate"),
            # Role Status
            "status": form.fields.get("ctl00$workarea$txt_p2_status"),
            # Line Manager
            "line_manager_number": cast(form.fields.get("ctl00$workarea$cbo_p2_linemaneger")),
            "line_manager": form.inputs["ctl00$workarea$cbo_p2_linemaneger"].xpath("string(*[@selected])"),
            # Review Date
            "review_date": form.fields.get("ctl00$workarea$txt_p2_review"),
            # CE (Confidential Enquiry) Check
            "ce_check": form.fields.get("ctl00$workarea$txt_p2_cecheck"),  # TODO if CE check date != current date then is valid
            # Disclosure Check
            "disclosure_check": form.fields.get("ctl00$workarea$txt_p2_disclosure"),
            # References
            "references": references_codes.get(ref_code, ref_code),
            # Appointment Panel Approval
            "appointment_panel_approval": tree.xpath("string(//*[@data-app_code='ROLPRP|AACA']//*[@selected])"),
            # Commissioner Approval
            "commissioner_approval": tree.xpath("string(//*[@data-app_code='ROLPRP|CAPR']//*[@selected])"),
            # Committee Approval
            "committee_approval": tree.xpath("string(//*[@data-app_code='ROLPRP|CCA']//*[@selected])"),
        }

        line_manager_number = role_details["line_manager_number"]
        if line_manager_number in unset_vals:
            role_details["line_manager_number"] = None

        # Getting Started
        modules_output = {}
        getting_started_modules = tree.xpath("//tr[@class='trTrain trTrainData']")
        # Get all training modules and then extract the required modules to a dictionary
        for module in getting_started_modules:
            module_name = module.xpath("string(./td/label/text())")
            if module_name in module_names:
                short_name = module_names[module_name]
                info = {
                    "name": short_name,
                    "validated": module.xpath("./td[3]/input/@value")[0],  # Save module validation date
                    "validated_by": module.xpath("./td/input[2]/@value")[0],  # Save who validated the module
                }
                mod_code = cast(module.xpath("./td[3]/input/@data-ng_value")[0])
                modules_output[renamed_modules.get(mod_code, mod_code)] = info

        # Filter null values
        role_details = {k: v for k, v in role_details.items() if v is not None}

        # Get all levels of the org hierarchy and select those that will have information:
        # Get all inputs with location data
        org_levels = [v for k, v in sorted(dict(form.inputs).items()) if "ctl00$workarea$cbo_p1_location" in k]
        # TODO
        all_locations = {row.get("title"): row.findtext("./option") for row in org_levels}

        clipped_locations = {
            renamed_levels.get(key, key).lower(): value for key, value in all_locations.items() if value not in unset_vals
        }

        # TODO data-ng_id?, data-rtrn_id?
        # return {**clipped_locations, **role_details, **modules_output}
        return {"hierarchy": clipped_locations, "details": role_details, "getting_started": modules_output}


class CompassPeople:
    def __init__(self, session: requests.Session):
        self._scraper = CompassPeopleScraper(session)

    def get_roles(self, membership_num: int, keep_non_volunteer_roles: bool = False) -> list:
        response = self._scraper.get_roles_tab(membership_num, keep_non_volunteer_roles)

        role_list = []
        for role_number, role_dict in response.items():
            role_detail = self._scraper.get_roles_detail(role_number)
            details = role_detail["details"]
            hierarchy = role_detail["hierarchy"]
            data = {
                "membership_number": membership_num,
                "role_name": role_dict.get("role_name"),
                "role_start": role_dict.get("role_start_date"),
                "role_end": role_dict.get("role_end_date"),
                "role_status": role_dict.get("role_status"),
                "line_manager_number": cast(details.get("line_manager_number")),
                "line_manager": details.get("line_manager"),
                "review_date": details.get("review_date"),
                "organisation": hierarchy.get("organisation"),
                "region": hierarchy.get("region"),
                "county": hierarchy.get("county"),
                "district": hierarchy.get("district"),
                "group": hierarchy.get("group"),
                "section": hierarchy.get("section"),
                "ce_check": details.get("ce_check"),
                "appointment_panel_approval": details.get("appointment_panel_approval"),
                "commissioner_approval": details.get("commissioner_approval"),
                "committee_approval": details.get("committee_approval"),
                "references": details.get("references"),
                **role_detail["getting_started"],
                "training_completion_date": None,
            }
            role_list.append({k: v for k, v in data.items() if v})

        return role_list

    def get_member_data(self, membership_num: int) -> pd.DataFrame:
        """
        Gets Compliance Report data for a specified member

        :param membership_num:
        :return:
        """

        # Columns for the compliance report in order
        # fmt: off
        compliance_columns = [
            "Membership_Number", "Forenames", "Surname", "Known_As", "Email",
            "Role", "Role_Start_Date", "Role_End_Date", "RoleStatus", "Review_date",
            "Country", "Region", "County", "District", "ScoutGroup", "DOB",
            "CE_Check", "AppAdvComm_Approval", "Commissioner_Approval", "Committee_Approval", "References",
            "Essential_Info", "PersonalLearningPlan", "Tools4Role", "GDPR",
            "WoodBadgeReceived", "SafetyTraining", "SafeguardingTraining", "FirstAidTraining"
        ]
        # fmt: on

        roles_data = self._roles_tab(membership_num, return_frame=True)
        if roles_data.empty:
            return pd.DataFrame(columns=compliance_columns)

        full_roles_mask = (roles_data["role_status"] != "Closed") & (roles_data["location_id"] > 0)
        open_roles = roles_data.index[full_roles_mask].to_list()
        roles_detail_array = [self._scraper.get_roles_detail(role_number) for role_number in open_roles]
        training_data = self._training_tab(membership_num, return_frame=True)  # TODO rename completion date to WoodBadgeReceived

        compliance_data = pd.DataFrame(roles_detail_array)
        compliance_data = pd.concat([compliance_data[col].apply(pd.Series) for col in compliance_data], axis=1)
        compliance_data = compliance_data.set_index(["role_number"])
        compliance_data = compliance_data.join(roles_data)
        compliance_data = compliance_data.merge(training_data, how="left", left_index=True, right_index=True)
        compliance_data = compliance_data.reindex(columns=compliance_columns)
        compliance_data.columns = compliance_data.columns.str.replace(normalise_cols, r"_\1\2", regex=True).str.lower()

        compliance_data["membership_number"] = membership_num

        personal_details = self._scraper.get_personal_tab(membership_num)
        for key, value in personal_details.items():
            compliance_data[key] = value

        # # Fill all rows with Mandatory Ongoing Learning data
        # mol_columns = ['safety_training', 'safeguarding_training', 'first_aid_training']
        # mol_data = compliance_data[mol_columns].dropna().iloc[0:1]
        # compliance_data[mol_columns] = compliance_data[mol_columns].fillna(mol_data)
        #
        # date_cols = [
        #     "role_start_date", "role_end_date",
        #     "ce_check", "review_date", "essential_info", "personal_learning_plan", "tools4_role", "gdpr",
        #     "wood_badge_received", "safety_training", "safeguarding_training", "first_aid_training"
        # ]
        #
        # # Covert to dd/mm/YYYY format, and get values where it isn't 'NaT', as NaT gets stringifyed
        # for col in date_cols:
        #     compliance_data[col] = pd.to_datetime(compliance_data[col])\
        #         .dt.strftime('%d/%m/%Y')\
        #         .str.replace("NaT", "", regex=False)

        text_cols = compliance_data.columns[compliance_data.dtypes == "object"]
        for col in text_cols:
            compliance_data[col] = compliance_data[col].str.strip()

        return compliance_data

    RTRT = Union[pd.DataFrame, dict]  # Roles Tab Return Type

    # See getRole in PGS\Needle
    def _roles_tab(self, membership_num: int, keep_non_volunteer_roles: bool = False, return_frame: bool = False) -> RTRT:
        """
        Gets the data from the Role tab in Compass for the specified member.

        Sanitises the data to a common format, and removes Occasional Helper, Network, and PVG roles by default.

        :param membership_num:
        :param keep_non_volunteer_roles:
        :return:
        """
        response = self._scraper.get_roles_tab(membership_num, keep_non_volunteer_roles)
        frame = pd.DataFrame(response).T
        return frame if return_frame else response

    def _training_tab(self, membership_num: int, return_frame: bool = False) -> dict or pd.DataFrame:
        """
        Gets training tab data for a given member

        :param membership_num: Compass ID
        :param return_frame: Return a dataframe of role training & OGL info? Otherwise returns all data
        :return:
        """
        training_data = self._scraper.get_training_tab(membership_num)

        training_roles = training_data["roles"]
        training_ogl = training_data["mandatory"]

        if return_frame:
            if training_roles:
                training_frame = pd.DataFrame(training_roles).T
                training_frame["SafetyTraining"] = training_ogl.get("SA", {"renewal_date": None})["renewal_date"]
                training_frame["SafeguardingTraining"] = training_ogl.get("SG", {"renewal_date": None})["renewal_date"]
                training_frame["FirstAidTraining"] = training_ogl.get("FA", {"renewal_date": None})["renewal_date"]

                return training_frame
            else:
                return pd.DataFrame()

        return training_data

    def _permits_tab(self, membership_num: int) -> list:
        return self._scraper.get_permits_tab(membership_num)

    def get_roles_from_members(self, compass_unit_id: int, member_numbers: pd.Series):
        try:
            # Attempt to see if the roles table has been fetched already and is on the local system
            roles_table = pd.read_csv(f"all_roles-{compass_unit_id}.csv")
            if roles_table:
                return roles_table
        except FileNotFoundError:
            pass

        member_numbers = member_numbers.drop_duplicates().to_list()
        roles_list = []
        for member_number in member_numbers:
            try:
                roles_list.append(self._roles_tab(member_number, return_frame=True))
            except Exception as e:
                with open("error_roles.txt", "a") as f:
                    f.write(f"Member Number: {member_number}\n")
                    f.write(f"Exception: {e}\n\n")
        roles_table = pd.concat(roles_list, sort=False)
        roles_table.to_csv(f"all_roles-{compass_unit_id}.csv", index=False, encoding="utf-8-sig")
        return roles_table
