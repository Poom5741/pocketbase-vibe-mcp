import fs from 'fs';
import os from 'os';
import path from 'path';

export interface Config {
  url: string;
  adminToken: string;
  readOnly: boolean;
}

function parseBoolean(value: string | boolean | undefined, defaultValue: boolean = false): boolean {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  const lower = value.toLowerCase().trim();
  if (lower === 'true' || lower === '1') return true;
  if (lower === 'false' || lower === '0') return false;
  return defaultValue;
}

/**
 * Merges config sources with priority: later sources override earlier ones.
 * Priority: file < env < cli (cli has highest priority)
 */
function mergeConfigs(...sources: Partial<Config>[]): Partial<Config> {
  const result: Partial<Config> = {};
  for (const source of sources) {
    if (source.url !== undefined) result.url = source.url;
    if (source.adminToken !== undefined) result.adminToken = source.adminToken;
    if (source.readOnly !== undefined) result.readOnly = source.readOnly;
  }
  return result;
}

function getConfigFilePaths(): string[] {
  const homeDir = os.homedir();
  const xdgConfig = process.env.XDG_CONFIG_HOME;

  return [
    './.pocketbase-mcp.json',
    xdgConfig ? path.join(xdgConfig, 'pocketbase-mcp', 'config.json') : '',
    path.join(homeDir, '.pocketbase-mcp.json'),
  ].filter(Boolean);
}

function loadConfigFromFile(): Config | null {
  const filePaths = getConfigFilePaths();

  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      return {
        url: data.url || '',
        adminToken: data.adminToken || '',
        readOnly: parseBoolean(data.readOnly, false),
      };
    }
  }

  return null;
}

const CLI_ARG_MAP: Record<string, keyof Config> = {
  '--url': 'url',
  '--admin-token': 'adminToken',
  '--readonly': 'readOnly',
};

function parseCliArgs(): Partial<Config> {
  const args = process.argv.slice(2);
  const config: Partial<Config> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const configKey = CLI_ARG_MAP[arg];
    if (!configKey) continue;

    if (configKey === 'readOnly') {
      config.readOnly = true;
    } else {
      const nextArg = args[i + 1];
      if (nextArg) {
        config[configKey] = nextArg;
        i++;
      }
    }
  }

  return config;
}

function loadConfigFromEnv(): Partial<Config> {
  return {
    url: process.env.POCKETBASE_URL,
    adminToken: process.env.POCKETBASE_ADMIN_TOKEN,
    readOnly: parseBoolean(process.env.POCKETBASE_READONLY, false),
  };
}

export function loadConfig(): Config {
  const fileConfig = loadConfigFromFile() || { url: '', adminToken: '', readOnly: false };
  const envConfig = loadConfigFromEnv();
  const cliConfig = parseCliArgs();

  const merged = mergeConfigs(fileConfig, envConfig, cliConfig);

  const config: Config = {
    url: merged.url || '',
    adminToken: merged.adminToken || '',
    readOnly: merged.readOnly ?? false,
  };

  if (!config.url || !config.adminToken) {
    throw new Error('No configuration found. Please provide config via CLI args, environment variables, or config file.');
  }

  return config;
}

export function validateConfig(config: Config): void {
  if (!config.url || config.url.trim() === '') {
    throw new Error('URL is required');
  }

  if (!config.adminToken || config.adminToken.trim() === '') {
    throw new Error('Admin token is required');
  }

  try {
    const url = new URL(config.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid URL format');
    }
  } catch {
    throw new Error('Invalid URL format');
  }
}