import {jwtDecode} from 'jwt-decode';

export function decodeToken(token: string): any {
  return jwtDecode(token);
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  const expirationDate = new Date(0);
  expirationDate.setUTCSeconds(decoded.exp);
  return expirationDate < new Date();
}

export function getUserDetails(authToken : string) {
  const token = localStorage.getItem(authToken);
  if (token) {
    const decodedToken: any = decodeToken(token);
    return decodedToken; // This will contain the decoded JWT payload
  }
  return null;
}
