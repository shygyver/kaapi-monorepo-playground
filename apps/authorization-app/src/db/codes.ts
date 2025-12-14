// In-memory device codes store
export const deviceCodesStore = new Map<
    string,
    { clientId: string; scopes: string[]; verified: boolean; userCode: string; userId?: string }
>();
