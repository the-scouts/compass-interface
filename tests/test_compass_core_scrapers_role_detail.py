import datetime

from compass.core._scrapers import role_detail


class TestRoleDetail:
    def test_extract_line_manager(self):
        # TODO -- lxml
        pass

    def test_extract_disclosure_date(self):
        # Given
        haystack = "Disclosure Issued : 01 Jan 2000"

        # When
        result = role_detail._extract_disclosure_date(haystack)

        # Then
        assert result == ("Disclosure Issued", datetime.date(2000, 1, 1))

    def test_extract_disclosure_date_invalid_prefix(self):
        # Given
        haystack = "The Killer Joke : 8 July 1944"

        # When
        result = role_detail._extract_disclosure_date(haystack)

        # Then
        assert result == (haystack, None)

    def test_extract_disclosure_date_invalid_suffix(self):
        # Given
        haystack = "Disclosure Issued : "

        # When
        result = role_detail._extract_disclosure_date(haystack)

        # Then
        assert result == ("Disclosure Issued", None)

    def test_extract_disclosure_date_empty(self):
        # Given
        haystack = ""

        # When
        result = role_detail._extract_disclosure_date(haystack)

        # Then
        assert result == (None, None)

    def test_process_hierarchy(self):
        # TODO -- lxml
        pass

    def test_process_getting_started(self):
        # TODO -- lxml
        pass
