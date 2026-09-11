/**
 * BAS Proxy Configuration
 * Two Rebel mobile proxies for load balancing
 * 
 * Note: Username contains semicolon (ottovisits;p=1) which must be URL-encoded
 */

const BAS_PROXIES = [
  {
    id: 'rebel-mobile-11',
    name: 'Rebel mobile 6903:8058',
    // Username: ottovisits;p=1 (encoded as %3B for semicolon, %3D for equals)
    // Password: LfjlMN)S*Cy74*_r (special chars allowed in password)
    proxy: 'http://ottovisits%3Bp%3D1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
  },
  {
    id: 'rebel-mobile-23',
    name: 'Rebel mobile 6903:8072',
    proxy: 'http://ottovisits%3Bp%3D2:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
  }
];

/**
 * Get proxy for BAS profile (round-robin)
 */
let proxyIndex = 0;
function getNextBASProxy() {
  const proxy = BAS_PROXIES[proxyIndex];
  proxyIndex = (proxyIndex + 1) % BAS_PROXIES.length;
  return proxy.proxy;
}

module.exports = {
  BAS_PROXIES,
  getNextBASProxy
};
