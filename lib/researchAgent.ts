// lib/researchAgent.ts
import { OpenAI } from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to count words
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// Simple web search function using SerpAPI
async function searchWeb(query: string): Promise<string> {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        api_key: process.env.SERPAPI_API_KEY,
      },
    });
    
    // Extract the most relevant information from search results
    const results = response.data.organic_results?.slice(0, 5).map((result: any) => 
      `${result.title}: ${result.snippet}`
    ).join('\n\n') || 'No results found';
    
    return results;
  } catch (error) {
    console.error('Search error:', error);
    return 'Failed to fetch search results';
  }
}

// Helper function to safely parse JSON
function safeJsonParse(str: string, fallback: any = {}) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON parsing error:', e, 'String content:', str);
    return fallback;
  }
}

export async function conductResearch(scrapedContent: { title: string; content: string }) {
  try {
    // Calculate the original article's word count
    const originalWordCount = countWords(scrapedContent.content);
    console.log(`Original article word count: ${originalWordCount}`);
    
    // Step 1: Analyze the article and generate research questions
    const analysisPrompt = `
      Analyze this article and identify the main sections and key claims that need verification or expansion:
      
      TITLE: ${scrapedContent.title}
      CONTENT: ${scrapedContent.content}
      
      Provide a list of 3-5 specific research questions that would help verify and expand this content.
      Return your response as a JSON object with this structure:
      {
        "researchQuestions": ["question1", "question2", "question3"]
      }
    `;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a research analyst that identifies what needs to be researched in articles."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysisResult = safeJsonParse(analysisResponse.choices[0]?.message?.content || '{}');
    
    // Validate that researchQuestions exists and is an array
    const researchQuestions = Array.isArray(analysisResult.researchQuestions) 
      ? analysisResult.researchQuestions 
      : [];
    
    console.log('Research questions:', researchQuestions);
    
    // Step 2: Research each question (only if we have questions)
    const researchResults = [];
    if (researchQuestions.length > 0) {
      for (const question of researchQuestions) {
        const searchResults = await searchWeb(question);
        researchResults.push({
          question,
          results: searchResults
        });
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.warn('No research questions generated, proceeding with basic analysis');
      
      // Fallback: perform a general search based on the article title
      const generalSearch = await searchWeb(`${scrapedContent.title} research`);
      researchResults.push({
        question: `General research about ${scrapedContent.title}`,
        results: generalSearch
      });
    }

    // Step 3: Generate the final researched article with length constraint
    const researchPrompt = `
      Original Article:
      Title: ${scrapedContent.title}
      Content: ${scrapedContent.content}
      
      Research Results:
      ${JSON.stringify(researchResults, null, 2)}
      
      IMPORTANT: The original article was approximately ${originalWordCount} words long.
      Your response should be a comprehensive, well-researched article that is approximately the same length.
      
      Using the original article and the research results above, create a comprehensive, well-researched article that:
      1. Verifies the claims in the original article
      2. Expands on the information with additional details and context
      3. Includes citations and references to authoritative sources
      4. Is structured with clear sections and headings
      5. Is approximately ${originalWordCount} words in length (±10%)
      
      Return your response as a JSON object with this structure:
      {
        "title": "Researched Article Title",
        "sections": [
          {
            "heading": "Section Heading",
            "content": "Section content with research",
            "keyFindings": ["Finding 1", "Finding 2"]
          }
        ],
        "summary": "Overall summary of the research",
        "references": ["Reference 1", "Reference 2"],
        "wordCount": ${originalWordCount}
      }
    `;

    const researchResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a research writer that creates well-researched articles. 
                   Pay special attention to the requested word count of approximately ${originalWordCount} words.`
        },
        {
          role: "user",
          content: researchPrompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: Math.min(4000, Math.floor(originalWordCount * 1.5)), // Adjust tokens based on word count
    });

    const result = researchResponse.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    const finalResult = safeJsonParse(result, {
      title: "Researched Article",
      sections: [],
      summary: "Research completed but could not parse the final result",
      references: []
    });
    
    // Calculate and log the final word count
    const finalContent = finalResult.sections.map((s: any) => s.content).join(' ');
    const finalWordCount = countWords(finalContent);
    console.log(`Final article word count: ${finalWordCount} (target: ${originalWordCount})`);
    
    return finalResult;
  } catch (error) {
    console.error("Research error:", error);
    throw new Error(`Research failed: ${error.message}`);
  }
}