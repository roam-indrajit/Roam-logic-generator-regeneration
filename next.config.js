/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ASSISTANT_ID: process.env.ASSISTANT_ID,
    },
  };
  
  module.exports = nextConfig;
  