/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createReadStream, existsSync, readFileSync } from 'fs';
import executeCommand, { executeVoiceCommand } from './index.js';
import { AwsTextToSpeechProvider, TextToSpeechService, languageNameToIsoCode, playBuffer, saveBuffer } from './speech/text-to-speech.js';
import { speechToText } from './speech/speech-to-text.js';
import { toFile } from 'openai';

test('execute spotify command', async () => {
    const songCommand = await executeCommand('zira sound of silence', {
        language: 'fr'
    });
    expect(songCommand).toStartWith('spotify:');
}, 30_000);

test('pause spotify command', async () => {
    const pauseCommand = await executeCommand('zira, stop', {});

    expect(pauseCommand).toMatch('spotify: pause');
});

test('execute qa command', async () => {
    const qaCommand = await executeCommand('what is the largest butterfly?', {
        language: 'en'
    });
    expect(qaCommand).toMatch('playAudio:');
});

test('execute spotify voice command', async () => {
    const voiceContents = readFileSync('./artifacts/zira-sound-of-silence.wav');
    const songVoiceCommand = await executeVoiceCommand(voiceContents);

    expect(songVoiceCommand).toStartWith('spotify:');
}, 30_000);

test('ask dutch question', async () => {
    const question = 'wat is de grootste vlinder?';

    const fileExists = existsSync('./artifacts/wat-is-de-grootste-vlinder.wav');

    let audioStream;
    if (!fileExists) {
        const ttsService = new TextToSpeechService(new AwsTextToSpeechProvider());
        const audio = await ttsService.synthesize(question, 'nl');
        audioStream = await toFile(audio, 'dummy.wav');
        saveBuffer(audio, 'wat-is-de-grootste-vlinder');
    } else {
        audioStream = createReadStream('./artifacts/wat-is-de-grootste-vlinder.wav');
    }

    const textDetails = await speechToText(audioStream);
    const ttsService = new TextToSpeechService(new AwsTextToSpeechProvider());
    const isoCode = languageNameToIsoCode(textDetails.language);
    const audio = await ttsService.synthesize(question, isoCode);

    playBuffer(audio);
    expect(textDetails.language).toBe('dutch');
    expect(isoCode).toBe('nl');
}, 30_000);

test.only('html output', async () => {
    const question = 'what is the largest butterfly?';
    await executeCommand(question, {
        language: 'en'
    });
    let htmlContents = '';
    const readFile = () => htmlContents = readFileSync('./output/index.html', 'utf-8');
    expect(readFile).not.toThrow();

    expect(htmlContents).toContain(question);
});

