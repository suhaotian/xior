export default function buildSortedURL(
  _url: string,
  data: any,
  encode: (obj: Record<string, any>) => string
) {
  let builtURL = data ? encode(data) : '';
  if (builtURL) {
    builtURL = _url.includes('?') ? _url + '&' + builtURL : _url + '?' + builtURL;
  }
  const [urlPath, queryString] = builtURL.split('?');

  if (queryString) {
    const paramsPair = queryString.split('&');
    return `${urlPath}?${paramsPair.sort().join('&')}`;
  }

  return builtURL || _url;
}
