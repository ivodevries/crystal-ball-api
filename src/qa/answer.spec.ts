import { getAnswerFromOpenAI } from './answer.js';
test('answer', async () => {
    const answer = await getAnswerFromOpenAI('oracle', 'what is the answer to life the universe and everything?');
    expect(answer).toBeObject();
});
