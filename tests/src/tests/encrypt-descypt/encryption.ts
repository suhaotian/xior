export const SECRET = '&*&*^SDxsdasdas776';

export function encrypt(data: string) {
  return data + '____' + SECRET;
}

export function decrypt(data: string, s?: string) {
  return data.replace('____' + (s || SECRET), '');
}
