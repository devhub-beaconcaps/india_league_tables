// app/api/process-article/route.ts
import { scrapeArticle } from '../../../lib/scraper';
import { conductResearch } from '../../../lib/researchAgent';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Scrape the article
    const scrapedContent = await scrapeArticle(url);

    // Conduct deep research using the agent
    const researchedArticle = await conductResearch(scrapedContent);

    return Response.json({
      original: scrapedContent,
      researched: researchedArticle,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Processing error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}