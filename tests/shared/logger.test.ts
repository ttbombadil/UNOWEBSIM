import { Logger } from '../../shared/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger('TestSender');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log only the message for TEST level', () => {
    const msg = 'test message';
    logger.test(msg);
    expect(consoleSpy).toHaveBeenCalledWith(msg);
  });

  it.each([
    ['info', 'INFO'],
    ['warn', 'WARN'],
    ['error', 'ERROR'],
    ['debug', 'DEBUG'],
  ])('should log correct format for %s level', (methodName, level) => {
    const msg = 'hello world';
    const now = new Date();

    // Mock Date to fix timestamp
    const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => ({
      toISOString: () => 'fixed-timestamp',
    } as any));

    (logger as any)[methodName](msg);

    expect(consoleSpy).toHaveBeenCalledWith(`[fixed-timestamp][${level}][TestSender] ${msg}`);

    dateSpy.mockRestore();
  });
});