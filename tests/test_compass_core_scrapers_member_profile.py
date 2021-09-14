import datetime

import pytest

import compass.core as ci
from compass.core._scrapers import member_profile


class TestMemberProfile:
    def test_process_address(self):
        # Given
        address = "Registry, Old College, City of Edinburgh, EDINBURGH, Midlothian. EH1 1AA UK"

        # When
        result = member_profile._process_address(address)

        # Then
        assert isinstance(result, dict)
        assert all(key.__class__ is str for key in result.keys())
        assert all(value.__class__ is str for value in result.values())
        assert [*result.keys()] == ["unparsed_address", "country", "postcode", "county", "town", "street"]
        assert result == {
            "unparsed_address": "Registry, Old College, City of Edinburgh, EDINBURGH, Midlothian. EH1 1AA UK",
            "country": "UK",
            "postcode": "EH1 1AA",
            "county": "Midlothian",
            "town": "EDINBURGH",
            "street": "Registry, Old College, City of Edinburgh",
        }

    def test_process_extra(self):
        # Given
        extra = "A - 1"

        # When
        result = member_profile._process_extra(extra)

        # Then
        assert result == ("A", "1")

    def test_process_extra_blank_detail(self):
        # Given
        extra = "D"

        # When
        result = member_profile._process_extra(extra)

        # Then
        assert result == ("D", None)

    def test_process_misc_sections(self):
        # TODO - lxml
        pass

    def test_extract_primary_role(self):
        # Given
        primary_role = None
        role_title = "Section Leader [Primary]"

        # When
        result_title, result_role = member_profile._extract_primary_role(role_title, primary_role)

        # Then
        assert result_role is True
        assert result_title == "Section Leader"

    def test_extract_primary_role_already_found(self):
        # Given
        primary_role = 99999999
        role_title = "some unchanged words"

        # When
        result_title, result_role = member_profile._extract_primary_role(role_title, primary_role)

        # Then
        assert result_role == 99999999
        assert result_title == "some unchanged words"

    def test_extract_review_date(self):
        # Given
        review = "Full Review Due 01 Jan 2000"

        # When
        result_role_status, result_review_date = member_profile._extract_review_date(review)

        # Then
        assert result_role_status == "Full"
        assert result_review_date == datetime.date(2000, 1, 1)

    def test_extract_review_date_ending(self):
        # Given
        review = "Full Ending 01 Jan 2000"

        # When
        result_role_status, result_review_date = member_profile._extract_review_date(review)

        # Then
        assert result_role_status == "Full"
        assert result_review_date == datetime.date(2000, 1, 1)

    @pytest.mark.parametrize("status", ["Cancelled", "Closed", "Full", "Pre provisional", "Provisional"])
    def test_extract_review_date_statuses(self, status):
        # Given
        review = status

        # When
        result_role_status, result_review_date = member_profile._extract_review_date(review)

        # Then
        assert result_role_status == status
        assert result_review_date is None

    def test_extract_review_date_invalid(self):
        # Given
        review = "invalid status"

        # Then
        with pytest.raises(ci.CompassError, match="Invalid value for review status 'invalid status'!"):
            # When
            member_profile._extract_review_date(review)

    def test_membership_duration(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2015, 1, 1), datetime.date(2021, 1, 1)),
            (datetime.date(2017, 1, 1), datetime.date(2021, 6, 1)),
            (datetime.date(2014, 7, 22), datetime.date(2015, 6, 10)),
            (datetime.date(2015, 1, 1), datetime.date(2015, 1, 1)),
            (datetime.date(2004, 5, 13), datetime.date(2007, 11, 1)),
            (datetime.date(1997, 7, 2), datetime.date(2007, 11, 1)),
            (datetime.date(1993, 2, 18), datetime.date(1997, 7, 2)),
            (datetime.date(1983, 11, 17), datetime.date(1985, 3, 23)),
        ]

        # When
        result = member_profile._membership_duration(data)

        # Then
        assert result == 22.916

    def test_membership_duration_empty(self):
        # Given
        data = []

        # When
        result = member_profile._membership_duration(data)

        # Then
        assert result == 0

    def test_process_personal_learning_plan(self):
        # TODO - lxml
        pass

    def test_process_role_data(self):
        # TODO - lxml
        pass

    def test_compile_ongoing_learning(self):
        # TODO - lxml
        pass


class TestScrapersMemberReduceDateList:
    def test_empty(self):
        # Given
        data = []

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == []

    def test_single(self):
        # Given
        data = [(datetime.date(2015, 1, 1), datetime.date(2021, 1, 1))]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == data

    def test_outwith(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2015, 1, 1), datetime.date(2021, 1, 1)),
        ]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == [(datetime.date(2015, 1, 1), datetime.date(2021, 1, 1))]

    def test_starts_before_overlap(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2015, 1, 1), datetime.date(2018, 1, 1)),
        ]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == [(datetime.date(2015, 1, 1), datetime.date(2020, 2, 7))]

    def test_ends_after_overlap(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2017, 1, 1), datetime.date(2021, 1, 1)),
        ]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == [(datetime.date(2016, 4, 5), datetime.date(2021, 1, 1))]

    def test_within(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2017, 1, 1), datetime.date(2019, 1, 1)),
        ]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == [(datetime.date(2016, 4, 5), datetime.date(2020, 2, 7))]

    def test_adjacent(self):
        # Given
        data = [
            (datetime.date(2017, 1, 1), datetime.date(2017, 6, 30)),
            (datetime.date(2017, 7, 1), datetime.date(2017, 12, 31)),
        ]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == [(datetime.date(2017, 1, 1), datetime.date(2017, 12, 31))]

    def test_adjacent_inverse(self):
        # Given
        data = [
            (datetime.date(2016, 7, 1), datetime.date(2016, 12, 31)),
            (datetime.date(2017, 1, 1), datetime.date(2017, 6, 30)),
        ]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == [(datetime.date(2016, 7, 1), datetime.date(2017, 6, 30))]

    def test_disjoint(self):
        # Given
        data = [
            (datetime.date(2016, 7, 1), datetime.date(2016, 12, 31)),
            (datetime.date(2017, 7, 1), datetime.date(2017, 12, 31)),
        ]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == data

    def test_complex(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2015, 1, 1), datetime.date(2021, 1, 1)),
            (datetime.date(2017, 1, 1), datetime.date(2021, 6, 1)),
            (datetime.date(2014, 7, 22), datetime.date(2015, 6, 10)),
            (datetime.date(2015, 1, 1), datetime.date(2015, 1, 1)),
            (datetime.date(2004, 5, 13), datetime.date(2007, 11, 1)),
            (datetime.date(1997, 7, 2), datetime.date(2007, 11, 1)),
            (datetime.date(1993, 2, 18), datetime.date(1997, 7, 2)),
            (datetime.date(1983, 11, 17), datetime.date(1985, 3, 23)),
        ]

        # When
        result = member_profile._reduce_date_list(data)

        # Then
        assert result == [
            (datetime.date(1983, 11, 17), datetime.date(1985, 3, 23)),
            (datetime.date(1993, 2, 18), datetime.date(2007, 11, 1)),
            (datetime.date(2014, 7, 22), datetime.date(2021, 6, 1)),
        ]
