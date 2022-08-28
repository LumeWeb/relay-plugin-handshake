import esbuild from 'esbuild'

esbuild.buildSync({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/handshake.js',
    format: 'cjs',
    bundle: true,
    platform: "node"
})
