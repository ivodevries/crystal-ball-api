import { createReadStream } from 'fs';
import { getOpenAIInstance } from '../openai.js';
import { Uploadable, toFile } from 'openai/uploads.mjs';
import { Transcription } from 'openai/resources/audio/transcriptions.mjs';
import voices from './../../assets/whisper-languages.json';

interface TranscriptionExtended extends Transcription {
    language: keyof typeof voices;
}

const openai = getOpenAIInstance();

export const speechToText = async (audio: Uploadable | Buffer) => {

    if (audio instanceof Buffer) {
        audio = await toFile(audio, 'speech.wav');
    }
    const transcription = await openai.audio.transcriptions.create({
        file: audio,
        model: 'whisper-1',
        response_format: 'verbose_json'
    });

    return transcription as TranscriptionExtended;
};

export const speechFileToText = async (audioFile: string) => {
    return speechToText(createReadStream(audioFile));
};
