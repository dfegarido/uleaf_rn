import { on, off, emit } from '../notificationEvents';

describe('notificationEvents', () => {
  it('calls registered listeners when their event is emitted', () => {
    const fn = jest.fn();
    on('tap', fn);
    emit('tap', { sessionId: 'abc' });
    expect(fn).toHaveBeenCalledWith({ sessionId: 'abc' });
  });

  it('does not call listeners of a different event', () => {
    const fn = jest.fn();
    on('tap', fn);
    emit('other', 'x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('removes a listener with off()', () => {
    const fn = jest.fn();
    on('tap', fn);
    off('tap', fn);
    emit('tap', 'x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('emitting with no listeners is a no-op', () => {
    expect(() => emit('nobody', 'x')).not.toThrow();
  });
});
