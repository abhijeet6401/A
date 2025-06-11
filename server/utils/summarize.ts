export async function summarize(text: string): Promise<{ headline: string; summary: string }> {
  // Placeholder function for AI summarization
  // In production, this would connect to OpenAI or another AI service
  
  // Extract key information from text
  const words = text.split(' ');
  const keyNumbers = text.match(/\d+(\.\d+)?[%$BMK]?/g) || [];
  
  // Generate placeholder headline (15-20 words with numbers if available)
  const companyName = extractCompanyName(text);
  const headline = generateHeadline(text, companyName, keyNumbers);
  
  // Generate placeholder summary paragraph
  const summary = generateSummary(text);
  
  return { headline, summary };
}

function extractCompanyName(text: string): string {
  // Simple company name extraction - in production would use more sophisticated NLP
  const commonCompanyWords = ['Inc', 'Corp', 'Ltd', 'Company', 'Industries', 'Electronics', 'Motors'];
  const words = text.split(' ');
  
  for (let i = 0; i < words.length - 1; i++) {
    if (commonCompanyWords.some(suffix => words[i + 1]?.includes(suffix))) {
      return `${words[i]} ${words[i + 1]}`;
    }
  }
  
  return "Company";
}

function generateHeadline(text: string, companyName: string, numbers: string[]): string {
  const actions = ['Reports', 'Announces', 'Reveals', 'Posts', 'Shows'];
  const outcomes = ['Strong Growth', 'Record Performance', 'Significant Increase', 'Major Investment'];
  
  const action = actions[Math.floor(Math.random() * actions.length)];
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
  const number = numbers.length > 0 ? numbers[0] : '';
  
  return `${companyName} ${action} ${number ? number + ' ' : ''}${outcome} in Latest Results`;
}

function generateSummary(text: string): string {
  // Generate a summary based on the input text
  const sentences = text.split('.').filter(s => s.trim().length > 0);
  
  if (sentences.length <= 2) {
    return text;
  }
  
  // Take first two sentences as summary
  return sentences.slice(0, 2).join('. ') + '.';
}
