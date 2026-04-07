import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('os', () => ({
  default: {
    homedir: vi.fn(() => '/home/testuser'),
  },
  homedir: vi.fn(() => '/home/testuser'),
}));

import fs from 'fs';
import os from 'os';

// Import the module under test (will fail initially)
import { loadConfig, validateConfig, type Config } from '../src/config.js';

describe('Configuration Layer', () => {
  // Store original env and argv
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalArgv = [...process.argv];
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Default mock implementations
    (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  afterEach(() => {
    // Restore original env and argv
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  describe('Config Interface', () => {
    it('should have correct shape with url, adminToken, and readOnly fields', () => {
      const config: Config = {
        url: 'http://localhost:8090',
        adminToken: 'test-token',
        readOnly: false,
      };

      expect(config).toHaveProperty('url');
      expect(config).toHaveProperty('adminToken');
      expect(config).toHaveProperty('readOnly');
      expect(typeof config.url).toBe('string');
      expect(typeof config.adminToken).toBe('string');
      expect(typeof config.readOnly).toBe('boolean');
    });
  });

  describe('loadConfig() - Priority Resolution', () => {
    describe('Happy Path - Config from various sources', () => {
      it('should load config from CLI args when provided', () => {
        process.argv = [
          'node',
          'index.js',
          '--url', 'http://cli.example.com:8090',
          '--admin-token', 'cli-token',
          '--readonly',
        ];

        const config = loadConfig();

        expect(config.url).toBe('http://cli.example.com:8090');
        expect(config.adminToken).toBe('cli-token');
        expect(config.readOnly).toBe(true);
      });

      it('should load config from env vars when CLI not provided', () => {
        process.argv = ['node', 'index.js'];
        process.env.POCKETBASE_URL = 'http://env.example.com:8090';
        process.env.POCKETBASE_ADMIN_TOKEN = 'env-token';
        process.env.POCKETBASE_READONLY = 'true';

        const config = loadConfig();

        expect(config.url).toBe('http://env.example.com:8090');
        expect(config.adminToken).toBe('env-token');
        expect(config.readOnly).toBe(true);
      });

      it('should load config from file when CLI and env not provided', () => {
        process.argv = ['node', 'index.js'];
        delete process.env.POCKETBASE_URL;
        delete process.env.POCKETBASE_ADMIN_TOKEN;
        delete process.env.POCKETBASE_READONLY;

        (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
          if (path === './.pocketbase-mcp.json') return true;
          return false;
        });

        (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
          JSON.stringify({
            url: 'http://file.example.com:8090',
            adminToken: 'file-token',
            readOnly: false,
          })
        );

        const config = loadConfig();

        expect(config.url).toBe('http://file.example.com:8090');
        expect(config.adminToken).toBe('file-token');
        expect(config.readOnly).toBe(false);
      });

      it('should use default readOnly: false when not specified', () => {
        process.argv = ['node', 'index.js', '--url', 'http://localhost:8090', '--admin-token', 'token'];

        const config = loadConfig();

        expect(config.readOnly).toBe(false);
      });
    });

    describe('Priority Resolution - CLI > Env > File', () => {
      it('should prioritize CLI args over env vars', () => {
        process.argv = [
          'node',
          'index.js',
          '--url', 'http://cli优先级.com:8090',
          '--admin-token', 'cli-priority-token',
        ];
        process.env.POCKETBASE_URL = 'http://env优先级.com:8090';
        process.env.POCKETBASE_ADMIN_TOKEN = 'env-priority-token';

        const config = loadConfig();

        expect(config.url).toBe('http://cli优先级.com:8090');
        expect(config.adminToken).toBe('cli-priority-token');
      });

      it('should prioritize env vars over config file', () => {
        process.argv = ['node', 'index.js'];
        process.env.POCKETBASE_URL = 'http://env优先级.com:8090';
        process.env.POCKETBASE_ADMIN_TOKEN = 'env-priority-token';

        (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
          if (path === './.pocketbase-mcp.json') return true;
          return false;
        });

        (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
          JSON.stringify({
            url: 'http://file.example.com:8090',
            adminToken: 'file-token',
          })
        );

        const config = loadConfig();

        expect(config.url).toBe('http://env优先级.com:8090');
        expect(config.adminToken).toBe('env-priority-token');
      });

      it('should allow partial CLI overrides - only url from CLI, rest from env', () => {
        process.argv = ['node', 'index.js', '--url', 'http://cli-only-url.com:8090'];
        process.env.POCKETBASE_ADMIN_TOKEN = 'env-token-only';

        const config = loadConfig();

        expect(config.url).toBe('http://cli-only-url.com:8090');
        expect(config.adminToken).toBe('env-token-only');
      });
    });

    describe('Config File Loading - Multiple Locations', () => {
      it('should check project-local config first (./.pocketbase-mcp.json)', () => {
        process.argv = ['node', 'index.js'];
        delete process.env.POCKETBASE_URL;
        delete process.env.POCKETBASE_ADMIN_TOKEN;
        delete process.env.POCKETBASE_READONLY;

        (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
          if (path === './.pocketbase-mcp.json') return true;
          return false;
        });

        (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
          JSON.stringify({
            url: 'http://project-local.com:8090',
            adminToken: 'project-token',
          })
        );

        const config = loadConfig();

        expect(config.url).toBe('http://project-local.com:8090');
      });

      it('should check XDG config if project-local not found ($XDG_CONFIG_HOME/pocketbase-mcp/config.json)', () => {
        process.argv = ['node', 'index.js'];
        delete process.env.POCKETBASE_URL;
        delete process.env.POCKETBASE_ADMIN_TOKEN;
        delete process.env.POCKETBASE_READONLY;

        process.env.XDG_CONFIG_HOME = '/custom/config';

        (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
          if (path === './.pocketbase-mcp.json') return false;
          if (path === '/custom/config/pocketbase-mcp/config.json') return true;
          return false;
        });

        (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
          JSON.stringify({
            url: 'http://xdg-config.com:8090',
            adminToken: 'xdg-token',
          })
        );

        const config = loadConfig();

        expect(config.url).toBe('http://xdg-config.com:8090');
      });

      it('should check global config if XDG not found (~/.pocketbase-mcp.json)', () => {
        process.argv = ['node', 'index.js'];
        delete process.env.POCKETBASE_URL;
        delete process.env.POCKETBASE_ADMIN_TOKEN;
        delete process.env.POCKETBASE_READONLY;

        delete process.env.XDG_CONFIG_HOME;

        (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
          if (path === './.pocketbase-mcp.json') return false;
          if (path.includes('.config/pocketbase-mcp/config.json')) return false;
          if (path === '/home/testuser/.pocketbase-mcp.json') return true;
          return false;
        });

        (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
          JSON.stringify({
            url: 'http://global-config.com:8090',
            adminToken: 'global-token',
          })
        );

        const config = loadConfig();

        expect(config.url).toBe('http://global-config.com:8090');
      });

      it('should use first available config file with correct priority order', () => {
        process.argv = ['node', 'index.js'];
        delete process.env.POCKETBASE_URL;
        delete process.env.POCKETBASE_ADMIN_TOKEN;
        delete process.env.POCKETBASE_READONLY;

        // All three config files exist - should use project-local first
        (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
          if (path === './.pocketbase-mcp.json') return true; // First priority
          if (path.includes('.config/pocketbase-mcp/config.json')) return true;
          if (path === '/home/testuser/.pocketbase-mcp.json') return true;
          return false;
        });

        // Track which file is read
        let readCount = 0;
        (fs.readFileSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
          readCount++;
          if (path === './.pocketbase-mcp.json') {
            return JSON.stringify({
              url: 'http://project.com:8090',
              adminToken: 'project-token',
            });
          }
          return JSON.stringify({
            url: 'http://fallback.com:8090',
            adminToken: 'fallback-token',
          });
        });

        const config = loadConfig();

        // Should use project-local since it exists
        expect(config.url).toBe('http://project.com:8090');
      });
    });
  });

  describe('validateConfig() - Validation', () => {
    describe('Happy Path - Valid Configs', () => {
      it('should pass validation for valid config with all fields', () => {
        const config: Config = {
          url: 'http://localhost:8090',
          adminToken: 'valid-token-123',
          readOnly: false,
        };

        expect(() => validateConfig(config)).not.toThrow();
      });

      it('should pass validation for valid config with readOnly: true', () => {
        const config: Config = {
          url: 'https://pocketbase.example.com',
          adminToken: 'admin-token',
          readOnly: true,
        };

        expect(() => validateConfig(config)).not.toThrow();
      });

      it('should pass validation for localhost HTTP URL', () => {
        const config: Config = {
          url: 'http://127.0.0.1:8090',
          adminToken: 'token',
          readOnly: false,
        };

        expect(() => validateConfig(config)).not.toThrow();
      });

      it('should pass validation for HTTPS URL', () => {
        const config: Config = {
          url: 'https://secure.example.com',
          adminToken: 'token',
          readOnly: false,
        };

        expect(() => validateConfig(config)).not.toThrow();
      });
    });

    describe('Validation Errors - Missing Required Fields', () => {
      it('should throw error when URL is missing', () => {
        const config: Config = {
          url: '',
          adminToken: 'valid-token',
          readOnly: false,
        };

        expect(() => validateConfig(config)).toThrow('URL is required');
      });

      it('should throw error when adminToken is missing', () => {
        const config: Config = {
          url: 'http://localhost:8090',
          adminToken: '',
          readOnly: false,
        };

        expect(() => validateConfig(config)).toThrow('Admin token is required');
      });

      it('should throw error when adminToken is whitespace only', () => {
        const config: Config = {
          url: 'http://localhost:8090',
          adminToken: '   ',
          readOnly: false,
        };

        expect(() => validateConfig(config)).toThrow('Admin token is required');
      });

      it('should throw error when URL is undefined', () => {
        const config = {
          url: undefined,
          adminToken: 'token',
          readOnly: false,
        } as unknown as Config;

        expect(() => validateConfig(config)).toThrow('URL is required');
      });

      it('should throw error when adminToken is undefined', () => {
        const config = {
          url: 'http://localhost:8090',
          adminToken: undefined,
          readOnly: false,
        } as unknown as Config;

        expect(() => validateConfig(config)).toThrow('Admin token is required');
      });
    });

    describe('Validation Errors - Invalid URL Format', () => {
      it('should throw error for invalid URL format', () => {
        const config: Config = {
          url: 'not-a-valid-url',
          adminToken: 'valid-token',
          readOnly: false,
        };

        expect(() => validateConfig(config)).toThrow('Invalid URL format');
      });

      it('should throw error for URL without protocol', () => {
        const config: Config = {
          url: 'localhost:8090',
          adminToken: 'valid-token',
          readOnly: false,
        };

        expect(() => validateConfig(config)).toThrow('Invalid URL format');
      });

      it('should throw error for URL with invalid protocol', () => {
        const config: Config = {
          url: 'ftp://localhost:8090',
          adminToken: 'valid-token',
          readOnly: false,
        };

        expect(() => validateConfig(config)).toThrow('Invalid URL format');
      });

      it('should throw error for empty URL', () => {
        const config: Config = {
          url: '',
          adminToken: 'token',
          readOnly: false,
        };

        expect(() => validateConfig(config)).toThrow('URL is required');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no config source is available', () => {
      process.argv = ['node', 'index.js'];
      delete process.env.POCKETBASE_URL;
      delete process.env.POCKETBASE_ADMIN_TOKEN;
      delete process.env.POCKETBASE_READONLY;

      // No config files exist
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      expect(() => loadConfig()).toThrow();
    });

    it('should handle malformed JSON in config file', () => {
      process.argv = ['node', 'index.js'];
      delete process.env.POCKETBASE_URL;
      delete process.env.POCKETBASE_ADMIN_TOKEN;

      (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === './.pocketbase-mcp.json') return true;
        return false;
      });

      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue('invalid-json{');

      expect(() => loadConfig()).toThrow();
    });

    it('should handle unreadable config file', () => {
      process.argv = ['node', 'index.js'];
      delete process.env.POCKETBASE_URL;
      delete process.env.POCKETBASE_ADMIN_TOKEN;

      (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === './.pocketbase-mcp.json') return true;
        return false;
      });

      (fs.readFileSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => loadConfig()).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle readOnly as string "true" from env', () => {
      process.argv = ['node', 'index.js'];
      process.env.POCKETBASE_URL = 'http://localhost:8090';
      process.env.POCKETBASE_ADMIN_TOKEN = 'token';
      process.env.POCKETBASE_READONLY = 'true';

      const config = loadConfig();

      expect(config.readOnly).toBe(true);
    });

    it('should handle readOnly as string "false" from env', () => {
      process.argv = ['node', 'index.js'];
      process.env.POCKETBASE_URL = 'http://localhost:8090';
      process.env.POCKETBASE_ADMIN_TOKEN = 'token';
      process.env.POCKETBASE_READONLY = 'false';

      const config = loadConfig();

      expect(config.readOnly).toBe(false);
    });

    it('should handle readOnly as string "1" from env (truthy)', () => {
      process.argv = ['node', 'index.js'];
      process.env.POCKETBASE_URL = 'http://localhost:8090';
      process.env.POCKETBASE_ADMIN_TOKEN = 'token';
      process.env.POCKETBASE_READONLY = '1';

      const config = loadConfig();

      expect(config.readOnly).toBe(true);
    });

    it('should handle readOnly as string "0" from env (falsy)', () => {
      process.argv = ['node', 'index.js'];
      process.env.POCKETBASE_URL = 'http://localhost:8090';
      process.env.POCKETBASE_ADMIN_TOKEN = 'token';
      process.env.POCKETBASE_READONLY = '0';

      const config = loadConfig();

      expect(config.readOnly).toBe(false);
    });

    it('should handle readOnly flag without value (default true)', () => {
      process.argv = ['node', 'index.js', '--url', 'http://localhost:8090', '--admin-token', 'token', '--readonly'];

      const config = loadConfig();

      expect(config.readOnly).toBe(true);
    });

    it('should handle URL with trailing slash', () => {
      process.argv = ['node', 'index.js', '--url', 'http://localhost:8090/', '--admin-token', 'token'];

      const config = loadConfig();

      expect(config.url).toBe('http://localhost:8090/');
    });

    it('should handle URL with path', () => {
      process.argv = ['node', 'index.js', '--url', 'http://localhost:8090/api/v1/', '--admin-token', 'token'];

      const config = loadConfig();

      expect(config.url).toBe('http://localhost:8090/api/v1/');
    });

    it('should handle config file with extra fields (ignore extras)', () => {
      process.argv = ['node', 'index.js'];
      delete process.env.POCKETBASE_URL;
      delete process.env.POCKETBASE_ADMIN_TOKEN;

      (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === './.pocketbase-mcp.json') return true;
        return false;
      });

      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify({
          url: 'http://localhost:8090',
          adminToken: 'token',
          readOnly: false,
          extraField: 'should-be-ignored',
          anotherExtra: 123,
        })
      );

      const config = loadConfig();

      expect(config.url).toBe('http://localhost:8090');
      expect(config.adminToken).toBe('token');
      expect(config.readOnly).toBe(false);
    });
  });
});