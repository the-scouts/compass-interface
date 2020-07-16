import time

import pandas as pd
import requests
from lxml import html

from src.utility import CompassSettings
from src.utility import safe_xpath


class CompassPeopleScraper:
    def __init__(self):
        self.s = None

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
            "Membership_Num": membership_num,
            "Forenames": first_name,
            "Surname": last_names,
            "Known_As": known_as,
            "Email": email,
        }

    def get_roles_tab(self, membership_num: int):
        return self._get_member_profile_tab(membership_num, "Roles")

    def get_training_tab(self, membership_num: int):
        return self._get_member_profile_tab(membership_num, "Training")

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
        self._scraper = CompassPeopleScraper()
        self._scraper.s = session

    def get_member_data(self, membership_num: int):

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
        training_data = self._scraper.get_training_tab(membership_num)
        open_roles = roles_data["RoleStatus"].loc[
            (roles_data["RoleStatus"] != "Closed") & (roles_data["location_id"] > 0)].index.to_list()
        roles_detail_array = [self._scraper.get_roles_detail(role_number) for role_number in open_roles]
        personal_details = self._scraper.get_personal_tab(membership_num)

        compliance_data = pd.DataFrame(roles_detail_array) \
            .set_index(["role_number"]) \
            .join(roles_data) \
            .join(training_data) \
            .reindex(columns=compliance_columns)

        compliance_data['Membership_Number'] = membership_num

        for key, value in personal_details.items():
            compliance_data[key] = value

        # Fill all rows with Mandatory Ongoing Learning data
        mol_columns = ['SafetyTraining', 'SafeguardingTraining', 'FirstAidTraining']
        mol_data = compliance_data[mol_columns].dropna().iloc[0:1]
        compliance_data[mol_columns] = compliance_data[mol_columns].fillna(mol_data)

        date_cols = [
            "Role_Start_Date", "Role_End_Date",
            "CE_Check", "Review_date", "Essential_Info", "PersonalLearningPlan", "Tools4Role", "GDPR",
            "WoodBadgeReceived", "SafetyTraining", "SafeguardingTraining", "FirstAidTraining"
        ]

        # Covert to dd/mm/YYYY format, and get values where it isn't 'NaT', as NaT gets stringifyed
        compliance_data[date_cols] = compliance_data[date_cols].apply(
            lambda x: pd.to_datetime(x).dt.strftime('%d/%m/%Y'))
        compliance_data[date_cols] = compliance_data[date_cols].where(compliance_data[date_cols] != "NaT")

        text_cols = [col for col, dtype in compliance_data.dtypes.to_dict().items() if dtype == pd.np.dtype("O")]
        compliance_data[text_cols] = compliance_data[text_cols].apply(lambda x: x.str.strip())

        return compliance_data.reindex(columns=compliance_columns)

    def _roles_tab(self, membership_num: int) -> pd.DataFrame:
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

        # Remove OHs from list
        try:
            roles_data = roles_data.loc[roles_data["role_type"] != "Occasional Helper"]
        except KeyError:
            roles_data = roles_data.loc[~roles_data["Role"].str.lower().str.contains("occasional helper")]

        return roles_data

    def _training_tab(self, membership_num: int):
        response = self._scraper.get_training_tab(membership_num)
        tree = html.fromstring(response.get("content"))

        first_aid = {
            "name": safe_xpath(tree, "//tr[@data-ng_code='FA']//text()"),
            "last_completed": safe_xpath(tree, "//td[@id='tdLastComplete_FA']/label/text()"),
            "renewal_date": safe_xpath(tree, "//td[@id='tdRenewal_FA']/label/text()")
        }

        safety = {
            "name": safe_xpath(tree, "//tr[@data-ng_code='SA']//text()"),
            "last_completed": safe_xpath(tree, "//td[@id='tdLastComplete_SA']/label/text()"),
            "renewal_date": safe_xpath(tree, "//td[@id='tdRenewal_SA']/label/text()")
        }

        safeguarding = {
            "name": safe_xpath(tree, "//tr[@data-ng_code='SG']//text()"),
            "last_completed": safe_xpath(tree, "//td[@id='tdLastComplete_SG']/label/text()"),
            "renewal_date": safe_xpath(tree, "//td[@id='tdRenewal_SG']/label/text()")
        }

        training_completion = []
        roles = tree.xpath("//table[@id='tbl_p5_TrainModules']/tr[@class='msTR']")
        for role in roles:
            info = {"role_number": int(role.xpath("./@data-ng_mrn")[0]), }
            completion_date = role.xpath("./td[6]//text()")
            if completion_date:
                info["WoodBadgeType"] = completion_date[0].split(':')[0].strip()
                info["WoodBadgeReceived"] = completion_date[0].split(':')[1].strip()
            training_completion.append(info)

        if training_completion:
            training_data = pd.DataFrame(training_completion).set_index(["role_number"])
            training_data["SafetyTraining"] = safety["renewal_date"]
            training_data["SafeguardingTraining"] = safeguarding["renewal_date"]
            training_data["FirstAidTraining"] = first_aid["renewal_date"]

            return training_data
        else:
            return pd.DataFrame()

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
