// 让 Node.js 使用环境变量中的代理
import { ProxyAgent, setGlobalDispatcher } from 'undici';

const proxyUrl = process.env.https_proxy || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

if (proxyUrl) {
  console.log('[Proxy] Using proxy:', proxyUrl);
  const dispatcher = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(dispatcher);
} else {
  console.log('[Proxy] No proxy configured');
}
