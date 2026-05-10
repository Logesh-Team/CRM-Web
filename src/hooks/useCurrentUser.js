import { useSelector } from 'react-redux';
import { getRole } from '../constants/roles';
import { getDisplayName } from '../utils/formatUser';
import { ROLE_PERMISSIONS } from '../constants/roles';

export function useCurrentUser() {
  const user = useSelector((state) => state.auth.user);
  const role = getRole(user);

  return {
    user,
    role,
    name: getDisplayName(user),
    email: user?.email || user?.preferred_username || '',
    permissions: ROLE_PERMISSIONS[role] || [],
  };
}
