export function atob(encoded: string): string {
  const result = Buffer.from(encoded, "base64").toString("binary");
  return result;
}

export function btoa(input: string): string {
  return Buffer.from(input, "binary").toString("base64");
}
