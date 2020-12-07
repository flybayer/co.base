export function explodeAddress(address?: string[]): Array<{ key: string; fullAddress: string }> {
  const exploded: Array<{ key: string; fullAddress: string }> = [];
  let fullAddress = "";
  address &&
    address.forEach((key) => {
      fullAddress += `/${key}`;
      exploded.push({ key, fullAddress });
    });
  return exploded;
}
