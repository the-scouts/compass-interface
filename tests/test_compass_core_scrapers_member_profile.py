import datetime

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
