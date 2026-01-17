const path = require('path');

module.exports = {
    entry: './src/sdk/PaymentGateway.js',
    output: {
        filename: 'checkout.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'PaymentGateway',
        libraryTarget: 'umd',
        libraryExport: 'default',
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ],
    },
    mode: 'production',
};
