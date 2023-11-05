import { createReadStream } from 'fs';
import { getOpenAIInstance } from '../openai.js';
import { Uploadable } from 'openai/uploads.mjs';
import { Transcription } from 'openai/resources/audio/transcriptions.mjs';
import voices from './../../assets/whisper-languages.json';

interface TranscriptionExtended extends Transcription {
    language: keyof typeof voices;
}

const openai = getOpenAIInstance();

export const speechToText = async (audioStream: Uploadable) => {
    const transcription = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        response_format: 'verbose_json'
    });

    return transcription as TranscriptionExtended;
};

export const speechFileToText = async (audioFile: string) => {
    return speechToText(createReadStream(audioFile));
};
