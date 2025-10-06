import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Migrate Plant Catalog to Taxonomy API Client
 * 
 * Consolidates data from plant_catalog collection into the formal
 * taxonomy system (genus + species collections).
 * 
 * @param {Object} params - Request parameters
 * @param {boolean} [params.dryRun=true] - Preview changes without committing
 * @param {string} params.adminId - ID of the admin running the migration
 * @param {string} params.authToken - Authentication token
 * @param {boolean} [params.force=false] - Skip confirmation checks
 * 
 * @returns {Promise<Object>} Response containing migration results
 * 
 * @example
 * // Dry run (preview only)
 * const preview = await migratePlantCatalogToTaxonomyApi({
 *   dryRun: true,
 *   adminId: 'admin123',
 *   authToken: await getStoredAuthToken()
 * });
 * 
 * // Live migration
 * const result = await migratePlantCatalogToTaxonomyApi({
 *   dryRun: false,
 *   adminId: 'admin123',
 *   authToken: await getStoredAuthToken()
 * });
 */
export const migratePlantCatalogToTaxonomyApi = async (params) => {
  try {
    console.log('🚀 Starting migratePlantCatalogToTaxonomyApi call with params:', params);

    const { dryRun = true, adminId, authToken, force = false } = params;

    // Validate required parameters
    if (!adminId) {
      throw new Error('adminId is required');
    }

    if (!authToken) {
      console.warn('⚠️ No auth token provided. Request may fail in production.');
    }

    // Prepare request body
    const requestBody = {
      dryRun,
      adminId,
      force
    };

    console.log('📝 Request body prepared:', requestBody);

    // Prepare request configuration
    const requestConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };

    // Add authentication header
    if (authToken) {
      requestConfig.headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log('🌐 Making API call to:', API_ENDPOINTS.MIGRATE_PLANT_CATALOG_TO_TAXONOMY);

    // Make the API call
    const response = await fetch(API_ENDPOINTS.MIGRATE_PLANT_CATALOG_TO_TAXONOMY, requestConfig);

    console.log('📡 Response status:', response.status);

    // Parse response
    const responseData = await response.json();
    console.log('📄 Response data:', responseData);

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, responseData.error);
      throw new Error(
        responseData.error || 
        responseData.message || 
        `Migration failed. Status: ${response.status}`
      );
    }

    if (dryRun) {
      console.log('✅ Dry run completed:', {
        uniqueGenera: responseData.summary?.uniqueGenera,
        newGenera: responseData.summary?.newGenera,
        totalSpecies: responseData.summary?.totalSpecies
      });
    } else {
      console.log('✅ Migration completed:', {
        generaCreated: responseData.summary?.generaCreated,
        generaUpdated: responseData.summary?.generaUpdated,
        speciesCreated: responseData.summary?.speciesCreated
      });
    }

    return {
      success: true,
      data: responseData,
      summary: responseData.summary,
      details: responseData.details,
      mode: responseData.mode,
      message: responseData.message,
      status: response.status
    };

  } catch (error) {
    console.error('❌ Error in migratePlantCatalogToTaxonomyApi:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      data: null,
      status: error.status || 500
    };
  }
};

/**
 * Format migration summary for display
 * 
 * @param {Object} summary - Migration summary from API response
 * @returns {string} Formatted summary text
 */
export const formatMigrationSummary = (summary) => {
  if (!summary) return 'No summary available';

  const lines = [];
  
  if (summary.mode === 'DRY_RUN') {
    lines.push('📋 PREVIEW MODE - No changes made');
    lines.push('');
    lines.push(`📊 Found ${summary.catalogDocuments || 0} documents in plant_catalog`);
    lines.push(`🌿 Identified ${summary.uniqueGenera || 0} unique genera`);
    lines.push(`➕ Will create ${summary.newGenera || 0} new genera`);
    lines.push(`✏️ Will update ${summary.existingGenera || 0} existing genera`);
    lines.push(`🌱 Will add ${summary.totalSpecies || 0} species`);
    
    if (summary.skippedDocuments > 0) {
      lines.push(`⚠️ ${summary.skippedDocuments} documents will be skipped`);
    }
    
    lines.push('');
    lines.push(`💾 Total operations: ${summary.totalOperations || 0}`);
  } else {
    lines.push('✅ MIGRATION COMPLETED');
    lines.push('');
    lines.push(`✨ Created ${summary.generaCreated || 0} new genera`);
    lines.push(`♻️ Updated ${summary.generaUpdated || 0} existing genera`);
    lines.push(`🌱 Created ${summary.speciesCreated || 0} species`);
    
    if (summary.skippedDocuments > 0) {
      lines.push(`⚠️ Skipped ${summary.skippedDocuments} documents`);
    }
    
    if (summary.errors > 0) {
      lines.push(`❌ Errors: ${summary.errors}`);
    }
    
    lines.push('');
    lines.push(`💾 Batches committed: ${summary.batchesCommitted || 0}`);
  }

  return lines.join('\n');
};

/**
 * Validate migration is safe to run
 * 
 * @param {Object} previewResult - Result from dry run
 * @returns {Object} Validation result
 */
export const validateMigrationSafety = (previewResult) => {
  const warnings = [];
  const errors = [];
  
  if (!previewResult.success) {
    errors.push('Preview failed to run');
    return { safe: false, warnings, errors };
  }

  const summary = previewResult.summary;
  
  // Check for too many operations
  if (summary.totalOperations > 10000) {
    warnings.push(`Large migration: ${summary.totalOperations} operations. This may take several minutes.`);
  }

  // Check for skipped documents
  if (summary.skippedDocuments > 50) {
    warnings.push(`${summary.skippedDocuments} documents will be skipped. Review the list before proceeding.`);
  }

  // Check for reasonable genera count
  if (summary.uniqueGenera < 10) {
    warnings.push('Unusually low number of genera detected. Verify plant_catalog has data.');
  }

  // Check for species/genera ratio
  const ratio = summary.totalSpecies / summary.uniqueGenera;
  if (ratio < 2) {
    warnings.push('Low species per genus ratio. This might indicate data quality issues.');
  }

  const safe = errors.length === 0;

  return {
    safe,
    warnings,
    errors,
    recommendation: safe 
      ? 'Migration appears safe to proceed' 
      : 'Please review errors before proceeding'
  };
};
