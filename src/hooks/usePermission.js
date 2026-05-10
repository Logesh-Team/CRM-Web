import { useSelector } from 'react-redux';
import { hasPermission, getRole } from '../constants/roles';

export function usePermission() {
  const user = useSelector((state) => state.auth.user);
  const role = getRole(user);

  return {
    can: (permission) => hasPermission(role, permission),
    role,
    isSuperAdmin:  role === 'SUPER_ADMIN',
    isManager:     role === 'SALES_MANAGER',
    isExecutive:   role === 'SALES_EXECUTIVE',
    isMarketing:   role === 'MARKETING_EXECUTIVE',
  };
}
