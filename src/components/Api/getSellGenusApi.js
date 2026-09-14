import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

/**
 * Genus options for the seller listing screens (Single Plant, Wholesale, Live,
 * Growers, Group Chat, Batch Upload).
 *
 * This used to call /dropdown-genus, which reads the `dropdown_genus` table.
 * That table is NOT the taxonomy — it holds only the 8 curated categories the
 * buyer Shop panel renders as tiles (ALOCASIA, ANTHURIUM, HOYA, MONSTERA,
 * PHILODENDRON, SCINDAPSUS, SYNGONIUM — see TARGET_GENERA in
 * browse-plants-by-genus) plus a synthetic "OTHERS" bucket that exists purely as
 * a shop grouping. Consequence: every seller dropdown offered 8 of the 220 real
 * genera and listed "OTHERS" as if it were a genus, so most plants could not be
 * listed at all.
 *
 * /genus-list reads the authoritative `genus` table and returns all 220,
 * including species counts. It only requires a valid Firebase token (not admin),
 * so it is safe for sellers.
 *
 * "OTHERS" is filtered out defensively: it must never be selectable as a genus.
 */
export const getSellGenusApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      API_ENDPOINTS.GET_GENUS_LIST,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return {
      ...json,
      data: filterGenusOptions(json?.data),
    };
  } catch (error) {
    console.log('getSellGenusApi error:', error.message);
    throw error;
  }
};

/**
 * Normalise /genus-list rows into a clean, de-duplicated list, dropping the
 * synthetic "OTHERS" shop grouping. Rows may arrive as plain strings or as
 * objects carrying `{ id, name, receivedPlants }` — both are handled so every
 * existing caller keeps working.
 */
export const filterGenusOptions = (data) => {
  if (!Array.isArray(data)) return [];
  const seen = new Set();
  const out = [];
  for (const item of data) {
    const name = String(
      typeof item === 'string' ? item : item?.name ?? '',
    ).trim();
    if (!name) continue;
    if (name.toUpperCase() === 'OTHERS') continue;
    const key = name.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};
