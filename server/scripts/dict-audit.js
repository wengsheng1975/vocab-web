#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');

const { DICT, lookupDict } = require('../src/utils/cetDictionary');
const { CET4_WORDS, CET6_ALL, getWordCETLevel, getWordMorphInfo } = require('../src/utils/cetWords');

function buildCoverageReport() {
  const dictWords = new Set(Object.keys(DICT));
  const cetAll = new Set([...CET4_WORDS, ...CET6_ALL]);

  const missingCetWords = [...cetAll].filter((w) => !dictWords.has(w)).sort();

  return {
    dictSize: dictWords.size,
    cetSize: cetAll.size,
    missingCetCount: missingCetWords.length,
    coveragePct: Number((((cetAll.size - missingCetWords.length) / cetAll.size) * 100).toFixed(2)),
    missingCetWords,
  };
}

function buildVocabGapReport() {
  const dbPath = path.resolve(__dirname, '../src/config/db.js');
  if (!fs.existsSync(dbPath)) {
    return { exists: false, inScopeMissing: [] };
  }

  let db;
  try {
    db = require('../src/config/db');
  } catch {
    return { exists: false, inScopeMissing: [] };
  }

  const rows = db.prepare('SELECT DISTINCT lower(word) AS word FROM vocabulary ORDER BY word').all();
  const inScopeMissing = [];

  for (const row of rows) {
    const word = String(row.word || '').trim();
    if (!word) continue;

    const morph = getWordMorphInfo(word);
    const lemma = String(morph.lemma || '').toLowerCase().trim();
    const level = getWordCETLevel(word);
    const hasMeaningSource = Boolean(
      DICT[word] || (lemma && DICT[lemma]) || lookupDict(word)
    );

    if (!hasMeaningSource && level !== 'beyond') {
      inScopeMissing.push({
        word,
        level,
        lemma: lemma || null,
        form: morph.form || null,
      });
    }
  }

  return { exists: true, inScopeMissing };
}

function main() {
  const jsonMode = process.argv.includes('--json');
  const coverage = buildCoverageReport();
  const vocabGaps = buildVocabGapReport();

  const report = {
    generatedAt: new Date().toISOString(),
    coverage,
    vocabGaps,
  };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('=== 词典覆盖审计 ===');
  console.log(`词典词条数: ${coverage.dictSize}`);
  console.log(`CET词表总数: ${coverage.cetSize}`);
  console.log(`CET覆盖率: ${coverage.coveragePct}%`);
  console.log(`CET缺失词数: ${coverage.missingCetCount}`);
  console.log(`缺失词示例: ${coverage.missingCetWords.slice(0, 30).join(', ')}`);

  if (vocabGaps.exists) {
    console.log('\n=== 当前生词本缺口（纲内且无释义来源）===');
    console.log(`缺口数量: ${vocabGaps.inScopeMissing.length}`);
    if (vocabGaps.inScopeMissing.length > 0) {
      vocabGaps.inScopeMissing.slice(0, 50).forEach((item) => {
        console.log(`- ${item.word} [${item.level}] lemma=${item.lemma || '-'} form=${item.form || '-'}`);
      });
    }
  } else {
    console.log('\n未检测到本地数据库，跳过生词本缺口审计。');
  }
}

main();
