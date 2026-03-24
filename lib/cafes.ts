import type { Café } from "@/types";

// Partner cafés in Amsterdam
export const AMSTERDAM_CAFES: Omit<Café, "id">[] = [
  {
    name: "Luuk's Coffee – Vijzelgracht",
    neighborhood: "Centrum",
    address: "Vijzelgracht 49, 1017 HP Amsterdam",
    coordinates: { lat: 52.3612, lng: 4.8909 },
    vibe: "cozy",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Luuk's+Coffee+Vijzelgracht+Amsterdam",
    partnered: true,
    capacity: 4,
  },
  {
    name: "Luuk's Coffee – Jordaan",
    neighborhood: "Jordaan",
    address: "Westerstraat 3, 1015 LT Amsterdam",
    coordinates: { lat: 52.3794, lng: 4.8832 },
    vibe: "cozy",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Luuk's+Coffee+Westerstraat+Amsterdam",
    partnered: true,
    capacity: 3,
  },
  {
    name: "Coffee Concepts – Oud-Zuid",
    neighborhood: "Oud-Zuid",
    address: "Jacob Obrechtstraat 5, Amsterdam",
    coordinates: { lat: 52.3516, lng: 4.8734 },
    vibe: "specialty",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Coffee+Concepts+Jacob+Obrechtstraat+Amsterdam",
    partnered: true,
    capacity: 4,
  },
  {
    name: "Coffee Concepts – Kinkerstraat",
    neighborhood: "West",
    address: "Kinkerstraat 380, Amsterdam",
    coordinates: { lat: 52.3655, lng: 4.8610 },
    vibe: "specialty",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Coffee+Concepts+Kinkerstraat+Amsterdam",
    partnered: true,
    capacity: 4,
  },
  {
    name: "BLCK. Coffee – Zuidas",
    neighborhood: "Zuidas",
    address: "Claude Debussylaan 269, 1082 MA Amsterdam",
    coordinates: { lat: 52.3387, lng: 4.8730 },
    vibe: "modern",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=BLCK+Coffee+Zuidas+Amsterdam",
    partnered: true,
    capacity: 5,
  },
  {
    name: "LOT61 – Kinkerstraat",
    neighborhood: "West",
    address: "Kinkerstraat 112, 1053 ED Amsterdam",
    coordinates: { lat: 52.3638, lng: 4.8668 },
    vibe: "minimalist",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=LOT61+Kinkerstraat+Amsterdam",
    partnered: true,
    capacity: 3,
  },
  {
    name: "LOT61 – Centraal",
    neighborhood: "Centrum",
    address: "Oosterdoksstraat 4, 1011 DK Amsterdam",
    coordinates: { lat: 52.3790, lng: 4.9003 },
    vibe: "modern",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=LOT61+Oosterdoksstraat+Amsterdam",
    partnered: true,
    capacity: 4,
  },
  {
    name: "Back to Black – Weteringstraat",
    neighborhood: "Centrum",
    address: "Weteringstraat 48, 1017 SP Amsterdam",
    coordinates: { lat: 52.3597, lng: 4.8891 },
    vibe: "intimate",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Back+to+Black+Weteringstraat+Amsterdam",
    partnered: true,
    capacity: 2,
  },
  {
    name: "Back to Black – Van Hallstraat",
    neighborhood: "Westerpark",
    address: "Van Hallstraat 268, 1051 HM Amsterdam",
    coordinates: { lat: 52.3819, lng: 4.8701 },
    vibe: "intimate",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Back+to+Black+Van+Hallstraat+Amsterdam",
    partnered: true,
    capacity: 2,
  },
  {
    name: "Locals Coffee – De Pijp",
    neighborhood: "De Pijp",
    address: "Eerste Jacob van Campenstraat 47H, 1072 BD Amsterdam",
    coordinates: { lat: 52.3536, lng: 4.8941 },
    vibe: "neighborhood",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Locals+Coffee+De+Pijp+Amsterdam",
    partnered: true,
    capacity: 3,
  },
  {
    name: "Five Ways – Oost",
    neighborhood: "Oost",
    address: "Boerhaaveplein 3, 1091 DH Amsterdam",
    coordinates: { lat: 52.3599, lng: 4.9194 },
    vibe: "specialty",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Five+Ways+Coffee+Roasters+Oost+Amsterdam",
    partnered: true,
    capacity: 3,
  },
  {
    name: "Five Ways – West",
    neighborhood: "West",
    address: "Kinkerstraat 186, 1053 CG Amsterdam",
    coordinates: { lat: 52.3647, lng: 4.8648 },
    vibe: "specialty",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Five+Ways+Coffee+Roasters+West+Amsterdam",
    partnered: true,
    capacity: 3,
  },
  {
    name: "Monks Coffee Roasters",
    neighborhood: "West",
    address: "Bilderdijkstraat 46, 1052 NB Amsterdam",
    coordinates: { lat: 52.3688, lng: 4.8683 },
    vibe: "specialty",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Monks+Coffee+Roasters+Amsterdam",
    partnered: true,
    capacity: 3,
  },
  {
    name: "Scandinavian Embassy",
    neighborhood: "De Pijp",
    address: "Sarphatipark 34, 1072 PB Amsterdam",
    coordinates: { lat: 52.3534, lng: 4.8935 },
    vibe: "nordic",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Scandinavian+Embassy+Amsterdam",
    partnered: true,
    capacity: 4,
  },
  {
    name: "Uncommon Coffee",
    neighborhood: "Oud-West",
    address: "Eerste Constantijn Huygensstraat 63H, 1054 BT Amsterdam",
    coordinates: { lat: 52.3604, lng: 4.8735 },
    vibe: "specialty",
    photo: "",
    googleMapsUrl: "https://maps.google.com/?q=Uncommon+Coffee+Amsterdam",
    partnered: true,
    capacity: 3,
  },
];

/**
 * Find the closest café to the midpoint of two neighborhoods.
 */
export function findCaféForDate(
  neighborhood1: string,
  neighborhood2: string
): Omit<Café, "id"> {
  const n1 = AMSTERDAM_CAFES.find((c) => c.neighborhood === neighborhood1);
  const n2 = AMSTERDAM_CAFES.find((c) => c.neighborhood === neighborhood2);

  if (n1 && n1.neighborhood === n2?.neighborhood) {
    return n1;
  }

  // Calculate midpoint
  const lat1 = n1?.coordinates.lat ?? 52.3676;
  const lng1 = n1?.coordinates.lng ?? 4.9041;
  const lat2 = n2?.coordinates.lat ?? 52.3676;
  const lng2 = n2?.coordinates.lng ?? 4.9041;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  // Find closest café to midpoint
  let closest = AMSTERDAM_CAFES[0];
  let minDist = Infinity;

  for (const café of AMSTERDAM_CAFES) {
    const dist = Math.sqrt(
      Math.pow(café.coordinates.lat - midLat, 2) +
      Math.pow(café.coordinates.lng - midLng, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closest = café;
    }
  }

  return closest;
}
