interface ConfigType {
  api_server_url: string;
}

export async function getConfig(currentHost: string): Promise<ConfigType> {
  if (!currentHost) {
    throw new Error("currentHost is required to fetch config");
  }
  if (
    !currentHost.startsWith("http://") && !currentHost.startsWith("https://")
  ) {
    throw new Error("currentHost must start with http:// or https://");
  }

  const response = await fetch(`${currentHost}/config.json`);
  const config = await response.json();
  return config;
}
