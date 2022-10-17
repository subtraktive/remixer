import express, {Request, Response} from 'express';
import fs, { read, writeFileSync, WriteStream } from 'fs';
import { basename } from 'path';
import StreamLimiter from '../util';

const crypto = require('crypto');
const A = require('arcsecond');
const B = require('arcsecond-binary');
const wav = require('wav');
const router = express.Router()
const LIMIT_RATE = 4; // 5 kb per ms
const util = require('util');
const Transform = require('stream').Transform;

const riffChunk = A.sequenceOf([
    A.str('RIFF'),
    B.u32LE,
    A.str('WAVE')
])

import { Stream, Writable } from 'stream';

interface instrumentMapType {
    [instrumentID: number]: string
}

interface audioConfigType {
    [instrumentName: string]: string
}

const instrumentMap: instrumentMapType = {
    1: "drums",
    2: "bass",
    3: "lead",
    4: "pads"
}

const audioConfig: audioConfigType = {
    'bass': __dirname + '/../../../audio/BASS_FULL.wav',
    'drums': __dirname + '/../../../audio/DRUMS_FULL.wav'
}

const getFilePath = (id: number) => {
    return audioConfig[instrumentMap[id]]
}


router.get('/', (req: Request, res: Response) => {
    console.log('API SHOULD GET CALLED')
    res.json({ data: 10 })
})

interface readerObjType {
    [key: number]: any
  }
  
const readerObj:readerObjType = {}

class UpdateHeader {
    constructor(options?: any){
        Transform.call(this, options);
    }

    _transform(chunk: any, encoding: any, cb: Function) {
        console.log("GOT CHUNK -----------------", chunk, " with encoding", encoding)
        cb(null, chunk)
    }
}
util.inherits(UpdateHeader, Transform);

const updateTheEmptyFile = (file: WriteStream, id: number, res: Response) => {
    // WRITE TO WRITABLE STR   AM HERE 
    const path = getFilePath(id)
    let count = 0;
    const readFile = fs.createReadStream(path, { highWaterMark: 1024*44 }); // 44kb so that we get the headers first

    const stat = fs.statSync(path)
    res.setHeader('Content-Length', stat.size)
    readFile.on('data', (chunk: any) => {
        count++;
        if(count == 1) {
            console.log("THE FIRST SET OF HEADERS GOT HERE", chunk.buffer)
            let out  = riffChunk.run(chunk.buffer)
            if(out.isError){
                console.log("SOMETHIGN WENT WRONT WITH FHEADE", out.error)
            }
        } 
    })
    readFile.pipe(file)
    //readFile.pipe(readerObj[id]).pipe(file)
}

const fileRef = new Map()

let count = 0;

router.get('/track/meta', async(req: Request, res: Response) => {
    count = 0
    const {duration, genre, type} = req.query
    if(!duration || !genre){
        res.status(400).send({
            'error': 'Please provide duration and genre'
        })
        return
    }
    const trackId = crypto.randomUUID()
    const trackMapping = new Map()
    const trackCount = 2;// Math.floor(Math.max(Math.random()*5,2))
    const layers = []
    for(let i = 0; i < trackCount; i++){
        let layerId = crypto.randomUUID()
        let id = `layer-${layerId}`
        count++
        if(type == "remix-1") {
            layers.push(id)
        } else {
            let writeFile = fs.createWriteStream(`audio/audio-${layerId}.mp3`)
            layers.push(`/audio/audio-${layerId}.mp3`)
            updateTheEmptyFile(writeFile, count, res )
        }
        //const stat = fs.statSync(`audio/audio-${layerId}.mp3`)
        //console.log(`THE CONTENT SIZE for EMPTY ---------------------- ID: ${layerId} is`, stat.size)
    }
    count=0;
    trackMapping.set('duration', duration)
    trackMapping.set('genre', genre)
    trackMapping.set('layers', layers)
    trackMapping.set('id', trackId)
    fileRef.set(trackId, trackMapping)
    //res.setHeader("Content-Type", "audio/mpeg")
    res.status(200).send(Object.fromEntries(trackMapping))
})

router.get('/stream/sample/:limit', async(req: Request, res: Response) => {
    const shouldLimit = req.params.limit;
    const readFile = fs.createReadStream(getFilePath(1));
    if(shouldLimit == "limit") {
        const limiter = new StreamLimiter()
        const rand = Math.random()*100
        res.setHeader("Content-Type", "audio/wav")
        limiter.setLimit(rand > 40 ? LIMIT_RATE: 5)
        readFile.pipe(limiter).pipe(res);
    } else {
        readFile.pipe(res);
    }

})

const FileWriter = require('wav').FileWriter;

router.get('/stream/:layerId', async(req: Request, res: Response) => {
    let chunkLength = 64 * 1024; // default chunk size, can be increased using highWaterMark
    let chunkCount = 0;
    const id = req.params.layerId;
    console.log("STREAMING AUDIO =========", id )
    count++;
    try {
        const writeFile = fs.createWriteStream(`audio/audio-${id}.wav`)
        const limiter = new StreamLimiter()
        const rand = Math.random()*100
        console.log("RAND IS", rand);
        limiter.setLimit(rand > 40 ? LIMIT_RATE: 5)
        res.setHeader("Content-Type", "audio/wav; charset=utf-8")
        writeFile.on('pipe', (data: any) => {
            chunkCount++
            chunkLength *= chunkCount;
            data.pipe(res)
        })

       updateTheEmptyFile(writeFile, count, res )

    } catch (e) {
        console.error("THE E IS", e);
    }
    

})

router.get('/track/:id', async(req: Request, res: Response) => {
    const trackid = req.params.id;
    const trackData = fileRef.get(trackid)
    if(!trackData) {
        res.status(404).send({
            "error": "Track not found"
        })
    }else {
        res.status(200).send(Object.fromEntries(trackData))
    }
})

export default router;