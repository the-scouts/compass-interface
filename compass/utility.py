import ast
import ctypes
import functools
import certifi
import requests

from pathlib import Path


def setup_tls_certs() -> None:
    """
    Compass currently (as of 14/11/20) doesn't pass the Intermediate certificate it uses.
    This is at time of writing the 'Thawte RSA CA 2018', which is in turned signed by DigiCert Global Root CA.

    This function includes the Thawte CA cert in the Certifi chain to allow certificate verification to pass.

    Yes, it's horrid. TSA plz fix.
    """

    thawte_CA_cert_url = "https://thawte.tbs-certificats.com/Thawte_RSA_CA_2018.crt"

    certifi_path = Path(certifi.where())
    certifi_contents = certifi_path.read_text("UTF-8")

    # Check for contents of Thawte CA, if not add
    if "Thawte RSA CA 2018" not in certifi_contents:

        print("Intermediate Certificate for Compass not found - Installing")

        # Fetch Thawte CA from known URL, rather than including PEM
        ca_request = requests.get(thawte_CA_cert_url, allow_redirects=False)

        # Write to certifi PEM
        try:
            with certifi_path.open("a", encoding="utf-8") as f:
                f.write('\n# Label: "Thawte RSA CA 2018"\n')
                f.write(ca_request.text)
        except IOError as e:
            print(f"Unable to write to certifi PEM: {e.errno} - {e.strerror}")


def hash_code(text: str) -> int:
    """Implements Java's hashCode in python

    Ref: https://stackoverflow.com/a/8831937
    """
    return functools.reduce(lambda code, char: ctypes.c_int32(31 * code + ord(char)).value, list(text), 0)


def compass_restify(data: dict) -> list:
    """Format a dictionary of key-value pairs into the correct format for Compass.

    It seems that JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair.
    """
    return [{"Key": f"{k}", "Value": f"{v}"} for k, v in data.items()]


def cast(value):
    """Casts values to native python types.

    lxml ETree return types don't do this automatically, and by using
    ast.literal_eval we can directly map string representations of
    lists etc into native types.
    """
    try:
        value = int(value)
    except (ValueError, TypeError):
        try:
            value = ast.literal_eval(str(value)) if value else value
        except (ValueError, TypeError, SyntaxError):
            pass
    return value
