/**
 * 补充缺失的复合索引，提升常用查询的性能
 */

const description = '添加复合索引：加速查重、释义去重、时间查询、高频词统计';

function up(db) {
  db.exec(`
    -- 加速 article_clicked_words 的查重操作（click-word 端点）
    CREATE INDEX IF NOT EXISTS idx_clicked_words_composite
      ON article_clicked_words(article_id, user_id, word);

    -- 加速 word_meanings 的释义去重检查（finish 端点）
    CREATE INDEX IF NOT EXISTS idx_word_meanings_vocab_article
      ON word_meanings(vocabulary_id, article_id);

    -- 加速 reading_sessions 的时间范围查询（stats 端点）
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_time
      ON reading_sessions(user_id, created_at);

    -- 加速 vocabulary 的高频词和状态过滤查询（vocabulary 列表、stats 端点）
    CREATE INDEX IF NOT EXISTS idx_vocabulary_status_click
      ON vocabulary(user_id, status, click_count);

    -- 加速 user_level_history 的时间查询（level-history 端点）
    CREATE INDEX IF NOT EXISTS idx_level_history_user_time
      ON user_level_history(user_id, assessed_at);

    -- 加速 articles 的完成状态查询（review-suggestions 端点）
    CREATE INDEX IF NOT EXISTS idx_articles_user_completed
      ON articles(user_id, is_completed);
  `);
}

function down(db) {
  db.exec(`
    DROP INDEX IF EXISTS idx_clicked_words_composite;
    DROP INDEX IF EXISTS idx_word_meanings_vocab_article;
    DROP INDEX IF EXISTS idx_reading_sessions_user_time;
    DROP INDEX IF EXISTS idx_vocabulary_status_click;
    DROP INDEX IF EXISTS idx_level_history_user_time;
    DROP INDEX IF EXISTS idx_articles_user_completed;
  `);
}

module.exports = { description, up, down };
