export default function buildSortedURL(
  _url: string,
  data: any,
  encode: (obj: Record<string, any>) => string
) {
  let builtURL = data ? encode(data) : '';
  if (builtURL) {
    builtURL = _url + (_url.includes('?') ? '&' + builtURL : '?' + builtURL);
  }
  const [urlPath, queryString] = builtURL.split('?');

  if (queryString) {
    const paramsPair = queryString.split('&');
    return `${urlPath}?${paramsPair.sort().join('&')}`;
  }

  return builtURL || _url;
}
