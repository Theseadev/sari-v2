const fs = require('fs');
let content = fs.readFileSync('C:/laragon/www/sari-v2/src/controllers/books.ts', 'utf8');

const idx = content.indexOf('const badge =');
if (idx < 0) {
    console.log('const badge not found');
    process.exit(1);
}

// Find the end of this block - look for the closing backtick and semicolon after the bookCards
const endIdx = content.indexOf('`;\n\t\t}', idx);
if (endIdx < 0) {
    console.log('end of block not found');
    process.exit(1);
}

const oldBlock = content.substring(idx, endIdx + 4);

const newBlock = `			const cover = b.cover_image
				? \`<img src="/uploads/covers/${esc(b.cover_image)}" alt="${esc(b.title)}" loading="lazy">\`
				: '<div class="cover-placeholder">—</div>';
			const badge =
				b.access_type === "internal"
					? '<span class="access-badge internal">INTERNAL</span>'
					: '<span class="access-badge public">PUBLIC</span>';
			const viewsBadge = '<span class="views-badge"><span class="view-icon">👁</span>' + b.views + '</span>';
			const prodi = b.program_name
				? '<span>' + esc(b.program_name) + '</span>'
				: "";
			bookCards += `
        <div class="book-card">
          <a href="/buku/" + esc(b.slug) + ">
            <div class="cover-wrap">
              " + cover + "
              " + badge + "
              " + viewsBadge + "
            </div>
            <div class="info">
              <h3>" + esc(b.title) + "</h3>
              <p class="author">" + esc(b.author) + "</p>
              <div class="meta">
                " + (prodi ? '<span class="meta-badge">' + prodi + '</span>' : "") + "
                <span class="meta-stat"><span class="stat-icon">📄</span>" + b.page_count + " hlm</span>
              </div>
            </div>
          </a>
        </div>`;`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync('C:/laragon/www/sari-v2/src/controllers/books.ts', content);
    console.log('Done');
} else {
    console.log('Block not found exactly, showing oldBlock:');
    console.log(oldBlock);
}