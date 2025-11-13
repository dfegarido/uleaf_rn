import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config/apiConfig';
import { listAdminsApi } from '../Api/listAdminsApi';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

// Pre-load and cache the avatar image to prevent RCTImageView errors
const AvatarImage = require('../../assets/images/AvatarBig.png');

/**
 * ============================================
 * MESSAGING RULES - STRICTLY ENFORCED:
 * ============================================
 * 
 * SELLER ACCOUNT USERS CAN MESSAGE:
 * - Admin users (both admin and sub_admin roles)
 * - Other Seller (Supplier) users
 * - CANNOT message Buyer users
 * 
 * BUYER ACCOUNT USERS CAN MESSAGE:
 * - Admin users (both admin and sub_admin roles)
 * - Other Buyer users
 * - CANNOT message Seller (Supplier) users
r * 
 * ADMIN ACCOUNT USERS CAN MESSAGE:
 * - All Buyer users
 * - All Seller (Supplier) users
 * - All Admin and Sub-admin users
 * 
 * ============================================
 */
const NewMessageModal = ({ visible, onClose, onSelect, userInfo }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const scrollViewRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Check if current user is a seller (supplier) - check multiple possible structures
  // Suppliers have specific fields: gardenOrCompanyName, liveFlag, currency, etc.
  const isSeller = 
    userInfo?.user?.userType === 'supplier' || 
    userInfo?.data?.userType === 'supplier' ||
    userInfo?.userType === 'supplier' ||
    // Check for supplier-specific fields in user object
    userInfo?.user?.gardenOrCompanyName !== undefined ||
    userInfo?.user?.liveFlag !== undefined ||
    userInfo?.user?.currency !== undefined ||
    // Check for supplier-specific fields in data object
    userInfo?.data?.gardenOrCompanyName !== undefined ||
    userInfo?.data?.liveFlag !== undefined ||
    userInfo?.data?.currency !== undefined ||
    // Check for supplier-specific fields at root level (from getSupplierInfo API)
    userInfo?.gardenOrCompanyName !== undefined ||
    userInfo?.liveFlag !== undefined ||
    userInfo?.currency !== undefined ||
    // Check status field (suppliers have status like 'active', 'De-activated')
    (userInfo?.user?.status && typeof userInfo.user.status === 'string' && 
     ['active', 'Active', 'De-activated', 'De-activated'].includes(userInfo.user.status)) ||
    (userInfo?.data?.status && typeof userInfo.data.status === 'string' && 
     ['active', 'Active', 'De-activated', 'De-activated'].includes(userInfo.data.status)) ||
    (userInfo?.status && typeof userInfo.status === 'string' && 
     ['active', 'Active', 'De-activated', 'De-activated'].includes(userInfo.status));
  
  // Check if current user is a buyer - check multiple possible structures
  const isBuyer = 
    userInfo?.user?.userType === 'buyer' || 
    userInfo?.data?.userType === 'buyer' ||
    userInfo?.userType === 'buyer' ||
    // Buyers don't have supplier-specific fields, so if not seller and has userType, likely buyer
    (!isSeller && (userInfo?.user?.userType || userInfo?.data?.userType || userInfo?.userType));
  
  // Check if current user is an admin (admin or sub_admin)
  const isAdmin = 
    userInfo?.data?.role === 'admin' || 
    userInfo?.data?.role === 'sub_admin' || 
    userInfo?.role === 'admin' || 
    userInfo?.role === 'sub_admin' ||
    userInfo?.user?.role === 'admin' ||
    userInfo?.user?.role === 'sub_admin';
  
  // Debug logging for user type detection
  useEffect(() => {
    if (visible) {
      console.log('=== NewMessageModal Debug ===');
      console.log('userInfo is null/undefined:', !userInfo);
      if (userInfo) {
        console.log('userInfo?.user?.userType:', userInfo?.user?.userType);
        console.log('userInfo?.data?.userType:', userInfo?.data?.userType);
        console.log('userInfo?.userType:', userInfo?.userType);
        console.log('userInfo?.gardenOrCompanyName:', userInfo?.gardenOrCompanyName);
        console.log('userInfo?.user?.gardenOrCompanyName:', userInfo?.user?.gardenOrCompanyName);
        console.log('userInfo?.data?.gardenOrCompanyName:', userInfo?.data?.gardenOrCompanyName);
        console.log('userInfo?.liveFlag:', userInfo?.liveFlag);
        console.log('userInfo?.user?.liveFlag:', userInfo?.user?.liveFlag);
        console.log('userInfo?.data?.liveFlag:', userInfo?.data?.liveFlag);
        console.log('userInfo?.status:', userInfo?.status);
        console.log('userInfo?.user?.status:', userInfo?.user?.status);
        console.log('userInfo?.data?.status:', userInfo?.data?.status);
        // Log full userInfo structure for debugging
        console.log('Full userInfo keys:', Object.keys(userInfo));
        if (userInfo.user) console.log('userInfo.user keys:', Object.keys(userInfo.user));
        if (userInfo.data) console.log('userInfo.data keys:', Object.keys(userInfo.data));
      }
      console.log('isSeller:', isSeller);
      console.log('isBuyer:', isBuyer);
      console.log('===========================');
    }
  }, [visible, userInfo, isSeller, isBuyer]);
  
  // Client-side filter function
  // IMPORTANT: This only filters by search term - security rules are enforced in fetchUsers
  const applyClientSideFilter = useCallback((usersToFilter, query) => {
    if (!query || !query.trim()) {
      setFilteredUsers(usersToFilter);
      return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    // First, apply security rules (users should already be filtered, but double-check)
    // Determine context from user types in the list
    const hasSuppliers = usersToFilter.some(u => u.userType === 'supplier');
    const hasBuyers = usersToFilter.some(u => u.userType === 'buyer');
    
    // If we have suppliers, we're in seller context - block buyers
    // If we have only buyers, we're in buyer context - block suppliers
    let securityFiltered = usersToFilter;
    
    if (hasSuppliers) {
      // Seller context: Remove any buyers
      const buyersInList = securityFiltered.filter(u => u.userType === 'buyer');
      if (buyersInList.length > 0) {
        console.log(`❌ CLIENT-SIDE SECURITY: Found ${buyersInList.length} buyer(s) in seller search results! Removing.`);
        securityFiltered = securityFiltered.filter(u => u.userType !== 'buyer');
      }
    } else if (hasBuyers && !hasSuppliers) {
      // Buyer context: Remove any suppliers
      const suppliersInList = securityFiltered.filter(u => u.userType === 'supplier');
      if (suppliersInList.length > 0) {
        console.log(`❌ CLIENT-SIDE SECURITY: Found ${suppliersInList.length} supplier(s) in buyer search results! Removing.`);
        securityFiltered = securityFiltered.filter(u => u.userType !== 'supplier');
      }
    }
    
    // Then apply search term filter
    const filtered = securityFiltered.filter(user => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm);
    });
    
    setFilteredUsers(filtered);
    console.log(`Client-side filter: ${filtered.length} users match "${query}" from ${securityFiltered.length} security-filtered (from ${usersToFilter.length} total)`);
  }, []);
  
  // Fetch users when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Reset search text when modal opens
      setSearchText('');
      // Always fetch users when modal opens to ensure fresh data
      fetchUsers('');
    }
  }, [visible]);
  
  // Re-apply filter when users change
  useEffect(() => {
    if (users.length > 0) {
      applyClientSideFilter(users, searchText);
    }
  }, [users, searchText, applyClientSideFilter]);
  
  // Fetch from API when search text changes (with debounce)
  useEffect(() => {
    // Don't fetch if searchText is empty and we already have users (just use client-side filter)
    if (searchText.trim().length === 0) {
      return;
    }
    
    // Fetch from API with search query when searchText changes (with debounce)
    const debounceTimeout = setTimeout(() => {
      fetchUsers(searchText);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(debounceTimeout);
  }, [searchText]);
  
  const fetchUsers = async (query = '') => {
    try {
      setLoading(true);
      
      // Log user type detection status
      console.log('=== fetchUsers called ===');
      console.log('isSeller:', isSeller);
      console.log('isBuyer:', isBuyer);
      console.log('isAdmin:', isAdmin);
      console.log('query:', query);
      console.log('userInfo exists:', !!userInfo);
      // Build URL with query parameter using apiConfig
      // Increase limit to show more users (both online and offline)
      const limit = query.trim().length >= 2 ? 50 : 50; // Show up to 50 users regardless of search
      
      let allResults = [];
      
      // If user type detection failed, try fallback before main logic
      // Try to infer from userInfo structure
      // Skip fallback if admin is detected (admins can search all types)
      if (!isSeller && !isBuyer && !isAdmin) {
        console.log('⚠️ WARNING: Neither seller nor buyer detected!');
        console.log('userInfo structure:', JSON.stringify(userInfo, null, 2));
        
        // Check if userInfo has supplier-like fields
        const hasSupplierFields = 
          userInfo?.gardenOrCompanyName !== undefined ||
          userInfo?.user?.gardenOrCompanyName !== undefined ||
          userInfo?.data?.gardenOrCompanyName !== undefined ||
          userInfo?.liveFlag !== undefined ||
          userInfo?.user?.liveFlag !== undefined ||
          userInfo?.data?.liveFlag !== undefined;
        
        const searchQuery = query && query.trim().length >= 2 ? query.trim() : '';
        const encodedQuery = encodeURIComponent(searchQuery);
        
        if (hasSupplierFields) {
          // If we have supplier fields, assume seller context
          console.log('⚠️ Attempting to fetch suppliers as fallback (supplier fields detected)');
          const supplierUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=supplier&limit=${limit}&offset=0`;
          
          try {
            const authToken = await getStoredAuthToken();
            const supplierResponse = await fetch(supplierUrl, {
              method: 'GET',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (supplierResponse.ok) {
              const supplierData = await supplierResponse.json();
              if (supplierData && supplierData.success && supplierData.results) {
                const suppliersWithType = supplierData.results
                  .filter(result => {
                    const resultUserType = result.userType || 'supplier';
                    if (resultUserType === 'buyer') {
                      console.log('⚠️ SECURITY: API returned buyer user in supplier search results, filtering out:', result.id, result.email);
                      return false;
                    }
                    return true;
                  })
                  .map(supplier => ({
                    ...supplier,
                    userType: supplier.userType || 'supplier'
                  }));
                allResults.push(...suppliersWithType);
                console.log(`✅ Fallback: Added ${suppliersWithType.length} suppliers to results`);
              }
            }
          } catch (fallbackError) {
            console.log('Fallback supplier fetch failed:', fallbackError);
          }
        } else {
          // No supplier fields detected - but DON'T assume buyer context automatically
          // This could be a seller account where userInfo is incomplete
          // Only fetch buyers if we're absolutely sure we're in buyer context
          // For now, skip fallback to prevent security breach
          console.log('⚠️ No supplier fields detected, but not assuming buyer context to prevent security issues.');
          console.log('⚠️ Will rely on final security filter to determine correct user types.');
          // Don't fetch buyers here - let the final security filter handle it
        }
      }
      
      // IMPORTANT: Check isAdmin FIRST before isSeller/isBuyer
      // Admins might have fields that make them appear as sellers or buyers,
      // but they should be treated as admins with full access
      if (isAdmin) {
        // ============================================
        // RULE: ADMIN USERS CAN MESSAGE ALL USER TYPES
        // Admins can message:
        // 1. All buyer users
        // 2. All supplier (seller) users
        // 3. All admin and sub_admin users
        // ============================================
        console.log('✅ Admin detected: Fetching ALL user types (buyers, suppliers, and admins)');
        const searchQuery = query && query.trim().length >= 2 ? query.trim() : '';
        const encodedQuery = encodeURIComponent(searchQuery);
        const authToken = await getStoredAuthToken();
        
        // Fetch buyers
        try {
          const buyerUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=buyer&limit=${limit}&offset=0`;
          const buyerResponse = await fetch(buyerUrl, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (buyerResponse.ok) {
            const buyerData = await buyerResponse.json();
            if (buyerData && buyerData.success && buyerData.results) {
              const buyersWithType = buyerData.results.map(buyer => ({
                ...buyer,
                userType: buyer.userType || 'buyer'
              }));
              allResults.push(...buyersWithType);
              console.log(`✅ Added ${buyersWithType.length} buyers to admin results`);
            }
          }
        } catch (buyerError) {
          console.log('Error fetching buyers for admin:', buyerError);
        }
        
        // Fetch suppliers
        try {
          const supplierUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=supplier&limit=${limit}&offset=0`;
          const supplierResponse = await fetch(supplierUrl, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (supplierResponse.ok) {
            const supplierData = await supplierResponse.json();
            if (supplierData && supplierData.success && supplierData.results) {
              const suppliersWithType = supplierData.results.map(supplier => ({
                ...supplier,
                userType: supplier.userType || 'supplier'
              }));
              allResults.push(...suppliersWithType);
              console.log(`✅ Added ${suppliersWithType.length} suppliers to admin results`);
            }
          }
        } catch (supplierError) {
          console.log('Error fetching suppliers for admin:', supplierError);
        }
      } else if (isSeller) {
        // ============================================
        // RULE: SELLER ACCOUNT USERS CAN MESSAGE FOR ADMIN AND SELLER OTHER USERS
        // Sellers can ONLY message:
        // 1. Admin users
        // 2. Other seller users (suppliers)
        // Sellers CANNOT message buyer users
        // ============================================
        console.log('✅ Seller detected: Fetching suppliers and admins ONLY (buyers excluded)');
        // For empty queries, pass empty string (API will list recent users)
        // For queries with 2+ chars, pass the query
        const searchQuery = query && query.trim().length >= 2 ? query.trim() : '';
        const encodedQuery = encodeURIComponent(searchQuery);
        const supplierUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=supplier&limit=${limit}&offset=0`;
        
        console.log('Supplier search URL:', supplierUrl);
        console.log('Search query:', searchQuery, '(original:', query, ')');
        
        // Fetch suppliers (sellers) using SEARCH_USER API
        const authToken = await getStoredAuthToken();
        const supplierResponse = await fetch(supplierUrl, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        console.log('Supplier API response status:', supplierResponse.status, supplierResponse.statusText);
        
        // Process supplier results
        if (supplierResponse.ok) {
          const supplierData = await supplierResponse.json();
          console.log('Supplier search response:', supplierData);
          console.log('Supplier search success:', supplierData?.success);
          console.log('Supplier results count:', supplierData?.results?.length || 0);
          if (supplierData && supplierData.success && supplierData.results) {
            console.log(`Found ${supplierData.results.length} results from supplier search`);
            // Map supplier results - use userType from API if available, otherwise set to 'supplier'
            // IMPORTANT: Filter out any buyers that might have been returned by the API
            const suppliersWithType = supplierData.results
              .filter(result => {
                // Only include if userType is 'supplier' or undefined (assume supplier if not specified)
                const resultUserType = result.userType || 'supplier';
                if (resultUserType === 'buyer') {
                  console.log('⚠️ SECURITY: API returned buyer user in supplier search results, filtering out:', result.id, result.email);
                  return false;
                }
                return true;
              })
              .map(supplier => ({
                ...supplier,
                userType: supplier.userType || 'supplier' // Use API userType if available, otherwise default to supplier
              }));
            allResults.push(...suppliersWithType);
            console.log(`✅ Added ${suppliersWithType.length} suppliers to results (filtered out ${supplierData.results.length - suppliersWithType.length} buyers)`);
            if (suppliersWithType.length === 0 && supplierData.results.length > 0) {
              console.log('⚠️ WARNING: All supplier results were filtered out!');
            }
            if (suppliersWithType.length === 0 && supplierData.results.length === 0) {
              console.log('⚠️ WARNING: No supplier users found in database. This might be expected if you are the only seller.');
            }
          } else {
            console.log('❌ Supplier search returned no results or invalid format:', supplierData);
            console.log('Response structure:', {
              success: supplierData?.success,
              hasResults: !!supplierData?.results,
              resultsLength: supplierData?.results?.length,
              message: supplierData?.message,
              error: supplierData?.error
            });
          }
        } else {
          const errorText = await supplierResponse.text();
          console.log('❌ Supplier search failed:', supplierResponse.status, errorText);
          console.log('Supplier search URL was:', supplierUrl);
          // Don't throw - continue to fetch admins even if supplier search fails
        }
      } else if (isBuyer) {
        // ============================================
        // RULE: FOR BUYER ACCOUNT USERS CAN MESSAGE OTHER BUYER USERS AND ADMIN ONLY
        // Buyers can ONLY message:
        // 1. Admin users (both admin and sub_admin roles)
        // 2. Other buyer users
        // Buyers CANNOT message seller users (suppliers)
        // ============================================
        console.log('✅ Buyer detected: Fetching buyers and admins ONLY (suppliers excluded)');
        // For empty queries, pass empty string (API will list recent users)
        // For queries with 2+ chars, pass the query
        const searchQuery = query && query.trim().length >= 2 ? query.trim() : '';
        const encodedQuery = encodeURIComponent(searchQuery);
        const buyerUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=buyer&limit=${limit}&offset=0`;
        
        console.log('Buyer search URL:', buyerUrl);
        console.log('Search query:', searchQuery, '(original:', query, ')');
        
        // Fetch buyers using SEARCH_USER API
        const authToken = await getStoredAuthToken();
        const buyerResponse = await fetch(buyerUrl, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        console.log('Buyer API response status:', buyerResponse.status, buyerResponse.statusText);
        
        // Process buyer results
        if (buyerResponse.ok) {
          const buyerData = await buyerResponse.json();
          console.log('Buyer search response:', buyerData);
          console.log('Buyer search success:', buyerData?.success);
          console.log('Buyer results count:', buyerData?.results?.length || 0);
          if (buyerData && buyerData.success && buyerData.results) {
            console.log(`Found ${buyerData.results.length} results from buyer search`);
            // Map buyer results - use userType from API if available, otherwise set to 'buyer'
            // IMPORTANT: Filter out any suppliers that might have been returned by the API
            const buyersWithType = buyerData.results
              .filter(result => {
                // Only include if userType is 'buyer' or undefined (assume buyer if not specified)
                const resultUserType = result.userType || 'buyer';
                if (resultUserType === 'supplier') {
                  console.log('⚠️ SECURITY: API returned supplier user in buyer search results, filtering out:', result.id, result.email);
                  return false;
                }
                return true;
              })
              .map(buyer => ({
                ...buyer,
                userType: buyer.userType || 'buyer' // Use API userType if available, otherwise default to buyer
              }));
            allResults.push(...buyersWithType);
            console.log(`✅ Added ${buyersWithType.length} buyers to results (filtered out ${buyerData.results.length - buyersWithType.length} suppliers)`);
            if (buyersWithType.length === 0 && buyerData.results.length > 0) {
              console.log('⚠️ WARNING: All buyer results were filtered out!');
            }
            if (buyersWithType.length === 0 && buyerData.results.length === 0) {
              console.log('⚠️ WARNING: No buyer users found in database. This might be expected if you are the only buyer.');
            }
          } else {
            console.log('❌ Buyer search returned no results or invalid format:', buyerData);
            console.log('Response structure:', {
              success: buyerData?.success,
              hasResults: !!buyerData?.results,
              resultsLength: buyerData?.results?.length,
              message: buyerData?.message,
              error: buyerData?.error
            });
          }
        } else {
          const errorText = await buyerResponse.text();
          console.log('❌ Buyer search failed:', buyerResponse.status, errorText);
          console.log('Buyer search URL was:', buyerUrl);
          // Don't throw - continue to fetch admins even if buyer search fails
        }
      } else {
        // Fallback: if user type is not detected, try to infer from context
        // Check if userInfo has ANY supplier-like fields (even if detection failed)
        const hasSupplierFields = 
          userInfo?.gardenOrCompanyName !== undefined ||
          userInfo?.user?.gardenOrCompanyName !== undefined ||
          userInfo?.data?.gardenOrCompanyName !== undefined ||
          userInfo?.liveFlag !== undefined ||
          userInfo?.user?.liveFlag !== undefined ||
          userInfo?.data?.liveFlag !== undefined;
        
        if (hasSupplierFields) {
          // If we have supplier fields but detection failed, still try to fetch suppliers
          // This is a safety net for seller accounts
          console.log('⚠️ Seller detection failed but supplier fields detected. Attempting to fetch suppliers as fallback.');
          const searchQuery = query && query.trim().length >= 2 ? query.trim() : '';
          const encodedQuery = encodeURIComponent(searchQuery);
          const supplierUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=supplier&limit=${limit}&offset=0`;
          
          console.log('Fallback supplier search URL:', supplierUrl);
          
          try {
            const authToken = await getStoredAuthToken();
            const supplierResponse = await fetch(supplierUrl, {
              method: 'GET',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (supplierResponse.ok) {
              const supplierData = await supplierResponse.json();
              if (supplierData && supplierData.success && supplierData.results) {
                const suppliersWithType = supplierData.results
                  .filter(result => {
                    const resultUserType = result.userType || 'supplier';
                    if (resultUserType === 'buyer') {
                      console.log('⚠️ SECURITY: API returned buyer user in supplier search results, filtering out:', result.id, result.email);
                      return false;
                    }
                    return true;
                  })
                  .map(supplier => ({
                    ...supplier,
                    userType: supplier.userType || 'supplier'
                  }));
                allResults.push(...suppliersWithType);
                console.log(`Fallback: Added ${suppliersWithType.length} suppliers to results`);
              }
            }
          } catch (fallbackError) {
            console.log('Fallback supplier fetch failed:', fallbackError);
          }
        } else {
          // No supplier fields detected - DO NOT assume buyer context
          // This could be a seller account with incomplete userInfo
          // CRITICAL: Do not fetch buyers here to prevent security breach
          console.log('⚠️ No supplier fields detected. NOT fetching buyers to prevent security issues.');
          console.log('⚠️ Will rely on final security filter to enforce rules.');
        }
      }
      
      // Fetch admins using LIST_ADMINS API
      // Always fetch ALL active admins first, then apply client-side search filter
      // This ensures search works reliably even if backend search has issues
      try {
        const adminFilters = {
          status: 'active', // Only get active admins
          limit: 50 // Max limit allowed by API
          // Don't pass search to backend - we'll filter client-side for reliability
        };
        
        console.log('Fetching all active admins with filters:', adminFilters);
        const adminData = await listAdminsApi(adminFilters);
        
        if (adminData && adminData.success && Array.isArray(adminData.data)) {
          console.log(`Found ${adminData.data.length} admins from API`);
          
          // Debug: Log raw admin data structure to understand field names
          if (adminData.data.length > 0) {
            console.log('📋 Raw admin data structure (first admin):', JSON.stringify(adminData.data[0], null, 2));
            console.log('📋 All admin email fields:', adminData.data.map(a => ({
              adminId: a.adminId,
              email: a.email,
              emailFieldExists: 'email' in a,
              allKeys: Object.keys(a)
            })));
          }
          
          // Map admin results to match the expected format
          // Preserve the role (admin or sub_admin) in userType
          let adminsWithType = adminData.data.map(admin => {
            // Preserve the role from backend: 'admin' or 'sub_admin'
            // Both are allowed for messaging, but we keep the distinction
            const adminRole = admin.role || 'admin'; // Default to 'admin' if role not specified
            const mappedAdmin = {
              id: admin.adminId || admin.id || admin.uid, // Use adminId from backend
              firstName: admin.firstName || '',
              lastName: admin.lastName || '',
              email: admin.email || '', // Make sure we're getting the email field
              username: admin.username || admin.email || '',
              profileImage: admin.profileImage || admin.profilePhotoUrl || '',
              userType: adminRole, // Preserve role: 'admin' or 'sub_admin'
              role: adminRole, // Also store in role field for clarity
              createdAt: admin.createdAt,
              fullName: admin.fullName || `${admin.firstName || ''} ${admin.lastName || ''}`.trim()
            };
            
            // Debug: Log first few admins to see their data structure
            if (adminData.data.indexOf(admin) < 3) {
              console.log('Sample admin data:', {
                raw: admin,
                mapped: mappedAdmin,
                emailCheck: {
                  rawEmail: admin.email,
                  mappedEmail: mappedAdmin.email,
                  emailType: typeof admin.email,
                  emailExists: 'email' in admin
                }
              });
            }
            
            return mappedAdmin;
          });
          
          console.log(`Mapped ${adminsWithType.length} admins. Sample names:`, 
            adminsWithType.slice(0, 5).map(a => `${a.firstName} ${a.lastName} (${a.email})`));
          
          // Apply client-side search filter
          // Search by fullName, firstName, lastName, and email
          if (query && query.trim().length > 0) {
            const searchTerm = query.toLowerCase().trim();
            console.log(`🔍 Searching ${adminsWithType.length} admins for: "${searchTerm}"`);
            const beforeClientFilter = adminsWithType.length;
            
            // Log all admin emails before filtering for debugging
            console.log('All admin emails before filter:', adminsWithType.map(a => a.email).filter(Boolean));
            
            adminsWithType = adminsWithType.filter(admin => {
              // Safely get all searchable fields, handling null/undefined
              const firstName = String(admin.firstName || '').trim().toLowerCase();
              const lastName = String(admin.lastName || '').trim().toLowerCase();
              const email = String(admin.email || '').trim().toLowerCase();
              const fullName = String(admin.fullName || `${firstName} ${lastName}`.trim()).toLowerCase();
              
              // Search in all fields - check each field individually for better debugging
              const matchesFullName = fullName && fullName.includes(searchTerm);
              const matchesEmail = email && email.includes(searchTerm);
              const matchesFirstName = firstName && firstName.includes(searchTerm);
              const matchesLastName = lastName && lastName.includes(searchTerm);
              
              const matches = matchesFullName || matchesEmail || matchesFirstName || matchesLastName;
              
              if (matches) {
                const matchReason = matchesEmail ? 'email' : matchesFullName ? 'fullName' : matchesFirstName ? 'firstName' : 'lastName';
                console.log(`✅ Admin match found (${matchReason}): "${admin.fullName || admin.email || 'Unknown'}" (firstName: "${admin.firstName || 'N/A'}", lastName: "${admin.lastName || 'N/A'}", email: "${admin.email || 'N/A'}")`);
              } else {
                // Debug: Log why it didn't match for ALL admins when searching (to help debug)
                console.log(`❌ No match: "${admin.fullName || admin.email || 'Unknown'}" (firstName: "${admin.firstName || 'N/A'}", lastName: "${admin.lastName || 'N/A'}", email: "${admin.email || 'N/A'}") - searched: "${searchTerm}"`);
                console.log(`   Checked: fullName="${fullName}", email="${email}", firstName="${firstName}", lastName="${lastName}"`);
              }
              
              return matches;
            });
            console.log(`After client-side filter: ${adminsWithType.length} admins (filtered from ${beforeClientFilter})`);
            
            if (adminsWithType.length === 0 && beforeClientFilter > 0) {
              console.log(`⚠️ WARNING: Search "${searchTerm}" returned 0 admins from ${beforeClientFilter} total admins!`);
            }
          }
          
          allResults.push(...adminsWithType);
          console.log(`Added ${adminsWithType.length} admins to results`);
        } else {
          console.log('Admin search returned no results or invalid format:', adminData);
        }
      } catch (adminError) {
        console.log('Error fetching admins:', adminError);
        // Don't throw - continue with supplier results only
      }
      
      // Get current user UID to exclude from results
      const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
      
      // ============================================
      // FINAL RULES ENFORCEMENT (SECURITY LAYER):
      // SELLER ACCOUNT USERS CAN MESSAGE FOR ADMIN AND SELLER OTHER USERS
      // FOR BUYER ACCOUNT USERS CAN MESSAGE OTHER BUYER USERS AND ADMIN ONLY
      // ADMIN USERS CAN MESSAGE ALL USER TYPES (BUYERS, SUPPLIERS, AND ADMINS)
      // ============================================
      // IMPORTANT: Filter users based on user type
      // Sellers should only see suppliers and admins (not buyers)
      // Buyers should only see buyers and admins (not suppliers)
      const beforeFilter = allResults.length;
      
      // Store original results to check context before filtering
      const originalResults = [...allResults];
      
      // If detection failed, infer from results (if we fetched suppliers, we're seller; if buyers, we're buyer)
      let inferredIsSeller = isSeller;
      let inferredIsBuyer = isBuyer;
      
      if (!isSeller && !isBuyer && originalResults.length > 0) {
        // Check what types of users we fetched
        const hasSuppliers = originalResults.some(u => u.userType === 'supplier');
        const hasBuyers = originalResults.some(u => u.userType === 'buyer');
        
        if (hasSuppliers && !hasBuyers) {
          inferredIsSeller = true;
          console.log('⚠️ Inferred seller context from fetched results (suppliers found, no buyers)');
        } else if (hasBuyers && !hasSuppliers) {
          inferredIsBuyer = true;
          console.log('⚠️ Inferred buyer context from fetched results (buyers found, no suppliers)');
        } else if (hasSuppliers && hasBuyers) {
          // CRITICAL: If we have BOTH suppliers and buyers, we can't determine context safely
          // But if we have suppliers, we MUST be in seller context (sellers fetch suppliers)
          // So block all buyers
          inferredIsSeller = true;
          console.log('⚠️ CRITICAL: Both suppliers and buyers found. Assuming seller context and blocking buyers for security.');
        }
      }
      
      allResults = allResults.filter(user => {
        const userType = user.userType || '';
        
        // Admins can see all user types - no filtering needed
        if (isAdmin) {
          return true; // Allow all user types for admins
        }
        
        if (inferredIsSeller || isSeller) {
          // RULE: SELLER ACCOUNT USERS CAN MESSAGE FOR ADMIN AND SELLER OTHER USERS
          // Sellers should NEVER see buyers
          if (userType === 'buyer') {
            console.log('⚠️ SECURITY: Filtered out buyer user from seller People modal:', user.id, user.name);
            return false;
          }
          // Sellers can ONLY see suppliers, admins, and sub_admins
          const allowed = userType === 'supplier' || userType === 'admin' || userType === 'sub_admin';
          if (!allowed) {
            console.log('⚠️ SECURITY: Filtered out invalid user type from seller People modal:', userType, user.id);
          }
          return allowed;
        } else if (inferredIsBuyer || isBuyer) {
          // RULE: FOR BUYER ACCOUNT USERS CAN MESSAGE OTHER BUYER USERS AND ADMIN ONLY
          // Buyers should NEVER see suppliers
          if (userType === 'supplier') {
            console.log('⚠️ SECURITY: Filtered out supplier user from buyer People modal:', user.id, user.name);
            return false;
          }
          // Buyers can ONLY see buyers, admins, and sub_admins
          const allowed = userType === 'buyer' || userType === 'admin' || userType === 'sub_admin';
          if (!allowed) {
            console.log('⚠️ SECURITY: Filtered out invalid user type from buyer People modal:', userType, user.id);
          }
          return allowed;
        }
        
        // If we still can't determine, be EXTREMELY safe
        // Check original results to determine context
        const originalHasSuppliers = originalResults.some(u => u.userType === 'supplier');
        const originalHasBuyers = originalResults.some(u => u.userType === 'buyer');
        
        if (originalHasSuppliers && !originalHasBuyers) {
          // Seller context - STRICTLY filter out buyers
          if (userType === 'buyer') {
            console.log('⚠️ SECURITY: Blocked buyer user in seller context (inferred from results):', user.id);
            return false;
          }
          // Only allow suppliers, admins, and sub_admins
          return userType === 'supplier' || userType === 'admin' || userType === 'sub_admin';
        } else if (originalHasBuyers && !originalHasSuppliers) {
          // Buyer context - STRICTLY filter out suppliers
          if (userType === 'supplier') {
            console.log('⚠️ SECURITY: Blocked supplier user in buyer context (inferred from results):', user.id);
            return false;
          }
          // Only allow buyers, admins, and sub_admins
          return userType === 'buyer' || userType === 'admin' || userType === 'sub_admin';
        }
        
        // Last resort: If we have both suppliers and buyers, we can't determine context
        // Be EXTREMELY conservative - only show admins and sub_admins (safest option)
        if (userType !== 'admin' && userType !== 'sub_admin') {
          console.log('⚠️ SECURITY: Cannot determine context (both suppliers and buyers found). Blocking non-admin user:', userType, user.id);
        }
        return userType === 'admin' || userType === 'sub_admin';
      });
      const afterFilter = allResults.length;
      if (beforeFilter > afterFilter) {
        console.log(`⚠️ SECURITY: Removed ${beforeFilter - afterFilter} user(s) from People modal results`);
      }
      
      // ============================================
      // CRITICAL FINAL SECURITY CHECK
      // ============================================
      // Double-check that rules are enforced - remove any users that violate rules
      // Skip security check for admins (they can see all user types)
      if (!isAdmin) {
        const finalHasSuppliers = allResults.some(u => u.userType === 'supplier');
        const finalHasBuyers = allResults.some(u => u.userType === 'buyer');
        
        // Determine context: If we have suppliers, we MUST be in seller context
        const isSellerContext = isSeller || inferredIsSeller || (finalHasSuppliers && !finalHasBuyers) || (finalHasSuppliers && finalHasBuyers);
        const isBuyerContext = isBuyer || inferredIsBuyer || (finalHasBuyers && !finalHasSuppliers);
        
        if (isSellerContext) {
        // SELLER CONTEXT: Remove ALL buyers - NO EXCEPTIONS
        const buyersFound = allResults.filter(u => u.userType === 'buyer');
        if (buyersFound.length > 0) {
          console.log(`❌ CRITICAL SECURITY BREACH: Found ${buyersFound.length} buyer(s) in seller results! Removing immediately.`);
          console.log('Buyers found:', buyersFound.map(b => ({ id: b.id, name: b.name, email: b.email, userType: b.userType })));
          allResults = allResults.filter(u => u.userType !== 'buyer');
          console.log(`❌ Removed ${buyersFound.length} buyer(s). Sellers can ONLY message sellers and admins.`);
        }
      } else if (isBuyerContext) {
        // BUYER CONTEXT: Remove ALL suppliers - NO EXCEPTIONS
        const suppliersFound = allResults.filter(u => u.userType === 'supplier');
        if (suppliersFound.length > 0) {
          console.log(`❌ CRITICAL SECURITY BREACH: Found ${suppliersFound.length} supplier(s) in buyer results! Removing immediately.`);
          console.log('Suppliers found:', suppliersFound.map(s => ({ id: s.id, name: s.name, email: s.email, userType: s.userType })));
          allResults = allResults.filter(u => u.userType !== 'supplier');
          console.log(`❌ Removed ${suppliersFound.length} supplier(s). Buyers can ONLY message buyers, admins, and sub_admins.`);
        }
      }
      }
      
      // Deduplicate users by ID before formatting (same user might appear in multiple results)
      const uniqueUsersMap = new Map();
      allResults.forEach(user => {
        if (user.id && user.id !== currentUserUid) {
          // If user already exists, prefer the one with more complete data or admin type
          if (!uniqueUsersMap.has(user.id)) {
            uniqueUsersMap.set(user.id, user);
          } else {
            const existing = uniqueUsersMap.get(user.id);
            // Prefer admin type if one is admin (admins might also be in supplier/buyer collections)
            if (user.userType === 'admin' && existing.userType !== 'admin') {
              uniqueUsersMap.set(user.id, user);
            } else if (user.userType === existing.userType) {
              // If same type, prefer the one with more complete data
              const userFields = Object.keys(user).length;
              const existingFields = Object.keys(existing).length;
              if (userFields > existingFields) {
                uniqueUsersMap.set(user.id, user);
              }
            }
          }
        }
      });
      
      const uniqueUsers = Array.from(uniqueUsersMap.values());
      console.log(`Deduplicated ${allResults.length} results to ${uniqueUsers.length} unique users`);
      
      // Map API response to the expected format
      const formattedUsers = await Promise.all(
        uniqueUsers
          .map(async user => {
            // Try to get the profile photo from AsyncStorage if available
            let avatarUrl = AvatarImage; // Default avatar image
            if (user.profileImage) {
              // Use server provided profile image if available
              avatarUrl = { uri: user.profileImage };
            } else {
              // Try to get from AsyncStorage if the user ID matches current user
              try {
                // Check if there's a cached avatar for this user ID
                const storedPhotoUrl = await AsyncStorage.getItem(`profilePhotoUrlWithTimestamp_${user.id}`);
                if (storedPhotoUrl) {
                  avatarUrl = { uri: storedPhotoUrl };
                }
              } catch (err) {
                console.log('Failed to load avatar from storage:', err);
              }
            }
            
            // Build display name: prefer full name, then first+last, then garden/company name, then email
            let displayName = user.fullName || 
                             `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                             user.gardenOrCompanyName ||
                             user.businessName ||
                             user.companyName ||
                             user.email?.split('@')[0] ||
                             'User';
            
            return {
              id: user.id,
              name: displayName,
              avatarUrl: avatarUrl,
              uid: user.id,
              email: user.email,
              userType: user.userType, // Include userType for reference
              createdAt: user.createdAt
            };
          })
      );
      
      setUsers(formattedUsers);
      // Apply client-side filtering based on current searchText
      // This ensures search works even if API filtering has issues
      applyClientSideFilter(formattedUsers, searchText);
      
      // Log search results info with breakdown
      const adminCount = formattedUsers.filter(u => u.userType === 'admin').length;
      const supplierCount = formattedUsers.filter(u => u.userType === 'supplier').length;
      const buyerCount = formattedUsers.filter(u => u.userType === 'buyer').length;
      const userTypeLabel = isSeller ? 'seller' : isBuyer ? 'buyer' : 'unknown';
      console.log(`📊 Final results (${userTypeLabel}): ${formattedUsers.length} total users (${adminCount} admins, ${supplierCount} suppliers, ${buyerCount} buyers) for query "${query}"`);
      if (formattedUsers.length > 0) {
        console.log('Sample results:', formattedUsers.slice(0, 3).map(u => ({
          name: u.name,
          email: u.email,
          userType: u.userType
        })));
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again later.');
      // Set empty users array to prevent issues
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Skeleton loading component for user items
  const SkeletonUserItem = ({ index = 0 }) => (
    <View style={[
      styles.userItem,
      index !== 4 && styles.userItemBorder // Show border except for last item
    ]}>
      {/* Avatar skeleton */}
      <View style={styles.skeletonAvatar} />
      <View style={styles.userInfo}>
        {/* Name skeleton with varying widths for realism */}
        <View style={[styles.skeletonName, { width: 120 + (index % 3) * 30 }]} />
        {/* Email skeleton with varying widths */}
        <View style={[styles.skeletonEmail, { width: 80 + (index % 4) * 20 }]} />
      </View>
    </View>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Header - Fixed */}
            <View style={styles.header}>
              <Text style={styles.title}>People</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIconText}>✕</Text>
              </Pressable>
            </View>

            {/* Search Field - Fixed */}
            <View style={styles.searchBox}>
              <View style={styles.searchIconContainer}>
                <Text style={styles.searchIconText}>🔍</Text>
              </View>
              <TextInput
                ref={searchInputRef}
                placeholder="Search"
                placeholderTextColor="#647276"
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* List - Scrollable */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
            {loading ? (
              <View style={styles.userList}>
                {Array.from({length: 5}).map((_, idx) => (
                  <SkeletonUserItem key={idx} index={idx} />
                ))}
              </View>
            ) : filteredUsers.length > 0 ? (
              <View style={styles.userList}>
                {filteredUsers.map((user, index) => ( 
                  <TouchableOpacity 
                    key={user.id || `user-${index}`}
                    onPress={() => {
                      if (user && user.id) {
                        const validatedUser = {
                          ...user,
                          uid: user.uid || user.id
                        };
                        console.log('Selected user:', validatedUser);
                        onSelect(validatedUser);
                      } else {
                        Alert.alert('Error', 'Invalid user data. Please try again.');
                      }
                    }} 
                    style={[
                      styles.userItem,
                      index !== filteredUsers.length - 1 && styles.userItemBorder
                    ]}
                  >
                    <Image 
                      source={user.avatarUrl}
                      style={styles.avatar}
                      defaultSource={AvatarImage}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchText.trim() ? `No users found for "${searchText}"` : 'No users found'}
                </Text>
              </View>
            )}
          </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default NewMessageModal;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 600,
    width: '100%',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 600,
    width: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: '#7F8D91',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  closeIconText: {
    fontSize: 20,
    color: '#7F8D91',
    fontWeight: 'bold',
  },
  searchIconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 16,
    color: '#7F8D91',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginHorizontal: 24,
    backgroundColor: '#fff',
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#7F8D91',
  },
  searchInput: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  userList: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  userItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EA',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E8EA',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  userEmail: {
    fontSize: 12,
    color: '#647276',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  skeletonName: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonEmail: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
});

