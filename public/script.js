
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

// Make notes clickable
function makeNotesClickable(notesText) {
  if (!notesText) return '';
  
  return notesText.split(',').map(note => {
    const trimmedNote = note.trim();
    return `<span class="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded transition-colors" onclick="showRelatedProducts('${trimmedNote.replace(/'/g, "\\'")}', '${notesText.includes(trimmedNote) ? 'note' : 'accord'}')">${trimmedNote}</span>`;
  }).join(', ');
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
    card.className = 'lovable-card lovable-hover-lift cursor-pointer overflow-hidden';
    card.onclick = () => openModal(fragrance);

    const rating = generateStars(fragrance.Rating);
    const price = Math.floor(Math.random() * 200) + 50; // Random price for demo

    card.innerHTML = `
      <div class="p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-2">${fragrance.Name}</h3>
        <p class="text-sm text-gray-600 mb-2">${fragrance.Brand}</p>
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm">${rating}</span>
          <span class="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">$${price}</span>
        </div>
        <p class="text-sm text-gray-600 mb-4 leading-relaxed">${truncateText(fragrance.Vibe)}</p>
        <div class="flex flex-wrap gap-2 mb-6">
          ${fragrance['Main Accords'].split(',').slice(0, 3).map(accord => 
            `<span class="px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs rounded-full border border-blue-200">${accord.trim()}</span>`
          ).join('')}
        </div>
        <button class="w-full lovable-button-primary py-3">
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
  
  const rating = generateStars(fragrance.Rating);
  const price = Math.floor(Math.random() * 200) + 50;

  content.innerHTML = `
    <div class="flex justify-between items-start mb-8">
      <div>
        <h2 class="text-3xl font-bold lovable-text-gradient mb-3">${fragrance.Name}</h2>
        <p class="text-lg text-gray-600 mb-3">${fragrance.Brand}</p>
        <div class="flex items-center gap-6 mb-4">
          <span class="text-lg">${rating}</span>
          <span class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">$${price}</span>
        </div>
      </div>
      <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-3xl transition-colors">&times;</button>
    </div>

    <div class="space-y-8">
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Vibe:</h3>
        <p class="text-gray-700 leading-relaxed">${fragrance.Vibe}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white/50 rounded-xl p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-3">Top Notes:</h4>
          <div class="text-sm text-gray-600 leading-relaxed">${makeNotesClickable(fragrance['Top Notes'])}</div>
        </div>
        <div class="bg-white/50 rounded-xl p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-3">Heart Notes:</h4>
          <div class="text-sm text-gray-600 leading-relaxed">${makeNotesClickable(fragrance['Heart Notes'])}</div>
        </div>
        <div class="bg-white/50 rounded-xl p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-3">Base Notes:</h4>
          <div class="text-sm text-gray-600 leading-relaxed">${makeNotesClickable(fragrance['Base Notes'])}</div>
        </div>
      </div>

      <div>
        <h4 class="font-semibold text-gray-900 mb-4">Main Accords:</h4>
        <div class="flex flex-wrap gap-3">
          ${fragrance['Main Accords'].split(',').map(accord => 
            `<span class="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-sm rounded-xl border border-blue-200 font-medium">${accord.trim()}</span>`
          ).join('')}
        </div>
      </div>

      <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h4 class="font-semibold text-gray-900 mb-3">Color Association:</h4>
        <p class="text-gray-700 leading-relaxed">${fragrance['Color Association']}</p>
      </div>

      <div>
        <h4 class="font-semibold text-gray-900 mb-3">What It Smells Like:</h4>
        <p class="text-gray-700 leading-relaxed">${fragrance['Smells Like...']}</p>
      </div>

      <div>
        <h4 class="font-semibold text-gray-900 mb-3">Memory & Association:</h4>
        <p class="text-gray-700 leading-relaxed">${fragrance['Memory or Association']}</p>
      </div>

      <div class="flex gap-4 pt-8 border-t border-gray-200">
        <button class="flex-1 lovable-button-primary py-4 text-lg">
          Add to Cart - $${price}
        </button>
        <button class="lovable-button-secondary px-8">
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

// Show related products
function showRelatedProducts(searchTerm, type) {
  const relatedFragrances = fragrancesData.filter(fragrance => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      fragrance['Top Notes'].toLowerCase().includes(searchTermLower) ||
      fragrance['Heart Notes'].toLowerCase().includes(searchTermLower) ||
      fragrance['Base Notes'].toLowerCase().includes(searchTermLower) ||
      fragrance['Main Accords'].toLowerCase().includes(searchTermLower)
    );
  });

  openRelatedProductsModal(searchTerm, relatedFragrances, type);
}

// Open related products modal
function openRelatedProductsModal(searchTerm, relatedFragrances, type) {
  const modal = document.getElementById('relatedProductsModal');
  const content = document.getElementById('relatedModalContent');
  
  content.innerHTML = `
    <div class="flex justify-between items-start mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 mb-2">Fragrances with "${searchTerm}"</h2>
        <p class="text-slate-600">${relatedFragrances.length} fragrance${relatedFragrances.length !== 1 ? 's' : ''} found</p>
      </div>
      <button onclick="closeRelatedModal()" class="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
      ${relatedFragrances.map(fragrance => `
        <div class="bg-slate-50 rounded-lg p-4 cursor-pointer hover:bg-slate-100 transition-colors" onclick="closeRelatedModal(); openModal(${JSON.stringify(fragrance).replace(/"/g, '&quot;')})">
          <h3 class="font-semibold text-slate-900 mb-1">${fragrance.Name}</h3>
          <p class="text-sm text-slate-600 mb-2">${fragrance.Brand}</p>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs">${generateStars(fragrance.Rating)}</span>
          </div>
          <p class="text-xs text-slate-500 line-clamp-2">${truncateText(fragrance.Vibe, 100)}</p>
        </div>
      `).join('')}
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Close related products modal
function closeRelatedModal() {
  const modal = document.getElementById('relatedProductsModal');
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
  
  // Close related products modal when clicking outside
  document.getElementById('relatedProductsModal').addEventListener('click', (e) => {
    if (e.target.id === 'relatedProductsModal') {
      closeRelatedModal();
    }
  });
});
