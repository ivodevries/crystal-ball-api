import { getOpenAIInstance, OpenAI } from '../openai.js';

const openai = getOpenAIInstance();

const personas = {
    oracle: {
        systemMessages: [
            {
                role: 'system',
                content: 'explain like I\'m 3 years old, Be concise. The question is asked with speech, there might be errors in stt, treat the input as a question where possible: that -> what, dat -> wat, die -> wie etc.'
            }
        ]
    },
    frenchTeacher: {
        systemMessages: [
            {
                role: 'system',
                content: 'Behave like a french teacher, correct any grammar mistakes I make.'
            }
        ]
    }
} as const;

type PersonaValue = keyof typeof personas;

export const getAnswerFromOpenAI = async (personaName: PersonaValue, question: string) => {
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: [
            ...personas[personaName].systemMessages,
            {
                role: 'user',
                content: question
            }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.7
    };

    return openai.chat.completions.create(params);
};

export const getAnswer = async (personaName: PersonaValue, question: string) => {
    const persona = personas[personaName];
    return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                ...persona.systemMessages,
                {
                    role: 'user',
                    content: question
                }
            ],
            temperature: 0.7
        })
    })
        .then(res => res.json())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .then(json => json.choices[0].message.content as string)
        .catch(e => console.trace(e));
};
