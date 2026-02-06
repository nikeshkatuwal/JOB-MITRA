import natural from 'natural';
import nlp from 'compromise';

// Create a singleton for the embedding model
class EmbeddingModel {
  constructor() {
    this.initialized = false;
    this.wordVectors = {};
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('Initializing simplified embedding model...');
      
      // For demonstration, we'll create a simplified system for common tech skills
      const skills = [
        "JavaScript", "Python", "Java", "C++", "SQL", "ExpressJS", 
        "React", "Node.js", "MongoDB", "HTML", "CSS",
        "Machine Learning", "AI", "Data Science"
      ];
      
      // Create a document for each skill for TF-IDF
      skills.forEach(skill => {
        this.tfidf.addDocument(skill.toLowerCase());
      });
      
      this.initialized = true;
      console.log('Embedding model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize embedding model:', error);
      throw error;
    }
  }

  // Get word vector similarity based on Jaro-Winkler distance
  getWordSimilarity(word1, word2) {
    if (!word1 || !word2) return 0;
    
    const normalizedWord1 = word1.toLowerCase();
    const normalizedWord2 = word2.toLowerCase();
    
    // Use Jaro-Winkler for string similarity
    return natural.JaroWinklerDistance(normalizedWord1, normalizedWord2);
  }
  
  // Calculate cosine similarity between two word vectors (simplified)
  cosineSimilarity(wordsA, wordsB) {
    try {
      // Convert arrays to lowercase if they are strings
      const normalizedWordsA = wordsA.map(w => typeof w === 'string' ? w.toLowerCase() : String(w).toLowerCase());
      const normalizedWordsB = wordsB.map(w => typeof w === 'string' ? w.toLowerCase() : String(w).toLowerCase());
      
      // Initialize variables for similarity calculation
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;
      
      // For each word in the first array
      for (const wordA of normalizedWordsA) {
        let maxSimilarity = 0;
        
        // Find the maximum similarity with any word in the second array
        for (const wordB of normalizedWordsB) {
          const similarity = this.getWordSimilarity(wordA, wordB);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
        
        dotProduct += maxSimilarity;
        magnitudeA += 1; // Each word contributes 1 to magnitude in this simplified approach
      }
      
      // Each word in second array contributes to magnitude
      magnitudeB = normalizedWordsB.length;
      
      // Avoid division by zero
      if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
      }
      
      // Calculate cosine similarity
      return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    } catch (error) {
      console.error('Error in cosineSimilarity calculation:', error);
      return 0;
    }
  }
  
  // Calculate semantic similarity between two word lists
  async calculateSemanticSimilarity(wordsA, wordsB) {
    try {
      await this.initialize();
      
      // Validate inputs
      if (!wordsA || !wordsB || !Array.isArray(wordsA) || !Array.isArray(wordsB)) {
        console.warn('Invalid inputs to calculateSemanticSimilarity', { wordsA, wordsB });
        return 0;
      }
      
      if (wordsA.length === 0 || wordsB.length === 0) {
        return 0;
      }
      
      return this.cosineSimilarity(wordsA, wordsB);
    } catch (error) {
      console.error('Error in calculateSemanticSimilarity:', error);
      return 0; // Return a default similarity value on error
    }
  }
  
  // Extract entities from text using compromise
  async extractEntities(text) {
    if (!text) return { skills: [], jobTitles: [], locations: [] };
    
    try {
      const doc = nlp(text);
      
      // Extract skills - look for tech terms
      const technicalTerms = doc.match('#Acronym+').out('array');
      const languageTerms = doc.match('(JavaScript|Python|Java|React|Node|HTML|CSS|SQL)').out('array');
      
      // Extract job titles - look for positions
      const jobTitles = doc.match('(developer|engineer|designer|manager|analyst)').out('array');
      
      // Extract locations - look for places
      const locations = doc.places().out('array');
      
      return {
        skills: [...new Set([...technicalTerms, ...languageTerms])],
        jobTitles: [...new Set(jobTitles)],
        locations: [...new Set(locations)]
      };
    } catch (error) {
      console.error('Error extracting entities:', error);
      return { skills: [], jobTitles: [], locations: [] };
    }
  }
}

// Create a singleton instance
const embeddingModel = new EmbeddingModel();

export default embeddingModel; 