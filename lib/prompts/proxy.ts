
export async function setProxy() {
    const proxyUrl = process.env.PROXY_URL
      || process.env.https_proxy
      || process.env.HTTP_PROXY
      || process.env.http_proxy
    if (proxyUrl) {
      const { setGlobalDispatcher, ProxyAgent } = await import("undici");
      const proxyAgent = new ProxyAgent(proxyUrl);
      setGlobalDispatcher(proxyAgent);
    }
  }