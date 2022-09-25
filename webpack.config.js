const path = require('path')

module.exports = {
    devtool: 'eval-source-map',
    mode: 'development',
    entry: './src/client/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public')
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: 'ts-loader',
            include: [path.resolve(__dirname, 'src/client')]
        }]
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
}