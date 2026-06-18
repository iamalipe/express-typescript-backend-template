/**
 * Converts an IPv4 address string to its 8-character hexadecimal representation.
 * Example: '192.168.1.1' -> 'c0a80101'
 */
export function ipv4ToHex(ip: string): string {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  let hex = '';
  for (let i = 0; i < 4; i++) {
    const num = parseInt(parts[i], 10);
    if (isNaN(num) || num < 0 || num > 255) {
      throw new Error(`Invalid IPv4 octet: ${parts[i]}`);
    }
    hex += num.toString(16).padStart(2, '0');
  }
  return hex.toLowerCase();
}

/**
 * Fully expands and converts an IPv6 address string to its 32-character hexadecimal representation.
 * Handles double colon (::) shortcut expansion.
 * Example: '2001:db8::1' -> '20010db8000000000000000000000001'
 */
export function ipv6ToHex(ip: string): string {
  let cleanIp = ip.trim().toLowerCase();
  
  // Strip optional surrounding brackets (often used in URLs)
  if (cleanIp.startsWith('[') && cleanIp.endsWith(']')) {
    cleanIp = cleanIp.slice(1, -1);
  }

  // Handle double colon compression
  const doubleColonIndex = cleanIp.indexOf('::');
  let parts: string[];

  if (doubleColonIndex !== -1) {
    const left = cleanIp.substring(0, doubleColonIndex).split(':').filter(Boolean);
    const right = cleanIp.substring(doubleColonIndex + 2).split(':').filter(Boolean);
    const missingCount = 8 - (left.length + right.length);
    if (missingCount < 0) {
      throw new Error(`Invalid IPv6 address (too many blocks): ${ip}`);
    }
    const middle = Array(missingCount).fill('0');
    parts = [...left, ...middle, ...right];
  } else {
    parts = cleanIp.split(':');
  }

  if (parts.length !== 8) {
    throw new Error(`Invalid IPv6 address (must contain exactly 8 blocks): ${ip}`);
  }

  let hex = '';
  for (let i = 0; i < 8; i++) {
    const part = parts[i];
    const parsed = parseInt(part, 16);
    if (isNaN(parsed) || parsed < 0 || parsed > 0xffff) {
      throw new Error(`Invalid IPv6 block: ${part}`);
    }
    hex += parsed.toString(16).padStart(4, '0');
  }
  return hex.toLowerCase();
}

/**
 * Detects whether an IP is IPv4 or IPv6 and returns its type and hex representation.
 */
export function ipToHex(ip: string): { type: 'ipv4' | 'ipv6'; hex: string } {
  const cleanIp = ip.trim();
  if (cleanIp.includes(':')) {
    return { type: 'ipv6', hex: ipv6ToHex(cleanIp) };
  } else if (cleanIp.includes('.')) {
    return { type: 'ipv4', hex: ipv4ToHex(cleanIp) };
  }
  throw new Error(`Invalid IP address format: ${ip}`);
}
