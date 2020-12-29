export function testOutput(payload: { type: string }): void {
  if (process.env.TESTING_DATA_MODE) {
    console.log(JSON.stringify({ ...payload, time: Date.now() }));
  }
}
