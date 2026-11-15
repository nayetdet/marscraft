const isGitHubPagesBuild = process.env.BUILD_TARGET === 'github-pages';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isGitHubPagesBuild
    ? {
        output: 'export',
        basePath: '/marscraft',
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
