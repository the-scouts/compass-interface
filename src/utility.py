import urllib3

# Disable requests' warnings about insecure requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def safe_xpath(tree, path: str):
    array = tree.xpath(path)
    return array[0] if array else None


class CompassSettings:
    base_url = "https://compass.scouts.org.uk"
    total_requests = 0