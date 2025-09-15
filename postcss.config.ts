module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},  // 只保留这个，删除 tailwindcss: {}
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: { preset: 'default' },
        }
      : {}),
  },
};