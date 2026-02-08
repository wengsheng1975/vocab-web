/**
 * 通用工具函数
 */

/**
 * 安全解析 JSON 字符串，失败时返回默认值
 * @param {string} str - 待解析的 JSON 字符串
 * @param {*} defaultValue - 解析失败时返回的默认值
 * @returns {*} 解析结果或默认值
 */
function safeJsonParse(str, defaultValue = []) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

module.exports = { safeJsonParse };
