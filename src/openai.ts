import { OpenAI } from 'openai';

const getOpenAIInstance = (apiKey?: string) => {
    if (!apiKey && !process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not provided, please set OPENAI_API_KEY environment variable or pass it as a parameter');
    }
    const options = apiKey ? { apiKey } : {};
    return new OpenAI(options);
};

export { OpenAI, getOpenAIInstance };
