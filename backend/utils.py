from datetime import datetime, timezone
import googlemaps
from googlemaps import geocoding
import os
import math
from dotenv import load_dotenv


DEFAULT_LOCATION = "Planet Earth"
PRIORITY_POI_TYPES = [
    "point_of_interest", "establishment", "natural_feature",
    "cafe", "restaurant", "transit_station", "airport", "food", "park"
]

# Initialize Google Maps client
if not os.getenv("GOOGLE_API"):
    load_dotenv()
gmaps_client = googlemaps.Client(key=os.getenv("GOOGLE_API"))



def to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def extract_display_location(address_components):
    def get_component(types_to_check):
        if isinstance(types_to_check, str):
            types_set = {types_to_check}
        else:
            types_set = set(types_to_check)

        for comp in address_components:
            if types_set.intersection(comp["types"]):
                return comp["long_name"]
        return None

    # Try to get the main structured components
    locality = get_component(["locality", "administrative_area_level_2"])
    admin_area_1 = get_component("administrative_area_level_1")
    country = get_component("country")

    # Backup: Try to get a known POI or landmark
    poi = get_component(PRIORITY_POI_TYPES)

    # Build the most appropriate string
    if poi and admin_area_1 and country:
        return f"{poi}, {admin_area_1}, {country}"
    elif locality and admin_area_1 and country:
        return f"{locality}, {admin_area_1}, {country}"
    elif locality and country:
        return f"{locality}, {country}"
    elif admin_area_1 and country:
        return f"{admin_area_1}, {country}"
    elif country:
        return country
    else:
        return DEFAULT_LOCATION


def get_location_name_from_coords(lat: float, lng: float) -> str:
    results = geocoding.reverse_geocode(gmaps_client, (lat, lng))
    if not results:
        return DEFAULT_LOCATION

    # Try to find a result with a place_id and type of POI, establishment, etc.
    best_result = None
    for result in results:
        if "place_id" in result and any(t in result["types"] for t in PRIORITY_POI_TYPES):
            best_result = result
            break
    if not best_result:
        best_result = results[0]

    # Extract structured address components
    address_components = best_result.get("address_components")
    if not address_components:
        return DEFAULT_LOCATION
    return extract_display_location(address_components)


def get_geohash_precision_from_zoom(zoom):
    if zoom <= 5:
        return 1
    if zoom <= 7:
        return 2
    elif zoom <= 10:
        return 3
    elif zoom <= 12:
        return 4
    elif zoom <= 15:
        return 5
    elif zoom <= 18:
        return 6
    else:
        return 7


def haversine(lat1, lon1, lat2, lon2):
    # Haversine formula to compute distance in kilometers between two points
    R = 6371  # Earth radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2*R*math.atan2(math.sqrt(a), math.sqrt(1 - a))


def minmax_scale(x, min_x, max_x):
        if max_x == min_x:
            return 0.0  # or 1.0, but 0 is safer if no variation
        return (x - min_x) / (max_x - min_x)