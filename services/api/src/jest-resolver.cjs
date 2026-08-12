const path = require('path');

module.exports = (request, options) => {
  // Handle relative imports with .js extension from generated Prisma client
  if (request.startsWith('./') && request.endsWith('.js')) {
    const basedir = options.basedir;
    // Check if the importing file is in the generated/prisma directory
    if (basedir.includes('generated/prisma')) {
      const tsRequest = request.replace(/\.js$/, '.ts');
      const resolvedPath = path.resolve(basedir, tsRequest);
      if (require('fs').existsSync(resolvedPath)) {
        return resolvedPath;
      }
    }
  }
  // Default resolution
  return options.defaultResolver(request, options);
};