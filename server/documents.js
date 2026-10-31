import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const MAX_SECTIONS = 20;

function isHeading(line) {
  const stripped = line.trim();
  const clean = stripped.replace(/^[#*\s]+/, '').replace(/[*_]+$/, '').trim();
  if (/^#{1,6}\s+/.test(stripped) || /^\*\*.+\*\*$/.test(stripped)) return clean;
  const titled = clean.length >= 4 && clean.length <= 100 && clean.split(/\s+/).length <= 10 && clean === titleCase(clean) && !/[.,;]$/.test(clean);
  return titled ? clean : null;
}

function titleCase(value) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

export function topicsFromText(text, filename, documentId) {
  const sections = [];
  let title = 'Overview';
  let lines = [];
  let page = null;

  const push = () => {
    const body = lines.join('\n').trim();
    if (body.length >= 80) sections.push({ title, body, page });
  };

  for (const line of text.split(/\r?\n/)) {
    const heading = isHeading(line);
    if (heading) {
      push();
      title = heading;
      lines = [];
      const pageMatch = /^Page (\d+)$/.exec(title);
      if (pageMatch) page = Number(pageMatch[1]);
    } else {
      lines.push(line);
    }
  }
  push();

  let usable = sections;
  if (usable.length === 0) {
    usable = text
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 120)
      .slice(0, 8)
      .map((body, index) => ({ title: `Section ${index + 1}`, body, page: null }));
  }

  return usable.slice(0, MAX_SECTIONS).map((section, index) => {
    const excerpt = section.body.slice(0, 7000);
    const sentences = excerpt.split(/(?<=[.!?])\s+/).slice(0, 6).map((sentence) => sentence.slice(0, 450));
    return {
      id: `${documentId}-${index}`,
      name: section.title,
      subtopics: [],
      document_id: documentId,
      source: { document: filename, section: section.title, page: section.page },
      versions: {
        tier1: `## ${section.title} — Simplified\n\nKey points from ${filename}:\n\n${sentences.join('\n\n')}`,
        tier3: `## ${section.title} — Standard\n\n${excerpt}`,
        tier5: `## ${section.title} — Expert\n\nCompare the claims, assumptions, and evidence in this section.\n\n${excerpt}\n\n### Check your understanding\n- Which claim in this section is best supported by the source? Explain using its wording.`,
      },
    };
  });
}

export async function textFromUpload(filename, buffer) {
  const suffix = (filename.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  if (suffix === '.txt') return buffer.toString('utf8');
  if (suffix !== '.pdf') {
    const error = new Error('Upload a PDF or TXT file.');
    error.status = 415;
    throw error;
  }
  if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    const error = new Error('This file is not a valid PDF.');
    error.status = 400;
    throw error;
  }
  try {
    const parsed = await pdfParse(buffer);
    const pages = parsed.text || '';
    return pages;
  } catch (cause) {
    const error = new Error(`Could not read this PDF: ${cause.message}`);
    error.status = 400;
    throw error;
  }
}
