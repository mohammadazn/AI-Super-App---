const axios = require('axios');

class AICodeService {
  // تولید کد
  static async generateCode(prompt, language = 'javascript') {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} programmer. Write clean, efficient code with Persian comments.`
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  }
  
  // توضیح کد
  static async explainCode(code) {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Explain this code in simple Persian for beginners.'
          },
          {
            role: 'user',
            content: code
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  }
}

module.exports = AICodeService;
