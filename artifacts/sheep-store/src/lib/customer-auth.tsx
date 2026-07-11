import React, { createContext, useContext } from 'react';
import { useGetCurrentCustomer, getGetCurrentCustomerQueryKey } from '@workspace/api-client-react';
import type { GetCurrentCustomerResponse } from '@workspace/api-client-react';

type CustomerAuthContextValue = {
  customer: GetCurrentCustomerResponse | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: customer, isLoading } = useGetCurrentCustomer({
    query: {
      queryKey: getGetCurrentCustomerQueryKey(),
      retry: false,
    },
  });

  return (
    <CustomerAuthContext.Provider
      value={{ customer, isLoading, isAuthenticated: !!customer }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
