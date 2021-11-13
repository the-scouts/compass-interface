import pytest

from compass.core.schemas import member

base_data = {
    "membership_number": 0,
    "name": "...",
    "known_as": "...",
}


class TestSchemaMember:
    def test_member_details_phone_number_valid(self):
        # Given
        number_landline = "01212345679"  # Fictitious number
        number_mobile = "07707123456"  # Fictitious number
        number_international = "+1 2015550123"  # Fictitious international number
        # https://www.ofcom.org.uk/phones-telecoms-and-internet/information-for-industry/numbering/numbers-for-drama

        #  When
        result_landline = member.MemberDetails(main_phone=number_landline, **base_data)
        result_mobile = member.MemberDetails(main_phone=number_mobile, **base_data)
        result_international = member.MemberDetails(main_phone=number_international, **base_data)

        # Them
        assert result_landline.main_phone == "0121 234 5679"
        assert result_mobile.main_phone == "07707 123456"
        assert result_international.main_phone == "+1 201-555-0123"

    def test_member_details_phone_number_passing(self):
        # Given
        number_none = None  # Literal `None`
        number_zero = "0"  # Literal string `0`
        number_len_1 = "7"  # Strings of length one
        number_len_0 = ""  # Empty strings

        #  When
        result_none = member.MemberDetails(main_phone=number_none, **base_data)
        result_zero = member.MemberDetails(main_phone=number_zero, **base_data)
        result_len_1 = member.MemberDetails(main_phone=number_len_1, **base_data)
        result_len_0 = member.MemberDetails(main_phone=number_len_0, **base_data)

        # Them
        assert None is result_none.main_phone
        assert None is result_zero.main_phone
        assert None is result_len_1.main_phone
        assert None is result_len_0.main_phone

    def test_member_details_phone_number_warning(self):
        # Given
        number_invalid_1 = "abc"  # Fictitious invalid number
        number_invalid_2 = "07700 90042"  # Fictitious invalid number
        # https://www.ofcom.org.uk/phones-telecoms-and-internet/information-for-industry/numbering/numbers-for-drama

        # Them
        with pytest.warns(RuntimeWarning, match=f"Member No 0: phone number {number_invalid_1} is not valid!"):
            #  When
            member.MemberDetails(main_phone=number_invalid_1, **base_data)

        # Them
        with pytest.warns(RuntimeWarning, match=f"Member No 0: phone number {number_invalid_2} is not valid!"):
            #  When
            member.MemberDetails(main_phone=number_invalid_2, **base_data)
