import AWS from 'aws-sdk';
import axios from 'axios';
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { Lame } from 'node-lame';
import voices from './../../assets/whisper-languages.json';

export interface TextToSpeechProvider {
    getVoiceId(lang?: string): string;
    synthesize(text: string, lang?: string): Promise<Buffer>;
}

export type TextToSpeechResult = {
    audioData: Uint8Array;
    contentType: string;
};

const arrayBufferToBuffer = (arrayBuffer: ArrayBuffer) => Buffer.from(arrayBuffer);

export const mp3BufferToWavBuffer = (buffer:Buffer) : Promise<Buffer>=> {
    const decoder =  new Lame({
        output: 'buffer'
    }).setBuffer(buffer);

    return decoder.decode().then(() => {
        const buffer = decoder.getBuffer();
        return buffer;
    });
};

export const languageNameToIsoCode = (languageName: keyof typeof voices) => {
    return voices[languageName] ?? 'en';
};

export class ElevenLabsTextToSpeechProvider implements TextToSpeechProvider {
    constructor(private apiKey: string = <string>process.env.ELEVENLABS_API_KEY) {
        if (!this.apiKey) {
            throw new Error('Missing ElevenLabs API key');
        }
    }

    getVoiceId(): string {
        // return 'zrHiDhphv9ZnVXBqCLjz'; // Mimi
        return 'D38z5RcWu1voky8WS1ja'; // Fin
    }

    synthesize(text: string, voiceId?: string): Promise<Buffer> {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=0&output_format=mp3_44100_128`;
        const headers = {
            'accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
        };
        const data = {
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.4,
                similarity_boost: 0,
                style: 0,
                use_speaker_boost: true
            }
        };

        return axios.post(url, data, { headers, responseType: 'arraybuffer' })
            .then(response => response.data as ArrayBuffer)
            .then(arrayBufferToBuffer)
            .then(mp3BufferToWavBuffer);
    }
}

export class AwsTextToSpeechProvider implements TextToSpeechProvider {
    constructor(private credentials: Record<string, string> = {
        region: <string>process.env.AWS_REGION,
        accessKeyId: <string>process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: <string>process.env.AWS_SECRET_ACCESS_KEY
    }) {
        if (!this.credentials.region) {
            throw new Error('Missing AWS region');
        }
        if (!this.credentials.accessKeyId) {
            throw new Error('Missing AWS access key ID');
        }
        if (!this.credentials.secretAccessKey) {
            throw new Error('Missing AWS secret access key');
        }
    }

    getVoiceId(lang: string): string {
        console.log(lang);
        if (lang?.startsWith('nl')) {
            return 'Laura';
        }
        return 'Amy';
        // return 'Emma';
        // return 'Brian';
        // return 'Arthur';
    }

    async synthesize(text: string, voiceId: string): Promise<Buffer> {
        const polly = new AWS.Polly(this.credentials);

        const params = {
            Engine: 'neural',
            OutputFormat: 'mp3',
            Text: text,
            TextType: 'text',
            VoiceId: voiceId
        };

        const mp3Buffer: Buffer = await new Promise((resolve, reject) => {
            polly.synthesizeSpeech(params, (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data.AudioStream as Buffer);
            });
        });

        return mp3BufferToWavBuffer(mp3Buffer);
    }
}

export class TextToSpeechService {
    constructor(private ttsProvider: TextToSpeechProvider) {
    }

    async synthesize(text: string, lang?: string): Promise<Buffer> {
        return this.ttsProvider.synthesize(text, this.ttsProvider.getVoiceId(lang));
    }
}

export const saveBuffer = (buffer: Buffer, text: string) => {
    const filename = text.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return writeFileSync(`./artifacts/${filename}.wav`, buffer);
};

export const playBuffer = (audioBuffer: Buffer, args: string[] = []) => {
    const process = spawn('play', ['-t', 'wav', '-', ...args]);

    if (!process) {
        /* istanbul ignore next */
        return null;
    }

    process.stdin.write(audioBuffer);
    process.stdin.end();

    return process;
};
