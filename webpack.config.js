const path = require('path')

module.exports = {
    devtool: 'eval-source-map',
    mode: 'development',
    entry: './src/client/index.tsx',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public')
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            include: [path.resolve(__dirname, 'src/client')],
        }, {
            test: /\.css$/,
            use: ["style-loader", {
                loader: "css-loader",
                options: {
                    importLoaders: 1,
                    modules: true,
                },
            }],
        }]
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx', '.css']
    },
    devServer: {
        open: true,
        proxy: {
            '/api/*': {
                target: "http://localhost:3000",
                secure: false,
            }
        }
    }
}