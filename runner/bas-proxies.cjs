/**
 * BAS Proxy Configuration
 * Two Rebel mobile proxies for load balancing
 * 
 * Note: Simple format without http:// prefix and without URL encoding
 * The Remote Browser API handles protocol internally
 */

const BAS_PROXIES = [
  {
    id: 'rebel-mobile-11',
    name: 'Rebel mobile 6903:8058',
    // Simple format: username:password@host:port
    // Username contains semicolon: ottovisits;p=1
    // Password: LfjlMN)S*Cy74*_r (special chars allowed)
    proxy: 'ottovisits;p=1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
  },
  {
    id: 'rebel-mobile-23',
    name: 'Rebel mobile 6903:8072',
    proxy: 'ottovisits;p=2:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
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
