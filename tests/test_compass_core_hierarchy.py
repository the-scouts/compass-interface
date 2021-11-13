from collections.abc import Iterator
import inspect

from compass.core import hierarchy
import compass.core as ci


class TestHierarchy:
    def test_flatten_hierarchy(self):
        # Given
        hierarchy_data = ci.UnitData(
            unit_id=10001234,
            name=None,
            level="District",
            child=[
                ci.DescendantData(
                    unit_id=10050000,
                    name="1st Whitehall",
                    level="Group",
                    child=None,
                    sections=[
                        ci.HierarchySection(unit_id=10050100, name="1st Whitehall Beavers", section_type="Beavers"),
                        ci.HierarchySection(unit_id=10050200, name="1st Whitehall Cubs", section_type="Cubs"),
                        ci.HierarchySection(unit_id=10050300, name="1st Whitehall Scouts", section_type="Scouts"),
                    ],
                ),
                ci.DescendantData(
                    unit_id=10060000,
                    name="2nd Pimlico",
                    level="Group",
                    child=None,
                    sections=[
                        ci.HierarchySection(unit_id=10060100, name="Pimlico Beaver Scouts", section_type="Beavers"),
                        ci.HierarchySection(unit_id=10060200, name="Pimlico Cubs", section_type="Cubs"),
                        ci.HierarchySection(unit_id=10060300, name="Pimlico Cub Scouts", section_type="Cubs"),
                        ci.HierarchySection(unit_id=10060400, name="Pimlico Scouts", section_type="Scouts"),
                    ],
                ),
            ],
            sections=[
                ci.HierarchySection(unit_id=10007100, name="M25 Scout Network", section_type="Network"),
                ci.HierarchySection(unit_id=10007200, name="District Active Support Unit", section_type="ASU"),
                ci.HierarchySection(unit_id=10007300, name="Londinium Explorers", section_type="Explorers"),
                ci.HierarchySection(unit_id=10007400, name="YL ESU", section_type="Explorers"),
            ],
        )

        # When
        result = hierarchy._flatten_hierarchy(hierarchy_data)

        # Then
        assert inspect.isgenerator(result)
        assert isinstance(result, Iterator)
        result = [*result]
        assert result == [
            {"unit_id": 10001234, "name": None, "section": False, "district": 10001234},
            {"unit_id": 10050000, "name": "1st Whitehall", "section": False, "district": 10001234, "group": 10050000},
            {"unit_id": 10050100, "name": "1st Whitehall Beavers", "section": True, "district": 10001234, "group": 10050000},
            {"unit_id": 10050200, "name": "1st Whitehall Cubs", "section": True, "district": 10001234, "group": 10050000},
            {"unit_id": 10050300, "name": "1st Whitehall Scouts", "section": True, "district": 10001234, "group": 10050000},
            {"unit_id": 10060000, "name": "2nd Pimlico", "section": False, "district": 10001234, "group": 10060000},
            {"unit_id": 10060100, "name": "Pimlico Beaver Scouts", "section": True, "district": 10001234, "group": 10060000},
            {"unit_id": 10060200, "name": "Pimlico Cubs", "section": True, "district": 10001234, "group": 10060000},
            {"unit_id": 10060300, "name": "Pimlico Cub Scouts", "section": True, "district": 10001234, "group": 10060000},
            {"unit_id": 10060400, "name": "Pimlico Scouts", "section": True, "district": 10001234, "group": 10060000},
            {"unit_id": 10007100, "name": "M25 Scout Network", "section": True, "district": 10001234},
            {"unit_id": 10007200, "name": "District Active Support Unit", "section": True, "district": 10001234},
            {"unit_id": 10007300, "name": "Londinium Explorers", "section": True, "district": 10001234},
            {"unit_id": 10007400, "name": "YL ESU", "section": True, "district": 10001234},
        ]
