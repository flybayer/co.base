export function getRandomNumbers(size: number): string {
  let result = "";
  for (let i = 0; i < size; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}
