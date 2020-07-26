import datetime
import re
import time

import pandas as pd
import requests
from lxml import html

from src.utility import CompassSettings
from src.utility import safe_xpath

normalise_cols = re.compile(r"((?<=[a-z0-9])[A-Z]|(?!^)[A-Z](?=[a-z]))|_([^_])")


class CompassPeopleScraper:
    def __init__(self, session: requests.sessions.Session):
        self.s = session

    def _get_member_profile_tab(self, membership_num: int, profile_tab: str) -> dict:
        profile_tab = profile_tab.upper()
        tabs = ["ROLES", "PERMITS", "TRAINING", "AWARDS", "EMERGENCY", "COMMS", "VISIBILITY", "DISCLOSURES"]
        url = f"{CompassSettings.base_url}/MemberProfile.aspx?CN={membership_num}"
        if profile_tab == "PERSONAL":
            CompassSettings.total_requests += 1
            response = self.s.get(url, verify=False, )
        elif profile_tab in tabs:
            url += f"&Page={profile_tab}&TAB"
            CompassSettings.total_requests += 1
            response = self.s.get(url, verify=False, )
        else:
            raise ValueError(f"Specified member profile tab {profile_tab} is invalid. Allowed values are {tabs.append('PERSONAL')}")

        return {"content": response.content, "encoding": response.encoding}

    def get_personal_tab(self, membership_num: int) -> dict:
        response = self._get_member_profile_tab(membership_num, "Personal")
        tree = html.fromstring(response.get("content"))
        names = tree.xpath("//title//text()")[0].strip().split(" ")[3:]
        first_name = names[0]
        last_names = ' '.join(names[1:])
        known_as = tree.xpath("//*[@id='divProfile0']/table//table/tr[2]/td[2]/label/text()")[0]
        email = safe_xpath(tree, './/label/b[contains(text(),"Email")]/../../../td[3]//text()')

        return {
            "membership_number": membership_num,
            "forenames": first_name,
            "surname": last_names,
            "known_as": known_as,
            "email": email,
        }

    def get_roles_tab(self, membership_num: int):
        return self._get_member_profile_tab(membership_num, "Roles")

    def get_training_tab(self, membership_num: int):
        return self._get_member_profile_tab(membership_num, "Training")

    # See getAppointment in PGS\Needle
    def get_roles_detail(self, role_number: int):
        renamed_levels = {
            'Organisation':                                      'Organisation',
            'Country':                                           'Country',
            'Region':                                            'Region',
            'County / Area / Scottish Region / Overseas Branch': 'County',
            'District':                                          'District',
            'Group':                                             'ScoutGroup',
            'Section':                                           'Section',
        }

        module_names = {
            'Essential Information': "Essential_Info",
            "PersonalLearningPlan": "PersonalLearningPlan",
            'Tools for the Role (Section Leaders)': "Tools4Role",
            'Tools for the Role (Managers and Supporters)': "Tools4Role",
            'General Data Protection Regulations': "GDPR",
        }

        start_time = time.time()
        CompassSettings.total_requests += 1
        response = self.s.get(f"{CompassSettings.base_url}/Popups/Profile/AssignNewRole.aspx?VIEW={role_number}", verify=False, )
        tree = html.fromstring(response.content)
        form = tree.forms[0]
        print(f"Getting details for role number: {role_number}. Request in {(time.time() - start_time):.2f}")

        role_details_dict = {
            "organisation_level":       form.fields.get("ctl00$workarea$cbo_p1_level"),
            "dbs_check":                form.fields.get("ctl00$workarea$txt_p2_disclosure"),
            "CE_Check":                 form.fields.get("ctl00$workarea$txt_p2_cecheck"),   # TODO if CE check date != current date then is valid
            "Review_date":              form.fields.get("ctl00$workarea$txt_p2_review"),
            "Line_manager_number":      form.fields.get("ctl00$workarea$cbo_p2_linemaneger"),
            "LineManager":              safe_xpath(form.inputs['ctl00$workarea$cbo_p2_linemaneger'], "./*[@selected='selected']/text()"),
            "References":               safe_xpath(tree, "//tr/td/select[@data-app_code='ROLPRP|REF']/*[@selected='selected']//text()"),
            "AppAdvComm_Approval":      safe_xpath(tree, "//tr/td/select[@data-app_code='ROLPRP|AACA']//text()"),
            "Commissioner_Approval":    safe_xpath(tree, "//tr/td/select[@data-app_code='ROLPRP|CAPR']//text()"),
            "Committee_Approval":       safe_xpath(tree, "//tr/td/select[@data-app_code='ROLPRP|CCA']//text()"),
            "DOB":                      safe_xpath(tree, "//tr/td/input/@data-dob"),
        }
        role_details_dict = {k: v for k, v in role_details_dict.items() if v is not None}

        # Get all levels of the org hierarchy and select those that will have information
        rows = tree.xpath("//tr/td/select")[:7]
        all_locations = {row.xpath("./@title")[0]: row.xpath("./option/text()")[0] for row in rows}
        unset_vals = ['--- Not Selected ---', '--- No Items Available ---']
        clipped_locations = {renamed_levels[key]: value for key, value in all_locations.items() if value not in unset_vals}

        # Get all training modules and then extract the required modules to a dictionary
        modules_output = {}
        modules = tree.xpath("//*[@class='trTrain trTrainData']")
        for module in modules:
            for name, out_name in module_names.items():
                # If the module name matches any of the modules in module_names
                if safe_xpath(module, "./td/label/text()") == name:
                    modules_output[f"{out_name}"] = safe_xpath(module, "./td[3]/input/@value")          # Save module validation date
                    modules_output[f"{out_name}_val_by"] = safe_xpath(module, "./td/input[2]/@value")   # Save who validated the module
        del rows, all_locations, unset_vals, modules

        return {**{"role_number": role_number}, **clipped_locations, **role_details_dict, **modules_output}


class CompassPeople:
    def __init__(self, session: requests.sessions.Session):
        self._scraper = CompassPeopleScraper(session)

    def get_member_data(self, membership_num: int):
        """
        Gets Compliance Report data for a specified member

        :param membership_num:
        :return:
        """

        # Columns for the compliance report in order
        compliance_columns = [
            'Membership_Number', 'Forenames', 'Surname', 'Known_As', 'Email',
            'Role', 'Role_Start_Date', 'Role_End_Date', 'RoleStatus', 'Review_date',
            'Country', 'Region', 'County', 'District', 'ScoutGroup', "DOB",
            'CE_Check', 'AppAdvComm_Approval', 'Commissioner_Approval', 'Committee_Approval', 'References',
            'Essential_Info', 'PersonalLearningPlan', 'Tools4Role', 'GDPR',
            'WoodBadgeReceived', 'SafetyTraining', 'SafeguardingTraining', 'FirstAidTraining'
        ]

        roles_data = self._roles_tab(membership_num)
        if roles_data.empty:
            return pd.DataFrame(columns=compliance_columns)

        full_roles_mask = (roles_data["role_status"] != "Closed") & (roles_data["location_id"] > 0)
        open_roles = roles_data.index[full_roles_mask].to_list()
        roles_detail_array = [self._scraper.get_roles_detail(role_number) for role_number in open_roles]
        training_data = self._training_tab(membership_num, return_frame=True)  # TODO rename completion date to WoodBadgeReceived

        compliance_data = pd.DataFrame(roles_detail_array)
        compliance_data = compliance_data.set_index(["role_number"])
        compliance_data = compliance_data.join(roles_data)
        compliance_data = compliance_data.join(training_data)
        compliance_data = compliance_data.reindex(columns=compliance_columns)
        compliance_data.columns = compliance_data.columns.str.replace(normalise_cols, r"_\1\2", regex=True).str.lower()

        compliance_data['membership_number'] = membership_num

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

    # See getRole in PGS\Needle
    def _roles_tab(self, membership_num: int, keep_non_volunteer_roles: bool = False) -> pd.DataFrame:
        """
        Gets the data from the Role tab in Compass for the specified member.

        Sanitises the data to a common format, and removes Occasional Helper, Network, and PVG roles by default.

        :param membership_num:
        :param keep_non_volunteer_roles:
        :return:
        """
        print(f"getting roles tab for member number: {membership_num}")
        response = self._scraper.get_roles_tab(membership_num)
        tree = html.fromstring(response.get("content"))

        if tree.forms[0].action == './ScoutsPortal.aspx?Invalid=AccessCN':
            raise PermissionError(f"You do not have permission to the details of {membership_num}")

        row_data = []
        rows = tree.xpath("//tbody/tr")
        fallback_type = [{"title": None}]
        fallback_loc_id = [{"data-ng_id": None}]
        for row in rows:
            cells = row.getchildren()
            row_data.append({
                "role_number": int(row.get("data-pk")),
                "role_name": cells[0].text_content().strip(),
                "role_class": cells[1].text_content().strip(),
                "role_type": [i.get("title") for i in cells[0].getchildren() or fallback_type][0],           # only if access to System Admin tab
                "location_id": [i.get("data-ng_id") for i in cells[2].getchildren() or fallback_loc_id][0],  # only if role in your hierarchy AND location still exists
                "location_name": cells[2].text_content().strip(),
                "role_start_date": cells[3].text_content().strip(),
                "role_end_date": cells[4].text_content().strip(),
                "role_status": cells[5].xpath("./label//text()")[0].strip(),
            })
        roles_data = pd.DataFrame(row_data).set_index(["role_number"], drop=False)
        roles_data["location_id"] = pd.to_numeric(roles_data["location_id"]).astype("Int64")  # handles NaNs
        roles_data["membership_num"] = membership_num

        if not keep_non_volunteer_roles:
            # Remove OHs from list
            try:
                roles_data = roles_data.loc[roles_data["role_class"] != "Helper"]
            except KeyError:
                roles_data = roles_data.loc[~roles_data["Role"].str.lower().str.contains("occasional helper")]

            # TODO remove Network Members, remove PVG roles

        return roles_data

    def _training_tab(self, membership_num: int, return_frame: bool = False) -> dict or pd.DataFrame:
        """
        Gets training tab data for a given member

        :param membership_num: Compass ID
        :param return_frame: Return a dataframe of role training & OGL info? Otherwise returns all data
        :return:
        """
        response = self._scraper.get_training_tab(membership_num)
        tree = html.fromstring(response.get("content"))

        rows = tree.xpath("//table[@id='tbl_p5_TrainModules']/tr")
        roles = [row for row in rows if "msTR" in row.get("class")]
        personal_learning_plans = [row for row in rows if "trPLP" in row.get("class")]

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
                parts = completion_string.split(':')
                info["completion_type"] = parts[0].strip()
                info["completion_date"] = datetime.datetime.strptime(parts[1].strip(), "%d %B %Y")
                info["ct"] = parts[3:]  # TODO what is this? From CompassRead.php
            info["wood_badge_number"] = child_nodes[5].get("id")

            training_roles[info["role_number"]] = info

        training_plps = {}
        training_gdpr = []
        for plp in personal_learning_plans:
            plp_table = plp.getchildren()[0].getchildren()[0]
            plp_data = []
            content_rows = [row for row in plp_table.getchildren() if "msTR trMTMN" == row.get("class")]
            for module_row in content_rows:
                module_data = {}
                child_nodes = module_row.getchildren()
                module_data["pk"] = int(module_row.get("data-pk"))
                module_data["module_id"] = child_nodes[0].get("id")[4:]
                matches = re.match(r"^([A-Z0-9]+) - (.+)$", child_nodes[0].text_content()).groups()
                if matches:
                    module_data["code"] = matches[0]
                    module_data["name"] = matches[1]

                module_data["learning_required"] = "yes" in child_nodes[1].text_content().lower()
                module_data["learning_method"] = child_nodes[2].text_content()
                module_data["learning_completed"] = child_nodes[3].text_content()
                try:
                    module_data["learning_date"] = datetime.datetime.strptime(child_nodes[3].text_content(), "%d %B %Y")
                except ValueError:
                    pass

                validated_by_string = child_nodes[4].text_content()
                validated_by_data = validated_by_string.split(" ", maxsplit=1) + [""]  # Add empty item to prevent IndexError
                module_data["validated_membership_number"] = validated_by_data[0]
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
            ogl_data = {}
            ogl_data["code"] = ongoing_learning.get("data-ng_code")
            cell_text = {c.get("id"): c.text_content() for c in ongoing_learning.getchildren()}
            cell_text = {k.split("_")[0] if isinstance(k, str) else k: v for k, v in cell_text.items()}

            ogl_data["name"] = cell_text.get(None)
            ogl_data["completed_date"] = cell_text.get("tdLastComplete")
            ogl_data["renewal_date"] = cell_text.get("tdRenewal")

            training_ogl[ogl_data["code"]] = ogl_data
            # TODO missing data-pk from cell.getchildren()[0].tag == "input", and module names/codes. Are these important?

        # Handle GDPR
        sorted_gdpr = sorted([date for date in training_gdpr if isinstance(date, datetime.datetime)], reverse=True)
        gdpr_date = sorted_gdpr[0] if sorted_gdpr else datetime.datetime(1900, 1, 1)
        training_ogl["GDPR"] = {
            "code": "GDPR",
            "name": "GDPR Training",
            "completed_date": gdpr_date
        }

        training_data = {
            "roles": training_roles,
            "plps": training_plps,
            "mandatory": training_ogl
        }
        if return_frame:
            if training_roles:
                training_frame = pd.DataFrame(training_roles).set_index(["role_number"])
                training_frame["SafetyTraining"] = training_ogl["SA"]["renewal_date"]
                training_frame["SafeguardingTraining"] = training_ogl["SG"]["renewal_date"]
                training_frame["FirstAidTraining"] = training_ogl["FA"]["renewal_date"]

                return training_frame
            else:
                return pd.DataFrame()

        return training_data

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
                roles_list.append(self._roles_tab(member_number))
            except Exception as e:
                with open("error_roles.txt", 'a') as f:
                    f.write(f"Member Number: {member_number}\n")
                    f.write(f"Exception: {e}\n\n")
        roles_table = pd.concat(roles_list, sort=False)
        roles_table.to_csv(f"all_roles-{compass_unit_id}.csv", index=False, encoding="utf-8-sig")
        return roles_table
