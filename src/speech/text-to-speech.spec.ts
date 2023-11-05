/* eslint-disable max-len */
import voices from './../../assets/eleven-labs-voices.json';
import { AwsTextToSpeechProvider, ElevenLabsTextToSpeechProvider, TextToSpeechService, playBuffer, saveBuffer } from './text-to-speech.js';
import { existsSync } from 'fs';

test('reads voices from file', () => {
    expect(voices).toBeArray();
});

test('text-to-speech with elevenlabs.io without apiKey', () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;
    expect(() => new ElevenLabsTextToSpeechProvider()).toThrowError('Missing ElevenLabs API key');
    process.env.ELEVENLABS_API_KEY = apiKey;
});

test('text-to-speech with elevenlabs.io', async () => {
    const ttsService = new TextToSpeechService(new ElevenLabsTextToSpeechProvider());
    const text = 'fox';
    const audio = await ttsService.synthesize(text);
    expect(audio).toBeObject();

    playBuffer(audio);
});

test('text-to-speech with AWS Polly without apiKey', () => {
    const envCopy = { ...process.env };

    delete process.env.AWS_ACCESS_KEY_ID;
    expect(() => new AwsTextToSpeechProvider()).toThrowError('Missing AWS access key ID');
    process.env = { ...envCopy };
    delete process.env.AWS_SECRET_ACCESS_KEY;
    expect(() => new AwsTextToSpeechProvider()).toThrowError('Missing AWS secret access key');
    process.env = { ...envCopy };

    delete process.env.AWS_REGION;
    expect(() => new AwsTextToSpeechProvider()).toThrowError('Missing AWS region');
    process.env = { ...envCopy };
});

test('text-to-speech with AWS Polly with invalid credentials', async () => {
    const provider = new AwsTextToSpeechProvider({
        region: <string>process.env.AWS_REGION,
        accessKeyId: 'dummy-access-key-id',
        secretAccessKey: 'dummy-secret-access-key'
    });

    const ttsService = new TextToSpeechService(provider);
    await expect(ttsService.synthesize('fox')).rejects.toBeInstanceOf(Error);
});

test('text-to-speech with AWS Polly (EN)', async () => {
    const ttsService = new TextToSpeechService(new AwsTextToSpeechProvider());
    const text = 'The quick brown fox';
    const audio = await ttsService.synthesize(text);
    expect(audio).toBeObject();

    playBuffer(audio);
});

test('text-to-speech with AWS Polly (NL)', async () => {
    const provider = new AwsTextToSpeechProvider();
    const ttsService = new TextToSpeechService(provider);

    const text = 'Vos';

    const audio = await ttsService.synthesize(text, 'nl');
    expect(audio).toBeObject();

    playBuffer(audio);
});

test.only('save audio to disk', async () => {
    const ttsService = new TextToSpeechService(new AwsTextToSpeechProvider());
    const text = 'zira lord of the rings lofi';
    const audio = await ttsService.synthesize(text);
    expect(audio).toBeObject();
    saveBuffer(audio, text);

    const filename = text.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filePath = `./artifacts/${filename}.wav`;

    console.log(filePath);
    // wait 1 sec
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(existsSync(filePath)).toBeTruthy();
});
