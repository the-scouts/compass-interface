import json
import time
import datetime
import io

import pandas as pd
import requests
from lxml import html
requests.urllib3.disable_warnings(requests.urllib3.exceptions.InsecureRequestWarning)


def safe_xpath(tree, path: str):
    array = tree.xpath(path)
    return array[0] if array else None


class CompassSettings:
    base_url = "https://compass.scouts.org.uk"
    total_requests = 0


class CompassLogon:
    def __init__(self, credentials: list, role_to_use: str):
        self._member_role_number = 0
        self.credentials = credentials
        self.role_to_use = role_to_use

        self.session: requests.sessions.Session = self.do_logon()

    @property
    def mrn(self) -> int:
        return self._member_role_number

    @property
    def cn(self) -> int:
        return self._contact_name

    @property
    def jk(self) -> int:
        return self._jk

    def do_logon(self, credentials: list = None, role_to_use: str = None) -> requests.sessions.Session:
        # create session and get ASP.Net Session ID cookie from the compass server
        s = self.create_session()

        auth = credentials if credentials else self.credentials
        logon_response = self.logon(s, auth)

        # Create and set auth headers for post requests
        self.update_authentication(s, logon_response)

        if role_to_use:
            self.change_role(s, role_to_use, logon_response)
        elif self.role_to_use:
            self.change_role(s, self.role_to_use, logon_response)
        else:
            print("not changing role")

        return s

    @staticmethod
    def create_session() -> requests.sessions.Session:
        # create session and get ASP.Net Session ID cookie from the compass server
        session = requests.session()

        CompassSettings.total_requests += 1
        session.head(f"{CompassSettings.base_url}/", verify=False)  # use .head() as only headers needed to grab session cookie

        if not session.cookies:
            raise Exception("No cookie found, terminating.")

        return session

    @staticmethod
    def logon(s: requests.sessions.Session, auth: list):
        headers = {'Referer': f'{CompassSettings.base_url}/login/User/Login'}  # this is genuinely needed otherwise login doesn't work

        username = auth[0]
        password = auth[1]
        credentials = {
            'EM': f"{username}",
            'PW': f"{password}",
            'ON': f'{10000001}'
        }

        # log in
        print("Logging in")
        s.post(f'{CompassSettings.base_url}/Login.ashx', headers=headers, data=credentials, verify=False)
        CompassSettings.total_requests += 1
        response = s.get(f"{CompassSettings.base_url}/ScoutsPortal.aspx", verify=False)
        if response.url != f'{CompassSettings.base_url}/ScoutsPortal.aspx':
            raise Exception("Login has failed")
        else:
            form = html.fromstring(response.content).forms[0]
            roles = form.inputs['ctl00$UserTitleMenu$cboUCRoles']
            role_maps = {role.get("value"): role.text for role in roles.getchildren()}
            current_role = role_maps[roles.value]
            print(f"Logged in! Using Role: {current_role}")

        return form  # quick fix before doing auth headers and role change properly

    def update_authentication(self, s: requests.sessions.Session, form_tree) -> None:
        auth_headers = self.create_auth_headers(form_tree)
        s.headers.update(auth_headers)

    # @staticmethod
    def create_auth_headers(self, form_tree) -> dict:
        compass_dict = {}
        compass_vars = form_tree.fields["ctl00$_POST_CTRL"]
        for pair in compass_vars.split('~'):
            item = pair.split('#')
            key, value = item[0], item[1]
            compass_dict[key] = value
        self._contact_name = compass_dict["Master.User.CN"]
        self._jk = compass_dict["Master.User.JK"]
        self._member_role_number = compass_dict["Master.User.MRN"]
        session_id = compass_dict["Master.Sys.SessionID"]
        # return authorisation headers dictionary, header name: header value
        return {
            "Authorization": f'{self._contact_name}~{self._member_role_number}',
            "SID": session_id
        }

    def change_role(self, s: requests.sessions.Session, new_role, form_tree):
        print("Changing role")

        # get roles from compass page (list of option tags)
        roles_selector = form_tree.inputs['ctl00$UserTitleMenu$cboUCRoles']

        # List comp into dict comp to generate role name: role number dict
        roles_dict = {role.text: role.get("value") for role in roles_selector.getchildren()}

        # Get role number from roles dictionary
        self._member_role_number = roles_dict[new_role]

        # Change role to the specified role
        CompassSettings.total_requests += 1
        s.post(f"{CompassSettings.base_url}/API/ChangeRole", json={"MRN": self._member_role_number}, verify=False)

        print("Confirming role has been changed")
        # Check that the role has been changed to the desired role. If not, raise exception
        CompassSettings.total_requests += 1
        role_conf = s.get(f"{CompassSettings.base_url}/ScoutsPortal.aspx", verify=False).content
        new_form_tree = html.fromstring(role_conf).forms[0]

        selected_role = new_form_tree.inputs['ctl00$UserTitleMenu$cboUCRoles'].value
        if selected_role != self._member_role_number:
            raise Exception("Role failed to update in Compass")

        # Set auth headers for new role
        self.update_authentication(s, new_form_tree)
        print(f"Role changed to {new_role}")

    @staticmethod
    def get_available_roles(form_tree):
        # get roles from compass page (list of option tags)
        roles_selector = form_tree.inputs['ctl00$UserTitleMenu$cboUCRoles']

        # List comp into dict comp to generate role name: role number dict
        roles_dict = {role.text: role.get("value") for role in roles_selector.getchildren()}

        return roles_dict


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


class CompassHierarchyScraper:
    def __init__(self):
        self._s = None

    @property
    def s(self):
        return self._s

    @s.setter
    def s(self, session: requests.sessions.Session):
        self._s = session

    def get_units_from_hierarchy(self, parent_unit: int, level: str, ) -> list:
        # Get API endpoint from level
        url_string = CompassHierarchy.hierarchy_levels.loc[CompassHierarchy.hierarchy_levels["type"] == level, "endpoint"].str.cat()

        CompassSettings.total_requests += 1
        result = self._s.post(f"{CompassSettings.base_url}/hierarchy{url_string}", json={"LiveData": "Y", "ParentID": f"{parent_unit}"}, verify=False)

        # Handle unauthorised access
        if result.json() == {'Message': 'Authorization has been denied for this request.'}:
            return [{"id": None, "name": None}]

        result_units = []
        for unit_dict in result.json():
            result_units.append({
                "id": int(unit_dict["Value"]),
                "name": unit_dict["Description"],
                "adults": json.loads(unit_dict["Tag"])[0]["Members"],
                # "parent_id": unit_dict["Parent"],
                # "section_type": json.loads(unit_dict["Tag"])[0]["SectionTypeDesc"],
            })

        return result_units

    def get_members_with_roles_in_unit(self, unit_number):
        # Construct request data
        # JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair
        dt = datetime.datetime.now()
        dt_milli = dt.microsecond // 1000  # Get the the milliseconds from microseconds
        time_uid = f"{dt.hour}{dt.minute}{dt_milli}"
        data = {"SearchType": "HIERARCHY", "OrganisationNumber": unit_number, "UI": time_uid}
        rest_data = [{"Key": f"{k}", "Value": f"{v}"} for k, v in data.items()]

        # Execute search
        CompassSettings.total_requests += 1
        self._s.post(f"{CompassSettings.base_url}/Search/Members", json=rest_data, verify=False)

        # Fetch results from Compass
        CompassSettings.total_requests += 1
        search_results = self._s.get(f"{CompassSettings.base_url}/SearchResults.aspx", verify=False,)

        # Gets the compass form from the returned document
        form = html.fromstring(search_results.content).forms[0]

        # If the search hasn't worked the form returns an InvalidSearchError - check for this and raise an error if needed
        if form.action == './ScoutsPortal.aspx?Invalid=SearchError':
            raise Exception("Invalid Search")

        # Get the data and return it as a usable python object (list)
        member_data_string = form.fields['ctl00$plInnerPanel_head$txt_h_Data'] or '[]'
        member_data = json.loads(member_data_string)
        for member in member_data:
            del member['visibility_status']     # This is meaningless as we can only see Y people
            del member['address']               # This doesn't reliably give us postcode and is a lot of data
            del member['role']                  # This is Primary role and so not useful

        return member_data


class CompassHierarchy:
    # It is important that the separators are tabs, as there are spaces in the values
    hierarchy_levels = pd.read_csv(io.StringIO('''
    level	parent_level	type				endpoint			has_children
0	1		Organisation	Countries			/countries			True
1	1		Organisation	Org Sections		/hq/sections		False
2	2		Country			Regions				/regions			True
3	2		Country			Country Sections	/country/sections	False
4	3		Region			Counties			/counties			True
5	3		Region			Region Sections		/region/sections	False
6	4		County			Districts			/districts			True
7	4		County			County Sections		/county/sections	False
8	5		District		Groups				/groups				True
9	5		District		District Sections	/district/sections	False
10	6		Group			Group Sections		/group/sections		False
'''), engine='python', sep=r'\t+')

    def __init__(self, session: requests.sessions.Session):
        self._scraper = CompassHierarchyScraper()
        self._scraper.s = session

    def get_hierarchy(self, compass_id: int, level: str) -> dict:
        try:
            # Attempt to see if the hierarchy has been fetched already and is on the local system
            with open(f"hierarchy-{compass_id}.json", 'r', encoding='utf-8') as f:
                out = json.load(f)
                if out:
                    return out
        except FileNotFoundError:
            pass

        out = self._get_descendants_recursive(compass_id, hier_level=level)
        with open(f"hierarchy-{compass_id}.json", 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=4)
        return out

    def _get_descendants_recursive(self, compass_id: int, hier_level: str = None, hier_num: int = None) -> dict:
        if hier_num:
            level_numeric = hier_num
        elif hier_level:
            level_numeric = CompassHierarchy.hierarchy_levels.loc[CompassHierarchy.hierarchy_levels["parent_level"] == hier_level, "level"].min()
            if not level_numeric:
                raise ValueError(f"Passed level: {hier_level} is illegal. Valid values are {CompassHierarchy.hierarchy_levels['parent_level'].drop_duplicates().to_list()}")
        else:
            raise ValueError("A numeric or string hierarchy level needs to be passed")

        decedents_data = self.get_units_from_numeric_level(compass_id, level_numeric, )

        for key, value in decedents_data.items():
            if key == "child" and value is not None:
                for child in value:
                    child.update(self._get_descendants_recursive(child["id"], hier_num=level_numeric + 1, ))

        out = {"id": compass_id, **decedents_data}

        return out

    def get_units_from_numeric_level(self, parent_id: int, num_level: int, ) -> dict:
        print(f"getting data for unit {parent_id}")
        level_children = CompassHierarchy.hierarchy_levels.loc[CompassHierarchy.hierarchy_levels["level"] == num_level]
        parent_level = CompassHierarchy.hierarchy_levels.loc[CompassHierarchy.hierarchy_levels["level"] == num_level, "parent_level"].drop_duplicates().str.cat()

        # All to handle as Group doesn't have grand-children
        sections_list = level_children.loc[~level_children["has_children"], "type"].to_list()
        has_children = level_children.loc[level_children["has_children"], "type"].to_list()
        return {
            "level": parent_level,
            "child": self._scraper.get_units_from_hierarchy(parent_id, has_children[0], ) if has_children else None,
            "sections": self._scraper.get_units_from_hierarchy(parent_id, sections_list[0], ),
        }

    @staticmethod
    def _flatten_hierarchy_dict(hierarchy_dict: dict):
        def flatten(d: dict, hier: dict = None):
            id_label = f"{d['level']}_ID"
            name_label = f"{d['level']}_name"
            out = {
                **hier,
                id_label: d["id"],
                name_label: d.get("name"),
            }
            flat.append({"compass": d["id"], "name": d.get("name"), **out})
            for val in d["child"] or []:
                flatten(val, out)
            for val in d["sections"]:
                flat.append({"compass": val["id"], "name": val["name"], **out})

        flat = []
        flatten(hierarchy_dict, {})
        return flat

    def hierarchy_to_dataframe(self, hierarchy_dict):
        flat_hierarchy = self._flatten_hierarchy_dict(hierarchy_dict)
        dataframe = pd.DataFrame(flat_hierarchy)
        for field, dtype in dataframe.dtypes.items():
            if dtype.name == "float64":
                dataframe[field] = dataframe[field].astype("Int64")
        return dataframe

    def _get_all_members_in_hierarchy(self, parent_id: int, compass_ids: pd.Series) -> dict:
        try:
            # Attempt to see if the members dict has been fetched already and is on the local system
            with open(f"all-members-{parent_id}.json", 'r', encoding='utf-8') as f:
                all_members = json.load(f)
                if all_members:
                    return all_members
        except FileNotFoundError:
            pass

        all_members = {}
        for compass_id in compass_ids.drop_duplicates().to_list():
            print(f"Getting members for {compass_id}")
            all_members[compass_id] = self._scraper.get_members_with_roles_in_unit(compass_id)
        with open(f"all-members-{parent_id}.json", 'w', encoding='utf-8') as f:
            json.dump(all_members, f, ensure_ascii=False, indent=4)
        return all_members

    def get_all_members_table(self, parent_id: int, compass_ids: pd.Series) -> pd.DataFrame:
        members = self._get_all_members_in_hierarchy(parent_id, compass_ids)
        flat_members = [{"compass_id": compass, **member_dict} for compass, member_list in members.items() for member_dict in member_list]
        return pd.DataFrame(flat_members)
