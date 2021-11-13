import datetime

from compass.core._scrapers import contact


class TestContact:
    def test_process_address(self):
        # Given
        addresses = [
            {
                "Line1": "Registry",
                "Line2": "Old College",
                "Line3": "City of Edinburgh",
                "Town": "EDINBURGH",
                "County": "Midlothian",
                "Postcode": "EH1 1AA",
                "Country": "UK",
                "ValidFrom": None,
                "IsMain": True,
                "Historical": False,
                "AddressNumber": 123456,
                "Address": "Registry, Old College, City of Edinburgh, EDINBURGH, Midlothian. EH1 1AA UK",
            }
        ]

        # When
        result = contact._process_address(addresses)

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

    def test_process_address_empty(self):
        # Given
        addresses = []

        # When
        result = contact._process_address(addresses)

        # Then
        assert isinstance(result, dict)
        assert all(key.__class__ is str for key in result.keys())
        assert all(value is None for value in result.values())
        assert [*result.keys()] == ["unparsed_address", "country", "postcode", "county", "town", "street"]
        assert result == {
            "unparsed_address": None,
            "country": None,
            "postcode": None,
            "county": None,
            "town": None,
            "street": None,
        }

    def test_process_phone_numbers(self):
        # Given
        numbers = [
            {"Number": "0", "IsMain": False},
            {"Number": "1", "IsMain": False},
            {"Number": "2", "IsMain": False},
            {"Number": "3", "IsMain": False},
            {"Number": "4", "IsMain": False},
            {"Number": "5", "IsMain": True},
        ]

        # When
        result = contact._process_phone_numbers(numbers)

        # Then
        assert result == "5"

    def test_process_phone_numbers_no_main(self):
        # Given
        numbers = [
            {"Number": "0", "IsMain": False},
            {"Number": "1", "IsMain": False},
            {"Number": "2", "IsMain": False},
            {"Number": "3", "IsMain": False},
            {"Number": "4", "IsMain": False},
            {"Number": "5", "IsMain": False},
        ]

        # When
        result = contact._process_phone_numbers(numbers)

        # Then
        assert result == "0"

    def test_process_phone_numbers_empty(self):
        # Given
        numbers = []

        # When
        result = contact._process_phone_numbers(numbers)

        # Then
        assert result == ""

    def test_process_email(self):
        # Given
        emails = [
            {"EmailAddress": "egg@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "bacon@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "sausage@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "spam@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "spamspam@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "lobsterthermidor@GreenMidget.cafe", "IsMain": True},
        ]

        # When
        result = contact._process_email(emails)

        # Then
        assert result == "lobsterthermidor@GreenMidget.cafe"

    def test_process_email_no_main(self):
        # Given
        emails = [
            {"EmailAddress": "egg@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "bacon@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "sausage@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "spam@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "spamspam@GreenMidget.cafe", "IsMain": False},
            {"EmailAddress": "lobsterthermidor@GreenMidget.cafe", "IsMain": False},
        ]

        # When
        result = contact._process_email(emails)

        # Then
        assert result == "egg@GreenMidget.cafe"

    def test_process_email_empty(self):
        # Given
        emails = []

        # When
        result = contact._process_email(emails)

        # Then
        assert result == ""

    def test_process_misc_sections(self):
        # Given
        sections = [
            "A - 1",
            "B - 2",
            "C - 3",
            "D",
        ]

        # When
        result = contact._process_misc_sections(sections)

        # Then
        assert isinstance(result, dict)
        assert all(key.__class__ is str for key in result.keys())
        assert all(value.__class__ is str for value in result.values())
        assert [*result.keys()] == ["A", "B", "C", "D"]
        assert [*result.values()] == ["1", "2", "3", ""]
        assert result == {"A": "1", "B": "2", "C": "3", "D": ""}

    def test_process_misc_sections_empty(self):
        # Given
        sections = []

        # When
        result = contact._process_misc_sections(sections)

        # Then
        assert isinstance(result, dict)
        assert [*result.keys()] == []
        assert [*result.values()] == []
        assert result == {}

    def test_parse_iso_date(self):
        # Given
        date = "2000-01-01"

        # When
        result = contact._parse_iso_date(date)

        # Then
        assert result == datetime.date(2000, 1, 1)

    def test_parse_iso_date_none(self):
        # Given
        date = None

        # When
        result = contact._parse_iso_date(date)

        # Then
        assert result is None
