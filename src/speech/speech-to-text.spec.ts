import { speechFileToText } from './speech-to-text.js';

test('stt', async () => {
    const result:any = await speechFileToText('answer.wav');
    console.log(result.language);
    console.log(result.text);
    console.log(result.segments);
    // todo check "result.segments[0].no_speech_prob"
    console.log(result);
});
