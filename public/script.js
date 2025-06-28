
// CSV data will be loaded and parsed here
let fragrancesData = [];
let filteredData = [];

// Parse CSV data with proper quote and multi-line handling
function parseCSV(csvText) {
  // Split by lines but we'll rebuild rows that span multiple lines
  const allLines = csvText.split('\n');
  if (allLines.length === 0) return [];
  
  // Parse headers from first line
  const headers = parseCSVRow(allLines[0]);
  
  const data = [];
  let i = 1; // Start from second line
  
  while (i < allLines.length) {
    const { row, nextIndex } = parseCSVRow(allLines, i);
    if (row.length > 0 && row.some(cell => cell.trim())) {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index] || '';
      });
      data.push(item);
    }
    i = nextIndex;
  }
  
  return data;
}

// Parse a single CSV row, handling multi-line quoted fields
function parseCSVRow(lines, startIndex = 0) {
  if (typeof lines === 'string') {
    // Single line case
    return parseSimpleCSVLine(lines);
  }
  
  // Multi-line case
  const values = [];
  let current = '';
  let inQuotes = false;
  let lineIndex = startIndex;
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    let charIndex = 0;
    
    while (charIndex < line.length) {
      const char = line[charIndex];
      
      if (char === '"') {
        if (!inQuotes) {
          inQuotes = true;
        } else if (charIndex + 1 < line.length && line[charIndex + 1] === '"') {
          // Escaped quote
          current += '"';
          charIndex++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      charIndex++;
    }
    
    // If we're in quotes, add a newline and continue to next line
    if (inQuotes && lineIndex + 1 < lines.length) {
      current += '\n';
      lineIndex++;
    } else {
      // End of this row
      values.push(current.trim());
      break;
    }
  }
  
  return { row: values, nextIndex: lineIndex + 1 };
}

// Simple CSV line parser for single lines
function parseSimpleCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (!inQuotes) {
        inQuotes = true;
      } else if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

// Load CSV data
async function loadFragrances() {
  try {
    const response = await fetch('/attached_assets/ScentsGallery 5_1751093160166.csv');
    const csvText = await response.text();
    fragrancesData = parseCSV(csvText);
    filteredData = [...fragrancesData];
    renderFragrances();
  } catch (error) {
    console.error('Error loading fragrances:', error);
  }
}

// Extract emoji from name
function extractEmoji(name) {
  const emojiMatch = name.match(/[\u{1F300}-\u{1F9FF}]/gu);
  return emojiMatch ? emojiMatch.slice(0, 3).join(' ') : '🌿';
}

// Clean name by removing emojis
function cleanName(name) {
  return name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// Generate star rating display
function generateStars(rating) {
  const stars = parseInt(rating) || 0;
  return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
}

// Truncate text
function truncateText(text, maxLength = 150) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Render fragrances grid
function renderFragrances() {
  const grid = document.getElementById('fragranceGrid');
  grid.innerHTML = '';

  filteredData.forEach(fragrance => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer';
    card.onclick = () => openModal(fragrance);

    const emoji = extractEmoji(fragrance.Name);
    const cleanedName = cleanName(fragrance.Name);
    const rating = generateStars(fragrance.Rating);
    const price = Math.floor(Math.random() * 200) + 50; // Random price for demo

    card.innerHTML = `
      <div class="p-6">
        <div class="text-4xl mb-4 text-center">${emoji}</div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">${cleanedName}</h3>
        <p class="text-sm text-slate-600 mb-2">${fragrance.Brand}</p>
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm">${rating}</span>
          <span class="text-lg font-bold text-slate-900">$${price}</span>
        </div>
        <p class="text-sm text-slate-600 mb-4">${truncateText(fragrance.Vibe)}</p>
        <div class="flex flex-wrap gap-1 mb-4">
          ${fragrance['Main Accords'].split(',').slice(0, 3).map(accord => 
            `<span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">${accord.trim()}</span>`
          ).join('')}
        </div>
        <button class="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-700 transition-colors">
          View Details
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Open modal with fragrance details
function openModal(fragrance) {
  const modal = document.getElementById('fragranceModal');
  const content = document.getElementById('modalContent');
  
  const emoji = extractEmoji(fragrance.Name);
  const cleanedName = cleanName(fragrance.Name);
  const rating = generateStars(fragrance.Rating);
  const price = Math.floor(Math.random() * 200) + 50;

  content.innerHTML = `
    <div class="flex justify-between items-start mb-6">
      <div>
        <div class="text-5xl mb-4">${emoji}</div>
        <h2 class="text-3xl font-bold text-slate-900 mb-2">${cleanedName}</h2>
        <p class="text-lg text-slate-600 mb-2">${fragrance.Brand}</p>
        <div class="flex items-center gap-4 mb-4">
          <span>${rating}</span>
          <span class="text-2xl font-bold text-slate-900">$${price}</span>
        </div>
      </div>
      <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
    </div>

    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Fragrance Profile</h3>
        <p class="text-slate-700">${fragrance.Vibe}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 class="font-semibold text-slate-900 mb-2">Top Notes</h4>
          <p class="text-sm text-slate-600">${fragrance['Top Notes']}</p>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-2">Heart Notes</h4>
          <p class="text-sm text-slate-600">${fragrance['Heart Notes']}</p>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-2">Base Notes</h4>
          <p class="text-sm text-slate-600">${fragrance['Base Notes']}</p>
        </div>
      </div>

      <div>
        <h4 class="font-semibold text-slate-900 mb-2">What It Smells Like</h4>
        <p class="text-slate-700">${fragrance['Smells Like...']}</p>
      </div>

      <div>
        <h4 class="font-semibold text-slate-900 mb-2">Memory & Association</h4>
        <p class="text-slate-700">${fragrance['Memory or Association']}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        ${fragrance['Main Accords'].split(',').map(accord => 
          `<span class="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">${accord.trim()}</span>`
        ).join('')}
      </div>

      <div class="flex gap-4 pt-6 border-t border-slate-200">
        <button class="flex-1 bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-700 transition-colors font-semibold">
          Add to Cart - $${price}
        </button>
        <button class="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          ♡ Save
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
  const modal = document.getElementById('fragranceModal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

// Filter functions
function applyFilters() {
  const ratingFilter = document.getElementById('ratingFilter').value;
  const temperatureFilter = document.getElementById('temperatureFilter').value;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  filteredData = fragrancesData.filter(fragrance => {
    const matchesRating = !ratingFilter || parseInt(fragrance.Rating) >= parseInt(ratingFilter);
    const matchesTemperature = !temperatureFilter || fragrance.Temperature === temperatureFilter;
    const matchesSearch = !searchTerm || 
      fragrance.Name.toLowerCase().includes(searchTerm) ||
      fragrance.Brand.toLowerCase().includes(searchTerm) ||
      fragrance.Vibe.toLowerCase().includes(searchTerm) ||
      fragrance['Main Accords'].toLowerCase().includes(searchTerm);

    return matchesRating && matchesTemperature && matchesSearch;
  });

  renderFragrances();
}

// Smooth scroll to fragrances
function scrollToFragrances() {
  document.getElementById('fragrances').scrollIntoView({ behavior: 'smooth' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadFragrances();
  
  document.getElementById('ratingFilter').addEventListener('change', applyFilters);
  document.getElementById('temperatureFilter').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  
  // Close modal when clicking outside
  document.getElementById('fragranceModal').addEventListener('click', (e) => {
    if (e.target.id === 'fragranceModal') {
      closeModal();
    }
  });
});
