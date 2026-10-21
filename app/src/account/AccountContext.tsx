import { createContext, useContext } from 'react';
import type { AccountUser } from './api';
import type { AccountSync } from './accountStore';

/** Signed-in extras for components (save status, import, empty-account checks). Null in guest
 * mode — components use it to switch between the guest and the account behaviour. */
export interface AccountContextValue {
  user: AccountUser;
  sync: AccountSync;
}

export const AccountContext = createContext<AccountContextValue | null>(null);

export function useAccount(): AccountContextValue | null {
  return useContext(AccountContext);
}
