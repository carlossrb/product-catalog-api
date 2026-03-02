export const CacheTTL = {
  PRODUCT_DETAIL: 30_000,
  CATEGORY_DETAIL: 60_000,
  CATEGORY_LIST: 60_000,
} as const;

export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  category: (id: string) => `category:${id}`,
  categoryListVersion: () => "categories:list-version",
  categoryList: (version: number, hash: string) =>
    `categories:list:v${version}:${hash}`,
} as const;

export const hashQueryParams = (params: Record<string, unknown>): string => {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  return Buffer.from(JSON.stringify(sorted)).toString("base64url");
};
