const fs = require('fs');
const path = require('path');

/**
 * SpectaQL Preprocessing Script to Inject Descriptions
 * 
 * This script modifies the GraphQL introspection result to inject
 * descriptions for queries and types that don't have them in the schema.
 */

// Load our documentation metadata
const metadataPath = path.join(__dirname, '../spectaql/metadata-merchandising.json');
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

/**
 * Main preprocessing function called by SpectaQL
 * @param {Object} introspectionResult - The GraphQL introspection result
 * @returns {Object} Modified introspection result with injected descriptions
 */
function preprocessIntrospection(introspectionResult) {
  console.log('🔧 Running description injection preprocessing...');
  
  try {
    // Clone the introspection result to avoid mutations
    const result = JSON.parse(JSON.stringify(introspectionResult));
    
    // Inject query descriptions
    if (result.data && result.data.__schema && result.data.__schema.queryType) {
      injectQueryDescriptions(result.data.__schema.queryType);
    }
    
    // Inject type descriptions
    if (result.data && result.data.__schema && result.data.__schema.types) {
      injectTypeDescriptions(result.data.__schema.types);
    }
    
    console.log('✅ Description injection completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error in description injection:', error);
    return introspectionResult; // Return original on error
  }
}

/**
 * Inject descriptions into query fields
 */
function injectQueryDescriptions(queryType) {
  if (!queryType.fields) {
    return;
  }
  
  const queryFields = metadata.OBJECT && metadata.OBJECT.Query && metadata.OBJECT.Query.fields;
  const fieldArgs = metadata.FIELD_ARGUMENT && metadata.FIELD_ARGUMENT.Query;
  
  queryType.fields.forEach(field => {
    if (queryFields) {
      const fieldMetadata = queryFields[field.name];
      if (fieldMetadata && fieldMetadata.documentation && fieldMetadata.documentation.description) {
        field.description = fieldMetadata.documentation.description;
        console.log(`📝 Injected description for query: ${field.name}`);
      }
    }
    
    if (field.args && fieldArgs && fieldArgs[field.name]) {
      field.args.forEach(arg => {
        const argMetadata = fieldArgs[field.name][arg.name];
        if (argMetadata && argMetadata.documentation && argMetadata.documentation.description) {
          arg.description = argMetadata.documentation.description;
          console.log(`📝 Injected description for argument: ${field.name}.${arg.name}`);
        }
      });
    }
  });
}

/**
 * Inject descriptions into types and their fields
 */
function injectTypeDescriptions(types) {
  if (!metadata.OBJECT) return;
  
  types.forEach(type => {
    // Inject type description
    const typeMetadata = metadata.OBJECT[type.name];
    if (typeMetadata && typeMetadata.documentation && typeMetadata.documentation.description) {
      type.description = typeMetadata.documentation.description;
      console.log(`📝 Injected description for type: ${type.name}`);
    }
    
    // Inject field descriptions
    if (type.fields && typeMetadata && typeMetadata.fields) {
      type.fields.forEach(field => {
        const fieldMetadata = typeMetadata.fields[field.name];
        if (fieldMetadata && fieldMetadata.documentation && fieldMetadata.documentation.description) {
          field.description = fieldMetadata.documentation.description;
          console.log(`📝 Injected description for field: ${type.name}.${field.name}`);
        }
      });
    }
  });
}

// Export the preprocessing function
module.exports = {
  preprocessIntrospection
};
