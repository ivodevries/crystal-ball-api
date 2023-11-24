import { getAnswer } from './qa/answer.js';
import { speechToText } from './speech/speech-to-text.js';
import { AwsTextToSpeechProvider, TextToSpeechService, playBuffer } from './speech/text-to-speech.js';
import { SpotifyResponseError, spotify } from './spotify/spotify.js';
import { createReadStream } from 'fs';
import { appendFile, writeFile } from 'fs/promises';
import { Uploadable, toFile } from 'openai/uploads.mjs';
import { setTimeout } from 'timers/promises';

type CommandOptions = {
    language?: string
};
const indexPath = './output/index.html';

const newIndex = async () => {
    const body = `
    <!doctype html><html><head>
    <style>
    body {
        font-weight:bold;
        font-size: 150%;
        background: #333;
        color: #ccc;
        text-align: center;
        font-family: Verdana;
      }
    </style></head><body>
    `;
    return writeFile(indexPath, body);
};

const appendOutput = async (output: string) => {
    return appendFile(indexPath, output + '<br><br>');
};

const executeCommand = async (command: string, options?: CommandOptions): Promise<any> => {
    await newIndex();
    const spotifyActivationCommand = /^((z|s|x)h?(y|i|e|ee)[^a-z]?ra)/i;
    if (spotifyActivationCommand.test(command)) {
        const trackName = command.replace(spotifyActivationCommand, '').replace(/^[^a-z]+/i, '').trim();
        await spotify.authorize();
        if (['pauze', 'stop', 'pause'].includes(trackName)) {
            await spotify.api.pause();
            return 'spotify: pause';
        }
        const track = await spotify.getTrack(trackName);
        if (track) {
            try {
                await spotify.play(track);
            } catch (error: unknown) {
                const spotifyError = error as SpotifyResponseError;
                if (spotifyError.body.error.reason === 'NO_ACTIVE_DEVICE') {
                    const devices = await spotify.api.getMyDevices();
                    if (devices.body.devices?.length) {
                        const deviceId = devices.body.devices[0]?.id;
                        if (deviceId) {
                            await spotify.api.transferMyPlayback([deviceId]);
                        }
                    } else {
                        await spotify.startSession();
                        await setTimeout(10000);
                        // await new Promise(resolve => setTimeout(resolve, 10000));
                    }

                    for (let i = 0; i < 5; i++) {
                        const devices = await spotify.api.getMyDevices();
                        const deviceId = devices.body.devices[0]?.id;
                        if (deviceId) {
                            await spotify.api.transferMyPlayback([deviceId]);
                            break;
                        }
                        // await new Promise(resolve => setTimeout(resolve, 5000));
                    }

                    for (let i = 0; i < 5; i++) {
                        try {
                            await spotify.play(track);
                            break;
                        } catch (e) {
                            // await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                    }
                }
            }
            return 'spotify: ' + track.name;
        }
        return 'spotify';
    } else {
        try {
            appendOutput(command).catch(console.error);
            const answer = await getAnswer('oracle', command);
            if (answer) {
                appendOutput(answer).catch(console.error);
                const ttsService = new TextToSpeechService(new AwsTextToSpeechProvider());
                const audio = await ttsService.synthesize(answer, options?.language);

                playBuffer(audio);

                return `playAudio: ${answer}`;
            }
            return 'error';
        } catch (error: unknown) {
            console.error(error);
            return 'error';
        }
    }
};

export const executeVoiceCommand = async (voiceCommand: Buffer | string): Promise<any> => {
    let audioReadStream;
    if (typeof voiceCommand === 'string') {
        audioReadStream = createReadStream(voiceCommand);
    } else {
        audioReadStream = await toFile(voiceCommand, 'voiceCommand.wav');
    }

    const textCommand = await speechToText(audioReadStream as Uploadable);
    console.log(textCommand);
    return executeCommand(textCommand.text, { language: textCommand.language });
};
export default executeCommand;

