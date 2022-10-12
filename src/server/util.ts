import { WriteStream } from 'fs';
import { Stream, Writable } from 'stream'

class StreamLimiter extends Stream  {
    readable: boolean;
    writable: boolean;
    limit: number | null;
    sentBytes: number;
    tmpSentBytes: number;
    startTime: Date;
    tmpStartTime: Date;
    locked: boolean;

    constructor(){
        super()
        this.readable = true
        this.writable = true
        this.limit = null

        this.sentBytes = this.tmpSentBytes = 0;
        this.startTime = this.tmpStartTime = new Date();
        this.locked = false
    }

    setLimit(limit: number) {
        this.limit = (limit * 1024) / 1000.0 // bytes per ms
        this.tmpSentBytes = 0;
        this.tmpStartTime = new Date();
    }

    write(chunk: any): boolean {
        this.sentBytes += chunk.length;
        this.tmpSentBytes += chunk.length;

        this.emit('data', chunk)

        if(this.limit) {
            let now: number = +new Date();
            let elapsed: number = now - (+this.tmpStartTime),
            assumedTime: number = (+this.tmpSentBytes) / this.limit,
            lag = assumedTime - elapsed;
            if(lag > 0) {
                this.locked = true;
                this.emit('pause')
                setTimeout(() => {
                    this.emit('resume')
                    this.locked = false;
                }, lag)
            }
        }
        return this.locked
    }

    end(){
        console.log("ENDING STREAM")
        this.emit('end')
        return this;
    }

    error(e: Error){
        console.error("SOME ERROR", e)
        this.emit('error')
        return this;
    }

    close(){
        console.log("Close STREAM")
        this.emit('close')
        return Promise.resolve()
    }

    destroy(){
        console.log("DESTROY STREAM")
        this.emit('destroy')
    }
}

export default StreamLimiter