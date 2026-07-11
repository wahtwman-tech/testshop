import React, { createContext, useContext } from 'react';
import { useGetCurrentAdmin, getGetCurrentAdminQueryKey } from '@workspace/api-client-react';
import type { GetCurrentAdminResponse } from '@workspace/api-client-react';

type AdminAuthContextValue = {
  admin: GetCurrentAdminResponse | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: admin, isLoading } = useGetCurrentAdmin({
    query: {
      queryKey: getGetCurrentAdminQueryKey(),
      retry: false,
    },
  });

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, isAuthenticated: !!admin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
