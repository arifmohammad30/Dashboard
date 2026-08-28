import { checkPermission } from '../hooks/useAuthorization';
import { mapBackendUserToAuthUser } from '../utils/authAdapter';
import { PERMISSIONS } from '../../../config/permissions';

/**
 * Authorization Infrastructure Automated Test Suite
 *
 * Verifies all permission rules, role-agnostic behavior, deny-by-default logic,
 * and permission matching logic specified in the RBAC implementation prompt.
 */
export function runAuthorizationTests() {
  const testResults = [];
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName) {
    if (condition) {
      passedCount++;
      testResults.push({ name: testName, status: 'PASSED' });
    } else {
      failedCount++;
      testResults.push({ name: testName, status: 'FAILED' });
      console.error(`[AUTH TEST FAILED]: ${testName}`);
    }
  }

  console.log('--- Starting Authorization Infrastructure Test Suite ---');

  // Test 1: Deny by default when user is null or permissions unavailable
  const nullUser = null;
  assert(checkPermission(nullUser, PERMISSIONS.STATION_VIEW) === false, 'Test 1: Deny safely when user is null');

  const emptyUser = mapBackendUserToAuthUser({ id: 'u1', role: 'OPERATOR', permissions: [] });
  assert(checkPermission(emptyUser, PERMISSIONS.STATION_CREATE) === false, 'Test 2: Deny safely when permissions array is empty');

  // Test 3: Granted access when permission exists
  const authorizedUser = mapBackendUserToAuthUser({
    id: 'u2',
    name: 'Test Manager',
    role: 'Arbitrary Custom Role XYZ', // Role name does not affect permissions
    permissions: [PERMISSIONS.STATION_VIEW, PERMISSIONS.STATION_CREATE, PERMISSIONS.TARIFF_VIEW]
  });

  assert(checkPermission(authorizedUser, PERMISSIONS.STATION_VIEW) === true, 'Test 3: Access granted when permission exists');
  assert(checkPermission(authorizedUser, PERMISSIONS.STATION_DELETE) === false, 'Test 4: Access denied when specific permission is missing');

  // Test 5: Role-Agnostic Behavior - Adding a brand new backend role works with zero frontend code changes
  const newCustomRoleUser = mapBackendUserToAuthUser({
    id: 'u3',
    name: 'Auditor User',
    role: 'Auditor_Role_2026_V2', // Completely new, arbitrary role name
    permissions: [PERMISSIONS.BILL_VIEW, PERMISSIONS.BILL_EXPORT]
  });

  assert(checkPermission(newCustomRoleUser, PERMISSIONS.BILL_VIEW) === true, 'Test 5: Brand new backend role grants access via permissions');
  assert(checkPermission(newCustomRoleUser, PERMISSIONS.STATION_CREATE) === false, 'Test 6: Brand new backend role denies ungranted actions');

  // Test 7: Unrestricted permission check
  assert(checkPermission(authorizedUser, '') === true, 'Test 7: Empty permission string is unrestricted');

  console.log(`--- Test Suite Completed: ${passedCount} Passed, ${failedCount} Failed ---`);
  return { passedCount, failedCount, testResults };
}

// Run immediately if executed directly in node / test environment
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  runAuthorizationTests();
}
