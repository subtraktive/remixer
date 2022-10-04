import express, {Request, Response} from 'express';
import fs, { read, writeFileSync, WriteStream } from 'fs';
import { basename } from 'path';
import StreamLimiter from '../util';

const crypto = require('crypto');
const router = express.Router()
const LIMIT_RATE = 4; // 5 kb per ms
//import { getMimeType } from 'stream-mime-type';
// import path from 'path'
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = dirname(fileURLToPath(
//     import.meta.url));



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


const updateTheEmptyFile = (file: WriteStream, id: number) => {
    // WRITE TO WRITABLE STREAM HERE 
    const readFile = fs.createReadStream(getFilePath(id));
    readFile.pipe(file)
}

const fileRef = new Map()

let count = 0;

router.get('/track/meta', async(req: Request, res: Response) => {
    count = 0
    const {duration, genre} = req.query
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
        layers.push(id)
    }
    trackMapping.set('duration', duration)
    trackMapping.set('genre', genre)
    trackMapping.set('layers', layers)
    trackMapping.set('id', trackId)
    fileRef.set(trackId, trackMapping)
    res.status(200).send(Object.fromEntries(trackMapping))
})

router.get('/stream/:layerId', async(req: Request, res: Response) => {
    
    const id = req.params.layerId;
    console.log("STREAMING AUDIO =========", id )
    count++;
    try {
        const writeFile = fs.createWriteStream(`audio/audio-${id}.mp3`)
        const limiter = new StreamLimiter()
        const rand = Math.random()*100
        console.log("RAND IS", rand);
        limiter.setLimit(rand > 40 ? LIMIT_RATE: 5)
        //const { stream, mime } = await getMimeType(writeFile);
        writeFile.on('pipe', (data) => {
            data.pipe(limiter).pipe(res) 
        })
        updateTheEmptyFile(writeFile, count )

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