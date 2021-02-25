class Settings:
    base_domain = "compass.scouts.org.uk"
    base_url = f"https://{base_domain}"
    date_format = "%d %B %Y"  # dd Month YYYY
    org_number = 10000001
    total_requests = 0
    wcf_json_endpoint = "/JSon.svc"  # Windows communication foundation JSON service endpoint
    web_service_path = base_url + wcf_json_endpoint
