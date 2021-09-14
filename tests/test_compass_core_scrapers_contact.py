import datetime

from compass.core._scrapers import contact


class TestContact:
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
