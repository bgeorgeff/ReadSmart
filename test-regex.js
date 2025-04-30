// Test string with the issue
const testString = 'Written in 1525, this treatise was a response to the humanist scholar Desiderius Erasmus\'s work "On Free Will"Will, which defended the idea that humans possess the ability to choose between good and "evil"evil,';

console.log("Original string:");
console.log(testString);

// Solution 1: Simple string replacement for known pattern
const fixed1 = testString
  .replace(/"On Free Will"Will,/g, '"On Free Will",')
  .replace(/"evil"evil,/g, '"evil",');

console.log("\nFixed with direct replacements:");
console.log(fixed1);

// Solution 2: Regex pattern
const fixed2 = testString.replace(/"([^"]+)"(\w+),/g, (match, p1, p2) => {
  // Get the last word from inside the quotes
  const words = p1.split(/\s+/);
  const lastWord = words[words.length - 1].toLowerCase();
  
  // If the word after quotes matches the last word, replace with just the quotes
  if (p2.toLowerCase() === lastWord) {
    return `"${p1}",`;
  }
  return match;
});

console.log("\nFixed with regex pattern matching:");
console.log(fixed2);

// Solution 3: Targeted regex
const fixed3 = testString.replace(/"([^"]+)"([A-Za-z]+),/g, (match, quote, duplicate) => {
  const lastWordInQuote = quote.split(/\s+/).pop().toLowerCase();
  if (lastWordInQuote === duplicate.toLowerCase()) {
    return `"${quote}",`;
  }
  return match;
});

console.log("\nFixed with targeted regex:");
console.log(fixed3);
