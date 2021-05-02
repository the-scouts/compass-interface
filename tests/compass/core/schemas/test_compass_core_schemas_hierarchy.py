import pydantic
import pytest

from compass.core.schemas import hierarchy

base_data = {
    "unit_id": 42,
    "name": "name",
}


class TestSchemaHierarchy:
    def test_hierarchy_base_round_trip(self):
        # Given
        data = dict(unit_id=123)

        # When
        result = hierarchy.HierarchyBase(**data)

        # Then
        assert data == result.dict()

    def test_hierarchy_base_invalid(self):
        # Given
        data = dict(unit_id="abc")

        # Then
        with pytest.raises(pydantic.ValidationError, match=r"validation errors? for HierarchyBase"):
            # When
            hierarchy.HierarchyBase(**data)

    def test_hierarchy_unit_round_trip(self):
        # Given
        data = base_data.copy()

        # When
        result = hierarchy.HierarchyUnit(**data)

        # Then
        assert data == result.dict()

    def test_hierarchy_unit_invalid_normal(self):
        # Given
        data = base_data | dict(name={"W1A 1AA", "SW1A 1AA"})  # type: ignore # testing

        # Then
        with pytest.raises(pydantic.ValidationError, match=r"validation errors? for HierarchyUnit"):
            # When
            hierarchy.HierarchyUnit(**data)

    def test_hierarchy_section_round_trip(self):
        # Given
        data = base_data | dict(section_type="Beavers")

        # When
        result = hierarchy.HierarchySection(**data)

        # Then
        assert data == result.dict()

    def test_hierarchy_section_invalid_literal(self):
        # Given
        data = base_data | dict(section_type="random")

        # Then
        with pytest.raises(pydantic.ValidationError, match=r"validation errors? for HierarchySection"):
            # When
            hierarchy.HierarchySection(**data)

    def test_hierarchy_level_round_trip(self):
        # Given
        data = dict(unit_id=123, level="Group")

        # When
        result = hierarchy.HierarchyLevel(**data)

        # Then
        assert data == result.dict()

    def test_hierarchy_level_invalid_literal(self):
        # Given
        data = dict(unit_id=123, level="random")

        # Then
        with pytest.raises(pydantic.ValidationError, match=r"validation errors? for HierarchyLevel"):
            # When
            hierarchy.HierarchyLevel(**data)

    def test_unit_data_round_trip(self):
        # Given
        section_data = base_data | dict(unit_id=1, section_type="Beavers")
        data = dict(unit_id=42, level="Group", child=None, sections=[section_data])

        # When
        result = hierarchy.UnitData(**data)

        # Then
        assert data | {"name": None} == result.dict()

    def test_unit_data_invalid_missing(self):
        # Given
        data = dict(unit_id=123, level="Group", child=None)

        # Then
        with pytest.raises(pydantic.ValidationError, match=r"validation errors? for UnitData"):
            # When
            hierarchy.UnitData(**data)

    def test_descendant_data_round_trip(self):
        # Given
        hierarchy_unit_data = dict(unit_id=123, name="name")
        unit_data_data = dict(unit_id=123, level="Group", child=None, sections=[hierarchy_unit_data | dict(section_type="Beavers")])
        data = hierarchy_unit_data | unit_data_data

        # When
        result = hierarchy.DescendantData(**data)

        # Then
        assert data == result.dict()

    def test_descendant_data_invalid_missing(self):
        # Given
        hierarchy_unit_data = dict(id=123, name="name")
        data = hierarchy_unit_data | {}

        # Then
        with pytest.raises(pydantic.ValidationError, match=r"validation errors? for DescendantData"):
            # When
            hierarchy.DescendantData(**data)

    def test_hierarchy_member_round_trip(self):
        # Given
        data = dict(contact_number=123, name="Adam Smith", role=None)

        # When
        result = hierarchy.HierarchyMember(**data)

        # Then
        assert data == result.dict()

    def test_hierarchy_member_invalid(self):
        # Given
        data = dict(contact_number=123, name="Adam Smith", role=object())

        # Then
        with pytest.raises(pydantic.ValidationError, match=r"validation errors? for HierarchyMember"):
            # When
            hierarchy.HierarchyMember(**data)

    def test_hierarchy_unit_members_round_trip(self):
        # Given
        data = dict(unit_id=321, members=[dict(contact_number=123, name="Adam Smith", role=None)])

        # When
        result = hierarchy.HierarchyUnitMembers(**data)

        # Then
        assert data == result.dict()

    def test_hierarchy_unit_members_invalid_missing(self):
        # Given
        data = dict(unit_id=321, members=[object()])

        # Then
        with pytest.raises(pydantic.ValidationError, match=r"validation errors? for HierarchyUnitMembers"):
            # When
            hierarchy.HierarchyUnitMembers(**data)

    def test_hierarchy_unit_members_list_round_trip(self):
        # Given
        data = [dict(unit_id=321, members=[dict(contact_number=123, name="Adam Smith", role=None)])]

        # When
        result = [hierarchy.HierarchyUnitMembers(**unit_members) for unit_members in data]

        # Then
        assert data == [model.__dict__ for model in result]
