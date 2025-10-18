function addParams(params: string[], str: string): void {
  if (!str) return;
  const parts = str.split('&');
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) params.push(parts[i]);
  }
}

export default function buildSortedURL(
  url: string,
  data: Record<string, any> | null,
  paramsSerializer: (obj: Record<string, any>) => string
): string {
  const queryIndex = url.indexOf('?');
  const noQueryIndex = queryIndex === -1;
  const urlPath = noQueryIndex ? url : url.slice(0, queryIndex);

  const params: string[] = [];

  if (!noQueryIndex) addParams(params, url.slice(queryIndex + 1));
  if (data) addParams(params, paramsSerializer(data));

  if (params.length === 0) return urlPath;
  if (params.length > 1) params.sort();

  return `${urlPath}?${params.join('&')}`;
}
