import { classifyRemoteUid } from '../liveCohost';
import { getAgoraUid } from '../getAgoraUid';

describe('classifyRemoteUid', () => {
  it('names the seller by the uid derived from the session createdBy', () => {
    expect(classifyRemoteUid(getAgoraUid('Tv3b4PUP9UMO4puCIBEQ9L6Fzqm1'), 'Tv3b4PUP9UMO4puCIBEQ9L6Fzqm1')).toBe('seller');
  });

  it('treats any other broadcaster as the co-host', () => {
    expect(classifyRemoteUid(getAgoraUid('UZznPqzzd0hqrf8BgqGINl2CXDo2'), 'Tv3b4PUP9UMO4puCIBEQ9L6Fzqm1')).toBe('cohost');
  });

  it('gives the seller and the admin different uids', () => {
    expect(getAgoraUid('Tv3b4PUP9UMO4puCIBEQ9L6Fzqm1')).not.toBe(getAgoraUid('UZznPqzzd0hqrf8BgqGINl2CXDo2'));
  });
});
