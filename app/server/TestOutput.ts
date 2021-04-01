export function testOutput(payload: Record<string, any>): void {
  if (process.env.TESTING_DATA_MODE) {
    console.log(JSON.stringify({ ...payload, time: Date.now() }))
  }
}
