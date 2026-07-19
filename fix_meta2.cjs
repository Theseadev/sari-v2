const fs = require('fs');
let content = fs.readFileSync('C:/laragon/www/sari-v2/src/controllers/books.ts', 'utf8');

const oldBlock = `            <div class="info">
              <h3>\${esc(b.title)}</h3>
              <p class="author">\${esc(b.author)}</p>
              <div class="meta">
                \${prodi ? \`<span>\${prodi}</span>\` : ""}
                <span>\${b.views} dilihat</span>
                \${b.page_count ? \`<span>\${b.page_count} hlm</span>\` : ""}
              </div>
            </div>`;

const newBlock = `            <div class="info">
              <h3>\${esc(b.title)}</h3>
              <p class="author">\${esc(b.author)}</p>
              <div class="meta">
                \${prodi ? \`<span class="meta-badge">\${prodi}</span>\` : ""}
                <span class="meta-stat"><span class="stat-icon">👁</span>\${b.views} dilihat</span>
                \${b.page_count ? \`<span class="meta-stat"><span class="stat-icon">📄</span>\${b.page_count} hlm</span>\` : ""}
              </div>
            </div>`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync('C:/laragon/www/sari-v2/src/controllers/books.ts', content);
    console.log('Done');
} else {
    console.log('Block not found');
}