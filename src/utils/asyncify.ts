const asyncify =
  <Args extends unknown[], R>(fn: (...args: Args) => R) =>
  async (...args: Args): Promise<R> =>
    fn(...args);

export default asyncify;
