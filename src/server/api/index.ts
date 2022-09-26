import express, {Request, Response} from 'express';
import fs, { read, writeFileSync } from 'fs';
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
    console.log("copying into empty file")
    const readFile = fs.createReadStream(getFilePath(id));
    readFile.pipe(writable)
}

router.get('/stream/:id', async(req: Request, res: Response) => {
    
    const id = req.params.id;
    console.log("STREAMING AUDIO =========", id )
    try {
        const writeFile = fs.createWriteStream(`audio/audio-${id}.mp3`)

        //const { stream, mime } = await getMimeType(writeFile);
        writeFile.on('pipe', (data) => {
                console.log("DATA GETTING PIPED INTO THIS", data)
                data.pipe(res)
            })
            //const readable = fs.createReadStream(writeFile)
        updateTheEmptyFile(writeFile, id && typeof id == "string" ? parseInt(id, 10) : 0 )

    } catch (e) {
        console.error("THE E IS", e);
    }

})

export default router;