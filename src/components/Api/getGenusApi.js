import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';
import { filterGenusOptions } from './getSellGenusApi';

/**
 * Genus options for dropdowns/filters (Seller My Store, admin Discounts).
 *
 * Same defect as getSellGenusApi: this previously called /dropdown-genus, which
 * reads the `dropdown_genus` table. That table is NOT the taxonomy — it holds
 * only the 8 curated categories the buyer Shop panel renders as tiles
 * (see TARGET_GENERA in browse-plants-by-genus) plus a synthetic "OTHERS" bucket.
 * Every consumer therefore saw 8 of the 220 real genera and an "OTHERS" option
 * that is not a genus.
 *
 * Now reads /genus-list (the authoritative `genus` table, all 220) and strips
 * "OTHERS"/duplicates via the shared filter.
 */
export const getGenusApi = async () => {
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
    throw error;
  }
};
