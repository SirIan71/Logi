/**
 * SIRIAN — usePermission Hook
 *
 * Returns the current user's access level for a given page,
 * along with convenience booleans for conditional rendering.
 */
import { useApp } from '../context/AppContext';
import { getAccessLevel } from '../config/rbac';

/**
 * @param {string} page — The page key (e.g. 'trips', 'fuel', 'settings')
 * @returns {{ accessLevel: string, canEdit: boolean, isReadOnly: boolean, isOwnOnly: boolean, role: string, user: object }}
 */
export function usePermission(page) {
  const { user } = useApp();
  const role = user?.role || 'driver';
  const accessLevel = getAccessLevel(role, page);

  return {
    accessLevel,
    canEdit: accessLevel === 'full',
    isReadOnly: accessLevel === 'read',
    isOwnOnly: accessLevel === 'own',
    role,
    user,
  };
}
