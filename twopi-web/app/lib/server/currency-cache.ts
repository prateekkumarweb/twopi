interface CurrenciesResponse {
  [key: string]: {
    symbol: string;
    name: string;
    symbol_native: string;
    decimal_digits: number;
    rounding: number;
    code: string;
    name_plural: string;
    type: string;
    countries: string[];
  };
}

const currencyCacheUrl =
  process.env.CURRENCY_CACHE_URL ?? "http://localhost:4670";

export async function getCurrenciesCache() {
  const response = await fetch(`${currencyCacheUrl}/currencies`);
  const data = (await response.json()).data as CurrenciesResponse;
  return data;
}

export async function getCurrenciesLatestCache() {
  const response = await fetch(`${currencyCacheUrl}/latest`);
  const data = (await response.json()).data as {
    [key: string]: {
      code: string;
      value: number;
    };
  };
  return data;
}
