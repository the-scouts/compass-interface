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
