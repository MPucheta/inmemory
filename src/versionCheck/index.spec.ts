import version from '.';

describe('The versioncheck utility', () => {
  it('should return 0.0.1 if hardcoded', () => {
    expect(version()).toBe('0.0.1');
  });
});
