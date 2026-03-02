/**
 * Resolve seller display name using alias masking.
 *
 * Buyers see the alias only.
 * Admins see "Alias (gardenOrCompanyName)".
 * Falls back through gardenOrCompanyName -> username -> email -> 'Seller'.
 */
export function resolveSellerDisplayName(supplierData, isAdminViewer = false) {
  const alias = supplierData?.alias;
  const realName =
    supplierData?.gardenOrCompanyName ||
    supplierData?.username ||
    supplierData?.email ||
    'Seller';

  const displayName = alias || realName;

  if (isAdminViewer && alias && supplierData?.gardenOrCompanyName) {
    return `${alias} (${supplierData.gardenOrCompanyName})`;
  }

  return displayName;
}
