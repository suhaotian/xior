export default function buildSortedURL(
  url: string,
  data: any,
  paramsSerializer: (obj: Record<string, any>) => string
) {
  let builtURL = data ? paramsSerializer(data) : '';
  if (builtURL) {
    builtURL = url + (url.includes('?') ? '&' + builtURL : '?' + builtURL);
  }
  const [urlPath, queryString] = builtURL.split('?');

  if (queryString) {
    const paramsPair = queryString.split('&');
    return `${urlPath}?${paramsPair.sort().join('&')}`;
  }

  return builtURL || url;
}
