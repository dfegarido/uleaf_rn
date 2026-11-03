import { optimisticCartCodes, optimisticCartCount } from '../liveCart';

test('optimistic add and remove apply on top of the server cart', () => {
  const server = [{ plantCode: 'A' }, { plantCode: 'B' }];
  const codes = optimisticCartCodes(server, { C: true, A: false });
  expect([...codes].sort()).toEqual(['B', 'C']);
  expect(optimisticCartCount(server, codes)).toBe(2);
  expect(optimisticCartCount(server, optimisticCartCodes(server, {}))).toBe(2);
  expect(optimisticCartCount(server, optimisticCartCodes(server, { C: true }))).toBe(3);
});
