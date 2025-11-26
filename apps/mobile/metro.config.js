// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot, {
	// Enable CSS support.
	isCSSEnabled: true,
});

const monorepoPackages = {
	'@reguroute/types': path.resolve(workspaceRoot, 'packages/types'),
};

// 1. Watch all files in the monorepo
config.watchFolders = [projectRoot, ...Object.values(monorepoPackages)];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// 3. Force Metro to resolve (sub)dependencies only from the top-level
config.resolver.disableHierarchicalLookup = false;

// 4. Use monorepo packages as direct modules
config.resolver.extraNodeModules = monorepoPackages;

// 5. Clear Metro cache on every run for stability in monorepos
config.cacheStores = [
	new FileStore({
		root: path.join(projectRoot, 'node_modules', '.cache', 'metro'),
	}),
];

module.exports = config;