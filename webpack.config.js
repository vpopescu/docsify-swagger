const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
    context: path.join(__dirname, "src"),
    entry: {
        "docsify-swagger.min": ["./index.js", "./style.css"],
        "docsify-swagger": ["./index.js", "./style.css"],

    },

    module: {
        rules: [{
            test: /.s?css$/,
            use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
        }],
    },

    mode: "production",
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({ include: /\.min\.js$/ }),
            new CssMinimizerPlugin({ include: /\.min\.css$/ }),
        ]
    },

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "umd",
        umdNamedDefine: true
    },

    plugins: [new MiniCssExtractPlugin()],

    cache: true

};