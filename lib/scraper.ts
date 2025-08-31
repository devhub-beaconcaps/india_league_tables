// lib/scraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeArticle(url: string) {
  try {
    // Add a timeout and custom headers to avoid blocking
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('h1').first().text() || 
                  $('title').first().text() || 
                  $('meta[property="og:title"]').attr('content') || 
                  'Untitled Article';
    
    // Try to find main content
    const contentSelectors = [
      'article',
      '.post-content',
      '.article-content',
      '.content',
      'main',
      '[class*="content"]',
      '[class*="post"]',
      '[class*="article"]'
    ];
    
    let content = '';
    for (const selector of contentSelectors) {
      const elements = $(selector);
      if (elements.length) {
        content = elements.first().text();
        break;
      }
    }
    
    // Fallback to body if no specific content found
    if (!content) {
      content = $('body').text();
    }
    
    // Clean up content
    content = content.trim().replace(/\s+/g, ' ').substring(0, 10000); // Limit content length
    
    return {
      title: title.trim(),
      content,
      url
    };
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to scrape article: ${error.message}`);
  }
}