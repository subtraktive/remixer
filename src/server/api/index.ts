import express, {Request, Response} from 'express';
import fs, { read, writeFileSync } from 'fs';
import { basename } from 'path';
const crypto = require('crypto');
const router = express.Router()
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


const updateTheEmptyFile = (writable: Writable, id: number) => {
    // WRITE TO WRITABLE STREAM HERE 
    const readFile = fs.createReadStream(getFilePath(id));
    readFile.pipe(writable)
}

const fileRef = new Map()



router.get('/track/meta', async(req: Request, res: Response) => {
    
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
    try {
        const writeFile = fs.createWriteStream(`audio/audio-${id}.mp3`)

        //const { stream, mime } = await getMimeType(writeFile);
        writeFile.on('pipe', (data) => {
            data.pipe(res)
        })
        updateTheEmptyFile(writeFile, Math.random()*100 > 50 ? 1: 2 )

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