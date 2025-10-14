import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get admin listings with filters
 * @param {Object} filters - Filter parameters
 * @param {string} [filters.sort] - Sort option (latest, oldest, priceHigh, priceLow, mostLoved)
 * @param {string} [filters.status] - Listing status filter
 * @param {string} [filters.genus] - Genus filter
 * @param {string} [filters.variegation] - Variegation filter
 * @param {string} [filters.listingType] - Listing type filter
 * @param {string} [filters.garden] - Garden/seller filter
 * @param {string} [filters.country] - Country filter
 * @param {string} [filters.plantFlight] - Plant flight filter
 * @param {string} [filters.shippingIndex] - Shipping index filter
 * @param {string} [filters.acclimationIndex] - Acclimation index filter
 * @param {string} [filters.search] - Search term for plant name/code
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.limit=50] - Number of listings per page
 * @param {number} [filters.priceMax] - Maximum price filter
 * @param {string} [filters.rarity] - Rarity filter
 * @param {boolean} [filters.isWishlist] - Wishlist filter
 * @param {boolean} [filters.isSellersFave] - Seller's favorite filter
 * @returns {Promise<Object>} API response with listings data
 */
export const getAdminListingsApi = async (filters = {}) => {
  try {
    const authToken = await getStoredAuthToken();
    
    if (!authToken) {
      console.error('No auth token found');
      return {
        success: false,
        error: 'Authentication required',
        data: { listings: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 50 } }
      };
    }
    
    // Build query parameters - match backend parameter names
    const queryParams = new URLSearchParams();
    
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.genus) queryParams.append('genus', filters.genus);
    if (filters.variegation) queryParams.append('variegation', filters.variegation);
    if (filters.listingType) queryParams.append('listingType', filters.listingType);
    if (filters.garden) queryParams.append('garden', filters.garden);
    if (filters.country) queryParams.append('country', filters.country);
    if (filters.plantFlight) queryParams.append('plantFlight', filters.plantFlight);
    if (filters.shippingIndex) queryParams.append('shippingIndex', filters.shippingIndex);
    if (filters.acclimationIndex) queryParams.append('acclimationIndex', filters.acclimationIndex);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    
    // Badge filters
    if (filters.priceMax) queryParams.append('priceMax', filters.priceMax.toString());
    if (filters.rarity) queryParams.append('rarity', filters.rarity);
    if (filters.isWishlist !== undefined) queryParams.append('isWishlist', filters.isWishlist.toString());
    if (filters.isSellersFave !== undefined) queryParams.append('isSellersFave', filters.isSellersFave.toString());
    
    const url = `${API_ENDPOINTS.GET_ADMIN_LISTINGS}?${queryParams.toString()}`;
    
    console.log('Fetching admin listings from:', url);
    console.log('With filters:', filters);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(
        errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('API response data:', data);

    // Ensure draft and inactive listings are not returned to the admin UI
    const EXCLUDED_STATUSES = ['draft', 'inactive'];
    const rawListings = data.data?.listings || [];
    const filteredListings = rawListings.filter(item => {
      const st = item?.status ? String(item.status).toLowerCase() : '';
      return !EXCLUDED_STATUSES.includes(st);
    });

    return {
      success: true,
      data: {
        listings: filteredListings,
        // Keep pagination as-is from backend (backend is expected to exclude drafts/inactive),
        // but fall back to a simple pagination object if missing.
        pagination: data.data?.pagination || {
          currentPage: 1,
          totalPages: 0,
          totalItems: filteredListings.length,
          itemsPerPage: filters.limit || 50
        }
      }
    };
  } catch (error) {
    console.error('Get admin listings API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching listings',
      data: {
        listings: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 50
        }
      }
    };
  }
};

/**
 * Get admin listing detail by plant code
 * @param {string} plantCode - Plant code
 * @returns {Promise<Object>} API response with listing detail
 */
export const getAdminListingDetailApi = async (plantCode) => {
  try {
    const authToken = await getStoredAuthToken();
    
    if (!authToken) {
      console.error('No auth token found');
      return {
        success: false,
        error: 'Authentication required'
      };
    }
    
    const url = `${API_ENDPOINTS.GET_ADMIN_LISTING_DETAIL}?plantCode=${encodeURIComponent(plantCode)}`;
    console.log('Fetching listing detail from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(
        errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('API response data:', data);
    
    return {
      success: true,
      data: data.data || data
    };
  } catch (error) {
    console.error('Get admin listing detail API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching listing detail',
    };
  }
};
