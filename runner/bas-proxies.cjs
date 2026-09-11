/**
 * BAS Proxy Configuration
 * Two Rebel mobile proxies for load balancing
 */

const BAS_PROXIES = [
  {
    id: 'rebel-mobile-11',
    name: 'Rebel mobile 6903:8058',
    proxy: 'http://ottovisits;p=1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
  },
  {
    id: 'rebel-mobile-23',
    name: 'Rebel mobile 6903:8072',
    proxy: 'http://ottovisits;p=2:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
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
