/**
 * Mock Import Taxonomy Data API for Development
 * 
 * This provides a simulated import functionality for development and testing
 * without requiring a backend server connection.
 */

export const importTaxonomyDataApi = async (params) => {
  try {
    console.log('📤 Starting taxonomy data import (MOCK)...');
    console.log('📁 File details:', {
      name: params.file?.name,
      type: params.file?.type,
      size: params.file?.size
    });

    // Simulate API processing time
    console.log('🔄 Processing file...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate analysis of the uploaded file
    const fileName = params.file?.name || 'unknown_file';
    const fileSize = params.file?.size || 0;
    
    // Mock processing results based on file
    const mockResults = {
      success: true,
      message: 'Taxonomy data imported successfully',
      data: {
        imported: {
          genera: 3,
          species: 8,
          total_entries: 8
        },
        skipped: {
          duplicates: 0,
          invalid: 0
        },
        errors: [],
        processing_time: '2.1s',
        file_info: {
          name: fileName,
          size: fileSize,
          format: params.file?.type || 'CSV'
        },
        sample_entries: [
          { genus: 'Monstera', species: 'Deliciosa', variegation: 'None', shipping_index: 3, acclimation_index: 4 },
          { genus: 'Alocasia', species: 'Zebrina', variegation: 'Variegated', shipping_index: 2, acclimation_index: 3 },
          { genus: 'Philodendron', species: 'Birkin', variegation: 'None', shipping_index: 4, acclimation_index: 5 }
        ]
      },
      import_id: `mock_import_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Mock import completed successfully:', mockResults);
    return mockResults;

  } catch (error) {
    console.error('❌ Error in mock import:', error);
    throw new Error(`Mock import failed: ${error.message}`);
  }
};

export const validateTaxonomyFileApi = async (file) => {
  try {
    console.log('🔍 Validating taxonomy file (MOCK)...');
    
    // Simulate validation time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockValidation = {
      success: true,
      valid: true,
      message: 'File format is valid',
      details: {
        format: file.type || 'CSV',
        size: file.size,
        estimated_entries: 8,
        required_columns: ['genus_name', 'species_name'],
        optional_columns: ['variegation', 'shipping_index', 'acclimation_index'],
        detected_columns: ['genus_name', 'species_name', 'variegation', 'shipping_index', 'acclimation_index']
      }
    };

    console.log('✅ Mock validation completed:', mockValidation);
    return mockValidation;

  } catch (error) {
    console.error('❌ Error in mock validation:', error);
    throw new Error(`Mock validation failed: ${error.message}`);
  }
};

export const getImportHistoryApi = async () => {
  try {
    console.log('📋 Getting import history (MOCK)...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockHistory = {
      success: true,
      imports: [
        {
          id: 'mock_import_001',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          file_name: 'monthly_taxonomy_update.csv',
          status: 'completed',
          imported: 25,
          skipped: 2,
          errors: 0
        },
        {
          id: 'mock_import_002',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          file_name: 'new_species_batch.xlsx',
          status: 'completed',
          imported: 12,
          skipped: 0,
          errors: 1
        }
      ]
    };

    console.log('✅ Mock history retrieved:', mockHistory);
    return mockHistory;

  } catch (error) {
    console.error('❌ Error in mock history:', error);
    throw new Error(`Mock history failed: ${error.message}`);
  }
};
