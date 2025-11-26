// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

const monorepoPackages = {
	'@reguroute/types': path.resolve(workspaceRoot, 'packages/types'),
};

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, 'node_modules'),
	path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Use monorepo packages as direct modules
config.resolver.extraNodeModules = monorepoPackages;

module.exports = config;
