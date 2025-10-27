import {API_ENDPOINTS} from '../../config/apiConfig';

// Search for buyers by name, email, or username
export const searchBuyersApi = async (searchParams) => {
  try {
    const {
      query,
      limit = 10,
      offset = 0
    } = searchParams;

    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const params = new URLSearchParams({
      query: query.trim(),
      userType: 'buyer',
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await fetch(`${API_ENDPOINTS.SEARCH_USER}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Search failed');
    }

    // Transform the API response to match the expected format
    const buyers = data.results.map(buyer => ({
      id: buyer.id,
      firstName: buyer.firstName || '',
      lastName: buyer.lastName || '',
      username: buyer.username || '',
      email: buyer.email || '',
      profileImage: buyer.profileImage || null,
      createdAt: buyer.createdAt
    }));

    return {
      success: true,
      data: {
        buyers: buyers,
        totalCount: data.totalCount || buyers.length
      }
    };

  } catch (error) {
    console.error('searchBuyersApi error:', error.message);
    throw error;
  }
};
