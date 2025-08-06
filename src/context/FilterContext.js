import React, { createContext, useContext, useState } from 'react';

// Create the filter context
const FilterContext = createContext();

// Custom hook to use the filter context
export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

// Filter provider component
export const FilterProvider = ({ children }) => {
  // Global filter state
  const [globalFilters, setGlobalFilters] = useState({
    sort: 'Newest to Oldest',
    price: '',
    genus: [],
    variegation: [],
    country: '',
    listingType: [],
    shippingIndex: '',
    acclimationIndex: '',
  });

  // Keep track of applied filters for API calls
  const [appliedFilters, setAppliedFilters] = useState(null);

  // Function to update global filters
  const updateFilters = (newFilters) => {
    console.log('Updating global filters:', newFilters);
    setGlobalFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };

  // Function to apply filters (called when user submits filter form)
  const applyFilters = (filters) => {
    console.log('Applying filters globally:', filters);
    setGlobalFilters(filters);
    setAppliedFilters(filters);
  };

  // Function to clear all filters
  const clearFilters = () => {
    const defaultFilters = {
      sort: 'Newest to Oldest',
      price: '',
      genus: [],
      variegation: [],
      country: '',
      listingType: [],
      shippingIndex: '',
      acclimationIndex: '',
    };
    setGlobalFilters(defaultFilters);
    setAppliedFilters(null);
  };

  // Function to build filter parameters for API calls
  const buildFilterParams = (baseParams = {}) => {
    const params = { ...baseParams };
    const filters = appliedFilters || globalFilters;

    console.log('Building filter params from global state:', filters);

    // Apply sort
    if (filters.sort) {
      switch (filters.sort) {
        case 'Newest to Oldest':
          params.sortBy = 'createdAt';
          params.sortOrder = 'desc';
          break;
        case 'Price Low to High':
          params.sortBy = 'usdPrice';
          params.sortOrder = 'asc';
          break;
        case 'Price High to Low':
          params.sortBy = 'usdPrice';
          params.sortOrder = 'desc';
          break;
        case 'Most Loved':
          params.sortBy = 'loveCount';
          params.sortOrder = 'desc';
          break;
        default:
          params.sortBy = 'createdAt';
          params.sortOrder = 'desc';
      }
    }

    // Apply genus filter
    if (filters.genus && filters.genus.length > 0) {
      params.genus = filters.genus.join(',');
    }

    // Apply variegation filter
    if (filters.variegation && filters.variegation.length > 0) {
      params.variegation = filters.variegation.join(',');
    }

    // Apply price filter
    if (filters.price) {
      const priceRange = filters.price;
      if (priceRange === '$0 - $20') {
        params.minPrice = 0;
        params.maxPrice = 20;
      } else if (priceRange === '$21 - $50') {
        params.minPrice = 21;
        params.maxPrice = 50;
      } else if (priceRange === '$51 - $100') {
        params.minPrice = 51;
        params.maxPrice = 100;
      } else if (priceRange === '$101 - $200') {
        params.minPrice = 101;
        params.maxPrice = 200;
      } else if (priceRange === '$201 - $500') {
        params.minPrice = 201;
        params.maxPrice = 500;
      } else if (priceRange === '$501 +') {
        params.minPrice = 501;
      }
    }

    // Apply country filter
    if (filters.country) {
      params.country = filters.country;
    }

    // Apply listing type filter
    if (filters.listingType && filters.listingType.length > 0) {
      params.listingType = filters.listingType.join(',');
    }

    // Apply shipping index filter
    if (filters.shippingIndex) {
      params.shippingIndex = filters.shippingIndex;
    }

    // Apply acclimation index filter
    if (filters.acclimationIndex) {
      params.acclimationIndex = filters.acclimationIndex;
    }

    console.log('Final filter params from global state:', params);
    return params;
  };

  // Check if filters are currently applied
  const hasAppliedFilters = () => {
    return appliedFilters !== null;
  };

  const value = {
    globalFilters,
    appliedFilters,
    updateFilters,
    applyFilters,
    clearFilters,
    buildFilterParams,
    hasAppliedFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export default FilterContext;
