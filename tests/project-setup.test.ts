/**
 * Phase 1: Project Setup - Test Specifications
 * 
 * This test file verifies that the project has been properly initialized
 * with all required configuration files, dependencies, and directory structure.
 * 
 * @see TDG.md for testing framework details (Vitest)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();

describe('Phase 1: Project Setup', () => {
  
  describe('package.json', () => {
    let packageJson: Record<string, unknown> | null = null;

    beforeAll(() => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const content = fs.readFileSync(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(content);
      }
    });

    it('should exist', () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      expect(fs.existsSync(packageJsonPath), 'package.json should exist').toBe(true);
    });

    it('should have required production dependencies', () => {
      expect(packageJson).to.not.be.null;
      
      const dependencies = packageJson!.dependencies as Record<string, string>;
      
      expect(dependencies, 'dependencies should be defined').to.not.be.undefined;
      expect(dependencies['@modelcontextprotocol/server'], 
        '@modelcontextprotocol/server should be installed').to.be.a('string');
      expect(dependencies['pocketbase'], 
        'pocketbase should be installed').to.be.a('string');
      expect(dependencies['zod'], 
        'zod should be installed').to.be.a('string');
    });

    it('should have required dev dependencies', () => {
      expect(packageJson).to.not.be.null;
      
      const devDependencies = packageJson!.devDependencies as Record<string, string>;
      
      expect(devDependencies, 'devDependencies should be defined').to.not.be.undefined;
      expect(devDependencies['typescript'], 
        'typescript should be installed').to.be.a('string');
      expect(devDependencies['vitest'], 
        'vitest should be installed').to.be.a('string');
      expect(devDependencies['@types/node'], 
        '@types/node should be installed').to.be.a('string');
    });

    it('should have required scripts', () => {
      expect(packageJson).to.not.be.null;
      
      const scripts = packageJson!.scripts as Record<string, string>;
      
      expect(scripts, 'scripts should be defined').to.not.be.undefined;
      
      // Required scripts as per TDG.md
      expect(scripts['build'], 'build script should be defined').to.be.a('string');
      expect(scripts['start'], 'start script should be defined').to.be.a('string');
      expect(scripts['dev'], 'dev script should be defined').to.be.a('string');
      expect(scripts['test'], 'test script should be defined').to.be.a('string');
      expect(scripts['test:watch'], 'test:watch script should be defined').to.be.a('string');
      expect(scripts['test:integration'], 'test:integration script should be defined').to.be.a('string');
      expect(scripts['lint'], 'lint script should be defined').to.be.a('string');
      expect(scripts['format'], 'format script should be defined').to.be.a('string');
    });

    it('should have correct build script (tsc)', () => {
      expect(packageJson).to.not.be.null;
      
      const scripts = packageJson!.scripts as Record<string, string>;
      expect(scripts['build']).to.include('tsc');
    });

    it('should have correct dev script (tsx)', () => {
      expect(packageJson).to.not.be.null;
      
      const scripts = packageJson!.scripts as Record<string, string>;
      expect(scripts['dev']).to.include('tsx');
    });

    it('should use vitest for test script', () => {
      expect(packageJson).to.not.be.null;
      
      const scripts = packageJson!.scripts as Record<string, string>;
      expect(scripts['test']).to.include('vitest');
    });
  });

  describe('tsconfig.json', () => {
    let tsconfig: Record<string, unknown> | null = null;

    beforeAll(() => {
      const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        const content = fs.readFileSync(tsconfigPath, 'utf-8');
        tsconfig = JSON.parse(content);
      }
    });

    it('should exist', () => {
      const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath), 'tsconfig.json should exist').toBe(true);
    });

    it('should target ES2022', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['target'], 'target should be ES2022').to.equal('ES2022');
    });

    it('should use ESM modules', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['module'], 'module should be ES2022 or NodeNext').to.match(/^(ES2022|NodeNext)$/);
    });

    it('should have strict mode enabled', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['strict'], 'strict should be true').to.equal(true);
    });

    it('should have esModuleInterop enabled', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['esModuleInterop'], 'esModuleInterop should be true').to.equal(true);
    });

    it('should have skipLibCheck enabled', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['skipLibCheck'], 'skipLibCheck should be true').to.equal(true);
    });

    it('should have outDir configured', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['outDir'], 'outDir should be defined').to.equal('./dist');
    });

    it('should have rootDir configured', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['rootDir'], 'rootDir should be defined').to.equal('./src');
    });

    it('should have declaration enabled', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['declaration'], 'declaration should be true').to.equal(true);
    });

    it('should have moduleResolution configured', () => {
      expect(tsconfig).to.not.be.null;
      
      const compilerOptions = tsconfig!.compilerOptions as Record<string, unknown>;
      expect(compilerOptions['moduleResolution'], 'moduleResolution should be defined').to.match(/^(bundler|NodeNext|Node)$/);
    });
  });

  describe('Directory Structure', () => {
    it('src directory should exist', () => {
      const srcDir = path.join(PROJECT_ROOT, 'src');
      expect(fs.existsSync(srcDir), 'src/ directory should exist').toBe(true);
      expect(fs.statSync(srcDir).isDirectory(), 'src should be a directory').toBe(true);
    });

    it('tests directory should exist', () => {
      const testsDir = path.join(PROJECT_ROOT, 'tests');
      expect(fs.existsSync(testsDir), 'tests/ directory should exist').toBe(true);
      expect(fs.statSync(testsDir).isDirectory(), 'tests should be a directory').toBe(true);
    });

    it('src directory should have index.ts entry point', () => {
      const indexPath = path.join(PROJECT_ROOT, 'src', 'index.ts');
      expect(fs.existsSync(indexPath), 'src/index.ts should exist').toBe(true);
    });
  });

  describe('Build Verification', () => {
    it('npm run build should compile without errors', () => {
      // This test verifies that the build command works
      // It may take some time to run
      try {
        execSync('npm run build', { 
          cwd: PROJECT_ROOT, 
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 120000 // 2 minute timeout
        });
        
        // If we get here, build succeeded
        expect(true).toBe(true);
      } catch (error: unknown) {
        const execError = error as { message?: string; stderr?: string; status?: number };
        const errorMessage = execError.message || execError.stderr || 'Build failed';
        const exitCode = execError.status ?? 'unknown';
        
        // Fail with clear message
        expect(`Build succeeded`).to.equal(`Build failed with exit code ${exitCode}: ${errorMessage}`);
      }
    });

    it('dist directory should exist after build', () => {
      const distDir = path.join(PROJECT_ROOT, 'dist');
      expect(fs.existsSync(distDir), 'dist/ directory should exist after build').toBe(true);
    });

    it('JavaScript files should be generated in dist', () => {
      const distDir = path.join(PROJECT_ROOT, 'dist');
      
      // Check that dist directory has at least one .js file
      if (fs.existsSync(distDir)) {
        const files = fs.readdirSync(distDir);
        const jsFiles = files.filter(f => f.endsWith('.js'));
        expect(jsFiles.length, 'dist should contain compiled JavaScript files').to.be.greaterThan(0);
      }
    });
  });

  describe('Node Modules', () => {
    it('node_modules should exist (dependencies installed)', () => {
      const nodeModules = path.join(PROJECT_ROOT, 'node_modules');
      expect(fs.existsSync(nodeModules), 'node_modules should exist').toBe(true);
    });

    it('pocketbase should be in node_modules', () => {
      const pocketbasePath = path.join(PROJECT_ROOT, 'node_modules', 'pocketbase');
      expect(fs.existsSync(pocketbasePath), 'pocketbase should be installed in node_modules').toBe(true);
    });

    it('@modelcontextprotocol/server should be in node_modules', () => {
      const mcpPath = path.join(PROJECT_ROOT, 'node_modules', '@modelcontextprotocol', 'server');
      expect(fs.existsSync(mcpPath), '@modelcontextprotocol/server should be installed').toBe(true);
    });

    it('zod should be in node_modules', () => {
      const zodPath = path.join(PROJECT_ROOT, 'node_modules', 'zod');
      expect(fs.existsSync(zodPath), 'zod should be installed in node_modules').toBe(true);
    });
  });

  describe('Negative Tests - Missing Files', () => {
    it('should NOT have package.json at root (fails if exists but invalid)', () => {
      // This is a sanity check - if package.json exists but is invalid JSON, fail
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const content = fs.readFileSync(packageJsonPath, 'utf-8');
        expect(() => JSON.parse(content), 'package.json should be valid JSON').to.not.throw();
      }
    });

    it('should NOT have invalid tsconfig.json', () => {
      const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        const content = fs.readFileSync(tsconfigPath, 'utf-8');
        expect(() => JSON.parse(content), 'tsconfig.json should be valid JSON').to.not.throw();
      }
    });
  });
});