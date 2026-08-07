/**
 * Browser GPS → city name via OpenStreetMap Nominatim reverse geocode.
 */

function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 10 * 60 * 1000,
      ...options,
    });
  });
}

/**
 * @returns {Promise<{ city: string, province: string, lat: number, lon: number } | null>}
 */
export async function detectCityFromGps() {
  const position = await getCurrentPosition();
  const { latitude: lat, longitude: lon } = position.coords;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Reverse geocode failed (${res.status})`);
  }

  const data = await res.json();
  const addr = data?.address || {};
  const city =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.city_district ||
    addr.village ||
    addr.county ||
    "";
  const province = addr.state || addr.region || "";

  if (!city) return null;

  return {
    city: String(city).trim(),
    province: String(province).trim(),
    lat,
    lon,
  };
}
