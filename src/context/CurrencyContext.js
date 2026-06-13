import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext(null);
const ETB_RATE = 56.5;

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('ETB');

  const fmt = (etbAmount) => {
    if (!etbAmount) return currency === 'ETB' ? '0 ETB' : '$0.00';
    if (currency === 'USD') return `$${(etbAmount / ETB_RATE).toFixed(2)}`;
    return `${Number(etbAmount).toLocaleString()} ETB`;
  };

  const toggle = () => setCurrency(c => c === 'ETB' ? 'USD' : 'ETB');

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt, toggle, rate: ETB_RATE }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
