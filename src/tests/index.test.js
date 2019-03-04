import { createConfig } from '../index';

describe('createConfig', () => {
  it('should have reject array', () => {
    const config = createConfig();
    expect(config.reject.length).toBeDefined();
    expect(config.reject instanceof Array).toBe(true);
  });
  it('should accept user config', () => {
    const config = createConfig({
      reject: ['something'],
    });
    expect(config.reject.includes('something')).toBe(true);
  });
});
