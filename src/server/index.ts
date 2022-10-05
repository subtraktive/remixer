import express, {Application, Request, Response, NextFunction} from 'express'
import fs from 'fs'
import api from './api/index'
// import path from 'path'
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';
// const __dirname = dirname(fileURLToPath(
//     import.meta.url));
// import webpack from 'webpack';
// import webpackDevMiddleware from 'webpack-dev-middleware';
// import config from '../../webpack.config.js';
// const compiler = webpack(config)
console.log("NODEMON NOT WORKING ")

const app: Application = express();



app.use('/api', api)
app.use(express.static('public'));
app.use('/audio', express.static('audio'))
// app.use("/audio", express.static("audio"));
app.listen(3000)
console.log("STARTED SERVER AT 3000")