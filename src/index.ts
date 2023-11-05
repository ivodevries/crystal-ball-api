import { getAnswer } from './qa/answer.js';
import { speechToText } from './speech/speech-to-text.js';
import { AwsTextToSpeechProvider, TextToSpeechService, playBuffer } from './speech/text-to-speech.js';
import { SpotifyResponseError, spotify } from './spotify/spotify.js';
import { createReadStream } from 'fs';
import { Uploadable, toFile } from 'openai/uploads.mjs';

type CommandOptions = {
    language?: string
};

const executeCommand = async (command: string, options?: CommandOptions) : Promise<any> => {
    const spotifyActivationCommand = /^((z|s|x)(i|e)[^a-z]?ra)/i;
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
            } catch (error:unknown) {
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
                        await new Promise(resolve => setTimeout(resolve, 10000));
                    }
                    {
                        const devices = await spotify.api.getMyDevices();
                        const deviceId = devices.body.devices[0]?.id;
                        if (deviceId) {
                            await spotify.api.transferMyPlayback([deviceId]);
                        }
                    }

                    await spotify.play(track);
                }
            }
            return 'spotify: ' + track.name;
        }
        return 'spotify';
    } else {
        try {
            const answer = await getAnswer('oracle', command);
            const ttsService = new TextToSpeechService(new AwsTextToSpeechProvider());
            const audio = await ttsService.synthesize(answer, options?.language);

            playBuffer(audio);

            return `playAudio: ${answer}`;
        } catch (error:unknown) {
            console.error(error);
            return 'error';
        }
    }
};

export const executeVoiceCommand = async (voiceCommand: Buffer | string) : Promise<any> => {
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

