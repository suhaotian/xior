export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('ok');
    }, ms);
  });
}
