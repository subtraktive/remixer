A simple setup which lets client stream audio from the server using Node Stream.

To run the setup

a) Do npm install b) and then npm run dev

Tech stack used -

ExpressJS 
Typescript 
ReactJS 
Webpack 
Nodemon

The way this project works is, once you run the server, you get a screen with a button "REMIX", on clicking it, the client will send some meta info, and the client would again make a FETCH STREAM request to server using these meta info and based on this the server would create an empty wav file, and then write into it and these chunks that get written are then streamed to the client using http chunking.

On the client, the stream response is then collected ( until the duration is 5s), and then scheduled to play all the chunks with precise timing info.

This works fairly well on Firefox, but has huge issues on Chrome. The chrome plays a lot of noise along with the track meaning the chunks are somehow messed up or has header info which might be causing the issue. 

The Chrome issue is WIP.