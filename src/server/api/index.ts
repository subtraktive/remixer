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


// const UpdateHeader = (options?: any)  => {
    
//     Transform.call(this, options);
// }


// UpdateHeader.prototype._transform = function(chunk: any, encoding: any, cb: Function) {
//   // do something with chunk, then pass a modified chunk (or not)
//   // to the downstream
//   cb(null, chunk);
// };





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
    'bass': __dirname + '/../../../audio/Bass-1.wav',
    'drums': __dirname + '/../../../audio/DRUMS-1.wav'
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
    // if(!readerObj[id]){
    //     readerObj[id] = new wav.Reader()
    // }

    // readerObj[id].on('format', function (format: any) {

    //     // the WAVE header is stripped from the output of the reader
    //     console.log("GOT FORMATE", format)
    //     //readerObj[id].pipe(file);
        
    //     //format.pipe(file)
    // });

    // readerObj[id].once('readable', function () {
    //     console.log('WaveHeader Size:\t%d', 12);
    //     console.log('ChunkHeader Size:\t%d', 8);
    //     console.log('FormatChunk Size:\t%d', readerObj[id].subchunk1Size);
    //     console.log('RIFF ID:\t%s', readerObj[id].riffId);
    //     console.log('Total Size:\t%d', readerObj[id].chunkSize);
    //     console.log('Wave ID:\t%s', readerObj[id].waveId);
    //     console.log('Chunk ID:\t%s', readerObj[id].chunkId);
    //     console.log('Chunk Size:\t%d', readerObj[id].subchunk1Size);
    //     console.log('Compression format is of type: %d', readerObj[id].audioFormat);
    //     console.log('Channels:\t%d', readerObj[id].channels);
    //     console.log('Sample Rate:\t%d', readerObj[id].sampleRate);
    //     console.log('Bytes / Sec:\t%d', readerObj[id].byteRate);
    //     console.log('wBlockAlign:\t%d', readerObj[id].blockAlign);
    //     console.log('Bits Per Sample Point:\t%d', readerObj[id].bitDepth);
    //     // TODO: this should end up being "44" or whatever the total length of the WAV
    //     //       header is. maybe emit "format" at this point rather than earlier???
    //     console.log('wavDataPtr: %d', 0);
    //     console.log('wavDataSize: %d', readerObj[id].subchunk2Size);
    //     console.log();
    //     //readerObj[id].pipe(file);
    //   });

    //   readerObj[id].on('chunk', function (format: any) {

    //     // the WAVE header is stripped from the output of the reader
    //     console.log("GOT CHUNK", format)
    //     //readerObj[id].pipe(file);
        
    //     //format.pipe(file)
    // });
      

    const stat = fs.statSync(path)
    console.log(`THE CONTENT SIZE for ID: ${id} is`, stat.size)
    res.setHeader('Content-Length', stat.size)
    readFile.on('data', (chunk: any) => {
        //console.log("GOT CHUCNK LENGHT OF RED ######################", chunk.buffer, " and the multiplye is", 44 * 1024)
        //chunk.pipe(readFile)
        //chunk.pipe(file)
        count++;
       if(count == 1) {
            console.log("THE FIRST SET OF HEADERS GOT HERE", chunk.buffer)
            let out  = riffChunk.run(chunk.buffer)
            if(out.isError){
                console.log("SOMETHIGN WENT WRONT WITH FHEADE", out.error)
            }
            // var buffer = Buffer.from(chunk);
            // var result = buffer.readUIntLE(0, chunk.length)
            //console.log(" OR AYA _++++++++++++++++++++++++++++++", result)
        } else {
            //console.log("REST OF BUFFER ########################################", chunk.buffer)
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

        // var outputFileStream = new wav.FileWriter(`audio/audio-${id}.wav`, {
        //     sampleRate: 44100,
        //     channels: 2
        //   });

        const writeFile = fs.createWriteStream(`audio/audio-${id}.wav`)
        const limiter = new StreamLimiter()
        const rand = Math.random()*100
        console.log("RAND IS", rand);
        limiter.setLimit(rand > 40 ? LIMIT_RATE: 5)
        //const { stream, mime } = await getMimeType(writeFile);
        res.setHeader("Content-Type", "audio/wav; charset=utf-8")
        //res.setHeader("Content-Transfer-Encoding", "binary")
        writeFile.on('pipe', (data: any) => {
            chunkCount++
            chunkLength *= chunkCount;
            console.log("NOW CHUNKLENGTH received ============", data)
            data.pipe(res)
            //data.pipe(limiter).pipe(res) 
        })
        //console.log(`FINAL CHUNKLENGTH for ${id} IS`, chunkLength)
        //updateTheEmptyFile(outputFileStream, count, res )
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