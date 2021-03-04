import datetime

from compass.core._scrapers.member import _reduce_date_list


class TestScrapersMemberReduceDateList:
    def test_outwith(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2015, 1, 1), datetime.date(2021, 1, 1)),
        ]

        # When
        result = list(_reduce_date_list(data))

        # Then
        assert result == [(datetime.date(2015, 1, 1), datetime.date(2021, 1, 1))]

    def test_starts_before_overlap(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2015, 1, 1), datetime.date(2018, 1, 1)),
        ]

        # When
        result = list(_reduce_date_list(data))

        # Then
        assert result == [(datetime.date(2015, 1, 1), datetime.date(2020, 2, 7))]

    def test_ends_after_overlap(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2017, 1, 1), datetime.date(2021, 1, 1)),
        ]

        # When
        result = list(_reduce_date_list(data))

        # Then
        assert result == [(datetime.date(2016, 4, 5), datetime.date(2021, 1, 1))]

    def test_within(self):
        # Given
        data = [
            (datetime.date(2016, 4, 5), datetime.date(2020, 2, 7)),
            (datetime.date(2017, 1, 1), datetime.date(2019, 1, 1)),
        ]

        # When
        result = list(_reduce_date_list(data))

        # Then
        assert result == [(datetime.date(2016, 4, 5), datetime.date(2020, 2, 7))]

    def test_adjacent(self):
        # Given
        data = [
            (datetime.date(2017, 1, 1), datetime.date(2017, 6, 30)),
            (datetime.date(2017, 7, 1), datetime.date(2017, 12, 31)),
        ]

        # When
        result = list(_reduce_date_list(data))

        # Then
        assert result == [(datetime.date(2017, 1, 1), datetime.date(2017, 12, 31))]

    def test_adjacent_inverse(self):
        # Given
        data = [
            (datetime.date(2016, 7, 1), datetime.date(2016, 12, 31)),
            (datetime.date(2017, 1, 1), datetime.date(2017, 6, 30)),
        ]

        # When
        result = list(_reduce_date_list(data))

        # Then
        assert result == [(datetime.date(2016, 7, 1), datetime.date(2017, 6, 30))]

    def test_disjoint(self):
        # Given
        data = [
            (datetime.date(2016, 7, 1), datetime.date(2016, 12, 31)),
            (datetime.date(2017, 7, 1), datetime.date(2017, 12, 31)),
        ]

        # When
        result = list(_reduce_date_list(data))

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
        result = list(_reduce_date_list(data))

        # Then
        assert result == [
            (datetime.date(1983, 11, 17), datetime.date(1985, 3, 23)),
            (datetime.date(1993, 2, 18), datetime.date(2007, 11, 1)),
            (datetime.date(2014, 7, 22), datetime.date(2021, 6, 1)),
        ]
