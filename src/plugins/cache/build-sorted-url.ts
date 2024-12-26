export default function buildSortedURL(
  url: string,
  data: Record<string, any> | null,
  paramsSerializer: (obj: Record<string, any>) => string
): string {
  const serializedParams = data ? paramsSerializer(data) : '';
  const separator = url.includes('?') ? '&' : '?';
  const builtURL = serializedParams ? `${url}${separator}${serializedParams}` : url;

  const [urlPath, queryString] = builtURL.split('?');

  if (!queryString) return builtURL;

  const sortedParams = queryString.split('&').sort().join('&');
  return `${urlPath}?${sortedParams}`;
}
